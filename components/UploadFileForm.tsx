'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CategorySelect from './CategorySelect';

type CollectionOption = {
  id: string;
  title: string;
  share_id: string;
  collection_items: { count: number }[];
};

type Props = {
  kind: 'file' | 'image';
};

export default function UploadFileForm({ kind }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Post-upload collection state
  const [lastUploadId, setLastUploadId] = useState<string | null>(null);
  const [lastUploadType, setLastUploadType] = useState<'file' | 'image' | null>(null);
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [collectionMode, setCollectionMode] = useState<'none' | 'new' | 'existing'>('none');
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionSuccess, setCollectionSuccess] = useState('');
  const [collectionError, setCollectionError] = useState('');

  // Load collections when entering existing mode
  useEffect(() => {
    if (collectionMode === 'existing' && collections.length === 0) {
      fetch('/api/admin/collections')
        .then((r) => r.json())
        .then((data) => setCollections(data.collections || []))
        .catch(() => {});
    }
  }, [collectionMode, collections.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    setError('');

    const formData = new FormData(formRef.current);
    const endpoint = kind === 'file' ? '/api/admin/upload-file' : '/api/admin/upload-image';
    const res = await fetch(endpoint, { method: 'POST', body: formData });

    setLoading(false);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      formRef.current.reset();
      setLastUploadId(data.id || null);
      setLastUploadType(kind);
      setCollectionMode('none');
      setCollectionSuccess('');
      setCollectionError('');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Upload failed');
    }
  }

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!lastUploadId || !newCollectionTitle.trim()) return;
    setCollectionLoading(true);
    setCollectionError('');

    try {
      // Create the collection
      const createRes = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newCollectionTitle.trim() }),
      });
      const createData = await createRes.json().catch(() => ({}));

      if (!createRes.ok || !createData.collection) {
        setCollectionError(createData.error || 'Failed to create collection');
        setCollectionLoading(false);
        return;
      }

      // Add the item to the collection
      const addRes = await fetch(`/api/admin/collections/${createData.collection.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: lastUploadType, itemId: lastUploadId }),
      });

      if (addRes.ok) {
        setCollectionSuccess(`Created "${newCollectionTitle.trim()}" and added item.`);
        setNewCollectionTitle('');
        setCollectionMode('none');
        setLastUploadId(null);
        setLastUploadType(null);
      } else {
        const addData = await addRes.json().catch(() => ({}));
        setCollectionError(addData.error || 'Failed to add item to collection');
      }
    } catch {
      setCollectionError('Something went wrong');
    }

    setCollectionLoading(false);
  }

  async function handleAddToExisting() {
    if (!lastUploadId || !selectedCollectionId) return;
    setCollectionLoading(true);
    setCollectionError('');

    try {
      const res = await fetch(`/api/admin/collections/${selectedCollectionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: lastUploadType, itemId: lastUploadId }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const coll = collections.find((c) => c.id === selectedCollectionId);
        setCollectionSuccess(`Added to "${coll?.title || 'collection'}".`);
        setCollectionMode('none');
        setSelectedCollectionId('');
        setLastUploadId(null);
        setLastUploadType(null);
      } else {
        setCollectionError(data.error || 'Failed to add to collection');
      }
    } catch {
      setCollectionError('Something went wrong');
    }

    setCollectionLoading(false);
  }

  function handleSkip() {
    setLastUploadId(null);
    setLastUploadType(null);
    setCollectionMode('none');
    setCollectionSuccess('');
    setCollectionError('');
  }

  return (
    <div className="space-y-4">
      <form
        ref={formRef}
        onSubmit={submit}
        className="rounded-xl bg-surface border border-border p-5"
      >
        <p className="font-mono text-xs uppercase tracking-wider text-gold">
          Add {kind === 'file' ? 'document' : 'image'}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            name="title"
            required
            placeholder="Title"
            className="rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm text-text placeholder:text-text-dim outline-none focus:border-rose/40 focus:ring-1 focus:ring-rose/20 transition-all sm:col-span-2"
          />
          <textarea
            name="description"
            placeholder="Description (optional)"
            rows={2}
            className="rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm text-text placeholder:text-text-dim outline-none focus:border-rose/40 focus:ring-1 focus:ring-rose/20 transition-all sm:col-span-2 resize-none"
          />
          <div>
            <label className="block text-xs text-text-dim mb-1">{kind === 'file' ? 'PDF file' : 'Image file'}</label>
            <input
              type="file"
              name="file"
              required
              accept={kind === 'file' ? 'application/pdf' : 'image/*'}
              className="w-full text-xs text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-rose/15 file:px-3 file:py-1.5 file:text-xs file:text-rose-light file:font-medium"
            />
          </div>
          <div>
            <label className="block text-xs text-text-dim mb-1">Thumbnail (optional)</label>
            <input
              type="file"
              name="thumbnail"
              accept="image/*"
              className="w-full text-xs text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-rose/15 file:px-3 file:py-1.5 file:text-xs file:text-rose-light file:font-medium"
            />
          </div>
          <div className="sm:col-span-2">
            <CategorySelect />
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded-lg bg-rose px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose/20 hover:bg-rose-dark disabled:opacity-40 transition-colors btn-press"
        >
          {loading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      {/* Collection options after successful upload */}
      {lastUploadId && lastUploadType && (
        <div className="rounded-xl bg-surface border border-border p-5 animate-fade-in">
          <p className="font-mono text-xs uppercase tracking-wider text-gold">
            Collection Options
          </p>
          <p className="mt-2 text-sm text-text-muted">
            Upload complete. Add to a collection?
          </p>

          {collectionSuccess ? (
            <p className="mt-3 text-sm text-rose-light">{collectionSuccess}</p>
          ) : collectionMode === 'none' ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setCollectionMode('new')}
                className="rounded-lg bg-rose px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose/20 hover:bg-rose-dark transition-colors btn-press"
              >
                Create new collection
              </button>
              <button
                onClick={() => setCollectionMode('existing')}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-gold hover:border-gold/30 transition-colors btn-press"
              >
                Add to existing
              </button>
              <button
                onClick={handleSkip}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-dim hover:text-text transition-colors btn-press"
              >
                Skip
              </button>
            </div>
          ) : collectionMode === 'new' ? (
            <form onSubmit={handleCreateCollection} className="mt-4 space-y-3">
              <input
                value={newCollectionTitle}
                onChange={(e) => setNewCollectionTitle(e.target.value)}
                required
                placeholder="New collection title"
                className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm text-text placeholder:text-text-dim outline-none focus:border-rose/40 focus:ring-1 focus:ring-rose/20 transition-all"
              />
              {collectionError && <p className="text-sm text-danger">{collectionError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={collectionLoading || !newCollectionTitle.trim()}
                  className="rounded-lg bg-rose px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose/20 hover:bg-rose-dark disabled:opacity-40 transition-colors btn-press"
                >
                  {collectionLoading ? 'Creating…' : 'Create & add'}
                </button>
                <button
                  type="button"
                  onClick={() => { setCollectionMode('none'); setCollectionError(''); }}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-text-dim hover:text-text transition-colors btn-press"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 space-y-3">
              <select
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
                className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm text-text outline-none focus:border-rose/40 transition-all"
              >
                <option value="">Choose a collection…</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.collection_items?.[0]?.count ?? 0} parts)
                  </option>
                ))}
              </select>
              {collectionError && <p className="text-sm text-danger">{collectionError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleAddToExisting}
                  disabled={collectionLoading || !selectedCollectionId}
                  className="rounded-lg bg-rose px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose/20 hover:bg-rose-dark disabled:opacity-40 transition-colors btn-press"
                >
                  {collectionLoading ? 'Adding…' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => { setCollectionMode('none'); setCollectionError(''); }}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-text-dim hover:text-text transition-colors btn-press"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}