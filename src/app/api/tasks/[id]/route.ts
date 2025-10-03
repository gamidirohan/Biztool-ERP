import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

type TaskUpdateFields = {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string | null;
  sort_order?: number;
  completed_at?: string | null;
};

// GET /api/tasks/[id] - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        id,
        tenant_id,
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
      .eq('id', id)
      .single();

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user can access this task
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    const isAdmin = ['owner', 'admin', 'manager'].includes(profile?.role || '');
    const isAssignedUser = task.assigned_to === user.id;
    const isSameTenant = profile?.tenant_id === task.tenant_id;

    if (!isSameTenant || (!isAdmin && !isAssignedUser)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Task API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/tasks/[id] - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, priority, status, due_date, sort_order } = body as {
      title?: string;
      description?: string;
      priority?: TaskPriority;
      status?: TaskStatus;
      due_date?: string | null;
      sort_order?: number;
    };

    // Get current task to check permissions
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('assigned_to, tenant_id, status')
      .eq('id', id)
      .single();

    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get user profile and role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    const isAdmin = ['owner', 'admin', 'manager'].includes(profile?.role || '');
    const isAssignedUser = currentTask.assigned_to === user.id;
    const isSameTenant = profile?.tenant_id === currentTask.tenant_id;

    if (!isSameTenant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Prepare update data
  const updateData: TaskUpdateFields = {};
  if (title !== undefined) updateData.title = title.trim();
  if (description !== undefined) updateData.description = description?.trim() ?? null;
  if (priority !== undefined) updateData.priority = priority;
  if (due_date !== undefined) updateData.due_date = due_date;
  if (sort_order !== undefined) updateData.sort_order = sort_order;

    // Handle status changes
    if (status !== undefined) {
      // Only assigned user can change status to completed/in_progress
      // Admins can change any status
      if (!isAdmin && !isAssignedUser && status !== currentTask.status) {
        return NextResponse.json({ error: 'Cannot change task status' }, { status: 403 });
      }

      updateData.status = status;

      // Set completed_at when status changes to completed
      if (status === 'completed' && currentTask.status !== 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status !== 'completed' && currentTask.status === 'completed') {
        updateData.completed_at = null;
      }
    }

    // If no fields to update, return current task
    if (Object.keys(updateData).length === 0) {
      return await GET(request, { params: Promise.resolve({ id }) });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
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
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Task API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current task to check permissions
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('tenant_id')
      .eq('id', id)
      .single();

    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get user profile and role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    const isAdmin = ['owner', 'admin', 'manager'].includes(profile?.role || '');
    const isSameTenant = profile?.tenant_id === currentTask.tenant_id;

    if (!isSameTenant || !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}