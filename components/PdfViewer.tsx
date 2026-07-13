'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type Props = {
  shareId: string;
};

export default function PdfViewer({ shareId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastTap = useRef<number>(0);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [scale, setScale] = useState(1.2);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    if (status !== 'ready' || !docRef.current || !containerWidth || containerWidth < 400) return;
    const maxScale = containerWidth < 500 ? 1.0 : 1.2;
    if (scale > maxScale) setScale(maxScale);
  }, [containerWidth, status]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      try {
        const loadingTask = pdfjsLib.getDocument({
          url: `/api/file-stream/${shareId}`,
          disableAutoFetch: false,
        });
        const doc = await loadingTask.promise;
        if (cancelled) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
        setStatus('ready');
      } catch (err) {
        console.error(err);
        if (!cancelled) setStatus('error');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  useEffect(() => {
    async function renderPage() {
      if (!docRef.current || !canvasRef.current) return;
      const page = await docRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
    }
    if (status === 'ready') renderPage();
  }, [pageNum, scale, status]);

  const goToPrev = useCallback(() => setPageNum((p) => Math.max(1, p - 1)), []);
  const goToNext = useCallback(() => setPageNum((p) => Math.min(numPages, p + 1)), [numPages]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) goToNext();
        else goToPrev();
      }
      touchStartX.current = null;
      touchStartY.current = null;
    },
    [goToNext, goToPrev]
  );

  const handleDoubleTap = useCallback(
    (e: React.TouchEvent) => {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        toggleFullscreen();
      }
      lastTap.current = now;
    },
    [toggleFullscreen]
  );

  if (status === 'loading') {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-velvet-text/50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-gold/30 border-t-rose-gold" />
        <span className="text-sm">Loading your story...</span>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-velvet-text/50">
        <span className="text-3xl">💔</span>
        <span className="text-sm">This story couldn&apos;t be loaded. Please try again.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3" ref={containerRef}>
      {/* PDF Canvas with swipe + double-tap support */}
      <div
        className="no-select w-full overflow-auto rounded-xl border border-velvet-border/30 bg-midnight/50 p-1 sm:p-3"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleDoubleTap}
      >
        <canvas ref={canvasRef} className="mx-auto block max-w-full shadow-lg" />
      </div>

      {/* Mobile-optimized bottom control bar */}
      <div className="sticky bottom-3 z-10 w-full max-w-md safe-bottom">
        <div className="flex items-center justify-between rounded-2xl border border-velvet-border/30 bg-velvet-bg/95 px-3 py-2.5 shadow-xl backdrop-blur-sm sm:static sm:bottom-auto sm:max-w-none sm:rounded-xl sm:bg-velvet-surface/50 sm:px-4 sm:shadow-none sm:backdrop-blur-none">
          <button
            onClick={goToPrev}
            disabled={pageNum <= 1}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-velvet-text/80 transition-colors hover:bg-rose-gold/15 hover:text-rose-gold disabled:opacity-25 sm:h-auto sm:w-auto sm:rounded-lg sm:border sm:border-velvet-border/30 sm:px-4 sm:py-2"
            aria-label="Previous page"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:hidden">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="hidden text-sm sm:inline">← Prev</span>
          </button>

          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-sm font-medium text-velvet-text/70">
              {pageNum} <span className="text-velvet-text/30">/</span> {numPages}
            </span>
            <div className="h-1 w-20 rounded-full bg-velvet-border/20 sm:hidden">
              <div
                className="h-full rounded-full bg-rose-gold/60 transition-all duration-200"
                style={{ width: `${(pageNum / numPages) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={goToNext}
            disabled={pageNum >= numPages}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-velvet-text/80 transition-colors hover:bg-rose-gold/15 hover:text-rose-gold disabled:opacity-25 sm:h-auto sm:w-auto sm:rounded-lg sm:border sm:border-velvet-border/30 sm:px-4 sm:py-2"
            aria-label="Next page"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:hidden">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="hidden text-sm sm:inline">Next →</span>
          </button>
        </div>

        {/* Zoom + fullscreen controls */}
        <div className="mt-2 flex items-center justify-center gap-1 sm:mt-2">
          <button
            onClick={() => setScale((s) => Math.max(0.5, +(s - 0.2).toFixed(1)))}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-velvet-text/60 transition-colors hover:bg-rose-gold/10 hover:text-rose-gold"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="w-12 text-center font-mono text-[11px] text-velvet-text/40">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2.4, +(s + 0.2).toFixed(1)))}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-velvet-text/60 transition-colors hover:bg-rose-gold/10 hover:text-rose-gold"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => setScale(containerWidth < 500 ? 0.8 : 1.2)}
            className="rounded-lg px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-velvet-text/40 transition-colors hover:bg-rose-gold/10 hover:text-rose-gold"
          >
            Fit
          </button>
          <div className="mx-1 h-4 w-px bg-velvet-border/20" />
          <button
            onClick={toggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-velvet-text/60 transition-colors hover:bg-rose-gold/10 hover:text-rose-gold"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
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
      </div>
    </div>
  );
}
