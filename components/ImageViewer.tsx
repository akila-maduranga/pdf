'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

type Props = {
  shareId: string;
  alt: string;
};

export default function ImageViewer({ shareId, alt }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

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

  function handleDoubleClick() {
    setScale((s) => (s === 1 ? 2 : 1));
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`no-select flex w-full items-center justify-center overflow-auto rounded-xl border border-velvet-border/30 bg-midnight/50 p-1 sm:p-4 ${
          isFullscreen ? 'bg-black' : ''
        }`}
        onDoubleClick={handleDoubleClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={`/api/image-stream/${shareId}`}
          alt={alt}
          draggable={false}
          className={`select-none object-contain shadow-lg transition-transform duration-300 ${
            isFullscreen
              ? 'max-h-full max-w-full'
              : 'max-h-[60vh] w-full sm:max-h-[75vh]'
          }`}
          style={{ transform: `scale(${scale})` }}
        />
      </div>

      {/* Fullscreen + zoom controls */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
        {scale !== 1 && (
          <button
            onClick={() => setScale(1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-velvet-border/30 bg-velvet-bg/70 text-velvet-text/70 backdrop-blur transition-colors hover:border-rose-gold hover:text-rose-gold"
            aria-label="Reset zoom"
          >
            <span className="font-mono text-xs">{Math.round(scale * 100)}%</span>
          </button>
        )}
        <button
          onClick={toggleFullscreen}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-velvet-border/30 bg-velvet-bg/70 text-velvet-text/70 backdrop-blur transition-colors hover:border-rose-gold hover:text-rose-gold"
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

      {/* Zoom hint */}
      {!isFullscreen && scale === 1 && (
        <p className="mt-2 text-center font-mono text-[10px] text-velvet-text/25">
          Double-tap to zoom · Pinch to scale
        </p>
      )}
    </div>
  );
}
