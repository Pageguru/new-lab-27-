import React from 'react';
import {
  Globe,
  FlaskConical,
  Package,
  ClipboardList,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Clock,
  Users,
  Database,
  Headphones,
  ChevronDown,
  ChevronsUpDown,
  Maximize2,
  Minimize2,
  Eye,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AppView } from '../../types';
import { VendorWebsiteCmsTab } from './VendorWebsiteCmsTab';
import { VendorTestsTab } from './VendorTestsTab';
import { VendorPackagesTab } from './VendorPackagesTab';
import { VendorFormsTab } from './VendorFormsTab';
import { VendorDashboardsTab } from './VendorDashboardsTab';
import { VendorDomainRequestTab } from './VendorDomainRequestTab';
import { VendorSiteSettingsTab } from './VendorSiteSettingsTab';
import { VendorAdminSettingsTab } from './VendorAdminSettingsTab';
import { VendorBookingSettingsTab } from './VendorBookingSettingsTab';
import { VendorStaffManagementTab } from './VendorStaffManagementTab';
import { VendorBackupReportsTab } from './VendorBackupReportsTab';
import { VendorTechSupportTab } from './VendorTechSupportTab';

export interface VendorAllTabsAccordionProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  expandedTabs: Record<string, boolean>;
  onToggleTab: (tabKey: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onOpenActiveOnly: () => void;
  onNavigateView: (view: AppView) => void;
  // Sub-tab states & handlers
  websiteSubTab: 'banners' | 'about' | 'founder' | 'team' | 'contact' | 'social' | 'legal' | 'sections';
  onWebsiteSubTabChange: (tab: any) => void;
  testSubTab: 'list' | 'add';
  onTestSubTabChange: (tab: 'list' | 'add') => void;
  packageSubTab: 'list' | 'add';
  onPackageSubTabChange: (tab: 'list' | 'add') => void;
  formSubTab: 'bookings' | 'contacts';
  onFormSubTabChange: (tab: 'bookings' | 'contacts') => void;
  dashboardSubTab: 'reception' | 'technician' | 'overview';
  onDashboardSubTabChange: (tab: any) => void;
  domainSubTab: 'add' | 'list';
  onDomainSubTabChange: (tab: 'add' | 'list') => void;
  settingsSubTab: 'logo' | 'name' | 'description' | 'feature' | 'payment_qr' | 'plan' | 'all';
  onSettingsSubTabChange: (tab: any) => void;
  bookingSettingsSubTab: 'all' | 'charges' | 'timing';
  staffSubTab: 'list' | 'add';
  // Summary badges
  testsCount?: number;
  packagesCount?: number;
  bookingsCount?: number;
  contactsCount?: number;
  domainRequestsCount?: number;
  remainingPlanDays?: number;
}

export const VendorAllTabsAccordion: React.FC<VendorAllTabsAccordionProps> = ({
  activeTab,
  onSelectTab,
  expandedTabs,
  onToggleTab,
  onExpandAll,
  onCollapseAll,
  onOpenActiveOnly,
  onNavigateView,
  websiteSubTab,
  onWebsiteSubTabChange,
  testSubTab,
  onTestSubTabChange,
  packageSubTab,
  onPackageSubTabChange,
  formSubTab,
  onFormSubTabChange,
  dashboardSubTab,
  onDashboardSubTabChange,
  domainSubTab,
  onDomainSubTabChange,
  settingsSubTab,
  onSettingsSubTabChange,
  bookingSettingsSubTab,
  staffSubTab,
  testsCount = 0,
  packagesCount = 0,
  bookingsCount = 0,
  contactsCount = 0,
  domainRequestsCount = 0,
  remainingPlanDays = 24,
}) => {
  const openCount = Object.values(expandedTabs).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* ======================================================== */}
      {/* ACCORDION GLOBAL TOOLBAR */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#123B6D]/10 text-[#123B6D]">
              <LayoutDashboard className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-[#123B6D]">
              Laboratory Control Center
            </h2>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              12 Modules (Accordion View)
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Click any module header below to expand or collapse. Edit your website, tests, packages, staff, and settings in one unified view.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
            {openCount} of 12 Open
          </div>

          <button
            type="button"
            onClick={onExpandAll}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
            title="Expand all 12 modules"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Expand All</span>
          </button>

          <button
            type="button"
            onClick={onCollapseAll}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
            title="Collapse all modules"
          >
            <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Collapse All</span>
          </button>

          <button
            type="button"
            onClick={onOpenActiveOnly}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#123B6D] hover:bg-[#0e2c52] text-white flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
            title="Focus only on current active module"
          >
            <ChevronsUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Only</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. WEBSITE SECTION ACCORDION */}
      {/* ======================================================== */}
      <div
        id="accordion-panel-website"
        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
          expandedTabs.website
            ? 'border-amber-300 ring-2 ring-amber-400/20 bg-white shadow-md'
            : 'border-slate-200 bg-white hover:border-amber-200 hover:shadow-2xs'
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleTab('website')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleTab('website');
            }
          }}
          className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition cursor-pointer select-none ${
            expandedTabs.website ? 'bg-gradient-to-r from-amber-50/80 via-white to-white' : 'hover:bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                expandedTabs.website
                  ? 'bg-[#123B6D] text-amber-400 ring-2 ring-amber-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-200'
              }`}
            >
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-[#123B6D]">1. Website Section</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  7 CMS Tools
                </span>
                {activeTab === 'website' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Active Focus
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Hero Banners, About Us, Founder, Team, Contact Info, Social Media &amp; Legal Policies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateView('vendor_website');
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-[#123B6D] bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              <span>Live Preview</span>
            </button>
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition ${
                expandedTabs.website ? 'bg-[#123B6D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{expandedTabs.website ? 'Hide' : 'Expand'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedTabs.website ? 'rotate-180 text-amber-300' : ''
                }`}
              />
            </span>
          </div>
        </div>

        {expandedTabs.website && (
          <div className="border-t border-amber-200/80 p-4 sm:p-6 bg-slate-50/40">
            <VendorWebsiteCmsTab
              onPreviewWebsite={() => onNavigateView('vendor_website')}
              activeSubTab={websiteSubTab}
              onSubTabChange={onWebsiteSubTabChange}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. ONLINE PATHOLOGY TESTS ACCORDION */}
      {/* ======================================================== */}
      <div
        id="accordion-panel-tests"
        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
          expandedTabs.tests
            ? 'border-teal-300 ring-2 ring-teal-400/20 bg-white shadow-md'
            : 'border-slate-200 bg-white hover:border-teal-200 hover:shadow-2xs'
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleTab('tests')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleTab('tests');
            }
          }}
          className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition cursor-pointer select-none ${
            expandedTabs.tests ? 'bg-gradient-to-r from-teal-50/80 via-white to-white' : 'hover:bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                expandedTabs.tests
                  ? 'bg-teal-700 text-teal-100 ring-2 ring-teal-300'
                  : 'bg-teal-100 text-teal-800 border border-teal-200'
              }`}
            >
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-[#123B6D]">2. Online Pathology Tests</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  {testsCount} Tests Directory
                </span>
                {activeTab === 'tests' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    Active Focus
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Add New Clinical Tests, Pathology Directory, Rates (INR) &amp; Specimen Vials
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition ${
                expandedTabs.tests ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{expandedTabs.tests ? 'Hide' : 'Expand'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedTabs.tests ? 'rotate-180 text-teal-200' : ''
                }`}
              />
            </span>
          </div>
        </div>

        {expandedTabs.tests && (
          <div className="border-t border-teal-200/80 p-4 sm:p-6 bg-slate-50/40">
            <VendorTestsTab
              activeSubTab={testSubTab}
              onSubTabChange={onTestSubTabChange}
              onPreviewWebsite={() => onNavigateView('vendor_website')}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. HEALTH TEST PACKAGES ACCORDION */}
      {/* ======================================================== */}
      <div
        id="accordion-panel-packages"
        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
          expandedTabs.packages
            ? 'border-sky-300 ring-2 ring-sky-400/20 bg-white shadow-md'
            : 'border-slate-200 bg-white hover:border-sky-200 hover:shadow-2xs'
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleTab('packages')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleTab('packages');
            }
          }}
          className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition cursor-pointer select-none ${
            expandedTabs.packages ? 'bg-gradient-to-r from-sky-50/80 via-white to-white' : 'hover:bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                expandedTabs.packages
                  ? 'bg-sky-700 text-sky-100 ring-2 ring-sky-300'
                  : 'bg-sky-100 text-sky-800 border border-sky-200'
              }`}
            >
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-[#123B6D]">3. Health Test Packages</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  {packagesCount} Packages
                </span>
                {activeTab === 'packages' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                    Active Focus
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Full Body Screening Bundles, Preventive Health Checkups &amp; Offer Pricing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition ${
                expandedTabs.packages ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{expandedTabs.packages ? 'Hide' : 'Expand'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedTabs.packages ? 'rotate-180 text-sky-200' : ''
                }`}
              />
            </span>
          </div>
        </div>

        {expandedTabs.packages && (
          <div className="border-t border-sky-200/80 p-4 sm:p-6 bg-slate-50/40">
            <VendorPackagesTab
              activeSubTab={packageSubTab}
              onSubTabChange={onPackageSubTabChange}
              onPreviewWebsite={() => onNavigateView('website')}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. FORMS & PATIENT ENQUIRIES ACCORDION */}
      {/* ======================================================== */}
      <div
        id="accordion-panel-forms"
        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
          expandedTabs.forms
            ? 'border-orange-300 ring-2 ring-orange-400/20 bg-white shadow-md'
            : 'border-slate-200 bg-white hover:border-orange-200 hover:shadow-2xs'
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleTab('forms')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleTab('forms');
            }
          }}
          className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition cursor-pointer select-none ${
            expandedTabs.forms ? 'bg-gradient-to-r from-orange-50/80 via-white to-white' : 'hover:bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                expandedTabs.forms
                  ? 'bg-orange-700 text-orange-100 ring-2 ring-orange-300'
                  : 'bg-orange-100 text-orange-800 border border-orange-200'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-[#123B6D]">4. Forms &amp; Patient Enquiries</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  {bookingsCount} Bookings • {contactsCount} Enquiries
                </span>
                {activeTab === 'forms' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                    Active Focus
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Home Sample Collection Requests, Contact Enquiries &amp; Reception Desk Dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition ${
                expandedTabs.forms ? 'bg-orange-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{expandedTabs.forms ? 'Hide' : 'Expand'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedTabs.forms ? 'rotate-180 text-orange-200' : ''
                }`}
              />
            </span>
          </div>
        </div>

        {expandedTabs.forms && (
          <div className="border-t border-orange-200/80 p-4 sm:p-6 bg-slate-50/40">
            <VendorFormsTab
              activeSubTab={formSubTab}
              onSubTabChange={onFormSubTabChange}
              onNavigateView={onNavigateView}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. DEPARTMENT DASHBOARDS ACCORDION */}
      {/* ======================================================== */}
      <div
        id="accordion-panel-dashboard"
        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
          expandedTabs.dashboard
            ? 'border-purple-300 ring-2 ring-purple-400/20 bg-white shadow-md'
            : 'border-slate-200 bg-white hover:border-purple-200 hover:shadow-2xs'
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleTab('dashboard')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleTab('dashboard');
            }
          }}
          className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition cursor-pointer select-none ${
            expandedTabs.dashboard ? 'bg-gradient-to-r from-purple-50/80 via-white to-white' : 'hover:bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                expandedTabs.dashboard
                  ? 'bg-purple-700 text-purple-100 ring-2 ring-purple-300'
                  : 'bg-purple-100 text-purple-800 border border-purple-200'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-[#123B6D]">5. Department Dashboards</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  Reception &amp; Tech Workbench
                </span>
                {activeTab === 'dashboard' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    Active Focus
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Reception Desk (Patient Tokens &amp; Billing) &amp; Lab Technician Workbench (Analyzer &amp; Reports)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition ${
                expandedTabs.dashboard ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{expandedTabs.dashboard ? 'Hide' : 'Expand'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedTabs.dashboard ? 'rotate-180 text-purple-200' : ''
                }`}
              />
            </span>
          </div>
        </div>

        {expandedTabs.dashboard && (
          <div className="border-t border-purple-200/80 p-4 sm:p-6 bg-slate-50/40">
            <VendorDashboardsTab
              activeSubTab={dashboardSubTab}
              onSubTabChange={onDashboardSubTabChange}
              onNavigateView={onNavigateView}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 6. CUSTOM DOMAIN REQUEST ACCORDION */}
      {/* ======================================================== */}
      <div
        id="accordion-panel-domain"
        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
          expandedTabs.domain
            ? 'border-indigo-300 ring-2 ring-indigo-400/20 bg-white shadow-md'
            : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-2xs'
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleTab('domain')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleTab('domain');
            }
          }}
          className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition cursor-pointer select-none ${
            expandedTabs.domain ? 'bg-gradient-to-r from-indigo-50/80 via-white to-white' : 'hover:bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                expandedTabs.domain
                  ? 'bg-indigo-700 text-indigo-100 ring-2 ring-indigo-300'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}
            >
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-[#123B6D]">6. Custom Domain Request</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {domainRequestsCount} Domain Requests
                </span>
                {activeTab === 'domain' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    Active Focus
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Connect Custom Domain, Subdomain Configuration, DNS Records &amp; Super Admin Approval
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition ${
                expandedTabs.domain ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{expandedTabs.domain ? 'Hide' : 'Expand'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedTabs.domain ? 'rotate-180 text-indigo-200' : ''
                }`}
              />
            </span>
          </div>
        </div>

        {expandedTabs.domain && (
          <div className="border-t border-indigo-200/80 p-4 sm:p-6 bg-slate-50/40">
            <VendorDomainRequestTab
              initialSubTab={domainSubTab}
              onNavigateSubTab={onDomainSubTabChange}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 7. SITE SETTINGS & PLAN PRICING ACCORDION */}
      {/* ======================================================== */}
      <div
        id="accordion-panel-settings"
        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
          expandedTabs.settings
            ? 'border-indigo-300 ring-2 ring-indigo-400/20 bg-white shadow-md'
            : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-2xs'
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleTab('settings')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleTab('settings');
            }
          }}
          className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition cursor-pointer select-none ${
            expandedTabs.settings ? 'bg-gradient-to-r from-indigo-50/80 via-white to-white' : 'hover:bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                expandedTabs.settings
                  ? 'bg-[#123B6D] text-amber-400 ring-2 ring-amber-300'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}
            >
              <Settings className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-[#123B6D]">7. Site Settings &amp; Plan Pricing</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  {remainingPlanDays}d Plan Left
                </span>
                {activeTab === 'settings' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Active Focus
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Laboratory Logo, Site Name, SEO Description, Feature Banner, Payment QR &amp; Active Plan Countdown
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition ${
                expandedTabs.settings ? 'bg-[#123B6D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{expandedTabs.settings ? 'Hide' : 'Expand'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedTabs.settings ? 'rotate-180 text-amber-300' : ''
                }`}
              />
            </span>
          </div>
        </div>

        {expandedTabs.settings && (
          <div className="border-t border-indigo-200/80 p-4 sm:p-6 bg-slate-50/40">
            <VendorSiteSettingsTab
              activeSubTab={settingsSubTab}
              onSubTabChange={onSettingsSubTabChange}
              initialSection={settingsSubTab}
              onNavigateView={onNavigateView}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 8. ADMIN SETTINGS ACCORDION */}
      {/* ======================================================== */}
      <div
        id="accordion-panel-admin_settings"
        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
          expandedTabs.admin_settings
            ? 'border-rose-300 ring-2 ring-rose-400/20 bg-white shadow-md'
            : 'border-slate-200 bg-white hover:border-rose-200 hover:shadow-2xs'
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleTab('admin_settings')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleTab('admin_settings');
            }
          }}
          className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition cursor-pointer select-none ${
            expandedTabs.admin_settings ? 'bg-gradient-to-r from-rose-50/80 via-white to-white' : 'hover:bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                expandedTabs.admin_settings
                  ? 'bg-rose-700 text-rose-100 ring-2 ring-rose-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-[#123B6D]">8. Admin Settings</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  PIN &amp; Passwords
                </span>
                {activeTab === 'admin_settings' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    Active Focus
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Lab Owner Master PIN, Reception PIN, Technician PIN &amp; Password Resets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition ${
                expandedTabs.admin_settings ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{expandedTabs.admin_settings ? 'Hide' : 'Expand'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedTabs.admin_settings ? 'rotate-180 text-rose-200' : ''
                }`}
              />
            </span>
          </div>
        </div>

        {expandedTabs.admin_settings && (
          <div className="border-t border-rose-200/80 p-4 sm:p-6 bg-slate-50/40">
            <VendorAdminSettingsTab onNavigateView={onNavigateView} />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 9. BOOKING FORM SETTINGS ACCORDION */}
      {/* ======================================================== */}
      <div
        id="accordion-panel-booking_settings"
        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
          expandedTabs.booking_settings
            ? 'border-emerald-300 ring-2 ring-emerald-400/20 bg-white shadow-md'
            : 'border-slate-200 bg-white hover:border-emerald-200 hover:shadow-2xs'
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleTab('booking_settings')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleTab('booking_settings');
            }
          }}
          className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition cursor-pointer select-none ${
            expandedTabs.booking_settings ? 'bg-gradient-to-r from-emerald-50/80 via-white to-white' : 'hover:bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                expandedTabs.booking_settings
                  ? 'bg-emerald-700 text-emerald-100 ring-2 ring-emerald-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-[#123B6D]">9. Booking Form Settings</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Charges &amp; Slots
                </span>
                {activeTab === 'booking_settings' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Active Focus
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Home Sample Collection Fee, Minimum Order Amount &amp; Sample Booking Time Slots
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition ${
                expandedTabs.booking_settings ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{expandedTabs.booking_settings ? 'Hide' : 'Expand'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedTabs.booking_settings ? 'rotate-180 text-emerald-200' : ''
                }`}
              />
            </span>
          </div>
        </div>

        {expandedTabs.booking_settings && (
          <div className="border-t border-emerald-200/80 p-4 sm:p-6 bg-slate-50/40">
            <VendorBookingSettingsTab
              initialSubTab={bookingSettingsSubTab}
              onNavigateView={onNavigateView}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 10. STAFF MANAGEMENT ACCORDION */}
      {/* ======================================================== */}
      <div
        id="accordion-panel-staff"
        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
          expandedTabs.staff
            ? 'border-teal-300 ring-2 ring-teal-400/20 bg-white shadow-md'
            : 'border-slate-200 bg-white hover:border-teal-200 hover:shadow-2xs'
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleTab('staff')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleTab('staff');
            }
          }}
          className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition cursor-pointer select-none ${
            expandedTabs.staff ? 'bg-gradient-to-r from-teal-50/80 via-white to-white' : 'hover:bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                expandedTabs.staff
                  ? 'bg-[#0F766E] text-teal-100 ring-2 ring-teal-300'
                  : 'bg-teal-100 text-teal-800 border border-teal-200'
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-[#123B6D]">10. Staff Management</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Reception &amp; Tech Accounts
                </span>
                {activeTab === 'staff' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    Active Focus
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Create Staff Accounts, Passwords, Role Permissions (Receptionists &amp; Lab Technicians)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition ${
                expandedTabs.staff ? 'bg-[#0F766E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{expandedTabs.staff ? 'Hide' : 'Expand'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedTabs.staff ? 'rotate-180 text-teal-200' : ''
                }`}
              />
            </span>
          </div>
        </div>

        {expandedTabs.staff && (
          <div className="border-t border-teal-200/80 p-4 sm:p-6 bg-slate-50/40">
            <VendorStaffManagementTab
              initialSubTab={staffSubTab}
              onNavigateView={onNavigateView}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 11. BACKUP & REPORTS ACCORDION */}
      {/* ======================================================== */}
      <div
        id="accordion-panel-backup"
        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
          expandedTabs.backup
            ? 'border-blue-300 ring-2 ring-blue-400/20 bg-white shadow-md'
            : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-2xs'
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleTab('backup')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleTab('backup');
            }
          }}
          className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition cursor-pointer select-none ${
            expandedTabs.backup ? 'bg-gradient-to-r from-blue-50/80 via-white to-white' : 'hover:bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                expandedTabs.backup
                  ? 'bg-blue-700 text-blue-100 ring-2 ring-blue-300'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-[#123B6D]">11. Backup &amp; System Reports</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Data Backup
                </span>
                {activeTab === 'backup' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Active Focus
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Instant JSON Data Backup, Pathology Test Catalog Export, Ledger Reports &amp; Recovery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition ${
                expandedTabs.backup ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{expandedTabs.backup ? 'Hide' : 'Expand'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedTabs.backup ? 'rotate-180 text-blue-200' : ''
                }`}
              />
            </span>
          </div>
        </div>

        {expandedTabs.backup && (
          <div className="border-t border-blue-200/80 p-4 sm:p-6 bg-slate-50/40">
            <VendorBackupReportsTab onNavigateView={onNavigateView} />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 12. TECH SUPPORT ACCORDION */}
      {/* ======================================================== */}
      <div
        id="accordion-panel-support"
        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
          expandedTabs.support
            ? 'border-emerald-300 ring-2 ring-emerald-400/20 bg-white shadow-md'
            : 'border-slate-200 bg-white hover:border-emerald-200 hover:shadow-2xs'
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleTab('support')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleTab('support');
            }
          }}
          className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition cursor-pointer select-none ${
            expandedTabs.support ? 'bg-gradient-to-r from-emerald-50/80 via-white to-white' : 'hover:bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                expandedTabs.support
                  ? 'bg-emerald-700 text-emerald-100 ring-2 ring-emerald-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <Headphones className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-[#123B6D]">12. Tech Support</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Help Desk
                </span>
                {activeTab === 'support' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Active Focus
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                24/7 Laboratory Help Desk, Technical Assistance, WhatsApp Support &amp; System Guides
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition ${
                expandedTabs.support ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{expandedTabs.support ? 'Hide' : 'Expand'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedTabs.support ? 'rotate-180 text-emerald-200' : ''
                }`}
              />
            </span>
          </div>
        </div>

        {expandedTabs.support && (
          <div className="border-t border-emerald-200/80 p-4 sm:p-6 bg-slate-50/40">
            <VendorTechSupportTab />
          </div>
        )}
      </div>
    </div>
  );
};
