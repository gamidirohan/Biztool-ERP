// server-only execution; avoid importing heavy deps on the client
import 'server-only';

/**
 * Lightweight, resilient invitation email sender.
 * - Dynamically imports 'resend' only when needed (reduces bundle impact, avoids edge runtime issues if unsupported)
 * - Gracefully no-ops if API key missing
 * - Returns a discriminated result for easier caller handling
 */

const resendApiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.INVITE_EMAIL_FROM || 'BizTool <no-reply@biztool.example>';

type SendResult =
  | { sent: true; id?: string }
  | { skipped: true; reason: string }
  | { error: true; message: string; cause?: unknown };

// Narrower typing: minimal surface we rely on
interface ResendLike {
  emails: {
    send(args: {
      from: string;
      to: string[];
      subject: string;
      text: string;
      html: string;
    }): Promise<{ data?: { id?: string }; error?: { message: string } }>; // shape based on resend docs
  };
}

let _resendClient: ResendLike | null = null;

async function getClient(): Promise<ResendLike | null> {
  if (!resendApiKey) return null;
  if (_resendClient) return _resendClient;
  try {
    // Use eval('import') to avoid build-time resolution when dependency isn't installed
    const mod = await (eval('import')('resend')) as { Resend: new (apiKey: string) => ResendLike };
    const Resend = mod.Resend;
    _resendClient = new Resend(resendApiKey);
    return _resendClient;
  } catch (e) {
    console.warn('[invite-email] Failed dynamic import of resend:', e);
    return null;
  }
}

function buildSubject(role: string, tenantName?: string) {
  return `You're invited to ${tenantName || 'a BizTool tenant'} as ${role}`;
}

function buildPlain(role: string, tenantName: string | undefined, inviteUrl: string) {
  return `You've been invited as ${role} to ${tenantName || 'a BizTool tenant'}.
Click the link to join: ${inviteUrl}
If you did not expect this email, you can ignore it.`;
}

function buildHtml(role: string, tenantName: string | undefined, inviteUrl: string) {
  return `<!doctype html><html><body style="font-family:system-ui,Arial,sans-serif;background:#f6f7f9;padding:32px;color:#111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
    <tr><td style="text-align:center;padding-bottom:12px;">
      <h1 style="margin:0;font-size:20px;">You're invited</h1>
    </td></tr>
    <tr><td style="font-size:14px;line-height:1.5;padding-bottom:16px;">
      <p style="margin:0 0 12px;">You have been invited as <strong>${role}</strong> to <strong>${tenantName || 'a BizTool tenant'}</strong>.</p>
      <p style="margin:0 0 16px;">Click the secure link below to accept and join.</p>
      <p style="margin:0 0 24px;"><a href="${inviteUrl}" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;display:inline-block;font-size:14px;">Join Tenant</a></p>
      <p style="margin:0;font-size:12px;color:#555;">If you did not expect this email you can safely ignore it.</p>
    </td></tr>
  </table>
  <p style="text-align:center;font-size:11px;margin-top:18px;color:#6b7280;">© ${new Date().getFullYear()} BizTool</p>
</body></html>`;
}

export async function sendInvitationEmail(params: { to: string; inviteUrl: string; role: string; tenantName?: string }): Promise<SendResult> {
  const { to, inviteUrl, role, tenantName } = params;
  if (!resendApiKey) {
    return { skipped: true, reason: 'RESEND_API_KEY not set' };
  }
  const client = await getClient();
  if (!client) {
    return { skipped: true, reason: 'Resend client unavailable (import failed)' };
  }
  try {
    const subject = buildSubject(role, tenantName);
    const text = buildPlain(role, tenantName, inviteUrl);
    const html = buildHtml(role, tenantName, inviteUrl);

    const { data, error } = await client.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      text,
      html
    });

    if (error) {
      return { error: true, message: error.message };
    }

    return { sent: true, id: data?.id };
  } catch (e: unknown) {
    console.error('[invite-email] send failure', e);
    const msg = typeof e === 'object' && e && 'message' in e ? String((e as { message?: unknown }).message) : 'Unknown send error';
    return { error: true, message: msg, cause: e };
  }
}

// Simple helper for callers that want a boolean only
export async function trySendInvitationEmail(p: Parameters<typeof sendInvitationEmail>[0]): Promise<boolean> {
  const r = await sendInvitationEmail(p);
  return 'sent' in r && (r as { sent?: boolean }).sent === true;
}
