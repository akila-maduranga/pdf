'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CategorySelect from './CategorySelect';

export default function CreateCollectionForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, categoryId: categoryId || null }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok && data.collection) {
      router.push(`/admin/collections/${data.collection.id}`);
    } else {
      setError(data.error || 'Could not create collection');
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl bg-surface border border-border p-5">
      <p className="font-mono text-xs uppercase tracking-wider text-gold">New collection</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Title (e.g. 'The Long Road, Chapters 1–5')"
          className="rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm text-text placeholder:text-text-dim outline-none focus:border-rose/40 focus:ring-1 focus:ring-rose/20 transition-all sm:col-span-2"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm text-text placeholder:text-text-dim outline-none focus:border-rose/40 focus:ring-1 focus:ring-rose/20 transition-all sm:col-span-2 resize-none"
        />
        <CategorySelect value={categoryId} onChange={setCategoryId} />
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="mt-4 rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-bg hover:bg-gold-light disabled:opacity-40 transition-colors btn-press"
      >
        {loading ? 'Creating…' : 'Create collection'}
      </button>
    </form>
  );
}