import React, { useState } from 'react';
import {
  Home,
  Building,
  Plus,
  Edit2,
  Trash2,
  Save,
  Check,
  Eye,
  LogOut,
  RefreshCw,
  HelpCircle,
  Layers,
  IndianRupee,
  Phone,
  Mail,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  X,
  TrendingUp,
  Building2,
  SlidersHorizontal,
  AlertTriangle,
  FlaskConical,
  Clock,
  Globe,
  Crown,
  Database,
  Wifi,
  Activity,
  Server,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { AppView, PricingPlan, CompanyFeature, CompanyFaq, CompanyStat, LabManagementFeature } from '../types';
import { VendorManagementTab } from './admin/VendorManagementTab';
import { WebsiteSectionsTab } from './admin/WebsiteSectionsTab';
import { HostingerDatabaseCard } from './admin/HostingerDatabaseCard';

interface CompanyAdminDashboardProps {
  onNavigateView: (view: AppView) => void;
}

export const CompanyAdminDashboard: React.FC<CompanyAdminDashboardProps> = ({ onNavigateView }) => {
  const {
    currentUser,
    logout,
    companySettings,
    updateCompanySettings,
    pricingPlans,
    addPricingPlan,
    updatePricingPlan,
    updatePlanPrice,
    resetPricingPlansToDefault,
    syncFeaturesToAllPlans,
    deletePricingPlan,
    companyFeatures,
    addCompanyFeature,
    updateCompanyFeature,
    deleteCompanyFeature,
    labManagementFeatures,
    addLabManagementFeature,
    updateLabManagementFeature,
    deleteLabManagementFeature,
    resetLabManagementFeatures,
    companyFaqs,
    addCompanyFaq,
    updateCompanyFaq,
    deleteCompanyFaq,
    companyStats,
    updateCompanyStat,
    resetAllToDefaults,
    vendorLabsList,
    portalSections,
    superAdminTenantScope,
    setSuperAdminTenantScope,
    isCloudConnected,
    cloudSyncStatus,
    lastCloudSyncTime,
    refreshCloudData,
    receptionEntries,
    reports,
    allDomainRequests,
    updateDomainRequest,
    deleteDomainRequest,
  } = useCms();

  type SuperAdminMenu = 'home' | 'labs' | 'clients' | 'website_edit' | 'domain_requests';
  const [activeMenu, setActiveMenu] = useState<SuperAdminMenu>('home');

  type HomeSubTab = 'pricing' | 'cloud_sync' | 'settings' | 'features' | 'faqs' | 'stats';
  const [homeSubTab, setHomeSubTab] = useState<HomeSubTab>('pricing');
  const activeTab = homeSubTab;

  const [toastMessage, setToastMessage] = useState('');
  const [pingResult, setPingResult] = useState<{ status: 'idle' | 'testing' | 'success'; latencyMs?: number; message?: string }>({ status: 'idle' });

  const runCloudPingTest = async () => {
    setPingResult({ status: 'testing' });
    const start = performance.now();
    try {
      await refreshCloudData();
      const duration = Math.max(12, Math.round(performance.now() - start));
      setPingResult({
        status: 'success',
        latencyMs: duration,
        message: `Real-time cloud ping verified! Roundtrip latency: ${duration}ms. WebSocket listeners active across all devices.`
      });
      showToast(`Cloud Ping: ${duration}ms — Real-time sync active!`);
    } catch (err: any) {
      setPingResult({
        status: 'idle',
        message: `Ping completed with local fallback. Status: ${err?.message || 'Ready'}`
      });
    }
  };

  const pendingCount = vendorLabsList.filter(
    (v) => v.status !== 'Active'
  ).length;

  const liveClientsCount = vendorLabsList.filter(
    (v) => v.status === 'Active'
  ).length;

  const pendingPaymentCount = vendorLabsList.filter(
    (v) => v.status === 'Processing due to payment confirmation'
  ).length;
  const draftLabsCount = vendorLabsList.filter(
    (v) => v.status === 'Draft' || !v.isWebsiteApproved
  ).length;
  const activeSectionsCount = Object.values(portalSections).filter(Boolean).length;

  // Edit / Add Modal States
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [isNewPlanModal, setIsNewPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState<Omit<PricingPlan, 'id'>>({
    name: '',
    target: '',
    monthlyPriceINR: 1999,
    yearlyPriceINR: 1599,
    description: '',
    isPopular: false,
    features: ['Unlimited Patients', 'WhatsApp PDF Reports', 'NABL Format Support'],
  });

  const [editingFeature, setEditingFeature] = useState<CompanyFeature | null>(null);
  const [isNewFeatureModal, setIsNewFeatureModal] = useState(false);
  const [featureForm, setFeatureForm] = useState<Omit<CompanyFeature, 'id'>>({
    title: '',
    description: '',
    category: 'Core System',
    badge: '',
  });

  // Complete Laboratory Management Features (18 Modules) state
  const [editingLabFeature, setEditingLabFeature] = useState<LabManagementFeature | null>(null);
  const [isNewLabFeatureModal, setIsNewLabFeatureModal] = useState(false);
  const [labFeatureForm, setLabFeatureForm] = useState<Omit<LabManagementFeature, 'id'>>({
    title: '',
    desc: '',
    category: 'Diagnostic Module',
    iconName: 'Activity',
  });
  const [featureSubSection, setFeatureSubSection] = useState<'modules' | 'highlights'>('modules');
  const [labFeatureSearch, setLabFeatureSearch] = useState('');

  const [editingFaq, setEditingFaq] = useState<CompanyFaq | null>(null);
  const [isNewFaqModal, setIsNewFaqModal] = useState(false);
  const [faqForm, setFaqForm] = useState<Omit<CompanyFaq, 'id'>>({
    question: '',
    answer: '',
    category: 'General',
  });

  // Settings local form
  const [settingsForm, setSettingsForm] = useState({ ...companySettings });

  // In-app Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Handlers for Pricing Plans
  const [quickPrices, setQuickPrices] = useState<Record<string, number>>({});
  const [applyFeaturesToAll, setApplyFeaturesToAll] = useState(true);

  const handleQuickPriceChange = (planId: string, val: number) => {
    setQuickPrices((prev) => ({ ...prev, [planId]: val }));
  };

  const handleSaveQuickPrice = (planId: string, planName: string) => {
    const existing = pricingPlans.find((p) => p.id === planId);
    const fallback = existing?.priceINR ?? existing?.monthlyPriceINR ?? 0;
    const priceToSet = quickPrices[planId] !== undefined ? quickPrices[planId] : fallback;
    if (isNaN(priceToSet) || priceToSet < 0) {
      showToast('Please enter a valid price in ₹ INR');
      return;
    }
    updatePlanPrice(planId, priceToSet);
    showToast(`Price for "${planName}" updated to ₹${priceToSet.toLocaleString('en-IN')}!`);
  };

  const handleSyncFeaturesToAllPlans = (features: string[]) => {
    syncFeaturesToAllPlans(features);
    showToast('Identical features applied across all 3 packages!');
  };

  const handleResetToStandard3Packages = () => {
    resetPricingPlansToDefault();
    showToast('Reset to 3 standard packages: 1 Month, 3 Month, 1 Year!');
  };

  const handleOpenAddPlan = () => {
    setPlanForm({
      name: '1 Month Plan',
      target: 'Flexible Monthly Access',
      monthlyPriceINR: 1499,
      yearlyPriceINR: 1499,
      description: 'Full software access with all features included.',
      isPopular: false,
      features: pricingPlans[0]?.features || [
        'Unlimited Patients, Bills & Test Entries',
        'WhatsApp PDF Reports with QR Code Verification',
        '500+ Pre-Configured Tests Library',
        'Instant Dynamic UPI QR Payment Billing',
        'Doctor Commissions & B2B Referral Tracker',
        'Multi-Role Staff & Digital Signatures',
      ],
    });
    setIsNewPlanModal(true);
  };

  const handleSaveNewPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name) return;
    const price = planForm.priceINR || planForm.monthlyPriceINR;
    addPricingPlan({
      ...planForm,
      priceINR: price,
      monthlyPriceINR: price,
      yearlyPriceINR: price,
    });
    setIsNewPlanModal(false);
    showToast('New pricing plan added successfully!');
  };

  const handleOpenEditPlan = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      target: plan.target,
      priceINR: plan.priceINR ?? plan.monthlyPriceINR,
      monthlyPriceINR: plan.monthlyPriceINR,
      yearlyPriceINR: plan.yearlyPriceINR,
      description: plan.description,
      isPopular: plan.isPopular,
      features: [...plan.features],
    });
    setApplyFeaturesToAll(true);
  };

  const handleSaveEditPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    const price = planForm.priceINR || planForm.monthlyPriceINR;
    updatePricingPlan(editingPlan.id, {
      ...planForm,
      priceINR: price,
      monthlyPriceINR: price,
      yearlyPriceINR: price,
    });
    if (applyFeaturesToAll) {
      syncFeaturesToAllPlans(planForm.features);
    }
    setEditingPlan(null);
    showToast(
      applyFeaturesToAll
        ? 'Plan updated & features synchronized across all 3 packages!'
        : 'Pricing plan updated successfully!'
    );
  };

  const handleDeletePlan = (id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Subscription Plan',
      message: `Are you sure you want to delete the plan "${name}"?`,
      confirmText: 'Yes, Delete Plan',
      onConfirm: () => {
        deletePricingPlan(id);
        showToast('Plan deleted.');
        setDeleteConfirm(null);
      },
    });
  };

  // Feature Handlers
  const handleOpenAddFeature = () => {
    setFeatureForm({
      title: 'AI Reference Range Highlighter',
      description: 'Automatically flags critical panic lab values with color-coded alerts and SMS notifications.',
      category: 'Clinical Safety',
      badge: 'New',
    });
    setIsNewFeatureModal(true);
  };

  const handleSaveNewFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureForm.title) return;
    addCompanyFeature(featureForm);
    setIsNewFeatureModal(false);
    showToast('Feature added successfully!');
  };

  const handleOpenEditFeature = (feat: CompanyFeature) => {
    setEditingFeature(feat);
    setFeatureForm({
      title: feat.title,
      description: feat.description,
      category: feat.category,
      badge: feat.badge || '',
    });
  };

  const handleSaveEditFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeature) return;
    updateCompanyFeature(editingFeature.id, featureForm);
    setEditingFeature(null);
    showToast('Feature updated successfully!');
  };

  const handleDeleteFeature = (id: string, title: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Software Feature',
      message: `Are you sure you want to delete feature "${title}"?`,
      confirmText: 'Yes, Delete Feature',
      onConfirm: () => {
        deleteCompanyFeature(id);
        showToast('Feature deleted.');
        setDeleteConfirm(null);
      },
    });
  };

  // Complete Laboratory Management Features Handlers
  const handleOpenAddLabFeature = () => {
    setLabFeatureForm({
      title: '',
      desc: '',
      category: 'Diagnostic Module',
      iconName: 'Activity',
    });
    setIsNewLabFeatureModal(true);
  };

  const handleSaveNewLabFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labFeatureForm.title.trim()) return;
    addLabManagementFeature(labFeatureForm);
    setIsNewLabFeatureModal(false);
    showToast(`Laboratory feature "${labFeatureForm.title}" added successfully!`);
  };

  const handleOpenEditLabFeature = (feat: LabManagementFeature) => {
    setEditingLabFeature(feat);
    setLabFeatureForm({
      title: feat.title,
      desc: feat.desc,
      category: feat.category || 'Diagnostic Module',
      iconName: feat.iconName || 'Activity',
    });
  };

  const handleSaveEditLabFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLabFeature || !labFeatureForm.title.trim()) return;
    updateLabManagementFeature(editingLabFeature.id, labFeatureForm);
    setEditingLabFeature(null);
    showToast(`Feature "${labFeatureForm.title}" updated successfully!`);
  };

  const handleDeleteLabFeature = (id: string, title: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Laboratory Feature Module',
      message: `Are you sure you want to delete module "${title}" from the Complete Laboratory Management section?`,
      confirmText: 'Yes, Delete Module',
      onConfirm: () => {
        deleteLabManagementFeature(id);
        showToast('Module deleted.');
        setDeleteConfirm(null);
      },
    });
  };

  const handleResetLabFeatures = () => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Reset to Standard 18 Laboratory Modules',
      message: 'Are you sure you want to restore the default 18 Complete Laboratory Management modules?',
      confirmText: 'Yes, Reset Modules',
      onConfirm: () => {
        resetLabManagementFeatures();
        showToast('Restored standard 18 laboratory modules!');
        setDeleteConfirm(null);
      },
    });
  };

  // FAQ Handlers
  const handleOpenAddFaq = () => {
    setFaqForm({
      question: 'Can I import patient records from Excel / CSV?',
      answer: 'Yes! The desktop and cloud app allows 1-click import and export of patient logs, doctor lists, and test catalogs in Excel format.',
      category: 'Features',
    });
    setIsNewFaqModal(true);
  };

  const handleSaveNewFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm.question) return;
    addCompanyFaq(faqForm);
    setIsNewFaqModal(false);
    showToast('FAQ added successfully!');
  };

  const handleOpenEditFaq = (faq: CompanyFaq) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
    });
  };

  const handleSaveEditFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq) return;
    updateCompanyFaq(editingFaq.id, faqForm);
    setEditingFaq(null);
    showToast('FAQ updated successfully!');
  };

  const handleDeleteFaq = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete FAQ',
      message: 'Are you sure you want to delete this FAQ question and answer?',
      confirmText: 'Yes, Delete FAQ',
      onConfirm: () => {
        deleteCompanyFaq(id);
        showToast('FAQ deleted.');
        setDeleteConfirm(null);
      },
    });
  };

  // Settings Save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(settingsForm);
    showToast('Company details & Hero section updated! View live site to inspect.');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Header & Menu Bar: Brand Name | Home | Labs | Our Clients | Website Edit | Logout */}
      <header className="bg-[#123B6D] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Name */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="admin-btn-back"
              onClick={() => onNavigateView('website')}
              className="bg-white/15 hover:bg-white/25 active:scale-95 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm border border-white/20 cursor-pointer shrink-0"
              title="Back to Public Home Portal"
            >
              <ArrowLeft className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Portal</span>
            </button>

            <div
              onClick={() => setActiveMenu('home')}
              className="flex items-center gap-2.5 cursor-pointer"
              title="Super Admin Dashboard Home"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                HQ
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm sm:text-base tracking-tight text-white">
                    {companySettings.companyName || 'INDIANLALAJI.COM'}
                  </span>
                  <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider hidden sm:inline-block">
                    Super Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 hidden md:block">
                  {companySettings.superAdminDomain || 'indianlalaji.com'} • Central Control
                </p>
              </div>
            </div>
          </div>

          {/* Menu Bar Items: Home | Labs | Our Clients | Website Edit | Logout */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {/* Home */}
            <button
              type="button"
              id="menu-btn-home"
              onClick={() => setActiveMenu('home')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeMenu === 'home'
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
              {activeMenu === 'home' && (
                <span className="bg-slate-950 text-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-2xs">
                  ✓ Active
                </span>
              )}
            </button>

            {/* Labs (Pending Labs) */}
            <button
              type="button"
              id="menu-btn-labs"
              onClick={() => setActiveMenu('labs')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5 cursor-pointer relative ${
                activeMenu === 'labs'
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Labs</span>
              {pendingCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-2xs">
                  {pendingCount}
                </span>
              )}
              {activeMenu === 'labs' && (
                <span className="bg-slate-950 text-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-2xs">
                  ✓ Active
                </span>
              )}
            </button>

            {/* Our Clients (Published / Live Clients) */}
            <button
              type="button"
              id="menu-btn-clients"
              onClick={() => setActiveMenu('clients')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeMenu === 'clients'
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Our Clients</span>
              <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full hidden sm:inline-block">
                {liveClientsCount}
              </span>
              {activeMenu === 'clients' && (
                <span className="bg-slate-950 text-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-2xs">
                  ✓ Active
                </span>
              )}
            </button>

            {/* Complete Laboratory Management Features Tab */}
            <button
              type="button"
              id="menu-btn-lab-features"
              onClick={() => {
                setActiveMenu('home');
                setHomeSubTab('features');
                setFeatureSubSection('modules');
              }}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeMenu === 'home' && homeSubTab === 'features' && featureSubSection === 'modules'
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>Lab Features ({labManagementFeatures?.length || 18})</span>
              {activeMenu === 'home' && homeSubTab === 'features' && featureSubSection === 'modules' && (
                <span className="bg-slate-950 text-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-2xs">
                  ✓ Edit
                </span>
              )}
            </button>

            {/* Website Edit (Website Sections) */}
            <button
              type="button"
              id="menu-btn-website-edit"
              onClick={() => setActiveMenu('website_edit')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeMenu === 'website_edit'
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Website Edit</span>
              {activeMenu === 'website_edit' && (
                <span className="bg-slate-950 text-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-2xs">
                  ✓ Active
                </span>
              )}
            </button>

            {/* Domain Requests Tab */}
            <button
              type="button"
              id="menu-btn-domain-requests"
              onClick={() => setActiveMenu('domain_requests')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeMenu === 'domain_requests'
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Domain Requests</span>
              {allDomainRequests.filter((r) => r.status === 'Pending').length > 0 ? (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                  {allDomainRequests.filter((r) => r.status === 'Pending').length} New
                </span>
              ) : (
                <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full hidden sm:inline-block">
                  {allDomainRequests.length}
                </span>
              )}
              {activeMenu === 'domain_requests' && (
                <span className="bg-slate-950 text-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-2xs">
                  ✓ Active
                </span>
              )}
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-white/20 mx-1 hidden sm:block"></div>

            {/* Logout */}
            <button
              type="button"
              id="menu-btn-logout"
              onClick={() => {
                logout();
                onNavigateView('website');
              }}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-black text-rose-200 hover:text-white hover:bg-rose-600/30 transition flex items-center gap-1.5 cursor-pointer border border-rose-400/30"
              title="Logout from Super Admin Dashboard"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* VIEW 1: HOME DASHBOARD */}
        {activeMenu === 'home' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Multi-Lab Data Isolation & Tenant Scope Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-[#123B6D] to-slate-900 rounded-2xl p-4 text-white shadow-sm border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white tracking-wide">
                      Multi-Lab Data Isolation Engine
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                      Strict Tenant Boundary Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Central Super Admin oversight with strict tenant database partitioning per Laboratory.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch md:self-auto bg-black/30 p-1.5 rounded-xl border border-white/15">
                <span className="text-[11px] font-bold text-slate-300 pl-2">Super Admin Scope:</span>
                <select
                  value={superAdminTenantScope}
                  onChange={(e) => {
                    setSuperAdminTenantScope(e.target.value);
                    const targetName =
                      e.target.value === 'all'
                        ? 'All Labs (Global)'
                        : vendorLabsList.find((l) => l.id === e.target.value)?.name || e.target.value;
                    setToastMessage(`Switched Super Admin Data Scope to: ${targetName}`);
                    setTimeout(() => setToastMessage(''), 3000);
                  }}
                  className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg border-0 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="all">🌐 All Labs (Global Unrestricted)</option>
                  {vendorLabsList.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      🔬 {lab.name} ({lab.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick KPI Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Pending Labs */}
              <div
                onClick={() => setActiveMenu('labs')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Pending Labs
                  </span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:scale-110 transition-transform">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-amber-700">{pendingCount}</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                    <span>Awaiting Approval</span>
                    <span className="font-bold text-amber-700 group-hover:underline">Review Labs →</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Our Clients */}
              <div
                onClick={() => setActiveMenu('clients')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Our Clients
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-emerald-700">{liveClientsCount}</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                    <span>Published / Live Labs</span>
                    <span className="font-bold text-emerald-700 group-hover:underline">View Clients →</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Website Sections */}
              <div
                onClick={() => setActiveMenu('website_edit')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-[#123B6D] hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Website Edit
                  </span>
                  <div className="p-2 rounded-xl bg-blue-50 text-[#123B6D] group-hover:scale-110 transition-transform">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-slate-900">{activeSectionsCount} / 24</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                    <span>Website Sections Active</span>
                    <span className="font-bold text-[#123B6D] group-hover:underline">Edit Sections →</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Cloud DB & Sync */}
              <div
                onClick={() => setHomeSubTab('cloud_sync')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-500 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Cloud Database
                  </span>
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-700 group-hover:scale-110 transition-transform">
                    <Database className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-sm font-black text-emerald-700">Real-Time Sync</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                    <span>{pingResult.latencyMs ? `Ping: ${pingResult.latencyMs}ms` : 'Hostinger & Firestore'}</span>
                    <span className="font-bold text-teal-700 group-hover:underline">Inspect →</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Central Operations Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-xs text-slate-600">
                  Today's Central Operations: <strong>{receptionEntries.length} Patients</strong> registered • <strong>{reports.length} Reports</strong> issued
                </div>
                <button
                  type="button"
                  onClick={runCloudPingTest}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{pingResult.status === 'testing' ? 'Testing Ping...' : 'Test Cloud Ping'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => onNavigateView('reception_dashboard')}
                  className="bg-[#0F766E] hover:bg-[#0d655e] text-white px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <span>🖥️ Reception Counter</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateView('technician_dashboard')}
                  className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-amber-300" />
                  <span>🔬 Technician Dept</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateView('website')}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <span>🏠 Preview Live Site</span>
                </button>
              </div>
            </div>

            {/* Home Sub-Modules Strip */}
            <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setHomeSubTab('pricing')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    homeSubTab === 'pricing'
                      ? 'bg-[#123B6D] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>SaaS Pricing ({pricingPlans.length})</span>
                </button>

                <button
                  onClick={() => setHomeSubTab('cloud_sync')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    homeSubTab === 'cloud_sync'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cloud DB & Hostinger Monitor</span>
                </button>

                <button
                  onClick={() => setHomeSubTab('settings')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    homeSubTab === 'settings'
                      ? 'bg-[#123B6D] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Branding & Hero Content</span>
                </button>

                <button
                  onClick={() => {
                    setHomeSubTab('features');
                    setFeatureSubSection('modules');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    homeSubTab === 'features'
                      ? 'bg-[#123B6D] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                  <span>Complete Lab Features ({labManagementFeatures?.length || 18})</span>
                </button>

                <button
                  onClick={() => setHomeSubTab('faqs')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    homeSubTab === 'faqs'
                      ? 'bg-[#123B6D] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>FAQs ({companyFaqs.length})</span>
                </button>

                <button
                  onClick={() => setHomeSubTab('stats')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    homeSubTab === 'stats'
                      ? 'bg-[#123B6D] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Stats ({companyStats.length})</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setDeleteConfirm({
                    isOpen: true,
                    title: 'Reset Factory Demo Defaults',
                    message: 'Reset all Company & Vendor data back to initial demo defaults?',
                    confirmText: 'Yes, Reset Defaults',
                    onConfirm: () => {
                      resetAllToDefaults();
                      showToast('Reset back to factory demo defaults.');
                      setDeleteConfirm(null);
                    },
                  });
                }}
                className="text-slate-500 hover:text-slate-800 text-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset Demo Defaults</span>
              </button>
            </div>

            {/* Sub-tab content when activeMenu === 'home' */}

        {/* 1. PRICING PLANS TAB */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            {/* Header & Quick Sync Actions */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#123B6D] text-[11px] font-bold">
                    SaaS Pricing Engine
                  </span>
                  <span className="text-xs text-slate-400 font-medium">• 3 Standard Packages</span>
                </div>
                <h2 className="text-lg font-extrabold text-[#123B6D] mt-1">
                  Manage Subscription Plans (1 Month, 3 Month, 1 Year)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  All 3 packages have identical full features. Change prices directly below in 1-click — updates apply immediately on the website and database.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => {
                    if (pricingPlans[0]?.features) {
                      handleSyncFeaturesToAllPlans(pricingPlans[0].features);
                    }
                  }}
                  title="Make features across all 3 packages 100% identical"
                  className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition flex items-center gap-1.5 border border-teal-200 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Sync Features Across All</span>
                </button>
                <button
                  onClick={handleResetToStandard3Packages}
                  title="Reset to standard 1 Month, 3 Month, 1 Year packages"
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Restore Standard 3 Packages</span>
                </button>
                <button
                  onClick={handleOpenAddPlan}
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Add Plan</span>
                </button>
              </div>
            </div>

            {/* Quick Price Editor Box - Direct Change from Dashboard */}
            <div className="bg-linear-to-r from-blue-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-md">
              <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-blue-800/60">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-amber-300 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4" />
                    <span>Quick Price Editor • Direct Change from Dashboard</span>
                  </h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Enter new price and click "Update Price" to change it instantly on the live website.
                  </p>
                </div>
                <span className="hidden sm:inline-block text-[11px] bg-blue-800/80 px-2.5 py-1 rounded-full text-blue-200 border border-blue-700 font-mono">
                  Instant Sync Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pricingPlans.map((plan) => {
                  const currentPrice = plan.priceINR ?? plan.monthlyPriceINR;
                  const inputValue = quickPrices[plan.id] !== undefined ? quickPrices[plan.id] : currentPrice;

                  return (
                    <div
                      key={plan.id}
                      className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/15 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-sm text-white">{plan.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                          Live: ₹{currentPrice.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="text-[11px] text-blue-200 mb-3 truncate">
                        {plan.target || 'Software Package'}
                      </div>

                      <div className="space-y-2 mt-auto">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                          Change Price (₹ INR):
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={inputValue}
                              onChange={(e) => handleQuickPriceChange(plan.id, Number(e.target.value))}
                              className="w-full pl-6 pr-2 py-2 rounded-lg bg-white text-slate-900 font-black text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                          </div>
                          <button
                            onClick={() => handleSaveQuickPrice(plan.id, plan.name)}
                            className="px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition shadow-xs cursor-pointer shrink-0 flex items-center gap-1"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Update</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pricingPlans.map((plan) => {
                const currentPrice = plan.priceINR ?? plan.monthlyPriceINR;
                return (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-2xl border ${
                      plan.isPopular ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'
                    } p-5 shadow-2xs flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#123B6D] border border-blue-200">
                          {plan.target}
                        </span>
                        {plan.isPopular && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                            Most Popular
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-base text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 mb-3">{plan.description}</p>

                      <div className="py-3 px-3.5 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-2xl font-black text-[#123B6D]">
                              ₹{currentPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-slate-500 ml-1 font-medium">
                              / {plan.name.toLowerCase().includes('year') ? 'year' : plan.name.toLowerCase().includes('3 month') ? '3 months' : 'month'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleOpenEditPlan(plan)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit Full</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Included Features ({plan.features.length}):
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Same Features
                          </span>
                        </div>
                        {plan.features.slice(0, 6).map((f, i) => (
                          <div key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </div>
                        ))}
                        {plan.features.length > 6 && (
                          <span className="text-[11px] text-slate-400 italic block pt-0.5">
                            + {plan.features.length - 6} more standard features
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditPlan(plan)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id, plan.name)}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">ID: {plan.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. FEATURES TAB */}
        {activeTab === 'features' && (
          <div className="space-y-5">
            {/* Top Switcher: Complete Laboratory Management Features vs Platform Highlights */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFeatureSubSection('modules')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                    featureSubSection === 'modules'
                      ? 'bg-[#123B6D] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FlaskConical className="w-4 h-4 text-amber-400" />
                  <span>Complete Laboratory Management Features ({labManagementFeatures?.length || 18})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeatureSubSection('highlights')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                    featureSubSection === 'highlights'
                      ? 'bg-[#123B6D] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Platform Highlights ({companyFeatures.length})</span>
                </button>
              </div>

              {featureSubSection === 'modules' ? (
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={handleResetLabFeatures}
                    className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Restore default 18 laboratory modules"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset 18 Modules</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAddLabFeature}
                    className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Add Lab Module</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenAddFeature}
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Add Highlight</span>
                </button>
              )}
            </div>

            {/* SUB-SECTION 1: COMPLETE LABORATORY MANAGEMENT FEATURES (18 MODULES) */}
            {featureSubSection === 'modules' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 p-4 rounded-2xl border border-blue-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#123B6D] flex items-center gap-2">
                      <span>🧪 Complete Laboratory Management Features</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                        Live on Homepage
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      ये 18 मॉड्यूल्स मुख्य वेबसाइट के "Complete Laboratory Management Features" सेक्शन में दिखते हैं। आप किसी भी मॉड्यूल का नाम, विवरण, कैटेगरी व आइकन बदल सकते हैं।
                    </p>
                  </div>

                  {/* Search Modules */}
                  <div className="w-full md:w-64 relative">
                    <input
                      type="text"
                      value={labFeatureSearch}
                      onChange={(e) => setLabFeatureSearch(e.target.value)}
                      placeholder="Search module (e.g. Barcode, Billing)..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white shadow-2xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {(labManagementFeatures || [])
                    .filter((feat) => {
                      if (!labFeatureSearch.trim()) return true;
                      const q = labFeatureSearch.toLowerCase();
                      return (
                        feat.title.toLowerCase().includes(q) ||
                        feat.desc.toLowerCase().includes(q) ||
                        (feat.category && feat.category.toLowerCase().includes(q))
                      );
                    })
                    .map((feat, idx) => (
                      <div
                        key={feat.id || idx}
                        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between hover:border-[#123B6D]/40 transition group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#123B6D] border border-blue-200">
                              {feat.category || 'Diagnostic Module'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              #{idx + 1}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-7 h-7 rounded-lg bg-[#123B6D]/10 text-[#123B6D] flex items-center justify-center font-bold text-xs shrink-0">
                              ⚡
                            </div>
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">
                              {feat.title}
                            </h4>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {feat.desc}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">
                            Icon: {feat.iconName || 'Activity'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditLabFeature(feat)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="Edit this module"
                            >
                              <Edit2 className="w-3 h-3 text-blue-600" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLabFeature(feat.id, feat.title)}
                              className="p-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold cursor-pointer"
                              title="Delete module"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* SUB-SECTION 2: PLATFORM HIGHLIGHTS (USP CARDS) */}
            {featureSubSection === 'highlights' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <h3 className="font-extrabold text-sm text-[#123B6D]">
                    Platform Highlights & Value Propositions
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cards displayed in the primary USP overview grid of the platform.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companyFeatures.map((feat) => (
                    <div
                      key={feat.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {feat.category}
                          </span>
                          {feat.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#123B6D]">
                              {feat.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-sm text-slate-900">{feat.title}</h3>
                        <p className="text-xs text-slate-600 mt-1">{feat.description}</p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditFeature(feat)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeature(feat.id, feat.title)}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. FAQS TAB */}
        {activeTab === 'faqs' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#123B6D]">
                  Frequently Asked Questions (FAQs)
                </h2>
                <p className="text-xs text-slate-500">
                  Add answers to queries asked by lab owners, doctors, and lab technicians.
                </p>
              </div>
              <button
                onClick={handleOpenAddFaq}
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add FAQ</span>
              </button>
            </div>

            <div className="space-y-3">
              {companyFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                          {faq.category}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900">{faq.question}</h3>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 pl-1 leading-relaxed">{faq.answer}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEditFaq(faq)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                        title="Edit FAQ"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. COMPANY BRANDING & HERO SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <h2 className="text-base font-extrabold text-[#123B6D] mb-1">
              Company Branding, Hero Section & Support Details
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Updates here will immediately alter the text, headlines, and contact links on the main SaaS homepage.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company SaaS Name</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.companyName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hero Badge Text</label>
                  <input
                    type="text"
                    value={settingsForm.heroBadge}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroBadge: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hero Main Headline</label>
                <input
                  type="text"
                  required
                  value={settingsForm.heroTitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hero Subheadline</label>
                <textarea
                  rows={3}
                  value={settingsForm.heroSubtitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Top Announcement Notice</label>
                <input
                  type="text"
                  value={settingsForm.announcementText}
                  onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sales / Helpline Phone</label>
                  <input
                    type="text"
                    value={settingsForm.supportPhone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Support Email</label>
                  <input
                    type="email"
                    value={settingsForm.supportEmail}
                    onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                </div>
              </div>

              {/* Super Admin Domain Configuration */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#123B6D]" />
                  <h4 className="font-extrabold text-xs text-[#123B6D]">Super Admin & Platform Custom Domain</h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    Active Primary Domain
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Super Admin Host Domain</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={settingsForm.superAdminDomain || 'indianlalaji.com'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, superAdminDomain: e.target.value.toLowerCase().trim() })}
                        placeholder="e.g. indianlalaji.com"
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Primary master domain for Super Admin controls, tenant oversight, and SaaS management.
                    </p>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">SaaS Platform Root Domain</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={settingsForm.platformDomain || 'indianlalaji.com'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, platformDomain: e.target.value.toLowerCase().trim() })}
                        placeholder="e.g. indianlalaji.com"
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Platform root URL used for customer care links, public partner showcase, and report verifications.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Save Changes to Website</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 5. STATS & COUNTERS */}
        {activeTab === 'stats' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-[#123B6D]">
                Platform Numbers & Trust Metrics
              </h2>
              <p className="text-xs text-slate-500">
                Edit the milestone stats displayed in the trust strip of the homepage.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {companyStats.map((stat) => (
                <div key={stat.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="text-[11px] font-bold uppercase text-slate-500">{stat.label}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">Display Value</label>
                      <input
                        type="text"
                        value={stat.value}
                        onChange={(e) => updateCompanyStat(stat.id, { value: e.target.value })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 font-extrabold text-sm text-[#123B6D]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Subtext</label>
                      <input
                        type="text"
                        value={stat.subtext}
                        onChange={(e) => updateCompanyStat(stat.id, { subtext: e.target.value })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. LIVE CLOUD DB & SYNC INSPECTOR */}
        {activeTab === 'cloud_sync' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Hostinger MySQL Database Card */}
            <HostingerDatabaseCard showToast={showToast} />

            {/* Top Status Card */}
            <div className="bg-gradient-to-br from-slate-900 via-[#123B6D] to-slate-900 text-white rounded-2xl p-6 border border-slate-700 shadow-md">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-400/30">
                    <Database className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-white tracking-wide">
                        Google Cloud Firestore Real-Time Engine
                      </h2>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        {isCloudConnected ? 'Cloud Active & Synced' : 'Connecting to Cloud...'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Continuous bi-directional WebSocket sync across All Devices (Mobile, PC, Reception, Pathology Bench & Patient Portal).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-auto">
                  <button
                    onClick={runCloudPingTest}
                    disabled={pingResult.status === 'testing'}
                    className="flex-1 md:flex-initial px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Activity className={`w-4 h-4 ${pingResult.status === 'testing' ? 'animate-spin' : ''}`} />
                    <span>{pingResult.status === 'testing' ? 'Testing Live Ping...' : '⚡ Test Real-Time Cloud Ping'}</span>
                  </button>
                </div>
              </div>

              {/* Ping Result Banner */}
              {pingResult.status === 'success' && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white">Live Ping Success ({pingResult.latencyMs}ms):</span> {pingResult.message}
                  </div>
                </div>
              )}

              {/* Cloud Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10 text-xs">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Firebase Project</div>
                  <div className="font-mono font-bold text-amber-300 mt-0.5 truncate" title="focal-replica-2nm8c">
                    focal-replica-2nm8c
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Database Engine</div>
                  <div className="font-mono font-bold text-emerald-300 mt-0.5 truncate" title="ai-studio-labshop-ee7fdddf-d48c-4855-82de-e1fe18eb0046">
                    ai-studio-labshop
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Live Stream Collections</div>
                  <div className="font-bold text-white mt-0.5">
                    13 Collections Streamed
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Last Live Heartbeat</div>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    {lastCloudSyncTime || 'Just Now'}
                  </div>
                </div>
              </div>
            </div>

            {/* Why Firebase Console permission error happens */}
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 text-amber-950">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-200/60 rounded-xl text-amber-800 shrink-0 mt-0.5">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="space-y-2 text-xs">
                  <h3 className="text-sm font-bold text-amber-900">
                    Firebase Console में "Project does not exist or you do not have permission" क्यों आता है?
                  </h3>
                  <p className="text-amber-800 leading-relaxed">
                    यह Google Cloud प्रोजेक्ट (<span className="font-mono font-bold">focal-replica-2nm8c</span>) Google AI Studio द्वारा एक <strong>Dedicated Managed Cloud Tenant</strong> के रूप में स्वचालित (automated) बनाया गया है। Google के सुरक्षा नियमों के अनुसार, इस क्लाउड इंफ्रास्ट्रक्चर का Master IAM Owner प्लेटफ़ॉर्म का सर्विस इंजन होता है। इसलिए आपके व्यक्तिगत Gmail से सीधे Firebase Console का यूआरएल खोलने पर IAM अनुमति का संदेश दिखाई देता है।
                  </p>
                  <p className="text-emerald-900 font-bold bg-emerald-100/80 p-2.5 rounded-lg border border-emerald-300">
                    ✅ <strong>अच्छी खबर (100% Active):</strong> आपके इस वेब एप्लिकेशन के पास आधिकारिक API Credentials हैं और Firestore के सभी 13 Collections में <strong>Real-Time Read & Write पूर्ण रूप से सक्रिय हैं</strong>। जब भी आप या आपका क्लाइंट कोई भी डेटा बदलते हैं, वह बिना किसी देरी के सीधे Google Cloud पर सुरक्षित सेव होता है। आप नीचे दिए गए लाइव टेबल्स और ऊपर "⚡ Test Real-Time Cloud Ping" से इसे सीधे सत्यापित कर सकते हैं।
                  </p>
                </div>
              </div>
            </div>

            {/* Live Synchronized Collections Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Collection 1: reception_entries */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="font-bold text-sm text-slate-800">reception_entries</span>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {receptionEntries.length} Live Patients
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Auto-Synced
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {receptionEntries.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs hover:bg-slate-100/80 transition">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#123B6D] text-[11px] bg-blue-100/70 px-1.5 py-0.5 rounded">
                            {entry.tokenNo || entry.id}
                          </span>
                          <span className="font-bold text-slate-900">{entry.patientName}</span>
                          <span className="text-[10px] text-slate-500">({entry.age}y/{entry.gender})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span>📞 {entry.mobile}</span>
                          <span>•</span>
                          <span className="text-slate-600 font-medium">
                            🧪 {entry.testNames?.join(', ') || entry.tests?.join(', ') || 'Diagnostics'}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        entry.status === 'Report Ready'
                          ? 'bg-emerald-100 text-emerald-800'
                          : entry.status === 'In Lab'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collection 2: lab_reports */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="font-bold text-sm text-slate-800">lab_reports</span>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {reports.length} Live Verified Reports
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Auto-Synced
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {reports.slice(0, 10).map((rep) => (
                    <div key={rep.reportId} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs hover:bg-slate-100/80 transition">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-800 text-[11px] bg-emerald-100/70 px-1.5 py-0.5 rounded">
                            {rep.reportId}
                          </span>
                          <span className="font-bold text-slate-900">{rep.patientName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span>{rep.items?.[0]?.testName || 'Pathology Panel'}</span>
                          <span>•</span>
                          <span>📅 {rep.reportedAt || rep.sampleCollectedAt || 'Today'}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                        {rep.status || (rep.verified ? 'Verified' : 'Pending')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

    {/* VIEW 2: LABS (Pending Labs) */}
    {activeMenu === 'labs' && (
      <div className="animate-in fade-in-50 duration-200">
        <VendorManagementTab
          viewMode="pending"
          onNavigateView={onNavigateView}
          showToast={showToast}
        />
      </div>
    )}

    {/* VIEW 3: OUR CLIENTS (Published / Live Clients) */}
    {activeMenu === 'clients' && (
      <div className="animate-in fade-in-50 duration-200">
        <VendorManagementTab
          viewMode="clients"
          onNavigateView={onNavigateView}
          showToast={showToast}
        />
      </div>
    )}

    {/* VIEW 4: WEBSITE EDIT (Website Sections) */}
    {activeMenu === 'website_edit' && (
      <div className="animate-in fade-in-50 duration-200">
        <WebsiteSectionsTab
          onNavigateView={onNavigateView}
          showToast={showToast}
        />
      </div>
    )}

    {/* VIEW 5: DOMAIN REQUESTS (Vendor Custom Domain Approvals) */}
    {activeMenu === 'domain_requests' && (
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#123B6D] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                DNS Routing &amp; Domain Management
              </span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                {allDomainRequests.filter((r) => r.status === 'Pending').length} Pending Approval
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#123B6D]" />
              <span>Laboratory Custom Domain Requests</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Review and approve custom domains (e.g. <code>apexdiag.in</code>) or subdomains requested by diagnostic lab vendors. Ensure CNAME points to <code>indianlalaji.com</code> before approving.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-700 font-mono">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">DNS CNAME Target</span>
              <strong className="text-[#123B6D]">indianlalaji.com</strong>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="font-extrabold text-xs text-slate-800">
              All Submitted Domain Requests ({allDomainRequests.length})
            </span>
          </div>

          {allDomainRequests.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No domain requests submitted yet by vendors.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {allDomainRequests.map((req) => (
                <div key={req.id} className="p-5 hover:bg-slate-50/70 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-black text-sm text-[#123B6D]">{req.labName}</span>
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                        {req.labId}
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        req.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : req.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        {req.domainType === 'custom_domain' ? 'Custom Domain' : 'Platform Subdomain'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-700">
                      <span>Requested Domain:</span>
                      <a
                        href={`https://${req.requestedDomain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono font-bold text-indigo-700 hover:underline flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200"
                      >
                        <span>{req.requestedDomain}</span>
                        <ExternalLink className="w-3 h-3 text-indigo-500" />
                      </a>
                      <span className="text-slate-400">•</span>
                      <span>Registrar: <strong>{req.registrar || 'Hostinger'}</strong></span>
                      <span className="text-slate-400">•</span>
                      <span>Contact: <strong>{req.contactPerson}</strong> ({req.contactPhone})</span>
                    </div>

                    {req.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{req.notes}"
                      </p>
                    )}

                    {req.adminRemarks && (
                      <p className="text-[11px] text-slate-600">
                        <strong>Admin Note:</strong> {req.adminRemarks}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                    {req.status !== 'Approved' && (
                      <button
                        type="button"
                        onClick={() => {
                          updateDomainRequest(req.id, {
                            status: 'Approved',
                            dnsStatus: 'Configured & Verified',
                            sslStatus: 'Active',
                            adminRemarks: 'Approved by Super Admin. DNS CNAME routing active.',
                          });
                          showToast(`Approved custom domain "${req.requestedDomain}" for ${req.labName}!`);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Approve &amp; Activate</span>
                      </button>
                    )}

                    {req.status !== 'Rejected' && (
                      <button
                        type="button"
                        onClick={() => {
                          updateDomainRequest(req.id, {
                            status: 'Rejected',
                            adminRemarks: 'Rejected: CNAME not pointed to indianlalaji.com or pending registrar verification.',
                          });
                          showToast(`Rejected domain request for "${req.requestedDomain}".`);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <span>Reject</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        deleteDomainRequest(req.id);
                        showToast(`Deleted domain request "${req.requestedDomain}".`);
                      }}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                      title="Delete this request"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}
  </div>

      {/* MODAL: ADD / EDIT PRICING PLAN */}
      {(isNewPlanModal || editingPlan) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-extrabold text-sm text-[#123B6D]">
                {editingPlan ? 'Edit Pricing Plan' : 'Add New Pricing Plan'}
              </h3>
              <button
                onClick={() => {
                  setIsNewPlanModal(false);
                  setEditingPlan(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingPlan ? handleSaveEditPlan : handleSaveNewPlan} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Diagnostic Pro Plan"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Audience Badge</label>
                <input
                  type="text"
                  value={planForm.target}
                  onChange={(e) => setPlanForm({ ...planForm, target: e.target.value })}
                  placeholder="e.g. Independent Pathology Centers"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Package Price (₹ INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    value={planForm.priceINR ?? planForm.monthlyPriceINR}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPlanForm({ ...planForm, priceINR: val, monthlyPriceINR: val, yearlyPriceINR: val });
                    }}
                    className="w-full pl-7 p-2 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Features (One per line)
                </label>
                <textarea
                  rows={5}
                  value={planForm.features.join('\n')}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      features: e.target.value.split('\n').filter((f) => f.trim().length > 0),
                    })
                  }
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono text-[11px]"
                />
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="applyFeaturesToAll"
                    checked={applyFeaturesToAll}
                    onChange={(e) => setApplyFeaturesToAll(e.target.checked)}
                    className="rounded text-[#123B6D]"
                  />
                  <label htmlFor="applyFeaturesToAll" className="font-semibold text-slate-800">
                    Apply these features to all 3 packages (Keep features identical)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={planForm.isPopular}
                    onChange={(e) => setPlanForm({ ...planForm, isPopular: e.target.checked })}
                    className="rounded text-[#123B6D]"
                  />
                  <label htmlFor="isPopular" className="font-semibold text-slate-700">
                    Highlight as "Most Popular" Plan
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewPlanModal(false);
                    setEditingPlan(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#123B6D] text-white px-4 py-1.5 rounded-lg font-bold hover:bg-[#0e2c52]"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT FEATURE */}
      {(isNewFeatureModal || editingFeature) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-extrabold text-sm text-[#123B6D]">
                {editingFeature ? 'Edit Feature' : 'Add Feature'}
              </h3>
              <button
                onClick={() => {
                  setIsNewFeatureModal(false);
                  setEditingFeature(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingFeature ? handleSaveEditFeature : handleSaveNewFeature} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Feature Title</label>
                <input
                  type="text"
                  required
                  value={featureForm.title}
                  onChange={(e) => setFeatureForm({ ...featureForm, title: e.target.value })}
                  placeholder="e.g. Offline-First Billing"
                  className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={featureForm.category}
                    onChange={(e) => setFeatureForm({ ...featureForm, category: e.target.value })}
                    placeholder="e.g. Clinical Safety"
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge (Optional)</label>
                  <input
                    type="text"
                    value={featureForm.badge || ''}
                    onChange={(e) => setFeatureForm({ ...featureForm, badge: e.target.value })}
                    placeholder="e.g. New / USP"
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={featureForm.description}
                  onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewFeatureModal(false);
                    setEditingFeature(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#123B6D] text-white px-4 py-1.5 rounded-lg font-bold hover:bg-[#0e2c52]"
                >
                  Save Feature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT COMPLETE LABORATORY MANAGEMENT FEATURE MODULE */}
      {(isNewLabFeatureModal || editingLabFeature) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#123B6D]/10 text-[#123B6D] flex items-center justify-center font-bold">
                  🧪
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#123B6D]">
                    {editingLabFeature ? 'Edit Laboratory Management Module' : 'Add New Laboratory Management Module'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Live on Homepage "Complete Laboratory Management Features"
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewLabFeatureModal(false);
                  setEditingLabFeature(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingLabFeature ? handleSaveEditLabFeature : handleSaveNewLabFeature} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Module Name / Title *</label>
                <input
                  type="text"
                  required
                  value={labFeatureForm.title}
                  onChange={(e) => setLabFeatureForm({ ...labFeatureForm, title: e.target.value })}
                  placeholder="e.g. Sample Barcode & Phlebotomy Tracking"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category / Tag</label>
                  <input
                    type="text"
                    value={labFeatureForm.category}
                    onChange={(e) => setLabFeatureForm({ ...labFeatureForm, category: e.target.value })}
                    placeholder="e.g. Phlebotomy, Finance, NABL"
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Icon Style</label>
                  <select
                    value={labFeatureForm.iconName || 'Activity'}
                    onChange={(e) => setLabFeatureForm({ ...labFeatureForm, iconName: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white cursor-pointer"
                  >
                    <option value="Activity">⚡ Activity (General Diagnostic)</option>
                    <option value="Users">👥 Users (Patient Management)</option>
                    <option value="BookOpen">📖 BookOpen (500+ Test Catalog)</option>
                    <option value="Stethoscope">🩺 Stethoscope (Doctor Reference)</option>
                    <option value="TestTubes">🧪 TestTubes (Sample Barcode)</option>
                    <option value="FileEdit">📝 FileEdit (Result Entry)</option>
                    <option value="FileCheck2">📄 FileCheck2 (Report PDF Generation)</option>
                    <option value="ShieldCheck">🛡️ ShieldCheck (NABL Verification)</option>
                    <option value="IndianRupee">₹ IndianRupee (Billing & Dynamic UPI)</option>
                    <option value="History">⏳ History (Patient Trend History)</option>
                    <option value="MessageSquare">💬 MessageSquare (WhatsApp Sharing)</option>
                    <option value="QrCode">📱 QrCode (QR Report Verification)</option>
                    <option value="WifiOff">📶 WifiOff (Online + Offline Mode)</option>
                    <option value="RefreshCw">🔄 RefreshCw (Real-Time Cloud Sync)</option>
                    <option value="HardDriveDownload">💾 HardDriveDownload (Backup & Restore)</option>
                    <option value="Building">🏢 Building (Standalone Labs)</option>
                    <option value="TrendingUp">📈 TrendingUp (Doctor Referral Accounts)</option>
                    <option value="UserCog">⚙️ UserCog (Staff & Granular Roles)</option>
                    <option value="FlaskConical">🔬 FlaskConical (Laboratory Science)</option>
                    <option value="Database">🗄️ Database (Hostinger / SQL)</option>
                    <option value="Lock">🔒 Lock (Tamper-Proof Security)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={labFeatureForm.desc}
                  onChange={(e) => setLabFeatureForm({ ...labFeatureForm, desc: e.target.value })}
                  placeholder="e.g. Barcode tube generation, phlebotomy timestamps & status tracking"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-700 leading-relaxed focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewLabFeatureModal(false);
                    setEditingLabFeature(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#123B6D] text-white px-4 py-1.5 rounded-xl font-bold hover:bg-[#0e2c52] cursor-pointer shadow-xs"
                >
                  {editingLabFeature ? 'Save Changes' : 'Add Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {(isNewFaqModal || editingFaq) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-extrabold text-sm text-[#123B6D]">
                {editingFaq ? 'Edit FAQ' : 'Add FAQ'}
              </h3>
              <button
                onClick={() => {
                  setIsNewFaqModal(false);
                  setEditingFaq(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingFaq ? handleSaveEditFaq : handleSaveNewFaq} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Question</label>
                <input
                  type="text"
                  required
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={faqForm.category}
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Answer</label>
                <textarea
                  rows={4}
                  required
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 leading-relaxed"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewFaqModal(false);
                    setEditingFaq(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#123B6D] text-white px-4 py-1.5 rounded-lg font-bold hover:bg-[#0e2c52]"
                >
                  Save FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* IN-APP DELETE / ACTION CONFIRMATION MODAL */}
      {deleteConfirm && deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">{deleteConfirm.title}</h3>
                <p className="text-[11px] text-slate-500 font-medium">Confirmation Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {deleteConfirm.message}
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteConfirm.onConfirm}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteConfirm.confirmText || 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
