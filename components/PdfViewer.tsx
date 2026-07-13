'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type Props = {
  shareId: string;
};

export default function PdfViewer({ shareId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [scale, setScale] = useState(1.0);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const pageSlotsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Calculate scale to fit width
  const calcScale = useCallback(() => {
    if (!docRef.current) return;
    docRef.current.getPage(1).then((page: any) => {
      const vp = page.getViewport({ scale: 1 });
      // mobile: full width minus padding; desktop: container width
      const w = window.innerWidth;
      const available = w <= 640 ? w - 32 - 16 : Math.min(w * 0.85, 800) - 32;
      const s = available / vp.width;
      setScale(Math.min(Math.max(s, 0.8), 3));
    });
  }, []);

  // Load PDF
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      try {
        const doc = await pdfjsLib.getDocument({
          url: `/api/file-stream/${shareId}`,
          disableAutoFetch: false,
        }).promise;
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
    return () => { cancelled = true; };
  }, [shareId]);

  // Fit scale on ready + resize
  useEffect(() => {
    if (status === 'ready') {
      requestAnimationFrame(calcScale);
    }
  }, [status, calcScale]);

  useEffect(() => {
    if (status !== 'ready') return;
    window.addEventListener('resize', calcScale);
    return () => window.removeEventListener('resize', calcScale);
  }, [status, calcScale]);

  // Render a single page into its slot
  const renderPage = useCallback(async (pageNum: number) => {
    if (!docRef.current) return;
    const slot = pageSlotsRef.current.get(pageNum);
    if (!slot) return;

    // Skip if already rendered
    if (slot.dataset.rendered === 'true') return;

    const page = await docRef.current.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Clear old content and append canvas
    slot.innerHTML = '';
    slot.appendChild(canvas);
    slot.dataset.rendered = 'true';

    setRenderedPages((prev) => {
      const next = new Set(prev);
      next.add(pageNum);
      return next;
    });
  }, [scale]);

  // Re-render all when scale changes
  useEffect(() => {
    if (status !== 'ready' || scale === 0) return;
    // Reset rendered state
    pageSlotsRef.current.forEach((slot) => { slot.dataset.rendered = 'false'; });
    setRenderedPages(new Set());
    // Render visible pages
    for (let i = 1; i <= numPages; i++) {
      renderPage(i);
    }
  }, [scale, status, numPages, renderPage]);

  // Intersection observer for lazy rendering
  useEffect(() => {
    if (status !== 'ready') return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pn = parseInt(entry.target.id.replace('pdf-page-', ''), 10);
            if (!isNaN(pn)) renderPage(pn);
          }
        });
      },
      { rootMargin: '400px 0px' }
    );

    pageSlotsRef.current.forEach((slot) => {
      observerRef.current?.observe(slot);
    });

    return () => { observerRef.current?.disconnect(); };
  }, [status, numPages, renderPage]);

  // Track current page for the page indicator
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (status !== 'ready' || !containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pn = parseInt(entry.target.id.replace('pdf-page-', ''), 10);
            if (!isNaN(pn)) setCurrentPage(pn);
          }
        });
      },
      { rootMargin: '-40% 0px -40% 0px' }
    );

    pageSlotsRef.current.forEach((slot) => observer.observe(slot));
    return () => observer.disconnect();
  }, [status, numPages]);

  const scrollToPage = useCallback((p: number) => {
    const slot = pageSlotsRef.current.get(p);
    if (slot) slot.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

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
    <div className="flex flex-col items-center">
      {/* Scrollable PDF pages */}
      <div
        ref={containerRef}
        className="w-full space-y-2 scroll-smooth"
        style={{ maxHeight: '80vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
          <div
            key={p}
            id={`pdf-page-${p}`}
            ref={(el) => {
              if (el) pageSlotsRef.current.set(p, el);
            }}
            className="w-full flex items-center justify-center bg-surface-2 rounded-lg min-h-[200px]"
            style={{ aspectRatio: `${210 / 297}` }}
          >
            <span className="text-text-dim text-xs font-mono">Page {p}</span>
          </div>
        ))}
      </div>

      {/* Sticky bottom controls */}
      <div className="fixed bottom-16 sm:bottom-4 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className="pointer-events-auto mx-3 mb-2 flex items-center gap-2 rounded-2xl bg-surface-2/95 backdrop-blur-md border border-border px-3 py-2 shadow-2xl">
          <button
            onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="btn-press flex h-9 w-9 items-center justify-center rounded-lg bg-rose text-white text-sm font-bold disabled:opacity-30 transition-all active:scale-90"
          >
            &#8592;
          </button>

          <div className="flex items-center gap-1.5 px-2">
            <input
              type="range"
              min={1}
              max={numPages}
              value={currentPage}
              onChange={(e) => scrollToPage(Number(e.target.value))}
              className="w-24 sm:w-40 h-1.5"
            />
            <span className="font-mono text-[11px] text-text-muted whitespace-nowrap">
              {currentPage}/{numPages}
            </span>
          </div>

          <button
            onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
            className="btn-press flex h-9 w-9 items-center justify-center rounded-lg bg-rose text-white text-sm font-bold disabled:opacity-30 transition-all active:scale-90"
          >
            &#8594;
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          <button
            onClick={calcScale}
            className="btn-press h-9 rounded-lg border border-border px-2.5 font-mono text-[11px] font-medium text-text-muted hover:text-rose-light hover:border-rose/30 transition-all active:scale-95"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={() => {
              setScale((s) => Math.min(3, s + 0.2));
            }}
            className="btn-press flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted text-base font-bold hover:text-rose-light hover:border-rose/30 transition-all active:scale-90"
          >
            +
          </button>
          <button
            onClick={() => {
              setScale((s) => Math.max(0.5, s - 0.2));
            }}
            className="btn-press flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted text-base font-bold hover:text-rose-light hover:border-rose/30 transition-all active:scale-90"
          >
            &minus;
          </button>
        </div>
      </div>
    </div>
  );
}