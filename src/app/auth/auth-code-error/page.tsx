export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-4">
        <h1 className="text-xl font-semibold">Authentication Error</h1>
        <p className="text-sm text-[color:var(--foreground)]/60">
          We couldn&apos;t complete the authentication. The link may be invalid or expired.
        </p>
        <a href="/login" className="text-[color:var(--primary)] underline text-sm">Return to sign in</a>
      </div>
    </div>
  );
}
