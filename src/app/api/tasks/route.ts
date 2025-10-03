import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

// GET /api/tasks - List tasks for current user or all tasks for admin
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile and role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
    }

    const isAdmin = ['owner', 'admin', 'manager'].includes(profile.role);

    let query = supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        priority,
        status,
        due_date,
        completed_at,
        sort_order,
        is_daily_task,
        created_at,
        updated_at,
        assigned_to,
        assigned_by,
        assigned_user:user_profiles!tasks_assigned_to_fkey(first_name, last_name),
        assigned_by_user:user_profiles!tasks_assigned_by_fkey(first_name, last_name)
      `)
      .eq('tenant_id', profile.tenant_id);

    // If not admin, only show tasks assigned to current user
    if (!isAdmin) {
      query = query.eq('assigned_to', user.id);
    }

    // Filter for daily tasks by default
    const { searchParams } = new URL(request.url);
    const dailyOnly = searchParams.get('daily_only') !== 'false';
    if (dailyOnly) {
      query = query.eq('is_daily_task', true);
    }

    // Filter by status if provided
    const status = searchParams.get('status');
    if (status) {
      query = query.eq('status', status);
    }

    // Order by sort_order, then by created_at
    const { data: tasks, error } = await query
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    return NextResponse.json({ tasks: tasks || [] });
  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile and role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
    }

    const isAdmin = ['owner', 'admin', 'manager'].includes(profile.role);

    const body = await request.json();
    const { title, description, assigned_to, priority = 'medium', due_date, is_daily_task = true } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // If not admin, can only assign tasks to themselves
    const finalAssignedTo = isAdmin ? assigned_to : user.id;

    if (!finalAssignedTo) {
      return NextResponse.json({ error: 'Assigned user is required' }, { status: 400 });
    }

    // Verify the assigned user exists in the same tenant
    const { data: assignedUser } = await supabase
      .from('user_profiles')
      .select('id, tenant_id')
      .eq('id', finalAssignedTo)
      .single();

    if (!assignedUser || assignedUser.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Invalid assigned user' }, { status: 400 });
    }

    // Get the next sort order
    const { data: maxSortOrder } = await supabase
      .from('tasks')
      .select('sort_order')
      .eq('tenant_id', profile.tenant_id)
      .eq('assigned_to', finalAssignedTo)
      .eq('is_daily_task', is_daily_task)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = (maxSortOrder?.[0]?.sort_order || 0) + 1;

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        tenant_id: profile.tenant_id,
        title: title.trim(),
        description: description?.trim(),
        assigned_to: finalAssignedTo,
        assigned_by: user.id,
        priority,
        due_date,
        is_daily_task,
        sort_order: nextSortOrder
      })
      .select(`
        id,
        title,
        description,
        priority,
        status,
        due_date,
        sort_order,
        is_daily_task,
        created_at,
        assigned_to,
        assigned_by,
        assigned_user:user_profiles!tasks_assigned_to_fkey(first_name, last_name),
        assigned_by_user:user_profiles!tasks_assigned_by_fkey(first_name, last_name)
      `)
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}