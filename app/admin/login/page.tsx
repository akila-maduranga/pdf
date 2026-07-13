'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Login failed');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-velvet-border/30 bg-velvet-surface/30 p-8">
        <p className="font-mono text-xs uppercase tracking-wider text-rose-gold">Admin access</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">Welcome back</h1>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-6 w-full rounded-lg border border-velvet-border/30 bg-midnight/30 px-3 py-2.5 text-sm text-velvet-text outline-none focus:border-rose-gold"
        />

        {error ? <p className="mt-3 text-sm text-wine">{error}</p> : null}

        <button
          type="submit"
          disabled={loading || !password}
          className="mt-6 w-full rounded-lg bg-rose-gold py-2.5 text-sm font-medium text-velvet-bg transition-opacity hover:bg-rose-gold/90 disabled:opacity-40"
        >
          {loading ? 'Verifying...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
