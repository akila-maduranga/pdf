'use client';

import { useRef, useState, useEffect } from 'react';

type Props = {
  shareId: string;
  alt: string;
};

export default function ImageViewer({ shareId, alt }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  async function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

  return (
    <div className="relative group">
      <div
        ref={containerRef}
        className="no-select flex items-center justify-center overflow-auto rounded-xl border border-border bg-surface p-2 sm:p-4"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/image-stream/${shareId}`}
          alt={alt}
          draggable={false}
          className="max-h-[75vh] max-w-full select-none object-contain rounded-lg"
        />
      </div>
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2/80 backdrop-blur border border-border text-text-muted hover:text-rose-light hover:border-rose/30 opacity-0 group-hover:opacity-100 transition-all btn-press"
        title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
      >
        {isFullscreen ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        )}
      </button>
    </div>
  );
}