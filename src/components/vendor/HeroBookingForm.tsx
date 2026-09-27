import React, { useState, useMemo, useRef } from 'react';
import {
  User,
  Phone,
  Stethoscope,
  FlaskConical,
  Check,
  CheckCircle2,
  X,
  Search,
  Building2,
  Home,
  MapPin,
  QrCode,
  Copy,
  Upload,
  Printer,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  CheckSquare,
  Square,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { TestItem, ReceptionPatientEntry } from '../../types';

interface HeroBookingFormProps {
  onOpenReportPortal?: () => void;
  cartItems?: Array<{ id: string; name: string; price: number }>;
  onBookingSuccess?: () => void;
}

export const HeroBookingForm: React.FC<HeroBookingFormProps> = ({
  onOpenReportPortal,
  cartItems,
  onBookingSuccess,
}) => {
  const {
    vendorTests,
    vendorLabSettings,
    addReceptionEntry,
    addHomeCollectionBooking,
  } = useCms();

  // Form Step:
  // 1 = Patient Details & Collection Mode
  // 2 = Select Tests & Amount (Multi-Select Checkmark / Mark List)
  // 3 = Payment (Method & Confirmation)
  // 4 = Confirmed Receipt View
  const [formStep, setFormStep] = useState<1 | 2 | 3 | 4>(1);

  // 1. Patient Details
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [mobileNumber, setMobileNumber] = useState('');
  const [doctorOrHospital, setDoctorOrHospital] = useState('');

  // Sample Collection Option
  // 'Branch' = Visit Branch (no extra charges)
  // 'Home' = Collect Sample From Home (adds extra home collection charges)
  const [collectionType, setCollectionType] = useState<'Home' | 'Branch'>('Branch');
  const [fullAddress, setFullAddress] = useState('');
  const [areaLocality, setAreaLocality] = useState('');
  const [city, setCity] = useState('Ludhiana');
  const [pincode, setPincode] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('Tomorrow: 7:00 AM - 9:00 AM (Fasting Preferred)');

  // 2. Multi-Selected Tests
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [testSearchTerm, setTestSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // 3. Payment Options (2-Step Process)
  // Step 3.1: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'Online' | 'Spot'>('Spot');
  // Step 3.2: Payment Confirmation
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 4. Booking Receipt State
  const [createdReceipt, setCreatedReceipt] = useState<{
    receiptNo: string;
    uhid: string;
    patientName: string;
    age: string;
    gender: string;
    mobile: string;
    doctor: string;
    selectedTests: Array<{ name: string; price: number }>;
    testsTotal: number;
    homeCollectionFee: number;
    grandTotal: number;
    collectionType: 'Home' | 'Branch';
    fullAddress?: string;
    areaLocality?: string;
    city?: string;
    pincode?: string;
    preferredTimeSlot?: string;
    paymentMethod: 'Online' | 'Spot';
    paymentStatus: 'Pending Verification' | 'Pay on Spot / Unpaid';
    utrNumber?: string;
    screenshotPreview?: string;
    bookingDate: string;
  } | null>(null);

  // Validation error banner
  const [errorMessage, setErrorMessage] = useState('');

  // --- Dynamic Active Tests from Database / CMS ---
  // Only active tests configured by lab admin are loaded
  const activeTests = useMemo(() => {
    return vendorTests.filter((test) => {
      if (test.status === 'Inactive' || test.isActive === false) return false;
      return true;
    });
  }, [vendorTests]);

  // Sync cartItems into selectedTestIds if available and none selected yet
  React.useEffect(() => {
    if (cartItems && cartItems.length > 0 && selectedTestIds.length === 0) {
      const ids: string[] = [];
      cartItems.forEach((ci) => {
        const found = activeTests.find(
          (t) => t.id === ci.id || t.name.toLowerCase() === ci.name.toLowerCase()
        );
        if (found) {
          ids.push(found.id);
        }
      });
      if (ids.length > 0) {
        setSelectedTestIds(ids);
      }
    }
  }, [cartItems, activeTests, selectedTestIds.length]);

  // Unique categories for filtering
  const testCategories = useMemo(() => {
    const cats = new Set<string>();
    activeTests.forEach((t) => {
      if (t.category && t.category.trim()) cats.add(t.category.trim());
    });
    return ['All', ...Array.from(cats)];
  }, [activeTests]);

  // Filtered available tests based on search and category
  const filteredAvailableTests = useMemo(() => {
    return activeTests.filter((t) => {
      const matchesCategory =
        selectedCategoryFilter === 'All' || t.category === selectedCategoryFilter;
      if (!matchesCategory) return false;

      if (!testSearchTerm.trim()) return true;
      const term = testSearchTerm.toLowerCase();
      return (
        t.name.toLowerCase().includes(term) ||
        (t.code && t.code.toLowerCase().includes(term)) ||
        (t.category && t.category.toLowerCase().includes(term))
      );
    });
  }, [activeTests, selectedCategoryFilter, testSearchTerm]);

  // Selected tests objects
  const selectedTestsList = useMemo(() => {
    return selectedTestIds
      .map((id) => activeTests.find((t) => t.id === id))
      .filter((t): t is TestItem => !!t);
  }, [selectedTestIds, activeTests]);

  // Total Tests Amount calculation
  const testsTotal = useMemo(() => {
    return selectedTestsList.reduce((acc, t) => acc + (t.priceINR || 0), 0);
  }, [selectedTestsList]);

  // Admin controlled Home Collection Charge (respects waiver threshold if set)
  const homeCollectionCharge =
    collectionType === 'Home'
      ? (vendorLabSettings.freeHomeCollectionThreshold && vendorLabSettings.freeHomeCollectionThreshold > 0 && testsTotal >= vendorLabSettings.freeHomeCollectionThreshold
          ? 0
          : (vendorLabSettings.homeCollectionCharge ?? 100))
      : 0;

  // Grand Total Calculation
  const grandTotal = testsTotal + homeCollectionCharge;

  // Lab UPI and QR details from Admin settings
  const labUpiId = vendorLabSettings.upiId1 || 'apexlab@icici';
  const labMerchantName = vendorLabSettings.merchantName || vendorLabSettings.labName || 'Apex Diagnostic Laboratory';
  const qrImage = vendorLabSettings.qrCode1Url;

  // Quick fallback dynamic UPI QR URL if admin hasn't uploaded a static QR photo
  const dynamicQrUrl = useMemo(() => {
    if (qrImage) return qrImage;
    const cleanUpi = encodeURIComponent(labUpiId);
    const cleanName = encodeURIComponent(labMerchantName);
    const note = encodeURIComponent(`Lab Booking ${patientName ? `for ${patientName}` : ''}`);
    const upiUri = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${grandTotal}&cu=INR&tn=${note}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiUri)}`;
  }, [qrImage, labUpiId, labMerchantName, grandTotal, patientName]);

  // Toggle Test Selection (Multi-select mark)
  const toggleTestSelection = (testId: string) => {
    if (selectedTestIds.includes(testId)) {
      setSelectedTestIds(selectedTestIds.filter((id) => id !== testId));
    } else {
      setSelectedTestIds([...selectedTestIds, testId]);
    }
  };

  const removeTest = (testId: string) => {
    setSelectedTestIds(selectedTestIds.filter((id) => id !== testId));
  };

  const clearAllSelectedTests = () => {
    setSelectedTestIds([]);
  };

  // Handle Screenshot Upload
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Screenshot file size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard?.writeText(labUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // ==========================================
  // STEP 1 Validation -> Proceed to Step 2
  // ==========================================
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!patientName.trim()) {
      setErrorMessage('Please enter Patient Full Name.');
      return;
    }
    if (!age.trim() || isNaN(Number(age)) || Number(age) < 1 || Number(age) > 125) {
      setErrorMessage('Please enter a valid Patient Age (1 to 125).');
      return;
    }
    const cleanPhone = mobileNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian Mobile Number.');
      return;
    }
    if (collectionType === 'Home') {
      if (!fullAddress.trim()) {
        setErrorMessage('Please enter Full Address for Home Sample Collection.');
        return;
      }
      if (!areaLocality.trim()) {
        setErrorMessage('Please enter Area / Locality.');
        return;
      }
    }

    setFormStep(2);
  };

  // ==========================================
  // STEP 2 Validation -> Proceed to Step 3
  // ==========================================
  const handleProceedToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (selectedTestIds.length === 0) {
      setErrorMessage('Please select at least one Diagnostic Test from the list below.');
      return;
    }

    setFormStep(3);
  };

  // ==========================================
  // STEP 3 Submission -> Create Booking & Generate Receipt
  // ==========================================
  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (paymentMethod === 'Online' && !utrNumber.trim()) {
      setErrorMessage('Please enter 12-digit UPI UTR / Transaction Reference Number.');
      return;
    }

    // Generate Unique Receipt / Booking Number: LAB-2026-XXXXXX
    const currentYear = new Date().getFullYear();
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const receiptNo = `LAB-${currentYear}-${randomSeq}`;
    const uhid = `UHID-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const paymentStatus: 'Pending Verification' | 'Pay on Spot / Unpaid' =
      paymentMethod === 'Online' ? 'Pending Verification' : 'Pay on Spot / Unpaid';

    const selectedTestsBreakdown = selectedTestsList.map((t) => ({
      name: t.name,
      price: t.priceINR,
    }));

    // Construct address string
    const assembledAddress =
      collectionType === 'Home'
        ? `${fullAddress.trim()}, ${areaLocality.trim()}, ${city.trim()}${pincode.trim() ? ` - ${pincode.trim()}` : ''}`
        : 'Walk-in to Lab Branch';

    // 1. Add to Reception Queue (for immediate staff visibility)
    const newReceptionEntry: Omit<ReceptionPatientEntry, 'id'> = {
      uhid,
      tokenNumber: receiptNo,
      tokenNo: receiptNo,
      receiptNumber: receiptNo,
      patientName: patientName.trim(),
      age: Number(age),
      gender,
      mobile: mobileNumber.replace(/\D/g, ''),
      referringDoctor: doctorOrHospital.trim() || 'Self / Direct',
      tests: selectedTestsList.map((t) => t.name),
      sampleType: selectedTestsList[0]?.sampleType || 'Blood / Serum',
      totalAmount: grandTotal,
      discountINR: 0,
      paidAmount: paymentMethod === 'Online' ? grandTotal : 0,
      dueAmount: paymentMethod === 'Online' ? 0 : grandTotal,
      paymentMode: paymentMethod === 'Online' ? 'UPI' : 'Cash',
      paymentStatus: paymentMethod === 'Online' ? 'Pending' : 'Due',
      status: 'Waiting',
      registeredAt: `Today, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
      bookingSource: 'Website',
      visitType: collectionType === 'Home' ? 'Home Collection' : 'Walk-in',
      address: assembledAddress,
      preferredTimeSlot: collectionType === 'Home' ? preferredTimeSlot : undefined,
      upiTransactionRef: paymentMethod === 'Online' ? utrNumber.trim() : undefined,
      paymentVerificationStatus: paymentStatus,
      paymentScreenshot: screenshotPreview || undefined,
      homeCollectionCharges: homeCollectionCharge,
      areaLocality: areaLocality.trim() || undefined,
      city: city.trim() || undefined,
      pincode: pincode.trim() || undefined,
      selectedTestsBreakdown,
      notes: `Website Hero Booking | Receipt: ${receiptNo} | Method: ${paymentMethod} | Status: ${paymentStatus}${
        utrNumber ? ` | UTR: ${utrNumber}` : ''
      }`,
    };

    addReceptionEntry(newReceptionEntry);

    // 2. If Home Collection, also record into Home Collection Dispatch records
    if (collectionType === 'Home') {
      addHomeCollectionBooking({
        patientName: patientName.trim(),
        mobile: mobileNumber.replace(/\D/g, ''),
        address: assembledAddress,
        timeSlot: preferredTimeSlot,
        packageOrTest: selectedTestsList.map((t) => t.name).join(', '),
        amountINR: grandTotal,
        paymentMode: paymentMethod === 'Online' ? 'UPI Online' : 'Pay on Spot',
      });
    }

    // Set confirmed receipt state
    setCreatedReceipt({
      receiptNo,
      uhid,
      patientName: patientName.trim(),
      age: age.trim(),
      gender,
      mobile: mobileNumber.replace(/\D/g, ''),
      doctor: doctorOrHospital.trim() || 'Direct / Self',
      selectedTests: selectedTestsBreakdown,
      testsTotal,
      homeCollectionFee: homeCollectionCharge,
      grandTotal,
      collectionType,
      fullAddress: fullAddress.trim(),
      areaLocality: areaLocality.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      preferredTimeSlot,
      paymentMethod,
      paymentStatus,
      utrNumber: utrNumber.trim(),
      screenshotPreview,
      bookingDate: nowStr,
    });

    setFormStep(4);
    if (onBookingSuccess) {
      onBookingSuccess();
    }
  };

  // Reset form to book another test
  const handleBookAnother = () => {
    setFormStep(1);
    setPatientName('');
    setAge('');
    setGender('Male');
    setMobileNumber('');
    setDoctorOrHospital('');
    setSelectedTestIds([]);
    setTestSearchTerm('');
    setSelectedCategoryFilter('All');
    setCollectionType('Home');
    setFullAddress('');
    setAreaLocality('');
    setPincode('');
    setPaymentMethod('Online');
    setUtrNumber('');
    setScreenshotPreview('');
    setCreatedReceipt(null);
    setErrorMessage('');
  };

  // WhatsApp Share receipt details
  const handleShareOnWhatsApp = () => {
    if (!createdReceipt) return;
    const testsListFormatted = createdReceipt.selectedTests
      .map((t) => `• ${t.name} – ₹${t.price}`)
      .join('\n');

    const message = `*🧾 LAB TEST BOOKING RECEIPT*\n*Receipt No:* ${createdReceipt.receiptNo}\n*Lab:* ${labMerchantName}\n\n*Patient Details:*\n• Name: ${createdReceipt.patientName}\n• Age/Gender: ${createdReceipt.age} yrs / ${createdReceipt.gender}\n• Mobile: +91 ${createdReceipt.mobile}\n• Ref Doctor: ${createdReceipt.doctor}\n\n*Selected Tests:*\n${testsListFormatted}\n\n*Billing Breakdown:*\n• Tests Total: ₹${createdReceipt.testsTotal}\n• Home Collection: ₹${createdReceipt.homeCollectionFee}\n• *Grand Total: ₹${createdReceipt.grandTotal}*\n\n*Collection Mode:* ${createdReceipt.collectionType === 'Home' ? 'Home Sample Collection' : 'Visit Lab Branch'}${
      createdReceipt.collectionType === 'Home'
        ? `\n• Address: ${createdReceipt.fullAddress}, ${createdReceipt.areaLocality}, ${createdReceipt.city} - ${createdReceipt.pincode}\n• Slot: ${createdReceipt.preferredTimeSlot}`
        : ''
    }\n\n*Payment:* ${createdReceipt.paymentMethod} (${createdReceipt.paymentStatus})${
      createdReceipt.utrNumber ? `\n• UTR/Ref: ${createdReceipt.utrNumber}` : ''
    }\n\n_Thank you for choosing ${labMerchantName}. Certified phlebotomist will contact you shortly._`;

    window.open(`https://wa.me/91${createdReceipt.mobile}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div
      id="hero-test-booking-form"
      className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden relative"
    >
      {/* Form Top Header with 3-Step Wizard Navigation */}
      <div className="bg-gradient-to-r from-[#123B6D] via-[#1a4a85] to-[#0F766E] p-4 text-white">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-white/10 text-amber-300 backdrop-blur-xs">
              <FlaskConical className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight leading-tight">
                Lab Test & Health Booking
              </h2>
              <p className="text-[11px] text-slate-200 font-medium">
                {formStep === 1 && 'Step 1 of 3: Patient & Collection Mode'}
                {formStep === 2 && 'Step 2 of 3: Select Tests & Subtotal'}
                {formStep === 3 && 'Step 3 of 3: Payment & Verification'}
                {formStep === 4 && 'Confirmed Lab Booking Receipt'}
              </p>
            </div>
          </div>

          {/* Amount Badge (Visible in steps 2 and 3 on larger screens, hidden on mobile) */}
          {(formStep === 2 || formStep === 3) && (
            <div className="hidden sm:block bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-lg text-right border border-white/20">
              <span className="text-[9px] uppercase tracking-wider block text-slate-200 font-bold">
                Total Amount
              </span>
              <span className="text-xs font-black text-amber-300">
                ₹{grandTotal}
              </span>
            </div>
          )}
        </div>

        {/* 3 Step Pill Indicator */}
        {formStep <= 3 && (
          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
            {/* Step 1 Pill */}
            <div
              className={`py-1 px-2 rounded-md flex items-center justify-center gap-1 transition ${
                formStep === 1
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : formStep > 1
                  ? 'bg-emerald-500/80 text-white cursor-pointer'
                  : 'bg-white/10 text-white/60'
              }`}
              onClick={() => {
                if (formStep > 1) setFormStep(1);
              }}
            >
              <span>{formStep > 1 ? '✓' : '1.'}</span>
              <span className="truncate">Patient</span>
            </div>

            {/* Step 2 Pill */}
            <div
              className={`py-1 px-2 rounded-md flex items-center justify-center gap-1 transition ${
                formStep === 2
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : formStep > 2
                  ? 'bg-emerald-500/80 text-white cursor-pointer'
                  : 'bg-white/10 text-white/60'
              }`}
              onClick={() => {
                if (formStep > 2) setFormStep(2);
              }}
            >
              <span>{formStep > 2 ? '✓' : '2.'}</span>
              <span className="truncate">Tests ({selectedTestIds.length})</span>
            </div>

            {/* Step 3 Pill */}
            <div
              className={`py-1 px-2 rounded-md flex items-center justify-center gap-1 transition ${
                formStep === 3
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              <span>3.</span>
              <span className="truncate">Payment</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 text-xs px-3 py-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-rose-500 hover:text-rose-800 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 1: PATIENT DETAILS & COLLECTION MODE                */}
      {/* ========================================================= */}
      {formStep === 1 && (
        <form onSubmit={handleProceedToStep2} className="p-4 space-y-3.5 text-xs">
          {/* Patient Details Inputs */}
          <div className="space-y-2.5">
            {/* Patient Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Patient Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  id="hero-patient-name-input"
                />
              </div>
            </div>

            {/* Age & Gender Row */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Age (Years) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="125"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 32"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  id="hero-patient-age-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Male', 'Female', 'Other'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2 text-[11px] font-bold rounded-lg border transition cursor-pointer text-center ${
                        gender === g
                          ? 'bg-[#123B6D] text-white border-[#123B6D]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile & Doctor / Hospital */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  10-Digit Mobile <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[11px] text-slate-500 font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none font-medium"
                    id="hero-patient-mobile-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Doctor / Hospital <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={doctorOrHospital}
                    onChange={(e) => setDoctorOrHospital(e.target.value)}
                    placeholder="e.g. Dr. Verma / Self"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Sample Collection Mode Toggle */}
          <div>
            <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Sample Collection Mode <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              {/* Branch Visit Button (First) */}
              <button
                type="button"
                onClick={() => setCollectionType('Branch')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative ${
                  collectionType === 'Branch'
                    ? 'bg-teal-50/90 border-[#0F766E] text-slate-950 ring-2 ring-[#0F766E]/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>Visit Branch</span>
                  </span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded">
                    ₹0 Fee
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Give sample at lab counter
                </p>
              </button>

              {/* Home Collection Button (Second) */}
              <button
                type="button"
                onClick={() => setCollectionType('Home')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative ${
                  collectionType === 'Home'
                    ? 'bg-amber-50/90 border-amber-400 text-slate-950 ring-2 ring-amber-400/40'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-amber-600" />
                    <span>Home Sample</span>
                  </span>
                  <span className="text-[9px] bg-amber-200 text-amber-950 font-black px-1.5 py-0.5 rounded">
                    +₹{vendorLabSettings.homeCollectionCharge ?? 100}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Phlebotomist arrives at doorstep
                </p>
              </button>
            </div>

            {/* If Home Sample: Compact Address Details */}
            {collectionType === 'Home' && (
              <div className="space-y-2 p-2.5 rounded-xl bg-amber-50/50 border border-amber-200 text-[11px]">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                    Full Address (House/Flat No, Street, Landmark) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="House No, Street, Landmark"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Area / Locality <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={areaLocality}
                      onChange={(e) => setAreaLocality(e.target.value)}
                      placeholder="e.g. Model Town"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Pincode
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="e.g. 141002"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                    Preferred Collection Slot
                  </label>
                  <select
                    value={preferredTimeSlot}
                    onChange={(e) => setPreferredTimeSlot(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white cursor-pointer"
                  >
                    {(vendorLabSettings.bookingTimeSlots && vendorLabSettings.bookingTimeSlots.length > 0
                      ? vendorLabSettings.bookingTimeSlots
                      : [
                          'Tomorrow: 6:30 AM - 8:30 AM (Fasting Preferred)',
                          'Tomorrow: 8:30 AM - 10:30 AM',
                          'Tomorrow: 10:30 AM - 12:30 PM',
                          'Today: Urgent Sample Collection (Within 1 Hour)',
                        ]
                    ).map((slot, sIdx) => (
                      <option key={sIdx} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Button: Proceed to Step 2 */}
          <button
            type="submit"
            className="w-full bg-[#123B6D] hover:bg-[#0c294d] text-white py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
            id="hero-form-step1-next-btn"
          >
            <span>Next: Select Tests & Amount (Step 2)</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </form>
      )}

      {/* ========================================================= */}
      {/* STEP 2: SELECT TESTS (OPEN MULTI-SELECT CHECKMARK LIST)    */}
      {/* ========================================================= */}
      {formStep === 2 && (
        <form onSubmit={handleProceedToStep3} className="p-4 space-y-3 text-xs">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs uppercase tracking-wider">
              <FlaskConical className="w-4 h-4 text-[#0F766E]" />
              <span className="sm:hidden">Select Diagnostic Tests</span>
              <span className="hidden sm:inline">Select Diagnostic Tests (Mark with ✓)</span>
            </div>
            {selectedTestIds.length > 0 && (
              <button
                type="button"
                onClick={clearAllSelectedTests}
                className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={testSearchTerm}
              onChange={(e) => setTestSearchTerm(e.target.value)}
              placeholder="Search by test name, code or organ (e.g. CBC, Thyroid, Sugar, LFT)..."
              className="w-full pl-8 pr-7 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
              id="hero-test-search-input"
            />
            {testSearchTerm && (
              <button
                type="button"
                onClick={() => setTestSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Chips (Desktop only, hidden on mobile) */}
          <div className="hidden sm:flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {testCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  selectedCategoryFilter === cat
                    ? 'bg-[#123B6D] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Open Multi-Select Checkmark / Mark Test List (Scrollable box) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-1">
              {filteredAvailableTests.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="font-semibold text-xs">No matching tests found</p>
                  <p className="text-[10px] text-slate-400">
                    Try searching with another keyword or reset the category filter
                  </p>
                </div>
              ) : (
                filteredAvailableTests.map((t) => {
                  const isSelected = selectedTestIds.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleTestSelection(t.id)}
                      className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                        isSelected
                          ? 'bg-teal-50/90 border-teal-400 shadow-2xs ring-1 ring-teal-400/40'
                          : 'bg-white border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      {/* Left: Checkmark box & Test Name (On mobile: only test name, no code or extra details) */}
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="mt-0.5 shrink-0">
                          {isSelected ? (
                            <div className="w-4 h-4 rounded bg-[#0F766E] text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded border-2 border-slate-300 bg-white" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span>{t.name}</span>
                            {t.code && (
                              <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1 py-0.2 rounded hidden sm:inline">
                                {t.code}
                              </span>
                            )}
                          </div>
                          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                            {t.category && (
                              <span className="text-[#123B6D] font-medium">{t.category}</span>
                            )}
                            {t.sampleType && (
                              <span>• {t.sampleType}</span>
                            )}
                            {t.turnaroundHours && (
                              <span>• Results in {t.turnaroundHours}h</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Price (hidden on mobile) & Multi-Select Tag */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-[#123B6D] hidden sm:block">
                          ₹{t.priceINR}
                        </div>
                        {isSelected && (
                          <span className="text-[9px] bg-teal-100 text-teal-900 font-bold px-1.5 py-0.2 rounded block mt-0.5">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Tests Pills Summary */}
          {selectedTestsList.length > 0 && (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span>Selected Tests ({selectedTestsList.length}):</span>
                <span className="text-[#0F766E] font-bold hidden sm:inline">₹{testsTotal}</span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {selectedTestsList.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 bg-teal-50 border border-teal-200 text-teal-950 px-2 py-0.5 rounded text-[10px] font-semibold"
                  >
                    <span className="truncate max-w-[130px]">{t.name}</span>
                    <span className="font-bold text-[#0F766E] hidden sm:inline">₹{t.priceINR}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTest(t.id);
                      }}
                      className="text-teal-700 hover:text-rose-600 cursor-pointer ml-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Amount Calculation Strip (Hidden on mobile) */}
          <div className="hidden sm:block bg-slate-100 p-2.5 rounded-xl border border-slate-200 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Tests Subtotal:</span>
              <span className="font-semibold text-slate-900">₹{testsTotal}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>
                Home Collection Fee (
                {collectionType === 'Home' ? 'Doorstep' : 'Branch Walk-in'}):
              </span>
              <span className="font-semibold text-slate-900">
                {collectionType === 'Home' ? `+₹${homeCollectionCharge}` : '₹0 (Branch Visit)'}
              </span>
            </div>
            <div className="pt-1 border-t border-slate-200 flex items-center justify-between font-black">
              <span className="text-[#123B6D]">Total Payable Amount:</span>
              <span className="text-sm font-extrabold text-emerald-700">₹{grandTotal}</span>
            </div>
          </div>

          {/* Navigation Buttons: Back to Step 1 & Proceed to Step 3 */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setFormStep(1)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={selectedTestIds.length === 0}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedTestIds.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#123B6D] hover:bg-[#0c294d] text-white'
              }`}
              id="hero-form-step2-next-btn"
            >
              <span>Next: Payment & Confirmation (Step 3)</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* STEP 3: PAYMENT & CONFIRMATION                            */}
      {/* ========================================================= */}
      {formStep === 3 && (
        <form onSubmit={handleConfirmBooking} className="p-4 space-y-3.5 text-xs">
          {/* Bill Overview Header */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                Patient: {patientName} ({gender}, {age}y)
              </span>
              <span className="text-xs font-black text-[#123B6D]">
                {selectedTestsList.length} Test{selectedTestsList.length > 1 ? 's' : ''} •{' '}
                {collectionType === 'Home' ? 'Home Collection' : 'Branch Walk-in'}
              </span>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-500 block">Total Due:</span>
              <span className="text-base font-black text-emerald-700">₹{grandTotal}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Choose Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Pay on Spot (First) */}
              <button
                type="button"
                onClick={() => setPaymentMethod('Spot')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative ${
                  paymentMethod === 'Spot'
                    ? 'bg-amber-50/90 border-amber-500 text-slate-950 ring-2 ring-amber-500/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pay on Spot</span>
                  </span>
                  <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                    Cash / Card
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Pay at lab branch or on sample pickup
                </p>
              </button>

              {/* Pay Online (Second) */}
              <button
                type="button"
                onClick={() => setPaymentMethod('Online')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative ${
                  paymentMethod === 'Online'
                    ? 'bg-sky-50/90 border-[#123B6D] text-slate-950 ring-2 ring-[#123B6D]/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-xs text-[#123B6D] flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-[#123B6D]" />
                    <span>Pay Online (UPI)</span>
                  </span>
                  <span className="text-[9px] bg-sky-200 text-sky-900 font-bold px-1.5 py-0.2 rounded">
                    Instant
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Scan QR with GPay, PhonePe, Paytm
                </p>
              </button>
            </div>
          </div>

          {/* Payment Details Container */}
          {paymentMethod === 'Online' ? (
            <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {/* QR & UPI ID Box */}
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="w-24 h-24 bg-white p-1 rounded-lg border border-slate-300 shrink-0 flex items-center justify-center">
                  <img
                    src={dynamicQrUrl}
                    alt="Lab UPI Payment QR"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Verified Lab Account</span>
                  </div>

                  <div className="font-bold text-slate-900 text-xs truncate">
                    {labMerchantName}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-[11px] text-[#123B6D] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[150px]">
                      {labUpiId}
                    </span>
                    <button
                      type="button"
                      onClick={copyUpiId}
                      className="px-2 py-0.5 rounded bg-[#123B6D] text-white text-[10px] font-bold hover:bg-[#0c294d] transition cursor-pointer shrink-0"
                    >
                      {copiedUpi ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Scan via any UPI App for ₹{grandTotal}
                  </div>
                </div>
              </div>

              {/* UTR Number Input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  12-Digit UPI UTR / Transaction Reference Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  placeholder="e.g. 526371829102"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white"
                  id="hero-utr-number-input"
                />
              </div>

              {/* Screenshot Upload (Optional) */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-slate-500" />
                  <span>Attach Screenshot (Optional)</span>
                </button>

                {screenshotPreview && (
                  <div className="flex items-center gap-1.5">
                    <img
                      src={screenshotPreview}
                      alt="Uploaded proof"
                      className="w-6 h-6 rounded object-cover border border-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setScreenshotPreview('')}
                      className="text-rose-500 hover:text-rose-700 text-[10px] font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Booking will be submitted with status: <strong>Pending Verification</strong></span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#123B6D]" />
                <span>Pay on Spot / Cash or Card</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Zero prepayment needed. You can pay <strong>₹{grandTotal}</strong> in cash, card, or UPI directly at the branch counter or to the phlebotomist during home pickup.
              </p>
              <div className="text-[10px] text-slate-500 bg-slate-100 p-1.5 rounded border border-slate-200">
                Queue status: <strong>Pay on Spot / Unpaid</strong>
              </div>
            </div>
          )}

          {/* Navigation Buttons: Back to Step 2 & Confirm Booking */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setFormStep(2)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              id="hero-form-confirm-booking-btn"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>
                {paymentMethod === 'Online'
                  ? `Confirm Booking (Paid ₹${grandTotal} Online)`
                  : `Confirm Booking (Pay ₹${grandTotal} on Spot)`}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* STEP 4: CONFIRMED BOOKING & PRINTABLE RECEIPT            */}
      {/* ========================================================= */}
      {formStep === 4 && createdReceipt && (
        <div className="p-4 space-y-3 text-xs">
          {/* Success Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center space-y-1">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-1">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Lab Appointment Confirmed!
            </h3>
            <p className="text-slate-600 text-[11px]">
              Appointment registered into the live lab reception queue.
            </p>
          </div>

          {/* Official Printable Receipt Card */}
          <div
            id="lab-booking-receipt-card"
            className="bg-white rounded-xl border-2 border-slate-300 p-3.5 shadow-xs space-y-2.5 text-slate-800 font-sans"
          >
            {/* Receipt Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 gap-2">
              <div>
                <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                  Official Booking Receipt
                </div>
                <div className="text-sm font-black text-[#123B6D] flex items-center gap-1 font-mono">
                  <span>{createdReceipt.receiptNo}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  UHID: {createdReceipt.uhid} • {createdReceipt.bookingDate}
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    createdReceipt.paymentStatus === 'Pending Verification'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}
                >
                  {createdReceipt.paymentStatus}
                </span>
              </div>
            </div>

            {/* Patient Info Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 block">Patient:</span>
                <strong className="text-slate-900">{createdReceipt.patientName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Age / Gender:</span>
                <strong className="text-slate-900">
                  {createdReceipt.age} yrs / {createdReceipt.gender}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Mobile:</span>
                <strong className="text-slate-900">+91 {createdReceipt.mobile}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Ref Doctor:</span>
                <strong className="text-slate-900 truncate block">{createdReceipt.doctor}</strong>
              </div>
            </div>

            {/* Selected Tests List */}
            <div>
              <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Selected Tests ({createdReceipt.selectedTests.length}):
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-100 text-slate-600 text-[10px] font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="px-2.5 py-1">Test Name</th>
                      <th className="px-2.5 py-1 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {createdReceipt.selectedTests.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-2.5 py-1 font-medium text-slate-800">{t.name}</td>
                        <td className="px-2.5 py-1 text-right font-bold text-slate-900">
                          ₹{t.price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Tests Total:</span>
                <span className="font-bold text-slate-900">₹{createdReceipt.testsTotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>
                  Home Collection (
                  {createdReceipt.collectionType === 'Home' ? 'Doorstep' : 'Branch'}):
                </span>
                <span className="font-bold text-slate-900">
                  ₹{createdReceipt.homeCollectionFee}
                </span>
              </div>
              <div className="pt-1 border-t border-slate-200 flex justify-between text-xs font-black">
                <span className="text-[#123B6D]">Grand Total:</span>
                <span className="text-emerald-700 font-extrabold">
                  ₹{createdReceipt.grandTotal}
                </span>
              </div>
            </div>

            {/* Collection & Payment Details */}
            <div className="space-y-1 text-[11px]">
              <div className="flex items-start gap-1">
                <span className="text-slate-500 shrink-0 font-medium">Mode:</span>
                <span className="font-bold text-slate-900">
                  {createdReceipt.collectionType === 'Home'
                    ? 'Home Sample Collection'
                    : 'Visit Lab Branch'}
                </span>
              </div>

              {createdReceipt.collectionType === 'Home' && (
                <div className="text-slate-700 bg-amber-50/70 p-1.5 rounded border border-amber-200 text-[10px]">
                  <span className="font-bold">Address: </span>
                  <span>
                    {createdReceipt.fullAddress}, {createdReceipt.areaLocality},{' '}
                    {createdReceipt.city}
                    {createdReceipt.pincode ? ` - ${createdReceipt.pincode}` : ''}
                  </span>
                  {createdReceipt.preferredTimeSlot && (
                    <div className="text-amber-900 font-semibold mt-0.5">
                      Slot: {createdReceipt.preferredTimeSlot}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-medium">Payment:</span>
                <span className="font-bold text-slate-900">{createdReceipt.paymentMethod}</span>
                {createdReceipt.utrNumber && (
                  <span className="text-slate-500 font-mono text-[10px]">
                    (UTR: {createdReceipt.utrNumber})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              {/* WhatsApp Share */}
              <button
                type="button"
                onClick={handleShareOnWhatsApp}
                className="bg-[#25D366] hover:bg-[#20bd5a] text-white py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Receipt</span>
              </button>

              {/* Print Receipt */}
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print Receipt</span>
              </button>
            </div>

            {/* Book Another Test Button */}
            <button
              type="button"
              onClick={handleBookAnother}
              className="w-full bg-[#123B6D] hover:bg-[#0c294d] text-white py-2 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Book Another Test / Patient
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
