// server-only execution; avoid importing heavy deps on the client
import 'server-only';

/**
 * Simple invitation email system.
 * - Development: Logs invite links to console (no email sent)
 * - Production: Can be configured with Supabase Edge Functions or webhooks
 */

type SendResult =
  | { sent: true; id?: string }
  | { skipped: true; reason: string }
  | { error: true; message: string; cause?: unknown };

export async function sendInvitationEmail(params: { to: string; inviteUrl: string; role: string; tenantName?: string }): Promise<SendResult> {
  const { to, inviteUrl, role, tenantName } = params;
  
  // For development: just log the invite details
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n📧 =================================');
    console.log('📧 INVITATION EMAIL (Development)');
    console.log('📧 =================================');
    console.log(`📧 To: ${to}`);
    console.log(`📧 Role: ${role}`);
    console.log(`📧 Tenant: ${tenantName || 'BizTool'}`);
    console.log(`📧 Invite Link: ${inviteUrl}`);
    console.log('📧 =================================\n');
    
    return { 
      skipped: true, 
      reason: 'Development mode - invite link logged to console' 
    };
  }
  
  // Production: You can implement actual email sending here
  // Options:
  // 1. Supabase Edge Function that calls your email service
  // 2. Webhook to your email provider
  // 3. Direct SMTP if configured in Supabase
  
  try {
    // TODO: Add production email implementation
    // For now, return skipped in production too
    console.log(`📧 Production invite needed for ${to}: ${inviteUrl}`);
    return { 
      skipped: true, 
      reason: 'Production email not yet configured - check server logs for invite link' 
    };
    
  } catch (e: unknown) {
    console.error('[invite-email] Email send failure:', e);
    const msg = typeof e === 'object' && e && 'message' in e ? String((e as { message?: unknown }).message) : 'Unknown send error';
    return { error: true, message: msg, cause: e };
  }
}

// Simple helper for callers that want a boolean only
export async function trySendInvitationEmail(p: Parameters<typeof sendInvitationEmail>[0]): Promise<boolean> {
  const r = await sendInvitationEmail(p);
  return 'sent' in r && (r as { sent?: boolean }).sent === true;
}
