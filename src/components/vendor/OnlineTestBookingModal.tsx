import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Search,
  Calendar,
  Clock,
  QrCode,
  Copy,
  MapPin,
  Building2,
  Home,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Phone,
  User,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Share2,
  Sparkles,
  Printer,
  Smartphone,
} from 'lucide-react';
import { TestItem, VendorPackage, ReceptionPatientEntry } from '../../types';
import { useCms } from '../../context/CmsContext';

interface OnlineTestBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelection?: string;
  initialTests?: { name: string; price: number; type: 'test' | 'package' }[];
  onOpenReportPortal?: (reportId?: string, mobile?: string) => void;
  onBookingSuccess?: () => void;
}

export const OnlineTestBookingModal: React.FC<OnlineTestBookingModalProps> = ({
  isOpen,
  onClose,
  initialSelection = '',
  initialTests,
  onOpenReportPortal,
  onBookingSuccess,
}) => {
  const {
    vendorLabSettings,
    vendorTests,
    vendorPackages,
    addReceptionEntry,
    addHomeCollectionBooking,
    activeTenantId,
    activeBranchId,
  } = useCms();

  // Current Step: 1 = Test Selection & Details, 2 = Payment Selection (QR / Pay at Branch), 3 = Booking Confirmed
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State - Tests
  const [selectedTests, setSelectedTests] = useState<{ name: string; price: number; type: 'test' | 'package' }[]>([]);
  const [testSearch, setTestSearch] = useState('');
  const [isAddingTest, setIsAddingTest] = useState(false);

  // Form State - Patient Demographics
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('32');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [mobile, setMobile] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('Self / Direct Walk-in');

  // Visit Type: 'Walk-in' (Lab Visit) | 'Home Collection' (Phlebotomist Visit)
  const [visitType, setVisitType] = useState<'Walk-in' | 'Home Collection'>('Walk-in');
  const [homeAddress, setHomeAddress] = useState('');
  const [preferredSlot, setPreferredSlot] = useState('Today (Within 2 Hours)');

  // Form State - Payment (Step 2)
  const [paymentOption, setPaymentOption] = useState<'online_upi' | 'pay_at_branch'>('online_upi');
  const [upiRefNumber, setUpiRefNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State - Confirmed Result (Step 3)
  const [confirmedEntry, setConfirmedEntry] = useState<ReceptionPatientEntry | null>(null);

  const labName = vendorLabSettings?.labName || 'Apex Diagnostic & Clinical Laboratory';
  const merchantName = vendorLabSettings?.merchantName || labName;
  const upiId = vendorLabSettings?.upiId1 || 'apexlab@icici';
  const labPhone = vendorLabSettings?.phone || '7087033009';

  // Initialize selected test or package when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setCurrentStep(1);
    setIsSubmitting(false);
    setConfirmedEntry(null);
    setUpiRefNumber('');

    if (initialTests && initialTests.length > 0) {
      setSelectedTests(initialTests);
      return;
    }

    if (initialSelection) {
      // Check if it matches a package
      const matchedPkg = vendorPackages.find(
        (p) =>
          initialSelection.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(initialSelection.toLowerCase())
      );
      if (matchedPkg) {
        setSelectedTests([{ name: matchedPkg.name, price: matchedPkg.priceINR, type: 'package' }]);
        return;
      }

      // Check if it matches a test
      const matchedTest = vendorTests.find(
        (t) =>
          initialSelection.toLowerCase().includes(t.name.toLowerCase()) ||
          t.name.toLowerCase().includes(initialSelection.toLowerCase())
      );
      if (matchedTest) {
        setSelectedTests([{ name: matchedTest.name, price: matchedTest.priceINR, type: 'test' }]);
        return;
      }

      // Fallback: extract price if format like "CBC (₹350)"
      const priceMatch = initialSelection.match(/₹\s*(\d+)/);
      const cleanName = initialSelection.replace(/\s*\([^)]*\)/g, '').trim();
      setSelectedTests([
        {
          name: cleanName || initialSelection,
          price: priceMatch ? Number(priceMatch[1]) : 350,
          type: 'test',
        },
      ]);
    } else {
      // Default to CBC if nothing was passed
      const defaultTest = vendorTests[0] || { name: 'Complete Blood Count (CBC)', priceINR: 350 };
      setSelectedTests([{ name: defaultTest.name, price: defaultTest.priceINR, type: 'test' }]);
    }
  }, [isOpen, initialSelection]);

  if (!isOpen) return null;

  // Pricing calculations
  const totalAmount = selectedTests.reduce((sum, item) => sum + item.price, 0);

  // Search filtered tests and packages
  const filteredCatalogTests = vendorTests.filter(
    (t) =>
      !selectedTests.some((st) => st.name === t.name) &&
      (t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.code.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.category.toLowerCase().includes(testSearch.toLowerCase()))
  );

  const filteredCatalogPackages = vendorPackages.filter(
    (p) =>
      !selectedTests.some((st) => st.name === p.name) &&
      p.name.toLowerCase().includes(testSearch.toLowerCase())
  );

  const handleAddTest = (name: string, price: number, type: 'test' | 'package') => {
    setSelectedTests((prev) => [...prev, { name, price, type }]);
    setTestSearch('');
    setIsAddingTest(false);
  };

  const handleRemoveTest = (name: string) => {
    if (selectedTests.length === 1) return; // keep at least 1 test
    setSelectedTests((prev) => prev.filter((t) => t.name !== name));
  };

  // Step 1 Validation
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('कृपया मरीज़ का नाम दर्ज करें (Please enter patient name)');
      return;
    }
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      alert('कृपया 10 अंकों का मोबाइल नंबर दर्ज करें (Please enter 10-digit mobile number)');
      return;
    }
    if (selectedTests.length === 0) {
      alert('कृपया कम से कम एक टेस्ट चुनें (Please select at least one test)');
      return;
    }
    if (visitType === 'Home Collection' && !homeAddress.trim()) {
      alert('कृपया घर का पता दर्ज करें (Please enter address for home sample collection)');
      return;
    }

    setCurrentStep(2);
  };

  // Step 2 Final Submission: Add entry to Reception Queue & Home Booking
  const handleConfirmBooking = () => {
    setIsSubmitting(true);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const randomToken = `TK-${Math.floor(100 + Math.random() * 899)}`;
    const randomUhid = `UHID-W-${Date.now().toString().slice(-6)}`;

    const isPaidOnline = paymentOption === 'online_upi';
    const paid = isPaidOnline ? totalAmount : 0;
    const due = isPaidOnline ? 0 : totalAmount;
    const paymentMode = isPaidOnline ? 'UPI' : 'Cash';
    const paymentStatus = isPaidOnline ? 'Full Payment' : 'Due';

    // 1. Create Reception Entry for Front-Desk Queue
    const newReceptionEntry = addReceptionEntry({
      uhid: randomUhid,
      tokenNumber: randomToken,
      tokenNo: randomToken,
      patientName: patientName.trim(),
      age: Number(age) || 30,
      gender,
      mobile: mobile.replace(/\D/g, ''),
      referringDoctor: referringDoctor.trim() || 'Self / Direct Walk-in',
      tests: selectedTests.map((t) => t.name),
      sampleType: selectedTests.some((t) => t.name.toLowerCase().includes('urine'))
        ? 'Urine + Whole Blood'
        : 'EDTA Blood / Serum',
      totalAmount,
      discountINR: 0,
      paidAmount: paid,
      dueAmount: due,
      paymentMode,
      paymentStatus,
      status: 'Waiting',
      registeredAt: `Today, ${timeStr}`,
      bookingSource: 'Website',
      visitType,
      address: visitType === 'Home Collection' ? homeAddress.trim() : undefined,
      preferredTimeSlot: preferredSlot,
      upiTransactionRef: isPaidOnline && upiRefNumber.trim() ? upiRefNumber.trim() : undefined,
      notes: `🌐 Online Website Booking • ${
        isPaidOnline ? `Paid via UPI (Ref: ${upiRefNumber || 'Instant Online'})` : 'Pay at Lab Counter'
      } • ${visitType === 'Home Collection' ? `Address: ${homeAddress}` : 'Walk-in at Lab'} • Slot: ${preferredSlot}`,
      labId: activeTenantId !== 'all' ? activeTenantId : 'lab-apex',
      branchId: activeBranchId !== 'all' ? activeBranchId : 'branch-1',
    });

    // 2. If Home Collection, also save in home collection records
    if (visitType === 'Home Collection') {
      addHomeCollectionBooking({
        patientName: patientName.trim(),
        mobile: mobile.replace(/\D/g, ''),
        address: homeAddress.trim(),
        timeSlot: preferredSlot,
        packageOrTest: selectedTests.map((t) => t.name).join(', '),
        amountINR: totalAmount,
        paymentMode: isPaidOnline ? 'UPI Online' : 'Pay at Counter / Visit',
      });
    }

    setConfirmedEntry(newReceptionEntry);
    setIsSubmitting(false);
    setCurrentStep(3);
    if (onBookingSuccess) {
      onBookingSuccess();
    }
  };

  const dynamicUpiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Test Booking - ${patientName || 'Patient'}`)}`;
  const qrCodeUrl =
    vendorLabSettings?.qrCode1Url ||
    `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(dynamicUpiUri)}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#123B6D] via-[#103460] to-[#0F766E] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/15 text-[11px] font-bold text-amber-300 mb-1">
              <span>🌐 Online Test Booking</span>
              <span className="text-white/60">•</span>
              <span>Direct to Reception Desk</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <span>{labName}</span>
            </h2>
            <p className="text-[11px] text-slate-200">
              Book test online & get immediate Token Number for lab reception
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
            aria-label="Close Booking Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Step Progress Stepper Bar */}
        {currentStep !== 3 && (
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs font-bold">
            <div
              className={`flex items-center gap-2 ${
                currentStep === 1 ? 'text-[#123B6D]' : 'text-emerald-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  currentStep === 1
                    ? 'bg-[#123B6D] text-white shadow-xs'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              </div>
              <span>1. Tests & Patient Info</span>
            </div>

            <div className="w-8 sm:w-16 h-0.5 bg-slate-200" />

            <div
              className={`flex items-center gap-2 ${
                currentStep === 2 ? 'text-[#123B6D]' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  currentStep === 2
                    ? 'bg-[#123B6D] text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                2
              </div>
              <span>2. Payment (UPI / Counter)</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* STEP 1: Test Selection & Patient Details */}
          {currentStep === 1 && (
            <form onSubmit={handleProceedToPayment} className="space-y-4">
              {/* Selected Tests List Box */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <span>🔬 Selected Tests / Packages</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      ({selectedTests.length})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingTest(!isAddingTest)}
                    className="text-[11px] font-bold text-[#123B6D] hover:underline flex items-center gap-1"
                  >
                    <span>+ Add More Tests</span>
                  </button>
                </div>

                {/* Chips of selected tests */}
                <div className="space-y-1.5">
                  {selectedTests.map((t) => (
                    <div
                      key={t.name}
                      className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            t.type === 'package'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-teal-100 text-teal-900'
                          }`}
                        >
                          {t.type === 'package' ? 'PACKAGE' : 'TEST'}
                        </span>
                        <span className="font-bold text-slate-800">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-[#123B6D]">₹{t.price}</span>
                        {selectedTests.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTest(t.name)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                            title="Remove test"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add More Tests Catalog Dropdown Drawer */}
                {isAddingTest && (
                  <div className="bg-white p-3 rounded-lg border border-teal-300 shadow-xs space-y-2 mt-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={testSearch}
                        onChange={(e) => setTestSearch(e.target.value)}
                        placeholder="Search tests (e.g. Thyroid, Lipid, Sugar, KFT, LFT)..."
                        className="w-full pl-8 pr-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-100">
                      {/* Packages */}
                      {filteredCatalogPackages.slice(0, 3).map((pkg) => (
                        <div
                          key={pkg.id}
                          className="pt-1 flex items-center justify-between text-xs hover:bg-slate-50 p-1.5 rounded cursor-pointer"
                          onClick={() => handleAddTest(pkg.name, pkg.priceINR, 'package')}
                        >
                          <div>
                            <span className="font-bold text-amber-900">{pkg.name}</span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({pkg.testsCount} tests)
                            </span>
                          </div>
                          <span className="font-black text-[#123B6D] bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                            + ₹{pkg.priceINR}
                          </span>
                        </div>
                      ))}

                      {/* Tests */}
                      {filteredCatalogTests.slice(0, 6).map((test) => (
                        <div
                          key={test.id}
                          className="pt-1 flex items-center justify-between text-xs hover:bg-slate-50 p-1.5 rounded cursor-pointer"
                          onClick={() => handleAddTest(test.name, test.priceINR, 'test')}
                        >
                          <div>
                            <span className="font-bold text-slate-800">{test.name}</span>
                            <span className="text-[10px] text-slate-400 ml-1">({test.category})</span>
                          </div>
                          <span className="font-black text-[#123B6D] bg-teal-50 px-2 py-0.5 rounded text-[11px]">
                            + ₹{test.priceINR}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subtotal Banner */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-extrabold text-sm text-[#123B6D]">
                  <span>Total Amount (कुल शुल्क):</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              {/* Patient Personal Details */}
              <div className="space-y-3">
                <div className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#123B6D]" />
                  <span>मरीज़ की जानकारी (Patient Details)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Patient Full Name (पूरा नाम) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar Verma"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Age (उम्र) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="115"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Gender (लिंग) <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['Male', 'Female', 'Other'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`py-2 text-[11px] font-bold rounded-lg border transition ${
                            gender === g
                              ? 'bg-[#123B6D] text-white border-[#123B6D]'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      10-Digit Mobile (मोबाइल नंबर) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">+91</span>
                      <input
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="w-full pl-11 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none font-medium"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      इसी नंबर पर WhatsApp रिपोर्ट व बिल टोकन जाएगा
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Referring Doctor (रेफरिंग डॉक्टर)
                    </label>
                    <input
                      type="text"
                      value={referringDoctor}
                      onChange={(e) => setReferringDoctor(e.target.value)}
                      placeholder="Self / Direct Walk-in or Dr. Name"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Visit Type: Walk-in vs Home Collection */}
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700">
                  Select Visit Option (जाँच कहाँ करवानी है?)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisitType('Walk-in')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                      visitType === 'Walk-in'
                        ? 'border-[#123B6D] bg-blue-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg ${
                        visitType === 'Walk-in' ? 'bg-[#123B6D] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-800 text-xs">Lab Walk-in</div>
                      <div className="text-[10px] text-slate-500">Visit lab reception directly</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisitType('Home Collection')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                      visitType === 'Home Collection'
                        ? 'border-[#0F766E] bg-teal-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg ${
                        visitType === 'Home Collection'
                          ? 'bg-[#0F766E] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-800 text-xs">Home Pickup</div>
                      <div className="text-[10px] text-slate-500">Phlebotomist visits home</div>
                    </div>
                  </button>
                </div>

                {/* If Home Collection selected, require Address */}
                {visitType === 'Home Collection' && (
                  <div className="space-y-2 pt-2 bg-teal-50/40 p-3 rounded-xl border border-teal-200">
                    <div>
                      <label className="block text-[11px] font-bold text-teal-900 mb-1">
                        Full Address for Home Sample Collection <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={homeAddress}
                        onChange={(e) => setHomeAddress(e.target.value)}
                        placeholder="House No, Street, Landmark, Area / City"
                        className="w-full px-3 py-2 rounded-lg border border-teal-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-teal-900 mb-1">
                        Preferred Time Slot (समय स्लॉट)
                      </label>
                      <select
                        value={preferredSlot}
                        onChange={(e) => setPreferredSlot(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-teal-300 text-xs bg-white focus:outline-none"
                      >
                        <option>Morning: 6:30 AM – 8:30 AM (Fasting Preferred)</option>
                        <option>Morning: 8:30 AM – 10:30 AM</option>
                        <option>Forenoon: 10:30 AM – 1:00 PM</option>
                        <option>Evening: 4:30 PM – 7:00 PM</option>
                        <option>Today Urgent: Within 2 Hours</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button to Step 2 */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#123B6D] hover:bg-[#0e2c52] text-white py-3 rounded-xl text-xs font-black transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Payment (चरण 2: भुगतान विकल्प)</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Payment Collection (QR Code + UPI ID OR Pay at Branch) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Patient & Tests Quick Summary Header */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-[#172033] text-xs">
                    {patientName} ({age}Y • {gender})
                  </div>
                  <div className="text-[11px] text-slate-500">
                    +91 {mobile} • {selectedTests.length} Test(s) • {visitType}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Total Bill</div>
                  <div className="text-base font-black text-[#123B6D]">₹{totalAmount}</div>
                </div>
              </div>

              {/* Choice of Payment: Option A (UPI QR) vs Option B (Pay at Branch) */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  Select Payment Option (भुगतान का तरीका चुनें):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentOption('online_upi')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      paymentOption === 'online_upi'
                        ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-emerald-600" />
                        <span>Pay Online (UPI)</span>
                      </span>
                      {paymentOption === 'online_upi' && (
                        <Check className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Scan QR Code via GPay, PhonePe, Paytm or BHIM
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentOption('pay_at_branch')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      paymentOption === 'pay_at_branch'
                        ? 'border-[#123B6D] bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-[#123B6D]" />
                        <span>Pay at Branch</span>
                      </span>
                      {paymentOption === 'pay_at_branch' && (
                        <Check className="w-4 h-4 text-[#123B6D]" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      ब्रांच पर नकद / कार्ड से दें (Pay at Counter)
                    </span>
                  </button>
                </div>
              </div>

              {/* OPTION 1: Real UPI QR Code & UPI ID Display */}
              {paymentOption === 'online_upi' && (
                <div className="bg-slate-50 border-2 border-dashed border-emerald-300 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
                  <div className="flex items-center justify-between w-full pb-2 border-b border-slate-200 text-left">
                    <div>
                      <div className="font-black text-xs text-slate-800">{merchantName}</div>
                      <div className="text-[10px] text-emerald-700 font-bold">
                        Official Verified Lab UPI QR
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-emerald-800">₹{totalAmount}</span>
                    </div>
                  </div>

                  {/* QR Image */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <img
                      src={qrCodeUrl}
                      alt="UPI Payment QR Code"
                      className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                    />
                  </div>

                  {/* 1-Click Copy UPI Bar */}
                  <div className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="text-left min-w-0">
                      <div className="text-[10px] font-bold text-slate-400">LAB UPI ID:</div>
                      <div className="font-mono font-bold text-slate-800 text-xs truncate">
                        {upiId}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(upiId);
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 2500);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] flex items-center gap-1 transition shrink-0 cursor-pointer"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy UPI</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Supported UPI Apps */}
                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-bold">
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200">GPay</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200">PhonePe</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Paytm</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200">BHIM</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Any UPI</span>
                  </div>

                  {/* Optional UTR Input */}
                  <div className="w-full text-left pt-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      UPI Reference / UTR No. (वैकल्पिक / Optional)
                    </label>
                    <input
                      type="text"
                      value={upiRefNumber}
                      onChange={(e) => setUpiRefNumber(e.target.value)}
                      placeholder="e.g. 423987123456 (After payment)"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 outline-none bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* OPTION 2: Pay at Branch Note */}
              {paymentOption === 'pay_at_branch' && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 text-[#123B6D] shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#123B6D] text-sm">
                        Pay ₹{totalAmount} at Lab Reception Counter
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        कोई ऑनलाइन पेमेंट करने की आवश्यकता नहीं है। आप लैब काउंटर पर पहुँचकर नकद (Cash), कार्ड (Card) या UPI से भुगतान कर सकते हैं।
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-blue-100 text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>आपकी बुकिंग तुरंत रिसेप्शन स्क्रीन पर दर्ज हो जाएगी</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>टोकन नंबर जनरेट होगा जिससे लाइन में नहीं लगना पड़ेगा</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>रसीद रिसेप्शन पर प्राप्त करें</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Buttons: Back & Final Confirm */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmBooking}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                    paymentOption === 'online_upi'
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : 'bg-[#123B6D] hover:bg-[#0c284b] text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <span>Registering Booking...</span>
                  ) : paymentOption === 'online_upi' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-amber-300" />
                      <span>Confirm Booking (Paid ₹{totalAmount} via UPI)</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4 text-amber-300" />
                      <span>Confirm Booking (Pay ₹{totalAmount} at Counter)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Instant Booking Confirmation Screen */}
          {currentStep === 3 && confirmedEntry && (
            <div className="space-y-4 text-center py-2">
              {/* Success Badge */}
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  🎉 Booking Confirmed & Queue Token Generated
                </span>
                <h3 className="text-xl font-black text-[#123B6D] mt-2">
                  बुकिंग सफलतापूर्वक दर्ज हुई!
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  आपकी एंट्री लैब के रिसेप्शन डैशबोर्ड पर लाइव भेज दी गई है।
                </p>
              </div>

              {/* Big Token Number & Slip Card */}
              <div className="bg-slate-50 border-2 border-dashed border-teal-300 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Patient Token Number
                    </span>
                    <span className="text-2xl font-black text-[#123B6D] tracking-tight">
                      {confirmedEntry.tokenNumber}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">UHID</span>
                    <span className="font-mono font-bold text-xs text-slate-700">
                      {confirmedEntry.uhid}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Patient Name</span>
                    <span className="font-bold text-slate-800">{confirmedEntry.patientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Registered Mobile</span>
                    <span className="font-bold text-slate-800">+91 {confirmedEntry.mobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Visit Mode</span>
                    <span className="font-bold text-slate-800">
                      {confirmedEntry.visitType === 'Home Collection'
                        ? '🏠 Home Sample Collection'
                        : '🏢 Lab Reception Walk-in'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Payment Status</span>
                    {confirmedEntry.paymentStatus === 'Full Payment' ? (
                      <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200 inline-block">
                        ✅ Paid ₹{confirmedEntry.paidAmount} (UPI)
                      </span>
                    ) : (
                      <span className="font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200 inline-block">
                        ⚠️ ₹{confirmedEntry.dueAmount} (Pay at Branch)
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 text-[10px] block mb-1">Booked Tests:</span>
                  <div className="flex flex-wrap gap-1">
                    {confirmedEntry.tests.map((test, idx) => (
                      <span
                        key={idx}
                        className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700"
                      >
                        {test}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Next Steps Guide */}
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-left text-xs text-slate-700 space-y-1">
                <div className="font-bold text-[#123B6D]">महत्वपूर्ण निर्देश (Next Steps):</div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  {confirmedEntry.visitType === 'Home Collection' ? (
                    <p>
                      • हमारे लैब के प्रमाणित फ्लेबोटोमिस्ट आपके दिए पते पर निर्धारित समय में पहुँचेंगे।
                    </p>
                  ) : (
                    <p>
                      • जब आप लैब आएँ, रिसेप्शन काउंटर पर टोकन नंबर <strong>{confirmedEntry.tokenNumber}</strong> बताएँ। आपकी एंट्री पहले से लिस्ट में मौजूद है।
                    </p>
                  )}
                  <p>• रिपोर्ट तैयार होते ही आपको WhatsApp और पोर्टल लिंक भेज दिया जाएगा।</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <a
                  href={`https://wa.me/91${confirmedEntry.mobile}?text=${encodeURIComponent(
                    `*${labName} - Test Booking Confirmation*\n\nToken No: ${confirmedEntry.tokenNumber}\nUHID: ${confirmedEntry.uhid}\nPatient: ${confirmedEntry.patientName}\nTests: ${confirmedEntry.tests.join(', ')}\nTotal: ₹${confirmedEntry.totalAmount}\nPayment: ${confirmedEntry.paymentStatus === 'Full Payment' ? 'Paid via Online UPI' : 'Pay at Lab Counter'}\n\nPlease show this token at the reception desk.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share on WhatsApp</span>
                </a>

                {onOpenReportPortal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenReportPortal('', confirmedEntry.mobile);
                    }}
                    className="flex-1 bg-white hover:bg-slate-50 border border-slate-300 text-[#123B6D] py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Track in Patient Portal</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
