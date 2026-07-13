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
    if (!confirm(`Toss "${title}" into the void? No take-backs.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/file/${id}?type=${type}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <Link href={`/admin/files/${id}?type=${type}`} className="text-sm text-paper/85 hover:text-brass">
        {title}
        {categoryName ? (
          <span className="ml-2 rounded-full bg-brass/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-brass">
            {categoryName}
          </span>
        ) : null}
      </Link>
      <div className="flex items-center gap-2">
        <button
          onClick={copyLink}
          className="rounded border border-line/20 px-2.5 py-1 text-xs text-paper/60 hover:border-brass hover:text-brass"
        >
          {copied ? 'Snagged!' : 'Grab link'}
        </button>
        <Link
          href={`/admin/files/${id}?type=${type}`}
          className="rounded border border-line/20 px-2.5 py-1 text-xs text-paper/60 hover:border-brass hover:text-brass"
        >
          Scoop
        </Link>
        <button
          onClick={remove}
          disabled={deleting}
          className="rounded border border-line/20 px-2.5 py-1 text-xs text-paper/60 hover:border-rust hover:text-rust disabled:opacity-40"
        >
          {deleting ? '…' : 'Toss it'}
        </button>
      </div>
    </div>
  );
}
