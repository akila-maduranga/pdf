'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Category = { id: string; name: string; slug: string };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/categories');
    const data = await res.json().catch(() => ({}));
    setCategories(data.categories || []);
    setLoading(false);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setName('');
      load();
    } else {
      setError(data.error || 'Could not create category');
    }
  }

  async function remove(id: string, catName: string) {
    if (!confirm(`Delete category "${catName}"? Items will keep their content.`)) return;
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-8">
      <Link href="/admin" className="font-mono text-xs uppercase tracking-wider text-velvet-text/40 hover:text-rose-gold">
        ← Dashboard
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold">Categories</h1>
      <p className="mt-2 text-sm text-velvet-text/50">
        Organize your content by topic or genre.
      </p>

      <form onSubmit={create} className="mt-6 flex gap-2 rounded-xl border border-velvet-border/30 bg-velvet-surface/30 p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="w-full rounded-lg border border-velvet-border/30 bg-midnight/30 px-3 py-2.5 text-sm text-velvet-text outline-none focus:border-rose-gold"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="shrink-0 rounded-lg bg-rose-gold px-4 py-2.5 text-sm font-medium text-velvet-bg hover:bg-rose-gold/90 disabled:opacity-40"
        >
          Add
        </button>
      </form>
      {error ? <p className="mt-2 text-sm text-wine">{error}</p> : null}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-velvet-text/40">Loading...</p>
        ) : !categories.length ? (
          <p className="text-sm text-velvet-text/40">No categories yet.</p>
        ) : (
          <div className="divide-y divide-velvet-border/20 rounded-xl border border-velvet-border/30">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-velvet-text/85">{c.name}</span>
                <button
                  onClick={() => remove(c.id, c.name)}
                  className="rounded-lg border border-velvet-border/30 px-2.5 py-1 text-xs text-velvet-text/60 hover:border-wine hover:text-wine"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
