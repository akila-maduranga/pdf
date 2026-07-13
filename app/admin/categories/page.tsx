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
    if (!confirm(`Delete category "${catName}"? Items keep their content but lose this category.`)) return;
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-8">
      <Link href="/admin" className="font-mono text-xs uppercase tracking-wider text-paper/40 hover:text-brass">
        ← Control room
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold">Label maker</h1>
      <p className="mt-2 text-sm text-paper/50">
        Tags to help visitors browse by topic.
      </p>

      <form onSubmit={create} className="mt-6 flex gap-2 rounded border border-line/15 bg-white/[0.02] p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="w-full rounded border border-line/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-brass"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="shrink-0 rounded bg-brass px-4 py-2 text-sm font-medium text-ink hover:opacity-90 disabled:opacity-40"
        >
          Add
        </button>
      </form>
      {error ? <p className="mt-2 text-sm text-rust">{error}</p> : null}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-paper/40">Hang on...</p>
        ) : !categories.length ? (
          <p className="text-sm text-paper/40">No labels yet.</p>
        ) : (
          <div className="divide-y divide-line/10 rounded border border-line/15">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-paper/85">{c.name}</span>
                <button
                  onClick={() => remove(c.id, c.name)}
                  className="rounded border border-line/20 px-2.5 py-1 text-xs text-paper/60 hover:border-rust hover:text-rust"
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
