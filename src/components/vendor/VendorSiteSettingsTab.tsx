import React, { useState, useEffect } from 'react';
import {
  Settings,
  Image as ImageIcon,
  Type,
  FileText,
  CreditCard,
  QrCode,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Trash2,
  Save,
  Sparkles,
  ExternalLink,
  Copy,
  Download,
  ShieldCheck,
  Zap,
  Globe,
  RefreshCw,
  Search,
  Check,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { VendorLabSettings } from '../../types';

interface VendorSiteSettingsTabProps {
  initialSection?: 'all' | 'logo' | 'name' | 'description' | 'feature' | 'payment_qr' | 'plan';
  onNavigateView?: (view: any) => void;
}

// Preset high quality medical lab icons / logos for quick selection
const SAMPLE_LAB_LOGOS = [
  {
    name: 'Clinical Cross & DNA',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Microscope & Science',
    url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Automated Diagnostic',
    url: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=400&q=80',
  },
];

// Preset high quality feature images
const SAMPLE_FEATURE_IMAGES = [
  {
    name: 'Modern Pathology Automation Lab',
    url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Clinical Biochemistry & Diagnostics',
    url: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Phlebotomy & Patient Healthcare',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
  },
];

export const VendorSiteSettingsTab: React.FC<VendorSiteSettingsTabProps> = ({
  initialSection = 'all',
  onNavigateView,
}) => {
  const {
    vendorLabSettings,
    updateVendorLabSettings,
    pricingPlans,
    activeTenantId,
    vendorLabsList,
  } = useCms();

  const [activeSection, setActiveSection] = useState<
    'all' | 'logo' | 'name' | 'description' | 'feature' | 'payment_qr' | 'plan'
  >(initialSection);

  // Form State
  const [formData, setFormData] = useState<Partial<VendorLabSettings>>({
    logoUrl: vendorLabSettings.logoUrl || '',
    labName: vendorLabSettings.labName || '',
    tagline: vendorLabSettings.tagline || '',
    siteDescription:
      vendorLabSettings.siteDescription ||
      vendorLabSettings.description ||
      'Advanced Pathology, Biochemistry & Diagnostic Testing Centre. 100% NABL Accredited & Certified. Instant digital WhatsApp PDF reports & doorstep sample collection.',
    description:
      vendorLabSettings.description ||
      'Advanced Pathology, Biochemistry & Diagnostic Testing Centre. 100% NABL Accredited & Certified. Instant digital WhatsApp PDF reports & doorstep sample collection.',
    featureImageUrl:
      vendorLabSettings.featureImageUrl ||
      vendorLabSettings.ogImageUrl ||
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
    ogImageUrl:
      vendorLabSettings.ogImageUrl ||
      vendorLabSettings.featureImageUrl ||
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
    qrCode1Url: vendorLabSettings.qrCode1Url || '',
    upiId1: vendorLabSettings.upiId1 || 'apexlab@icici',
    merchantName: vendorLabSettings.merchantName || 'Apex Diagnostic Lab Pvt Ltd',
    qrCode2Url: vendorLabSettings.qrCode2Url || '',
    upiId2: vendorLabSettings.upiId2 || 'apexdiag@oksbi',
    purchasedPlan: vendorLabSettings.purchasedPlan || '1 Month',
    planDurationDays: vendorLabSettings.planDurationDays || 30,
    remainingVisibilityDays: vendorLabSettings.remainingVisibilityDays ?? 24,
    planPurchasedAt: vendorLabSettings.planPurchasedAt || '2026-02-15',
    planExpiresAt: vendorLabSettings.planExpiresAt || '2026-03-17',
  });

  const [isSavedToast, setIsSavedToast] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isCustomLogoUrlOpen, setIsCustomLogoUrlOpen] = useState(false);
  const [customLogoUrlInput, setCustomLogoUrlInput] = useState('');
  const [isCustomFeatureUrlOpen, setIsCustomFeatureUrlOpen] = useState(false);
  const [customFeatureUrlInput, setCustomFeatureUrlInput] = useState('');

  // Keep synced if vendorLabSettings changes externally
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      logoUrl: vendorLabSettings.logoUrl || prev.logoUrl || '',
      labName: vendorLabSettings.labName || prev.labName || '',
      tagline: vendorLabSettings.tagline || prev.tagline || '',
      siteDescription:
        vendorLabSettings.siteDescription ||
        vendorLabSettings.description ||
        prev.siteDescription ||
        '',
      description: vendorLabSettings.description || prev.description || '',
      featureImageUrl:
        vendorLabSettings.featureImageUrl ||
        vendorLabSettings.ogImageUrl ||
        prev.featureImageUrl ||
        '',
      ogImageUrl:
        vendorLabSettings.ogImageUrl ||
        vendorLabSettings.featureImageUrl ||
        prev.ogImageUrl ||
        '',
      qrCode1Url: vendorLabSettings.qrCode1Url || prev.qrCode1Url || '',
      upiId1: vendorLabSettings.upiId1 || prev.upiId1 || 'apexlab@icici',
      merchantName: vendorLabSettings.merchantName || prev.merchantName || 'Apex Diagnostic Lab',
      purchasedPlan: vendorLabSettings.purchasedPlan || prev.purchasedPlan || '1 Month',
      remainingVisibilityDays:
        vendorLabSettings.remainingVisibilityDays ?? prev.remainingVisibilityDays ?? 24,
    }));
  }, [vendorLabSettings]);

  // Handle Local Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setFormData((prev) => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Feature Image Upload
  const handleFeatureImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          featureImageUrl: result,
          ogImageUrl: result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Payment QR Upload
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>, qrSlot: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (qrSlot === 1) {
          setFormData((prev) => ({ ...prev, qrCode1Url: result }));
        } else {
          setFormData((prev) => ({ ...prev, qrCode2Url: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Settings
  const handleSave = () => {
    updateVendorLabSettings({
      ...formData,
      name: formData.labName,
      description: formData.siteDescription || formData.description,
      ogImageUrl: formData.featureImageUrl || formData.ogImageUrl,
    });
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3500);
  };

  // Calculate or Switch Purchased Plan
  const handleSelectPlan = (planType: '1 Month' | '3 Months' | '1 Year') => {
    let duration = 30;
    let remaining = 24;
    let expires = new Date();

    if (planType === '1 Month') {
      duration = 30;
      remaining = 24;
      expires.setDate(expires.getDate() + remaining);
    } else if (planType === '3 Months') {
      duration = 90;
      remaining = 78;
      expires.setDate(expires.getDate() + remaining);
    } else if (planType === '1 Year') {
      duration = 365;
      remaining = 312;
      expires.setDate(expires.getDate() + remaining);
    }

    const updated = {
      purchasedPlan: planType,
      planDurationDays: duration,
      remainingVisibilityDays: remaining,
      planPurchasedAt: new Date().toISOString().split('T')[0],
      planExpiresAt: expires.toISOString().split('T')[0],
    };

    setFormData((prev) => ({ ...prev, ...updated }));
    updateVendorLabSettings(updated);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  // Add / Extend Remaining Days
  const handleAddDays = (extraDays: number) => {
    const newRemaining = (formData.remainingVisibilityDays || 0) + extraDays;
    const expires = new Date();
    expires.setDate(expires.getDate() + newRemaining);

    const updated = {
      remainingVisibilityDays: newRemaining,
      planExpiresAt: expires.toISOString().split('T')[0],
    };

    setFormData((prev) => ({ ...prev, ...updated }));
    updateVendorLabSettings(updated);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  // Active Plan details lookup
  const currentPlan = formData.purchasedPlan || '1 Month';
  const remainingDays = formData.remainingVisibilityDays ?? 24;
  const totalDays =
    formData.planDurationDays ||
    (currentPlan === '1 Year' ? 365 : currentPlan === '3 Months' ? 90 : 30);
  const percentageRemaining = Math.min(100, Math.max(0, Math.round((remainingDays / totalDays) * 100)));

  // Pricing info lookup
  const planPriceMap: Record<string, { price: number; cycle: string; badge: string; popular?: boolean }> = {
    '1 Month': { price: 1499, cycle: 'Per Month', badge: 'Flexible Starter' },
    '3 Months': { price: 3999, cycle: 'Per 3 Months', badge: 'Quarterly Choice', popular: true },
    '1 Year': { price: 11999, cycle: 'Per Year', badge: 'Annual Value Pack' },
  };

  const planInfo = planPriceMap[currentPlan] || planPriceMap['1 Month'];

  // Generated QR placeholder if none uploaded
  const effectiveQrCode1 =
    formData.qrCode1Url ||
    `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=upi://pay?pa=${encodeURIComponent(
      formData.upiId1 || 'apexlab@icici'
    )}%26pn=${encodeURIComponent(formData.merchantName || formData.labName || 'Apex Diagnostic Lab')}%26cu=INR`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-black text-[#123B6D]">
                7. Site Settings &amp; Plan Visibility
              </h1>
              <p className="text-xs text-slate-500">
                Manage your diagnostic laboratory branding, payment QR, and active subscription visibility days.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateView && (
            <button
              type="button"
              onClick={() => onNavigateView('vendor_website')}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              <span>Preview Website</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-black bg-[#123B6D] hover:bg-[#0e2c52] text-white flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>Save All Settings</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {isSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>Site Settings &amp; Active Plan saved successfully!</span>
        </div>
      )}

      {/* Navigation Pills */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 flex items-center gap-1.5 overflow-x-auto shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveSection('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeSection === 'all'
              ? 'bg-[#123B6D] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Settings
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('logo')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
            activeSection === 'logo'
              ? 'bg-[#123B6D] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span>Logo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('name')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
            activeSection === 'name'
              ? 'bg-[#123B6D] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Type className="w-3.5 h-3.5 text-blue-500" />
          <span>Site Name</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('description')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
            activeSection === 'description'
              ? 'bg-[#123B6D] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-emerald-500" />
          <span>Site Description</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('feature')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
            activeSection === 'feature'
              ? 'bg-[#123B6D] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Feature Image</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('payment_qr')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
            activeSection === 'payment_qr'
              ? 'bg-[#123B6D] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-3.5 h-3.5 text-purple-500" />
          <span>Payment QR</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('plan')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
            activeSection === 'plan'
              ? 'bg-amber-400 text-slate-950 font-black shadow-2xs'
              : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          <span>Plan &amp; Pricing ({remainingDays} Days Left)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. LOGO SECTION */}
      {/* ======================================================== */}
      {(activeSection === 'all' || activeSection === 'logo') && (
        <div id="section-logo" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                <ImageIcon className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900">1. Official Diagnostic Lab Logo</h2>
                <p className="text-xs text-slate-500">
                  Visible in website top navigation, patient invoices, lab report letterheads, and mobile view.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Site Setting
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Logo Live Preview */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-3">
              <span className="text-[11px] font-bold text-slate-500 block">Live Logo Preview</span>
              <div className="w-28 h-28 mx-auto rounded-2xl bg-white border border-slate-200 shadow-2xs p-2 flex items-center justify-center overflow-hidden">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Lab Logo Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40" />
                    <span className="text-[10px] font-bold">No Logo Uploaded</span>
                  </div>
                )}
              </div>

              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Logo</span>
                </button>
              )}

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Recommended: Square or horizontal PNG/SVG with transparent background (400×400px).
              </p>
            </div>

            {/* Logo Upload & URL Options */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Upload Logo File from Device
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-[#123B6D] hover:bg-slate-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-600 font-bold">
                      <span className="text-[#123B6D]">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, SVG, WebP (Max 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Or Direct URL Input */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Or Paste Image URL</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomLogoUrlOpen(!isCustomLogoUrlOpen)}
                    className="text-[11px] font-bold text-[#123B6D] hover:underline cursor-pointer"
                  >
                    {isCustomLogoUrlOpen ? 'Hide URL Box' : 'Enter URL Manually'}
                  </button>
                </div>
                {isCustomLogoUrlOpen && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={customLogoUrlInput}
                      onChange={(e) => setCustomLogoUrlInput(e.target.value)}
                      className="flex-1 p-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customLogoUrlInput) {
                          setFormData((prev) => ({ ...prev, logoUrl: customLogoUrlInput }));
                          setCustomLogoUrlInput('');
                        }
                      }}
                      className="px-3 py-2 bg-[#123B6D] text-white rounded-xl text-xs font-bold hover:bg-[#0e2c52] cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Sample Logos */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  Or select a sample diagnostic insignia:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {SAMPLE_LAB_LOGOS.map((sample, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, logoUrl: sample.url }))}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-[#123B6D] hover:bg-slate-50 flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer"
                    >
                      <img
                        src={sample.url}
                        alt={sample.name}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded object-cover"
                      />
                      <span>{sample.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SITE NAME SECTION */}
      {/* ======================================================== */}
      {(activeSection === 'all' || activeSection === 'name') && (
        <div id="section-name" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Type className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900">2. Official Site Name &amp; Lab Title</h2>
                <p className="text-xs text-slate-500">
                  Sets the primary brand identity across the browser title bar, SEO cards, header banner, and patient communications.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Site Setting
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Site Name / Diagnostic Centre Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.labName}
                onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
                placeholder="e.g. Apex Diagnostic & Clinical Pathology Laboratory"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-extrabold text-xs text-[#123B6D] focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                This appears as the main heading across your website and in the header brand badge.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Site Subtitle / Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g. Advanced Pathology, Biochemistry & Diagnostic Testing Centre"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Short 1-liner displayed below your laboratory name.
              </p>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
              Browser Title Bar &amp; Header Preview
            </span>
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
              <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-xs font-black text-[#123B6D]">
                  {formData.labName || 'Your Diagnostic Lab Name'}
                </span>
                <span className="text-xs text-slate-400 mx-1.5">•</span>
                <span className="text-xs text-slate-600 font-medium">
                  {formData.tagline || '100% NABL Accredited Pathology'}
                </span>
                <span className="text-[10px] text-slate-400 ml-2">| INDIANLALAJI.COM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SITE DESCRIPTION SECTION */}
      {/* ======================================================== */}
      {(activeSection === 'all' || activeSection === 'description') && (
        <div id="section-description" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <FileText className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900">3. Site Description &amp; Meta Summary</h2>
                <p className="text-xs text-slate-500">
                  Used by Google search engines, social media sharing previews, and the website's introductory hero summary.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Site Setting
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Site Description Content <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {(formData.siteDescription || '').length} characters (Optimal: 140–280)
              </span>
            </div>
            <textarea
              rows={4}
              value={formData.siteDescription || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  siteDescription: e.target.value,
                  description: e.target.value,
                })
              }
              placeholder="Write a clear, reassuring summary of your pathology laboratory, sample collection capabilities, turnaround times, and NABL accreditation..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Google Search Snippet Preview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Google Search Result Snippet Preview
            </span>
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
              <div className="text-[11px] text-emerald-800 flex items-center gap-1 font-mono">
                <span>https://{vendorLabSettings.domainPreview || 'apexdiagnostics.indianlalaji.com'}</span>
                <span>›</span>
                <span>home</span>
              </div>
              <h3 className="text-sm font-bold text-blue-800 hover:underline cursor-pointer">
                {formData.labName || 'Apex Diagnostic & Clinical Pathology Laboratory'}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {formData.siteDescription ||
                  'Advanced Pathology, Biochemistry & Diagnostic Testing Centre. 100% NABL Accredited & Certified. Instant digital WhatsApp PDF reports & doorstep sample collection.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. FEATURE IMAGE SECTION */}
      {/* ======================================================== */}
      {(activeSection === 'all' || activeSection === 'feature') && (
        <div id="section-feature" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900">4. Feature Image (Hero &amp; Social Card)</h2>
                <p className="text-xs text-slate-500">
                  Primary banner image displayed on WhatsApp link shares, Twitter/Facebook open graph cards, and website hero spotlight.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Site Setting
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Feature Image Live Preview */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block">
                Social Share &amp; Feature Preview (16:9 / 1200×630)
              </span>
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-slate-900 group">
                {formData.featureImageUrl ? (
                  <img
                    src={formData.featureImageUrl}
                    alt="Feature Image Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-10 h-10 opacity-40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                  <div className="text-white">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                      FEATURE IMAGE
                    </span>
                    <h4 className="text-xs font-black mt-1 line-clamp-1">
                      {formData.labName || 'Apex Diagnostic Laboratory'}
                    </h4>
                  </div>
                </div>
              </div>

              {formData.featureImageUrl && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, featureImageUrl: '', ogImageUrl: '' }))}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Feature Image</span>
                </button>
              )}
            </div>

            {/* Feature Image Upload & Select Options */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Upload Feature Image File
                </label>
                <label className="flex flex-col items-center justify-center w-full h-28 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-[#123B6D] hover:bg-slate-50">
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-600 font-bold">
                      <span className="text-[#123B6D]">Click to upload</span> or drag banner
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">High-res 1200×630px recommended</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFeatureImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Or Direct URL Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Or Image URL</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomFeatureUrlOpen(!isCustomFeatureUrlOpen)}
                    className="text-[11px] font-bold text-[#123B6D] hover:underline cursor-pointer"
                  >
                    {isCustomFeatureUrlOpen ? 'Hide URL' : 'Enter Image URL'}
                  </button>
                </div>
                {isCustomFeatureUrlOpen && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={customFeatureUrlInput}
                      onChange={(e) => setCustomFeatureUrlInput(e.target.value)}
                      className="flex-1 p-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customFeatureUrlInput) {
                          setFormData((prev) => ({
                            ...prev,
                            featureImageUrl: customFeatureUrlInput,
                            ogImageUrl: customFeatureUrlInput,
                          }));
                          setCustomFeatureUrlInput('');
                        }
                      }}
                      className="px-3 py-2 bg-[#123B6D] text-white rounded-xl text-xs font-bold hover:bg-[#0e2c52] cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Sample Images */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  Select a clinical photography preset:
                </span>
                <div className="space-y-1.5">
                  {SAMPLE_FEATURE_IMAGES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          featureImageUrl: sample.url,
                          ogImageUrl: sample.url,
                        }))
                      }
                      className="w-full p-2 rounded-xl border border-slate-200 hover:border-[#123B6D] hover:bg-slate-50 flex items-center gap-2.5 text-xs text-left font-bold text-slate-800 transition cursor-pointer"
                    >
                      <img
                        src={sample.url}
                        alt={sample.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-8 rounded-lg object-cover"
                      />
                      <span className="truncate">{sample.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. PAYMENT QR SECTION */}
      {/* ======================================================== */}
      {(activeSection === 'all' || activeSection === 'payment_qr') && (
        <div id="section-payment-qr" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                <QrCode className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900">5. Payment QR &amp; Digital Collections</h2>
                <p className="text-xs text-slate-500">
                  Displayed on the website "Payment QR" modal, booking checkout, reception desk receipts, and phlebotomist collections.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Site Setting
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Live Scan Card Preview */}
            <div className="bg-gradient-to-b from-[#123B6D] to-[#0A2547] text-white p-5 rounded-2xl shadow-md text-center space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                <span>Official UPI QR</span>
                <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">Instant Credit</span>
              </div>

              {/* QR Image Box */}
              <div className="bg-white p-3 rounded-2xl max-w-[200px] mx-auto shadow-inner">
                <img
                  src={effectiveQrCode1}
                  alt="UPI Payment QR"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain mx-auto"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-black truncate">
                  {formData.merchantName || formData.labName || 'Apex Diagnostic Lab Pvt Ltd'}
                </h4>
                <div className="bg-white/10 rounded-lg p-1.5 text-[11px] font-mono flex items-center justify-between gap-1">
                  <span className="truncate">{formData.upiId1 || 'apexlab@icici'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.upiId1) {
                        navigator.clipboard.writeText(formData.upiId1);
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 2000);
                      }
                    }}
                    className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-white/80" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-300">
                <span>PhonePe</span> • <span>Google Pay</span> • <span>Paytm</span> • <span>BHIM</span>
              </div>
            </div>

            {/* Payment QR Inputs */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary UPI ID (VPA) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.upiId1}
                    onChange={(e) => setFormData({ ...formData, upiId1: e.target.value })}
                    placeholder="e.g. apexlab@icici or 9876543210@paytm"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Direct bank linked Virtual Payment Address.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Merchant / Beneficiary Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.merchantName}
                    onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                    placeholder="e.g. Apex Diagnostic Lab Pvt Ltd"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Name verified by banking app upon scanning.
                  </p>
                </div>
              </div>

              {/* Upload QR Image */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Upload Standee / Bank QR Code Image
                </label>
                <label className="flex flex-col items-center justify-center w-full h-24 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-[#123B6D] hover:bg-slate-50">
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-600 font-bold">
                      <span className="text-[#123B6D]">Upload QR Code PNG / JPG</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Upload your official PhonePe, Google Pay, or Paytm merchant QR image
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleQrUpload(e, 1)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Secondary QR (Optional) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block mb-1">
                  Optional: Secondary QR (For Phlebotomist Home Visits)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <input
                    type="text"
                    value={formData.upiId2 || ''}
                    onChange={(e) => setFormData({ ...formData, upiId2: e.target.value })}
                    placeholder="Secondary UPI ID (e.g. apexvisit@oksbi)"
                    className="p-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                  <label className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload 2nd QR</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleQrUpload(e, 2)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. PLAN & PRICING: SHOW ONLY CURRENTLY PURCHASED PLAN */}
      {/* (WITH REMAINING VISIBILITY DAYS) */}
      {/* ======================================================== */}
      {(activeSection === 'all' || activeSection === 'plan') && (
        <div id="section-plan" className="bg-white rounded-2xl border-2 border-amber-300 p-6 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-100 text-amber-900">
                <Zap className="w-5 h-5 fill-amber-500 text-amber-700" />
              </span>
              <div>
                <h2 className="text-base font-black text-[#123B6D]">
                  Plan &amp; Pricing: Active Laboratory Subscription
                </h2>
                <p className="text-xs text-slate-600">
                  Showing <strong>only</strong> the plan currently purchased by this diagnostic lab with remaining visibility days.
                </p>
              </div>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Active Purchased Plan</span>
            </span>
          </div>

          {/* ======================================================== */}
          {/* THE SINGLE ACTIVE PURCHASED PLAN CARD WITH REMAINING DAYS */}
          {/* (1 Month | 3 Months | 1 Year) */}
          {/* ======================================================== */}
          <div className="bg-gradient-to-br from-amber-50/70 via-white to-sky-50/40 rounded-2xl border-2 border-[#123B6D]/20 p-6 shadow-sm relative overflow-hidden">
            {/* Top Accent Stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-[#123B6D] to-emerald-500" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* Left Column: Plan Identity & Price */}
              <div className="space-y-2 lg:border-r lg:border-slate-200 lg:pr-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#123B6D] text-white">
                    {planInfo.badge}
                  </span>
                  {planInfo.popular && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                      ★ MOST POPULAR
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-black text-[#123B6D] tracking-tight">
                  {currentPlan}
                </h3>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-slate-900">
                    ₹{planInfo.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    / {planInfo.cycle}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  Full software access with automated NABL test catalog, online patient portal, WhatsApp reports, and live website hosting.
                </p>

                <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Licensed &amp; Verified by INDIANLALAJI.COM</span>
                </div>
              </div>

              {/* Middle Column: Prominent Remaining Visibility Days Display */}
              <div className="bg-white p-5 rounded-2xl border-2 border-emerald-300 shadow-2xs space-y-4 text-center lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 text-left">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                      Portal Status
                    </span>
                    <span className="text-xs font-black text-[#123B6D] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{currentPlan} — Active Visibility</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-400 block">Renewal / Expiry Date</span>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {formData.planExpiresAt || '17 Mar 2026'}
                    </span>
                  </div>
                </div>

                {/* Big Visual Countdown Box */}
                <div className="py-2">
                  <div className="inline-flex flex-col items-center justify-center p-4 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-2xs min-w-[220px]">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                      {currentPlan} — Remaining Visibility Days
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-5xl font-black text-emerald-700 tracking-tight font-mono">
                        {remainingDays}
                      </span>
                      <span className="text-sm font-black text-emerald-900">
                        Days Remaining
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 mt-1">
                      {remainingDays > 7
                        ? `● Website Live & Visible to All Patients (${percentageRemaining}% Remaining)`
                        : '⚠️ Plan Expiring Soon — Renew to keep visibility active'}
                    </span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Visibility Period Progress</span>
                    <span className="font-mono text-emerald-700">{remainingDays} of {totalDays} Days Left</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        remainingDays > 10
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                          : 'bg-gradient-to-r from-amber-500 to-rose-500'
                      }`}
                      style={{ width: `${percentageRemaining}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Start: {formData.planPurchasedAt || '15 Feb 2026'}</span>
                    <span>Expires: {formData.planExpiresAt || '17 Mar 2026'}</span>
                  </div>
                </div>

                {/* Key Benefits with this Plan */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                    <span className="font-bold text-slate-800 block">🌐 Public Domain</span>
                    <span className="text-slate-500 text-[10px]">Indexed on IndianLalaJi</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                    <span className="font-bold text-slate-800 block">📱 WhatsApp PDF</span>
                    <span className="text-slate-500 text-[10px]">Direct report delivery</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                    <span className="font-bold text-slate-800 block">💳 UPI QR Gateway</span>
                    <span className="text-slate-500 text-[10px]">0% commission fees</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SIMULATION & PLAN SWITCHER (ADMIN / TESTING CONTROL) */}
          {/* (Allows user to test and view 1 Month, 3 Months, or 1 Year) */}
          {/* ======================================================== */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black text-slate-800 block">
                  Switch Purchased Plan or Extend Visibility Days
                </span>
                <p className="text-[11px] text-slate-500">
                  Select between the 3 standardized license durations to update the active purchased plan and view its remaining visibility days.
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* 1 Month Button */}
                <button
                  type="button"
                  onClick={() => handleSelectPlan('1 Month')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    currentPlan === '1 Month'
                      ? 'bg-[#123B6D] text-white shadow-xs font-black ring-2 ring-amber-400'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  <span>1 Month (₹1,499)</span>
                  {currentPlan === '1 Month' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                {/* 3 Months Button */}
                <button
                  type="button"
                  onClick={() => handleSelectPlan('3 Months')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    currentPlan === '3 Months'
                      ? 'bg-[#123B6D] text-white shadow-xs font-black ring-2 ring-amber-400'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  <span>3 Months (₹3,999)</span>
                  {currentPlan === '3 Months' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                {/* 1 Year Button */}
                <button
                  type="button"
                  onClick={() => handleSelectPlan('1 Year')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    currentPlan === '1 Year'
                      ? 'bg-[#123B6D] text-white shadow-xs font-black ring-2 ring-amber-400'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  <span>1 Year (₹11,999)</span>
                  {currentPlan === '1 Year' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              </div>
            </div>

            {/* Quick Extension Buttons */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-[11px] text-slate-500 font-medium">
                Add extra visibility days to the active plan:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddDays(30)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold transition cursor-pointer"
                >
                  +30 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleAddDays(90)}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 font-bold transition cursor-pointer"
                >
                  +90 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleAddDays(365)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 font-bold transition cursor-pointer"
                >
                  +1 Year (365 Days)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Bar */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-300 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-black text-[#123B6D]">
            {formData.labName || 'Apex Diagnostic Central'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold text-slate-600">
            Active Plan: <strong className="text-emerald-700">{currentPlan}</strong> ({remainingDays} Visibility Days)
          </span>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2 rounded-xl text-xs font-black bg-[#123B6D] hover:bg-[#0e2c52] text-white flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
        >
          <Save className="w-4 h-4 text-amber-400" />
          <span>Save All Settings</span>
        </button>
      </div>
    </div>
  );
};
