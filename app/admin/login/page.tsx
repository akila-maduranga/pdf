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
    <main className="flex min-h-screen items-center justify-center px-4 bg-bg">
      <form onSubmit={submit} className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8">
        <p className="font-mono text-xs uppercase tracking-wider text-gold">Admin</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-text">Sign in</h1>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-6 w-full bg-surface-2 border border-border text-text placeholder:text-text-dim rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
        />

        {error ? <p className="mt-3 text-danger text-sm">{error}</p> : null}

        <button
          type="submit"
          disabled={loading || !password}
          className="mt-6 w-full bg-gold text-bg rounded-xl py-2.5 font-semibold hover:bg-gold-light disabled:opacity-40 transition-all btn-press"
        >
          {loading ? 'Checking…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}