import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });
    const supabase = await createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Load invite (reuse RLS token header trick)
    // @ts-expect-error override fetch for header injection
    supabase.rest.fetch = (input: RequestInfo, init?: RequestInit) => {
      const h = new Headers(init?.headers);
      h.set('x-invite-token', token);
      return fetch(input, { ...init, headers: h });
    };

    const { data: invite, error } = await supabase
      .from('tenant_invitations')
      .select('*')
      .eq('token', token)
      .maybeSingle();
    if (error || !invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 400 });
    if (invite.accepted_at) return NextResponse.json({ error: 'Already accepted' }, { status: 409 });
    if (invite.canceled_at) return NextResponse.json({ error: 'Canceled' }, { status: 410 });
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

    await supabase
      .from('tenant_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = typeof e === 'object' && e && 'message' in e ? String((e as { message?: unknown }).message) : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
