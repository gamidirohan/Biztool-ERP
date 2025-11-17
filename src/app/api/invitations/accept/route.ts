import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });
    const supabase = await createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Load invite (try regular, then service role to avoid RLS issues)
    const { data: inviteReg, error: inviteErr } = await supabase
      .from('tenant_invitations')
      .select('*')
      .eq('token', token)
      .maybeSingle();
    let invite = inviteReg as (null | {
      id: string;
      tenant_id: string;
      email: string;
      role: string;
      expires_at: string;
    });
    let error = inviteErr as { message?: string } | null;
    if (!invite) {
      const admin = createServiceRoleClient();
      const { data: inv2, error: e2 } = await admin
        .from('tenant_invitations')
        .select('*')
        .eq('token', token)
        .maybeSingle();
      invite = inv2 as typeof invite;
      error = e2 as typeof error;
    }
    if (error || !invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 400 });
    // If schema lacks accepted/canceled fields, rely on presence and expiry only
    if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Expired' }, { status: 410 });
    if (invite.email.toLowerCase() !== (user.email || '').toLowerCase()) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 400 });
    }

    // Create tenant membership (this is the primary source of truth)
    const { error: memErr } = await supabase.from('tenant_memberships').upsert({
      tenant_id: invite.tenant_id,
      user_id: user.id,
      role: invite.role,
    }, {
      onConflict: 'tenant_id,user_id'
    });
    if (memErr) {
      console.error('Failed to create tenant membership:', memErr);
      return NextResponse.json({ error: memErr.message }, { status: 400 });
    }

    // Try to update user_profiles if it exists, but don't fail if it doesn't (RLS protection)
    // This is optional since tenant_memberships is the source of truth
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (existingProfile) {
      await supabase
        .from('user_profiles')
        .update({
          tenant_id: invite.tenant_id,
          role: invite.role,
        })
        .eq('id', user.id);
    }

    // Create employee record if role is employee (needed for attendance, payroll, etc.)
    if (invite.role === 'employee') {
      const { data: existingEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('tenant_id', invite.tenant_id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!existingEmployee) {
        // Get user metadata for name
        const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Employee';
        
        await supabase
          .from('employees')
          .insert({
            tenant_id: invite.tenant_id,
            user_id: user.id,
            name: userName,
            email: user.email,
          });
      }
    }

    // Best-effort mark accepted if column exists; otherwise delete invite to prevent reuse
    const admin = createServiceRoleClient();
    await admin
      .from('tenant_invitations')
      .delete()
      .eq('id', invite.id);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = typeof e === 'object' && e && 'message' in e ? String((e as { message?: unknown }).message) : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
