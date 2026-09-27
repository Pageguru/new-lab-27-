import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Printer,
  MessageSquare,
  CheckCircle2,
  Clock,
  FlaskConical,
  IndianRupee,
  Phone,
  QrCode,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Settings,
  Globe,
  Home,
  Building2,
  MapPin,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  FileText,
  UserCheck,
  RefreshCw,
  Share2,
  Sparkles,
  Eye,
  Send,
  Lock,
  CreditCard,
  Undo2,
  Save,
  LogOut,
  Download,
  Calculator,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { DashboardFooter } from './DashboardFooter';
import { AppView, ReceptionPatientEntry } from '../types';
import { EditReceptionEntryModal } from './EditReceptionEntryModal';
import { CollectRemainingPaymentModal } from './CollectRemainingPaymentModal';
import { DayEndCashClosingModal } from './reception/DayEndCashClosingModal';
import { generateThermalReceiptPdf, buildReceiptInvoicePdf, getReceiptPdfFilename } from '../utils/pdfGenerator';
import { safePrint } from '../utils/printHelper';

interface ReceptionEntryDashboardProps {
  onNavigateView: (view: AppView) => void;
  onOpenReportPortal?: (reportId?: string, mobile?: string) => void;
}

export const ReceptionEntryDashboard: React.FC<ReceptionEntryDashboardProps> = ({
  onNavigateView,
  onOpenReportPortal,
}) => {
  const {
    currentUser,
    logout,
    vendorLabSettings,
    vendorTests,
    vendorDoctors,
    receptionEntries,
    addReceptionEntry,
    updateReceptionStatus,
    updateReceptionEntry,
    deleteReceptionEntry,
    sendEntryToTechnician,
    publishReport,
    unpublishReport,
    activeBranchId,
    setActiveBranchId,
  } = useCms();

  const labName = vendorLabSettings?.labName || 'Apex Diagnostic & Clinical Pathology Laboratory';
  const labNabl = vendorLabSettings?.nablAccreditationNo || 'MC-4821';
  const labPhone = vendorLabSettings?.phone || '7087033009';
  const labAddress = vendorLabSettings?.address || 'SCF 42-43, Sector 18-C, Central Healthcare Complex, Ludhiana';
  const labLogoUrl = vendorLabSettings?.logoUrl || '';

  // --- FORM STATE ---
  // In-form Editing Mode (allows editing any patient directly without re-typing)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  // Day-End Reception Cash Closing & Daily Tally Sheet Modal State
  const [isCashClosingOpen, setIsCashClosingOpen] = useState(false);

  // Snapshot of last filled data before submit or clear (so user can 1-click restore if they made a mistake)
  const [lastFormSnapshot, setLastFormSnapshot] = useState<{
    patientName: string;
    age: string;
    gender: 'Male' | 'Female' | 'Other';
    mobile: string;
    referringDoctor: string;
    selectedTests: string[];
    sampleType: string;
    hasDiscount: boolean;
    discountINR: number;
    paymentChoice: 'Full Payment' | 'Advance' | 'Due';
    advancePercent: number;
    customPaidAmount: string;
    paymentMode: 'Cash' | 'UPI' | 'Card';
    notes: string;
  } | null>(() => {
    try {
      const saved = sessionStorage.getItem('reception_last_snapshot');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Recently registered entry tracking for quick correction banner
  const [lastRegisteredEntry, setLastRegisteredEntry] = useState<ReceptionPatientEntry | null>(null);
  const [showRecentlyRegisteredBanner, setShowRecentlyRegisteredBanner] = useState<boolean>(false);

  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('32');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [mobile, setMobile] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('Dr. S. K. Gupta (MD Med)');
  const [selectedTests, setSelectedTests] = useState<string[]>(['Complete Blood Count (CBC)']);
  const [sampleType, setSampleType] = useState('EDTA Whole Blood (Lavender Tube)');

  // Optional Discount with Checkbox
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountINR, setDiscountINR] = useState<number>(0);

  // Payment Options: 'Full Payment' | 'Advance' | 'Due'
  const [paymentChoice, setPaymentChoice] = useState<'Full Payment' | 'Advance' | 'Due'>('Full Payment');
  const [advancePercent, setAdvancePercent] = useState<number>(50);
  const [customPaidAmount, setCustomPaidAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('UPI');
  const [notes, setNotes] = useState('');
  const [testSearch, setTestSearch] = useState('');

  // Load unsaved active draft from localStorage on initial render
  useEffect(() => {
    try {
      const draft = localStorage.getItem('reception_form_active_draft');
      if (draft) {
        const p = JSON.parse(draft);
        if (p.patientName || p.mobile) {
          setPatientName(p.patientName || '');
          if (p.age) setAge(p.age);
          if (p.gender) setGender(p.gender);
          if (p.mobile) setMobile(p.mobile);
          if (p.referringDoctor) setReferringDoctor(p.referringDoctor);
          if (p.selectedTests && p.selectedTests.length > 0) setSelectedTests(p.selectedTests);
          if (p.sampleType) setSampleType(p.sampleType);
          if (p.hasDiscount !== undefined) setHasDiscount(p.hasDiscount);
          if (p.discountINR) setDiscountINR(p.discountINR);
          if (p.paymentChoice) setPaymentChoice(p.paymentChoice);
          if (p.advancePercent) setAdvancePercent(p.advancePercent);
          if (p.customPaidAmount) setCustomPaidAmount(p.customPaidAmount);
          if (p.paymentMode) setPaymentMode(p.paymentMode);
          if (p.notes) setNotes(p.notes);
        }
      }
    } catch {}
  }, []);

  // Auto-save form draft so refreshing or navigating doesn't wipe typed content
  useEffect(() => {
    if (!editingEntryId) {
      if (patientName || mobile || notes || selectedTests.length > 1 || discountINR > 0) {
        try {
          localStorage.setItem(
            'reception_form_active_draft',
            JSON.stringify({
              patientName,
              age,
              gender,
              mobile,
              referringDoctor,
              selectedTests,
              sampleType,
              hasDiscount,
              discountINR,
              paymentChoice,
              advancePercent,
              customPaidAmount,
              paymentMode,
              notes,
            })
          );
        } catch {}
      }
    }
  }, [
    patientName,
    age,
    gender,
    mobile,
    referringDoctor,
    selectedTests,
    sampleType,
    hasDiscount,
    discountINR,
    paymentChoice,
    advancePercent,
    customPaidAmount,
    paymentMode,
    notes,
    editingEntryId,
  ]);

  // Queue search: Token Number & Mobile Number
  const [searchToken, setSearchToken] = useState('');
  const [searchMobile, setSearchMobile] = useState('');

  // Independent Filters: Date Filter & Payment Filter
  const [dateFilter, setDateFilter] = useState<'All Dates' | 'Today' | 'Yesterday' | 'Custom Date'>('All Dates');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Advance' | 'Due' | 'Full Payment'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Waiting' | 'Sample Collected' | 'In Lab' | 'Report Ready' | 'Publish Pending'>('All');

  // Thermal Slip Modal
  const [selectedReceipt, setSelectedReceipt] = useState<ReceptionPatientEntry | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Edit Patient Entry Modal
  const [editingEntry, setEditingEntry] = useState<ReceptionPatientEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Collect Remaining Payment Modal
  const [collectingPaymentEntry, setCollectingPaymentEntry] = useState<ReceptionPatientEntry | null>(null);
  const [isCollectPaymentOpen, setIsCollectPaymentOpen] = useState(false);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<ReceptionPatientEntry | null>(null);

  // Success Toast
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Entries returned by Technician requiring Reception attention
  const returnedByTechnicianEntries = useMemo(() => {
    return receptionEntries.filter((r) => r.returnedByTechnician);
  }, [receptionEntries]);

  // Popular Quick-Click Tests
  const quickTestPills = [
    { name: 'Complete Blood Count (CBC)', price: 350, sample: 'EDTA Blood' },
    { name: 'Fasting Blood Sugar (FBS)', price: 120, sample: 'Fluoride Plasma' },
    { name: 'Kidney Function Test (KFT)', price: 600, sample: 'Serum Clot' },
    { name: 'Liver Function Test (LFT)', price: 650, sample: 'Serum Clot' },
    { name: 'Lipid Profile', price: 550, sample: 'Serum Clot' },
    { name: 'Thyroid Profile (Total)', price: 450, sample: 'Serum Clot' },
    { name: 'Full Body Health Checkup', price: 999, sample: 'EDTA + Serum + Urine' },
    { name: 'Urine Routine & Microscopic', price: 150, sample: 'Sterile Urine' },
    { name: 'HbA1c (Glycosylated Hb)', price: 450, sample: 'EDTA Whole Blood' },
    { name: 'Dengue Serology (NS1 + Platelets)', price: 800, sample: 'Serum + EDTA' },
  ];

  // Unified searchable tests list combining quick pills + vendor tests
  const allAvailableTests = useMemo(() => {
    const list: { name: string; price: number; sample?: string; category?: string }[] = [];
    const seen = new Set<string>();

    // 1. Add quick pills first
    quickTestPills.forEach((p) => {
      seen.add(p.name.toLowerCase());
      list.push({
        name: p.name,
        price: p.price,
        sample: p.sample,
        category: 'Popular',
      });
    });

    // 2. Add vendor catalog tests
    vendorTests.forEach((t) => {
      if (!seen.has(t.name.toLowerCase())) {
        seen.add(t.name.toLowerCase());
        list.push({
          name: t.name,
          price: t.priceINR,
          sample: t.sampleType,
          category: t.category || 'Diagnostic',
        });
      }
    });

    return list;
  }, [vendorTests]);

  // Filter tests by search query
  const filteredAvailableTests = useMemo(() => {
    if (!testSearch.trim()) return allAvailableTests;
    const q = testSearch.toLowerCase().trim();
    return allAvailableTests.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.sample && t.sample.toLowerCase().includes(q))
    );
  }, [allAvailableTests, testSearch]);

  // Calculate gross test amount
  const grossAmount = useMemo(() => {
    return selectedTests.reduce((acc, testName) => {
      // Look in quick pills
      const pill = quickTestPills.find((p) => p.name === testName);
      if (pill) return acc + pill.price;
      // Look in vendor tests
      const vTest = vendorTests.find((t) => t.name === testName);
      if (vTest) return acc + vTest.priceINR;
      return acc + 300; // default fallback
    }, 0);
  }, [selectedTests, vendorTests]);

  const effectiveDiscount = hasDiscount ? (discountINR || 0) : 0;
  const netPayable = Math.max(0, grossAmount - effectiveDiscount);

  // Calculate actual paid amount based on payment choice & manual inputs
  const paidAmount = useMemo(() => {
    if (paymentChoice === 'Full Payment') {
      return netPayable;
    }
    if (paymentChoice === 'Due') {
      return 0;
    }
    // Advance %
    if (customPaidAmount !== '') {
      const parsed = Number(customPaidAmount);
      if (!isNaN(parsed)) {
        return Math.min(netPayable, Math.max(0, parsed));
      }
    }
    return Math.min(netPayable, Math.max(0, Math.round((netPayable * advancePercent) / 100)));
  }, [paymentChoice, netPayable, customPaidAmount, advancePercent]);

  const dueAmount = Math.max(0, netPayable - paidAmount);

  // Auto-fill existing patient detection
  const existingPatientMatch = useMemo(() => {
    if (mobile.length >= 10) {
      return receptionEntries.find((e) => e.mobile.includes(mobile.slice(-10)));
    }
    return null;
  }, [mobile, receptionEntries]);

  // Handle Quick Add or Remove Test
  const handleToggleTest = (testName: string, suggestedSample?: string) => {
    if (selectedTests.includes(testName)) {
      setSelectedTests((prev) => prev.filter((t) => t !== testName));
    } else {
      setSelectedTests((prev) => [...prev, testName]);
      if (suggestedSample && sampleType === 'EDTA Whole Blood (Lavender Tube)') {
        setSampleType(suggestedSample);
      }
    }
  };

  // Save current form inputs before reset/submit so user never loses their typed data
  const saveCurrentAsSnapshot = () => {
    if (patientName.trim() || mobile.trim() || selectedTests.length > 1) {
      const snapshot = {
        patientName,
        age,
        gender,
        mobile,
        referringDoctor,
        selectedTests,
        sampleType,
        hasDiscount,
        discountINR,
        paymentChoice,
        advancePercent,
        customPaidAmount,
        paymentMode,
        notes,
      };
      setLastFormSnapshot(snapshot);
      try {
        sessionStorage.setItem('reception_last_snapshot', JSON.stringify(snapshot));
      } catch {}
    }
  };

  // Restore last form data with 1 click so user doesn't have to refill entire form
  const handleRestoreLastData = () => {
    if (!lastFormSnapshot) {
      showToast('⚠️ No previous patient data available to restore.');
      return;
    }
    setPatientName(lastFormSnapshot.patientName);
    setAge(lastFormSnapshot.age);
    setGender(lastFormSnapshot.gender);
    setMobile(lastFormSnapshot.mobile);
    setReferringDoctor(lastFormSnapshot.referringDoctor);
    setSelectedTests(lastFormSnapshot.selectedTests);
    setSampleType(lastFormSnapshot.sampleType);
    setHasDiscount(lastFormSnapshot.hasDiscount);
    setDiscountINR(lastFormSnapshot.discountINR);
    setPaymentChoice(lastFormSnapshot.paymentChoice);
    setAdvancePercent(lastFormSnapshot.advancePercent);
    setCustomPaidAmount(lastFormSnapshot.customPaidAmount);
    setPaymentMode(lastFormSnapshot.paymentMode);
    setNotes(lastFormSnapshot.notes);
    showToast('↺ Data restored! Change only what was incorrect without refilling the whole form.');
  };

  // Load an existing entry directly into the main form for in-place correction
  const handleLoadEntryToForm = (entry: ReceptionPatientEntry) => {
    const isLocked = Boolean(
      entry.sentToTechnician ||
      entry.technicianStatus === 'Sent to Lab' ||
      entry.technicianStatus === 'Accepted' ||
      entry.technicianStatus === 'Report Generated' ||
      entry.status === 'In Lab' ||
      entry.status === 'Report Ready' ||
      entry.reportId
    );
    if (isLocked) {
      showToast('🔒 Yeh entry lab bheji ja chuki hai ya report ready hai, isliye edit nahi ki ja sakti.');
      return;
    }
    saveCurrentAsSnapshot();
    setEditingEntryId(entry.id);
    setPatientName(entry.patientName);
    setAge(String(entry.age));
    setGender(entry.gender);
    setMobile(entry.mobile);
    setReferringDoctor(entry.referringDoctor);
    setSelectedTests(entry.tests && entry.tests.length > 0 ? entry.tests : ['Complete Blood Count (CBC)']);
    setSampleType(entry.sampleType || 'EDTA Whole Blood (Lavender Tube)');
    
    const hasDisc = (entry.discountINR || 0) > 0;
    setHasDiscount(hasDisc);
    setDiscountINR(entry.discountINR || 0);

    if (entry.dueAmount === 0 || entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid') {
      setPaymentChoice('Full Payment');
      setCustomPaidAmount('');
    } else if (entry.paidAmount === 0 || entry.paymentStatus === 'Pending' || entry.paymentStatus === 'Due' || entry.paymentStatus === 'Due Payment') {
      setPaymentChoice('Due');
      setCustomPaidAmount('0');
    } else {
      setPaymentChoice('Advance');
      setCustomPaidAmount(String(entry.paidAmount));
    }

    setPaymentMode(entry.paymentMode || 'UPI');
    setNotes(entry.notes || '');

    // Scroll smoothly to the form container
    const formElement = document.getElementById('reception-patient-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showToast(`✏️ Token ${entry.tokenNumber} (${entry.patientName}) loaded into form. Fix whatever was wrong!`);
  };

  // Cancel edit mode and return to fresh entry
  const handleCancelEdit = () => {
    setEditingEntryId(null);
    handleResetForm();
    showToast('Cancelled editing. Ready for new patient entry.');
  };

  // Save corrections for an existing entry without re-typing from scratch
  const handleSaveCorrections = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntryId) return;
    if (!patientName.trim()) {
      showToast('⚠️ Please enter patient name!');
      return;
    }
    if (selectedTests.length === 0) {
      showToast('⚠️ Please select at least one test!');
      return;
    }

    const calculatedPaymentStatus: ReceptionPatientEntry['paymentStatus'] =
      dueAmount === 0 ? 'Full Payment' : paidAmount === 0 ? 'Due' : 'Advance';

    const updates: Partial<ReceptionPatientEntry> = {
      patientName: patientName.trim(),
      age: age || '30',
      gender,
      mobile: mobile || '9876500000',
      referringDoctor,
      tests: selectedTests,
      sampleType,
      totalAmount: grossAmount,
      discountINR: effectiveDiscount,
      paidAmount,
      dueAmount,
      paymentMode,
      paymentStatus: calculatedPaymentStatus,
      notes: notes.trim() || undefined,
    };

    updateReceptionEntry(editingEntryId, updates);

    const target = receptionEntries.find((e) => e.id === editingEntryId);
    if (target) {
      const merged: ReceptionPatientEntry = { ...target, ...updates };
      setLastRegisteredEntry(merged);
      setShowRecentlyRegisteredBanner(true);
      setSelectedReceipt(merged);
    }

    showToast(`✅ Galti theek kar di gayi hai! Token updated successfully.`);
    setEditingEntryId(null);
    handleResetForm();
  };

  // Handle Form Submit
  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      showToast('⚠️ Please enter patient name!');
      return;
    }
    if (selectedTests.length === 0) {
      showToast('⚠️ Please select at least one test!');
      return;
    }

    const nextTokenNum = `TK-${100 + receptionEntries.length + 1}`;
    const nextUHID = `LAB-2026-${9040 + receptionEntries.length + 1}`;

    const calculatedPaymentStatus: ReceptionPatientEntry['paymentStatus'] =
      dueAmount === 0 ? 'Full Payment' : paidAmount === 0 ? 'Due' : 'Advance';

    const newEntry: Omit<ReceptionPatientEntry, 'id'> = {
      uhid: nextUHID,
      tokenNumber: nextTokenNum,
      patientName: patientName.trim(),
      age: age || '30',
      gender,
      mobile: mobile || '9876500000',
      referringDoctor,
      tests: selectedTests,
      sampleType,
      totalAmount: grossAmount,
      discountINR: effectiveDiscount,
      paidAmount,
      dueAmount,
      paymentMode,
      paymentStatus: calculatedPaymentStatus,
      status: 'Waiting',
      registeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      entryDate: new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
    };

    const saved = addReceptionEntry(newEntry);
    showToast(`✅ Patient Registered! Token: ${saved.tokenNumber} (${saved.patientName})`);

    // Track recently registered entry for quick 1-click mistake correction
    setLastRegisteredEntry(saved);
    setShowRecentlyRegisteredBanner(true);

    // Open thermal slip automatically for instant print
    setSelectedReceipt(saved);
    setIsReceiptModalOpen(true);

    // Reset Form for next patient
    handleResetForm();
  };

  // Register and Immediately Send to Lab Technician
  const handleRegisterAndSendToLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      showToast('⚠️ Please enter patient name!');
      return;
    }
    if (selectedTests.length === 0) {
      showToast('⚠️ Please select at least one test!');
      return;
    }

    const nextTokenNum = `TK-${100 + receptionEntries.length + 1}`;
    const nextUHID = `LAB-2026-${9040 + receptionEntries.length + 1}`;
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const calculatedPaymentStatus: ReceptionPatientEntry['paymentStatus'] =
      dueAmount === 0 ? 'Full Payment' : paidAmount === 0 ? 'Due' : 'Advance';

    const newEntry: Omit<ReceptionPatientEntry, 'id'> = {
      uhid: nextUHID,
      tokenNumber: nextTokenNum,
      patientName: patientName.trim(),
      age: age || '30',
      gender,
      mobile: mobile || '9876500000',
      referringDoctor,
      tests: selectedTests,
      sampleType,
      totalAmount: grossAmount,
      discountINR: effectiveDiscount,
      paidAmount,
      dueAmount,
      paymentMode,
      paymentStatus: calculatedPaymentStatus,
      status: 'In Lab',
      sentToTechnician: true,
      technicianStatus: 'Sent to Lab',
      sentToLabAt: `Today, ${nowTime}`,
      registeredAt: nowTime,
      entryDate: new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
    };

    const saved = addReceptionEntry(newEntry);
    showToast(`🚀 Registered & sent to Lab Technician! Token: ${saved.tokenNumber}`);

    setLastRegisteredEntry(saved);
    setShowRecentlyRegisteredBanner(true);

    setSelectedReceipt(saved);
    setIsReceiptModalOpen(true);
    handleResetForm();
  };

  // Remaining Balance Collection Handler
  const handleOpenCollectPayment = (entry: ReceptionPatientEntry) => {
    setCollectingPaymentEntry(entry);
    setIsCollectPaymentOpen(true);
  };

  const handleCollectPayment = (
    entryId: string,
    collectedAmount: number,
    mode: 'Cash' | 'UPI' | 'Card',
    note?: string
  ) => {
    const entry = receptionEntries.find((e) => e.id === entryId);
    if (!entry) return;

    const netPayable = Math.max(0, entry.totalAmount - (entry.discountINR || 0));
    const newPaidAmount = Math.min(netPayable, entry.paidAmount + collectedAmount);
    const newDueAmount = Math.max(0, netPayable - newPaidAmount);
    const newPaymentStatus: ReceptionPatientEntry['paymentStatus'] =
      newDueAmount === 0 ? 'Full Payment' : 'Advance';

    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const updated: ReceptionPatientEntry = {
      ...entry,
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      paymentStatus: newPaymentStatus,
      paymentMode: mode,
      balancePaidAmount: (entry.balancePaidAmount || 0) + collectedAmount,
      balancePaymentMode: mode,
      balancePaidAt: `Today, ${nowTime}`,
      // If full payment is now cleared and report is ready, auto-publish complete report to patient portal
      isReportPublished:
        newDueAmount === 0 && (entry.status === 'Report Ready' || entry.technicianStatus === 'Report Generated' || Boolean(entry.reportId))
          ? true
          : entry.isReportPublished,
      publishedAt:
        newDueAmount === 0 && (entry.status === 'Report Ready' || entry.technicianStatus === 'Report Generated' || Boolean(entry.reportId))
          ? `Today, ${nowTime}`
          : entry.publishedAt,
      publishedBy:
        newDueAmount === 0 && (entry.status === 'Report Ready' || entry.technicianStatus === 'Report Generated' || Boolean(entry.reportId))
          ? currentUser?.name || 'Reception Desk'
          : entry.publishedBy,
      notes: note
        ? entry.notes
          ? `${entry.notes} • [Paid ₹${collectedAmount} via ${mode}: ${note}]`
          : `[Paid ₹${collectedAmount} via ${mode}: ${note}]`
        : entry.notes,
    };

    updateReceptionEntry(entryId, updated);
    if (newDueAmount === 0 && (entry.status === 'Report Ready' || entry.technicianStatus === 'Report Generated' || Boolean(entry.reportId))) {
      showToast(`✅ Payment Cleared (₹0 Due) & Report Published! Patient can now view/download complete report.`);
    } else {
      showToast(`✅ Collected ₹${collectedAmount} for ${entry.tokenNumber}! Status: ${newPaymentStatus}`);
    }

    setSelectedReceipt(updated);
    setIsReceiptModalOpen(true);
  };

  // Edit Patient Handlers
  const handleOpenEdit = (entry: ReceptionPatientEntry) => {
    const isReportReady = Boolean(
      entry.status === 'Report Ready' ||
      entry.technicianStatus === 'Report Generated' ||
      entry.reportId
    );
    const isSentToLab = Boolean(
      entry.sentToTechnician ||
      entry.technicianStatus === 'Sent to Lab' ||
      entry.technicianStatus === 'Accepted' ||
      entry.status === 'In Lab'
    );

    if (isReportReady) {
      showToast('🔒 Report ready hone ke baad entry edit nahi ki ja sakti.');
      return;
    }
    if (isSentToLab) {
      showToast('🔒 "Send to Lab" hone ke baad entry edit nahi ki ja sakti.');
      return;
    }
    setEditingEntry(entry);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updated: ReceptionPatientEntry) => {
    updateReceptionEntry(updated.id, updated);
    setLastRegisteredEntry(updated);
    showToast(`✅ Patient entry updated: ${updated.tokenNumber} (${updated.patientName})`);
  };

  const handleSaveAndSendToLab = (updated: ReceptionPatientEntry) => {
    updateReceptionEntry(updated.id, updated);
    sendEntryToTechnician(updated.id);
    setLastRegisteredEntry(updated);
    showToast(`🚀 Updated & dispatched ${updated.tokenNumber} to Lab Technician!`);
  };

  // Lab Technician Pipeline Actions
  const handleSendToLab = (entry: ReceptionPatientEntry) => {
    if (
      entry.sentToTechnician ||
      entry.technicianStatus === 'Sent to Lab' ||
      entry.technicianStatus === 'Accepted' ||
      entry.technicianStatus === 'Report Generated' ||
      entry.status === 'In Lab' ||
      entry.status === 'Report Ready'
    ) {
      showToast(`⚠️ Token ${entry.tokenNumber} is already sent to the lab!`);
      return;
    }
    sendEntryToTechnician(entry.id);
    showToast(`🧪 Token ${entry.tokenNumber} (${entry.patientName}) sent to Lab Technician!`);
  };

  const handleResetForm = () => {
    saveCurrentAsSnapshot();
    setEditingEntryId(null);
    setPatientName('');
    setAge('30');
    setGender('Male');
    setMobile('');
    setSelectedTests(['Complete Blood Count (CBC)']);
    setHasDiscount(false);
    setDiscountINR(0);
    setPaymentChoice('Full Payment');
    setAdvancePercent(50);
    setCustomPaidAmount('');
    setNotes('');
    try {
      localStorage.removeItem('reception_form_active_draft');
    } catch {}
  };

  const handleApplyExistingPatient = () => {
    if (existingPatientMatch) {
      setPatientName(existingPatientMatch.patientName);
      setAge(String(existingPatientMatch.age));
      setGender(existingPatientMatch.gender);
      setReferringDoctor(existingPatientMatch.referringDoctor);
      showToast(`✨ Auto-filled data for ${existingPatientMatch.patientName}`);
    }
  };

  // Payment status counts
  const fullPaymentCount = receptionEntries.filter(
    (e) => e.dueAmount === 0 || e.paymentStatus === 'Full Payment' || e.paymentStatus === 'Paid'
  ).length;
  const advancePaymentCount = receptionEntries.filter(
    (e) => (e.dueAmount > 0 && e.paidAmount > 0) || e.paymentStatus === 'Advance' || e.paymentStatus === 'Partial'
  ).length;
  const pendingPaymentCount = receptionEntries.filter(
    (e) => e.paidAmount === 0 || e.paymentStatus === 'Pending' || e.paymentStatus === 'Due' || e.paymentStatus === 'Due Payment'
  ).length;
  const websiteBookingCount = receptionEntries.filter(
    (e) => e.bookingSource === 'Website' || e.notes?.toLowerCase().includes('website')
  ).length;

  // Filtered Queue with Independent Date Filter & Payment Filter & Dual Inline Search (Token / Mobile)
  const todayDateStr = new Date().toISOString().split('T')[0];
  const yesterdayDateObj = new Date();
  yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
  const yesterdayDateStr = yesterdayDateObj.toISOString().split('T')[0];

  const filteredQueue = receptionEntries.filter((item) => {
    // 1. Search by Token Number or Mobile Number (Inline Row)
    const qToken = searchToken.trim().toLowerCase();
    if (qToken) {
      const matchToken =
        (item.tokenNumber && item.tokenNumber.toLowerCase().includes(qToken)) ||
        (item.tokenNo && item.tokenNo.toLowerCase().includes(qToken));
      if (!matchToken) return false;
    }

    const qMobile = searchMobile.trim().replace(/\D/g, '');
    if (qMobile) {
      const itemMobileDigits = (item.mobile || '').replace(/\D/g, '');
      if (!itemMobileDigits.includes(qMobile)) return false;
    }

    // 2. Date Filter (Independent)
    // Options: 'All Dates' | 'Today' | 'Yesterday' | 'Custom Date'
    if (dateFilter !== 'All Dates') {
      const entryDate = item.entryDate || (() => {
        if (item.id === 'rcp-103' || item.id === 'rcp-104') {
          return yesterdayDateStr;
        }
        if (item.id?.startsWith('rcp-')) {
          const ts = Number(item.id.replace('rcp-', ''));
          if (!isNaN(ts) && ts > 1600000000000) {
            return new Date(ts).toISOString().split('T')[0];
          }
        }
        return todayDateStr;
      })();

      if (dateFilter === 'Today' && entryDate !== todayDateStr) {
        return false;
      }
      if (dateFilter === 'Yesterday' && entryDate !== yesterdayDateStr) {
        return false;
      }
      if (dateFilter === 'Custom Date' && entryDate !== customDate) {
        return false;
      }
    }

    // 3. Payment Filter (Independent)
    // Options: 'All' | 'Advance' | 'Due' | 'Full Payment'
    const paymentStatusType: 'Full Payment' | 'Advance' | 'Due' =
      item.dueAmount === 0 || item.paymentStatus === 'Full Payment' || item.paymentStatus === 'Paid'
        ? 'Full Payment'
        : (item.paidAmount > 0 && item.dueAmount > 0) || item.paymentStatus === 'Advance' || item.paymentStatus === 'Partial'
        ? 'Advance'
        : 'Due';

    if (paymentFilter !== 'All') {
      if (paymentFilter === 'Full Payment' && paymentStatusType !== 'Full Payment') return false;
      if (paymentFilter === 'Advance' && paymentStatusType !== 'Advance') return false;
      if (paymentFilter === 'Due' && paymentStatusType !== 'Due') return false;
    }

    // 4. Status Filter (Workflow tabs)
    const isReady = item.status === 'Report Ready' || item.technicianStatus === 'Report Generated' || Boolean(item.reportId);
    if (statusFilter !== 'All') {
      if (statusFilter === 'Publish Pending' && (!isReady || item.isReportPublished)) return false;
      if (statusFilter === 'Report Ready' && !isReady) return false;
      if (statusFilter !== 'Publish Pending' && statusFilter !== 'Report Ready' && item.status !== statusFilter) return false;
    }

    return true;
  });

  // Today's Counter Stats
  const totalPatientsToday = receptionEntries.length;
  const totalNetBilled = receptionEntries.reduce((acc, e) => acc + Math.max(0, e.totalAmount - (e.discountINR || 0)), 0);
  const totalCashCollected = receptionEntries.reduce((acc, e) => acc + (e.paymentMode === 'Cash' ? e.paidAmount : 0), 0);
  const totalUpiCollected = receptionEntries.reduce((acc, e) => acc + (e.paymentMode === 'UPI' ? e.paidAmount : 0), 0);
  const totalTotalCollection = receptionEntries.reduce((acc, e) => acc + e.paidAmount, 0);
  const totalDuePending = receptionEntries.reduce((acc, e) => acc + e.dueAmount, 0);
  const patientsWithDueCount = receptionEntries.filter((e) => e.dueAmount > 0).length;
  const waitingSamplesCount = receptionEntries.filter((e) => e.status === 'Waiting').length;
  const reportsReadyCount = receptionEntries.filter((e) => e.status === 'Report Ready').length;

  // Next status stepper
  const handleAdvanceStatus = (entry: ReceptionPatientEntry) => {
    let nextStatus: ReceptionPatientEntry['status'] = 'Waiting';
    if (entry.status === 'Waiting') nextStatus = 'Sample Collected';
    else if (entry.status === 'Sample Collected') nextStatus = 'In Lab';
    else if (entry.status === 'In Lab') nextStatus = 'Report Ready';
    else nextStatus = 'Report Ready';

    updateReceptionStatus(entry.id, nextStatus);
    showToast(`🔄 Token ${entry.tokenNumber} updated to: ${nextStatus}`);
  };

  const handleShareInvoice = async (entry: ReceptionPatientEntry) => {
    try {
      showToast('📄 Generating receipt PDF...');
      const { doc, filename, file } = await buildReceiptInvoicePdf(entry, labName);

      const netAmount = (entry.totalAmount || 0) - (entry.discountINR || 0);
      const shareText =
        `🧾 *${labName}* - Token & Invoice Receipt\n` +
        `--------------------------------\n` +
        `🎟️ Token No: *${entry.tokenNumber}*\n` +
        `🆔 UHID: ${entry.uhid}\n` +
        `👤 Patient: *${entry.patientName}* (${entry.age}Y/${entry.gender})\n` +
        `📱 Mobile: +91 ${entry.mobile}\n` +
        `🩺 Doctor: ${entry.referringDoctor}\n` +
        `🧪 Tests: ${entry.tests.join(', ')}\n` +
        `--------------------------------\n` +
        `💵 Net Bill: ₹${netAmount}\n` +
        `✅ Paid: ₹${entry.paidAmount}${entry.paidAmount > 0 ? ` (${entry.paymentMode})` : ''}\n` +
        `${entry.dueAmount > 0 ? `⚠️ Due Balance: ₹${entry.dueAmount}\n` : '✨ Status: Paid in Full (Nil Due)\n'}` +
        `📄 Attached PDF: *${filename}*\n\n` +
        `Thank you for choosing ${labName}!`;

      // 1. Try native Web Share API with actual PDF File object (Supported by Mobile WhatsApp & desktop share)
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Receipt ${entry.tokenNumber} - ${labName}`,
            text: shareText,
          });
          showToast(`✅ Receipt PDF (${filename}) shared via WhatsApp!`);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            return;
          }
        }
      }

      // 2. Direct Fallback: Automatically download the exact receipt PDF and open WhatsApp chat
      doc.save(filename);
      const cleanMobile = entry.mobile.replace(/\D/g, '');
      const url = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(shareText)}`;
      window.open(url, '_blank');
      showToast(`✅ Receipt PDF "${filename}" downloaded & WhatsApp opened!`);
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to generate receipt PDF. Please try again.');
    }
  };

  const handleWhatsAppReceipt = (entry: ReceptionPatientEntry) => {
    handleShareInvoice(entry);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
      {/* 1. Reception Header: Vendor Company Logo + Dashboard Name + Vendor Home Website + Log Out Button */}
      <header className="bg-[#0F766E] text-white px-4 sm:px-8 py-2.5 border-b border-teal-700/50 shadow-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Back Button + Vendor Company Logo + Active Dashboard Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Back Button */}
            <button
              type="button"
              id="reception-btn-back"
              onClick={() => onNavigateView(currentUser?.role === 'vendor' ? 'vendor_dashboard' : 'vendor_website')}
              className="bg-white/15 hover:bg-white/25 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-white/20 cursor-pointer shrink-0"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 text-amber-300" />
              <span>Back</span>
            </button>

            {/* Vendor Company Logo */}
            {labLogoUrl ? (
              <img
                src={labLogoUrl}
                alt={labName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-contain bg-white border border-white/20 p-0.5 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center font-black text-sm shadow-sm border border-white/20 shrink-0">
                <span className="text-amber-300">{labName.charAt(0) || 'A'}</span>
                <span>{labName.split(' ')[1]?.charAt(0) || 'L'}</span>
              </div>
            )}

            <div className="flex flex-col min-w-0">
              {/* Vendor Company Name */}
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight truncate">
                  {labName}
                </span>
              </div>
              {/* Dashboard badge */}
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className="bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                  <span>🖥️</span>
                  <span>Reception Entry & Billing Dashboard</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Vendor Home Website + Daily Cash Closing + Log Out */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Day & Cash Earning Report & Closing Button */}
            <button
              type="button"
              id="reception-btn-cash-closing"
              onClick={() => setIsCashClosingOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer border border-emerald-500 whitespace-nowrap"
              title="Day & Cash (Earning Report, Collections & Closing)"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-300" />
              <span>Day & Cash</span>
            </button>

            {/* Vendor Home Website Button */}
            <button
              type="button"
              id="reception-btn-vendor-website"
              onClick={() => onNavigateView('vendor_website')}
              className="bg-white hover:bg-teal-50 text-[#0F766E] px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer border border-white/30 whitespace-nowrap"
              title="Go to Vendor Home Website"
            >
              <Globe className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Vendor Home Website</span>
            </button>

            {/* If Admin is inspecting Reception Desk, provide quick return to Lab Owner CMS */}
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => onNavigateView('vendor_dashboard')}
                className="hidden md:flex bg-amber-400 hover:bg-amber-500 text-slate-950 px-2.5 py-1.5 rounded-lg text-xs font-bold transition items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                title="Return to Lab Owner Dashboard"
              >
                <span>👑 Lab Owner</span>
              </button>
            )}

            {/* Log Out Button */}
            <button
              type="button"
              id="reception-btn-logout"
              onClick={() => {
                logout();
                onNavigateView('vendor_website');
              }}
              className="bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
              title="Log out from Reception Desk"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 w-full space-y-6">
        {/* 3. Split Workstation Layout: Left Form + Right Live Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: New Patient Fast Entry & Billing Form (5 Cols) */}
          <div id="reception-patient-form" className={`lg:col-span-5 bg-white rounded-2xl border shadow-sm p-5 space-y-4 transition-all ${editingEntryId ? 'border-amber-400 ring-2 ring-amber-300/40' : 'border-slate-200'}`}>
            {editingEntryId ? (
              <div className="flex items-center justify-between border-b border-amber-200 pb-3 bg-amber-50/80 -mx-5 -mt-5 p-4 rounded-t-2xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wide">
                      ✏️ Edit Mode Active
                    </span>
                    <h2 className="text-sm sm:text-base font-black text-amber-950">
                      Token {receptionEntries.find((e) => e.id === editingEntryId)?.tokenNumber || ''} Correction
                    </h2>
                  </div>
                  <p className="text-[11px] text-amber-900 mt-0.5">
                    💡 <strong>Sirf galat data badlein:</strong> Pura form dobara nahi bharna padega.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <X className="w-3.5 h-3.5 text-rose-500" />
                  <span>Cancel Edit</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-black text-[#123B6D] flex items-center gap-1.5">
                    <span>⚡ New Patient & Billing Entry</span>
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Instant UHID, Barcode, Thermal Slip & Live Queue token
                  </p>
                </div>
                <span className="bg-teal-100 text-teal-900 text-xs font-black px-2.5 py-1 rounded-lg">
                  TK-{100 + receptionEntries.length + 1}
                </span>
              </div>
            )}

            {/* Notification: Technician has returned the entry */}
            {returnedByTechnicianEntries.length > 0 && (
              <div className="bg-rose-50 border-2 border-rose-300 p-3.5 rounded-xl shadow-xs space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-rose-900">
                    <span className="p-2 bg-rose-200 text-rose-800 rounded-xl">
                      <RotateCcw className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">
                        Technician has returned the entry.
                      </h4>
                      <p className="text-[11px] text-rose-800 font-medium">
                        {returnedByTechnicianEntries.length} specimen/patient {returnedByTechnicianEntries.length === 1 ? 'entry was' : 'entries were'} returned to Reception with a technician clinical note.
                      </p>
                    </div>
                  </div>
                  <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                    Returned by Lab
                  </span>
                </div>

                <div className="divide-y divide-rose-200 bg-white rounded-xl border border-rose-200 overflow-hidden">
                  {returnedByTechnicianEntries.map((retEntry) => (
                    <div key={retEntry.id} className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-black bg-rose-100 text-rose-900 px-2 py-0.5 rounded-md border border-rose-200">
                            {retEntry.tokenNumber || 'TK-101'}
                          </span>
                          <strong className="text-slate-900 font-bold">{retEntry.patientName}</strong>
                          <span className="text-[11px] text-slate-500 font-mono">+91 {retEntry.mobile}</span>
                        </div>
                        {retEntry.returnReason && (
                          <p className="text-xs text-rose-800 mt-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                            <strong>Technician Reason:</strong> {retEntry.returnReason}
                          </p>
                        )}
                        <div className="text-[10px] text-slate-500 mt-1">
                          Returned at: {retEntry.returnedAt || 'Today'} • Tests: {Array.isArray(retEntry.tests) ? retEntry.tests.join(', ') : retEntry.tests}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadEntryToForm(retEntry)}
                          className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Edit patient or tests for re-collection"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-300" />
                          <span>Edit / Re-collect</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateReceptionEntry(retEntry.id, {
                              returnedByTechnician: false,
                              technicianStatus: 'Pending',
                              sentToTechnician: true,
                            });
                            showToast(`Sample re-sent to Technician for ${retEntry.patientName}`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Re-send specimen to lab queue"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Re-send to Lab</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recently Registered Patient Banner (Instant 1-Click Correction) */}
            {showRecentlyRegisteredBanner && lastRegisteredEntry && !editingEntryId && (
              <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-amber-50 border-2 border-teal-300 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
                <div className="flex items-start sm:items-center gap-2">
                  <span className="text-teal-700 bg-teal-100 p-1.5 rounded-lg shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>✓ Just Registered:</span>
                      <span className="bg-teal-700 text-white px-1.5 py-0.2 rounded font-mono text-[11px] font-bold">
                        {lastRegisteredEntry.tokenNumber}
                      </span>
                      <span className="text-teal-950 font-bold">{lastRegisteredEntry.patientName}</span>
                      <span className="text-[11px] font-normal text-slate-600">
                        ({lastRegisteredEntry.age}Y • +91 {lastRegisteredEntry.mobile})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Koi data galti se galat ho gaya? <strong>Pura form dubara bharne ki zaroorat nahi hai!</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {!(
                    lastRegisteredEntry.sentToTechnician ||
                    lastRegisteredEntry.technicianStatus === 'Sent to Lab' ||
                    lastRegisteredEntry.technicianStatus === 'Accepted' ||
                    lastRegisteredEntry.technicianStatus === 'Report Generated' ||
                    lastRegisteredEntry.status === 'In Lab' ||
                    lastRegisteredEntry.status === 'Report Ready' ||
                    lastRegisteredEntry.reportId
                  ) ? (
                    <button
                      type="button"
                      onClick={() => handleLoadEntryToForm(lastRegisteredEntry)}
                      className="bg-[#0F766E] hover:bg-[#0d655e] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-300" />
                      <span>Galti Theek Karein (Edit)</span>
                    </button>
                  ) : (
                    <span className="bg-teal-800 text-teal-100 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Lab Sent (Locked)</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowRecentlyRegisteredBanner(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer text-xs"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Returning patient banner if detected */}
            {existingPatientMatch && (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Existing Patient Found: <strong>{existingPatientMatch.patientName}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyExistingPatient}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2 py-0.5 rounded text-[11px] cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>
            )}

            <form onSubmit={editingEntryId ? handleSaveCorrections : handleRegisterPatient} className="space-y-3.5">
              {/* 1. Patient Details */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-xs font-black text-[#123B6D] uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>1. Patient Details</span>
                  </span>
                </div>

                {/* Name | Age | Gender — inline */}
                <div className="grid grid-cols-12 gap-2 items-end">
                  {/* Name */}
                  <div className="col-span-6 sm:col-span-6">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Patient Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Gurpreet Singh"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 outline-none"
                    />
                  </div>

                  {/* Age */}
                  <div className="col-span-3 sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Age <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="115"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Yrs"
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 outline-none text-center"
                    />
                  </div>

                  {/* Gender */}
                  <div className="col-span-3 sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      {(['Male', 'Female', 'Other'] as const).map((g) => (
                        <button
                          type="button"
                          key={g}
                          onClick={() => setGender(g)}
                          className={`flex-1 py-1 rounded text-[11px] font-bold transition cursor-pointer text-center ${
                            gender === g
                              ? 'bg-white text-teal-800 shadow-2xs font-black'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title={g}
                        >
                          {g === 'Male' ? 'M' : g === 'Female' ? 'F' : 'O'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Number | Reference — inline */}
                <div className="grid grid-cols-12 gap-2 items-end">
                  {/* Number (10-Digit Mobile) */}
                  <div className="col-span-5 sm:col-span-5">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">+91</span>
                      <input
                        type="tel"
                        required
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        pattern="[0-9]{10}"
                        className="w-full pl-9 pr-2 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Reference (Doctor / Clinic) */}
                  <div className="col-span-7 sm:col-span-7">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Reference (Doctor / Clinic)
                    </label>
                    <select
                      value={referringDoctor}
                      onChange={(e) => setReferringDoctor(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-600 focus:border-teal-600 outline-none truncate"
                    >
                      <option value="Self Walk-in (Direct Patient)">Self Walk-in (Direct)</option>
                      {vendorDoctors.map((doc) => (
                        <option key={doc.id} value={`${doc.name} (${doc.degrees})`}>
                          {doc.name} • {doc.specialization}
                        </option>
                      ))}
                      <option value="Dr. S. K. Gupta (MD Med)">Dr. S. K. Gupta (MD Med)</option>
                      <option value="Dr. Anita Joshi, MD (Obs & Gynae)">Dr. Anita Joshi, MD</option>
                      <option value="Dr. Hardeep Bawa, MS">Dr. Hardeep Bawa, MS</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Test Selection */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-xs font-black text-[#123B6D] uppercase tracking-wider flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>2. Test Selection</span>
                  </span>
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {selectedTests.length} Selected
                  </span>
                </div>

                {/* Test Search Box — inline */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    placeholder="Search diagnostic tests (e.g. Sugar, CBC, Lipid, Thyroid, LFT)..."
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none bg-white"
                  />
                  {testSearch && (
                    <button
                      type="button"
                      onClick={() => setTestSearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Test List */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-0.5 flex items-center justify-between">
                    <span>{testSearch.trim() ? `Matching Tests (${filteredAvailableTests.length}):` : 'Test List:'}</span>
                    <span className="text-[10px] font-normal text-slate-500">Click to add multiple tests</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {filteredAvailableTests.length > 0 ? (
                      filteredAvailableTests.map((test) => {
                        const isSelected = selectedTests.includes(test.name);
                        return (
                          <button
                            type="button"
                            key={test.name}
                            onClick={() => handleToggleTest(test.name)}
                            className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#0F766E] text-white shadow-2xs'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-teal-400'
                            }`}
                          >
                            {isSelected ? <Check className="w-3 h-3 text-teal-200" /> : <Plus className="w-3 h-3 text-slate-400" />}
                            <span>{test.name}</span>
                            <span
                              className={`text-[10px] font-mono ${
                                isSelected ? 'text-teal-200' : 'text-slate-500 font-bold'
                              }`}
                            >
                              ₹{test.price}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="w-full py-2 px-1 text-center space-y-1.5">
                        <p className="text-xs text-slate-500">
                          No test found matching "{testSearch}".
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            handleToggleTest(testSearch.trim());
                            setTestSearch('');
                          }}
                          className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-white border border-teal-300 px-3 py-1 rounded-lg shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add "{testSearch.trim()}" as custom test (₹300)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Multiple Added Tests List */}
                {selectedTests.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-0.5">
                      <span>Added Tests ({selectedTests.length}):</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTests([])}
                        className="text-[10px] font-medium text-rose-600 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTests.map((testName) => {
                        const testObj = allAvailableTests.find((t) => t.name === testName);
                        const price = testObj ? testObj.price : 300;
                        return (
                          <span
                            key={testName}
                            className="bg-teal-50 border border-teal-200 text-teal-900 text-[11px] pl-2.5 pr-1.5 py-0.5 rounded-lg flex items-center gap-1.5 font-medium shadow-2xs"
                          >
                            <span>{testName}</span>
                            <span className="font-mono text-[10px] text-teal-700 font-bold">₹{price}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleTest(testName)}
                              className="text-teal-500 hover:text-rose-600 p-0.5 rounded cursor-pointer ml-0.5"
                              title="Remove test"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Billing & Payment */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-xs font-black text-[#123B6D] uppercase tracking-wider flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>3. Billing & Payment</span>
                  </span>
                </div>

                {/* Gross Test Amount: ₹____ */}
                <div className="flex justify-between items-center text-xs bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="font-semibold text-slate-700">Gross Test Amount:</span>
                  <span className="font-black text-sm text-slate-900 font-mono">₹{grossAmount}</span>
                </div>

                {/* Optional Discount with Checkbox */}
                <div className="pt-0.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasDiscount}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setHasDiscount(checked);
                          if (!checked) {
                            setDiscountINR(0);
                          }
                        }}
                        className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <span>Discount / Concession</span>
                        <span className="text-[10px] font-normal text-slate-400">(Optional)</span>
                      </span>
                    </label>

                    {hasDiscount && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-slate-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          max={grossAmount}
                          value={discountINR || ''}
                          onChange={(e) => setDiscountINR(Number(e.target.value) || 0)}
                          placeholder="0"
                          className="w-20 px-2 py-0.5 text-right font-bold text-slate-800 rounded border border-teal-300 bg-white text-xs outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                    )}
                  </div>

                  {hasDiscount && (
                    <div className="flex items-center justify-end gap-1 mt-1.5">
                      {[50, 100, 200].map((disc) => (
                        <button
                          type="button"
                          key={disc}
                          onClick={() => setDiscountINR(disc)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${
                            discountINR === disc
                              ? 'bg-teal-700 text-white border-teal-700 font-bold'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          ₹{disc} Off
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Net Payable */}
                <div className="flex justify-between items-center text-xs font-bold text-[#123B6D] px-1 pt-1 border-t border-slate-200">
                  <span>Net Payable:</span>
                  <span className="text-sm font-black font-mono">₹{netPayable}</span>
                </div>

                {/* Payment Options: Full | Advance | Due Payment — inline */}
                <div className="pt-1 border-t border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>Payment Options:</span>
                    <span className="text-[10px] font-semibold text-teal-700">
                      {paymentChoice === 'Full Payment'
                        ? '100% Paid'
                        : paymentChoice === 'Advance'
                        ? `Advance (${advancePercent}%)`
                        : '0% Paid (Due)'}
                    </span>
                  </div>

                  {/* Inline Segmented Buttons: Full | Advance | Due Payment */}
                  <div className="inline-flex w-full items-center p-1 bg-white rounded-lg border border-slate-200 shadow-2xs gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentChoice('Full Payment');
                        setCustomPaidAmount('');
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        paymentChoice === 'Full Payment'
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Full</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentChoice('Advance');
                        setCustomPaidAmount('');
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        paymentChoice === 'Advance'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>Advance</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentChoice('Due');
                        setCustomPaidAmount('0');
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        paymentChoice === 'Due'
                          ? 'bg-rose-700 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>Due Payment</span>
                    </button>
                  </div>

                  {/* Advance % selector if Advance is selected */}
                  {paymentChoice === 'Advance' && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                        <span>Advance Percentage:</span>
                        <span className="text-amber-800 font-bold">
                          {advancePercent}% = ₹{Math.round((netPayable * advancePercent) / 100)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[25, 50, 75].map((pct) => (
                          <button
                            type="button"
                            key={pct}
                            onClick={() => {
                              setAdvancePercent(pct);
                              setCustomPaidAmount('');
                            }}
                            className={`flex-1 py-1 text-xs font-bold rounded-md border transition cursor-pointer ${
                              advancePercent === pct && customPaidAmount === ''
                                ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                                : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {pct}% (₹{Math.round((netPayable * pct) / 100)})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount Paid & Due Details */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Amount Paid (₹)</label>
                    <input
                      type="number"
                      min="0"
                      max={netPayable}
                      value={paidAmount}
                      onChange={(e) => {
                        setPaymentChoice('Advance');
                        setCustomPaidAmount(e.target.value);
                      }}
                      placeholder={`₹${paidAmount}`}
                      className="w-full px-2.5 py-1 text-xs font-bold text-emerald-700 rounded-lg border border-slate-300 bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Balance Due</label>
                    <div
                      className={`text-xs font-black py-1 px-2 rounded-lg ${
                        dueAmount > 0
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      ₹{dueAmount}
                    </div>
                  </div>
                </div>

                {/* Payment Method: UPI | Cash — inline */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 shrink-0">Payment Method:</label>
                  <div className="inline-flex items-center p-0.5 bg-white rounded-lg border border-slate-200 shadow-2xs gap-1">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('UPI')}
                      className={`py-1 px-3.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        paymentMode === 'UPI'
                          ? 'bg-[#123B6D] text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>📱 UPI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('Cash')}
                      className={`py-1 px-3.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        paymentMode === 'Cash'
                          ? 'bg-[#123B6D] text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>💵 Cash</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Submit & Token Generation */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#123B6D] hover:bg-[#0e2c52] text-white py-3 rounded-xl font-black text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Submit Entry</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </button>
              </div>
            </form>
          </div>

          {/* Right: Today's Live Queue & Token Calling Board (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3.5 flex flex-col">
            {/* Board Header: Left → Reception List Info | Right → Search by Token No. & Mobile No. */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              {/* Left Side: Reception List & Patients Count */}
              <div className="shrink-0">
                <h2 className="text-base font-black text-[#172033] flex items-center gap-2">
                  <span>📋 Reception List</span>
                  <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    {filteredQueue.length} Patients
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500">Live patient queue with independent search & filters</p>
              </div>

              {/* Right Side: Search by Token Number & Mobile Number */}
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
                {/* Search by Token Number */}
                <div className="relative w-full sm:w-44">
                  <span className="absolute left-2.5 top-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    TK
                  </span>
                  <input
                    type="text"
                    value={searchToken}
                    onChange={(e) => setSearchToken(e.target.value)}
                    placeholder="Search Token No..."
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:ring-1 focus:ring-teal-600 focus:border-teal-600 outline-none placeholder:text-slate-400 font-mono shadow-2xs"
                  />
                  {searchToken && (
                    <button
                      type="button"
                      onClick={() => setSearchToken('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Clear token search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Search by Mobile Number */}
                <div className="relative w-full sm:w-48">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="tel"
                    value={searchMobile}
                    onChange={(e) => setSearchMobile(e.target.value)}
                    placeholder="Search Mobile No..."
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:ring-1 focus:ring-teal-600 focus:border-teal-600 outline-none placeholder:text-slate-400 font-mono shadow-2xs"
                  />
                  {searchMobile && (
                    <button
                      type="button"
                      onClick={() => setSearchMobile('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Clear mobile search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Independent Filters: One inline row: Date Filter [All Dates ▼] | Payment Filter [All ▼] */}
            <div className="space-y-1.5 pt-0.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Independent Filters</span>
                {(dateFilter !== 'All Dates' || paymentFilter !== 'All' || searchToken || searchMobile) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDateFilter('All Dates');
                      setPaymentFilter('All');
                      setSearchToken('');
                      setSearchMobile('');
                    }}
                    className="text-[10px] text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                {/* Date Filter */}
                <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                  <label className="text-xs font-bold text-slate-700 shrink-0 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-700" />
                    <span>Date Filter</span>
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:ring-1 focus:ring-teal-600 focus:border-teal-600 outline-none cursor-pointer"
                  >
                    <option value="All Dates">All Dates</option>
                    <option value="Today">Today</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="Custom Date">Custom Date</option>
                  </select>
                </div>

                {/* If Custom Date selected: inline date input */}
                {dateFilter === 'Custom Date' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:ring-1 focus:ring-teal-600 outline-none cursor-pointer"
                    />
                  </div>
                )}

                <span className="hidden sm:inline text-slate-300 font-bold">|</span>

                {/* Payment Filter */}
                <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                  <label className="text-xs font-bold text-slate-700 shrink-0 flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-teal-700" />
                    <span>Payment Filter</span>
                  </label>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value as any)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:ring-1 focus:ring-teal-600 focus:border-teal-600 outline-none cursor-pointer"
                  >
                    <option value="All">All</option>
                    <option value="Advance">Advance</option>
                    <option value="Due">Due</option>
                    <option value="Full Payment">Full Payment</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Workflow Status Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              {(['All', 'Waiting', 'Sample Collected', 'In Lab', 'Report Ready', 'Publish Pending'] as const).map((st) => {
                const count =
                  st === 'All'
                    ? receptionEntries.length
                    : st === 'Report Ready'
                    ? receptionEntries.filter((e) => e.status === 'Report Ready' || e.technicianStatus === 'Report Generated' || Boolean(e.reportId)).length
                    : st === 'Publish Pending'
                    ? receptionEntries.filter((e) => (e.status === 'Report Ready' || e.technicianStatus === 'Report Generated' || Boolean(e.reportId)) && !e.isReportPublished).length
                    : receptionEntries.filter((e) => e.status === st).length;
                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`py-1 px-2.5 rounded-lg transition text-[11px] flex items-center gap-1.5 cursor-pointer ${
                      statusFilter === st
                        ? 'bg-white text-teal-800 font-black shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{st === 'Publish Pending' ? '🔔 Publish Pending' : st}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${st === 'Publish Pending' && count > 0 ? 'bg-amber-200 text-amber-950 font-black' : 'opacity-75'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Patients List Cards — Expanded vertical capacity for 5+ simultaneous entries */}
            <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-[660px] max-h-[calc(100vh-140px)] xl:min-h-[760px] xl:max-h-[920px]">
              {filteredQueue.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No patient entries match the selected search or status filter.
                </div>
              ) : (
                filteredQueue.map((entry) => {
                  const isAlreadySent = Boolean(
                    entry.sentToTechnician ||
                    entry.technicianStatus === 'Sent to Lab' ||
                    entry.technicianStatus === 'Accepted' ||
                    entry.technicianStatus === 'Report Generated' ||
                    entry.status === 'In Lab' ||
                    entry.status === 'Report Ready'
                  );

                  const isReportReady = Boolean(
                    entry.status === 'Report Ready' ||
                    entry.technicianStatus === 'Report Generated' ||
                    entry.reportId
                  );

                  const isLockedForEdit = isAlreadySent || isReportReady;

                  const paymentStatusType: 'Full Payment' | 'Advance' | 'Due' =
                    entry.dueAmount === 0 || entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid'
                      ? 'Full Payment'
                      : (entry.paidAmount > 0 && entry.dueAmount > 0) || entry.paymentStatus === 'Advance' || entry.paymentStatus === 'Partial'
                      ? 'Advance'
                      : 'Due';

                  const netTotal = Math.max(0, entry.totalAmount - (entry.discountINR || 0));
                  const hasMadePayment =
                    (paymentStatusType === 'Full Payment' || paymentStatusType === 'Advance') &&
                    (entry.paidAmount || 0) > 0;

                  return (
                    <div
                      key={entry.id}
                      className="border border-slate-200 rounded-xl p-3 hover:border-teal-300 hover:shadow-xs transition bg-white space-y-2"
                    >
                      {/* Header: Left → Token No. + Phone No. | Right → Sent to Lab button / badge */}
                      <div className="flex items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                        {/* Left: Token No. + Phone No. (+ Patient Name & Details) */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="bg-[#123B6D] text-white text-xs font-black px-2 py-0.5 rounded-md shrink-0 font-mono tracking-wide shadow-2xs">
                            {entry.tokenNumber || entry.tokenNo}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                                {entry.patientName}
                              </span>
                              <span className="text-[11px] text-slate-500 font-normal">
                                ({entry.age}Y • {entry.gender})
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mt-0.5 font-mono">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>+91 {entry.mobile}</span>
                              {entry.referringDoctor && (
                                <span className="text-slate-400 font-normal font-sans text-[10px] truncate">
                                  • Ref: {entry.referringDoctor.split(' ')[1] || entry.referringDoctor}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Sent to Lab button (only before sending) OR Sent to Lab badge (after sending) */}
                        <div className="shrink-0">
                          {!isAlreadySent ? (
                            <button
                              type="button"
                              onClick={() => handleSendToLab(entry)}
                              className="px-2.5 py-1 bg-[#0F766E] hover:bg-[#0d655e] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
                              title="Send specimen to Lab Technician workstation"
                            >
                              <FlaskConical className="w-3 h-3 text-amber-300" />
                              <span>Sent to Lab</span>
                            </button>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Sent to Lab</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Body: Compact Test Badges & Patient Meta */}
                      <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-0.5">
                          Tests ({entry.tests?.length || 0}):
                        </span>
                        {entry.tests && entry.tests.length > 0 ? (
                          entry.tests.map((testName, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                            >
                              <span className="w-3.5 h-3.5 rounded-full bg-teal-100 text-teal-800 text-[9px] font-black inline-flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="truncate max-w-[200px]">{testName}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No tests selected</span>
                        )}
                        <span className="text-[10px] text-slate-400 font-normal ml-auto shrink-0">
                          UHID: <strong className="font-mono text-slate-700">{entry.uhid}</strong> • {entry.registeredAt}
                        </span>
                      </div>

                      {/* Footer: Left → Total Amount + Payment Status + Method (UPI/Cash) | Right → Edit, Delete & Print Slip buttons (WhatsApp removed) */}
                      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2 text-xs">
                        {/* Left: Total Amount + Payment Status + Method (UPI/Cash) */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Total Amount */}
                          <span className="font-black text-[#123B6D] text-xs sm:text-sm font-mono">
                            Total: ₹{netTotal}
                          </span>

                          <span className="text-slate-300">|</span>

                          {/* Payment Status */}
                          {paymentStatusType === 'Full Payment' ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Full Payment</span>
                            </span>
                          ) : paymentStatusType === 'Advance' ? (
                            <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span>Advance (Due: ₹{entry.dueAmount})</span>
                            </span>
                          ) : (
                            <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span>Due (₹{entry.dueAmount})</span>
                            </span>
                          )}

                          {/* Method (UPI/Cash) — Only shown if payment was made (full or advance) */}
                          {hasMadePayment && (
                            <>
                              <span className="text-slate-300">|</span>
                              <span className="text-slate-600 font-semibold text-[10px] sm:text-[11px] bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <span>Method:</span>
                                <strong className="text-slate-900">
                                  {entry.paymentMode === 'UPI' ? '📱 UPI' : entry.paymentMode === 'Cash' ? '💵 Cash' : entry.paymentMode}
                                </strong>
                              </span>
                            </>
                          )}
                        </div>

                        {/* Right: Edit, Delete & Print Slip buttons (WhatsApp removed as requested) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Edit button (Locked & disabled if Sent to Lab or Report is Ready) */}
                          {!isLockedForEdit ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(entry)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Edit Patient Details & Billing"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-700" />
                              <span>Edit</span>
                            </button>
                          ) : (
                            <span
                              title={
                                isReportReady
                                  ? '🔒 Report Ready: Entry locked, editing not allowed'
                                  : '🔒 Sent to Lab: Entry locked, editing not allowed'
                              }
                              className="px-2.5 py-1 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-not-allowed select-none"
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>{isReportReady ? 'Report Ready' : 'In Lab'}</span>
                            </span>
                          )}

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(entry)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Delete Patient Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>

                          {/* Thermal Slip / Receipt Print */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReceipt(entry);
                              setIsReceiptModalOpen(true);
                            }}
                            title="Print / View Receipt & Slip"
                            className="px-2.5 py-1 bg-slate-100 hover:bg-teal-100 hover:text-teal-800 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 4. Minimalist Invoice & Generated Token Modal */}
      {isReceiptModalOpen && selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200/90 relative animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsReceiptModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Minimalist Header */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Entry Submitted</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Token & Invoice
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {labName} • {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>

            {/* Generated Token Number Display (Minimalist & Prominent) */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 border-2 border-[#123B6D]/20 rounded-2xl p-4 text-center mb-4 relative overflow-hidden">
              <div className="text-[11px] font-black uppercase tracking-widest text-[#123B6D]/80">
                Generated Token Number
              </div>
              <div className="text-4xl sm:text-5xl font-black text-[#123B6D] tracking-tight font-mono my-1">
                {selectedReceipt.tokenNumber}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-medium">
                <span>UHID: <strong className="font-mono text-slate-800">{selectedReceipt.uhid}</strong></span>
                <span>•</span>
                <span>Time: <strong>{selectedReceipt.registeredAt}</strong></span>
              </div>
            </div>

            {/* Clean Minimalist Bill / Invoice Section */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3 text-xs text-slate-700 shadow-2xs mb-5">
              {/* Patient Details */}
              <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Patient</span>
                  <span className="font-bold text-slate-900 text-sm block truncate">{selectedReceipt.patientName}</span>
                  <span className="text-slate-500 text-[11px]">{selectedReceipt.age} Yrs / {selectedReceipt.gender}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Mobile & Ref Doctor</span>
                  <span className="font-mono font-semibold text-slate-900 block">+91 {selectedReceipt.mobile}</span>
                  <span className="text-slate-500 text-[11px] truncate block">Dr: {selectedReceipt.referringDoctor}</span>
                </div>
              </div>

              {/* Prescribed Tests */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Prescribed Diagnostic Tests ({selectedReceipt.tests.length})
                </span>
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {selectedReceipt.tests.map((testName, i) => (
                    <div key={i} className="flex justify-between items-center py-0.5 text-xs">
                      <span className="text-slate-800 truncate pr-2">{i + 1}. {testName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Financial Breakdown */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Gross Test Amount:</span>
                  <span className="font-mono font-semibold text-slate-900">₹{selectedReceipt.totalAmount}</span>
                </div>
                {selectedReceipt.discountINR > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700 font-medium">
                    <span>Discount / Concession:</span>
                    <span className="font-mono">-₹{selectedReceipt.discountINR}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold text-slate-900 pt-1 border-t border-slate-100">
                  <span>Net Payable:</span>
                  <span className="font-mono text-sm font-black text-[#123B6D]">
                    ₹{selectedReceipt.totalAmount - selectedReceipt.discountINR}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-700 font-semibold">
                    Amount Paid{selectedReceipt.paidAmount > 0 ? ` (${selectedReceipt.paymentMode})` : ''}:
                  </span>
                  <span className="font-mono font-bold text-emerald-700">₹{selectedReceipt.paidAmount}</span>
                </div>
                {selectedReceipt.dueAmount > 0 ? (
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-rose-100 text-rose-700 font-bold">
                    <span>Balance Due:</span>
                    <span className="font-mono text-sm">₹{selectedReceipt.dueAmount}</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-emerald-100 text-emerald-700 font-bold">
                    <span>Payment Status:</span>
                    <span>✓ Full Payment Cleared</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: Share and Download clearly highlighted (Minimalist Design) */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2.5">
                {/* Share Button (WhatsApp / PDF) */}
                <button
                  type="button"
                  onClick={() => handleShareInvoice(selectedReceipt)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                  title="Share receipt PDF via WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share (WhatsApp)</span>
                </button>

                {/* Download Button */}
                <button
                  type="button"
                  onClick={() => generateThermalReceiptPdf(selectedReceipt, labName)}
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                  title="Download receipt PDF"
                >
                  <Download className="w-4 h-4 text-cyan-300" />
                  <span>Download PDF</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                {/* Print Button */}
                <button
                  type="button"
                  onClick={() => {
                    const success = safePrint(() => {
                      generateThermalReceiptPdf(selectedReceipt, labName);
                    });
                    if (!success) {
                      generateThermalReceiptPdf(selectedReceipt, labName);
                    }
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 px-3 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print Slip</span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl font-semibold text-xs transition flex items-center justify-center cursor-pointer"
                >
                  <span>Done</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. In-App Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-black text-slate-900">Remove Patient Entry?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Remove token <strong>{deleteTarget.tokenNumber} ({deleteTarget.patientName})</strong> from today's reception queue?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteReceptionEntry(deleteTarget.id);
                  setDeleteTarget(null);
                  showToast('🗑️ Entry removed from queue');
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Edit Patient Entry Modal */}
      {isEditModalOpen && editingEntry && (
        <EditReceptionEntryModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingEntry(null);
          }}
          entry={editingEntry}
          onSave={handleSaveEdit}
          onSaveAndSendToLab={handleSaveAndSendToLab}
          vendorDoctors={vendorDoctors}
          availableTests={allAvailableTests}
        />
      )}

      {/* 7. Collect Remaining Payment Modal */}
      {isCollectPaymentOpen && collectingPaymentEntry && (
        <CollectRemainingPaymentModal
          isOpen={isCollectPaymentOpen}
          onClose={() => {
            setIsCollectPaymentOpen(false);
            setCollectingPaymentEntry(null);
          }}
          entry={collectingPaymentEntry}
          onCollectPayment={handleCollectPayment}
        />
      )}

      {/* 8. Day-End Reception Cash Closing (Daily Tally Sheet) Modal */}
      {isCashClosingOpen && (
        <DayEndCashClosingModal
          isOpen={isCashClosingOpen}
          onClose={() => setIsCashClosingOpen(false)}
          receptionEntries={receptionEntries}
          staffName={currentUser?.name || 'Reception Staff'}
        />
      )}

      {/* Footer with Lab Copyright, indianlalaji.com link and Customer Care Helpline */}
      <DashboardFooter />
    </div>
  );
};
