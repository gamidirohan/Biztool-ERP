import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AcceptButton } from './AcceptButton';

interface InviteMeta {
  email: string;
  role: string;
  tenantId: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired' | 'canceled';
  tenantName?: string;
}

async function getInvite(token: string): Promise<InviteMeta | null> {
  try {
    const res = await fetch(`${process.env.APP_ORIGIN || 'http://localhost:3000'}/api/invitations/${token}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getInvite(token);
  const supabase = await createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="text-xl font-semibold">Invitation Not Found</h1>
          <p className="text-sm text-[color:var(--foreground)]/60">This invitation token is invalid or has been removed.</p>
          <Link href="/" className="text-[color:var(--primary)] underline text-sm">Return home</Link>
        </div>
      </div>
    );
  }

  if (invite.status === 'accepted') {
    return redirect('/login?message=Invitation already accepted');
  }
  if (invite.status === 'expired' || invite.status === 'canceled') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="text-xl font-semibold">Invitation {invite.status === 'expired' ? 'Expired' : 'Canceled'}</h1>
          <p className="text-sm text-[color:var(--foreground)]/60">Ask an administrator to resend a new invitation.</p>
          <Link href="/" className="text-[color:var(--primary)] underline text-sm">Return home</Link>
        </div>
      </div>
    );
  }

  const emailMismatch = user && user.email && user.email.toLowerCase() !== invite.email.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)]/80 backdrop-blur p-6">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">You are invited</h1>
          <p className="text-sm text-[color:var(--foreground)]/70">
            Email <span className="font-medium">{invite.email}</span> invited as <span className="font-medium">{invite.role}</span>
            {invite.tenantName ? <> to <span className="font-medium">{invite.tenantName}</span></> : null}.
          </p>
        </div>
        {!user && (
          <div className="space-y-3 text-sm">
            <p>To continue, sign in (or sign up) using the invited email.</p>
            <div className="flex gap-3">
              <Link href={`/login?next=/invite/${token}`} className="flex-1 text-center rounded-md px-4 py-2 bg-[color:var(--primary)] text-white text-sm font-medium">Sign in</Link>
              <Link href={`/register?token=${token}&prefillEmail=${encodeURIComponent(invite.email)}&next=/invite/${token}`} className="flex-1 text-center rounded-md px-4 py-2 border border-[color:var(--card-border)] text-[color:var(--foreground)] text-sm font-medium">Sign up</Link>
            </div>
          </div>
        )}
        {user && emailMismatch && (
          <div className="space-y-3 text-sm text-red-600 dark:text-red-400">
            <p>You are signed in as {user.email}. This invite is for {invite.email}. Please sign out and sign back in with the invited email.</p>
            <Link href={`/login?signout=1&next=/invite/${token}`} className="underline text-[color:var(--primary)]">Switch account</Link>
          </div>
        )}
        {user && !emailMismatch && (
          <AcceptButton token={token} />
        )}
        <div className="text-[10px] text-[color:var(--foreground)]/40 text-center">Expires {new Date(invite.expiresAt).toLocaleString()}</div>
      </div>
    </div>
  );
}

