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
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [scale, setScale] = useState(1.2);
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure container width for responsive canvas
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

  // Auto-fit scale for mobile
  useEffect(() => {
    if (status !== 'ready' || !docRef.current || !containerWidth || containerWidth < 400) return;
    // Keep user's chosen scale, but cap on mobile
    const maxScale = containerWidth < 500 ? 1.0 : 1.2;
    if (scale > maxScale) setScale(maxScale);
  }, [containerWidth, status]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only trigger on horizontal swipes (not vertical scroll)
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goToNext();
      else goToPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [goToNext, goToPrev]);

  if (status === 'loading') {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-paper/50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass/30 border-t-brass" />
        <span className="text-sm">Unpacking the pages...</span>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-paper/50">
        <span className="text-3xl">😵</span>
        <span className="text-sm">This document refused to load. Try again?</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3" ref={containerRef}>
      {/* PDF Canvas with swipe support */}
      <div
        className="no-select w-full overflow-auto rounded-lg border border-line/15 bg-black/20 p-1 sm:p-3"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <canvas ref={canvasRef} className="mx-auto block max-w-full shadow-lg" />
      </div>

      {/* Mobile-optimized bottom control bar */}
      <div className="sticky bottom-3 z-10 w-full max-w-md">
        <div className="flex items-center justify-between rounded-2xl border border-line/20 bg-ink/95 px-3 py-2.5 shadow-xl backdrop-blur-sm sm:static sm:bottom-auto sm:max-w-none sm:rounded-lg sm:bg-transparent sm:px-0 sm:shadow-none sm:backdrop-blur-none">
          {/* Prev button */}
          <button
            onClick={goToPrev}
            disabled={pageNum <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-paper/80 transition-colors hover:bg-brass/15 hover:text-brass disabled:opacity-25 sm:h-auto sm:w-auto sm:rounded sm:border sm:border-line/20 sm:px-3 sm:py-1.5"
            aria-label="Previous page"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:hidden">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="hidden text-sm sm:inline">← Prev</span>
          </button>

          {/* Page indicator - tappable on mobile */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-sm font-medium text-paper/70">
              {pageNum} <span className="text-paper/30">/</span> {numPages}
            </span>
            {/* Quick page progress bar for mobile */}
            <div className="h-1 w-16 rounded-full bg-line/15 sm:hidden">
              <div
                className="h-full rounded-full bg-brass/60 transition-all duration-200"
                style={{ width: `${(pageNum / numPages) * 100}%` }}
              />
            </div>
          </div>

          {/* Next button */}
          <button
            onClick={goToNext}
            disabled={pageNum >= numPages}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-paper/80 transition-colors hover:bg-brass/15 hover:text-brass disabled:opacity-25 sm:h-auto sm:w-auto sm:rounded sm:border sm:border-line/20 sm:px-3 sm:py-1.5"
            aria-label="Next page"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:hidden">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="hidden text-sm sm:inline">Next →</span>
          </button>
        </div>

        {/* Zoom controls - subtle on mobile */}
        <div className="mt-2 flex items-center justify-center gap-2 sm:mt-0">
          <button
            onClick={() => setScale((s) => Math.max(0.5, +(s - 0.2).toFixed(1)))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-paper/60 transition-colors hover:bg-brass/10 hover:text-brass"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="w-10 text-center font-mono text-[11px] text-paper/40">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2.4, +(s + 0.2).toFixed(1)))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-paper/60 transition-colors hover:bg-brass/10 hover:text-brass"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => setScale(containerWidth < 500 ? 0.8 : 1.2)}
            className="ml-1 rounded-lg px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-paper/40 transition-colors hover:bg-brass/10 hover:text-brass"
          >
            Fit
          </button>
        </div>
      </div>
    </div>
  );
}