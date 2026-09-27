import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ban,
  Trash2,
  Edit2,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  IndianRupee,
  Receipt,
  FileCheck,
  ChevronDown,
  X,
  Sparkles,
  ArrowRight,
  Filter,
  Globe,
  FileText,
  Copy,
  Check,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { VendorLabDirectoryItem, VendorStatus, AppView } from '../../types';
import { getTenantDirectUrl, getTenantSubdomain } from '../../constants/domains';

interface VendorManagementTabProps {
  onNavigateView: (view: AppView) => void;
  showToast: (msg: string) => void;
  viewMode?: 'pending' | 'clients' | 'all';
}

export const VendorManagementTab: React.FC<VendorManagementTabProps> = ({
  onNavigateView,
  showToast,
  viewMode = 'all',
}) => {
  const {
    vendorLabsList,
    addVendorLab,
    updateVendorLab,
    updateVendorLabCredentials,
    deleteVendorLab,
    setVendorStatus,
    selectVendorLab,
    superAdminTenantScope,
    setSuperAdminTenantScope,
  } = useCms();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | VendorStatus>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorLabDirectoryItem | null>(null);
  const [deleteConfirmVendor, setDeleteConfirmVendor] = useState<VendorLabDirectoryItem | null>(null);
  const [draftVisitVendor, setDraftVisitVendor] = useState<VendorLabDirectoryItem | null>(null);
  const [copiedLabId, setCopiedLabId] = useState<string | null>(null);

  // Change Password Modal State
  const [passwordVendor, setPasswordVendor] = useState<VendorLabDirectoryItem | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    pin: '123456',
    showPassword: false,
  });

  // Form state for add / edit
  const initialFormState: Omit<VendorLabDirectoryItem, 'id'> = {
    name: '',
    tagline: 'Precision Diagnostics & Pathology Services',
    ownerName: '',
    phone: '',
    email: '',
    password: 'owner123',
    pin: '123456',
    city: '',
    state: 'Punjab',
    address: '',
    nablCode: '',
    badge: 'Draft - Pending Admin Approval',
    rating: 4.9,
    activePackages: 12,
    turnaroundTime: '6-8 Hours',
    emergency: true,
    color: '#123B6D',
    status: 'Draft',
    isWebsiteApproved: false,
    subscriptionPlan: 'Professional Lab Plan',
    subscriptionAmount: 1999,
    paymentMode: 'UPI / QR Code',
    paymentReference: '',
    paymentNotes: '',
    joinedDate: new Date().toISOString().split('T')[0],
    domainPreview: '',
    establishedYear: 2018,
    reviewsCount: 140,
    features: ['WhatsApp Reports', 'Home Collection', 'NABL Format', 'Thermal Barcode'],
  };

  const [formState, setFormState] = useState<Omit<VendorLabDirectoryItem, 'id'>>(initialFormState);
  const [editShowPassword, setEditShowPassword] = useState(false);

  // Stats calculation
  const stats = useMemo(() => {
    const total = vendorLabsList.length;
    const draft = vendorLabsList.filter((v) => v.status === 'Draft').length;
    const active = vendorLabsList.filter((v) => v.status === 'Active').length;
    const pending = vendorLabsList.filter((v) => v.status === 'Pending').length;
    const processingPayment = vendorLabsList.filter(
      (v) => v.status === 'Processing due to payment confirmation'
    ).length;
    const suspended = vendorLabsList.filter((v) => v.status === 'Suspended').length;
    return { total, draft, active, pending, processingPayment, suspended };
  }, [vendorLabsList]);

  // Unique cities for filter
  const cities = useMemo(() => {
    const set = new Set<string>();
    vendorLabsList.forEach((v) => {
      if (v.city) set.add(v.city);
    });
    return Array.from(set).sort();
  }, [vendorLabsList]);

  // Filtered list
  const filteredVendors = useMemo(() => {
    return vendorLabsList.filter((v) => {
      if (viewMode === 'pending') {
        // Pending Labs: Sirf wahi labs jo Active nahi hain (Pending, Draft, Processing due to payment confirmation)
        if (v.status === 'Active') return false;
      } else if (viewMode === 'clients') {
        // Our Clients: Sirf Active users / Published labs hi dikhao (Strictly Active only)
        if (v.status !== 'Active') return false;
      } else if (statusFilter !== 'All' && v.status !== statusFilter) {
        return false;
      }

      const matchesCity = selectedCity === 'All' ? true : v.city === selectedCity;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        (v.ownerName && v.ownerName.toLowerCase().includes(q)) ||
        (v.phone && v.phone.toLowerCase().includes(q)) ||
        (v.city && v.city.toLowerCase().includes(q)) ||
        (v.nablCode && v.nablCode.toLowerCase().includes(q)) ||
        (v.paymentReference && v.paymentReference.toLowerCase().includes(q));

      return matchesCity && matchesSearch;
    });
  }, [vendorLabsList, statusFilter, selectedCity, searchQuery, viewMode]);

  // Handlers
  const handleOpenAddModal = () => {
    setFormState({
      ...initialFormState,
      status: 'Draft',
      isWebsiteApproved: false,
      badge: 'Draft - Pending Admin Approval',
      joinedDate: new Date().toISOString().split('T')[0],
      password: 'owner123',
      pin: '123456',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (vendor: VendorLabDirectoryItem) => {
    setEditingVendor(vendor);
    setFormState({
      name: vendor.name,
      tagline: vendor.tagline || 'Precision Diagnostics & Pathology Services',
      ownerName: vendor.ownerName || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      password: vendor.password || 'owner123',
      pin: vendor.pin || '123456',
      city: vendor.city || '',
      state: vendor.state || 'Punjab',
      address: vendor.address || '',
      nablCode: vendor.nablCode || '',
      badge: vendor.badge || (vendor.status === 'Draft' ? 'Draft - Pending Admin Approval' : 'Verified Lab'),
      rating: vendor.rating || 4.8,
      activePackages: vendor.activePackages || 10,
      turnaroundTime: vendor.turnaroundTime || '6-8 Hours',
      emergency: vendor.emergency ?? true,
      color: vendor.color || '#123B6D',
      status: vendor.status || 'Draft',
      isWebsiteApproved: vendor.isWebsiteApproved ?? (vendor.status === 'Active'),
      subscriptionPlan: vendor.subscriptionPlan || 'Professional Lab Plan',
      subscriptionAmount: vendor.subscriptionAmount || 1999,
      paymentMode: vendor.paymentMode || 'UPI / QR Code',
      paymentReference: vendor.paymentReference || '',
      paymentNotes: vendor.paymentNotes || '',
      joinedDate: vendor.joinedDate || new Date().toISOString().split('T')[0],
      domainPreview: vendor.domainPreview || '',
      establishedYear: vendor.establishedYear || 2018,
      reviewsCount: vendor.reviewsCount || 100,
      features: vendor.features || ['WhatsApp Reports', 'Home Collection'],
    });
  };

  const handleOpenPasswordModal = (vendor: VendorLabDirectoryItem) => {
    setPasswordVendor(vendor);
    setPasswordForm({
      password: vendor.password || 'owner123',
      pin: vendor.pin || '123456',
      showPassword: false,
    });
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordVendor) return;
    if (!passwordForm.password.trim()) {
      showToast('Please enter a valid password (कम से कम 4 अक्षर)');
      return;
    }
    const cleanPass = passwordForm.password.trim();
    const cleanPin = passwordForm.pin.trim() || '123456';

    updateVendorLab(passwordVendor.id, {
      password: cleanPass,
      pin: cleanPin,
    });
    updateVendorLabCredentials(passwordVendor.id, cleanPass, cleanPin);

    showToast(`Password successfully changed for ${passwordVendor.name}! New password: "${cleanPass}"`);
    setPasswordVendor(null);
  };

  const handleSubmitSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      showToast('Please enter the laboratory name');
      return;
    }

    const isApproved = formState.status === 'Active';
    const autoSlug = formState.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'newlab';
    const rawDomain = formState.domainPreview?.trim() || `${autoSlug}.indianlalaji.com`;
    const finalDomain = rawDomain.includes('.') ? rawDomain : `${rawDomain}.indianlalaji.com`;

    if (editingVendor) {
      updateVendorLab(editingVendor.id, {
        ...formState,
        domainPreview: finalDomain,
        isWebsiteApproved: isApproved,
        password: formState.password,
        pin: formState.pin,
      });
      if (formState.password) {
        updateVendorLabCredentials(editingVendor.id, formState.password, formState.pin);
      }
      showToast(`Updated laboratory: ${formState.name} (${finalDomain})`);
      setEditingVendor(null);
    } else {
      // When a new website is created, it ALWAYS starts in DRAFT mode
      // Admin approval is strictly required before the website can be visited/live
      addVendorLab({
        ...formState,
        domainPreview: finalDomain,
        status: 'Draft',
        isWebsiteApproved: false,
        badge: 'Draft - Pending Admin Approval',
      });
      showToast(
        `Created lab "${formState.name}" in DRAFT mode. Admin approval is required before it can go live.`
      );
      setIsAddModalOpen(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmVendor) {
      deleteVendorLab(deleteConfirmVendor.id);
      showToast(`Deleted laboratory "${deleteConfirmVendor.name}"`);
      setDeleteConfirmVendor(null);
    }
  };

  const handleOpenLabWebsite = (vendor: VendorLabDirectoryItem | string) => {
    const labItem = typeof vendor === 'string' ? vendorLabsList.find((l) => l.id === vendor) : vendor;
    if (labItem && (labItem.status !== 'Active' || !labItem.isWebsiteApproved)) {
      setDraftVisitVendor(labItem);
      return;
    }
    const labId = typeof vendor === 'string' ? vendor : vendor.id;
    selectVendorLab(labId);
    onNavigateView('vendor_website');
  };

  const handleOpenVendorReportPage = (vendor: VendorLabDirectoryItem | string) => {
    const labId = typeof vendor === 'string' ? vendor : vendor.id;
    selectVendorLab(labId);
    onNavigateView('patient_portal');
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {viewMode === 'pending'
                ? 'Labs Section — Pending Labs (अप्रूवल पेंडिंग लैब्स)'
                : viewMode === 'clients'
                ? 'Our Clients — Published / Live Labs List (पब्लिश्ड / लाइव क्लाइंट्स)'
                : 'Partner Laboratories & Vendor Management'}
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            {viewMode === 'pending'
              ? 'Search Lab • Lab Status: Pending • Lab Actions: Approval, Live / Visit, Edit, Make Draft, Change Password, Delete (हटाएं)'
              : viewMode === 'clients'
              ? 'Search Client Labs • Lab Status: Published / Live • Actions: Live / Visit, Edit, Make Draft, Change Password, Delete (हटाएं)'
              : 'Control onboarding, approvals, payment confirmation status, and live websites of all diagnostic laboratories hosted on your portal.'}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          id="btn-add-new-vendor"
          className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>Add New Lab Vendor</span>
        </button>
      </div>

      {/* Draft Labs Pending Approval Alert Banner (when newly created labs are in Draft mode) */}
      {viewMode !== 'clients' && stats.draft > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 p-4 sm:p-5 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                <span>{stats.draft} New Laboratory Website(s) in Draft Mode</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-900 uppercase font-black tracking-wider">
                  Pending Admin Approval
                </span>
              </h4>
              <p className="text-xs text-amber-900/80 mt-0.5">
                New laboratories start in Draft mode so their website remains unpublished until you approve it. Review their setup and click <strong>Approve & Publish Live</strong> to make the website public to patients.
              </p>
            </div>
          </div>

          <button
            onClick={() => setStatusFilter('Draft')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <span>Review {stats.draft} Draft Lab(s)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Payment Confirmation Alert Banner (if any lab is in payment confirmation status) */}
      {viewMode !== 'clients' && stats.processingPayment > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 sm:p-5 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                <span>{stats.processingPayment} Lab(s) Awaiting Payment Confirmation</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-900 uppercase font-black tracking-wider">
                  Action Required
                </span>
              </h4>
              <p className="text-xs text-amber-900/80 mt-0.5">
                New laboratories have submitted onboarding requests with payment references. Review their bank/UPI reference and click <strong>Confirm & Activate</strong> to grant them full access.
              </p>
            </div>
          </div>

          <button
            onClick={() => setStatusFilter('Processing due to payment confirmation')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <span>Review {stats.processingPayment} Lab(s)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      {(!viewMode || viewMode === 'all') && (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total */}
        <div
          onClick={() => setStatusFilter('All')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'All'
              ? 'bg-white border-[#123B6D] ring-2 ring-[#123B6D]/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Labs</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[11px] text-slate-500 font-medium">onboarded</span>
          </div>
        </div>

        {/* Draft Mode (Pending Approval) */}
        <div
          onClick={() => setStatusFilter('Draft')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'Draft'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>Draft Mode</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{stats.draft}</span>
            <span className="text-[10px] text-amber-800 font-bold bg-amber-200 px-1.5 py-0.2 rounded-full">
              need approval
            </span>
          </div>
        </div>

        {/* Active */}
        <div
          onClick={() => setStatusFilter('Active')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'Active'
              ? 'bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Active & Live</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{stats.active}</span>
            <span className="text-[11px] text-emerald-600 font-medium">operational</span>
          </div>
        </div>

        {/* Processing due to payment confirmation */}
        <div
          onClick={() => setStatusFilter('Processing due to payment confirmation')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'Processing due to payment confirmation'
              ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>Payment Due Conf.</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{stats.processingPayment}</span>
            <span className="text-[10px] text-amber-800 font-bold bg-amber-200 px-1.5 py-0.2 rounded-full">
              verify UTR
            </span>
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => setStatusFilter('Pending')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'Pending'
              ? 'bg-sky-50 border-sky-600 ring-2 ring-sky-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between text-sky-700 text-xs font-semibold">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-800">{stats.pending}</span>
            <span className="text-[11px] text-sky-600 font-medium">in queue</span>
          </div>
        </div>

        {/* Suspended */}
        <div
          onClick={() => setStatusFilter('Suspended')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'Suspended'
              ? 'bg-rose-50 border-rose-600 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
            <span>Suspended</span>
            <Ban className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">{stats.suspended}</span>
            <span className="text-[11px] text-rose-600 font-medium">disabled</span>
          </div>
        </div>
      </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Lab */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              viewMode === 'pending'
                ? 'Search Lab by Name, Owner, Phone, City, NABL...'
                : viewMode === 'clients'
                ? 'Search Client Lab by Name, Owner, Phone, City...'
                : 'Search lab name, owner, phone, city...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#123B6D] focus:border-transparent bg-slate-50 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Status Pill for Pending / Live modes */}
        {viewMode === 'pending' && (
          <div className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Lab Status: <strong>Pending Approval ({filteredVendors.length})</strong></span>
          </div>
        )}

        {viewMode === 'clients' && (
          <div className="text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lab Status: <strong>Published / Live ({filteredVendors.length})</strong></span>
          </div>
        )}

        {/* Status Filters (for 'all' viewMode) */}
        {viewMode === 'all' && (
          <div className="flex items-center gap-1 flex-wrap w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {(['All', 'Draft', 'Active', 'Processing due to payment confirmation', 'Pending', 'Suspended'] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    statusFilter === status
                      ? 'bg-[#123B6D] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {status === 'Processing due to payment confirmation'
                    ? 'Payment Confirmation'
                    : status === 'Draft'
                    ? `Draft (${stats.draft})`
                    : status}
                </button>
              )
            )}
          </div>
        )}

        {/* City Filter */}
        {cities.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white focus:outline-none font-semibold text-slate-700"
            >
              <option value="All">All Cities ({vendorLabsList.length})</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Vendor Cards List */}
      <div className="space-y-4">
        {filteredVendors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No laboratories match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search keywords or resetting the status filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setSelectedCity('All');
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredVendors.map((vendor) => {
            const isProcessing = vendor.status === 'Processing due to payment confirmation';
            const isActive = vendor.status === 'Active';
            const isPending = vendor.status === 'Pending';
            const isSuspended = vendor.status === 'Suspended';

            return (
              <div
                key={vendor.id}
                className={`bg-white rounded-2xl border transition shadow-2xs overflow-hidden ${
                  isProcessing
                    ? 'border-amber-300 ring-1 ring-amber-400/40'
                    : isActive
                    ? 'border-slate-200 hover:border-slate-300'
                    : isSuspended
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="p-5 sm:p-6">
                  {/* Top Row: Lab Identity & Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm shrink-0"
                        style={{ backgroundColor: vendor.color || '#123B6D' }}
                      >
                        {vendor.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-extrabold text-slate-900">{vendor.name}</h3>
                          {vendor.nablCode && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>{vendor.nablCode}</span>
                            </span>
                          )}
                          {vendor.emergency && (
                            <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md">
                              24x7 Emergency
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {vendor.city}, {vendor.state} — {vendor.address}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      {viewMode === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Lab Status: Pending</span>
                        </span>
                      ) : viewMode === 'clients' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Lab Status: Published / Live</span>
                        </span>
                      ) : (
                        <>
                          {isActive && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Active on Portal</span>
                            </span>
                          )}
                          {vendor.status === 'Draft' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-700" />
                              <span>Draft (Pending Admin Approval)</span>
                            </span>
                          )}
                          {isProcessing && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                              <span>Processing due to payment confirmation</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                              <Clock className="w-3.5 h-3.5 text-sky-600" />
                              <span>Pending Admin Approval</span>
                            </span>
                          )}
                          {isSuspended && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <Ban className="w-3.5 h-3.5 text-rose-600" />
                              <span>Suspended</span>
                            </span>
                          )}
                        </>
                      )}

                      {/* Website Approval Status Indicator */}
                      {vendor.isWebsiteApproved && vendor.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Globe className="w-3 h-3 text-emerald-600" />
                          <span>Website: LIVE</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Website: DRAFT</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mid Row: Contacts, Subscription & Payment Details */}
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Owner & Phone */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        Lab Incharge / Owner
                      </span>
                      <div className="font-bold text-slate-800">{vendor.ownerName || 'Dr. Medical Director'}</div>
                      <div className="text-slate-600 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{vendor.phone}</span>
                      </div>
                      {vendor.email && (
                        <div className="text-slate-500 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{vendor.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Subscription Plan */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        SaaS Subscription Plan
                      </span>
                      <div className="font-bold text-slate-800">{vendor.subscriptionPlan || 'Professional Lab'}</div>
                      <div className="text-emerald-700 font-bold flex items-center gap-0.5">
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>{vendor.subscriptionAmount ? vendor.subscriptionAmount.toLocaleString('en-IN') : '1,999'} / month</span>
                      </div>
                      <div className="text-[11px] text-slate-400">Joined: {vendor.joinedDate || 'Recent'}</div>
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        Payment Confirmation
                      </span>
                      <div className="font-medium text-slate-700 flex items-center gap-1">
                        <Receipt className="w-3 h-3 text-slate-400" />
                        <span>Mode: <strong>{vendor.paymentMode || 'UPI / QR'}</strong></span>
                      </div>
                      <div className="text-slate-600 font-mono text-[11px] truncate">
                        Ref/UTR: <span className="font-bold text-slate-800">{vendor.paymentReference || 'None Provided'}</span>
                      </div>
                      {vendor.paymentNotes && (
                        <div className="text-slate-500 text-[11px] italic truncate">{vendor.paymentNotes}</div>
                      )}
                    </div>

                    {/* Portal Domain & Rating */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Globe className="w-3 h-3 text-indigo-600" />
                          <span>Dedicated Lab URL</span>
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Live Active URL
                        </span>
                      </div>

                      {/* Direct Working URL */}
                      <div className="flex items-center gap-1.5">
                        <div className="font-mono text-emerald-900 text-xs font-bold truncate bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-300/80 flex-1 flex items-center gap-1" title={getTenantDirectUrl(vendor.domainPreview || vendor.id)}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="truncate">{getTenantDirectUrl(vendor.domainPreview || vendor.id)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const directUrl = getTenantDirectUrl(vendor.domainPreview || vendor.id);
                            try {
                              navigator.clipboard.writeText(directUrl);
                            } catch {}
                            setCopiedLabId(vendor.id);
                            setTimeout(() => setCopiedLabId(null), 2000);
                            showToast(`Copied Live Direct URL for ${vendor.name}! Opens directly in any browser.`);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shrink-0 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Copy live link that opens directly on any phone or browser"
                        >
                          {copiedLabId === vendor.id ? (
                            <>
                              <Check className="w-3 h-3 text-white" />
                              <span className="font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-white" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Subdomain reference */}
                      {vendor.domainPreview && !vendor.domainPreview.toLowerCase().includes('healtech') && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                          <Globe className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="text-slate-400">Subdomain:</span>
                          <span className="text-indigo-700 font-semibold">{vendor.domainPreview}</span>
                        </div>
                      )}

                      {/* Dedicated Report Portal Link */}
                      <div className="flex items-center justify-between gap-1 text-[11px] bg-emerald-50/70 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
                        <div className="flex items-center gap-1 text-emerald-900 font-medium">
                          <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Dedicated Report Page:</span>
                          <span className="font-mono font-bold text-emerald-800">?view=patient_portal&lab={vendor.id}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenVendorReportPage(vendor.id)}
                          className="text-[10px] font-black text-emerald-700 hover:text-emerald-950 underline flex items-center gap-0.5 cursor-pointer ml-2"
                          title="Open this vendor's dedicated report search page"
                        >
                          <span>Open Report Page (रिपोर्ट पेज खोलें)</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <div className="text-slate-500 text-[11px]">
                        ★ {vendor.rating} ({vendor.reviewsCount || 80}+ reviews) • {vendor.turnaroundTime} TAT
                      </div>
                    </div>
                  </div>

                  {/* Super Admin Quick Credentials View */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/80 px-3.5 py-2 rounded-xl">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-purple-600" />
                        <span>Vendor Access Credentials:</span>
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-purple-950 bg-white px-2 py-0.5 rounded-md border border-purple-200 shadow-2xs">
                        <span className="text-slate-400 font-sans font-medium">Password:</span>
                        <strong className="text-purple-700 font-black">{vendor.password || 'owner123'}</strong>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-indigo-950 bg-white px-2 py-0.5 rounded-md border border-indigo-200 shadow-2xs">
                        <span className="text-slate-400 font-sans font-medium">PIN:</span>
                        <strong className="text-indigo-700 font-black">{vendor.pin || '123456'}</strong>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        (Login via Phone: <strong>{vendor.phone}</strong> or Email)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenPasswordModal(vendor)}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-100/70 hover:bg-purple-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3 text-purple-700" />
                      <span>Change Password (पासवर्ड बदलें)</span>
                    </button>
                  </div>

                  {/* Bottom Row: Actions & Status Controls */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    {/* Action Buttons for Pending Labs */}
                    {viewMode === 'pending' && (
                      <div className="flex items-center gap-2 flex-wrap w-full justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 1. APPROVAL */}
                          <button
                            type="button"
                            onClick={() => {
                              setVendorStatus(vendor.id, 'Active');
                              showToast(`Approved & Published LIVE: ${vendor.name}! Moved to Our Clients.`);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            title="Approve laboratory website and make it live on dedicated URL"
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>Approval (अप्रूवल)</span>
                          </button>

                          {/* 2. LIVE / VISIT */}
                          <button
                            type="button"
                            onClick={() => handleOpenLabWebsite(vendor.id)}
                            className="px-3 py-2 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Preview / visit dedicated lab website"
                          >
                            <Globe className="w-3.5 h-3.5 text-amber-300" />
                            <span>Live / Visit</span>
                            <ExternalLink className="w-3 h-3 text-slate-300" />
                          </button>

                          {/* 3. EDIT */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(vendor)}
                            className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Edit lab details, credentials, and NABL code"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Edit</span>
                          </button>

                          {/* 4. MAKE DRAFT */}
                          <button
                            type="button"
                            onClick={() => {
                              setVendorStatus(vendor.id, 'Draft');
                              showToast(`Set "${vendor.name}" to Draft status.`);
                            }}
                            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Keep or move to Draft status"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>Make Draft</span>
                          </button>

                          {/* 5. CHANGE PASSWORD */}
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordModal(vendor)}
                            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Change owner password and security PIN"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-purple-700" />
                            <span>Change Password</span>
                          </button>
                        </div>

                        {/* 6. DELETE (हटाएं) */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmVendor(vendor)}
                          className="px-3 py-2 text-rose-700 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                          title="Delete laboratory vendor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete (हटाएं)</span>
                        </button>
                      </div>
                    )}

                    {/* Action Buttons for Our Clients */}
                    {viewMode === 'clients' && (
                      <div className="flex items-center gap-2 flex-wrap w-full justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 1. LIVE / VISIT */}
                          <button
                            type="button"
                            onClick={() => handleOpenLabWebsite(vendor.id)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            title="Visit client live published website"
                          >
                            <Globe className="w-4 h-4 text-white" />
                            <span>Live / Visit</span>
                            <ExternalLink className="w-3 h-3 text-emerald-200" />
                          </button>

                          {/* 2. EDIT */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(vendor)}
                            className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Edit client lab details"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Edit</span>
                          </button>

                          {/* 3. MAKE DRAFT */}
                          <button
                            type="button"
                            onClick={() => {
                              setVendorStatus(vendor.id, 'Draft');
                              showToast(`Moved "${vendor.name}" back to Draft mode (Website unpublished).`);
                            }}
                            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Move website back to Draft mode to temporarily unpublish"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>Make Draft</span>
                          </button>

                          {/* 4. CHANGE PASSWORD */}
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordModal(vendor)}
                            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Change password & security PIN for this client"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-purple-700" />
                            <span>Change Password</span>
                          </button>
                        </div>

                        {/* 5. DELETE (हटाएं) */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmVendor(vendor)}
                          className="px-3 py-2 text-rose-700 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                          title="Delete client lab"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete (हटाएं)</span>
                        </button>
                      </div>
                    )}

                    {/* Standard Mode */}
                    {viewMode === 'all' && (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          {vendor.status !== 'Active' || !vendor.isWebsiteApproved ? (
                            <button
                              type="button"
                              onClick={() => {
                                setVendorStatus(vendor.id, 'Active');
                                showToast(`Approved & Published LIVE: ${vendor.name}! Website is now live.`);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="w-4 h-4 text-white" />
                              <span>Approval (अप्रूवल)</span>
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Approved & Live</span>
                            </div>
                          )}

                          {vendor.status !== 'Draft' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setVendorStatus(vendor.id, 'Draft');
                                showToast(`Moved "${vendor.name}" to Draft mode`);
                              }}
                              className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Clock className="w-4 h-4 text-amber-700" />
                              <span>Make Draft</span>
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
                              <Clock className="w-4 h-4 text-amber-700" />
                              <span>In Draft Mode</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenLabWebsite(vendor.id)}
                            className="px-3.5 py-2 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Globe className="w-4 h-4 text-amber-300" />
                            <span>Live / Visit</span>
                            <ExternalLink className="w-3 h-3 text-slate-300" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(vendor)}
                            className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenPasswordModal(vendor)}
                            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-purple-700" />
                            <span>Change Password</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmVendor(vendor)}
                            className="px-2.5 py-2 text-rose-700 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete (हटाएं)</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Vendor Modal */}
      {(isAddModalOpen || editingVendor) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#123B6D] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {editingVendor ? `Edit Laboratory: ${editingVendor.name}` : 'Add New Laboratory Vendor'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Configure vendor profile, NABL accreditation, and payment verification details
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingVendor(null);
                }}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Lab Name */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Laboratory Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      const autoSlug = newName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
                      setFormState({
                        ...formState,
                        name: newName,
                        domainPreview:
                          !editingVendor && (!formState.domainPreview || formState.domainPreview.includes('.indianlalaji.com'))
                            ? (autoSlug ? `${autoSlug}.indianlalaji.com` : '')
                            : formState.domainPreview,
                      });
                    }}
                    placeholder="e.g. Apex Diagnostics & Imaging Center"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Dedicated Website Subdomain (Har Lab Ka Apna URL) */}
                <div className="sm:col-span-2 bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-black text-indigo-950 text-xs flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Dedicated Website Subdomain (Har Lab Ka Apna URL)</span>
                    </label>
                    <span className="text-[10px] text-indigo-700 font-bold bg-white px-2 py-0.5 rounded border border-indigo-200">
                      Unique Tenant URL
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono font-bold shrink-0">https://</span>
                    <input
                      type="text"
                      value={formState.domainPreview?.replace(/\.indianlalaji\.com$/, '') || ''}
                      onChange={(e) => {
                        const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                        setFormState({
                          ...formState,
                          domainPreview: clean ? `${clean}.indianlalaji.com` : '',
                        });
                      }}
                      placeholder="e.g. apexdiagnostics"
                      className="flex-1 px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-mono font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    <span className="text-xs text-slate-500 font-mono font-bold shrink-0">.indianlalaji.com</span>
                  </div>
                  <p className="text-[11px] text-indigo-800 mt-1.5 flex items-center gap-1">
                    <span>Full Live URL:</span>
                    <strong className="font-mono">
                      https://{formState.domainPreview || `${formState.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'newlab'}.indianlalaji.com`}
                    </strong>
                  </p>
                </div>

                {/* Owner / Incharge Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lab Incharge / Owner Name
                  </label>
                  <input
                    type="text"
                    value={formState.ownerName || ''}
                    onChange={(e) => setFormState({ ...formState, ownerName: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Sharma (MD Path)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Helpline / WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formState.email || ''}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="e.g. contact@apexlab.in"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* NABL Code */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NABL / ICMR Accreditation No.
                  </label>
                  <input
                    type="text"
                    value={formState.nablCode}
                    onChange={(e) => setFormState({ ...formState, nablCode: e.target.value })}
                    placeholder="e.g. NABL-MC-2024-998"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Owner Login Password & Access PIN (Super Admin Control) */}
                <div className="sm:col-span-2 bg-gradient-to-r from-purple-50 via-indigo-50/70 to-purple-50 p-4 rounded-2xl border border-purple-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                        <KeyRound className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-extrabold text-xs text-purple-950">
                        Owner Login Password & Access Credentials (पासवर्ड व क्रेडेंशियल्स)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-700 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Super Admin Privileged
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-900/90 mb-3 leading-relaxed">
                    Super Admin can directly set or reset this laboratory owner's login password and 6-digit security PIN here.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-purple-950 mb-1">
                        Lab Owner Password (लॉगिन पासवर्ड) *
                      </label>
                      <div className="relative">
                        <input
                          type={editShowPassword ? 'text' : 'password'}
                          required
                          value={formState.password || ''}
                          onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                          placeholder="e.g. owner123"
                          className="w-full pl-3 pr-10 py-2 bg-white border border-purple-300 rounded-xl font-mono text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setEditShowPassword(!editShowPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-800 p-1"
                          title={editShowPassword ? 'Hide password' : 'Show password'}
                        >
                          {editShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-purple-700 font-semibold">Presets:</span>
                        {['owner123', 'Apex@2026#', 'LabOwner@123', 'Admin@2026'].map((p) => (
                          <button
                            type="button"
                            key={p}
                            onClick={() => setFormState({ ...formState, password: p })}
                            className="text-[10px] font-bold bg-white text-purple-700 px-1.5 py-0.5 rounded-md border border-purple-200 hover:bg-purple-100 transition shadow-2xs"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-purple-950 mb-1">
                        Security PIN (सुरक्षा पिन - 6 Digits)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={formState.pin || ''}
                        onChange={(e) => setFormState({ ...formState, pin: e.target.value.replace(/\D/g, '') })}
                        placeholder="e.g. 123456"
                        className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl font-mono text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 tracking-wider shadow-2xs"
                      />
                      <span className="text-[10px] text-purple-700 mt-1 block">
                        Default PIN is 123456 (used for quick authorization)
                      </span>
                    </div>
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.city}
                    onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                    placeholder="e.g. Ludhiana"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formState.state}
                    onChange={(e) => setFormState({ ...formState, state: e.target.value })}
                    placeholder="e.g. Punjab"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Physical Address
                  </label>
                  <input
                    type="text"
                    value={formState.address}
                    onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                    placeholder="e.g. SCO 42, Ground Floor, Mall Road Market"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Status Selection (Crucial requirement) */}
                <div className="sm:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <label className="block font-extrabold text-slate-900 text-xs">
                    Current Vendor Status *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      formState.status === 'Draft' ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold' : 'bg-white border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="vendorStatus"
                        value="Draft"
                        checked={formState.status === 'Draft'}
                        onChange={() => setFormState({ ...formState, status: 'Draft' })}
                        className="text-amber-600"
                      />
                      <span>⏳ Draft (Website Hidden - Pending Admin Approval)</span>
                    </label>

                    <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      formState.status === 'Active' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold' : 'bg-white border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="vendorStatus"
                        value="Active"
                        checked={formState.status === 'Active'}
                        onChange={() => setFormState({ ...formState, status: 'Active' })}
                        className="text-emerald-600"
                      />
                      <span>✅ Active (Approved & Website LIVE)</span>
                    </label>

                    <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      formState.status === 'Processing due to payment confirmation' ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold' : 'bg-white border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="vendorStatus"
                        value="Processing due to payment confirmation"
                        checked={formState.status === 'Processing due to payment confirmation'}
                        onChange={() => setFormState({ ...formState, status: 'Processing due to payment confirmation' })}
                        className="text-amber-600"
                      />
                      <span>💳 Processing due to payment confirmation</span>
                    </label>

                    <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      formState.status === 'Pending' ? 'bg-sky-50 border-sky-500 text-sky-900 font-bold' : 'bg-white border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="vendorStatus"
                        value="Pending"
                        checked={formState.status === 'Pending'}
                        onChange={() => setFormState({ ...formState, status: 'Pending' })}
                        className="text-sky-600"
                      />
                      <span>⏳ Pending (Admin Review)</span>
                    </label>

                    <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      formState.status === 'Suspended' ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold' : 'bg-white border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="vendorStatus"
                        value="Suspended"
                        checked={formState.status === 'Suspended'}
                        onChange={() => setFormState({ ...formState, status: 'Suspended' })}
                        className="text-rose-600"
                      />
                      <span>⛔ Suspended (Temporarily Deactivated)</span>
                    </label>
                  </div>
                </div>

                {/* Subscription & Payment Section */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={formState.subscriptionPlan || 'Professional Lab Plan'}
                    onChange={(e) => setFormState({ ...formState, subscriptionPlan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  >
                    <option value="Starter Lab Plan">Starter Lab Plan (₹999/mo)</option>
                    <option value="Professional Lab Plan">Professional Lab Plan (₹1,999/mo)</option>
                    <option value="Diagnostic Network Plan">Diagnostic Network Plan (₹2,999/mo)</option>
                    <option value="Enterprise Diagnostics">Enterprise Diagnostics (Custom)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Monthly Fee (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={formState.subscriptionAmount || 1999}
                    onChange={(e) => setFormState({ ...formState, subscriptionAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={formState.paymentMode || 'UPI / QR Code'}
                    onChange={(e) => setFormState({ ...formState, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  >
                    <option value="UPI / QR Code">UPI / QR Code</option>
                    <option value="NEFT / RTGS Bank Transfer">NEFT / RTGS Bank Transfer</option>
                    <option value="Cheque / Draft">Cheque / Draft</option>
                    <option value="Cash at Corporate Desk">Cash at Corporate Desk</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Payment Reference / UTR Number
                  </label>
                  <input
                    type="text"
                    value={formState.paymentReference || ''}
                    onChange={(e) => setFormState({ ...formState, paymentReference: e.target.value })}
                    placeholder="e.g. UPI-928172648102"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Payment Notes */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Payment Verification Notes
                  </label>
                  <input
                    type="text"
                    value={formState.paymentNotes || ''}
                    onChange={(e) => setFormState({ ...formState, paymentNotes: e.target.value })}
                    placeholder="e.g. Advance paid via GPay. Awaiting 1st month clearance."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Emergency toggle */}
                <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="emergency-checkbox"
                    checked={formState.emergency}
                    onChange={(e) => setFormState({ ...formState, emergency: e.target.checked })}
                    className="rounded text-[#123B6D] focus:ring-[#123B6D] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="emergency-checkbox" className="font-semibold text-slate-800 cursor-pointer">
                    Enable 24x7 Round-the-Clock Sample Processing badge for this lab
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingVendor(null);
                  }}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#123B6D] hover:bg-[#0e2c52] text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  <span>{editingVendor ? 'Save Changes' : 'Add Laboratory'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-purple-200 overflow-hidden space-y-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/30 border border-purple-300/40 text-amber-300 flex items-center justify-center font-black">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Change Lab Owner Password</h3>
                  <p className="text-[11px] text-purple-200">
                    लैब ओनर का लॉगिन पासवर्ड व सुरक्षा पिन बदलें
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPasswordVendor(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePassword} className="p-6 space-y-4 text-xs">
              {/* Lab Summary Card */}
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/80 space-y-1">
                <div className="font-extrabold text-purple-950 text-sm">{passwordVendor.name}</div>
                <div className="text-[11px] text-purple-800 flex items-center gap-2 flex-wrap">
                  <span>Owner: <strong>{passwordVendor.ownerName || 'Dr. Lab Incharge'}</strong></span>
                  <span>•</span>
                  <span>Phone: <strong>{passwordVendor.phone}</strong></span>
                </div>
                <div className="text-[10px] font-mono text-purple-700 truncate">
                  Domain: https://{passwordVendor.domainPreview || `${passwordVendor.id}.indianlalaji.com`}
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  New Password (नया पासवर्ड) *
                </label>
                <div className="relative">
                  <input
                    type={passwordForm.showPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full pl-3 pr-10 py-2.5 bg-white border border-purple-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPasswordForm({ ...passwordForm, showPassword: !passwordForm.showPassword })
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-800 p-1"
                    title={passwordForm.showPassword ? 'Hide password' : 'Show password'}
                  >
                    {passwordForm.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Quick Presets & Generator */}
                <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-semibold">Quick Presets:</span>
                    {['owner123', 'Apex@2026#', 'Lab@998', 'Admin@123'].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setPasswordForm({ ...passwordForm, password: preset })}
                        className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200 hover:bg-purple-100 transition shadow-2xs"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const randPass = `Lab#${Math.floor(1000 + Math.random() * 9000)}!`;
                      setPasswordForm({ ...passwordForm, password: randPass, showPassword: true });
                    }}
                    className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-0.5"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Generate Random</span>
                  </button>
                </div>
              </div>

              {/* Security PIN */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Security PIN (6 Digits)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={passwordForm.pin}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      pin: e.target.value.replace(/\D/g, ''),
                    })
                  }
                  placeholder="e.g. 123456"
                  className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 tracking-wider shadow-2xs"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Used as fallback verification PIN for owner staff logins.
                </span>
              </div>

              {/* Notice */}
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  The vendor can immediately log in on their dedicated website or login portal using this new password with their phone number (<strong>{passwordVendor.phone}</strong>).
                </span>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPasswordVendor(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  <span>Update Password (पासवर्ड सेव करें)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900">
                Delete Laboratory Vendor?
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Are you sure you want to permanently delete <strong>{deleteConfirmVendor.name}</strong> from your portal directory? Their dedicated website subdomain will be disabled.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmVendor(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Laboratory</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft Website Visit / Preview Warning Modal */}
      {draftVisitVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-amber-300 space-y-4 text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border-2 border-amber-300 shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                ⚠️ Website In Draft Mode • Pending Admin Approval
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                Website is currently in Draft Mode
              </h3>
              <p className="text-xs text-amber-800 font-bold mt-1">
                This website will not be live or accessible for visit until the Admin publishes it.
              </p>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                This laboratory website was created and is currently in <strong>Draft Status</strong>. Public visit, patient bookings, and diagnostic catalog are locked until Super Admin reviews and approves it.
              </p>

              {/* Contact Box */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 mt-3 text-xs font-bold text-amber-950 flex items-center justify-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-700" />
                <span>Contact with 7087033009</span>
              </div>

              <div className="text-xs text-slate-600 mt-3 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-left space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Laboratory:</span>
                  <span className="font-bold text-slate-800">{draftVisitVendor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">City / State:</span>
                  <span className="text-slate-700">{draftVisitVendor.city}, {draftVisitVendor.state || 'India'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-amber-700 font-bold">{draftVisitVendor.status} (Unpublished)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = draftVisitVendor;
                  setVendorStatus(target.id, 'Active');
                  setDraftVisitVendor(null);
                  showToast(`Approved & Published LIVE: ${target.name}! Moved to Our Clients.`);
                  selectVendorLab(target.id);
                  onNavigateView('vendor_website');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Approve & Publish Live Now</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = draftVisitVendor;
                  setDraftVisitVendor(null);
                  selectVendorLab(target.id);
                  onNavigateView('vendor_website');
                }}
                className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>View Draft Notice Screen</span>
              </button>

              <button
                type="button"
                onClick={() => setDraftVisitVendor(null)}
                className="py-1 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
