import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { randomBytes } from 'crypto';
import { sendInvitationEmail } from '@/lib/email/invitations';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const supabase = await createClient(cookies());
    const body = await req.json();
    const { email, role = 'employee', tenantId } = body ?? {};

    if (process.env.NODE_ENV !== 'production') {
      console.log('[invite] Request body:', { email: email ? '***@***' : undefined, role, tenantId });
    }

    if (!email || !tenantId) {
      console.error('[invite] Missing required fields:', { hasEmail: !!email, hasTenantId: !!tenantId });
      return NextResponse.json({ error: 'email and tenantId required' }, { status: 400 });
    }
    if (!['employee','manager','admin'].includes(role)) {
      console.error('[invite] Invalid role:', role);
      return NextResponse.json({ error: 'invalid role' }, { status: 400 });
    }

    // Auth user
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check inviter privilege (prefer membership; also fetch profile for diagnostics)
      // Fetch only the caller's profile; use it for tenant/role check to avoid recursive RLS on tenant_memberships
      const { data: profile, error: profErr } = await supabase
        .from('user_profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .maybeSingle();

      if (profErr) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[invite] profile lookup error:', profErr.message);
        }
        return NextResponse.json({ error: 'Forbidden', code: 'profile_check_failed' }, { status: 403 });
      }
      if (!profile) {
        return NextResponse.json({ error: 'Forbidden', code: 'no_profile' }, { status: 403 });
      }
      if (profile.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Forbidden', code: 'tenant_mismatch', profileTenantId: profile.tenant_id, requestTenantId: tenantId }, { status: 403 });
      }
      if (!['owner','manager','admin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden', code: 'insufficient_role', role: profile.role }, { status: 403 });
      }

    const token = randomBytes(24).toString('base64url');
    const normalizedEmail = String(email).toLowerCase();

    const { data: tenantData } = await supabase.from('tenants').select('name').eq('id', tenantId).single();

    // Check if service role is available for fallback
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('[invite] Service role available:', hasServiceRole);
    
    // Try regular insert first, fallback to service role if RLS blocks
    let insertError = null;
    let { error } = await supabase.from('tenant_invitations').insert({
      tenant_id: tenantId,
      email: normalizedEmail,
      role,
      token,
      created_by: user.id
    });
    
    insertError = error;
    
    // If RLS recursion blocks the insert, try with service role (bypasses RLS)
    if (insertError?.message?.includes('infinite recursion')) {
      console.log('[invite] RLS recursion detected, attempting service role fallback');
      
      if (hasServiceRole) {
        try {
          const adminClient = createServiceRoleClient();
          console.log('[invite] Using service role client for insert');
          const { error: adminError } = await adminClient.from('tenant_invitations').insert({
            tenant_id: tenantId,
            email: normalizedEmail,
            role,
            token,
            created_by: user.id
          });
          
          if (adminError) {
            console.error('[invite] Service role insert also failed:', adminError);
            insertError = adminError;
          } else {
            console.log('[invite] Service role insert succeeded');
            insertError = null; // Clear the error since service role worked
          }
        } catch (e) {
          console.error('[invite] Service role fallback failed:', e);
        }
      } else {
        console.error('[invite] No service role key available for fallback');
      }
    }
    
    if (insertError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[invite] Insert error:', insertError.message, insertError.details, insertError.hint);
      }
      const conflict = insertError.message.toLowerCase().includes('duplicate') ? 409 : 400;
      return NextResponse.json({ error: insertError.message }, { status: conflict });
    }

    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || process.env.APP_ORIGIN || 'http://localhost:3000';
    console.log('[invite] Using origin:', origin);
    const inviteUrl = `${origin}/invite/${token}`;

    // Send email and get result
    const emailResult = await sendInvitationEmail({ to: normalizedEmail, inviteUrl, role, tenantName: tenantData?.name });
    
    let emailStatus = { emailed: false, emailError: null as string | null };
    if ('sent' in emailResult && emailResult.sent) {
      emailStatus.emailed = true;
    } else if ('skipped' in emailResult) {
      emailStatus.emailError = emailResult.reason;
      console.log('[invite] Email skipped:', emailResult.reason);
    } else if ('error' in emailResult) {
      emailStatus.emailError = emailResult.message;
      console.error('[invite] Email error:', emailResult.message);
    }

    return NextResponse.json({ 
      ok: true, 
      inviteUrl, 
      emailed: emailStatus.emailed,
      emailError: emailStatus.emailError 
    });
  } catch (e: unknown) {
    const msg = typeof e === 'object' && e && 'message' in e ? String((e as { message?: unknown }).message) : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
