import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

// GET invitation metadata by token (anonymous allowed via RLS token policy)
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });
  try {
    const supabase = await createClient(cookies());
    // Pass token to Postgres via custom header RLS policy (we added in SQL: x-invite-token)
    // @ts-expect-error injecting header context supported via global fetch inside supabase-js on server (SSR)
    supabase.rest.fetch = (input: RequestInfo, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      headers.set('x-invite-token', token);
      return fetch(input, { ...init, headers });
    };

    const { data, error } = await supabase
      .from('tenant_invitations')
      .select('email, role, tenant_id, expires_at, accepted_at, canceled_at')
      .eq('token', token)
      .maybeSingle();
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const status = data.accepted_at ? 'accepted' : (data.canceled_at ? 'canceled' : (new Date(data.expires_at) < new Date() ? 'expired' : 'pending'));
    return NextResponse.json({
      email: data.email,
      role: data.role,
      tenantId: data.tenant_id,
      expiresAt: data.expires_at,
      status
    });
  } catch (e: unknown) {
    const msg = typeof e === 'object' && e && 'message' in e ? String((e as { message?: unknown }).message) : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
