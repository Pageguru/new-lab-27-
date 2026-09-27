import React, { useState } from 'react';
import {
  X,
  Edit3,
  Trash2,
  ExternalLink,
  Download,
  Printer,
  MessageSquare,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { LabReport } from '../types';
import { CanonicalPdfViewer } from './CanonicalPdfViewer';
import { downloadReportPdf, printCanonicalReportPdf } from '../utils/pdfGenerator';

interface ReportDetailModalProps {
  report: LabReport | null;
  isOpen: boolean;
  onClose: () => void;
  onEditReport?: (report: LabReport) => void;
  onDeleteReport?: (report: LabReport) => void;
  onOpenPatientPortal?: (reportId: string, mobile: string) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  isOpen,
  onClose,
  onEditReport,
  onDeleteReport,
  onOpenPatientPortal,
}) => {
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  if (!isOpen || !report) return null;

  const handleEdit = () => {
    onClose();
    if (onEditReport) {
      onEditReport(report);
    }
  };

  const handleDelete = () => {
    if (onDeleteReport) {
      onDeleteReport(report);
    }
  };

  const handleOpenPortal = () => {
    if (onOpenPatientPortal) {
      onClose();
      onOpenPatientPortal(report.reportId, report.mobile);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadReportPdf(report);
      setDownloadSuccessToast('Report PDF downloaded successfully');
      setTimeout(() => setDownloadSuccessToast(null), 3500);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handlePrint = async () => {
    try {
      await printCanonicalReportPdf(report);
      setDownloadSuccessToast('Print job initiated');
      setTimeout(() => setDownloadSuccessToast(null), 3500);
    } catch (err) {
      console.error('Print error:', err);
    }
  };

  const handleShareWhatsApp = () => {
    const cleanPhone = (report.mobile || '').replace(/\D/g, '');
    const currentOrigin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://labreport.online';
    const reportLink = `${currentOrigin}/?report=${encodeURIComponent(report.reportId)}`;
    const msg = `Namaste ${report.patientName},\nYour diagnostic test report (${report.reportId}) from ${report.labName || 'Apex Diagnostic Laboratory'} is ready.\nView & Download verified PDF: ${reportLink}\nThank you!`;
    const targetUrl = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Management Header */}
        <div className="bg-[#0B2545] border-b border-slate-700 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="font-extrabold text-xs sm:text-sm">
              Diagnostic Report • ID: {report.reportId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPatientPortal && (
              <button
                type="button"
                onClick={handleOpenPortal}
                className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="View in Patient Portal"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Patient Portal View</span>
              </button>
            )}

            {onEditReport && (
              report.sentToReceptionDesk ? (
                <div
                  className="bg-slate-850 text-slate-400 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed select-none"
                  title="Reports can be edited only before clicking the Send to Reception Desk button. Once sent, editing is disabled."
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Editing Locked</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Edit Report parameters or patient info"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Report</span>
                </button>
              )
            )}

            {onDeleteReport && (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Delete this report"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CANONICAL REPORT PDF PREVIEW (PURE REPORT DISPLAY - NO BUTTONS INSIDE THE BOX) */}
        <div className="flex-1 overflow-hidden p-2 sm:p-4 bg-slate-950 flex flex-col">
          <CanonicalPdfViewer
            report={report}
            onClose={onClose}
            className="flex-1 border-0 rounded-xl"
            title={`NABL CANONICAL REPORT • ${report.reportId}`}
          />
        </div>

        {/* ACTION BUTTONS (STRICTLY BELOW THE REPORT) */}
        <div className="bg-white border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-bold text-slate-800">
              {report.patientName} <span className="font-normal text-slate-500">({report.ageGender})</span>
            </span>
            {downloadSuccessToast && (
              <span className="flex items-center gap-1 text-emerald-700 font-bold ml-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {downloadSuccessToast}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* 1. Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="bg-[#0F766E] hover:bg-[#0d655e] text-white px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
              title="Download Official Medical Report PDF"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>Download PDF</span>
            </button>

            {/* 2. Print Report Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
              title="Print Report on A4"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Print Report</span>
            </button>

            {/* 3. Share on WhatsApp Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
              title="Share report on WhatsApp"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border border-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
