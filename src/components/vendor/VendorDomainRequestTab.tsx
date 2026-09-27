import React, { useState } from 'react';
import {
  Globe,
  PlusCircle,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Server,
  ArrowRight,
  Copy,
  Check,
  HelpCircle,
  RefreshCw,
  AlertTriangle,
  Send,
  Building2,
  Phone,
  Mail,
  User,
  Sliders,
  Sparkles
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { DomainRequest, DomainRequestType, DomainRequestStatus } from '../../types';

interface VendorDomainRequestTabProps {
  initialSubTab?: 'add' | 'list';
  onNavigateSubTab?: (subTab: 'add' | 'list') => void;
}

export const VendorDomainRequestTab: React.FC<VendorDomainRequestTabProps> = ({
  initialSubTab = 'add',
  onNavigateSubTab,
}) => {
  const {
    vendorLabSettings,
    domainRequests,
    allDomainRequests,
    addDomainRequest,
    updateDomainRequest,
    deleteDomainRequest,
    currentUser,
    selectedVendorLabId,
  } = useCms();

  const [activeSubTab, setActiveSubTab] = useState<'add' | 'list'>(initialSubTab);

  // Sync external subTab changes if any
  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const setSubTab = (tab: 'add' | 'list') => {
    setActiveSubTab(tab);
    if (onNavigateSubTab) onNavigateSubTab(tab);
  };

  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    showToast(`Copied "${text}" to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Current active domain for this lab
  const currentActiveDomain =
    vendorLabSettings?.websiteDomain ||
    vendorLabSettings?.domainPreview ||
    `${selectedVendorLabId || 'apex'}.indianlalaji.com`;

  // Form State for "1. Add - Request to Super Admin"
  const [formDomainType, setFormDomainType] = useState<DomainRequestType>('custom_domain');
  const [formRequestedDomain, setFormRequestedDomain] = useState('');
  const [formRegistrar, setFormRegistrar] = useState('Hostinger');
  const [formContactPerson, setFormContactPerson] = useState(
    vendorLabSettings?.founderName || currentUser?.name || 'Dr. Pathologist'
  );
  const [formContactPhone, setFormContactPhone] = useState(
    vendorLabSettings?.phone || vendorLabSettings?.helplinePhone || '+91 7087033009'
  );
  const [formContactEmail, setFormContactEmail] = useState(
    vendorLabSettings?.email || currentUser?.email || 'admin@indianlalaji.com'
  );
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State for "2. Change"
  const [editingRequest, setEditingRequest] = useState<DomainRequest | null>(null);
  const [editDomain, setEditDomain] = useState('');
  const [editRegistrar, setEditRegistrar] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Delete Confirmation Modal State
  const [deletingRequest, setDeletingRequest] = useState<DomainRequest | null>(null);

  // DNS Verification Simulator State
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Status Filter in List Tab
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  const filteredRequests = domainRequests.filter((r) => {
    if (statusFilter === 'All') return true;
    return r.status === statusFilter;
  });

  const pendingRequestsCount = domainRequests.filter((r) => r.status === 'Pending').length;
  const approvedRequestsCount = domainRequests.filter((r) => r.status === 'Approved').length;

  // Handle Form Submission -> Request to Super Admin
  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = formRequestedDomain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

    if (!cleanDomain) {
      showToast('Please enter a valid domain name (e.g. yourlabname.com)');
      return;
    }

    if (!cleanDomain.includes('.')) {
      showToast('Domain name must include a valid extension like .com, .in, .org or .indianlalaji.com');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      addDomainRequest({
        labId: selectedVendorLabId || vendorLabSettings?.labId || 'lab-apex',
        labName: vendorLabSettings?.labName || 'Apex Diagnostic Center',
        domainType: formDomainType,
        requestedDomain: cleanDomain,
        currentDomain: currentActiveDomain,
        registrar: formRegistrar,
        contactPerson: formContactPerson,
        contactPhone: formContactPhone,
        contactEmail: formContactEmail,
        notes: formNotes || `Requesting custom domain binding for ${cleanDomain} from Super Admin.`,
        cnameTarget: 'indianlalaji.com',
        aRecordIp: '34.149.120.45',
        dnsStatus: 'Pending DNS Propagation',
        sslStatus: 'Pending Provisioning',
      });

      setIsSubmitting(false);
      setFormRequestedDomain('');
      setFormNotes('');
      showToast(`Domain Request for "${cleanDomain}" sent to Super Admin successfully!`);
      setSubTab('list');
    }, 400);
  };

  // Open Edit/Change Request Modal
  const handleOpenEdit = (req: DomainRequest) => {
    setEditingRequest(req);
    setEditDomain(req.requestedDomain);
    setEditRegistrar(req.registrar || 'Hostinger');
    setEditPhone(req.contactPhone);
    setEditNotes(req.notes || '');
  };

  // Save Edit/Change Request
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;
    const clean = editDomain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

    if (!clean || !clean.includes('.')) {
      showToast('Please enter a valid domain name with extension.');
      return;
    }

    updateDomainRequest(editingRequest.id, {
      requestedDomain: clean,
      registrar: editRegistrar,
      contactPhone: editPhone,
      notes: editNotes,
      status: 'Pending', // Resubmitted for review
      adminRemarks: 'Domain modified by vendor. Pending Super Admin verification.',
    });

    setEditingRequest(null);
    showToast(`Domain Request updated to "${clean}" and resubmitted to Super Admin!`);
  };

  // Confirm Delete / Cancel Request
  const handleConfirmDelete = () => {
    if (!deletingRequest) return;
    deleteDomainRequest(deletingRequest.id);
    showToast(`Domain Request for "${deletingRequest.requestedDomain}" deleted.`);
    setDeletingRequest(null);
  };

  // Simulator for DNS propagation check
  const handleSimulateDnsCheck = (req: DomainRequest) => {
    setVerifyingId(req.id);
    setTimeout(() => {
      setVerifyingId(null);
      if (req.status === 'Approved') {
        showToast(`DNS CNAME verified: ${req.requestedDomain} -> indianlalaji.com (SSL Active ✓)`);
      } else {
        showToast(`DNS status: CNAME record detected for ${req.requestedDomain}. Awaiting Super Admin final approval.`);
      }
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#123B6D] text-white px-5 py-3 rounded-2xl shadow-2xl border border-sky-400 flex items-center gap-3 animate-bounce">
          <span className="text-amber-400 font-bold">✓</span>
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: Current Live Domain & "Har Lab Ka Apna URL" */}
      <div className="bg-gradient-to-r from-[#123B6D] via-[#1a4a84] to-[#0d284b] text-white rounded-3xl p-6 sm:p-7 shadow-md border border-sky-800/60 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Globe className="w-3.5 h-3.5" />
                <span>6. Domain Request</span>
              </span>
              <span className="bg-sky-500/20 text-sky-200 border border-sky-400/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                Har Lab Ka Apna URL
              </span>
              {pendingRequestsCount > 0 && (
                <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full text-xs animate-pulse">
                  {pendingRequestsCount} Pending with Super Admin
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Domain Management &amp; Custom URL Request
            </h1>
            <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
              Connect your own custom domain (e.g.{' '}
              <span className="text-amber-300 font-bold">yourlabname.com</span> or{' '}
              <span className="text-amber-300 font-bold">.in</span>) or custom subdomain. Submit a request to the
              Super Admin, configure DNS CNAME/A records, and monitor live status.
            </p>
          </div>

          {/* Current Active Domain Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shrink-0 min-w-[280px]">
            <div className="flex items-center justify-between text-xs text-sky-200 font-semibold mb-1">
              <span>Current Active Domain</span>
              <span className="flex items-center gap-1 text-emerald-300 font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Live &amp; SSL Secured</span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-slate-950/40 px-3 py-2 rounded-xl border border-white/10">
              <span className="font-mono text-xs sm:text-sm font-black text-amber-300 truncate">
                https://{currentActiveDomain}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(`https://${currentActiveDomain}`, 'current_domain')}
                className="text-sky-300 hover:text-white p-1 rounded transition cursor-pointer"
                title="Copy Domain URL"
              >
                {copiedKey === 'current_domain' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <a
                href={`https://${currentActiveDomain}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-sky-200 hover:text-white flex items-center gap-1 transition"
              >
                <span>Visit Live Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
                HTTPS Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: 1. Add - Request to super Admin | 2. Change / Delete */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Sub-Tab 1: Add - Request to super Admin */}
          <button
            type="button"
            onClick={() => setSubTab('add')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'add'
                ? 'bg-[#123B6D] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className={`w-4 h-4 ${activeSubTab === 'add' ? 'text-amber-400' : 'text-emerald-600'}`} />
            <span>Add Domain — Send Request to Super Admin</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeSubTab === 'add' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}
            >
              New
            </span>
          </button>

          {/* Sub-Tab 2: Change / Delete */}
          <button
            type="button"
            onClick={() => setSubTab('list')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'list'
                ? 'bg-[#123B6D] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sliders className={`w-4 h-4 ${activeSubTab === 'list' ? 'text-amber-400' : 'text-[#123B6D]'}`} />
            <span>Change Domain / Delete Domain</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeSubTab === 'list' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
              }`}
            >
              {domainRequests.length}
            </span>
          </button>
        </div>

        {/* Quick DNS Info Badge */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Server className="w-3.5 h-3.5 text-indigo-600" />
          <span>DNS CNAME Target:</span>
          <code className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            indianlalaji.com
          </code>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ADD DOMAIN — SEND REQUEST TO SUPER ADMIN                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'add' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form (Left 7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider mb-1">
                <Send className="w-3.5 h-3.5" />
                <span>Submit New Domain Request</span>
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Add Domain — Send Request to Super Admin
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Fill in the domain you have purchased or wish to bind. The Super Admin team will verify DNS records and activate SSL routing within minutes.
              </p>
            </div>

            <form onSubmit={handleAddRequest} className="space-y-5">
              {/* Domain Type Selection */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  Requested Domain Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormDomainType('custom_domain');
                      if (formRequestedDomain.endsWith('.indianlalaji.com')) {
                        setFormRequestedDomain('');
                      }
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                      formDomainType === 'custom_domain'
                        ? 'border-[#123B6D] bg-sky-50/70 ring-2 ring-[#123B6D]/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                        formDomainType === 'custom_domain'
                          ? 'border-[#123B6D] bg-[#123B6D]'
                          : 'border-slate-300'
                      }`}
                    >
                      {formDomainType === 'custom_domain' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">
                        Custom Domain (Top-Level)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        e.g. <span className="font-mono text-slate-800 font-bold">apexpathology.in</span> or{' '}
                        <span className="font-mono text-slate-800 font-bold">yourlab.com</span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormDomainType('subdomain');
                      if (!formRequestedDomain) {
                        setFormRequestedDomain(`${selectedVendorLabId || 'mylab'}.indianlalaji.com`);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                      formDomainType === 'subdomain'
                        ? 'border-[#123B6D] bg-sky-50/70 ring-2 ring-[#123B6D]/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                        formDomainType === 'subdomain'
                          ? 'border-[#123B6D] bg-[#123B6D]'
                          : 'border-slate-300'
                      }`}
                    >
                      {formDomainType === 'subdomain' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">
                        Platform Subdomain
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        e.g. <span className="font-mono text-slate-800 font-bold">apex.indianlalaji.com</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Domain Input */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  Requested Domain Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    https://
                  </span>
                  <input
                    type="text"
                    required
                    value={formRequestedDomain}
                    onChange={(e) => setFormRequestedDomain(e.target.value.toLowerCase().trim())}
                    placeholder={
                      formDomainType === 'custom_domain'
                        ? 'e.g. apexpathology.in or citycarelabs.com'
                        : 'e.g. apexdiagnostics.indianlalaji.com'
                    }
                    className="w-full pl-18 pr-4 py-3 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123B6D] focus:border-transparent transition bg-slate-50/50"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <span>Enter domain name without http:// or https://</span>
                </p>
              </div>

              {/* Registrar & Provider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Domain Registrar / DNS Provider
                  </label>
                  <select
                    value={formRegistrar}
                    onChange={(e) => setFormRegistrar(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D] bg-white"
                  >
                    <option value="Hostinger">Hostinger</option>
                    <option value="GoDaddy">GoDaddy</option>
                    <option value="Namecheap">Namecheap</option>
                    <option value="Cloudflare">Cloudflare</option>
                    <option value="BigRock">BigRock</option>
                    <option value="Google Domains / Squarespace">Google Domains / Squarespace</option>
                    <option value="Other Registrar">Other Registrar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Contact Phone / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formContactPhone}
                      onChange={(e) => setFormContactPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Person & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Contact Person Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formContactPerson}
                      onChange={(e) => setFormContactPerson(e.target.value)}
                      placeholder="Dr. Pathologist / Lab Director"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Contact Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={formContactEmail}
                      onChange={(e) => setFormContactEmail(e.target.value)}
                      placeholder="admin@yourlab.com"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>
                </div>
              </div>

              {/* Notes to Super Admin */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Request Notes &amp; Verification Remarks for Super Admin
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. We have added the CNAME pointing to indianlalaji.com in our Hostinger DNS manager. Please approve and verify SSL certificate."
                  className="w-full p-3.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D] resize-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-slate-950" />
                  <span>{isSubmitting ? 'Sending Request...' : 'Send Request to Super Admin'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubTab('list')}
                  className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  View Existing Requests ({domainRequests.length})
                </button>
              </div>
            </form>
          </div>

          {/* DNS Configuration Guide Card (Right 5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Step-by-Step DNS Guide */}
            <div className="bg-gradient-to-br from-indigo-50/70 via-sky-50/50 to-blue-50/70 rounded-3xl p-6 border border-indigo-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-indigo-900 font-black text-sm">
                <Server className="w-4 h-4 text-indigo-700" />
                <span>DNS Configuration Instructions</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Log into your domain provider (GoDaddy, Hostinger, etc.) and add this standard DNS record pointing to our central platform:
              </p>

              {/* Record 1: CNAME */}
              <div className="bg-white rounded-2xl p-4 border border-indigo-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-indigo-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>CNAME Record (Recommended)</span>
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                    Primary
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Host / Name</span>
                    <span className="font-mono font-black text-slate-900">@ or www</span>
                  </div>
                  <div className="col-span-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Points To / Target</span>
                      <span className="font-mono font-black text-indigo-700 text-xs">indianlalaji.com</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('indianlalaji.com', 'cname_target')}
                      className="text-slate-400 hover:text-indigo-700 p-1"
                      title="Copy Target"
                    >
                      {copiedKey === 'cname_target' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Record 2: A Record */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>A Record (Alternative)</span>
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                    Apex Root
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Host</span>
                    <span className="font-mono font-black text-slate-900">@</span>
                  </div>
                  <div className="col-span-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Server IP</span>
                      <span className="font-mono font-black text-slate-800 text-xs">34.149.120.45</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('34.149.120.45', 'a_ip')}
                      className="text-slate-400 hover:text-slate-800 p-1"
                      title="Copy IP"
                    >
                      {copiedKey === 'a_ip' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Security & SSL Note */}
              <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900">
                  <span className="font-black block">Free SSL Certificate Included</span>
                  <span className="text-[11px] text-emerald-800/90 leading-normal block mt-0.5">
                    Once Super Admin approves your domain request, an automatic Let&apos;s Encrypt / Cloudflare SSL certificate will be issued within 10–30 minutes at zero extra cost.
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Super Admin Approval Timeline */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Super Admin Verification Workflow
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-black text-[11px] flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Submit Domain Request</span>
                    <span className="text-slate-500 text-[11px]">Enter your custom domain and submit to Super Admin.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-900 font-black text-[11px] flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Configure DNS CNAME</span>
                    <span className="text-slate-500 text-[11px]">Point CNAME record to indianlalaji.com on your registrar.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 font-black text-[11px] flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Super Admin Approves &amp; SSL Active</span>
                    <span className="text-slate-500 text-[11px]">Super Admin verifies DNS, binds tenant, and your lab website goes live!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CHANGE / DELETE DOMAIN REQUESTS                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'list' && (
        <div className="space-y-5">
          {/* Header & Status Filters */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#123B6D] font-bold text-xs uppercase tracking-wider mb-1">
                <Edit3 className="w-3.5 h-3.5" />
                <span>Manage Domain Requests</span>
              </div>
              <h2 className="text-lg font-black text-slate-900">
                2. Change / Delete Domain Requests
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review status, modify requested domain details, or cancel requests sent to Super Admin.
              </p>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
              {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((filter) => {
                const count =
                  filter === 'All'
                    ? domainRequests.length
                    : domainRequests.filter((r) => r.status === filter).length;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === filter
                        ? 'bg-[#123B6D] text-white shadow-2xs font-black'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
                    }`}
                  >
                    <span>{filter}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        statusFilter === filter ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Requests List */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
              <div className="w-14 h-14 rounded-full bg-sky-50 text-[#123B6D] flex items-center justify-center mx-auto text-2xl font-bold">
                🌐
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  {statusFilter === 'All'
                    ? 'No Domain Requests Submitted Yet'
                    : `No ${statusFilter} Domain Requests`}
                </h3>
                <p className="text-xs text-slate-500">
                  {statusFilter === 'All'
                    ? 'Submit a domain request to Super Admin using the "1. Add - Request to Super Admin" tab to connect your custom URL.'
                    : `You currently have zero domain requests in "${statusFilter}" state.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubTab('add')}
                className="px-5 py-2.5 rounded-xl bg-[#123B6D] text-white font-black text-xs inline-flex items-center gap-2 hover:bg-sky-900 transition shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <span>Add Request to Super Admin</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => {
                const isPending = req.status === 'Pending';
                const isApproved = req.status === 'Approved';
                const isRejected = req.status === 'Rejected';

                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-3xl p-6 border shadow-xs transition ${
                      isApproved
                        ? 'border-emerald-200 bg-emerald-50/10'
                        : isPending
                        ? 'border-amber-200 bg-amber-50/10'
                        : 'border-rose-200 bg-rose-50/10'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1.5 ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : isPending
                                ? 'bg-amber-100 text-amber-950 border border-amber-300 animate-pulse'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {isPending && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                            {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                            <span>
                              {isApproved
                                ? 'Approved & DNS Active'
                                : isPending
                                ? 'Pending Super Admin Approval'
                                : 'Rejected by Super Admin'}
                            </span>
                          </span>

                          <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200">
                            {req.domainType === 'custom_domain' ? 'Custom Domain' : 'Platform Subdomain'}
                          </span>

                          <span className="text-[11px] text-slate-400 font-medium">
                            Submitted: {req.createdAt}
                          </span>
                        </div>

                        {/* Domain Title */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-black text-slate-900 font-mono">
                            https://{req.requestedDomain}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleCopy(`https://${req.requestedDomain}`, req.id)}
                            className="text-slate-400 hover:text-slate-700 p-1"
                            title="Copy Domain URL"
                          >
                            {copiedKey === req.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={`https://${req.requestedDomain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-600 hover:text-sky-800 p-1"
                            title="Open Domain Link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Action Buttons: Change / Delete / DNS Check */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Simulate DNS Propagation Check */}
                        <button
                          type="button"
                          onClick={() => handleSimulateDnsCheck(req)}
                          disabled={verifyingId === req.id}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          title="Verify DNS CNAME records"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 text-slate-600 ${
                              verifyingId === req.id ? 'animate-spin text-indigo-600' : ''
                            }`}
                          />
                          <span>{verifyingId === req.id ? 'Checking DNS...' : 'Verify DNS'}</span>
                        </button>

                        {/* CHANGE Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(req)}
                          className="px-3.5 py-2 rounded-xl bg-[#123B6D] hover:bg-sky-900 text-white text-xs font-black flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                          title="Change / Edit domain details"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Change Domain</span>
                        </button>

                        {/* DELETE Button */}
                        <button
                          type="button"
                          onClick={() => setDeletingRequest(req)}
                          className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          title="Delete / Cancel request"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Detailed Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 text-xs">
                      {/* Registrar */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                          Registrar / DNS Host
                        </span>
                        <span className="font-extrabold text-slate-800">{req.registrar || 'Hostinger'}</span>
                      </div>

                      {/* DNS Target */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                          CNAME Record Points To
                        </span>
                        <span className="font-mono font-bold text-indigo-700">
                          {req.cnameTarget || 'indianlalaji.com'}
                        </span>
                      </div>

                      {/* Contact Info */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                          Contact Phone / Email
                        </span>
                        <span className="font-bold text-slate-800 block truncate">{req.contactPhone}</span>
                        {req.contactEmail && (
                          <span className="text-[10px] text-slate-500 block truncate">{req.contactEmail}</span>
                        )}
                      </div>

                      {/* SSL & DNS Status */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                          SSL Certificate
                        </span>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck
                            className={`w-3.5 h-3.5 ${
                              isApproved ? 'text-emerald-600' : 'text-amber-500'
                            }`}
                          />
                          <span
                            className={`font-bold ${
                              isApproved ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {req.sslStatus || (isApproved ? 'Active' : 'Pending')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notes & Super Admin Remarks */}
                    {(req.notes || req.adminRemarks) && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-3 text-xs">
                        {req.notes && (
                          <div className="flex-1 bg-sky-50/50 p-2.5 rounded-xl border border-sky-100">
                            <span className="font-bold text-sky-950 block text-[11px] mb-0.5">
                              Lab Request Notes:
                            </span>
                            <p className="text-slate-600 text-[11px] leading-relaxed">{req.notes}</p>
                          </div>
                        )}
                        {req.adminRemarks && (
                          <div
                            className={`flex-1 p-2.5 rounded-xl border ${
                              isApproved
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                : 'bg-rose-50/70 border-rose-200 text-rose-950'
                            }`}
                          >
                            <span className="font-bold block text-[11px] mb-0.5 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>Super Admin Remarks:</span>
                            </span>
                            <p className="text-[11px] leading-relaxed">{req.adminRemarks}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT / CHANGE MODAL                                                       */}
      {/* ========================================================================= */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
                  <Edit3 className="w-4 h-4 text-[#123B6D]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Change Domain Request</h3>
                  <p className="text-[11px] text-slate-500">
                    Modify requested domain name or DNS details for Super Admin review.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Requested Domain Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    https://
                  </span>
                  <input
                    type="text"
                    required
                    value={editDomain}
                    onChange={(e) => setEditDomain(e.target.value)}
                    placeholder="e.g. apexpathology.in"
                    className="w-full pl-18 pr-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registrar / DNS Host
                  </label>
                  <select
                    value={editRegistrar}
                    onChange={(e) => setEditRegistrar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                  >
                    <option value="Hostinger">Hostinger</option>
                    <option value="GoDaddy">GoDaddy</option>
                    <option value="Namecheap">Namecheap</option>
                    <option value="Cloudflare">Cloudflare</option>
                    <option value="BigRock">BigRock</option>
                    <option value="Other Registrar">Other Registrar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Change Notes / Reason
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Updated domain spelling and reconfigured CNAME record."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#123B6D] hover:bg-sky-900 text-white font-black text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {deletingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Domain Request</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel and delete the domain request for{' '}
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1 py-0.5 rounded">
                https://{deletingRequest.requestedDomain}
              </span>
              ? The Super Admin queue will be updated immediately.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRequest(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Keep Request
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Request</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
