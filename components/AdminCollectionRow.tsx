'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Props = {
  id: string;
  title: string;
  shareId: string;
  partCount: number;
};

export default function AdminCollectionRow({ id, title, shareId, partCount }: Props) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  function copyLink() {
    const url = `${window.location.origin}/collection/${shareId}/${titleSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function remove() {
    if (!confirm(`Remove collection "${title}"? Items will be kept safe.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/collections/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <Link href={`/admin/collections/${id}`} className="text-sm text-velvet-text/85 hover:text-rose-gold">
        {title}
        <span className="ml-2 font-mono text-xs text-velvet-text/35">
          {partCount} {partCount === 1 ? 'part' : 'parts'}
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <button
          onClick={copyLink}
          className="rounded border border-velvet-border/30 px-2.5 py-1 text-xs text-velvet-text/60 hover:border-rose-gold hover:text-rose-gold"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <Link
          href={`/admin/collections/${id}`}
          className="rounded border border-velvet-border/30 px-2.5 py-1 text-xs text-velvet-text/60 hover:border-rose-gold hover:text-rose-gold"
        >
          Edit
        </Link>
        <button
          onClick={remove}
          disabled={deleting}
          className="rounded border border-velvet-border/30 px-2.5 py-1 text-xs text-velvet-text/60 hover:border-wine hover:text-wine disabled:opacity-40"
        >
          {deleting ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
