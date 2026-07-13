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
      <Link href="/admin" className="font-mono text-xs uppercase tracking-wider text-text-dim hover:text-gold">
        ← Dashboard
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold text-text">Categories</h1>
      <p className="mt-2 text-sm text-text-muted">
        Categories can be applied to documents, images, and collections to help visitors browse by
        topic.
      </p>

      <form onSubmit={create} className="mt-6 bg-surface border border-border rounded-xl p-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="w-full bg-surface-2 border border-border text-text placeholder:text-text-dim rounded-xl px-3 py-2 text-sm outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="shrink-0 bg-gold text-bg rounded-xl px-4 py-2 text-sm font-semibold hover:bg-gold-light disabled:opacity-40 transition-all btn-press"
        >
          Add
        </button>
      </form>
      {error ? <p className="mt-2 text-danger text-sm">{error}</p> : null}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-text-dim">Loading…</p>
        ) : !categories.length ? (
          <p className="text-sm text-text-dim">No categories yet.</p>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-surface">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-text text-sm">{c.name}</span>
                <button
                  onClick={() => remove(c.id, c.name)}
                  className="border border-border text-text-muted hover:text-danger hover:border-danger rounded-lg px-2.5 py-1 text-xs transition-all"
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