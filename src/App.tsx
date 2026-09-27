import React, { useState, useEffect } from 'react';
import { AppView, Language } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustStrip } from './components/TrustStrip';
import { ProblemSection } from './components/ProblemSection';
import { SolutionSection } from './components/SolutionSection';
import { LabWorkflow } from './components/LabWorkflow';
import { FeaturesSection } from './components/FeaturesSection';
import { OfflineSection } from './components/OfflineSection';
import { PatientPortalSection } from './components/PatientPortalSection';
import { ReportPreviewSection } from './components/ReportPreviewSection';
import { WhatsAppReportSection } from './components/WhatsAppReportSection';
import { TestLibrarySection } from './components/TestLibrarySection';
import { StaffRolesSection } from './components/StaffRolesSection';
import { PatientHistorySection } from './components/PatientHistorySection';
import { DataSafetySection } from './components/DataSafetySection';
import { SecuritySection } from './components/SecuritySection';
import { AuditLogSection } from './components/AuditLogSection';
import { IndianMarketSection } from './components/IndianMarketSection';
import { LabSearchSection } from './components/LabSearchSection';
import { PricingSection } from './components/PricingSection';
import { DemoSection } from './components/DemoSection';
import { FinalCTASection } from './components/FinalCTASection';
import { MobileFixedCTA } from './components/MobileFixedCTA';
import { BookDemoModal } from './components/Modals';
import { LabSoftwareApp } from './components/LabSoftwareApp';
import { PatientPortalApp } from './components/PatientPortalApp';
import { LabVendorWebsite } from './components/LabVendorWebsite';
import { CompanyAdminDashboard } from './components/CompanyAdminDashboard';
import { LabVendorDashboard } from './components/LabVendorDashboard';
import { ReceptionEntryDashboard } from './components/ReceptionEntryDashboard';
import { TechnicianDepartmentDashboard } from './components/technician/TechnicianDepartmentDashboard';
import { DashboardAuthGuard } from './components/DashboardAuthGuard';
import { CmsAuthModal } from './components/CmsAuthModal';
import { BranchManagerDashboard } from './components/BranchManagerDashboard';
import { PathologistDashboard } from './components/PathologistDashboard';
import { RoleContextBanner } from './components/RoleContextBanner';
import { Building } from 'lucide-react';
import { isUserAuthorizedForView } from './utils/rbac';
import { useCms } from './context/CmsContext';
import { getTenantSubdomain } from './constants/domains';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('website');
  const [language, setLanguage] = useState<Language>('en');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [selectedPatientMobile, setSelectedPatientMobile] = useState('');

  const {
    currentUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    portalSections,
    selectVendorLab,
    selectedVendorLabId,
    setSelectedVendorLabId,
    vendorLabsList,
  } = useCms();

  // Sync view and lab tenant from URL parameters or subdomain on initial mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') as AppView | null;
      const labParam = params.get('lab') || params.get('subdomain');

      // Check if hostname is e.g. <subdomain>.indianlalaji.com
      const hostname = window.location.hostname;
      let hostSubdomain: string | null = null;
      // Only extract subdomain if hostname actually belongs to the platform production domain (e.g. *.indianlalaji.com)
      if (hostname.endsWith('indianlalaji.com') && !hostname.startsWith('www.') && hostname !== 'indianlalaji.com') {
        const parts = hostname.split('.');
        if (parts.length >= 3) {
          hostSubdomain = parts[0];
        }
      }

      const targetLab = labParam || hostSubdomain;
      if (targetLab) {
        selectVendorLab(targetLab);
        if (!viewParam) {
          setCurrentView('vendor_website');
        }
      }

      if (
        viewParam &&
        [
          'vendor_dashboard',
          'branch_manager_dashboard',
          'reception_dashboard',
          'technician_dashboard',
          'pathologist_dashboard',
          'admin_dashboard',
          'vendor_website',
          'website',
          'patient_portal',
          'lab_app',
        ].includes(viewParam)
      ) {
        setCurrentView(viewParam);
      } else if (!targetLab) {
        // Default root landing page is the main platform website
        setCurrentView('website');
      }
    } catch {}
  }, []);

  // Update URL search parameters when view or selected lab changes
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (currentView === 'website') {
        url.searchParams.delete('view');
        url.searchParams.delete('lab');
        url.searchParams.delete('subdomain');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      } else if (currentView === 'vendor_website') {
        url.searchParams.set('view', 'vendor_website');
        if (selectedVendorLabId) {
          const currentLab = vendorLabsList.find((l) => l.id === selectedVendorLabId);
          const slug = getTenantSubdomain(currentLab?.domainPreview || selectedVendorLabId);
          url.searchParams.set('lab', slug);
        }
        window.history.replaceState({}, '', url.pathname + url.search);
      } else if (currentView === 'patient_portal') {
        url.searchParams.set('view', 'patient_portal');
        if (selectedVendorLabId && selectedVendorLabId !== 'all') {
          const currentLab = vendorLabsList.find((l) => l.id === selectedVendorLabId);
          const slug = getTenantSubdomain(currentLab?.domainPreview || selectedVendorLabId);
          url.searchParams.set('lab', slug);
        } else {
          url.searchParams.delete('lab');
        }
        window.history.replaceState({}, '', url.pathname + url.search);
      } else {
        url.searchParams.set('view', currentView);
        // keep lab param if in vendor-specific views
        if (!['vendor_dashboard', 'reception_dashboard', 'technician_dashboard', 'pathologist_dashboard', 'patient_portal'].includes(currentView)) {
          url.searchParams.delete('lab');
        }
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    } catch {}
  }, [currentView, selectedVendorLabId, vendorLabsList]);

  // When user logs out while on a protected dashboard, transition back to public lab website
  useEffect(() => {
    if (!currentUser) {
      const protectedViews: AppView[] = [
        'admin_dashboard',
        'vendor_dashboard',
        'reception_dashboard',
        'technician_dashboard',
        'branch_manager_dashboard',
        'pathologist_dashboard',
      ];
      if (protectedViews.includes(currentView)) {
        setCurrentView(selectedVendorLabId ? 'vendor_website' : 'website');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentUser, currentView, selectedVendorLabId]);

  // Authorization check for protected dashboard workspaces using RBAC
  const isAuthorizedForView = (view: AppView): boolean => {
    return isUserAuthorizedForView(currentUser, view);
  };

  const handleOpenDemo = () => setIsDemoModalOpen(true);

  const handleViewPatientPortal = (reportId?: string, mobile?: string, labId?: string) => {
    if (labId) {
      setSelectedVendorLabId(labId);
      selectVendorLab(labId);
    }
    setSelectedReportId(reportId?.trim() || '');
    setSelectedPatientMobile(mobile?.trim() || '');
    setCurrentView('patient_portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLaunchLabApp = () => {
    setCurrentView('lab_app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToWebsite = () => {
    setSelectedReportId('');
    setSelectedPatientMobile('');
    if (selectedVendorLabId && selectedVendorLabId !== 'all') {
      setCurrentView('vendor_website');
    } else {
      setCurrentView('website');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Dedicated Experience: Diagnostic Laboratory (Vendor) Website
  if (currentView === 'vendor_website') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <LabVendorWebsite
          language={language}
          onSelectLanguage={setLanguage}
          onOpenReportPortal={handleViewPatientPortal}
          onOpenLabSoftware={handleLaunchLabApp}
          onOpenSoftwareWebsite={() => setCurrentView('website')}
          onOpenVendorDashboard={() => setCurrentView('vendor_dashboard')}
          onOpenReceptionDashboard={() => setCurrentView('reception_dashboard')}
          onOpenAdminDashboard={() => setCurrentView('admin_dashboard')}
        />
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          isVendorContext={true}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 2. Dedicated Experience: Company Admin CMS Dashboard
  if (currentView === 'admin_dashboard') {
    if (!isAuthorizedForView('admin_dashboard')) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
          <DashboardAuthGuard
            view="admin_dashboard"
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <CmsAuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onNavigateView={(v) => {
              setCurrentView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <CompanyAdminDashboard
          onNavigateView={(view) => {
            setCurrentView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 3. Dedicated Experience: Diagnostic Lab Vendor CMS Dashboard
  if (currentView === 'vendor_dashboard') {
    if (!isAuthorizedForView('vendor_dashboard')) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
          <DashboardAuthGuard
            view="vendor_dashboard"
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <CmsAuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onNavigateView={(v) => {
              setCurrentView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <LabVendorDashboard
          onNavigateView={(view) => {
            setCurrentView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 4. Dedicated Experience: Reception Entry & Billing Dashboard
  if (currentView === 'reception_dashboard') {
    if (!isAuthorizedForView('reception_dashboard')) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
          <DashboardAuthGuard
            view="reception_dashboard"
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <CmsAuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onNavigateView={(v) => {
              setCurrentView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <ReceptionEntryDashboard
          onNavigateView={(view) => {
            setCurrentView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenReportPortal={handleViewPatientPortal}
        />
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 4b. Dedicated Experience: Technician Department Dashboard (Reports, Edit, Cancel Reason)
  if (currentView === 'technician_dashboard') {
    if (!isAuthorizedForView('technician_dashboard')) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
          <DashboardAuthGuard
            view="technician_dashboard"
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <CmsAuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onNavigateView={(v) => {
              setCurrentView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <LabSoftwareApp
          onBackToWebsite={handleBackToWebsite}
          onViewReport={handleViewPatientPortal}
        />
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 4c. Dedicated Experience: Single Facility Operations (Consolidated into Lab Admin & Reception)
  if (currentView === 'branch_manager_dashboard') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <RoleContextBanner currentView={currentView} onNavigateView={(v) => setCurrentView(v)} />
        <div className="max-w-2xl mx-auto my-auto py-16 px-6 text-center">
          <div className="w-16 h-16 bg-blue-50 text-[#123B6D] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xs border border-blue-100">
            <Building className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Single Branch Diagnostic Mode
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-4 mb-2">Centralized Laboratory Operations</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto mb-8 leading-relaxed">
            This laboratory operates as a single centralized facility. All patient billing, token queue, test verification, and cash tracking are consolidated in the main panels below.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setCurrentView('vendor_dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-2.5 bg-[#123B6D] text-white font-bold rounded-xl text-xs hover:bg-[#0e2c52] transition cursor-pointer shadow-sm"
            >
              🏢 Lab Owner / Admin Panel →
            </button>
            <button
              onClick={() => {
                setCurrentView('reception_dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-2.5 bg-teal-600 text-white font-bold rounded-xl text-xs hover:bg-teal-700 transition cursor-pointer shadow-sm"
            >
              🖥️ Reception & Billing Panel →
            </button>
          </div>
        </div>
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 4d. Dedicated Experience: Consultant Pathologist Verification & Clinical Sign-off Desk
  if (currentView === 'pathologist_dashboard') {
    if (!isAuthorizedForView('pathologist_dashboard')) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
          <DashboardAuthGuard
            view="pathologist_dashboard"
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <CmsAuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onNavigateView={(v) => {
              setCurrentView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <PathologistDashboard
          onNavigateView={(view) => {
            setCurrentView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenReportPortal={handleViewPatientPortal}
        />
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 5. Dedicated Experience: Laboratory Software (app.indianlalaji.com)
  if (currentView === 'lab_app') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <LabSoftwareApp
          onBackToWebsite={handleBackToWebsite}
          onViewReport={handleViewPatientPortal}
        />
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 5. Dedicated Experience: Patient Report Portal (report.indianlalaji.com)
  if (currentView === 'patient_portal') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <PatientPortalApp
          onBackToWebsite={handleBackToWebsite}
          initialReportId={selectedReportId}
          initialMobile={selectedPatientMobile}
          vendorLabId={selectedVendorLabId}
          onSelectVendorLab={(labId) => {
            setSelectedVendorLabId(labId);
            selectVendorLab(labId);
          }}
        />
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 3. Dedicated Experience: Public Website (indianlalaji.com)
  // Section 37: HOMEPAGE FINAL ORDER
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans selection:bg-[#123B6D]/15 selection:text-[#123B6D]">
      {/* Navigation Bar with Language Selector */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenDemo={handleOpenDemo}
        language={language}
        onSelectLanguage={setLanguage}
      />

      <main className="flex-1 pb-16 sm:pb-0">
        {/* 1. Home Section */}
        {portalSections.hero !== false && (
          <Hero
            onOpenDemo={handleOpenDemo}
            onLaunchApp={handleLaunchLabApp}
            language={language}
          />
        )}

        {/* 2. Feature Section */}
        {portalSections.features !== false && <FeaturesSection />}

        {/* 3. Lab Search Section (Premium Styling, Under Features) */}
        {portalSections.vendorWebsitesShowcase !== false && (
          <LabSearchSection
            onSelectView={setCurrentView}
            onOpenDemo={handleOpenDemo}
          />
        )}

        {/* 4. Pricing Section */}
        {portalSections.pricing !== false && (
          <PricingSection onOpenDemo={handleOpenDemo} />
        )}

        {/* 5. Contact Us Section */}
        {portalSections.finalCta !== false && (
          <FinalCTASection onOpenDemo={handleOpenDemo} />
        )}
      </main>

      {/* 33. Mobile Fixed CTA */}
      <MobileFixedCTA onOpenReport={() => handleViewPatientPortal()} />

      {/* Interactive Modals */}
      <BookDemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
      <CmsAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onNavigateView={(v) => {
          setCurrentView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
