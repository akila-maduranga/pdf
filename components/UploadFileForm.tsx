'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import CategorySelect from './CategorySelect';

type Props = {
  kind: 'file' | 'image';
};

export default function UploadFileForm({ kind }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadedId, setUploadedId] = useState('');
  const [uploadedTitle, setUploadedTitle] = useState('');
  const [createCollection, setCreateCollection] = useState(false);
  const [collectionTitle, setCollectionTitle] = useState('');
  const [collectionDesc, setCollectionDesc] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData(formRef.current);
    const title = formData.get('title') as string;
    const endpoint = kind === 'file' ? '/api/admin/upload-file' : '/api/admin/upload-image';
    const res = await fetch(endpoint, { method: 'POST', body: formData });

    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setUploadedId(data.id);
      setUploadedTitle(title);
      setSuccess(`${kind === 'file' ? 'Story' : 'Image'} uploaded successfully!`);
      formRef.current.reset();
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Upload failed');
    }
  }

  async function handleCreateCollection() {
    if (!collectionTitle.trim()) return;
    setCreatingCollection(true);
    try {
      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: collectionTitle, description: collectionDesc }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.collection) {
        await fetch(`/api/admin/collections/${data.collection.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemType: kind, itemId: uploadedId }),
        });
        router.push(`/admin/collections/${data.collection.id}`);
      }
    } catch {
      // ignore
    }
    setCreatingCollection(false);
  }

  function goToCollection() {
    setSuccess('');
    setUploadedId('');
    setUploadedTitle('');
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className="rounded-xl border border-velvet-border/30 bg-velvet-surface/30 p-5"
    >
      <p className="font-mono text-xs uppercase tracking-wider text-rose-gold">
        Add {kind === 'file' ? 'a story' : 'an image'}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          name="title"
          required
          placeholder="Title"
          className="rounded-lg border border-velvet-border/30 bg-midnight/30 px-3 py-2.5 text-sm text-velvet-text outline-none focus:border-rose-gold sm:col-span-2"
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          rows={2}
          className="rounded-lg border border-velvet-border/30 bg-midnight/30 px-3 py-2.5 text-sm text-velvet-text outline-none focus:border-rose-gold sm:col-span-2"
        />
        <div>
          <label className="block text-xs text-velvet-text/50">{kind === 'file' ? 'Story file (PDF)' : 'Image file'}</label>
          <input
            type="file"
            name="file"
            required
            accept={kind === 'file' ? 'application/pdf' : 'image/*'}
            className="mt-1 w-full text-xs text-velvet-text/70 file:mr-3 file:rounded-lg file:border-0 file:bg-rose-gold/20 file:px-3 file:py-1.5 file:text-xs file:text-rose-gold"
          />
        </div>
        <div>
          <label className="block text-xs text-velvet-text/50">Cover image (optional)</label>
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            className="mt-1 w-full text-xs text-velvet-text/70 file:mr-3 file:rounded-lg file:border-0 file:bg-rose-gold/20 file:px-3 file:py-1.5 file:text-xs file:text-rose-gold"
          />
        </div>
        <div className="sm:col-span-2">
          <CategorySelect />
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-wine">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-rose-gold px-5 py-2.5 text-sm font-medium text-velvet-bg hover:bg-rose-gold/90 disabled:opacity-40"
      >
        {loading ? 'Uploading...' : 'Upload'}
      </button>

      {success && (
        <div className="mt-4 rounded-lg border border-rose-gold/30 bg-rose-gold/10 p-4">
          <p className="text-sm text-rose-gold">{success}</p>
          <p className="mt-1 text-xs text-velvet-text/50">{uploadedTitle}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={goToCollection}
              className="rounded-lg border border-velvet-border/30 px-3 py-1.5 text-xs text-velvet-text/70 hover:border-rose-gold hover:text-rose-gold"
            >
              Upload another
            </button>
            <button
              type="button"
              onClick={() => setCreateCollection(true)}
              className="rounded-lg bg-rose-gold/20 border border-rose-gold/30 px-3 py-1.5 text-xs text-rose-gold hover:bg-rose-gold/30"
            >
              + Add to collection
            </button>
          </div>
        </div>
      )}

      {createCollection && (
        <div className="mt-4 rounded-lg border border-velvet-border/30 bg-midnight/30 p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-rose-gold/70 mb-3">Create a collection</p>
          <input
            value={collectionTitle}
            onChange={(e) => setCollectionTitle(e.target.value)}
            required
            placeholder="Collection title"
            className="w-full rounded-lg border border-velvet-border/30 bg-velvet-surface/30 px-3 py-2 text-sm text-velvet-text outline-none focus:border-rose-gold"
          />
          <input
            value={collectionDesc}
            onChange={(e) => setCollectionDesc(e.target.value)}
            placeholder="Description (optional)"
            className="mt-2 w-full rounded-lg border border-velvet-border/30 bg-velvet-surface/30 px-3 py-2 text-sm text-velvet-text outline-none focus:border-rose-gold"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleCreateCollection}
              disabled={creatingCollection || !collectionTitle.trim()}
              className="rounded-lg bg-rose-gold px-4 py-2 text-xs font-medium text-velvet-bg hover:bg-rose-gold/90 disabled:opacity-40"
            >
              {creatingCollection ? 'Creating...' : 'Create & add'}
            </button>
            <button
              type="button"
              onClick={() => setCreateCollection(false)}
              className="rounded-lg border border-velvet-border/30 px-4 py-2 text-xs text-velvet-text/60 hover:text-velvet-text"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
