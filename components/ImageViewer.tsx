'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

type Props = {
  shareId: string;
  alt: string;
};

export default function ImageViewer({ shareId, alt }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [handleFullscreenChange]);

  function toggleFullscreen() {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="no-select flex w-full items-center justify-center overflow-auto rounded-lg border border-line/15 bg-black/20 p-1 sm:p-4"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/image-stream/${shareId}`}
          alt={alt}
          draggable={false}
          className={`max-w-full select-none object-contain shadow-lg transition-all ${
            isFullscreen
              ? 'max-h-full w-auto h-full'
              : 'max-h-[60vh] w-full sm:max-h-[75vh]'
          }`}
        />
      </div>

      {/* Fullscreen toggle button */}
      <button
        onClick={toggleFullscreen}
        className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-line/20 bg-ink/70 text-paper/70 backdrop-blur transition-colors hover:border-brass hover:text-brass"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
        title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
      >
        {isFullscreen ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 14 10 14 10 20" />
            <polyline points="20 10 14 10 14 4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        )}
      </button>
    </div>
  );
}