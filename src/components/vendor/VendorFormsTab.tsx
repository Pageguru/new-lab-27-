import React, { useState, useMemo } from 'react';
import {
  FileText,
  CalendarCheck,
  MessageSquare,
  Search,
  Trash2,
  CheckCircle2,
  Clock,
  Phone,
  ArrowRight,
  ExternalLink,
  Send,
  Eye,
  X,
  AlertCircle,
  Sparkles,
  MapPin,
  Check,
  Plus,
  RefreshCw,
  Mail,
  UserCheck,
  Building2,
  Copy,
  Receipt,
  User,
  HelpCircle,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { HomeCollectionBooking, ContactSubmission, AppView } from '../../types';

interface VendorFormsTabProps {
  initialSubTab?: 'bookings' | 'contacts';
  activeSubTab?: 'bookings' | 'contacts';
  onSubTabChange?: (tab: 'bookings' | 'contacts') => void;
  onNavigateView: (view: AppView) => void;
}

export const VendorFormsTab: React.FC<VendorFormsTabProps> = ({
  initialSubTab = 'bookings',
  activeSubTab: externalSubTab,
  onSubTabChange,
  onNavigateView,
}) => {
  const {
    vendorBookings,
    deleteBooking,
    updateBookingStatus,
    transferBookingToReception,
    contactSubmissions,
    markContactAsRead,
    toggleContactReadStatus,
    deleteContactSubmission,
    addHomeCollectionBooking,
    vendorLabSettings,
    selectedVendorLabId,
  } = useCms();

  const [internalSubTab, setInternalSubTab] = useState<'bookings' | 'contacts'>(initialSubTab);
  const currentSubTab = externalSubTab || internalSubTab;

  const handleSubTabChange = (tab: 'bookings' | 'contacts') => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setInternalSubTab(tab);
    }
  };

  const labName = vendorLabSettings?.labName || 'Our Diagnostic Laboratory';

  // --- SUB-TAB 1: BOOKING SUBMISSIONS STATE ---
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'pending' | 'assigned' | 'collected' | 'delivered' | 'transferred'>('all');
  const [bookingToDelete, setBookingToDelete] = useState<HomeCollectionBooking | null>(null);
  const [bookingToTransfer, setBookingToTransfer] = useState<HomeCollectionBooking | null>(null);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);

  // New Booking form state
  const [newBookingPatient, setNewBookingPatient] = useState('');
  const [newBookingMobile, setNewBookingMobile] = useState('');
  const [newBookingAddress, setNewBookingAddress] = useState('');
  const [newBookingTimeSlot, setNewBookingTimeSlot] = useState('Tomorrow: 8:00 AM - 10:00 AM');
  const [newBookingTest, setNewBookingTest] = useState('Complete Blood Count (CBC) (₹299)');
  const [newBookingAmount, setNewBookingAmount] = useState<number>(299);
  const [newBookingPaymentMode, setNewBookingPaymentMode] = useState('Pay at Sample Collection');

  // --- SUB-TAB 2: CONTACT FORM STATE ---
  const [contactSearch, setContactSearch] = useState('');
  const [contactStatusFilter, setContactStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedContactToRead, setSelectedContactToRead] = useState<ContactSubmission | null>(null);
  const [contactToDelete, setContactToDelete] = useState<ContactSubmission | null>(null);

  // Shared Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; actionText?: string; onAction?: () => void } | null>(null);
  const showToast = (text: string, actionText?: string, onAction?: () => void) => {
    setToastMessage({ text, actionText, onAction });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // 1-Click Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (text: string, id: string) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  // --- FILTERED BOOKINGS ---
  const filteredBookings = useMemo(() => {
    return vendorBookings.filter((b) => {
      const matchSearch =
        !bookingSearch.trim() ||
        b.patientName?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.mobile?.includes(bookingSearch) ||
        b.id?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.packageOrTest?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.address?.toLowerCase().includes(bookingSearch.toLowerCase());

      if (!matchSearch) return false;

      if (bookingStatusFilter === 'pending') {
        return b.status === 'Pending' && !b.transferredToReception;
      }
      if (bookingStatusFilter === 'assigned') {
        return b.status === 'Phlebotomist Assigned';
      }
      if (bookingStatusFilter === 'collected') {
        return b.status === 'Sample Collected';
      }
      if (bookingStatusFilter === 'delivered') {
        return b.status === 'Report Delivered';
      }
      if (bookingStatusFilter === 'transferred') {
        return !!b.transferredToReception;
      }
      return true;
    });
  }, [vendorBookings, bookingSearch, bookingStatusFilter]);

  // --- FILTERED CONTACTS ---
  const filteredContacts = useMemo(() => {
    return contactSubmissions.filter((c) => {
      const matchSearch =
        !contactSearch.trim() ||
        c.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.phone?.includes(contactSearch) ||
        (c.email && c.email.toLowerCase().includes(contactSearch.toLowerCase())) ||
        (c.subject && c.subject.toLowerCase().includes(contactSearch.toLowerCase())) ||
        (c.referenceToken && c.referenceToken.toLowerCase().includes(contactSearch.toLowerCase())) ||
        c.message?.toLowerCase().includes(contactSearch.toLowerCase());

      if (!matchSearch) return false;

      if (contactStatusFilter === 'unread') return c.status === 'unread';
      if (contactStatusFilter === 'read') return c.status === 'read';
      return true;
    });
  }, [contactSubmissions, contactSearch, contactStatusFilter]);

  // Stats calculation
  const totalBookingsCount = vendorBookings.length;
  const pendingBookingsCount = vendorBookings.filter((b) => b.status === 'Pending' && !b.transferredToReception).length;
  const transferredBookingsCount = vendorBookings.filter((b) => b.transferredToReception).length;

  const totalContactsCount = contactSubmissions.length;
  const unreadContactsCount = contactSubmissions.filter((c) => c.status === 'unread').length;

  // Handler: Transfer to Reception
  const handleConfirmTransfer = (booking: HomeCollectionBooking) => {
    const result = transferBookingToReception(booking.id);
    setBookingToTransfer(null);
    if (result.success) {
      showToast(
        `✅ Transferred ${booking.patientName} to Reception Desk! Token: ${result.tokenNo}`,
        'Open Reception Counter',
        () => onNavigateView('reception_dashboard')
      );
    }
  };

  // Handler: Delete Booking
  const handleConfirmDeleteBooking = () => {
    if (!bookingToDelete) return;
    const name = bookingToDelete.patientName;
    deleteBooking(bookingToDelete.id);
    setBookingToDelete(null);
    showToast(`🗑️ Booking for "${name}" deleted.`);
  };

  // Handler: Delete Contact
  const handleConfirmDeleteContact = () => {
    if (!contactToDelete) return;
    const name = contactToDelete.name;
    deleteContactSubmission(contactToDelete.id);
    setContactToDelete(null);
    if (selectedContactToRead?.id === contactToDelete.id) {
      setSelectedContactToRead(null);
    }
    showToast(`🗑️ Inquiry from "${name}" deleted.`);
  };

  // Handler: Add New Manual Booking
  const handleCreateNewBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookingPatient.trim() || !newBookingMobile.trim()) return;

    addHomeCollectionBooking({
      patientName: newBookingPatient.trim(),
      mobile: newBookingMobile.replace(/\D/g, ''),
      address: newBookingAddress.trim() || 'Central Reception Walk-in',
      timeSlot: newBookingTimeSlot.trim() || 'Immediate / Today',
      packageOrTest: newBookingTest.trim(),
      amountINR: newBookingAmount,
      paymentMode: newBookingPaymentMode,
      labId: selectedVendorLabId,
    });

    setIsNewBookingModalOpen(false);
    setNewBookingPatient('');
    setNewBookingMobile('');
    setNewBookingAddress('');
    showToast(`✅ Booking created for ${newBookingPatient}`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMessage.text}</span>
          </div>
          {toastMessage.actionText && toastMessage.onAction && (
            <button
              type="button"
              onClick={toastMessage.onAction}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-lg font-bold text-[11px] shrink-0 transition flex items-center gap-1 cursor-pointer"
            >
              <span>{toastMessage.actionText}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#123B6D] border border-blue-200 text-xs font-black">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Section 4: Forms &amp; Patient Inquiries</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Patient Booking Submissions &amp; Contact Inquiries</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Manage patient test bookings submitted from your public website, transfer entries directly to your Reception Desk queue, and review contact messages.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigateView('reception_dashboard')}
              className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>🖥️ Go to Reception Desk</span>
              <ArrowRight className="w-3 h-3 text-teal-600" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateView('vendor_website')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Live Website Preview</span>
            </button>
          </div>
        </div>

        {/* 2 Sub-Tabs Header Navigation: 1. Booking submission list, 2. Contact form */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-2">
          {/* SubTab 1: Booking Submission List */}
          <button
            type="button"
            onClick={() => handleSubTabChange('bookings')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-xs ${
              currentSubTab === 'bookings'
                ? 'bg-[#123B6D] text-white shadow-blue-900/10'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            <CalendarCheck className={`w-4 h-4 ${currentSubTab === 'bookings' ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>1. Booking Submission List</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentSubTab === 'bookings'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {vendorBookings.length}
            </span>
            {pendingBookingsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Pending bookings" />
            )}
          </button>

          {/* SubTab 2: Contact Form */}
          <button
            type="button"
            onClick={() => handleSubTabChange('contacts')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-xs ${
              currentSubTab === 'contacts'
                ? 'bg-[#123B6D] text-white shadow-blue-900/10'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            <MessageSquare className={`w-4 h-4 ${currentSubTab === 'contacts' ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>2. Contact Form</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentSubTab === 'contacts'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {contactSubmissions.length}
            </span>
            {unreadContactsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white animate-pulse">
                {unreadContactsCount} New
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: BOOKING SUBMISSION LIST                      */}
      {/* 1. booking submission list > delete /transfer to Reception desk */}
      {/* ======================================================== */}
      {currentSubTab === 'bookings' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Total Bookings</span>
              <div className="text-2xl font-black text-[#123B6D] mt-1">{totalBookingsCount}</div>
              <span className="text-[10px] text-slate-500">Website &amp; portal submissions</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-800 block uppercase tracking-wider">Pending Action</span>
              <div className="text-2xl font-black text-amber-700 mt-1">{pendingBookingsCount}</div>
              <span className="text-[10px] text-amber-600">Awaiting sample pickup / desk</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-teal-200 bg-teal-50/30 shadow-2xs">
              <span className="text-[11px] font-bold text-teal-800 block uppercase tracking-wider">Transferred to Reception</span>
              <div className="text-2xl font-black text-teal-700 mt-1">{transferredBookingsCount}</div>
              <span className="text-[10px] text-teal-600">Tokens created at counter</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Quick Actions</span>
                <button
                  type="button"
                  onClick={() => setIsNewBookingModalOpen(true)}
                  className="mt-1 w-full bg-[#123B6D] hover:bg-[#0e2c52] text-white py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Add Booking</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search, Filter, and Action Strip */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search by patient name, mobile (+91), booking ID, address..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
              />
              {bookingSearch && (
                <button
                  type="button"
                  onClick={() => setBookingSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
              <button
                type="button"
                onClick={() => setBookingStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                  bookingStatusFilter === 'all'
                    ? 'bg-[#123B6D] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({vendorBookings.length})
              </button>
              <button
                type="button"
                onClick={() => setBookingStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                  bookingStatusFilter === 'pending'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                }`}
              >
                Pending ({pendingBookingsCount})
              </button>
              <button
                type="button"
                onClick={() => setBookingStatusFilter('transferred')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                  bookingStatusFilter === 'transferred'
                    ? 'bg-teal-700 text-white font-black shadow-2xs'
                    : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/60'
                }`}
              >
                Transferred to Reception ({transferredBookingsCount})
              </button>
            </div>
          </div>

          {/* Bookings Table / Cards */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Booking ID &amp; Time</th>
                    <th className="p-3.5">Patient Details</th>
                    <th className="p-3.5">Test / Package Booked</th>
                    <th className="p-3.5">Preferred Slot &amp; Address</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((b) => {
                    const cleanPhone = b.mobile.replace(/\D/g, '');
                    const isTransferred = !!b.transferredToReception;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition">
                        {/* 1. ID & Timestamp */}
                        <td className="p-3.5 align-top">
                          <div className="font-mono font-bold text-[#123B6D] text-xs flex items-center gap-1.5">
                            <span>{b.id}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(b.id, b.id)}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                              title="Copy booking ID"
                            >
                              {copiedId === b.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{b.createdAt}</span>
                          </div>
                        </td>

                        {/* 2. Patient Details */}
                        <td className="p-3.5 align-top">
                          <div className="font-extrabold text-slate-900 text-sm">{b.patientName}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <a
                              href={`tel:+91${cleanPhone}`}
                              className="font-mono text-xs text-slate-700 font-bold hover:text-[#123B6D] flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>+91 {b.mobile}</span>
                            </a>
                            <a
                              href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                                `Hello ${b.patientName}, greetings from ${labName}. We received your test booking [${b.id}] for: ${b.packageOrTest}. Our team will collect the sample as requested.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </td>

                        {/* 3. Test / Package Booked */}
                        <td className="p-3.5 align-top">
                          <div className="font-bold text-slate-800 text-xs">{b.packageOrTest}</div>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                            {b.amountINR && (
                              <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                ₹{b.amountINR}
                              </span>
                            )}
                            <span className="text-slate-500 text-[10px]">
                              {b.paymentMode || 'Pay at Home Collection'}
                            </span>
                          </div>
                        </td>

                        {/* 4. Slot & Address */}
                        <td className="p-3.5 align-top max-w-xs">
                          <div className="font-semibold text-slate-700 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{b.timeSlot}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-start gap-1 leading-snug">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{b.address || 'Address provided at booking'}</span>
                          </div>
                        </td>

                        {/* 5. Status Badge */}
                        <td className="p-3.5 align-top">
                          <div className="space-y-1">
                            {isTransferred ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-teal-100 text-teal-800 border border-teal-300 shadow-2xs">
                                <Building2 className="w-3 h-3 text-teal-600" />
                                <span>At Reception ({b.receptionToken || 'Transferred'})</span>
                              </div>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  b.status === 'Pending'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : b.status === 'Phlebotomist Assigned'
                                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                    : b.status === 'Sample Collected'
                                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                }`}
                              >
                                <span>{b.status}</span>
                              </span>
                            )}

                            {/* Status dropdown selector */}
                            <div>
                              <select
                                value={b.status}
                                onChange={(e) =>
                                  updateBookingStatus(b.id, e.target.value as HomeCollectionBooking['status'])
                                }
                                className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Phlebotomist Assigned">Phlebotomist Assigned</option>
                                <option value="Sample Collected">Sample Collected</option>
                                <option value="Report Delivered">Report Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>
                        </td>

                        {/* 6. Action Buttons: Transfer to Reception Desk & Delete */}
                        <td className="p-3.5 align-top text-right">
                          <div className="inline-flex flex-col sm:flex-row items-end sm:items-center gap-1.5">
                            {/* Transfer to Reception Button */}
                            <button
                              type="button"
                              onClick={() => setBookingToTransfer(b)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                isTransferred
                                  ? 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
                                  : 'bg-teal-700 hover:bg-teal-800 text-white font-black'
                              }`}
                              title="Transfer patient directly to Reception Desk queue"
                            >
                              <Building2 className={`w-3.5 h-3.5 ${isTransferred ? 'text-teal-600' : 'text-amber-300'}`} />
                              <span>{isTransferred ? 'Re-Transfer' : 'Transfer to Reception'}</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setBookingToDelete(b)}
                              className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete booking submission"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                          <CalendarCheck className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-slate-700 text-sm">No booking submissions found</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {bookingSearch ? 'Try a different search keyword.' : 'Patients who book tests on your website will appear here automatically.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: CONTACT FORM INQUIRIES                        */}
      {/* 2. Contact form > read/ delete                           */}
      {/* ======================================================== */}
      {currentSubTab === 'contacts' && (
        <div className="space-y-4">
          {/* Metrics bar for Contact Inquiries */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Total Inquiries</span>
              <div className="text-2xl font-black text-[#123B6D] mt-1">{totalContactsCount}</div>
              <span className="text-[10px] text-slate-500">From website contact form</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/40 shadow-2xs">
              <span className="text-[11px] font-bold text-rose-800 block uppercase tracking-wider">Unread Messages</span>
              <div className="text-2xl font-black text-rose-700 mt-1">{unreadContactsCount}</div>
              <span className="text-[10px] text-rose-600">Requires response</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-800 block uppercase tracking-wider">Read / Addressed</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{totalContactsCount - unreadContactsCount}</div>
              <span className="text-[10px] text-emerald-600">Reviewed inquiries</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search by sender name, mobile, subject, reference token..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
              />
              {contactSearch && (
                <button
                  type="button"
                  onClick={() => setContactSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Read/Unread Filters */}
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setContactStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                  contactStatusFilter === 'all'
                    ? 'bg-[#123B6D] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({contactSubmissions.length})
              </button>
              <button
                type="button"
                onClick={() => setContactStatusFilter('unread')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                  contactStatusFilter === 'unread'
                    ? 'bg-rose-600 text-white font-black shadow-2xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/60'
                }`}
              >
                Unread ({unreadContactsCount})
              </button>
              <button
                type="button"
                onClick={() => setContactStatusFilter('read')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                  contactStatusFilter === 'read'
                    ? 'bg-emerald-600 text-white font-black shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                }`}
              >
                Read ({contactSubmissions.length - unreadContactsCount})
              </button>
            </div>
          </div>

          {/* Contact Submissions List */}
          <div className="grid grid-cols-1 gap-3.5">
            {filteredContacts.map((c) => {
              const isUnread = c.status === 'unread';
              const cleanPhone = c.phone.replace(/\D/g, '');

              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 shadow-2xs hover:shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isUnread
                      ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-300/40'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Left: Sender info & message snippet */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-sm text-slate-900">{c.name}</h3>
                      {c.referenceToken && (
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {c.referenceToken}
                        </span>
                      )}
                      {isUnread ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                          ● Unread
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                          Read
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{c.createdAt}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                      <a
                        href={`tel:+91${cleanPhone}`}
                        className="font-bold text-[#123B6D] hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>+91 {c.phone}</span>
                      </a>
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{c.email}</span>
                        </a>
                      )}
                    </div>

                    {c.subject && (
                      <div className="text-xs font-bold text-slate-800">
                        Subject: <span className="text-[#123B6D]">{c.subject}</span>
                      </div>
                    )}

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      "{c.message}"
                    </p>
                  </div>

                  {/* Right: Actions (Read / Toggle / Delete) */}
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Read Full Message button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedContactToRead(c);
                        if (c.status === 'unread') {
                          markContactAsRead(c.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#123B6D] hover:bg-[#0e2c52] text-white flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      title="Read full message inquiry"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>Read Message</span>
                    </button>

                    {/* Toggle Read/Unread */}
                    <button
                      type="button"
                      onClick={() => toggleContactReadStatus(c.id)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      title={isUnread ? 'Mark as read' : 'Mark as unread'}
                    >
                      {isUnread ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                    </button>

                    {/* Delete Inquiry */}
                    <button
                      type="button"
                      onClick={() => setContactToDelete(c)}
                      className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete contact submission"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredContacts.length === 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-700 text-sm">No contact inquiries found</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {contactSearch ? 'Try a different search keyword.' : 'Patient messages sent from the Contact Us form will appear here.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: TRANSFER BOOKING TO RECEPTION DESK CONFIRMATION */}
      {/* ======================================================== */}
      {bookingToTransfer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#123B6D]">Transfer to Reception Desk</h3>
                  <p className="text-[11px] text-slate-400">Creates live patient entry &amp; counter token</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBookingToTransfer(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Patient Name:</span>
                <span className="font-extrabold text-slate-900 text-sm">{bookingToTransfer.patientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Mobile Number:</span>
                <span className="font-mono font-bold text-slate-800">+91 {bookingToTransfer.mobile}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Test / Package:</span>
                <span className="font-bold text-[#123B6D]">{bookingToTransfer.packageOrTest}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Collection Slot:</span>
                <span className="text-slate-700 font-medium">{bookingToTransfer.timeSlot}</span>
              </div>
              {bookingToTransfer.address && (
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-slate-500 font-semibold block mb-0.5">Address:</span>
                  <span className="text-slate-700">{bookingToTransfer.address}</span>
                </div>
              )}
            </div>

            <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 text-[11px] text-teal-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-teal-950">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>What happens upon transfer:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-teal-800 leading-relaxed">
                <li>An official Reception Counter Token (e.g. <strong>TK-204</strong>) and UHID will be assigned.</li>
                <li>Patient will immediately appear on the <strong>Reception Desk billing counter</strong>.</li>
                <li>Status will update to <em>"Transferred to Reception"</em> with date &amp; token reference.</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBookingToTransfer(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmTransfer(bookingToTransfer)}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4 text-amber-300" />
                <span>Confirm Transfer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: DELETE BOOKING CONFIRMATION DIALOG              */}
      {/* ======================================================== */}
      {bookingToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Delete Booking Submission</h3>
                <p className="text-[11px] text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete the booking for{' '}
              <strong>"{bookingToDelete.patientName}"</strong> (ID: <span className="font-mono">{bookingToDelete.id}</span>)?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBookingToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBooking}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition cursor-pointer"
              >
                Delete Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: READ CONTACT INQUIRY MODAL (Full View & Reply)   */}
      {/* ======================================================== */}
      {selectedContactToRead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 text-xs space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#123B6D] border border-blue-200 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Website Contact Form Message</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span>Token: <strong>{selectedContactToRead.referenceToken || selectedContactToRead.id}</strong></span>
                    <span>•</span>
                    <span>{selectedContactToRead.createdAt}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContactToRead(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sender Detail Block */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Sender Name:</span>
                <span className="font-black text-slate-900 text-sm">{selectedContactToRead.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Mobile Phone:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-800">+91 {selectedContactToRead.phone}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedContactToRead.phone, 'phone')}
                    className="p-1 text-slate-400 hover:text-slate-600"
                    title="Copy phone"
                  >
                    {copiedId === 'phone' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              {selectedContactToRead.email && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Email Address:</span>
                  <span className="text-slate-700">{selectedContactToRead.email}</span>
                </div>
              )}
              {selectedContactToRead.subject && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-semibold">Inquiry Subject:</span>
                  <span className="font-extrabold text-[#123B6D]">{selectedContactToRead.subject}</span>
                </div>
              )}
            </div>

            {/* Message Body */}
            <div>
              <span className="font-bold text-slate-700 block mb-1 text-xs">Full Message Text:</span>
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-200/90 text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                {selectedContactToRead.message}
              </div>
            </div>

            {/* Quick Reply & Action Buttons */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quick Response:</span>
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`https://wa.me/91${selectedContactToRead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hello ${selectedContactToRead.name}, thank you for contacting ${labName} regarding "${selectedContactToRead.subject || 'your inquiry'}". How can we assist you today?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp Reply</span>
                </a>

                <a
                  href={`tel:+91${selectedContactToRead.phone.replace(/\D/g, '')}`}
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-[11px] px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                >
                  <Phone className="w-3 h-3 text-[#123B6D]" />
                  <span>Call +91</span>
                </a>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  toggleContactReadStatus(selectedContactToRead.id);
                  setSelectedContactToRead(null);
                  showToast('Message status updated.');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
              >
                Mark as Unread
              </button>

              <button
                type="button"
                onClick={() => setSelectedContactToRead(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: DELETE CONTACT INQUIRY CONFIRMATION             */}
      {/* ======================================================== */}
      {contactToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Delete Contact Inquiry</h3>
                <p className="text-[11px] text-slate-500">Remove from customer records.</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete the message from{' '}
              <strong>"{contactToDelete.name}"</strong>?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setContactToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteContact}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition cursor-pointer"
              >
                Delete Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: MANUAL ADD BOOKING MODAL                        */}
      {/* ======================================================== */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#123B6D] flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Add Patient Test Booking</h3>
                  <p className="text-[11px] text-slate-400">Record a phone call or manual home pickup</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewBookingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewBooking} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Patient Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newBookingPatient}
                  onChange={(e) => setNewBookingPatient(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={newBookingMobile}
                  onChange={(e) => setNewBookingMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Test or Package Name</label>
                <input
                  type="text"
                  required
                  value={newBookingTest}
                  onChange={(e) => setNewBookingTest(e.target.value)}
                  placeholder="e.g. Complete Blood Count (CBC) or Full Body Checkup"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Amount (₹ INR)</label>
                  <input
                    type="number"
                    value={newBookingAmount}
                    onChange={(e) => setNewBookingAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={newBookingTimeSlot}
                    onChange={(e) => setNewBookingTimeSlot(e.target.value)}
                    placeholder="Tomorrow: 8:00 AM - 10:00 AM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Pickup Address</label>
                <textarea
                  rows={2}
                  value={newBookingAddress}
                  onChange={(e) => setNewBookingAddress(e.target.value)}
                  placeholder="House No., Street, Sector / Area"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewBookingModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white font-extrabold transition cursor-pointer shadow-xs"
                >
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
