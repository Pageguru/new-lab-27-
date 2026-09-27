import React, { useState } from 'react';
import {
  LayoutDashboard,
  ExternalLink,
  Users,
  FlaskConical,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  TrendingUp,
  CreditCard,
  QrCode,
  CalendarCheck,
  Send,
  Building2,
  RefreshCw,
  Sparkles,
  Phone,
  Search,
  Maximize2,
  ChevronRight,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { AppView } from '../../types';
import { ReceptionEntryDashboard } from '../ReceptionEntryDashboard';
import { TechnicianDepartmentDashboard } from '../technician/TechnicianDepartmentDashboard';

interface VendorDashboardsTabProps {
  initialSubTab?: 'reception' | 'technician' | 'overview';
  activeSubTab?: 'reception' | 'technician' | 'overview';
  onSubTabChange?: (tab: 'reception' | 'technician' | 'overview') => void;
  onNavigateView: (view: AppView) => void;
}

export const VendorDashboardsTab: React.FC<VendorDashboardsTabProps> = ({
  initialSubTab = 'reception',
  activeSubTab: externalSubTab,
  onSubTabChange,
  onNavigateView,
}) => {
  const {
    receptionEntries,
    reports,
    vendorBookings,
    vendorLabSettings,
    currentUser,
    vendorTests,
  } = useCms();

  const [internalSubTab, setInternalSubTab] = useState<'reception' | 'technician' | 'overview'>(initialSubTab);
  const currentSubTab = externalSubTab || internalSubTab;

  const handleSubTabChange = (tab: 'reception' | 'technician' | 'overview') => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setInternalSubTab(tab);
    }
  };

  const labName = vendorLabSettings?.labName || 'Apex Diagnostic & Clinical Pathology';

  // --- RECEPTION METRICS ---
  const totalTokensToday = receptionEntries.length;
  const waitingPatients = receptionEntries.filter((e) => e.status === 'Waiting').length;
  const inLabSamples = receptionEntries.filter((e) => e.status === 'In Lab' || e.status === 'Sample Collected').length;
  const readyReports = receptionEntries.filter((e) => e.status === 'Report Ready').length;

  const totalCollectedToday = receptionEntries.reduce((acc, e) => acc + (e.paidAmount || 0), 0);
  const totalDuePending = receptionEntries.reduce((acc, e) => acc + (e.dueAmount || 0), 0);
  const cashCollected = receptionEntries.reduce((acc, e) => acc + (e.paymentMode === 'Cash' ? (e.paidAmount || 0) : 0), 0);
  const upiCollected = receptionEntries.reduce((acc, e) => acc + (e.paymentMode === 'UPI' ? (e.paidAmount || 0) : 0), 0);

  // Transferred bookings from Form > Booking Submissions to Reception
  const transferredBookings = vendorBookings.filter((b) => b.transferredToReception);

  // --- TECHNICIAN METRICS ---
  const activeReportsCount = reports.filter((r) => !r.isCancelled).length;
  const cancelledReportsCount = reports.filter((r) => !!r.isCancelled).length;

  return (
    <div className="space-y-4">
      {/* 1. TOP HEADER & DASHBOARD SWITCHER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                5. Department Dashboards
              </span>
              <span className="text-xs text-slate-500 font-medium">
                • {labName}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#123B6D] mt-1 flex items-center gap-2">
              <span>Reception & Technician Dashboards</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Access the operational counter for walk-in patient token billing and the diagnostic testing worklist.
            </p>
          </div>

          {/* Quick 1-Click Launch Full-Screen Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigateView('reception_dashboard')}
              className="px-3 py-2 rounded-xl text-xs font-black bg-teal-600 hover:bg-teal-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer border border-teal-500 active:scale-95"
              title="Launch Reception Dashboard Full Screen"
            >
              <span>🖥️</span>
              <span>Full-Screen Reception Desk</span>
              <Maximize2 className="w-3 h-3 text-teal-200 ml-0.5" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateView('technician_dashboard')}
              className="px-3 py-2 rounded-xl text-xs font-black bg-[#123B6D] hover:bg-[#0e2c52] text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer border border-[#0e2c52] active:scale-95"
              title="Launch Technician Department Dashboard Full Screen"
            >
              <span>🔬</span>
              <span>Full-Screen Technician Console</span>
              <Maximize2 className="w-3 h-3 text-amber-300 ml-0.5" />
            </button>
          </div>
        </div>

        {/* 2. SUB-TABS SELECTOR */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleSubTabChange('reception')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                currentSubTab === 'reception'
                  ? 'bg-teal-600 text-white shadow-xs font-black'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>🖥️</span>
              <span>Reception Dashboard</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                  currentSubTab === 'reception'
                    ? 'bg-white/20 text-white'
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                {totalTokensToday} Tokens
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSubTabChange('technician')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                currentSubTab === 'technician'
                  ? 'bg-[#123B6D] text-white shadow-xs font-black'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>🔬</span>
              <span>Technician Dashboard</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                  currentSubTab === 'technician'
                    ? 'bg-white/20 text-white'
                    : 'bg-indigo-100 text-indigo-800'
                }`}
              >
                {activeReportsCount} Reports
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSubTabChange('overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                currentSubTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-xs font-black'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>📊</span>
              <span>Overview & KPIs</span>
            </button>
          </div>

          {/* Quick Counter Summary Badges */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1">
              <span>Today Collection:</span>
              <strong className="font-extrabold text-emerald-900 font-mono">₹{totalCollectedToday.toLocaleString('en-IN')}</strong>
            </span>
            {totalDuePending > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center gap-1">
                <span>Due:</span>
                <strong className="font-extrabold text-amber-900 font-mono">₹{totalDuePending.toLocaleString('en-IN')}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. SUB-TAB VIEW: OVERVIEW / COMMAND CENTER */}
      {currentSubTab === 'overview' && (
        <div className="space-y-4">
          {/* Top Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Reception Tokens</span>
                <span className="text-teal-600 text-base">🖥️</span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{totalTokensToday}</div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-teal-700 font-bold">{waitingPatients} Waiting</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">{readyReports} Ready</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Counter Revenue</span>
                <span className="text-emerald-600 text-base">💰</span>
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                ₹{totalCollectedToday.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Cash: ₹{cashCollected.toLocaleString('en-IN')} • UPI: ₹{upiCollected.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Technician Lab Worklist</span>
                <span className="text-indigo-600 text-base">🔬</span>
              </div>
              <div className="text-2xl font-black text-indigo-700 font-mono">{inLabSamples}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Samples undergoing test analyzer evaluation
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Transferred Online Bookings</span>
                <span className="text-amber-600 text-base">📲</span>
              </div>
              <div className="text-2xl font-black text-amber-700 font-mono">{transferredBookings.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Website form bookings synced to reception
              </div>
            </div>
          </div>

          {/* Quick Launch Cards for Both Desks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reception Desk Quick Card */}
            <div className="bg-gradient-to-br from-teal-50/80 to-white p-5 rounded-2xl border border-teal-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🖥️</span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">Reception Entry & Billing Desk</h3>
                      <p className="text-xs text-slate-500">Patient check-in, token generation, thermal slips</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-teal-100 text-teal-800">
                    Active Desk
                  </span>
                </div>
                <div className="space-y-2 mt-3 pt-3 border-t border-teal-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Patient Token Queue:</span>
                    <strong className="text-slate-900">{totalTokensToday} Patients</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cash / UPI Split:</span>
                    <strong className="text-slate-900 font-mono">
                      ₹{cashCollected} / ₹{upiCollected}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Pending Dues to Settle:</span>
                    <strong className="text-amber-700 font-mono">
                      ₹{totalDuePending.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-teal-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSubTabChange('reception')}
                  className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Open Reception Desk Tab</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateView('reception_dashboard')}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  title="Full Screen Desk"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Full Screen</span>
                </button>
              </div>
            </div>

            {/* Technician Console Quick Card */}
            <div className="bg-gradient-to-br from-indigo-50/80 to-white p-5 rounded-2xl border border-indigo-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔬</span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">Technician Department Console</h3>
                      <p className="text-xs text-slate-500">Sample testing, normal ranges, reports & sign-off</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800">
                    Active Console
                  </span>
                </div>
                <div className="space-y-2 mt-3 pt-3 border-t border-indigo-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Active Tested Reports:</span>
                    <strong className="text-slate-900">{activeReportsCount} Reports</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>In-Lab Samples Waiting:</span>
                    <strong className="text-indigo-700">{inLabSamples} Samples</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cancelled Reports (With Audit Reason):</span>
                    <strong className="text-slate-600">{cancelledReportsCount}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-indigo-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSubTabChange('technician')}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Open Technician Console Tab</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateView('technician_dashboard')}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  title="Full Screen Console"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Full Screen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUB-TAB VIEW: RECEPTION DASHBOARD */}
      {currentSubTab === 'reception' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <ReceptionEntryDashboard
            onNavigateView={onNavigateView}
          />
        </div>
      )}

      {/* 5. SUB-TAB VIEW: TECHNICIAN DASHBOARD */}
      {currentSubTab === 'technician' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <TechnicianDepartmentDashboard
            onNavigateView={onNavigateView}
          />
        </div>
      )}
    </div>
  );
};
