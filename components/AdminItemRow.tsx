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

  function copyLink() {
    const url = `${window.location.origin}/view/${shareId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function remove() {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/file/${id}?type=${type}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <Link href={`/admin/files/${id}?type=${type}`} className="text-sm text-text hover:text-rose-light transition-colors">
        {title}
        {categoryName ? (
          <span className="ml-2 rounded-md bg-gold/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold">
            {categoryName}
          </span>
        ) : null}
      </Link>
      <div className="flex items-center gap-2">
        <button
          onClick={copyLink}
          className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-muted hover:text-gold hover:border-gold/30 transition-colors btn-press"
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <Link
          href={`/admin/files/${id}?type=${type}`}
          className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-muted hover:text-gold hover:border-gold/30 transition-colors btn-press"
        >
          Stats
        </Link>
        <button
          onClick={remove}
          disabled={deleting}
          className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-muted hover:text-danger hover:border-danger transition-colors btn-press disabled:opacity-40"
        >
          {deleting ? '…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}