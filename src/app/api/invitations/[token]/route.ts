import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

// GET invitation metadata by token (anonymous allowed)
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });
  
  try {
    console.log('[invite-get] Looking up token:', token);
    
    // Try regular client first
    const supabase = await createClient(cookies());
    let { data, error } = await supabase
      .from('tenant_invitations')
      .select('email, role, tenant_id, expires_at')
      .eq('token', token)
      .maybeSingle();

    // If RLS blocks access, try service role client (for token-based public access)
    if (error || !data) {
      console.log('[invite-get] Regular client failed, trying service role:', error?.message);
      
      try {
        const adminClient = createServiceRoleClient();
        const result = await adminClient
          .from('tenant_invitations')
          .select('email, role, tenant_id, expires_at')
          .eq('token', token)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
        
        if (data) {
          console.log('[invite-get] Service role succeeded');
          // Best-effort fetch tenant name for UX
          try {
            const { data: t } = await adminClient
              .from('tenants')
              .select('name')
              .eq('id', data.tenant_id)
              .single();
            // @ts-expect-error augmenting for response
            data.tenant_name = t?.name ?? null;
          } catch {}
        }
      } catch (adminError) {
        console.error('[invite-get] Service role also failed:', adminError);
      }
    }

    if (error || !data) {
      console.log('[invite-get] Invitation not found');
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Determine status based on expires_at (simple pending/expired logic)
    const now = new Date();
    let status = 'pending'; // Default to pending since we only query valid invitations
    
    // Check if expired based on expires_at
    if (data.expires_at && new Date(data.expires_at) < now) {
      status = 'expired';
    }
    
    console.log('[invite-get] Found invitation with status:', status);

    return NextResponse.json({
      email: data.email,
      role: data.role,
      tenantId: data.tenant_id,
      tenantName: (data as any).tenant_name ?? undefined,
      expiresAt: data.expires_at,
      status
    });

  } catch (e: unknown) {
    console.error('[invite-get] Error:', e);
    const msg = typeof e === 'object' && e && 'message' in e ? String((e as { message?: unknown }).message) : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
