'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';

interface InlinePdfViewerProps {
  url: string;
  filename: string;
  onClose?: () => void;
}

export default function InlinePdfViewer({ url, filename, onClose }: InlinePdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDocRef = useRef<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        if (typeof window !== 'undefined') {
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Echec du telechargement');
        }
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);

        const loadingTask = pdfjs.getDocument({ data });
        const doc = await loadingTask.promise;

        if (cancelled) return;

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur de chargement');
          setLoading(false);
        }
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [url]);

  // Render current page
  const renderPage = useCallback(async () => {
    const doc = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas) return;

    try {
      const page = await doc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch {
      // Render failed
    }
  }, [currentPage, scale]);

  useEffect(() => {
    if (!loading && numPages > 0) {
      renderPage();
    }
  }, [loading, numPages, renderPage]);

  const goToPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNext = () => setCurrentPage((p) => Math.min(numPages, p + 1));
  const zoomIn = () => setScale((s) => Math.min(3, s + 0.25));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.25));

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50">
        <span className="text-xs text-slate-600 truncate max-w-[200px]" title={filename}>
          {filename}
        </span>

        <div className="flex items-center gap-1">
          <button onClick={goToPrev} disabled={currentPage <= 1} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 tabular-nums px-1">
            {currentPage}/{numPages || '...'}
          </span>
          <button onClick={goToNext} disabled={currentPage >= numPages} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-200 mx-1" />

          <button onClick={zoomOut} disabled={scale <= 0.5} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-slate-400 w-8 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} disabled={scale >= 3} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-200 mx-1" />

          <button onClick={toggleFullscreen} className="p-1.5 rounded hover:bg-slate-200 transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>

          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-slate-100 flex items-start justify-center p-4 min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-sm text-slate-400">Chargement du PDF...</div>
          </div>
        ) : (
          <canvas ref={canvasRef} className="shadow-lg" />
        )}
      </div>
    </div>
  );
}
