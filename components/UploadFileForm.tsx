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
  const router = useRouter();

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
      formRef.current.reset();
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Upload failed');
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className="rounded border border-line/15 bg-white/[0.02] p-5"
    >
      <p className="font-mono text-xs uppercase tracking-wider text-brass">
        Add {kind === 'file' ? 'document' : 'image'}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          name="title"
          required
          placeholder="Title"
          className="rounded border border-line/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-brass sm:col-span-2"
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          rows={2}
          className="rounded border border-line/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-brass sm:col-span-2"
        />
        <div>
          <label className="block text-xs text-paper/50">{kind === 'file' ? 'PDF file' : 'Image file'}</label>
          <input
            type="file"
            name="file"
            required
            accept={kind === 'file' ? 'application/pdf' : 'image/*'}
            className="mt-1 w-full text-xs text-paper/70 file:mr-3 file:rounded file:border-0 file:bg-brass/20 file:px-3 file:py-1.5 file:text-xs file:text-brass"
          />
        </div>
        <div>
          <label className="block text-xs text-paper/50">Thumbnail (optional)</label>
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            className="mt-1 w-full text-xs text-paper/70 file:mr-3 file:rounded file:border-0 file:bg-brass/20 file:px-3 file:py-1.5 file:text-xs file:text-brass"
          />
        </div>
        <div className="sm:col-span-2">
          <CategorySelect />
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-rust">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded bg-brass px-5 py-2 text-sm font-medium text-ink hover:opacity-90 disabled:opacity-40"
      >
        {loading ? 'Uploading…' : 'Upload'}
      </button>
    </form>
  );
}
