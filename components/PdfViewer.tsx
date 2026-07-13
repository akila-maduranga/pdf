'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  shareId: string;
};

export default function PdfViewer({ shareId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [scale, setScale] = useState(1.2);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      try {
        const loadingTask = pdfjsLib.getDocument({
          url: `/api/file-stream/${shareId}`,
          // pdf.js keeps everything in memory rather than writing to disk
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

  if (status === 'loading') {
    return <div className="flex h-96 items-center justify-center text-paper/50">Loading document…</div>;
  }
  if (status === 'error') {
    return (
      <div className="flex h-96 items-center justify-center text-paper/50">
        This document couldn&apos;t be loaded. The link may be invalid.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="no-select overflow-auto rounded border border-line/15 bg-black/20 p-2 sm:p-4">
        <canvas ref={canvasRef} className="max-w-full shadow-lg" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <button
          onClick={() => setPageNum((p) => Math.max(1, p - 1))}
          disabled={pageNum <= 1}
          className="rounded border border-line/20 px-3 py-1.5 text-paper/80 hover:border-brass hover:text-brass disabled:opacity-30"
        >
          ← Prev
        </button>
        <span className="font-mono text-paper/60">
          Page {pageNum} / {numPages}
        </span>
        <button
          onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
          disabled={pageNum >= numPages}
          className="rounded border border-line/20 px-3 py-1.5 text-paper/80 hover:border-brass hover:text-brass disabled:opacity-30"
        >
          Next →
        </button>
        <div className="mx-2 h-4 w-px bg-line/20" />
        <button
          onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
          className="rounded border border-line/20 px-2.5 py-1.5 text-paper/80 hover:border-brass hover:text-brass"
        >
          −
        </button>
        <span className="font-mono text-xs text-paper/50">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale((s) => Math.min(2.4, s + 0.2))}
          className="rounded border border-line/20 px-2.5 py-1.5 text-paper/80 hover:border-brass hover:text-brass"
        >
          +
        </button>
      </div>
    </div>
  );
}
