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
    <form onSubmit={submit} className="rounded border border-line/15 bg-white/[0.02] p-5">
      <p className="font-mono text-xs uppercase tracking-wider text-brass">New collection</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Title (e.g. 'The Long Road, Chapters 1–5')"
          className="rounded border border-line/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-brass sm:col-span-2"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="rounded border border-line/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-brass sm:col-span-2"
        />
        <CategorySelect value={categoryId} onChange={setCategoryId} />
      </div>
      {error ? <p className="mt-3 text-sm text-rust">{error}</p> : null}
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="mt-4 rounded bg-brass px-5 py-2 text-sm font-medium text-ink hover:opacity-90 disabled:opacity-40"
      >
        {loading ? 'Creating…' : 'Create collection'}
      </button>
    </form>
  );
}
