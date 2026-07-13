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

  function copyLink() {
    const url = `${window.location.origin}/collection/${shareId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function remove() {
    if (!confirm(`Delete collection "${title}"? Its parts stay, only the grouping is removed.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/collections/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <Link href={`/admin/collections/${id}`} className="text-sm text-text hover:text-rose-light transition-colors">
        {title}
        <span className="ml-2 font-mono text-xs text-text-dim">
          {partCount} {partCount === 1 ? 'part' : 'parts'}
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <button
          onClick={copyLink}
          className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-muted hover:text-gold hover:border-gold/30 transition-colors btn-press"
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <Link
          href={`/admin/collections/${id}`}
          className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-muted hover:text-gold hover:border-gold/30 transition-colors btn-press"
        >
          Edit
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