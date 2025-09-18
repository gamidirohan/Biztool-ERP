import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';
import { sendInvitationEmail } from '@/lib/email/invitations';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const supabase = await createClient(cookies());
    const body = await req.json();
    const { email, role = 'employee', tenantId } = body ?? {};

    if (!email || !tenantId) {
      return NextResponse.json({ error: 'email and tenantId required' }, { status: 400 });
    }
    if (!['employee','manager','admin'].includes(role)) {
      return NextResponse.json({ error: 'invalid role' }, { status: 400 });
    }

    // Auth user
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check inviter privilege
    const { data: membership, error: memErr } = await supabase
      .from('tenant_memberships')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single();
    if (memErr || !membership || !['owner','manager','admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const token = randomBytes(24).toString('base64url');
    const normalizedEmail = String(email).toLowerCase();

    const { data: tenantData } = await supabase.from('tenants').select('name').eq('id', tenantId).single();

    const { error: insertError } = await supabase.from('tenant_invitations').insert({
      tenant_id: tenantId,
      email: normalizedEmail,
      role,
      token,
      created_by: user.id
    });
    if (insertError) {
      const conflict = insertError.message.toLowerCase().includes('duplicate') ? 409 : 400;
      return NextResponse.json({ error: insertError.message }, { status: conflict });
    }

  const origin = req.headers.get('origin') || process.env.APP_ORIGIN || 'http://localhost:3000';
    const inviteUrl = `${origin}/invite/${token}`;

    // Fire and forget email (do not block response on failure)
    sendInvitationEmail({ to: normalizedEmail, inviteUrl, role, tenantName: tenantData?.name }).catch(() => {
      console.error('Failed sending invitation email');
    });

    return NextResponse.json({ ok: true, inviteUrl, emailed: true });
  } catch (e: unknown) {
    const msg = typeof e === 'object' && e && 'message' in e ? String((e as { message?: unknown }).message) : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
