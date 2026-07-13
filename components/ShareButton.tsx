'use client';

import { useState } from 'react';

type Props = {
  path: string; // e.g. `/view/abc123`
  title: string;
  variant?: 'icon' | 'button';
  className?: string;
};

export default function ShareButton({ path, title, variant = 'icon', className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  async function share(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}${path}`;

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as any).share({ title, url });
        return;
      } catch {
        // user cancelled the native share sheet, or it isn't actually
        // supported — fall through to clipboard copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — ignore, nothing more we can do
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={share}
        aria-label="Share"
        title={copied ? 'Link copied' : 'Share'}
        className={`flex h-8 w-8 items-center justify-center rounded-full border border-line/20 bg-ink/60 text-paper/75 backdrop-blur transition-colors hover:border-brass hover:text-brass ${className}`}
      >
        {copied ? <CheckIcon /> : <ShareIcon />}
      </button>
    );
  }

  return (
    <button
      onClick={share}
      className={`flex items-center gap-1.5 rounded border border-line/20 px-3 py-1.5 text-xs text-paper/70 transition-colors hover:border-brass hover:text-brass ${className}`}
    >
      {copied ? <CheckIcon /> : <ShareIcon />}
      {copied ? 'Copied' : 'Share'}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" />
      <line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
