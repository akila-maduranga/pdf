'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Use react-pdf's bundled pdfjs version (v5) for the worker — NOT the root
// pdfjs-dist v3 which is incompatible.
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
}

type Props = {
  shareId: string;
};

export default function PdfViewer({ shareId }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setStatus('ready');
    // Fit to width after render — use window width for reliability
    requestAnimationFrame(() => {
      const w = window.innerWidth - 48; // 32px page padding + 16px container inner
      setScale(w / 612); // 612 is standard PDF width at scale 1
    });
  }

  function onDocumentLoadError(err: unknown) {
    console.error('PDF load error:', err);
    setStatus('error');
  }

  // Re-fit on resize
  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth - 48;
      setScale(w / 612);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Passive native touch listeners for horizontal swipe page flip.
  // Using { passive: true } lets the browser handle vertical scrolling natively
  // while JS only reads coordinates to detect horizontal swipes.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isSwiping.current = false;
    }
    function onTouchMove(e: TouchEvent) {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - touchStartY.current;
      // Only mark as horizontal swipe if dx clearly dominates
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
        isSwiping.current = true;
      }
    }
    function onTouchEnd(e: TouchEvent) {
      if (!isSwiping.current) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }
      const endX = e.changedTouches[0].clientX;
      const startX = touchStartX.current || endX;
      const diff = endX - startX;
      if (Math.abs(diff) > 60) {
        if (diff < 0) setPageNum((p) => Math.min(numPages, p + 1));
        else setPageNum((p) => Math.max(1, p - 1));
      }
      touchStartX.current = null;
      touchStartY.current = null;
      isSwiping.current = false;
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [numPages]);

  const fitToWidth = useCallback(() => {
    const w = window.innerWidth - 48;
    setScale(w / 612);
  }, []);

  if (status === 'error') {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-text-muted">
        <p className="font-body text-sm">Couldn&apos;t load this file.</p>
        <button
          onClick={() => {
            setStatus('loading');
            // Force re-render by toggling a key-like state
            setScale((s) => s);
          }}
          className="mt-1 rounded-lg bg-rose/10 px-4 py-2 text-xs font-body text-rose-light hover:bg-rose/20 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        className="relative w-full rounded-xl border border-border bg-surface p-2 shadow-lg sm:p-4"
        style={{ touchAction: 'pan-y pinch-zoom' }}
      >
        {status === 'loading' && (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-text-muted">
            <div className="h-10 w-10 animate-spin-slow rounded-full border-4 border-rose/20 border-t-rose" />
            <p className="font-body text-sm">Loading story...</p>
          </div>
        )}

        <Document
          file={`/api/file-stream/${shareId}`}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
        >
          <Page
            pageNumber={pageNum}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="mx-auto block"
          />
        </Document>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3 w-full">
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