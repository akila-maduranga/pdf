'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type Props = {
  shareId: string;
};

export default function PdfViewer({ shareId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [scale, setScale] = useState(1.0);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  // Auto-fit to container width using window width (reliable on mobile)
  const fitToWidth = useCallback(async () => {
    if (!docRef.current) return;
    const page = await docRef.current.getPage(pageNum);
    const defaultViewport = page.getViewport({ scale: 1 });
    const availableWidth = window.innerWidth - 32 - 16;
    const newScale = availableWidth / defaultViewport.width;
    setScale(Math.min(Math.max(newScale, 0.8), 3));
  }, [pageNum]);

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

  // Re-fit on page change and initial load
  useEffect(() => {
    if (status === 'ready') {
      const raf = requestAnimationFrame(() => {
        fitToWidth();
      });
      if (typeof window !== 'undefined' && 'ontouchstart' in window && pageNum === 1) {
        setShowSwipeHint(true);
        const timer = setTimeout(() => setShowSwipeHint(false), 4000);
        return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
      }
      return () => cancelAnimationFrame(raf);
    }
  }, [status, pageNum, fitToWidth]);

  // Re-fit on window resize
  useEffect(() => {
    if (status !== 'ready') return;
    const handleResize = () => fitToWidth();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [status, fitToWidth]);

  useEffect(() => {
    async function renderPage() {
      if (!docRef.current || !canvasRef.current) return;
      const page = await docRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      await page.render({ canvasContext: ctx, viewport }).promise;
    }
    if (status === 'ready') renderPage();
  }, [pageNum, scale, status]);

  // Touch handlers for swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 15) {
      isSwiping.current = true;
    }
  }, []);

  const handleTouchEndSwipe = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    const endX = e.changedTouches[0].clientX;
    const startX = touchStartX.current || endX;
    const diff = endX - startX;

    if (Math.abs(diff) > 50) {
      if (diff < 0) {
        setPageNum((p) => Math.min(numPages, p + 1));
      } else {
        setPageNum((p) => Math.max(1, p - 1));
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
  }, [numPages]);

  if (status === 'loading') {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-text-muted">
        <div className="h-10 w-10 animate-spin-slow rounded-full border-4 border-rose/20 border-t-rose" />
        <p className="font-body text-sm">Loading story...</p>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-text-muted">
        <p className="font-body text-sm">Couldn&apos;t load this file.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* PDF Canvas Container */}
      <div
        ref={containerRef}
        className="pdf-mobile-container relative w-full overflow-hidden rounded-xl border border-border bg-surface p-2 shadow-lg sm:p-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEndSwipe}
      >
        <canvas ref={canvasRef} className="mx-auto block max-w-full" />

        {showSwipeHint && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
            <div className="flex items-center gap-2 rounded-lg bg-surface-2/90 backdrop-blur px-4 py-2 shadow-lg">
              <span className="swipe-hint-anim text-2xl">👈</span>
              <span className="font-body text-sm font-medium text-text">Swipe to flip pages</span>
              <span className="swipe-hint-anim text-2xl" style={{ animationDelay: '0.2s' }}>👉</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Page navigation */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPageNum((p) => Math.max(1, p - 1))}
            disabled={pageNum <= 1}
            className="btn-press flex h-12 w-12 items-center justify-center rounded-xl bg-rose text-white text-lg font-bold shadow-lg shadow-rose/20 active:scale-90 disabled:opacity-30 disabled:shadow-none transition-all sm:h-10 sm:w-10 sm:text-base"
          >
            ←
          </button>
          <div className="flex h-12 items-center rounded-xl bg-surface px-4 sm:h-10">
            <span className="font-mono text-sm font-medium text-text-muted">
              {pageNum}<span className="text-text-dim"> / {numPages}</span>
            </span>
          </div>
          <button
            onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
            disabled={pageNum >= numPages}
            className="btn-press flex h-12 w-12 items-center justify-center rounded-xl bg-rose text-white text-lg font-bold shadow-lg shadow-rose/20 active:scale-90 disabled:opacity-30 disabled:shadow-none transition-all sm:h-10 sm:w-10 sm:text-base"
          >
            →
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.4, s - 0.15))}
            className="btn-press flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text-muted text-xl font-bold active:scale-90 transition-all hover:bg-surface-2 hover:text-rose-light sm:h-8 sm:w-8 sm:text-base"
          >
            −
          </button>
          <button
            onClick={fitToWidth}
            className="btn-press h-10 rounded-xl border border-border px-3 font-mono text-xs font-medium text-text-muted active:scale-90 transition-all hover:bg-surface-2 hover:text-rose-light sm:h-8"
          >
            Fit
          </button>
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.15))}
            className="btn-press flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text-muted text-xl font-bold active:scale-90 transition-all hover:bg-surface-2 hover:text-rose-light sm:h-8 sm:w-8 sm:text-base"
          >
            +
          </button>
          <span className="ml-1 font-mono text-xs text-text-dim">
            {Math.round(scale * 100)}%
          </span>
        </div>

        {/* Page slider for mobile */}
        <div className="w-full max-w-xs sm:hidden">
          <input
            type="range"
            min={1}
            max={numPages}
            value={pageNum}
            onChange={(e) => setPageNum(Number(e.target.value))}
            className="w-full h-2"
          />
        </div>
      </div>
    </div>
  );
}