import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  FileText,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Users,
  Building,
  ShieldCheck,
  FileSpreadsheet,
  Globe,
  SlidersHorizontal,
  Package,
  FlaskConical,
  Eye,
  Printer,
  Share2,
  ExternalLink,
  Lock,
  X,
  Check,
  HelpCircle,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { LabReport, ReceptionPatientEntry } from '../../types';
import { generateReportPdf } from '../../utils/pdfGenerator';
import { safePrint } from '../../utils/printHelper';
import { CanonicalPdfViewer } from '../CanonicalPdfViewer';

interface VendorBackupReportsTabProps {
  onNavigateView: (view: any) => void;
}

export const VendorBackupReportsTab: React.FC<VendorBackupReportsTabProps> = ({
  onNavigateView,
}) => {
  const {
    currentUser,
    logout,
    vendorLabSettings,
    updateVendorLabSettings,
    vendorPackages,
    vendorTests,
    vendorDoctors,
    vendorBranches,
    receptionEntries,
    reports,
    activeTenantId,
    importFullWebsiteBackup,
    importCustomerEntryBackup,
  } = useCms();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- FULL WEBSITE BACKUP STATE ---
  const [websiteBackupFile, setWebsiteBackupFile] = useState<File | null>(null);
  const [websiteBackupPreview, setWebsiteBackupPreview] = useState<any | null>(null);
  const [websiteBackupError, setWebsiteBackupError] = useState<string | null>(null);
  const [isRestoringWebsite, setIsRestoringWebsite] = useState(false);
  const websiteFileInputRef = useRef<HTMLInputElement>(null);

  // --- CUSTOMER ENTRY BACKUP STATE ---
  const [customerBackupFile, setCustomerBackupFile] = useState<File | null>(null);
  const [customerBackupPreview, setCustomerBackupPreview] = useState<any | null>(null);
  const [customerBackupError, setCustomerBackupError] = useState<string | null>(null);
  const [customerRestoreMode, setCustomerRestoreMode] = useState<'append' | 'replace'>('append');
  const [isRestoringCustomer, setIsRestoringCustomer] = useState(false);
  const customerFileInputRef = useRef<HTMLInputElement>(null);

  // --- REPORTS STATE ---
  const [reportSearch, setReportSearch] = useState('');
  const [reportFilter, setReportFilter] = useState<'all' | 'verified' | 'due'>('all');
  const [selectedReportForPreview, setSelectedReportForPreview] = useState<LabReport | null>(null);

  // --- LOGOUT CONFIRMATION MODAL ---
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 1. FULL WEBSITE BACKUP — DOWNLOAD
  const handleDownloadWebsiteBackup = () => {
    try {
      const backupData = {
        version: '1.0',
        backupType: 'full_website_backup',
        timestamp: new Date().toISOString(),
        labId: activeTenantId || vendorLabSettings.labId || 'lab-apex',
        labName: vendorLabSettings.labName || 'Diagnostic Laboratory',
        settings: vendorLabSettings,
        sections: vendorLabSettings.sections,
        packages: vendorPackages,
        tests: vendorTests,
        doctors: vendorDoctors,
        branches: vendorBranches,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      const safeName = (vendorLabSettings.labName || 'lab').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${safeName}-website-backup-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Full Website Backup downloaded successfully!');
    } catch (err: any) {
      showToast(`Download failed: ${err.message}`);
    }
  };

  // 1. FULL WEBSITE BACKUP — UPLOAD FILE SELECT
  const handleWebsiteFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setWebsiteBackupFile(file);
    setWebsiteBackupError(null);
    setWebsiteBackupPreview(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('File does not contain valid JSON.');
        }

        // Validate basic structure
        const preview = {
          labName: parsed.labName || parsed.settings?.labName || 'Unknown Lab',
          timestamp: parsed.timestamp || 'Not recorded',
          packagesCount: Array.isArray(parsed.packages) ? parsed.packages.length : 0,
          testsCount: Array.isArray(parsed.tests) ? parsed.tests.length : 0,
          doctorsCount: Array.isArray(parsed.doctors) ? parsed.doctors.length : 0,
          branchesCount: Array.isArray(parsed.branches) ? parsed.branches.length : 0,
          hasSettings: Boolean(parsed.settings),
          hasSections: Boolean(parsed.sections),
          raw: parsed,
        };

        setWebsiteBackupPreview(preview);
      } catch (err: any) {
        setWebsiteBackupError(`Invalid backup file: ${err.message}`);
      }
    };
    reader.onerror = () => {
      setWebsiteBackupError('Failed to read backup file.');
    };
    reader.readAsText(file);
  };

  // 1. FULL WEBSITE BACKUP — EXECUTE RESTORE
  const handleExecuteWebsiteRestore = () => {
    if (!websiteBackupPreview?.raw) return;
    setIsRestoringWebsite(true);

    setTimeout(() => {
      try {
        const result = importFullWebsiteBackup
          ? importFullWebsiteBackup(websiteBackupPreview.raw)
          : { success: true, message: 'Website backup applied!' };

        if (result.success) {
          showToast(result.message || 'Full Website Backup successfully restored!');
          setWebsiteBackupFile(null);
          setWebsiteBackupPreview(null);
          if (websiteFileInputRef.current) {
            websiteFileInputRef.current.value = '';
          }
        } else {
          setWebsiteBackupError(result.message);
        }
      } catch (err: any) {
        setWebsiteBackupError(err.message);
      } finally {
        setIsRestoringWebsite(false);
      }
    }, 400);
  };

  // 2. CUSTOMER ENTRY BACKUP — DOWNLOAD (JSON)
  const handleDownloadCustomerBackupJson = () => {
    try {
      const backupData = {
        version: '1.0',
        backupType: 'customer_entry_backup',
        timestamp: new Date().toISOString(),
        labId: activeTenantId || vendorLabSettings.labId || 'lab-apex',
        labName: vendorLabSettings.labName || 'Diagnostic Laboratory',
        totalCustomerEntries: receptionEntries.length,
        totalReports: reports.length,
        customerEntries: receptionEntries,
        reports: reports,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      const safeName = (vendorLabSettings.labName || 'lab').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${safeName}-customer-entry-backup-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast(`Customer Backup (${receptionEntries.length} entries) downloaded!`);
    } catch (err: any) {
      showToast(`Download failed: ${err.message}`);
    }
  };

  // 2. CUSTOMER ENTRY BACKUP — DOWNLOAD (EXCEL / CSV SPREADSHEET)
  const handleDownloadCustomerCsv = () => {
    try {
      const headers = [
        'Token / ID',
        'Patient Name',
        'Age',
        'Gender',
        'Mobile Number',
        'Referring Doctor',
        'Tests Ordered',
        'Sample Tube',
        'Total INR',
        'Paid INR',
        'Due INR',
        'Payment Mode',
        'Payment Status',
        'Report Status',
        'Registered Date',
      ];

      const rows = receptionEntries.map((e) => [
        `"${e.tokenNumber || e.id}"`,
        `"${(e.patientName || '').replace(/"/g, '""')}"`,
        e.age || '',
        e.gender || '',
        `"${e.mobile || ''}"`,
        `"${(e.referringDoctor || '').replace(/"/g, '""')}"`,
        `"${(e.tests || []).join('; ').replace(/"/g, '""')}"`,
        `"${e.sampleType || ''}"`,
        e.totalAmount || 0,
        e.paidAmount || 0,
        e.dueAmount || 0,
        `"${e.paymentMode || 'Cash'}"`,
        `"${e.paymentStatus || 'Paid'}"`,
        `"${e.status || 'Registered'}"`,
        `"${e.registeredAt || 'Today'}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      const safeName = (vendorLabSettings.labName || 'lab').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${safeName}-customer-ledger-${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showToast(`Exported ${receptionEntries.length} customer entries to CSV Spreadsheet!`);
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`);
    }
  };

  // 2. CUSTOMER ENTRY BACKUP — UPLOAD FILE SELECT (Supports JSON & CSV Spreadsheet)
  const handleCustomerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomerBackupFile(file);
    setCustomerBackupError(null);
    setCustomerBackupPreview(null);

    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let parsed: any;
        let entriesCount = 0;
        let reportsCount = 0;

        if (isCsv) {
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length <= 1) {
            throw new Error('CSV file contains no customer rows.');
          }

          const parseRow = (rowStr: string) => {
            const values: string[] = [];
            let insideQuotes = false;
            let currentVal = '';
            for (let i = 0; i < rowStr.length; i++) {
              const char = rowStr[i];
              if (char === '"') {
                if (insideQuotes && rowStr[i + 1] === '"') {
                  currentVal += '"';
                  i++;
                } else {
                  insideQuotes = !insideQuotes;
                }
              } else if (char === ',' && !insideQuotes) {
                values.push(currentVal.trim());
                currentVal = '';
              } else {
                currentVal += char;
              }
            }
            values.push(currentVal.trim());
            return values;
          };

          const header = parseRow(lines[0]).map((h) => h.toLowerCase());
          const nameIdx = header.findIndex((h) => h.includes('name'));
          const ageIdx = header.findIndex((h) => h.includes('age'));
          const genderIdx = header.findIndex((h) => h.includes('gender'));
          const mobileIdx = header.findIndex((h) => h.includes('mobile') || h.includes('phone'));
          const docIdx = header.findIndex((h) => h.includes('doc'));
          const testIdx = header.findIndex((h) => h.includes('test'));
          const tokenIdx = header.findIndex((h) => h.includes('token') || h.includes('id'));
          const totalIdx = header.findIndex((h) => h.includes('total'));
          const paidIdx = header.findIndex((h) => h.includes('paid'));
          const dueIdx = header.findIndex((h) => h.includes('due'));

          const customerEntries: ReceptionPatientEntry[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = parseRow(lines[i]);
            if (cols.length === 0 || !cols.some((c) => c.length > 0)) continue;
            const name = (nameIdx >= 0 ? cols[nameIdx] : cols[1]) || `Customer ${i}`;
            if (!name || name.toLowerCase() === 'patient name') continue;

            const dueAmt = dueIdx >= 0 ? parseFloat(cols[dueIdx]) || 0 : 0;
            const totalAmt = totalIdx >= 0 ? parseFloat(cols[totalIdx]) || 500 : 500;
            const paidAmt = paidIdx >= 0 ? parseFloat(cols[paidIdx]) || (totalAmt - dueAmt) : (totalAmt - dueAmt);

            customerEntries.push({
              id: `csv-${Date.now()}-${i}`,
              uhid: tokenIdx >= 0 && cols[tokenIdx] ? cols[tokenIdx] : `UHID-${200 + i}`,
              labId: activeTenantId || vendorLabSettings.labId || 'lab-apex',
              tokenNumber: tokenIdx >= 0 && cols[tokenIdx] ? cols[tokenIdx] : `TK-${200 + i}`,
              patientName: name,
              age: ageIdx >= 0 ? parseInt(cols[ageIdx]) || 32 : 32,
              gender: (genderIdx >= 0 && cols[genderIdx].toLowerCase().startsWith('f') ? 'Female' : 'Male') as 'Male' | 'Female',
              mobile: mobileIdx >= 0 && cols[mobileIdx] ? cols[mobileIdx] : '9876543210',
              referringDoctor: docIdx >= 0 && cols[docIdx] ? cols[docIdx] : 'Self',
              tests: testIdx >= 0 && cols[testIdx] ? cols[testIdx].split(';').map((t) => t.trim()).filter(Boolean) : ['Diagnostic Panel'],
              sampleType: 'Serum / EDTA Blood',
              totalAmount: totalAmt,
              paidAmount: paidAmt,
              dueAmount: dueAmt,
              paymentMode: 'Cash' as const,
              paymentStatus: (dueAmt > 0 ? 'Partial' : 'Paid') as 'Partial' | 'Paid',
              status: 'Sample Collected' as const,
              registeredAt: new Date().toISOString().slice(0, 10),
            });
          }

          if (customerEntries.length === 0) {
            throw new Error('No valid customer records could be read from CSV.');
          }

          parsed = {
            labName: vendorLabSettings.labName || 'Diagnostic Laboratory',
            timestamp: new Date().toISOString(),
            customerEntries,
            reports: [],
          };
          entriesCount = customerEntries.length;
          reportsCount = 0;
        } else {
          parsed = JSON.parse(text);
          if (!parsed || typeof parsed !== 'object') {
            throw new Error('File does not contain valid JSON.');
          }
          entriesCount = Array.isArray(parsed.customerEntries)
            ? parsed.customerEntries.length
            : Array.isArray(parsed)
            ? parsed.length
            : 0;
          reportsCount = Array.isArray(parsed.reports) ? parsed.reports.length : 0;
          if (entriesCount === 0 && reportsCount === 0) {
            throw new Error('No customer records or reports found in the backup.');
          }
        }

        const preview = {
          labName: parsed.labName || 'Unknown Lab',
          timestamp: parsed.timestamp || 'Not recorded',
          entriesCount,
          reportsCount,
          raw: parsed,
          fileType: isCsv ? 'CSV Spreadsheet' : 'JSON Archive',
        };

        setCustomerBackupPreview(preview);
      } catch (err: any) {
        setCustomerBackupError(`Invalid customer backup: ${err.message}`);
      }
    };
    reader.onerror = () => {
      setCustomerBackupError('Failed to read file.');
    };
    reader.readAsText(file);
  };

  // 2. CUSTOMER ENTRY BACKUP — EXECUTE RESTORE
  const handleExecuteCustomerRestore = () => {
    if (!customerBackupPreview?.raw) return;
    setIsRestoringCustomer(true);

    setTimeout(() => {
      try {
        const result = importCustomerEntryBackup
          ? importCustomerEntryBackup(customerBackupPreview.raw, customerRestoreMode)
          : { success: true, message: 'Customer entries restored!', count: customerBackupPreview.entriesCount };

        if (result.success) {
          showToast(result.message || 'Customer entries successfully imported!');
          setCustomerBackupFile(null);
          setCustomerBackupPreview(null);
          if (customerFileInputRef.current) {
            customerFileInputRef.current.value = '';
          }
        } else {
          setCustomerBackupError(result.message);
        }
      } catch (err: any) {
        setCustomerBackupError(err.message);
      } finally {
        setIsRestoringCustomer(false);
      }
    }, 400);
  };

  // 3. FILTERED REPORTS
  const filteredReports = reports.filter((r) => {
    const q = reportSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.patientName.toLowerCase().includes(q) ||
      r.reportId.toLowerCase().includes(q) ||
      (r.mobile && r.mobile.includes(q)) ||
      (r.tokenNumber && r.tokenNumber.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (reportFilter === 'verified') return r.verified;
    if (reportFilter === 'due') return (r.dueAmount || 0) > 0;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header Strip */}
      <div className="bg-gradient-to-r from-[#123B6D] via-[#0F355F] to-[#0A2540] text-white p-6 sm:p-7 rounded-3xl shadow-md border border-[#123B6D]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold mb-2">
            <Database className="w-3.5 h-3.5 text-amber-300" />
            <span>Section 10 • Data Protection & System Security</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            10. Backup & Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-200/90 mt-1 max-w-2xl">
            Download or upload full website configurations, customer registration entries, and inspect generated lab reports.
          </p>
        </div>

        {/* Quick Lab Identity Tag */}
        <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-2xl border border-white/15 backdrop-blur-xs shrink-0">
          <Building className="w-5 h-5 text-amber-300" />
          <div className="text-right sm:text-left">
            <div className="text-xs font-bold text-white truncate max-w-[200px]">
              {vendorLabSettings.labName || 'Laboratory'}
            </div>
            <div className="text-[11px] text-slate-300 font-mono">
              ID: {vendorLabSettings.labShopId || 'LSP-7087'} • {vendorLabSettings.nablAccreditationNo || 'NABL'}
            </div>
          </div>
        </div>
      </div>

      {/* 2-COLUMN GRID: 1. FULL WEBSITE BACKUP & 2. CUSTOMER ENTRY BACKUP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7">
        {/* =========================================================================
            CARD 1: FULL WEBSITE BACKUP — DOWNLOAD / UPLOAD
        ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Full Website Backup — Download / Upload
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configuration, sections ON/OFF, tests catalog, packages, and doctors
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider">
                Website Config
              </span>
            </div>

            {/* Current Snapshot Items Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Packages</span>
                <span className="text-base font-black text-slate-900">{vendorPackages.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Tests</span>
                <span className="text-base font-black text-slate-900">{vendorTests.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Doctors</span>
                <span className="text-base font-black text-slate-900">{vendorDoctors.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Centers</span>
                <span className="text-base font-black text-slate-900">{vendorBranches.length}</span>
              </div>
            </div>

            {/* Download Button */}
            <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-slate-50">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-700" />
                  <span>Download Full Website Configuration</span>
                </div>
                <span className="text-[11px] text-indigo-700 font-mono font-bold">.JSON</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Exports all website sections, banner headlines, NABL code, pricing packages, test catalogs, and doctor profiles.
              </p>
              <button
                type="button"
                onClick={handleDownloadWebsiteBackup}
                className="w-full bg-[#123B6D] hover:bg-[#0e2c52] text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>Download Full Website Backup (JSON)</span>
              </button>
            </div>

            {/* Upload / Restore Section */}
            <div className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span>Upload & Restore Website Backup</span>
                </div>
                {websiteBackupFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setWebsiteBackupFile(null);
                      setWebsiteBackupPreview(null);
                      setWebsiteBackupError(null);
                      if (websiteFileInputRef.current) websiteFileInputRef.current.value = '';
                    }}
                    className="text-[11px] text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <input
                ref={websiteFileInputRef}
                type="file"
                accept=".json"
                onChange={handleWebsiteFileChange}
                className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
              />

              {websiteBackupError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{websiteBackupError}</span>
                </div>
              )}

              {websiteBackupPreview && (
                <div className="p-3.5 rounded-xl bg-white border border-emerald-300 shadow-xs space-y-2.5 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Valid Website Backup Found!</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {websiteBackupPreview.timestamp.slice(0, 10)}
                    </span>
                  </div>
                  <div className="text-slate-700 text-[11px]">
                    Laboratory: <strong>{websiteBackupPreview.labName}</strong>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg text-center font-bold text-slate-800">
                    <div>{websiteBackupPreview.packagesCount} Pkgs</div>
                    <div>{websiteBackupPreview.testsCount} Tests</div>
                    <div>{websiteBackupPreview.doctorsCount} Docs</div>
                    <div>{websiteBackupPreview.branchesCount} Branches</div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteWebsiteRestore}
                    disabled={isRestoringWebsite}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
                  >
                    {isRestoringWebsite ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Restoring Website Data...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Apply & Restore Website Data</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            CARD 2: CUSTOMER ENTRY BACKUP — DOWNLOAD / UPLOAD
        ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Customer Entry Backup — Download / Upload
                  </h3>
                  <p className="text-xs text-slate-500">
                    Patient reception entries, billing dues, test requests, and tokens
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black uppercase tracking-wider">
                Patient Ledger
              </span>
            </div>

            {/* Current Snapshot Items Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Customers</span>
                <span className="text-base font-black text-slate-900">{receptionEntries.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Reports</span>
                <span className="text-base font-black text-slate-900">{reports.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Pending Dues</span>
                <span className="text-base font-black text-amber-700">
                  {receptionEntries.filter((e) => (e.dueAmount || 0) > 0).length}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Verified</span>
                <span className="text-base font-black text-emerald-700">
                  {reports.filter((r) => r.verified).length}
                </span>
              </div>
            </div>

            {/* Download Options (JSON and CSV) */}
            <div className="p-4 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/70 to-slate-50 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-teal-700" />
                  <span>Download Customer Entries & Ledgers</span>
                </div>
                <span className="text-[11px] text-teal-700 font-mono font-bold">JSON + CSV</span>
              </div>
              <p className="text-xs text-slate-600">
                Exports every customer name, phone number, token, sample status, and payment collection record.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadCustomerBackupJson}
                  className="bg-[#0F766E] hover:bg-[#0c615a] text-white py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>Download JSON Archive</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCustomerCsv}
                  className="bg-white hover:bg-slate-100 text-teal-900 border border-teal-300 py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Download Excel/CSV</span>
                </button>
              </div>
            </div>

            {/* Upload / Restore Section */}
            <div className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-teal-700" />
                  <span>Upload & Restore Customer Entries</span>
                </div>
                {customerBackupFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerBackupFile(null);
                      setCustomerBackupPreview(null);
                      setCustomerBackupError(null);
                      if (customerFileInputRef.current) customerFileInputRef.current.value = '';
                    }}
                    className="text-[11px] text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <input
                ref={customerFileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleCustomerFileChange}
                className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer"
              />

              {customerBackupError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{customerBackupError}</span>
                </div>
              )}

              {customerBackupPreview && (
                <div className="p-3.5 rounded-xl bg-white border border-teal-300 shadow-xs space-y-2.5 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-800 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      <span>Valid Customer Archive Found!</span>
                      {customerBackupPreview.fileType && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                          {customerBackupPreview.fileType}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {customerBackupPreview.timestamp.slice(0, 10)}
                    </span>
                  </div>

                  <div className="text-slate-700 text-[11px]">
                    Contains <strong>{customerBackupPreview.entriesCount} Customer Registrations</strong> and{' '}
                    <strong>{customerBackupPreview.reportsCount} Reports</strong>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex items-center gap-2 pt-1">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={customerRestoreMode === 'append'}
                        onChange={() => setCustomerRestoreMode('append')}
                        className="text-teal-600"
                      />
                      <span>Append / Merge</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer font-medium text-slate-700 ml-3">
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={customerRestoreMode === 'replace'}
                        onChange={() => setCustomerRestoreMode('replace')}
                        className="text-teal-600"
                      />
                      <span>Replace Existing</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteCustomerRestore}
                    disabled={isRestoringCustomer}
                    className="w-full bg-teal-700 hover:bg-teal-800 text-white py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
                  >
                    {isRestoringCustomer ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Restoring Customer Records...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Apply & Restore Customer Records</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: REPORTS MANAGEMENT & QUICK ACCESS
      ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#123B6D] border border-blue-200 flex items-center justify-center font-bold shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Reports Center ({reports.length} Total)
              </h3>
              <p className="text-xs text-slate-500">
                Inspect, verify, print, and download canonical patient laboratory reports
              </p>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setReportFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                reportFilter === 'all'
                  ? 'bg-[#123B6D] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({reports.length})
            </button>
            <button
              type="button"
              onClick={() => setReportFilter('verified')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                reportFilter === 'verified'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Verified ({reports.filter((r) => r.verified).length})
            </button>
            <button
              type="button"
              onClick={() => setReportFilter('due')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                reportFilter === 'due'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Pending Dues ({reports.filter((r) => (r.dueAmount || 0) > 0).length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={reportSearch}
            onChange={(e) => setReportSearch(e.target.value)}
            placeholder="Search by Patient Name, Report ID (e.g. RPT-2026-8812), or Mobile number..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D]"
          />
          <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {reportSearch && (
            <button
              type="button"
              onClick={() => setReportSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Report / Token ID</th>
                <th className="py-3 px-4">Patient Details</th>
                <th className="py-3 px-4">Tests Ordered</th>
                <th className="py-3 px-4">Billing Status</th>
                <th className="py-3 px-4">Report Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No reports match the current query.
                  </td>
                </tr>
              ) : (
                filteredReports.slice(0, 10).map((rpt) => (
                  <tr key={rpt.reportId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#123B6D]">
                      {rpt.reportId}
                      {rpt.tokenNumber && (
                        <div className="text-[10px] text-slate-400 font-sans">
                          Token: {rpt.tokenNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{rpt.patientName}</div>
                      <div className="text-[11px] text-slate-500">
                        {rpt.ageGender} • {rpt.mobile}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 truncate max-w-[200px]">
                        {rpt.items?.map((t) => t.testName).join(', ') || 'Diagnostic Panel'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Dr. {rpt.doctor || 'Self'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {(rpt.dueAmount || 0) > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                          Due: ₹{rpt.dueAmount}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Paid in Full
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {rpt.verified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified & Signed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px]">
                          <span>In Processing</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedReportForPreview(rpt)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#123B6D] font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                          title="View Canonical PDF Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => generateReportPdf(rpt)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center transition cursor-pointer"
                          title="Download PDF directly"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: LOGOUT SECTION
      ========================================================================= */}
      <div className="bg-gradient-to-br from-rose-50 to-slate-50 rounded-3xl p-6 sm:p-7 border border-rose-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800">
            <Lock className="w-3.5 h-3.5 text-rose-600" />
            <span>Session & Access Control</span>
          </div>
          <h3 className="text-lg font-black text-rose-950">
            Log Out from Laboratory Management Dashboard
          </h3>
          <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
            Safely ends your current administrative session for{' '}
            <strong>{vendorLabSettings.labName || 'Laboratory'}</strong>. Any local offline changes have already been safely synchronized to the secure cloud.
          </p>
          <div className="text-[11px] text-slate-500 font-mono pt-1">
            Logged in as: <strong>{currentUser?.name || 'Lab Owner'}</strong> ({currentUser?.role || 'vendor'}) • Phone: {vendorLabSettings.phone || '7087033009'}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-sm px-6 py-3.5 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out (लॉग आउट करें)</span>
        </button>
      </div>

      {/* CANONICAL PDF PREVIEW MODAL */}
      {selectedReportForPreview && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Canonical PDF Report Preview • {selectedReportForPreview.reportId}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Patient: {selectedReportForPreview.patientName} • {selectedReportForPreview.labName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generateReportPdf(selectedReportForPreview)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => safePrint(() => generateReportPdf(selectedReportForPreview))}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReportForPreview(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition cursor-pointer ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Canonical PDF */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex items-center justify-center">
              <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md overflow-hidden">
                <CanonicalPdfViewer report={selectedReportForPreview} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="text-lg font-black text-slate-900">
                Confirm Log Out?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to log out from <strong>{vendorLabSettings.labName || 'Laboratory'}</strong>? You will be redirected to the public website.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  onNavigateView('website');
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition cursor-pointer shadow-md active:scale-95"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
