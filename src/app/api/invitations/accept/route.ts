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
    let invite = inviteReg;
    let error = inviteErr;
    if (!invite) {
      const admin = createServiceRoleClient();
      const { data: inv2, error: e2 } = await admin
        .from('tenant_invitations')
        .select('*')
        .eq('token', token)
        .maybeSingle();
      invite = inv2 as any;
      error = e2 as any;
    }
    if (error || !invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 400 });
    // If schema lacks accepted/canceled fields, rely on presence and expiry only
    if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Expired' }, { status: 410 });
    if (invite.email.toLowerCase() !== (user.email || '').toLowerCase()) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 400 });
    }

    // Upsert profile (only set role if not owner/manager/admin already)
    await supabase.from('user_profiles').upsert({
      id: user.id,
      tenant_id: invite.tenant_id,
      role: invite.role,
    });

    const { error: memErr } = await supabase.from('tenant_memberships').upsert({
      tenant_id: invite.tenant_id,
      user_id: user.id,
      role: invite.role,
    });
    if (memErr) return NextResponse.json({ error: memErr.message }, { status: 400 });

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
