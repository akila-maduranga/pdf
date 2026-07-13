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
      setError(data.error || 'Failed to create');
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-velvet-border/30 bg-velvet-surface/30 p-5">
      <p className="font-mono text-xs uppercase tracking-wider text-rose-gold">Create a new collection</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Title (e.g. 'Chapters 1-5')"
          className="rounded-lg border border-velvet-border/30 bg-midnight/30 px-3 py-2.5 text-sm text-velvet-text outline-none focus:border-rose-gold sm:col-span-2"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="rounded-lg border border-velvet-border/30 bg-midnight/30 px-3 py-2.5 text-sm text-velvet-text outline-none focus:border-rose-gold sm:col-span-2"
        />
        <CategorySelect value={categoryId} onChange={setCategoryId} />
      </div>
      {error ? <p className="mt-3 text-sm text-wine">{error}</p> : null}
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="mt-4 rounded-lg bg-rose-gold px-5 py-2.5 text-sm font-medium text-velvet-bg hover:bg-rose-gold/90 disabled:opacity-40"
      >
        {loading ? 'Creating...' : 'Create collection'}
      </button>
    </form>
  );
}
