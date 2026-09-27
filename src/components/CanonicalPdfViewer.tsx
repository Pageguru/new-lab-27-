import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { LabReport } from '../types';
import { getCanonicalReportPdfBlob } from '../utils/pdfGenerator';
import { renderPdfPages, RenderedPdfPage } from '../utils/canonicalPdfRenderer';

interface CanonicalPdfViewerProps {
  report: LabReport;
  isPaymentPending?: boolean;
  activeDueAmount?: number;
  onPayOnline?: () => void;
  onClose?: () => void;
  className?: string;
  autoRenderNativeEmbed?: boolean;
  title?: string;
}

export const CanonicalPdfViewer: React.FC<CanonicalPdfViewerProps> = ({
  report,
  className = '',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderedPages, setRenderedPages] = useState<RenderedPdfPage[]>([]);

  // Generate canonical PDF bytes and render pages
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadPdf() {
      try {
        const canonical = await getCanonicalReportPdfBlob(report);
        if (!isMounted) return;

        // Render PDF pages using pdfjs-dist at high retina resolution
        const pages = await renderPdfPages(canonical.arrayBuffer, 2.0);
        if (!isMounted) return;

        setRenderedPages(pages);
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to render canonical PDF:', err);
        if (isMounted) {
          setError('Could not render PDF preview directly.');
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [report.reportId, report.reportedAt]);

  return (
    <div
      className={`bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col w-full ${className}`}
    >
      {/* PURE CANONICAL REPORT PRESENTATION (ZERO BUTTONS INSIDE THIS DARK BOX - ONLY FULL DISPLAY REPORT) */}
      <div className="flex-1 overflow-auto bg-slate-950 p-2 sm:p-6 flex flex-col items-center justify-start min-h-[500px]">
        {loading && (
          <div className="flex flex-col items-center justify-center py-28 text-slate-400 space-y-3">
            <div className="w-10 h-10 rounded-full border-3 border-slate-700 border-t-emerald-400 animate-spin" />
            <div className="text-xs text-slate-300 font-medium">Loading Diagnostic Report...</div>
          </div>
        )}

        {error && (
          <div className="max-w-md my-auto bg-rose-950/50 border border-rose-800 rounded-xl p-4 text-center text-xs text-rose-200 space-y-2">
            <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
            <div className="font-bold text-rose-100">Unable to load report</div>
            <p className="text-rose-300">{error}</p>
          </div>
        )}

        {/* PURE CANONICAL REPORT SHEET(S) */}
        {!loading && !error && renderedPages.length > 0 && (
          <div className="w-full flex flex-col items-center gap-6 py-1">
            {renderedPages.map((page) => (
              <div
                key={page.pageNumber}
                className="bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-700/60 w-full max-w-[850px] transition-all select-none"
              >
                <img
                  src={page.dataUrl}
                  alt={`Diagnostic Report ${report.reportId} Page ${page.pageNumber}`}
                  className="w-full h-auto block"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
