'use client';

import { useState, useTransition } from 'react';

export function AcceptButton({ token }: { token: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    setErr(null);
    setState('loading');
    startTransition(async () => {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data.error || 'Failed');
        setState('error');
        return;
      }
      setState('done');
      setTimeout(() => { window.location.href = '/dashboard'; }, 600);
    });
  };

  return (
    <div className="space-y-3">
      <button
        disabled={state === 'loading' || isPending || state === 'done'}
        onClick={handleAccept}
        className="w-full h-10 rounded-md bg-[color:var(--primary)] text-white text-sm font-medium disabled:opacity-60"
      >
        {state === 'done' ? 'Joined ✓' : state === 'loading' || isPending ? 'Joining…' : 'Join Tenant'}
      </button>
      {err && <div className="text-xs text-red-600 dark:text-red-400">{err}</div>}
    </div>
  );
}
