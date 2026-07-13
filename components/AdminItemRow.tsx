'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Props = {
  id: string;
  type: 'file' | 'image';
  title: string;
  shareId: string;
  categoryName?: string | null;
};

export default function AdminItemRow({ id, type, title, shareId, categoryName }: Props) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  function copyLink() {
    const url = `${window.location.origin}/view/${shareId}/${titleSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function remove() {
    if (!confirm(`Remove "${title}"? This can't be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/file/${id}?type=${type}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <Link href={`/admin/files/${id}?type=${type}`} className="text-sm text-velvet-text/85 hover:text-rose-gold">
        {title}
        {categoryName ? (
          <span className="ml-2 rounded-full bg-rose-gold/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-rose-gold">
            {categoryName}
          </span>
        ) : null}
      </Link>
      <div className="flex items-center gap-2">
        <button
          onClick={copyLink}
          className="rounded border border-velvet-border/30 px-2.5 py-1 text-xs text-velvet-text/60 hover:border-rose-gold hover:text-rose-gold"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <Link
          href={`/admin/files/${id}?type=${type}`}
          className="rounded border border-velvet-border/30 px-2.5 py-1 text-xs text-velvet-text/60 hover:border-rose-gold hover:text-rose-gold"
        >
          Details
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
