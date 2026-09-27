import React, { useState, useEffect } from 'react';
import {
  Phone,
  MessageSquare,
  FileText,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Search,
  ArrowRight,
  User,
  Activity,
  Award,
  Hash,
  FlaskConical,
  Heart,
  Droplets,
  AlertCircle,
  HelpCircle,
  Smartphone,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  QrCode,
  Copy,
  Globe,
  Mail,
  Shield,
  RotateCcw,
  Send,
  Share2,
  Navigation,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  ExternalLink,
  Lock,
  KeyRound,
  Image as ImageIcon,
  Users,
  Maximize2,
  Upload,
  Trash2,
  Plus,
  ShoppingCart,
  Info,
  Sparkles,
  Tag,
  TestTube,
  Layers,
  Download,
  Printer,
  Camera,
} from 'lucide-react';
import { useCms, DEFAULT_ALL_VENDOR_DOCTORS } from '../context/CmsContext';
import { updateDocumentMetadata, generateDefaultOgImage } from '../utils/seo';
import { Language, LabReport, ReceptionPatientEntry } from '../types';
import { generateReportPdf, printCanonicalReportPdf } from '../utils/pdfGenerator';
import { safePrint } from '../utils/printHelper';
import { OnlineTestBookingModal } from './vendor/OnlineTestBookingModal';
import { HeroBookingForm } from './vendor/HeroBookingForm';
import { LabWelcomeFirstScreen } from './vendor/LabWelcomeFirstScreen';
import { TermsConditionsModal } from './TermsConditionsModal';
import { VendorPolicyModal, PolicyTabType } from './vendor/VendorPolicyModal';
import { getTenantWebsiteUrl, getTenantSubdomain, getTenantBrowserUrl, SUPER_ADMIN_DOMAIN } from '../constants/domains';
import { isTenantMatch } from '../utils/tenantSecurity';

interface LabVendorWebsiteProps {
  language?: Language;
  onSelectLanguage?: (lang: Language) => void;
  onOpenReportPortal: (reportId?: string, mobile?: string, labId?: string) => void;
  onOpenLabSoftware: () => void;
  onOpenSoftwareWebsite: () => void;
  onOpenVendorDashboard?: () => void;
  onOpenReceptionDashboard?: () => void;
  onOpenAdminDashboard?: () => void;
}

export const LabVendorWebsite: React.FC<LabVendorWebsiteProps> = ({
  language = 'en',
  onSelectLanguage,
  onOpenReportPortal,
  onOpenLabSoftware,
  onOpenSoftwareWebsite,
  onOpenVendorDashboard,
  onOpenReceptionDashboard,
  onOpenAdminDashboard,
}) => {
  const {
    currentUser,
    vendorLabSettings,
    vendorPackages,
    vendorTests,
    vendorDoctors,
    addHomeCollectionBooking,
    openLoginModal,
    vendorLabsList,
    selectedVendorLabId,
    setVendorStatus,
    allReports,
    allReceptionEntries,
    updateVendorLabSettings,
    addContactSubmission,
  } = useCms();

  const currentLabItem = React.useMemo(() => {
    return (
      vendorLabsList.find((l) => l.id === (vendorLabSettings?.labId || selectedVendorLabId)) ||
      vendorLabsList.find(
        (l) => l.name?.toLowerCase() === (vendorLabSettings?.labName || vendorLabSettings?.name)?.toLowerCase()
      ) ||
      vendorLabsList[0] ||
      null
    );
  }, [vendorLabsList, vendorLabSettings, selectedVendorLabId]);

  const currentVendorReport = React.useMemo(() => {
    const tid = currentLabItem?.id || selectedVendorLabId;
    return (allReports || []).find((r) => isTenantMatch(r, tid));
  }, [allReports, currentLabItem?.id, selectedVendorLabId]);

  const handleCheckReport = (reportId?: string, mobile?: string) => {
    const rId = reportId || '';
    const mob = mobile || '';
    onOpenReportPortal(rId, mob, currentLabItem?.id || selectedVendorLabId);
  };

  const dedicatedDomain = currentLabItem?.domainPreview || `${currentLabItem?.id || 'apexdiagnostics'}.${SUPER_ADMIN_DOMAIN}`;
  const canonicalUrl = getTenantWebsiteUrl(dedicatedDomain);

  const handleOpenAdmin = () => {
    if (currentUser && currentUser.role === 'admin') {
      if (onOpenAdminDashboard) onOpenAdminDashboard();
    } else if (currentUser && currentUser.role === 'vendor') {
      if (onOpenVendorDashboard) onOpenVendorDashboard();
    } else {
      openLoginModal('admin');
    }
  };

  const handleOpenManagement = () => {
    if (currentUser && (currentUser.role === 'vendor' || currentUser.role === 'admin')) {
      if (onOpenVendorDashboard) onOpenVendorDashboard();
    } else {
      openLoginModal('vendor');
    }
  };

  const handleOpenReception = () => {
    if (currentUser && (currentUser.role === 'reception' || currentUser.role === 'vendor' || currentUser.role === 'admin')) {
      if (onOpenReceptionDashboard) onOpenReceptionDashboard();
    } else {
      openLoginModal('reception');
    }
  };

  const handleOpenTechnician = () => {
    if (currentUser && (currentUser.role === 'technician' || currentUser.role === 'vendor' || currentUser.role === 'admin')) {
      if (onOpenLabSoftware) onOpenLabSoftware();
    } else {
      openLoginModal('technician');
    }
  };

  const labShopId = vendorLabSettings?.labShopId || 'LSP-7087';
  const labName = vendorLabSettings?.labName || vendorLabSettings?.name || 'Apex Diagnostic & Clinical Pathology Laboratory';
  const labNabl = vendorLabSettings?.nablAccreditationNo || vendorLabSettings?.nablNumber || 'MC-4821';
  const labPhone = vendorLabSettings?.phone || vendorLabSettings?.helplinePhone || '7087033009';
  const labWhatsapp = vendorLabSettings?.whatsapp || labPhone || '7087033009';
  const labEmail = vendorLabSettings?.email || 'care@apexdiagnostics.in';
  const labTagline = vendorLabSettings?.tagline || 'Advanced Pathology, Biochemistry & Diagnostic Testing Centre';
  const labHours = vendorLabSettings?.openingHours || 'Open 7:00 AM – 9:00 PM (All 7 Days)';
  const labEmergency = vendorLabSettings?.emergencyHours || '24x7 Emergency Services at Central Lab';
  const labAddress = vendorLabSettings?.address || 'SCF 42-43, Sector 18-C, Central Healthcare Complex, Ludhiana';
  const labDescription = vendorLabSettings?.description || labTagline || 'Advanced Pathology, Biochemistry & Diagnostic Testing Centre. 100% NABL Accredited.';
  const labWebsiteUrl = vendorLabSettings?.websiteUrl && !vendorLabSettings.websiteUrl.includes('labname.com') ? vendorLabSettings.websiteUrl : canonicalUrl;
  const labLogoUrl = vendorLabSettings?.logoUrl || '';
  const labOgImageUrl = vendorLabSettings?.ogImageUrl || labLogoUrl || generateDefaultOgImage(labName, labShopId, labNabl);

  const cleanPhone = (labPhone || '7087033009').replace(/\D/g, '');
  const cleanWhatsapp = (labWhatsapp || '7087033009').replace(/\D/g, '');
  const stickyWhatsappUrl = `https://wa.me/91${cleanWhatsapp}?text=${encodeURIComponent(
    `Hello ${labName}, I would like to inquire about medical lab tests & home sample collection.`
  )}`;
  const stickyTelUrl = `tel:+91${cleanPhone}`;

  // Multi-number support for WhatsApp & Calling
  const whatsappNumberList = React.useMemo(() => {
    const raw = vendorLabSettings?.whatsapp || labWhatsapp || '7087033009';
    const splitNums = raw.split(/[,/|&]+/).map((s: string) => s.trim()).filter(Boolean);
    const unique = Array.from(new Set(splitNums));
    return unique.length > 0 ? unique : ['7087033009'];
  }, [vendorLabSettings?.whatsapp, labWhatsapp]);

  const callNumberList = React.useMemo(() => {
    const rawList: string[] = [];
    if (vendorLabSettings?.phone) {
      rawList.push(...vendorLabSettings.phone.split(/[,/|&]+/));
    }
    if (vendorLabSettings?.helplinePhone && vendorLabSettings.helplinePhone !== vendorLabSettings.phone) {
      rawList.push(...vendorLabSettings.helplinePhone.split(/[,/|&]+/));
    }
    if (rawList.length === 0 && labPhone) {
      rawList.push(...labPhone.split(/[,/|&]+/));
    }
    const cleanList = Array.from(new Set(rawList.map((s: string) => s.trim()).filter(Boolean)));
    return cleanList.length > 0 ? cleanList : ['7087033009'];
  }, [vendorLabSettings?.phone, vendorLabSettings?.helplinePhone, labPhone]);

  // Dynamic Open Graph, Page Title & Metadata Synchronization for Current Tenant/Shop
  useEffect(() => {
    updateDocumentMetadata({
      title: `${labName} - Diagnostic & Pathology Laboratory`,
      description: labDescription,
      ogImage: labOgImageUrl,
      ogUrl: labWebsiteUrl,
      ogType: 'website',
    });

    return () => {
      // Revert to laboratory metadata on unmount
      updateDocumentMetadata({
        title: `${labName} - Diagnostic & Pathology Laboratory`,
        description: labDescription,
        ogImage: labOgImageUrl,
        ogUrl: typeof window !== 'undefined' ? window.location.origin : '',
        ogType: 'website',
      });
    };
  }, [labName, labShopId, labNabl, labDescription, labWebsiteUrl, labOgImageUrl]);

  // First Screen (Welcome Gateway) vs Full Website Exploration State
  const [hasEnteredWebsite, setHasEnteredWebsite] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBookTestCategory, setSelectedBookTestCategory] = useState<string>('All');
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });
  const [visibleTestsCount, setVisibleTestsCount] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 20;
    }
    return 40;
  });
  const [activeMobilePkgIndex, setActiveMobilePkgIndex] = useState(0);
  const [activeMobileDoctorIndex, setActiveMobileDoctorIndex] = useState(0);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 640;
      setIsMobileScreen(isMobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [selectedTestInfoModal, setSelectedTestInfoModal] = useState<any | null>(null);
  const [addingTestId, setAddingTestId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<{
    id: string;
    name: string;
    price: number;
    code?: string;
    category?: string;
    sampleType?: string;
    turnaroundTime?: string;
  }[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [showFullDirectory, setShowFullDirectory] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookedSuccess, setBookedSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPaymentQrModalOpen, setIsPaymentQrModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [selectedQrType, setSelectedQrType] = useState<'counter' | 'home'>('counter');
  const [isWebsiteQrModalOpen, setIsWebsiteQrModalOpen] = useState(false);
  const [copiedWebsiteUrl, setCopiedWebsiteUrl] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyModalTab, setPolicyModalTab] = useState<PolicyTabType>('terms');
  const [fullScreenImage, setFullScreenImage] = useState<{ url: string; title: string } | null>(null);

  const openPolicyModal = (tab: PolicyTabType) => {
    setPolicyModalTab(tab);
    setIsPolicyModalOpen(true);
  };

  const websiteDirectUrl = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const search = window.location.search;
      if (search && search.includes('lab=')) {
        return `${origin}${window.location.pathname}${search}`;
      }
      const slug = currentLabItem?.domainPreview?.replace(`.${SUPER_ADMIN_DOMAIN}`, '') || currentLabItem?.id || 'apexdiagnostics';
      return `${origin}/?lab=${slug}`;
    }
    return canonicalUrl;
  }, [currentLabItem, canonicalUrl]);

  // Default Pathology & Diagnostic Banners
  const DEFAULT_HERO_BANNER_IMAGES = React.useMemo(() => [
    'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1600&q=80',
  ], []);

  // Section 1: Hero Carousel State (Admin Uploadable Photo Banners with 2%-5% Peek Effect)
  const heroBannersList = React.useMemo(() => {
    if (vendorLabSettings?.heroBanners && vendorLabSettings.heroBanners.length > 0) {
      return vendorLabSettings.heroBanners;
    }
    return DEFAULT_HERO_BANNER_IMAGES;
  }, [vendorLabSettings?.heroBanners, DEFAULT_HERO_BANNER_IMAGES]);

  const [activeHeroBanner, setActiveHeroBanner] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const heroCarouselRef = React.useRef<HTMLDivElement>(null);
  const touchStartXRef = React.useRef<number | null>(null);
  const touchEndXRef = React.useRef<number | null>(null);

  // Admin Banner Upload & Management State
  const [isBannerManagerOpen, setIsBannerManagerOpen] = useState(false);
  const [tempBannersList, setTempBannersList] = useState<string[]>([]);
  const [newBannerInputUrl, setNewBannerInputUrl] = useState('');
  const [bannerSaveNotice, setBannerSaveNotice] = useState('');
  const bannerFileInputRef = React.useRef<HTMLInputElement>(null);

  const openBannerManager = () => {
    setTempBannersList([...heroBannersList]);
    setNewBannerInputUrl('');
    setBannerSaveNotice('');
    setIsBannerManagerOpen(true);
  };

  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setBannerSaveNotice('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setTempBannersList((prev) => [...prev, base64]);
        setBannerSaveNotice('Image photo added! Click "Save & Publish" to update.');
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleAddBannerUrl = () => {
    const url = newBannerInputUrl.trim();
    if (!url) return;
    setTempBannersList((prev) => [...prev, url]);
    setNewBannerInputUrl('');
    setBannerSaveNotice('Banner URL added! Click "Save & Publish" to update.');
  };

  const handleRemoveBanner = (index: number) => {
    setTempBannersList((prev) => prev.filter((_, i) => i !== index));
    setBannerSaveNotice('Banner removed from list. Click "Save & Publish" to update.');
  };

  const handleMoveBanner = (index: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tempBannersList.length) return;
    const updated = [...tempBannersList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setTempBannersList(updated);
    setBannerSaveNotice('Banner order updated! Click "Save & Publish" to confirm.');
  };

  const handleSaveBanners = () => {
    const finalBanners = tempBannersList.length > 0 ? tempBannersList : DEFAULT_HERO_BANNER_IMAGES;
    updateVendorLabSettings({ heroBanners: finalBanners });
    setBannerSaveNotice('✅ Banners updated successfully!');
    setTimeout(() => {
      setIsBannerManagerOpen(false);
      setBannerSaveNotice('');
      setActiveHeroBanner(0);
    }, 900);
  };

  const handleResetDefaultBanners = () => {
    setTempBannersList([...DEFAULT_HERO_BANNER_IMAGES]);
    updateVendorLabSettings({ heroBanners: DEFAULT_HERO_BANNER_IMAGES });
    setBannerSaveNotice('Reset to default diagnostic promotional banners.');
  };

  // Auto-slide carousel every 4.5 seconds (resets on interaction)
  useEffect(() => {
    if (isHeroPaused || heroBannersList.length <= 1) return;
    const interval = setInterval(() => {
      setActiveHeroBanner((prev) => (prev + 1) % heroBannersList.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isHeroPaused, heroBannersList.length]);

  // Smooth scroll carousel container to active slide
  useEffect(() => {
    if (heroCarouselRef.current) {
      const container = heroCarouselRef.current;
      const targetCard = container.children[activeHeroBanner] as HTMLElement;
      if (targetCard) {
        container.scrollTo({
          left: targetCard.offsetLeft - 12,
          behavior: 'smooth',
        });
      }
    }
  }, [activeHeroBanner]);

  const handleHeroTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    setIsHeroPaused(true);
  };

  const handleHeroTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleHeroTouchEnd = () => {
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const delta = touchStartXRef.current - touchEndXRef.current;
      if (Math.abs(delta) > 35) {
        if (delta > 0) {
          // swipe left -> next slide
          setActiveHeroBanner((prev) => (prev + 1) % heroBannersList.length);
        } else {
          // swipe right -> previous slide
          setActiveHeroBanner((prev) => (prev - 1 + heroBannersList.length) % heroBannersList.length);
        }
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
    setTimeout(() => setIsHeroPaused(false), 2500);
  };

  // Section 2: Quick Check Report Box State & Inline Report Display
  const [quickReportTab, setQuickReportTab] = useState<'mobile' | 'report_id'>('mobile');
  const [quickReportInput, setQuickReportInput] = useState('');
  const [quickReportError, setQuickReportError] = useState('');
  const [inlineSearchedReport, setInlineSearchedReport] = useState<LabReport | null>(null);
  const [inlineMultipleReports, setInlineMultipleReports] = useState<LabReport[]>([]);
  const [inlinePendingSample, setInlinePendingSample] = useState<{
    tokenNumber: string;
    patientName: string;
    ageGender: string;
    tests: string[];
    registeredAt: string;
    status: string;
    technicianStatus: string;
    branchName?: string;
  } | null>(null);
  const [inlineSearchNotFound, setInlineSearchNotFound] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const performInlineReportSearch = (rawQuery?: string, explicitTab?: 'mobile' | 'report_id') => {
    setQuickReportError('');
    setInlineSearchNotFound(false);
    setInlineSearchedReport(null);
    setInlineMultipleReports([]);
    setInlinePendingSample(null);

    const activeTab = explicitTab || quickReportTab;
    const val = (rawQuery !== undefined ? rawQuery : quickReportInput).trim();

    if (!val) {
      setQuickReportError(
        activeTab === 'mobile'
          ? 'Please enter your 10-digit registered mobile number.'
          : 'Please enter your Token Number or Report ID.'
      );
      return;
    }

    const currentLabId = currentLabItem?.id || selectedVendorLabId;

    // Filter reports and reception entries for current lab, fallback to allReports if none scoped
    const labReports = (allReports || []).filter((r) => isTenantMatch(r, currentLabId));
    const availableReports = labReports.length > 0 ? labReports : (allReports || []);

    const labEntries = (allReceptionEntries || []).filter((e) => isTenantMatch(e, currentLabId));
    const availableEntries = labEntries.length > 0 ? labEntries : (allReceptionEntries || []);

    if (activeTab === 'mobile') {
      const cleanDigits = val.replace(/\D/g, '');
      if (cleanDigits.length < 10) {
        setQuickReportError('Please enter a valid 10-digit mobile number (e.g. 9876543210).');
        return;
      }

      // 1. Find matched verified/published reports
      const matchedReports = availableReports.filter((r) => {
        const rMob = (r.mobile || '').replace(/\D/g, '');
        return rMob === cleanDigits || rMob.endsWith(cleanDigits) || cleanDigits.endsWith(rMob);
      });

      // 2. Find matched reception entries (in case sample is in process)
      const matchedEntries = availableEntries.filter((e) => {
        const eMob = (e.mobile || '').replace(/\D/g, '');
        return eMob === cleanDigits || eMob.endsWith(cleanDigits) || cleanDigits.endsWith(eMob);
      });

      if (matchedReports.length > 0) {
        setInlineSearchedReport(matchedReports[0]);
        if (matchedReports.length > 1) {
          setInlineMultipleReports(matchedReports);
        }
        setTimeout(() => {
          document.getElementById('inline-report-display-container')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 120);
      } else if (matchedEntries.length > 0) {
        const entry = matchedEntries[0];
        if (entry.reportId) {
          const found = availableReports.find(
            (r) => r.reportId.toLowerCase() === entry.reportId?.toLowerCase()
          );
          if (found) {
            setInlineSearchedReport(found);
            setTimeout(() => {
              document.getElementById('inline-report-display-container')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 120);
            return;
          }
        }
        setInlinePendingSample({
          tokenNumber: entry.tokenNumber || 'Token',
          patientName: entry.patientName || 'Patient',
          ageGender: `${entry.age || '-'} Yrs / ${entry.gender || '-'}`,
          tests: entry.tests || [],
          registeredAt: entry.registeredAt || 'Today',
          status: entry.status || 'Sample Under Testing',
          technicianStatus: entry.technicianStatus || 'Processing in Lab',
          branchName: entry.branchName || labName,
        });
        setTimeout(() => {
          document.getElementById('inline-report-display-container')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 120);
      } else {
        setInlineSearchNotFound(true);
      }
    } else {
      // Search by Token Number or Report ID
      const cleanVal = val.toLowerCase();
      const cleanDigits = val.replace(/\D/g, '');

      // Special sample alias mapping:
      // RPT-2026-001 -> maps to availableReports[0]
      // RPT-2026-002 -> maps to availableReports[1] || availableReports[0]
      if (cleanVal === 'rpt-2026-001' && availableReports.length > 0) {
        setInlineSearchedReport(availableReports[0]);
        setTimeout(() => {
          document.getElementById('inline-report-display-container')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 120);
        return;
      }
      if (cleanVal === 'rpt-2026-002' && availableReports.length > 1) {
        setInlineSearchedReport(availableReports[1]);
        setTimeout(() => {
          document.getElementById('inline-report-display-container')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 120);
        return;
      }

      // 1. Direct match in reports by reportId, tokenNumber, or UHID
      const foundReport = availableReports.find(
        (r) =>
          r.reportId.toLowerCase() === cleanVal ||
          (r.tokenNumber && (
            r.tokenNumber.toLowerCase() === cleanVal ||
            r.tokenNumber.toLowerCase() === `tk-${cleanVal}` ||
            `tk-${r.tokenNumber.toLowerCase()}` === cleanVal ||
            (cleanDigits && r.tokenNumber.replace(/\D/g, '') === cleanDigits)
          )) ||
          (r.uhid && r.uhid.toLowerCase() === cleanVal) ||
          r.reportId.toLowerCase().includes(cleanVal)
      );

      if (foundReport) {
        setInlineSearchedReport(foundReport);
        setTimeout(() => {
          document.getElementById('inline-report-display-container')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 120);
        return;
      }

      // 2. Check if it matches an entry by token number or reportId
      const foundEntry = availableEntries.find(
        (e) => {
          const entryToken = (e.tokenNumber || '').toLowerCase().trim();
          const entryTokenDigits = entryToken.replace(/\D/g, '');
          return (
            entryToken === cleanVal ||
            entryToken === `tk-${cleanVal}` ||
            `tk-${entryToken}` === cleanVal ||
            (cleanDigits && entryTokenDigits === cleanDigits) ||
            (e.reportId && e.reportId.toLowerCase() === cleanVal) ||
            (e.uhid && e.uhid.toLowerCase() === cleanVal)
          );
        }
      );

      if (foundEntry) {
        if (foundEntry.reportId) {
          const relReport = availableReports.find(
            (r) => r.reportId.toLowerCase() === foundEntry.reportId?.toLowerCase()
          );
          if (relReport) {
            setInlineSearchedReport(relReport);
            setTimeout(() => {
              document.getElementById('inline-report-display-container')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 120);
            return;
          }
        }

        setInlinePendingSample({
          tokenNumber: foundEntry.tokenNumber || val,
          patientName: foundEntry.patientName || 'Patient',
          ageGender: `${foundEntry.age || '-'} Yrs / ${foundEntry.gender || '-'}`,
          tests: foundEntry.tests || [],
          registeredAt: foundEntry.registeredAt || 'Today',
          status: foundEntry.status || 'Sample Under Testing',
          technicianStatus: foundEntry.technicianStatus || 'Processing in Lab',
          branchName: foundEntry.branchName || labName,
        });
        setTimeout(() => {
          document.getElementById('inline-report-display-container')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 120);
      } else {
        setInlineSearchNotFound(true);
      }
    }
  };

  const handleQuickReportSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    performInlineReportSearch();
  };

  const handleDownloadInlinePdf = async () => {
    if (!inlineSearchedReport) return;
    try {
      setIsDownloadingPdf(true);
      await generateReportPdf(inlineSearchedReport);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintInlineReport = async () => {
    if (!inlineSearchedReport) return;
    try {
      const printed = await printCanonicalReportPdf(inlineSearchedReport);
      if (!printed) {
        safePrint();
      }
    } catch {
      safePrint();
    }
  };

  // Home collection booking form state
  const [patientName, setPatientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [bookingDate, setBookingDate] = useState('Tomorrow Morning (7:00 AM - 9:00 AM)');
  const [selectedTestOrPackage, setSelectedTestOrPackage] = useState(
    vendorPackages[0] ? `${vendorPackages[0].name} (₹${vendorPackages[0].priceINR})` : 'Full Body Health Checkup (₹999)'
  );

  // Contact Us Inquiry Form State
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('Test Inquiry & Pricing');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactRefId, setContactRefId] = useState('');
  const [contactError, setContactError] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');

    if (!contactName.trim()) {
      setContactError('Please enter your full name.');
      return;
    }

    const cleanNum = contactPhone.replace(/\D/g, '');
    if (cleanNum.length < 10) {
      setContactError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setContactSubmitting(true);
    setTimeout(() => {
      const generatedRef = `INQ-${Math.floor(100000 + Math.random() * 900000)}`;
      setContactRefId(generatedRef);
      addContactSubmission({
        name: contactName.trim(),
        phone: cleanNum,
        email: contactEmail?.trim() || undefined,
        subject: contactSubject?.trim() || 'General Test Inquiry',
        message: contactMessage?.trim() || 'Website inquiry received',
        labId: currentLabItem?.id || vendorLabSettings?.labId || selectedVendorLabId || 'lab-apex',
        referenceToken: generatedRef,
      });
      setContactSubmitting(false);
      setContactSubmitted(true);
    }, 500);
  };

  const handleCopyText = (text: string, type: 'phone' | 'email') => {
    try {
      navigator.clipboard.writeText(text);
      if (type === 'phone') {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      } else {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      }
    } catch {}
  };

  const categories = [
    'All',
    'Hematology',
    'Biochemistry',
    'Thyroid & Hormones',
    'Diabetes',
    'Vitamins & Minerals',
    'Urine Analysis',
  ];

  // Section 4: Book Test Section Category Tabs
  const BOOK_TEST_CATEGORY_TABS = [
    'All',
    'Hematology',
    'Biochemistry',
    'Thyroid & Hormones',
    'Diabetes',
    'Vitamins',
    'Urine Analysis',
  ];

  const isTestInBookCategory = (test: any, cat: string) => {
    if (cat === 'All') return true;
    const catLower = cat.toLowerCase();
    const tCat = (test.category || '').toLowerCase();
    const tName = (test.name || '').toLowerCase();
    const tCode = (test.code || '').toLowerCase();

    if (cat === 'Hematology') {
      return (
        tCat.includes('hematology') ||
        tCat.includes('blood') ||
        tName.includes('cbc') ||
        tName.includes('esr') ||
        tName.includes('hemogram') ||
        tCode.includes('hem')
      );
    }
    if (cat === 'Biochemistry') {
      return (
        tCat.includes('biochemistry') ||
        tName.includes('lft') ||
        tName.includes('kft') ||
        tName.includes('liver') ||
        tName.includes('kidney') ||
        tName.includes('lipid') ||
        tCode.includes('bio')
      );
    }
    if (cat === 'Thyroid & Hormones') {
      return (
        tCat.includes('thyroid') ||
        tCat.includes('hormone') ||
        tName.includes('tsh') ||
        tName.includes('thyroid') ||
        tName.includes('t3') ||
        tName.includes('t4') ||
        tCode.includes('thy')
      );
    }
    if (cat === 'Diabetes') {
      return (
        tCat.includes('diabetes') ||
        tName.includes('hba1c') ||
        tName.includes('glucose') ||
        tName.includes('sugar') ||
        tName.includes('insulin')
      );
    }
    if (cat === 'Vitamins') {
      return (
        tCat.includes('vitamin') ||
        tName.includes('vitamin') ||
        tName.includes('d3') ||
        tName.includes('b12') ||
        tName.includes('calcium') ||
        tCode.includes('vit')
      );
    }
    if (cat === 'Urine Analysis') {
      return (
        tCat.includes('urine') ||
        tCat.includes('stool') ||
        tName.includes('urine') ||
        tName.includes('stool') ||
        tCode.includes('urn')
      );
    }
    return tCat.includes(catLower) || tName.includes(catLower);
  };

  const getTestDetails = (test: any) => {
    const name = test.name || '';
    const price = test.priceINR || 350;
    const mrp = test.mrpINR || Math.round(price * 1.85);
    const discount = Math.max(15, Math.round(((mrp - price) / mrp) * 100));
    const turnaround = test.turnaroundTime || '4-6 Hours';
    const sample = test.sampleType || 'Whole Blood (EDTA)';
    const code = test.code || 'LAB-01';

    const isFastingRequired =
      name.toLowerCase().includes('lipid') ||
      name.toLowerCase().includes('sugar') ||
      name.toLowerCase().includes('glucose') ||
      name.toLowerCase().includes('fasting') ||
      name.toLowerCase().includes('kft');

    const fastingLabel = isFastingRequired
      ? '10-12 Hours Fasting Required'
      : 'No Fasting Required (Can be given anytime)';

    const fastingDetail = isFastingRequired
      ? 'Overnight fasting for 10-12 hours is required before sample collection. Do not consume tea, coffee, milk, or breakfast. Plain drinking water is permitted.'
      : 'No fasting required. You may follow your normal dietary and medication schedule prior to sample collection.';

    let clinicalUse = test.description || 'Clinical diagnostic blood/specimen test used to assess physiological markers and detect medical conditions.';
    if (name.includes('CBC')) {
      clinicalUse = 'Complete 24-parameter automated cell counter analysis (Hemoglobin, RBC, WBC, Platelets, MCV). Essential for detecting viral/bacterial infections, anemia, fatigue, and blood disorders.';
    } else if (name.includes('HbA1c')) {
      clinicalUse = 'Gold standard 3-month average blood glucose control analysis via HPLC. Highly accurate for diabetic diagnosis, quarterly monitoring, and pre-diabetic risk evaluation.';
    } else if (name.includes('Thyroid') || name.includes('TSH')) {
      clinicalUse = 'Assesses Thyroid Stimulating Hormone (TSH), Total T3, and Total T4. Crucial for diagnosing Hypothyroidism, Hyperthyroidism, unexplained weight changes, lethargy, and hair loss.';
    } else if (name.includes('Lipid')) {
      clinicalUse = 'Measures Total Cholesterol, HDL (good cholesterol), LDL (bad cholesterol), and Triglycerides. Evaluates cardiac risk, arterial health, and blood vessel wellness.';
    } else if (name.includes('Vitamin D')) {
      clinicalUse = '25-Hydroxy Vitamin D level check essential for bone calcium absorption, joint strength, muscle wellness, and immune resistance.';
    } else if (name.includes('Vitamin B12')) {
      clinicalUse = 'Serum Cyanocobalamin evaluation vital for nervous system health, red blood cell generation, memory clarity, and preventing tingling sensations.';
    } else if (name.includes('LFT') || name.includes('Liver')) {
      clinicalUse = 'Screens liver enzymes (SGOT, SGPT, Bilirubin, Alkaline Phosphatase, Albumin) to evaluate liver health, fatty liver, jaundice, or medication load.';
    } else if (name.includes('KFT') || name.includes('Kidney')) {
      clinicalUse = 'Assesses Serum Creatinine, Blood Urea, and Uric Acid to assess kidney filtration, hydration, and renal clearance rate.';
    } else if (name.includes('Urine')) {
      clinicalUse = 'Physical, chemical, and microscopic urine screen for pus cells, RBCs, protein, sugar, and crystals. Rapidly flags Urinary Tract Infection (UTI) and kidney stones.';
    }

    const lowerName = name.toLowerCase();
    let testFor = test.testFor || '';
    if (!testFor) {
      if (lowerName.includes('cbc') || lowerName.includes('hemogram') || lowerName.includes('blood count') || lowerName.includes('esr')) {
        testFor = 'Infections, Anemia & Blood Health';
      } else if (lowerName.includes('hba1c') || lowerName.includes('sugar') || lowerName.includes('glucose') || lowerName.includes('insulin')) {
        testFor = 'Diabetes & Blood Sugar Monitoring';
      } else if (lowerName.includes('thyroid') || lowerName.includes('tsh') || lowerName.includes('t3') || lowerName.includes('t4')) {
        testFor = 'Thyroid Gland & Hormone Balance';
      } else if (lowerName.includes('lipid') || lowerName.includes('cholesterol') || lowerName.includes('triglyceride')) {
        testFor = 'Heart Health & Cholesterol Risk';
      } else if (lowerName.includes('vitamin d') || lowerName.includes('d3')) {
        testFor = 'Bone Strength & Calcium Absorption';
      } else if (lowerName.includes('vitamin b12') || lowerName.includes('b12')) {
        testFor = 'Nerve Function & Red Blood Cells';
      } else if (lowerName.includes('lft') || lowerName.includes('liver') || lowerName.includes('bilirubin') || lowerName.includes('sgot') || lowerName.includes('sgpt')) {
        testFor = 'Liver Enzymes & Hepatic Function';
      } else if (lowerName.includes('kft') || lowerName.includes('kidney') || lowerName.includes('creatinine') || lowerName.includes('urea') || lowerName.includes('uric')) {
        testFor = 'Kidney Filtration & Renal Wellness';
      } else if (lowerName.includes('urine') || lowerName.includes('urinary')) {
        testFor = 'UTI, Kidney Stones & Metabolic Check';
      } else if (lowerName.includes('iron') || lowerName.includes('ferritin') || lowerName.includes('tibc')) {
        testFor = 'Iron Deficiency & Anemia Screen';
      } else if (lowerName.includes('electrolyte') || lowerName.includes('sodium') || lowerName.includes('potassium')) {
        testFor = 'Electrolyte & Hydration Balance';
      } else if (lowerName.includes('dengue') || lowerName.includes('malaria') || lowerName.includes('widal') || lowerName.includes('typhoid')) {
        testFor = 'Fever Cause & Viral/Parasite Screen';
      } else if (lowerName.includes('calcium')) {
        testFor = 'Bone Density & Calcium Levels';
      } else if (test.category) {
        testFor = `${test.category} Diagnostic Screening`;
      } else {
        testFor = 'Clinical Diagnostic & Health Check';
      }
    }

    return {
      price,
      mrp,
      discount,
      turnaround,
      sample,
      code,
      isFastingRequired,
      fastingLabel,
      fastingDetail,
      clinicalUse,
      testFor,
    };
  };

  const handleToggleCartItem = (test: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const testId = String(test.id || test.code || test.name);
    const testPrice = test.priceINR || 350;
    const exists = cartItems.some(
      (item) => item.id === testId || item.name.toLowerCase() === test.name.toLowerCase()
    );

    if (exists) {
      setCartItems((prev) =>
        prev.filter((item) => item.id !== testId && item.name.toLowerCase() !== test.name.toLowerCase())
      );
    } else {
      const newItem = {
        id: testId,
        name: test.name,
        price: testPrice,
        code: test.code,
        category: test.category,
        sampleType: test.sampleType,
        turnaroundTime: test.turnaroundTime,
      };
      setCartItems((prev) => [...prev, newItem]);
    }
  };

  const handleRemoveFromCart = (testId: string, testName: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.id !== testId && item.name.toLowerCase() !== testName.toLowerCase())
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
    setIsCartDrawerOpen(false);
  };

  const handleProceedToBooking = () => {
    if (cartItems.length === 0) return;
    setIsCartDrawerOpen(false);
    setIsBookingModalOpen(true);
  };

  const cartTotalPrice = cartItems.reduce((acc, item) => acc + item.price, 0);

  const handleBookTestClick = (e: React.MouseEvent, test: any) => {
    e.stopPropagation();
    handleToggleCartItem(test);
  };

  const filteredTests = vendorTests.filter((test) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      test.name.toLowerCase().includes(term) ||
      (test.code && test.code.toLowerCase().includes(term)) ||
      (test.category && test.category.toLowerCase().includes(term));
    const matchesCategory =
      selectedBookTestCategory === 'All' || isTestInBookCategory(test, selectedBookTestCategory);
    return matchesSearch && matchesCategory;
  });

  const displayedTests = filteredTests.slice(0, visibleTestsCount);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addHomeCollectionBooking({
      patientName,
      mobile: mobileNumber,
      address,
      timeSlot: bookingDate,
      packageOrTest: selectedTestOrPackage,
    });
    setBookedSuccess(true);
    handleClearCart();
  };

  const handleWhatsAppBooking = (testName: string, price?: number) => {
    const text = encodeURIComponent(
      `Hello Apex Diagnostic Lab, I would like to book "${testName}"${
        price ? ` (₹${price})` : ''
      }. Please confirm home sample collection slot.`
    );
    window.open(`https://wa.me/917087033009?text=${text}`, '_blank');
  };

  // Check if website is in Draft mode (Not Approved/Published by Admin)
  // When a website is created, it starts in Draft mode; until Super Admin publishes it, visit/preview is locked.
  const isDraftOrPending = currentLabItem ? currentLabItem.status !== 'Active' || !currentLabItem.isWebsiteApproved : false;

  if (isDraftOrPending) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
              HQ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">{currentLabItem?.name || labName}</span>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>Draft Mode (Pending Approval)</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser?.role === 'admin' ? (
              <button
                type="button"
                onClick={onOpenAdminDashboard}
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>← Super Admin Dashboard</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenSoftwareWebsite}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>🏠 Main Portal</span>
              </button>
            )}
          </div>
        </header>

        {/* Central Draft Lock Box - Light Theme Only */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-lg w-full bg-white border border-amber-300 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Lock Icon */}
            <div className="relative inline-flex items-center justify-center">
              <div className="w-18 h-18 rounded-3xl bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-amber-600 shadow-inner">
                <Lock className="w-9 h-9" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-sm">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Titles & Message in English Only */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                <span>⚠️ Website In Draft Mode • Pending Admin Approval</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Website In Draft Mode
              </h1>
              <p className="text-sm font-semibold text-amber-800">
                This website will not be live or accessible for visit until the Admin publishes it.
              </p>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed pt-1">
                This laboratory website was created and is currently in <strong>Draft Status</strong>. Public visit, patient bookings, and diagnostic catalog are locked until Super Admin reviews and approves it.
              </p>
            </div>

            {/* Contact Support Box */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="font-extrabold text-amber-950 flex items-center justify-center gap-1.5 text-sm">
                <Phone className="w-4 h-4 text-amber-700" />
                <span>Contact with 7087033009</span>
              </div>
              <p className="text-[11px] text-slate-600">
                For approval, verification, or administrative queries, contact central support:
              </p>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <a
                  href="tel:+917087033009"
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                  <span>Call: 7087033009</span>
                </a>
                <a
                  href="https://wa.me/917087033009?text=Hello%20Admin,%20I%20need%20approval%20and%20activation%20for%20my%20laboratory%20website"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-white" />
                  <span>WhatsApp: 7087033009</span>
                </a>
              </div>
            </div>

            {/* Lab Info Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Laboratory:</span>
                <span className="font-bold text-slate-900 text-right">{currentLabItem?.name || labName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Owner / City:</span>
                <span className="font-medium text-slate-700">{currentLabItem?.ownerName || 'Lab Owner'} • {currentLabItem?.city || 'India'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                  Draft (Pending Approval)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {currentUser?.role === 'admin' ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentLabItem) {
                        setVendorStatus(currentLabItem.id, 'Active');
                      }
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Approve & Publish Live Now</span>
                  </button>
                  <p className="text-[11px] text-slate-500">
                    Clicking "Approve" will make this website instantly live and move the laboratory to "Our Clients".
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={onOpenSoftwareWebsite}
                    className="w-full bg-[#123B6D] hover:bg-[#0e2c52] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-xs"
                  >
                    Return to Main Portal
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 1. ISOLATED FIRST SCREEN GATEWAY (Pure Welcome Screen - No Scrolling into Website)
  // Shown exclusively until user clicks "Visit Website", "Book Test", or "Check Report"
  if (!hasEnteredWebsite) {
    return (
      <div className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-950 font-sans">
        <LabWelcomeFirstScreen
          labName={labName}
          labShopId={labShopId}
          labLogoUrl={labLogoUrl}
          labNabl={labNabl}
          labAddress={labAddress}
          labPhone={labPhone}
          backgroundImageUrl={vendorLabSettings?.heroBackgroundImageUrl}
          onVisitWebsite={() => {
            setHasEnteredWebsite(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBookTest={() => {
            setHasEnteredWebsite(true);
            setSelectedTestOrPackage(
              vendorPackages[0] ? `${vendorPackages[0].name} (₹${vendorPackages[0].priceINR})` : 'Full Body Health Checkup (₹999)'
            );
            setIsBookingModalOpen(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onCheckReport={() => {
            handleCheckReport();
          }}
          onStaffLogin={() => openLoginModal('vendor')}
          onOpenSoftwareWebsite={onOpenSoftwareWebsite}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans selection:bg-[#123B6D]/15 selection:text-[#123B6D]">
      {/* Super Admin Website Live Control & Status Banner */}
      {currentUser?.role === 'admin' && (
        <div className="bg-slate-950 text-white px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shadow-md sticky top-0 z-50">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
              Super Admin Mode
            </span>
            <span className="text-slate-300">
              Previewing Lab Website: <strong className="text-white">{labName}</strong>
            </span>
            {currentLabItem?.status === 'Draft' ? (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Status: DRAFT (Pending Approval)</span>
              </span>
            ) : (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Status: LIVE (Approved & Active)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {currentLabItem && (currentLabItem.status !== 'Active' || !currentLabItem.isWebsiteApproved) && (
              <button
                type="button"
                onClick={() => {
                  setVendorStatus(currentLabItem.id, 'Active');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Website (Make Live)</span>
              </button>
            )}

            {currentLabItem && currentLabItem.status !== 'Draft' && (
              <button
                type="button"
                onClick={() => {
                  setVendorStatus(currentLabItem.id, 'Draft');
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Move to Draft</span>
              </button>
            )}

            {onOpenAdminDashboard && (
              <button
                type="button"
                onClick={onOpenAdminDashboard}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-slate-700"
              >
                <span>← Back to Super Admin Dashboard</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSoftwareWebsite}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition cursor-pointer shadow-xs"
              title="Go to IndianLalaji.com Home Portal"
            >
              <span>🏠 Main Portal Home</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Lab Header */}
      <header id="main-website-header" className="sticky top-0 bg-white border-b border-slate-200 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Lab Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 sm:gap-3 text-left cursor-pointer group min-w-0"
              id="vendor-header-logo-btn"
            >
              {labLogoUrl ? (
                <img
                  src={labLogoUrl}
                  alt={labName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-xl object-contain bg-white border border-slate-200 p-0.5 shadow-2xs group-hover:scale-105 transition shrink-0"
                />
              ) : (
                <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-xl bg-[#123B6D] text-white flex items-center justify-center font-black text-xs xs:text-sm sm:text-lg shadow-2xs group-hover:scale-105 transition shrink-0">
                  <span className="text-amber-400">{labName.charAt(0) || 'A'}</span>
                  <span>{labName.split(' ')[1]?.charAt(0) || 'L'}</span>
                </div>
              )}
              <div className="flex flex-col justify-center min-w-0">
                <div className="text-xs xs:text-sm sm:text-base lg:text-lg font-black tracking-tight text-[#123B6D] leading-tight truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[220px] md:max-w-none">
                  {labName.toUpperCase()}
                </div>
                <div className="text-[9px] xs:text-[10px] sm:text-[11px] text-slate-500 font-semibold tracking-wide flex items-center gap-1 whitespace-nowrap mt-0.5">
                  <span className="hidden xs:inline">ID:</span>
                  <span className="font-mono font-bold text-[#123B6D] bg-slate-100 px-1 py-0.2 rounded text-[9px] xs:text-[10px] border border-slate-200">
                    {labShopId}
                  </span>
                  <span className="hidden sm:inline-block text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px] border border-emerald-200">
                    • {labNabl}
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links: Balanced & Clean */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs lg:text-sm font-semibold text-slate-700 whitespace-nowrap">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-[#123B6D] transition cursor-pointer text-[#123B6D] font-bold whitespace-nowrap py-1"
              id="vendor-nav-home"
            >
              Home
            </button>

            <a
              href="#packages"
              className="hover:text-[#123B6D] transition text-slate-700 hover:font-bold whitespace-nowrap py-1"
              id="vendor-nav-packages"
            >
              Packages
            </a>

            <a
              href="#test-directory"
              className="hover:text-[#123B6D] transition text-slate-700 hover:font-bold whitespace-nowrap py-1"
              id="vendor-nav-tests"
            >
              Tests
            </a>

            <a
              href="#lab-test-health-booking"
              className="hover:text-[#123B6D] transition text-slate-700 hover:font-bold whitespace-nowrap py-1"
              id="vendor-nav-booking"
            >
              Booking
            </a>

            <a
              href="#about"
              className="hover:text-[#123B6D] transition text-slate-700 hover:font-bold whitespace-nowrap py-1"
              id="vendor-nav-about"
            >
              About
            </a>

            <a
              href="#doctors"
              className="hover:text-[#123B6D] transition text-slate-700 hover:font-bold whitespace-nowrap py-1"
              id="vendor-nav-team"
            >
              Team
            </a>

            <a
              href="#contact"
              className="hover:text-[#123B6D] transition text-slate-700 hover:font-bold whitespace-nowrap py-1"
              id="vendor-nav-contact"
            >
              Contact
            </a>
          </nav>

          {/* Action Items: Mobile (Report + Test + Menu) | Desktop (Language + QR + Report + Test + Login) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop Language Selector */}
            <div
              className="hidden xl:flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 rounded-lg px-2 py-1.5 border border-slate-200 text-xs text-slate-700 font-semibold transition cursor-pointer shrink-0"
              title="Change Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-[#123B6D] shrink-0" />
              <select
                id="vendor-header-language-select"
                aria-label="Select website language"
                value={language}
                onChange={(e) => onSelectLanguage?.(e.target.value as Language)}
                className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none cursor-pointer pr-0.5"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="pa">ਪੰਜਾਬੀ</option>
              </select>
            </div>

            {/* Desktop Payment QR Button */}
            <button
              onClick={() => setIsPaymentQrModalOpen(true)}
              className="hidden lg:inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition cursor-pointer shadow-2xs shrink-0"
              id="header-payment-qr-btn"
              title="Scan Lab Payment QR Code"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Payment QR</span>
            </button>

            {/* 1. Report Button (Scrolls directly to Check & Download section on same page) */}
            <button
              onClick={() => {
                const el = document.getElementById('check-report-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  handleCheckReport();
                }
              }}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-300/90 font-bold text-xs transition cursor-pointer shadow-2xs shrink-0 active:scale-95"
              id="header-download-report-btn"
              title={`Check or Download Patient Lab Report for ${labName}`}
            >
              <FileText className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
              <span className="hidden sm:inline">Report</span>
              <span className="sm:hidden text-[11px]">Report</span>
            </button>

            {/* 2. Test Button (Scrolls to Lab Test & Health Booking Form Section) */}
            <button
              onClick={() => {
                const el = document.getElementById('lab-test-health-booking');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setSelectedTestOrPackage(
                    vendorPackages[0] ? `${vendorPackages[0].name} (₹${vendorPackages[0].priceINR})` : 'Full Body Health Checkup (₹999)'
                  );
                  setIsBookingModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-2xs shrink-0 active:scale-95"
              id="header-book-test-btn"
              title="Book Lab Test & Health Booking"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <span>Test</span>
            </button>

            {/* 3. Menu Icon (Hamburger: opens Side Drawer on Mobile) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 xs:p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 lg:hidden transition cursor-pointer shrink-0"
              aria-label="Open Navigation Menu Drawer"
              id="header-mobile-menu-btn"
            >
              <Menu className="w-5 h-5 text-slate-800" />
            </button>
          </div>
        </div>

        {/* Mobile Slide-Over Side Drawer with all 9 links & actions */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-over Drawer Panel */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
              <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
                {/* Drawer Header */}
                <div className="px-5 py-4 bg-[#123B6D] text-white flex items-center justify-between border-b border-blue-900/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {labLogoUrl ? (
                      <img
                        src={labLogoUrl}
                        alt={labName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-xl object-contain bg-white p-0.5 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                        <span className="text-amber-400">{labName.charAt(0) || 'A'}</span>
                        <span>{labName.split(' ')[1]?.charAt(0) || 'L'}</span>
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold text-sm text-white truncate leading-tight">
                        {labName}
                      </span>
                      <span className="text-[10px] text-blue-200 font-mono">
                        ID: {labShopId} • {labNabl}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition cursor-pointer shrink-0"
                    aria-label="Close Navigation Drawer"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Primary Quick Action Buttons */}
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      const el = document.getElementById('check-report-section');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        handleCheckReport();
                      }
                    }}
                    className="py-2.5 px-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-2xs active:scale-98 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-[#0F766E]" />
                    <span>Report Portal</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      const el = document.getElementById('lab-test-health-booking');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        setSelectedTestOrPackage(
                          vendorPackages[0] ? `${vendorPackages[0].name} (₹${vendorPackages[0].priceINR})` : 'Full Body Health Checkup (₹999)'
                        );
                        setIsBookingModalOpen(true);
                      }
                    }}
                    className="py-2.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-2xs active:scale-98 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-slate-950" />
                    <span>Book Test</span>
                  </button>
                </div>

                {/* Scrollable Navigation Links (Home, Packages, Tests, About, Team, Contact) */}
                <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-1 text-sm font-semibold text-slate-700">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-1">
                    Quick Links
                  </div>

                  {/* 1. Home */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-slate-100 transition flex items-center gap-3 text-slate-800 font-bold cursor-pointer"
                  >
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#123B6D] flex items-center justify-center text-xs">🏠</span>
                    <span>Home</span>
                  </button>

                  {/* 2. Packages */}
                  <a
                    href="#packages"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-slate-100 transition flex items-center gap-3 text-slate-800 font-bold cursor-pointer"
                  >
                    <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-xs">📦</span>
                    <span>Packages</span>
                  </a>

                  {/* 3. Tests */}
                  <a
                    href="#test-directory"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-slate-100 transition flex items-center gap-3 text-slate-800 font-bold cursor-pointer"
                  >
                    <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center text-xs">🔬</span>
                    <span>Tests Directory</span>
                  </a>

                  {/* 3b. Lab Test & Health Booking */}
                  <a
                    href="#lab-test-health-booking"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-slate-100 transition flex items-center gap-3 text-slate-800 font-bold cursor-pointer"
                  >
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs">📝</span>
                    <span>Book Test Online</span>
                  </a>

                  {/* 4. About */}
                  <a
                    href="#about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-slate-100 transition flex items-center gap-3 text-slate-800 font-bold cursor-pointer"
                  >
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs">ℹ️</span>
                    <span>About</span>
                  </a>

                  {/* 5. Team */}
                  <a
                    href="#doctors"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-slate-100 transition flex items-center gap-3 text-slate-800 font-bold cursor-pointer"
                  >
                    <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center text-xs">👨‍⚕️</span>
                    <span>Team (Pathologists)</span>
                  </a>

                  {/* 6. Contact */}
                  <a
                    href="#contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-slate-100 transition flex items-center gap-3 text-slate-800 font-bold cursor-pointer"
                  >
                    <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center text-xs">📍</span>
                    <span>Contact &amp; Location</span>
                  </a>

                  {/* Payment QR Button in Drawer */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsPaymentQrModalOpen(true);
                    }}
                    className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-amber-50 text-amber-900 border border-amber-200 transition flex items-center justify-between text-xs font-bold cursor-pointer mt-2"
                  >
                    <span className="flex items-center gap-2.5">
                      <QrCode className="w-4 h-4 text-amber-600" />
                      <span>Lab Payment QR Code</span>
                    </span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-black">
                      UPI
                    </span>
                  </button>
                </div>

                {/* Drawer Footer Actions (8. Staff Login, 9. T&C, Language, Call Support) */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2.5">
                  {/* 8. Staff Login */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openLoginModal('vendor');
                    }}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white font-bold text-xs flex items-center justify-between shadow-xs transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-300" />
                      <span>Staff Login (Admin / Tech / Rec)</span>
                    </span>
                    <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black">
                      Portal
                    </span>
                  </button>

                  {/* 9. Terms & Conditions Modal Opener */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsTermsModalOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Terms &amp; Conditions (T&amp;C)</span>
                    </span>
                    <span className="text-slate-400 text-xs font-bold">View →</span>
                  </button>

                  {/* Language Selector */}
                  <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white border border-slate-200">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Globe className="w-3.5 h-3.5 text-[#123B6D]" />
                      <span>Language / भाषा:</span>
                    </span>
                    <select
                      aria-label="Select website language"
                      value={language}
                      onChange={(e) => onSelectLanguage?.(e.target.value as Language)}
                      className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी</option>
                      <option value="pa">ਪੰਜਾਬੀ</option>
                    </select>
                  </div>

                  {/* Call Helpline Direct */}
                  <a
                    href={`tel:${cleanPhone}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-2 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs"
                  >
                    📞 Call Lab Helpline: +91 {cleanPhone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* SECTION 1: HERO SECTION (Image Banners Carousel with 2%-5% Mobile Peek Effect) */}
      <section id="top" className="bg-gradient-to-b from-[#F8FAFC] via-slate-50 to-white py-3.5 sm:py-6 border-b border-slate-200 scroll-mt-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 space-y-3.5 sm:space-y-5">
          {/* Main Photo Banner Carousel Container */}
          <div className="relative">

            {/* Carousel Track with 2%-5% Peek Effect on Mobile */}
            <div
              ref={heroCarouselRef}
              onTouchStart={handleHeroTouchStart}
              onTouchMove={handleHeroTouchMove}
              onTouchEnd={handleHeroTouchEnd}
              onMouseEnter={() => setIsHeroPaused(true)}
              onMouseLeave={() => setIsHeroPaused(false)}
              className="flex overflow-x-auto snap-x snap-mandatory gap-3 sm:gap-4 no-scrollbar px-2 sm:px-0 py-1 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {heroBannersList.map((bannerUrl, idx) => (
                <div
                  key={idx}
                  className="w-[94%] xs:w-[95%] sm:w-[95%] lg:w-full shrink-0 snap-center rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg relative bg-slate-950 aspect-[16/8] sm:aspect-[21/9] max-h-[360px] sm:max-h-[440px] group cursor-pointer border border-slate-200/80"
                  onClick={() => {
                    setSelectedTestOrPackage('Full Body Health Checkup (₹999)');
                    setIsBookingModalOpen(true);
                  }}
                  title="Click to Book Lab Tests"
                >
                  <img
                    src={bannerUrl}
                    alt={`${labName} Promotional Banner ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-101"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              ))}
            </div>

            {/* Desktop Navigation Arrows */}
            {heroBannersList.length > 1 && (
              <div className="hidden lg:flex items-center justify-between absolute top-1/2 -translate-y-1/2 left-3 right-3 pointer-events-none">
                <button
                  type="button"
                  onClick={() => setActiveHeroBanner((prev) => (prev - 1 + heroBannersList.length) % heroBannersList.length)}
                  className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition cursor-pointer pointer-events-auto active:scale-95 border border-slate-200 backdrop-blur-xs"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHeroBanner((prev) => (prev + 1) % heroBannersList.length)}
                  className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition cursor-pointer pointer-events-auto active:scale-95 border border-slate-200 backdrop-blur-xs"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-5 h-5 text-slate-700" />
                </button>
              </div>
            )}
          </div>

          {/* Carousel Indicators & Swipe Notification */}
          <div className="flex items-center justify-between px-3">
            {/* Pill Indicator Dots */}
            <div className="flex items-center gap-2">
              {heroBannersList.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveHeroBanner(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeHeroBanner === idx
                      ? 'w-8 bg-[#123B6D] shadow-xs'
                      : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to banner slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Mobile swipe hint */}
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <span className="sm:hidden text-slate-400 font-medium">👉 Swipe for next banner (2% peek)</span>
              <span className="hidden sm:inline">Banner {activeHeroBanner + 1} of {heroBannersList.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CHECK REPORT QUICK SECTION (Directly Below Hero Section) */}
      {/* SECTION 2: CHECK & DOWNLOAD PATIENT LAB REPORT (Follows exact CSS of Booking Form) */}
      <section
        id="check-report-section"
        className="py-14 sm:py-20 bg-gradient-to-b from-[#F8FAFC] via-slate-50 to-white border-b border-slate-200 scroll-mt-20"
      >
        <span id="check-report-quick" className="sr-only" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Section Header (Exact styling as Booking Form Header) */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0F766E]/10 text-[#0F766E] text-xs font-bold mb-2.5">
              <FileText className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Instant Lab Report Access</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123B6D] tracking-tight">
              Check &amp; Download Patient Lab Report
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5">
              Access your verified diagnostic reports directly using your registered mobile number or Token Number.
            </p>
          </div>

          {/* Center Card Container (Exact styling as HeroBookingForm) */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-3xl">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden relative">
                {/* Card Top Header (Exact gradient, icon, typography as HeroBookingForm header) */}
                <div className="bg-gradient-to-r from-[#123B6D] via-[#1a4a85] to-[#0F766E] p-4 text-white">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-white/10 text-amber-300 backdrop-blur-xs">
                        <FileText className="w-4 h-4" />
                      </span>
                      <div>
                        <h2 className="text-sm sm:text-base font-black tracking-tight leading-tight">
                          Patient Report Portal
                        </h2>
                        <p className="text-[11px] text-slate-200 font-medium">
                          Instant 10-Second Digital Report Download
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 text-[10px] font-bold text-amber-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                      <span>256-Bit Encrypted</span>
                    </div>
                  </div>

                  {/* Search Mode Pill Tabs (Exact styling as HeroBookingForm step pill indicator) */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickReportTab('mobile');
                        setQuickReportError('');
                      }}
                      className={`py-1 px-2 rounded-md flex items-center justify-center gap-1 transition cursor-pointer ${
                        quickReportTab === 'mobile'
                          ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span className="truncate">Search by Mobile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setQuickReportTab('report_id');
                        setQuickReportError('');
                      }}
                      className={`py-1 px-2 rounded-md flex items-center justify-center gap-1 transition cursor-pointer ${
                        quickReportTab === 'report_id'
                          ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <Hash className="w-3.5 h-3.5" />
                      <span className="truncate">Search by Token Number</span>
                    </button>
                  </div>
                </div>

                {/* Card Body (Exact styling as HeroBookingForm form body: p-4 space-y-3.5 text-xs) */}
                <div className="p-4 space-y-3.5 text-xs bg-white">
                  {/* Error Alert Banner */}
                  {quickReportError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-semibold flex-1">{quickReportError}</span>
                      <button
                        type="button"
                        onClick={() => setQuickReportError('')}
                        className="text-rose-500 hover:text-rose-800 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Fast Form Input Box (Exact font size, text, color, input padding as HeroBookingForm) */}
                  <form onSubmit={handleQuickReportSearch} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {quickReportTab === 'mobile'
                          ? '10-Digit Registered Mobile Number'
                          : 'Token Number / Report ID'} <span className="text-rose-500">*</span>
                      </label>

                      <div className="relative">
                        {quickReportTab === 'mobile' ? (
                          <>
                            <span className="absolute left-2.5 top-2 text-[11px] text-slate-500 font-bold select-none">
                              +91
                            </span>
                            <input
                              type="tel"
                              required
                              pattern="[0-9]{10}"
                              maxLength={10}
                              value={quickReportInput}
                              onChange={(e) => {
                                setQuickReportInput(e.target.value.replace(/\D/g, '').slice(0, 10));
                                if (quickReportError) setQuickReportError('');
                              }}
                              placeholder="Enter 10-digit registered mobile"
                              className="w-full pl-10 pr-8 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400 font-normal"
                              id="check-report-mobile-input"
                            />
                          </>
                        ) : (
                          <>
                            <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                              type="text"
                              required
                              value={quickReportInput}
                              onChange={(e) => {
                                setQuickReportInput(e.target.value);
                                if (quickReportError) setQuickReportError('');
                              }}
                              placeholder="Enter Token Number (e.g. 101, TK-101 or Report ID)"
                              className="w-full pl-8 pr-8 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400 font-normal"
                              id="check-report-token-input"
                            />
                          </>
                        )}

                        {quickReportInput && (
                          <button
                            type="button"
                            onClick={() => {
                              setQuickReportInput('');
                              setQuickReportError('');
                            }}
                            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Submit Button (Exact styling, font size, text, color, alignment as HeroBookingForm submit buttons) */}
                    <button
                      type="submit"
                      className="w-full bg-[#123B6D] hover:bg-[#0c294d] text-white py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98 mt-2"
                      id="check-report-submit-btn"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-300" />
                      <span>Check &amp; Download Patient Report</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                    </button>
                  </form>

                  {/* INLINE SEARCH NOT FOUND CARD */}
                  {inlineSearchNotFound && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>No Report Found</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInlineSearchNotFound(false)}
                          className="text-rose-500 hover:text-rose-800 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        No matching report found for your search query. Please double-check your registered 10-digit mobile number or Token Number.
                      </p>
                    </div>
                  )}

                  {/* INLINE PENDING SAMPLE TESTING STATUS CARD */}
                  {inlinePendingSample && (
                    <div id="inline-report-display-container" className="pt-2 border-t border-slate-100 animate-in fade-in zoom-in-98 duration-200">
                      <div className="bg-amber-50/70 rounded-2xl p-4 sm:p-5 border border-amber-200 text-slate-800 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-amber-200/80">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                              ⏱️
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                                Sample Under Analysis
                              </span>
                              <h3 className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                                {inlinePendingSample.patientName} (Token #{inlinePendingSample.tokenNumber})
                              </h3>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setInlinePendingSample(null)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-[11px] transition cursor-pointer"
                          >
                            ✕ Close
                          </button>
                        </div>

                        <div className="space-y-1.5 text-xs text-amber-900">
                          <p className="font-medium text-slate-700">
                            Your sample was registered at <strong>{inlinePendingSample.registeredAt}</strong> and is currently being processed by the laboratory team.
                          </p>
                          {inlinePendingSample.tests.length > 0 && (
                            <div className="flex items-start gap-1.5 text-slate-700">
                              <span className="font-bold text-[#123B6D]">Booked Tests:</span>
                              <span>{inlinePendingSample.tests.join(', ')}</span>
                            </div>
                          )}
                          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-800 font-bold">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Report will appear right here as soon as approved and published by the pathologist.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* INLINE DISPLAY OF REPORT ON SAME PAGE */}
                  {inlineSearchedReport && (
                    <div id="inline-report-display-container" className="pt-2 border-t border-slate-100 animate-in fade-in zoom-in-98 duration-200">
                      <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-200 text-slate-800 space-y-4">
                        {/* 1. Header Bar: Lab Name, Status & Close Button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center font-bold text-sm shrink-0">
                              ✓
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                                  Verified &amp; Published
                                </span>
                                <span className="text-[11px] font-bold text-slate-400">
                                  ISO 15189 • NABL Accredited
                                </span>
                              </div>
                              <h3 className="text-sm sm:text-base font-black text-[#123B6D] mt-0.5">
                                {inlineSearchedReport.labName || labName}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {/* Multiple Reports Selector if found > 1 */}
                            {inlineMultipleReports.length > 1 && (
                              <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                                <span className="text-[10px] font-bold text-slate-500">Reports:</span>
                                <select
                                  value={inlineSearchedReport.reportId}
                                  onChange={(e) => {
                                    const rep = inlineMultipleReports.find(r => r.reportId === e.target.value);
                                    if (rep) setInlineSearchedReport(rep);
                                  }}
                                  className="text-xs font-bold bg-transparent text-slate-800 cursor-pointer focus:outline-none"
                                >
                                  {inlineMultipleReports.map((r, i) => (
                                    <option key={r.reportId || i} value={r.reportId}>
                                      {r.reportId} ({r.patientName})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* Close Button to Reset */}
                            <button
                              type="button"
                              onClick={() => {
                                setInlineSearchedReport(null);
                                setInlineMultipleReports([]);
                                setInlinePendingSample(null);
                                setInlineSearchNotFound(false);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                              title="Close report viewer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Close</span>
                            </button>
                          </div>
                        </div>

                        {/* 2. Patient Demographics & Report Meta Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white border border-slate-200 p-3 rounded-xl text-xs">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Patient Name</span>
                            <span className="text-xs sm:text-sm font-black text-slate-900">{inlineSearchedReport.patientName}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Age / Gender</span>
                            <span className="font-bold text-slate-800">{inlineSearchedReport.ageGender || `${inlineSearchedReport.mobile ? 'Adult' : '-'}`}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Report ID / UHID</span>
                            <span className="font-mono font-bold text-[#123B6D]">{inlineSearchedReport.reportId}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Sample Date</span>
                            <span className="font-bold text-slate-800">{inlineSearchedReport.sampleCollectedAt || inlineSearchedReport.reportedAt || 'Today'}</span>
                          </div>
                        </div>

                        {/* 3. Investigation Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#123B6D] text-white uppercase text-[10px] font-black tracking-wider">
                              <tr>
                                <th className="py-2.5 px-3 sm:px-4">Test Parameter</th>
                                <th className="py-2.5 px-3 text-center">Result</th>
                                <th className="py-2.5 px-3">Unit</th>
                                <th className="py-2.5 px-3">Bio. Ref. Interval</th>
                                <th className="py-2.5 px-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {inlineSearchedReport.items.map((item, idx) => {
                                const isAbnormal = Boolean(item.isAbnormal);
                                return (
                                  <tr key={idx} className={isAbnormal ? 'bg-amber-50/50 hover:bg-amber-50/80 transition' : 'hover:bg-slate-50/80 transition'}>
                                    <td className="py-2 px-3 sm:px-4 font-bold text-slate-800">
                                      <div>{item.testName}</div>
                                      {item.parameter && item.parameter !== item.testName && (
                                        <div className="text-[10px] font-normal text-slate-500">{item.parameter}</div>
                                      )}
                                    </td>
                                    <td className={`py-2 px-3 text-center font-black text-xs sm:text-sm ${isAbnormal ? 'text-amber-700' : 'text-emerald-700'}`}>
                                      {item.result}
                                    </td>
                                    <td className="py-2 px-3 text-slate-500 font-medium">
                                      {item.unit || '-'}
                                    </td>
                                    <td className="py-2 px-3 text-slate-600 font-medium font-mono text-[10px]">
                                      {item.referenceRange || 'Standard'}
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      {isAbnormal ? (
                                        <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                          ATTENTION
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                          NORMAL
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Doctor & Clinical Notes */}
                        {inlineSearchedReport.clinicalImpression && (
                          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700">
                            <span className="font-bold text-[#123B6D] block mb-0.5">Clinical Impression:</span>
                            <p>{inlineSearchedReport.clinicalImpression}</p>
                          </div>
                        )}

                        {/* 4. Action Row: Download PDF, Print */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Digitally Signed by {inlineSearchedReport.pathologist || 'Consultant Pathologist'}</span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={handleDownloadInlinePdf}
                              disabled={isDownloadingPdf}
                              className="px-3.5 py-2 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-98 disabled:opacity-50"
                            >
                              <Download className="w-3.5 h-3.5 text-amber-400" />
                              <span>{isDownloadingPdf ? 'Preparing PDF...' : 'Download Official PDF'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={handlePrintInlineReport}
                              className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-98"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              <span>Print</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: HEALTH PACKAGES (with Booking Button & Peek Carousel) */}
      <section id="packages" className="py-16 bg-white border-b border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#123B6D]/10 text-[#123B6D] text-xs font-bold mb-3">
              <span>Preventive Health Packages</span>
            </div>

            {/* Mobile View Title & Subtitle */}
            <div className="md:hidden">
              <h2 className="text-2xl font-extrabold text-[#123B6D] tracking-tight">
                Offers &amp; Health Packages
              </h2>
              <p className="text-sm text-[#64748B] mt-1.5 font-medium">
                Affordable Diagnostic Tests for Your Better Health
              </p>
            </div>

            {/* Desktop View Title & Subtitle (Unchanged) */}
            <div className="hidden md:block">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123B6D] tracking-tight">
                Comprehensive Health Checkups with Up to 60% Savings
              </h2>
              <p className="text-sm text-[#64748B] mt-2">
                सभी पॉपुलर प्रिवेंटिव हेल्थ पैकेजेस (Full Body Checkup, Diabetes Care, Senior Citizen, Women Wellness आदि)। Free home sample pickup, digital NABL reports and free doctor consultation.
              </p>
            </div>
          </div>

          {/* Curated Package Image Helper */}
          {(() => {
            const getPackageImg = (p: typeof vendorPackages[0], index: number) => {
              if (p.imageUrl) return p.imageUrl;
              const name = (p.name || '').toLowerCase();
              if (name.includes('diabet') || name.includes('sugar')) {
                return 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80';
              }
              if (name.includes('senior') || name.includes('elder') || name.includes('cardiac') || name.includes('heart')) {
                return 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1000&q=80';
              }
              if (name.includes('women') || name.includes('female') || name.includes('hormon')) {
                return 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1000&q=80';
              }
              const curated = [
                'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1000&q=80',
                'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80',
                'https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1000&q=80',
              ];
              return curated[index % curated.length];
            };

            return (
              <div className="max-w-6xl mx-auto">
                {/* Desktop View: Grid (Unchanged) */}
                <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch justify-center">
                  {vendorPackages.slice(0, 3).map((pkg, idx) => {
                    const pkgImageUrl = getPackageImg(pkg, idx);

                    return (
                      <div
                        key={pkg.id || idx}
                        className="bg-white rounded-3xl border border-slate-200/90 hover:border-[#123B6D]/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group relative h-full w-full"
                      >
                        {/* Package Cover Image with Full Screen View Trigger */}
                        <div className="relative w-full h-48 sm:h-52 bg-slate-100 overflow-hidden shrink-0">
                          <img
                            src={pkgImageUrl}
                            alt={pkg.name}
                            onClick={() => setFullScreenImage({ url: pkgImageUrl, title: pkg.name })}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent pointer-events-none" />

                          {/* Popular Badge */}
                          {(pkg.isPopular || idx === 0) && (
                            <div className="absolute top-3 left-3 bg-[#F59E0B] text-slate-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                              Most Popular
                            </div>
                          )}

                          {/* Full Screen View Icon Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullScreenImage({ url: pkgImageUrl, title: pkg.name });
                            }}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs flex items-center justify-center transition shadow-md cursor-pointer"
                            title="View full image screen"
                            aria-label="View full image screen"
                          >
                            <Maximize2 className="w-4 h-4 text-white" />
                          </button>

                          {/* Click Image Hint */}
                          <button
                            type="button"
                            onClick={() => setFullScreenImage({ url: pkgImageUrl, title: pkg.name })}
                            className="absolute bottom-2.5 right-3 text-[10px] font-bold text-white/95 bg-black/55 hover:bg-black/80 px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Maximize2 className="w-3 h-3 text-amber-300" />
                            <span>Full Image View</span>
                          </button>
                        </div>

                        {/* Card Content with Flex-1 to guarantee uniform equal height */}
                        <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                          <div className="flex-1 flex flex-col">
                            {/* Sabse upar Package ka naam with equal fixed min-height */}
                            <h3 className="text-base sm:text-lg font-black text-[#123B6D] leading-snug mb-3 min-h-[3rem] flex items-center">
                              {pkg.name}
                            </h3>

                            {/* Uske neeche List of Tests with equal fixed height */}
                            <div className="space-y-2 mb-5 flex-1 flex flex-col">
                              <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                <span>Included Tests:</span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  {pkg.testsCount ? `${pkg.testsCount} Tests` : `${pkg.features.length} Tests`}
                                </span>
                              </div>
                              <div className="space-y-1.5 h-48 overflow-y-auto pr-1">
                                {pkg.features.map((feat, fIdx) => (
                                  <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span className="font-medium text-slate-700">{feat}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Uske neeche inline 2 buttons: Price aur Book Test */}
                          <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5 mt-auto shrink-0">
                            <div className="px-3.5 py-2.5 rounded-xl bg-blue-50/90 border border-blue-200 text-[#123B6D] font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-2xs">
                              ₹{pkg.priceINR}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTestOrPackage(`${pkg.name} (₹${pkg.priceINR})`);
                                setIsBookingModalOpen(true);
                              }}
                              className="flex-1 bg-[#123B6D] hover:bg-[#0e2c52] text-white py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                            >
                              <span>Book Test</span>
                              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile View: 1 Package = 100% width, 2+ Packages = 90% card with 10% peek & swipe */}
                <div className="block md:hidden">
                  {vendorPackages.length === 1 ? (
                    /* 1 Package: Full screen width (100%) */
                    <div className="w-full">
                      {(() => {
                        const pkg = vendorPackages[0];
                        const pkgImageUrl = getPackageImg(pkg, 0);
                        return (
                          <div
                            key={pkg.id || 0}
                            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between overflow-hidden relative w-full"
                          >
                            <div className="relative w-full h-48 bg-slate-100 overflow-hidden shrink-0">
                              <img
                                src={pkgImageUrl}
                                alt={pkg.name}
                                onClick={() => setFullScreenImage({ url: pkgImageUrl, title: pkg.name })}
                                className="w-full h-full object-cover cursor-pointer"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent pointer-events-none" />
                              <div className="absolute top-3 left-3 bg-[#F59E0B] text-slate-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                Most Popular
                              </div>
                              <button
                                type="button"
                                onClick={() => setFullScreenImage({ url: pkgImageUrl, title: pkg.name })}
                                className="absolute bottom-2.5 right-3 text-[10px] font-bold text-white/95 bg-black/55 px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5"
                              >
                                <Maximize2 className="w-3 h-3 text-amber-300" />
                                <span>Full View</span>
                              </button>
                            </div>
                            <div className="p-5 flex flex-col justify-between">
                              <div>
                                <h3 className="text-base font-black text-[#123B6D] leading-snug mb-2.5">
                                  {pkg.name}
                                </h3>
                                <div className="space-y-2 mb-4">
                                  <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                    <span>Included Tests:</span>
                                    <span className="text-[10px] font-bold text-slate-400">
                                      {pkg.testsCount ? `${pkg.testsCount} Tests` : `${pkg.features.length} Tests`}
                                    </span>
                                  </div>
                                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                                    {pkg.features.map((feat, fIdx) => (
                                      <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                        <span className="font-medium text-slate-700">{feat}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5">
                                <div className="px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#123B6D] font-black text-base shadow-2xs">
                                  ₹{pkg.priceINR}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTestOrPackage(`${pkg.name} (₹${pkg.priceINR})`);
                                    setIsBookingModalOpen(true);
                                  }}
                                  className="flex-1 bg-[#123B6D] text-white py-2.5 px-3 rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 active:scale-98"
                                >
                                  <span>Book Test</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : vendorPackages.length > 1 ? (
                    /* 2+ Packages: First card 90% width, next card 10% visible on right. Horizontal swipe enabled. */
                    <div>
                      <div
                        className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-2 -mx-4 px-4 scroll-smooth touch-pan-x"
                        style={{
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                          WebkitOverflowScrolling: 'touch',
                        }}
                        onScroll={(e) => {
                          const el = e.currentTarget;
                          const scrollLeft = el.scrollLeft;
                          const cardWidth = el.offsetWidth * 0.88;
                          if (cardWidth > 0) {
                            const idx = Math.min(
                              vendorPackages.length - 1,
                              Math.max(0, Math.round(scrollLeft / cardWidth))
                            );
                            if (idx !== activeMobilePkgIndex) {
                              setActiveMobilePkgIndex(idx);
                            }
                          }
                        }}
                      >
                        {vendorPackages.map((pkg, idx) => {
                          const pkgImageUrl = getPackageImg(pkg, idx);
                          return (
                            <div
                              key={pkg.id || idx}
                              className="w-[88vw] shrink-0 snap-start bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between overflow-hidden relative"
                            >
                              {/* Package Cover Image */}
                              <div className="relative w-full h-44 bg-slate-100 overflow-hidden shrink-0">
                                <img
                                  src={pkgImageUrl}
                                  alt={pkg.name}
                                  onClick={() => setFullScreenImage({ url: pkgImageUrl, title: pkg.name })}
                                  className="w-full h-full object-cover cursor-pointer"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent pointer-events-none" />

                                {/* Popular Badge */}
                                {(pkg.isPopular || idx === 0) && (
                                  <div className="absolute top-3 left-3 bg-[#F59E0B] text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                                    Most Popular
                                  </div>
                                )}

                                {/* Click Image Hint */}
                                <button
                                  type="button"
                                  onClick={() => setFullScreenImage({ url: pkgImageUrl, title: pkg.name })}
                                  className="absolute bottom-2.5 right-3 text-[10px] font-bold text-white/95 bg-black/55 px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5"
                                >
                                  <Maximize2 className="w-3 h-3 text-amber-300" />
                                  <span>Full View</span>
                                </button>
                              </div>

                              {/* Card Content */}
                              <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                                <div className="flex-1 flex flex-col">
                                  <h3 className="text-base font-black text-[#123B6D] leading-snug mb-2 min-h-[2.5rem] flex items-center">
                                    {pkg.name}
                                  </h3>

                                  <div className="space-y-2 mb-4 flex-1 flex flex-col">
                                    <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                      <span>Included Tests:</span>
                                      <span className="text-[10px] font-bold text-slate-400">
                                        {pkg.testsCount ? `${pkg.testsCount} Tests` : `${pkg.features.length} Tests`}
                                      </span>
                                    </div>
                                    <div className="space-y-1.5 h-36 overflow-y-auto pr-1">
                                      {pkg.features.map((feat, fIdx) => (
                                        <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                          <span className="font-medium text-slate-700">{feat}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 mt-auto shrink-0">
                                  <div className="px-3 py-2 rounded-xl bg-blue-50/90 border border-blue-200 text-[#123B6D] font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                                    ₹{pkg.priceINR}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedTestOrPackage(`${pkg.name} (₹${pkg.priceINR})`);
                                      setIsBookingModalOpen(true);
                                    }}
                                    className="flex-1 bg-[#123B6D] hover:bg-[#0e2c52] text-white py-2 px-3 rounded-xl text-xs font-black transition shadow-sm flex items-center justify-center gap-1.5 active:scale-98"
                                  >
                                    <span>Book Test</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mobile Swipe Pagination Dots & Hint */}
                      <div className="flex items-center justify-between mt-3 px-1">
                        <div className="flex items-center gap-1.5">
                          {vendorPackages.map((_, dotIdx) => (
                            <div
                              key={dotIdx}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                activeMobilePkgIndex === dotIdx
                                  ? 'w-6 bg-[#123B6D]'
                                  : 'w-1.5 bg-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <span>Swipe to explore</span>
                          <span className="text-[#123B6D] font-bold">
                            ({activeMobilePkgIndex + 1}/{vendorPackages.length})
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* SECTION 4: ONLINE PATHOLOGY TESTS SECTION (Search Bar + Category Tabs + Desktop Grid + Show More) */}
      <section id="book-test-section" className="py-16 bg-[#F8FAFC] border-b border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F766E]/10 text-[#0F766E] text-xs font-bold mb-2">
              <FlaskConical className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Diagnostic Tests &amp; Profiles</span>
            </div>

            {/* Mobile View Title & Subtitle */}
            <div className="md:hidden">
              <h2 className="text-2xl font-extrabold text-[#123B6D] tracking-tight">
                Explore Lab Tests
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
                Affordable Diagnostic Tests for Your Better Health
              </p>
            </div>

            {/* Desktop View Title & Subtitle (Unchanged) */}
            <div className="hidden md:block">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123B6D] tracking-tight">
                Book Pathology Tests Online
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Search tests by name with transparent rates, specimen requirements, and home collection.
              </p>
            </div>
          </div>

          {/* 1. TOP SEARCH BAR (Unchanged) */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setVisibleTestsCount(isMobileScreen ? 20 : 40);
                }}
                placeholder="Search test by name (e.g., CBC, HbA1c, Thyroid, Lipid, Vitamin D, Urine, LFT)..."
                className="w-full pl-12 pr-10 py-3.5 sm:py-4 rounded-2xl border-2 border-slate-200 focus:border-[#123B6D] focus:ring-4 focus:ring-[#123B6D]/10 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-semibold shadow-xs transition-all outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setVisibleTestsCount(isMobileScreen ? 20 : 40);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Tabs - Hidden on Mobile (as requested: remove category in mobile view), visible on desktop */}
          <div className="hidden md:flex items-center justify-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            {BOOK_TEST_CATEGORY_TABS.map((cat) => {
              const isSelected = selectedBookTestCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedBookTestCategory(cat);
                    setVisibleTestsCount(isMobileScreen ? 20 : 40);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                    isSelected
                      ? 'bg-[#123B6D] text-white ring-2 ring-[#123B6D]/20 shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{cat}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                </button>
              );
            })}
          </div>

          {/* Active Filter & Test Count Status (Badge hidden on mobile view) */}
          <div className={`flex items-center justify-between px-1 text-xs font-semibold text-slate-500 ${searchTerm ? 'mb-4' : 'hidden md:flex mb-5'}`}>
            <span>
              {searchTerm ? (
                <span>
                  Search results for &ldquo;<strong className="text-[#123B6D]">{searchTerm}</strong>&rdquo;
                </span>
              ) : (
                <span className="hidden md:inline">
                  Category: <strong className="text-[#123B6D]">{selectedBookTestCategory}</strong>
                </span>
              )}
            </span>
            <span className="hidden md:inline-block text-[11px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs ml-auto">
              Showing {displayedTests.length} of {filteredTests.length} Tests
            </span>
          </div>

          {/* 2. RESPONSIVE GRID (Mobile: 2 tests per row | Desktop: 4 per row) */}
          {displayedTests.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
              {displayedTests.map((test, idx) => {
                const details = getTestDetails(test);
                const testIdentifier = String(test.id || test.code || test.name);
                const isItemInCart = cartItems.some(
                  (ci) =>
                    ci.id === testIdentifier ||
                    ci.name.toLowerCase() === test.name.toLowerCase()
                );
                return (
                  <div
                    key={test.id || `test-${idx}`}
                    onClick={() => setSelectedTestInfoModal(test)}
                    className={`bg-white rounded-xl sm:rounded-2xl border transition-all p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer group relative ${
                      isItemInCart
                        ? 'border-emerald-500/80 shadow-md ring-1 ring-emerald-400/30'
                        : 'border-slate-200 hover:border-[#123B6D]/50 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Test Name: maximum 2 lines */}
                      <h4 className="font-black text-xs sm:text-sm text-[#123B6D] line-clamp-2 leading-tight sm:leading-snug group-hover:text-blue-700 transition mb-1 min-h-[2rem] sm:min-h-[2.4rem]">
                        {test.name}
                      </h4>

                      {/* Test For: 1-2 lines */}
                      <p className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        <span className="font-bold text-slate-700">Test For:</span> {details.testFor}
                      </p>
                    </div>

                    {/* Single Price & Cart (+) Icon in ONE single line (no sale price / MRP) */}
                    <div className="pt-2.5 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm sm:text-base font-black text-[#123B6D]">₹{details.price}</span>
                      <button
                        type="button"
                        onClick={(e) => handleToggleCartItem(test, e)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer group/btn ${
                          isItemInCart
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/60 shadow-sm scale-105'
                            : 'bg-[#123B6D] hover:bg-[#0e2c52] text-white'
                        }`}
                        title={isItemInCart ? 'Cart mein added hai (Click to remove)' : 'Add to Multi-Cart'}
                      >
                        {isItemInCart ? (
                          <Check className="w-4 h-4 text-white stroke-[2.5] animate-in zoom-in-50 duration-150" />
                        ) : (
                          <div className="relative flex items-center justify-center">
                            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 group-hover/btn:scale-110 transition-transform" />
                            <span className="absolute -top-1 -right-1.5 bg-emerald-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[9px] font-black leading-none shadow-2xs">
                              +
                            </span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
                🔍
              </div>
              <h4 className="font-extrabold text-base text-slate-800">No Tests Found</h4>
              <p className="text-xs text-slate-500">
                No pathology tests matched &ldquo;<strong>{searchTerm}</strong>&rdquo;. Try searching for CBC, Sugar, Thyroid, LFT, or contact our diagnostic helpline.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedBookTestCategory('All');
                  setVisibleTestsCount(isMobileScreen ? 20 : 40);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
              >
                Clear Search &amp; Filters
              </button>
            </div>
          )}

          {/* 3. SHOW MORE BUTTON (Mobile: 20 initially / Desktop: 40 initially, Show More button if more available) */}
          {filteredTests.length > visibleTestsCount && (
            <div className="mt-8 sm:mt-10 text-center">
              <button
                type="button"
                onClick={() => setVisibleTestsCount((prev) => prev + (isMobileScreen ? 20 : 40))}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
              >
                <span>Show More Tests ({filteredTests.length - visibleTestsCount} More Available)</span>
                <ChevronDown className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SECTION: LAB TEST & HEALTH BOOKING SECTION (Directly Below "Book Pathology Tests Online") */}
      <section id="lab-test-health-booking" className="py-14 sm:py-20 bg-gradient-to-b from-[#F8FAFC] via-slate-50 to-white border-b border-slate-200 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0F766E]/10 text-[#0F766E] text-xs font-bold mb-2.5">
              <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Diagnostic Test &amp; Health Booking</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123B6D] tracking-tight">
              Lab Test &amp; Health Booking
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5">
              Fill the details below to book pathology tests with optional home sample collection or direct branch visit.
            </p>
          </div>

          {/* Section me Sirf center me Form hoga */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-3xl">
              <HeroBookingForm
                onOpenReportPortal={() => handleCheckReport()}
                cartItems={cartItems}
                onBookingSuccess={handleClearCart}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: ABOUT US SECTION (with Founder / Director Image & Lab Story) */}
      <section id="about" className="py-16 sm:py-20 bg-white border-b border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          {/* Top Title & Accreditation Badges */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            {/* Accreditation Badge (Desktop only, hidden on mobile) */}
            <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>NABL Accredited &bull; ISO 15189:2022 Certified Medical Laboratory</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#123B6D] tracking-tight">
              {vendorLabSettings?.aboutTitle || 'About Our Laboratory & Medical Leadership'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              {vendorLabSettings?.aboutSubtitle || `Serving patients, referring physicians, and hospital networks with uncompromising diagnostic precision, automated pathology, and compassionate care since ${vendorLabSettings?.establishedYear || currentLabItem?.establishedYear || 2012}.`}
            </p>
          </div>

          {/* Main 2-Column Grid: Lab Story & Legacy + Founder / Director Profile Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left 7 Columns: Lab Story & Clinical Heritage */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-blue-100 text-[#123B6D] flex items-center justify-center font-black text-sm">
                    🏛️
                  </span>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 leading-snug">
                      Our Journey &amp; Legacy of Clinical Excellence
                    </h3>
                    <span className="text-xs font-semibold text-[#0F766E]">
                      Trusted Laboratory &amp; Diagnostic Pathology Services
                    </span>
                  </div>
                </div>

                {/* About Us Paragraphs (Max 5 lines on mobile unless expanded, full on desktop) */}
                <div className={`space-y-3.5 transition-all duration-300 ${isAboutExpanded ? '' : 'line-clamp-5 sm:line-clamp-none'}`}>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {vendorLabSettings?.aboutStory || (
                      <>
                        Founded with a singular dedication to diagnostic excellence, <strong>{labName}</strong> bridges the gap between modern clinical science and patient-centered healthcare. From routine health panels to specialized diagnostic assays, our laboratory is trusted by families, clinicians, and medical networks.
                      </>
                    )}
                  </p>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    We operate in strict compliance with <strong>ISO 15189:2022</strong> and <strong>NABL (National Accreditation Board for Testing and Calibration Laboratories)</strong> standards (Accreditation No: <span className="font-mono font-bold text-[#123B6D]">{labNabl}</span>). Every specimen undergoes rigorous multi-tier internal quality controls (IQC) and participating International External Quality Assessment Schemes (EQAS).
                  </p>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {vendorLabSettings?.aboutHeritage || (
                      <>
                        Equipped with advanced fully-automated biochemistry analyzers, 5-part hematology counters, and bidirectionally interfaced barcode systems, we maintain sample integrity and deliver verified digital reports on time.
                      </>
                    )}
                  </p>
                </div>

                {/* Mobile Read More / Read Less Link */}
                <div className="sm:hidden pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                    className="text-[#123B6D] hover:text-blue-700 font-bold text-xs inline-flex items-center gap-1 cursor-pointer py-1 underline underline-offset-2"
                  >
                    <span>{isAboutExpanded ? 'Read Less' : 'Read More'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAboutExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Founder / Medical Director Profile Card */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="h-full bg-gradient-to-b from-[#F8FAFC] to-white rounded-3xl border-2 border-slate-200/90 hover:border-[#123B6D]/40 p-6 sm:p-7 shadow-lg flex flex-col justify-between relative group transition-all">
                {/* Director Badge */}
                <div className="absolute -top-3.5 right-6 bg-[#123B6D] text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span>{vendorLabSettings?.founderDesignation || 'Chief Medical Director & Founder'}</span>
                </div>

                <div className="space-y-5">
                  {/* Photo & Identity Header */}
                  <div className="flex items-center gap-4 pt-1">
                    {/* Founder Real Photo */}
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md bg-slate-100">
                        <img
                          src={vendorLabSettings?.founderPhotoUrl || '/src/assets/images/founder_pathologist_1790345211989.jpg'}
                          alt={vendorLabSettings?.founderName || 'Founder & Chief Medical Director'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold" title="Verified Pathologist">
                        ✓
                      </span>
                    </div>

                    {/* Name, Degrees, AIIMS Gold Medalist */}
                    <div className="space-y-1 min-w-0">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F766E] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{vendorLabSettings?.founderBadge || 'AIIMS Gold Medalist'}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-[#123B6D] leading-tight truncate">
                        {vendorLabSettings?.founderName || 'Dr. R. K. Sharma'}
                      </h3>
                      <div className="text-xs font-bold text-slate-800">
                        {vendorLabSettings?.founderDegrees || 'MBBS, MD (Pathology)'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {vendorLabSettings?.founderExperience || 'Chief Pathologist • 18+ Years Clinical Experience'}
                      </div>
                    </div>
                  </div>

                  {/* Founder's Message & Resolution */}
                  <div className="relative bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                    <span className="text-3xl text-blue-200 font-serif absolute -top-3 left-3 select-none pointer-events-none">
                      &ldquo;
                    </span>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#123B6D] flex items-center gap-1.5 pt-1">
                      <span>Message from Chief Medical Director</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic whitespace-pre-line">
                      &ldquo;{vendorLabSettings?.founderMessage || 'A pathology report is not merely numbers on paper; a doctor relies on it to prescribe life-saving medicine, and a patient trusts it with their health. At our laboratory, our sacred commitment is diagnostic accuracy, uncompromising sample purity, and delivering every report with complete transparency.'}&rdquo;
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-[#123B6D]">
                        — {vendorLabSettings?.founderName || 'Dr. R. K. Sharma'}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {vendorLabSettings?.founderDesignation?.split('&')[0]?.trim() || 'Consultant Pathologist'}
                      </span>
                    </div>
                  </div>

                  {/* Clinical Credentials List */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    {(vendorLabSettings?.founderCredentials || [
                      'MD Pathology from AIIMS • Senior Resident Ex-Fellow',
                      'Fellow of Indian College of Pathologists (FICP)',
                      'Lead Auditor for NABL / ISO 15189 Quality Systems',
                    ]).map((cred, cIdx) => (
                      <div key={cIdx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{cred}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: QUALIFIED TEAM SECTION (Pathologists, Biochemists & Senior Lab Technicians) */}
      <section id="doctors" className="py-14 sm:py-20 bg-[#F8FAFC] border-b border-slate-200 scroll-mt-20">
        <div className="max-w-4xl sm:max-w-6xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            {/* Desktop Badge (Unchanged) */}
            <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100/80 text-[#123B6D] text-xs font-black mb-3 border border-blue-200/80 shadow-2xs">
              <Users className="w-3.5 h-3.5 text-blue-700" />
              <span>Qualified Clinical &amp; Laboratory Team</span>
            </div>

            {/* Mobile View Title & Subtitle */}
            <div className="block sm:hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-[#123B6D] text-xs font-black mb-2.5 border border-blue-200/80">
                <Users className="w-3.5 h-3.5 text-blue-700" />
                <span>Medical Team</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#123B6D] tracking-tight">
                Our Medical &amp; Laboratory Experts
              </h2>
              <p className="text-sm text-slate-600 mt-1.5 font-medium">
                Qualified Clinical &amp; Laboratory Team
              </p>
            </div>

            {/* Desktop View Title & Subtitle (Unchanged) */}
            <div className="hidden sm:block">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123B6D] tracking-tight">
                Our Medical &amp; Laboratory Experts
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Experienced Pathologists, Biochemists &amp; Senior Technicians ensuring accurate diagnostics and timely reports.
              </p>
            </div>
          </div>

          {(() => {
            const doctorsList = ((vendorDoctors && vendorDoctors.length > 0)
              ? vendorDoctors
              : DEFAULT_ALL_VENDOR_DOCTORS.filter((d) => isTenantMatch(d, vendorLabSettings?.labId || selectedVendorLabId || 'lab-apex')).length > 0
              ? DEFAULT_ALL_VENDOR_DOCTORS.filter((d) => isTenantMatch(d, vendorLabSettings?.labId || selectedVendorLabId || 'lab-apex'))
              : DEFAULT_ALL_VENDOR_DOCTORS.slice(0, 3)
            );

            const renderDoctorCard = (doc: any, idx: number, isMobile: boolean, isSingle: boolean) => {
              // Doctor values with robust fallbacks
              const docName = doc.name || 'Medical Specialist';
              const docQualification = doc.qualification || doc.degrees || 'MBBS, MD (Pathology)';
              const docSpeciality =
                doc.specialization ||
                doc.specialty ||
                doc.specialExpertise ||
                doc.designation ||
                doc.roleCategory ||
                'Clinical Pathology & Diagnostics';

              // Clean experience for side badge
              const docExp = doc.experience || '';
              const expMatch = docExp.match(/(\d+\+?\s*(?:years?|yrs?))/i);
              const cleanExp = expMatch
                ? `${expMatch[1]} Exp`
                : docExp
                ? docExp.length > 15
                  ? docExp.split('•').pop()?.trim() || docExp
                  : docExp
                : '';

              // Fallback image based on role
              let fallbackImg = '/src/assets/images/team_pathologist_woman_1790345423035.jpg';
              if (doc.roleCategory === 'Biochemist' || docSpeciality.toLowerCase().includes('biochem')) {
                fallbackImg = '/src/assets/images/team_biochemist_1790345449541.jpg';
              } else if (doc.roleCategory === 'Phlebotomist' || docSpeciality.toLowerCase().includes('phlebotom')) {
                fallbackImg = '/src/assets/images/team_phlebotomist_1790345465190.jpg';
              } else if (doc.roleCategory === 'Technician' || docSpeciality.toLowerCase().includes('technic')) {
                fallbackImg = '/src/assets/images/team_technologist_1790345481173.jpg';
              } else if (idx === 0) {
                fallbackImg = '/src/assets/images/founder_pathologist_1790345211989.jpg';
              }
              const displayImage = doc.imageUrl || fallbackImg;

              return (
                <div
                  key={doc.id || idx}
                  className={`bg-white rounded-2xl border border-slate-200 hover:border-[#123B6D]/40 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative ${
                    isMobile
                      ? isSingle
                        ? 'w-full shrink-0'
                        : 'w-[80%] min-w-[80%] shrink-0 snap-start'
                      : ''
                  }`}
                >
                  {/* Top: Photo, Name & Experience Side Badge */}
                  <div className="flex items-start justify-between gap-2.5 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* 1. Image */}
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-2xs group-hover:border-[#123B6D] transition-colors bg-slate-100">
                          <img
                            src={displayImage}
                            alt={docName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        <span
                          className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black border-2 border-white shadow-2xs"
                          title="Verified Specialist"
                        >
                          ✓
                        </span>
                      </div>

                      {/* 2. Name */}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-extrabold text-sm sm:text-base text-[#123B6D] leading-snug group-hover:text-blue-700 transition">
                          {docName}
                        </h3>
                      </div>
                    </div>

                    {/* 5. Experience (Side me chhota sa badge) */}
                    {cleanExp && (
                      <span className="shrink-0 text-[10px] sm:text-[11px] font-bold text-[#123B6D] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap mt-0.5">
                        ⏱️ {cleanExp}
                      </span>
                    )}
                  </div>

                  {/* Bottom: 3. Qualification + 4. Speciality */}
                  <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-xs">
                    {/* Qualification */}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-400 font-medium shrink-0">Qualification:</span>
                      <span className="font-bold text-slate-800 break-words">
                        {docQualification}
                      </span>
                    </div>

                    {/* Speciality */}
                    <div className="flex items-baseline gap-1.5 text-[#0F766E]">
                      <span className="text-slate-400 font-medium shrink-0">Speciality:</span>
                      <span className="font-bold text-[#0F766E] break-words">
                        {docSpeciality}
                      </span>
                    </div>
                  </div>
                </div>
              );
            };

            return (
              <div className="w-full flex justify-center">
                <div className="w-full max-w-3xl sm:max-w-none">
                  {/* Desktop View: Grid (Unchanged) */}
                  <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {doctorsList.map((doc, idx) => renderDoctorCard(doc, idx, false, false))}
                  </div>

                  {/* Mobile View: 1 Member = 100% width, 2+ Members = 80% card with 20% peek & swipe */}
                  <div className="block sm:hidden w-full">
                    {doctorsList.length === 1 ? (
                      /* 1 Team Member: Full screen width (100% of container, same as form) */
                      <div className="w-full">
                        {renderDoctorCard(doctorsList[0], 0, true, true)}
                      </div>
                    ) : doctorsList.length > 1 ? (
                      /* 2+ Team Members: First card 80% width, next card 20% visible on right. Horizontal swipe enabled. */
                      <div className="w-full">
                        <div
                          className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 scroll-smooth touch-pan-x"
                          style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch',
                          }}
                          onScroll={(e) => {
                            const el = e.currentTarget;
                            const scrollLeft = el.scrollLeft;
                            const cardWidth = el.offsetWidth * 0.8;
                            if (cardWidth > 0) {
                              const idx = Math.min(
                                doctorsList.length - 1,
                                Math.max(0, Math.round(scrollLeft / cardWidth))
                              );
                              if (idx !== activeMobileDoctorIndex) {
                                setActiveMobileDoctorIndex(idx);
                              }
                            }
                          }}
                        >
                          {doctorsList.map((doc, idx) => renderDoctorCard(doc, idx, true, false))}
                        </div>

                        {/* Mobile Swipe Pagination Dots & Hint */}
                        <div className="flex items-center justify-between mt-3 px-0.5">
                          <div className="flex items-center gap-1.5">
                            {doctorsList.map((_, dotIdx) => (
                              <div
                                key={dotIdx}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  activeMobileDoctorIndex === dotIdx
                                    ? 'w-6 bg-[#123B6D]'
                                    : 'w-1.5 bg-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <span>Swipe to explore</span>
                            <span className="text-[#123B6D] font-bold">
                              ({activeMobileDoctorIndex + 1}/{doctorsList.length})
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* 9. Minimal Contact Us Section */}
      <section id="contact" className="py-12 sm:py-16 bg-white border-b border-slate-200 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header (Center-aligned on mobile and desktop) */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0F766E]/10 text-[#0F766E] text-xs font-bold mb-2.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Get In Touch</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123B6D] tracking-tight">
              Contact Us
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Connect with our laboratory desk or submit an inquiry form below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Side: 5 Minimal Contact Lines */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5">
              {/* 1. Line: WhatsApp Number (may be multi) */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">WhatsApp Number</span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                    {whatsappNumberList.map((num, idx) => {
                      const clean = num.replace(/\D/g, '');
                      return (
                        <a
                          key={idx}
                          href={`https://wa.me/91${clean}?text=${encodeURIComponent(`Hello ${labName}, I would like to inquire about tests & services.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                        >
                          <span>+91 {num}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Line: Call Number (maybe multi) */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#123B6D] border border-blue-200/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Call Number</span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                    {callNumberList.map((num, idx) => {
                      const clean = num.replace(/\D/g, '');
                      return (
                        <a
                          key={idx}
                          href={`tel:+91${clean}`}
                          className="text-xs sm:text-sm font-bold text-[#123B6D] hover:underline inline-flex items-center gap-1"
                        >
                          <span>+91 {num}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. Line: Email ID */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email ID</span>
                  <a
                    href={`mailto:${labEmail}`}
                    className="text-xs sm:text-sm font-bold text-slate-800 hover:text-[#123B6D] hover:underline mt-0.5 block break-all"
                  >
                    {labEmail}
                  </a>
                </div>
              </div>

              {/* 4. Line: Address in text only (not google location) */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Address</span>
                  <p className="text-xs sm:text-sm font-medium text-slate-700 mt-0.5 leading-relaxed">
                    {labAddress}
                  </p>
                </div>
              </div>

              {/* 5. Line: Social Media Small Icons (Edit / Disable support) */}
              {vendorLabSettings?.socialMedia?.enabled !== false && (
                <div className="flex items-start gap-3.5 pt-3 border-t border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Social Media</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(vendorLabSettings?.socialMedia?.whatsapp || stickyWhatsappUrl) && (
                        <a
                          href={vendorLabSettings?.socialMedia?.whatsapp ? `https://wa.me/${vendorLabSettings.socialMedia.whatsapp.replace(/\D/g, '')}` : stickyWhatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp"
                          className="w-7 h-7 rounded-full bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 hover:border-emerald-300 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {(vendorLabSettings?.socialMedia?.facebook || 'https://facebook.com') && (
                        <a
                          href={vendorLabSettings?.socialMedia?.facebook || 'https://facebook.com'}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Facebook"
                          className="w-7 h-7 rounded-full bg-white hover:bg-blue-50 text-[#1877F2] border border-slate-200 hover:border-blue-300 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <Facebook className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {(vendorLabSettings?.socialMedia?.instagram || 'https://instagram.com') && (
                        <a
                          href={vendorLabSettings?.socialMedia?.instagram || 'https://instagram.com'}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Instagram"
                          className="w-7 h-7 rounded-full bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-300 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <Instagram className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {(vendorLabSettings?.socialMedia?.twitter || 'https://twitter.com') && (
                        <a
                          href={vendorLabSettings?.socialMedia?.twitter || 'https://twitter.com'}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Twitter / X"
                          className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 hover:border-slate-400 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <Twitter className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {(vendorLabSettings?.socialMedia?.youtube || 'https://youtube.com') && (
                        <a
                          href={vendorLabSettings?.socialMedia?.youtube || 'https://youtube.com'}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="YouTube"
                          className="w-7 h-7 rounded-full bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-300 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <Youtube className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {vendorLabSettings?.socialMedia?.linkedin && (
                        <a
                          href={vendorLabSettings.socialMedia.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="LinkedIn"
                          className="w-7 h-7 rounded-full bg-white hover:bg-sky-50 text-[#0A66C2] border border-slate-200 hover:border-sky-300 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <Linkedin className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Form (name, phone, subject, message) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs">
              <h3 className="text-base sm:text-lg font-bold text-[#123B6D] mb-1">
                Send Us a Message
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Leave your details below and our diagnostic coordinator will assist you.
              </p>

              {contactSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-emerald-950">Message Sent Successfully!</h4>
                    <p className="text-xs text-emerald-800 mt-1">
                      Thank you, <span className="font-bold">{contactName}</span>. Your message regarding{' '}
                      <span className="font-semibold">"{contactSubject || 'General Inquiry'}"</span> has been received.
                    </p>
                    <p className="text-[11px] font-mono text-emerald-700 mt-1">
                      Reference Token: {contactRefId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setContactSubmitted(false);
                      setContactName('');
                      setContactPhone('');
                      setContactEmail('');
                      setContactSubject('');
                      setContactMessage('');
                    }}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 underline cursor-pointer pt-1 block mx-auto"
                  >
                    Submit Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3.5">
                  {contactError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{contactError}</span>
                    </div>
                  )}

                  {/* Row 1: Name + Phone: Inline (50% each) on mobile and desktop */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                    {/* 1. Name (50%) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full pl-8 pr-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                        />
                      </div>
                    </div>

                    {/* 2. Phone (50%) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Phone <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="text-xs font-bold text-slate-400 absolute left-2.5 top-2 select-none">+91</span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="98765 43210"
                          className="w-full pl-9 pr-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Email + Subject: Inline (50% each) on mobile and desktop */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                    {/* 3. Email (50%) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="name@email.com"
                          className="w-full pl-8 pr-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                        />
                      </div>
                    </div>

                    {/* 4. Subject (50%) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="e.g. Test Inquiry"
                        className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                      />
                    </div>
                  </div>

                  {/* Row 3: Message: Full-width textarea with 2 visible lines */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={2}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Write your message or inquiry..."
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D] resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="w-full bg-[#123B6D] hover:bg-[#0e2f57] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-75 active:scale-99"
                  >
                    {contactSubmitting ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-amber-400" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Footer — 5 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 text-xs text-slate-600">
            {/* Column 1: Lab Brand Profile (Real Logo full view on top + Lab Name below + Lab ID Number) */}
            <div className="space-y-3 sm:col-span-2 lg:col-span-1">
              {/* Uper Logo (Taki real logo pura show ho) */}
              <div className="inline-block">
                {labLogoUrl ? (
                  <div className="p-2 bg-white rounded-xl border border-slate-200/90 shadow-2xs inline-flex items-center justify-center">
                    <img
                      src={labLogoUrl}
                      alt={labName}
                      referrerPolicy="no-referrer"
                      className="h-12 sm:h-14 max-w-[170px] w-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#123B6D] text-white flex items-center justify-center font-black text-xl shadow-xs">
                    <span className="text-amber-400">{labName.charAt(0) || 'A'}</span>
                    {labName.split(' ')[1]?.charAt(0) || 'L'}
                  </div>
                )}
              </div>

              {/* Niche Lab ka Name */}
              <div>
                <span className="font-extrabold text-[#123B6D] text-sm sm:text-base block leading-snug">
                  {labName}
                </span>

                {/* Uske Niche Lab ID Number & Badges */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold border border-slate-200 shadow-2xs">
                    Lab ID: {labShopId}
                  </span>
                  {labNabl && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-bold border border-emerald-200 shadow-2xs">
                      NABL: {labNabl}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  ISO 15189:2022 compliant automated diagnostic clinical pathology laboratory.
                </p>
              </div>
            </div>

            {/* Column 2: Main Menu */}
            <div>
              <h4 className="font-extrabold text-[#123B6D] mb-4 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>Main Menu</span>
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('top') || document.getElementById('main-website-header');
                      el ? el.scrollIntoView({ behavior: 'smooth' }) : window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-[#123B6D] hover:font-bold transition cursor-pointer text-slate-600 text-left"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <a
                    href="#packages"
                    className="hover:text-[#123B6D] hover:font-bold transition text-slate-600 block"
                  >
                    Packages
                  </a>
                </li>
                <li>
                  <a
                    href="#book-test-section"
                    className="hover:text-[#123B6D] hover:font-bold transition text-slate-600 block"
                  >
                    Tests
                  </a>
                </li>
                <li>
                  <a
                    href="#about"
                    className="hover:text-[#123B6D] hover:font-bold transition text-slate-600 block"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#doctors"
                    className="hover:text-[#123B6D] hover:font-bold transition text-slate-600 block"
                  >
                    Team
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="hover:text-[#123B6D] hover:font-bold transition text-slate-600 block"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Quick Access */}
            <div>
              <h4 className="font-extrabold text-[#123B6D] mb-4 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>Quick Access</span>
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button
                    type="button"
                    onClick={() => handleCheckReport()}
                    className="hover:text-[#123B6D] text-teal-700 font-bold flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>Download Report</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsPaymentQrModalOpen(true)}
                    className="hover:text-[#123B6D] hover:font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Lab Payment UPI QR</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsWebsiteQrModalOpen(true)}
                    className="hover:text-[#123B6D] hover:font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <QrCode className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Website QR (Lab Website QR)</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal & Policy */}
            <div>
              <h4 className="font-extrabold text-[#123B6D] mb-4 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>Legal &amp; Policy</span>
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('terms')}
                    className="hover:text-[#123B6D] hover:font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Terms &amp; Conditions</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('privacy')}
                    className="hover:text-[#123B6D] hover:font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Privacy Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('refund')}
                    className="hover:text-[#123B6D] hover:font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Refund &amp; Cancellation Policy</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 5: Login / Portal */}
            <div>
              <h4 className="font-extrabold text-[#123B6D] mb-4 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>Login / Portal</span>
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button
                    type="button"
                    onClick={handleOpenAdmin}
                    className="hover:text-[#123B6D] hover:font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                    <span>Admin Login</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleOpenReception}
                    className="hover:text-[#123B6D] hover:font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0"></span>
                    <span>Reception Login</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleOpenTechnician}
                    className="hover:text-[#123B6D] hover:font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                    <span>Technician Login</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span>© {new Date().getFullYear()} {labName}. All Rights Reserved.</span>
            </div>
            <div className="flex items-center gap-2 font-medium flex-wrap">
              <span>Powered by</span>
              <a
                href="https://indianlalaji.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#123B6D] hover:underline font-black"
              >
                indianlalaji.com
              </a>
              <span className="text-slate-300">|</span>
              <a
                href="tel:7087033009"
                className="text-[#123B6D] hover:underline font-black inline-flex items-center gap-1 bg-slate-100 hover:bg-blue-50 px-2.5 py-1 rounded-md transition border border-slate-200"
              >
                <Phone className="w-3.5 h-3.5 text-[#123B6D]" />
                <span>7087033009</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Payment QR Modal */}
      {isPaymentQrModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 relative shadow-2xl border border-slate-100 flex flex-col items-center text-center">
            <button
              onClick={() => setIsPaymentQrModalOpen(false)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close Payment QR Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-600">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm sm:text-base font-black text-[#123B6D] leading-tight">
                  {labName}
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Official UPI Payment QR
                </p>
              </div>
            </div>

            {/* If 2 QRs are configured, show toggle tabs */}
            {(vendorLabSettings?.upiId2 || vendorLabSettings?.qrCode2Url) && (
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl w-full my-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedQrType('counter')}
                  className={`py-1.5 px-2 rounded-lg transition text-[11px] ${
                    selectedQrType === 'counter'
                      ? 'bg-white text-[#123B6D] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {vendorLabSettings?.qrCode1Label || 'Counter Billing'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQrType('home')}
                  className={`py-1.5 px-2 rounded-lg transition text-[11px] ${
                    selectedQrType === 'home'
                      ? 'bg-white text-[#123B6D] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {vendorLabSettings?.qrCode2Label || 'Home Collection'}
                </button>
              </div>
            )}

            {/* QR Code Container */}
            <div className="mt-3 p-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 w-full flex flex-col items-center">
              <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                <img
                  src={
                    (selectedQrType === 'counter'
                      ? vendorLabSettings?.qrCode1Url
                      : vendorLabSettings?.qrCode2Url) ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                      `upi://pay?pa=${
                        (selectedQrType === 'counter'
                          ? vendorLabSettings?.upiId1
                          : vendorLabSettings?.upiId2) ||
                        vendorLabSettings?.upiId1 ||
                        'apexlab@icici'
                      }&pn=${encodeURIComponent(
                        vendorLabSettings?.merchantName || labName
                      )}&cu=INR`
                    )}`
                  }
                  alt="UPI Payment QR Code"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                />
              </div>

              {/* Merchant and UPI ID Details */}
              <div className="mt-3 text-center w-full">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {vendorLabSettings?.merchantName || labName}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Shop ID: <span className="font-mono font-bold text-[#123B6D]">{labShopId}</span>
                </div>

                {/* 1-Click Copy UPI Bar */}
                <div className="mt-2 flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs w-full">
                  <div className="truncate font-mono font-bold text-slate-700 text-[11px]">
                    {(selectedQrType === 'counter'
                      ? vendorLabSettings?.upiId1
                      : vendorLabSettings?.upiId2) ||
                      vendorLabSettings?.upiId1 ||
                      'apexlab@icici'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const upi =
                        (selectedQrType === 'counter'
                          ? vendorLabSettings?.upiId1
                          : vendorLabSettings?.upiId2) ||
                        vendorLabSettings?.upiId1 ||
                        'apexlab@icici';
                      navigator.clipboard?.writeText(upi);
                      setCopiedUpi(true);
                      setTimeout(() => setCopiedUpi(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 transition shrink-0 cursor-pointer"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy UPI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Supported UPI Apps Strip */}
            <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-semibold">
              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">GPay</span>
              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">PhonePe</span>
              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">Paytm</span>
              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">BHIM</span>
              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">Any UPI</span>
            </div>

            <p className="text-[10px] text-slate-400 mt-2">
              Scan with any UPI application for instant blood test payment & receipt confirmation.
            </p>

            <button
              type="button"
              onClick={() => setIsPaymentQrModalOpen(false)}
              className="mt-3 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 2-Step Online Test Booking Modal (Step 1: Test & Form, Step 2: QR / Pay at Branch) */}
      <OnlineTestBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialSelection={selectedTestOrPackage}
        initialTests={
          cartItems.length > 0
            ? cartItems.map((ci) => ({ name: ci.name, price: ci.price, type: 'test' as const }))
            : undefined
        }
        onOpenReportPortal={handleCheckReport}
        onBookingSuccess={handleClearCart}
      />

      {/* Terms & Conditions / Privacy / Refund Policy Modal */}
      <VendorPolicyModal
        isOpen={isPolicyModalOpen || isTermsModalOpen}
        onClose={() => {
          setIsPolicyModalOpen(false);
          setIsTermsModalOpen(false);
        }}
        activeTab={policyModalTab}
        onSelectTab={setPolicyModalTab}
        labName={labName}
        labPhone={labPhone}
        labEmail={labEmail}
        customTerms={vendorLabSettings?.termsAndConditions}
        customPrivacy={vendorLabSettings?.privacyPolicy}
        customRefund={vendorLabSettings?.refundPolicy}
      />

      {/* Website QR Modal */}
      {isWebsiteQrModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="website-qr-modal-title"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setIsWebsiteQrModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 relative shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsWebsiteQrModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close Website QR Modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 id="website-qr-modal-title" className="text-base font-extrabold text-slate-900 leading-tight mb-1">
              Official Website QR Code
            </h3>
            <p className="text-xs text-slate-500 mb-4 line-clamp-1">
              {labName}
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 shadow-inner flex flex-col items-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(websiteDirectUrl)}`}
                alt={`${labName} Website QR`}
                className="w-48 h-48 rounded-xl object-contain bg-white p-2 border border-slate-200 shadow-xs"
              />
              <span className="text-[11px] font-semibold text-slate-500 mt-2 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                Scan to open vendor lab website
              </span>
            </div>

            <div className="w-full bg-slate-50 rounded-xl p-2.5 border border-slate-200 mb-4 flex items-center justify-between text-xs font-mono text-slate-700">
              <span className="truncate pr-2 select-all">{websiteDirectUrl}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(websiteDirectUrl);
                  setCopiedWebsiteUrl(true);
                  setTimeout(() => setCopiedWebsiteUrl(false), 2000);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition flex items-center gap-1 cursor-pointer"
              >
                {copiedWebsiteUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWebsiteUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 text-xs">
              <a
                href={websiteDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                <span>Visit Link</span>
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Visit ${labName} Website: ${websiteDirectUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share QR</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Test Information & Fasting Preparation Modal */}
      {selectedTestInfoModal && (() => {
        const details = getTestDetails(selectedTestInfoModal);
        const testIdentifier = String(
          selectedTestInfoModal.id || selectedTestInfoModal.code || selectedTestInfoModal.name
        );
        const isItemInCart = cartItems.some(
          (ci) =>
            ci.id === testIdentifier ||
            ci.name.toLowerCase() === selectedTestInfoModal.name.toLowerCase()
        );

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="test-info-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setSelectedTestInfoModal(null)}
          >
            <div
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header: Name only (no test icon or short code) */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                <h2 id="test-info-modal-title" className="text-base sm:text-lg font-black text-slate-900 leading-tight pr-4">
                  {selectedTestInfoModal.name}
                </h2>

                <button
                  type="button"
                  onClick={() => setSelectedTestInfoModal(null)}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center text-lg font-bold transition cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body: Preparation & Uses */}
              <div className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
                {/* Preparation */}
                <div className={`p-4 rounded-2xl border ${
                  details.isFastingRequired
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="font-bold text-xs uppercase tracking-wider mb-1">
                    Preparation / तैयारी: {details.isFastingRequired ? '10-12 Hours Fasting' : 'No Fasting Required'}
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    {details.fastingDetail}
                  </p>
                </div>

                {/* Uses */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>Clinical Significance &amp; Uses (टेस्ट का उपयोग):</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {details.clinicalUse}
                  </p>
                </div>
              </div>

              {/* Footer: Inline Do Button (Price and + Cart Icon) */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                <div className="px-4 py-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-[#123B6D] font-black text-base sm:text-lg flex items-center justify-center shrink-0">
                  ₹{details.price}
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleCartItem(selectedTestInfoModal)}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 ${
                    isItemInCart
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#123B6D] hover:bg-[#0e2c52] text-white'
                  }`}
                >
                  {isItemInCart ? (
                    <>
                      <Check className="w-4 h-4 text-white stroke-[2.5]" />
                      <span>Added in Cart (Remove)</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 text-amber-400" />
                      <span>+ Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Admin Hero Banner Upload & Management Modal */}
      {isBannerManagerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="banner-manager-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setIsBannerManagerOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-gradient-to-r from-[#123B6D] to-[#1E4E8C] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h2 id="banner-manager-modal-title" className="text-base font-extrabold leading-tight">
                    Manage Hero Photo Banners (Admin)
                  </h2>
                  <p className="text-[11px] text-blue-100">
                    Upload photos from your computer/phone or enter image web links
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBannerManagerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Notice Banner */}
              {bannerSaveNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{bannerSaveNotice}</span>
                </div>
              )}

              {/* Upload Input Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Device File Upload */}
                <div
                  className="p-4 rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 transition text-center flex flex-col items-center justify-center space-y-2 cursor-pointer"
                  onClick={() => bannerFileInputRef.current?.click()}
                >
                  <input
                    ref={bannerFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-[#123B6D] flex items-center justify-center shadow-2xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#123B6D] block">
                      Upload from Computer / Mobile
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Supports JPG, PNG, WebP (Max 5MB)
                    </span>
                  </div>
                </div>

                {/* 2. Web Image URL Input */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Or Paste Image URL:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/banner.jpg"
                      value={newBannerInputUrl}
                      onChange={(e) => setNewBannerInputUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBannerUrl();
                        }
                      }}
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#123B6D]"
                    />
                    <button
                      type="button"
                      onClick={handleAddBannerUrl}
                      disabled={!newBannerInputUrl.trim()}
                      className="px-3 py-1.5 rounded-xl bg-[#123B6D] text-white text-xs font-bold hover:bg-[#0e2c52] disabled:opacity-50 transition cursor-pointer shrink-0"
                    >
                      Add
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Recommended dimension: 1600×700 or 1200×600
                  </span>
                </div>
              </div>

              {/* Current Banners Grid Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Current Active Banners ({tempBannersList.length})</span>
                  <button
                    type="button"
                    onClick={handleResetDefaultBanners}
                    className="text-[#0F766E] hover:underline cursor-pointer text-[11px]"
                  >
                    Reset to Default Images
                  </button>
                </div>

                {tempBannersList.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                    No banners added. Please upload at least one photo banner.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tempBannersList.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-[16/9] shadow-2xs"
                      >
                        <img
                          src={url}
                          alt={`Banner ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white font-mono text-[10px] font-bold">
                          #{idx + 1}
                        </div>

                        {/* Banner Management Overlay Controls: Move Left, Move Right, Delete */}
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveBanner(idx, 'prev')}
                              className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center shadow-md transition cursor-pointer active:scale-90"
                              title="Move Banner Left"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {idx < tempBannersList.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveBanner(idx, 'next')}
                              className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center shadow-md transition cursor-pointer active:scale-90"
                              title="Move Banner Right"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveBanner(idx)}
                            className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md transition cursor-pointer active:scale-90"
                            title="Remove this banner photo"
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

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsBannerManagerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveBanners}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save &amp; Publish Banners</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Floating Side Capsule Cart Button (Small & Compact in Footer Corner) */}
      {cartItems.length > 0 && !isBookingModalOpen && (
        <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <button
            type="button"
            onClick={() => setIsCartDrawerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#123B6D] hover:bg-[#0e2c52] text-white shadow-xl hover:shadow-2xl active:scale-95 transition-all border border-white/30 cursor-pointer group"
            title={`View Cart (${cartItems.length} Tests • ₹${cartTotalPrice})`}
          >
            <div className="relative flex items-center">
              <ShoppingCart className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center leading-none shadow-xs">
                {cartItems.length}
              </span>
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-amber-300">
              ₹{cartTotalPrice}
            </span>
            <span className="text-[11px] font-bold text-blue-100">
              Cart
            </span>
          </button>
        </div>
      )}

      {/* Multi-Cart Drawer / List Modal */}
      {isCartDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsCartDrawerOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#123B6D] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black leading-tight">
                    Diagnostic Multi-Cart ({cartItems.length} Tests)
                  </h3>
                  <p className="text-[11px] text-blue-100">
                    Review selected tests before proceeding to booking
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-6 space-y-3 overflow-y-auto flex-1">
              {cartItems.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                    🛒
                  </div>
                  <p className="text-sm font-bold text-slate-700">Aapka cart khali hai</p>
                  <p className="text-xs text-slate-400">Tests section se tests cart mein add karein</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#123B6D] flex items-center justify-center font-bold text-xs shrink-0">
                        🧪
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          {item.code && <span className="font-mono bg-slate-200 px-1 rounded">{item.code}</span>}
                          {item.category && <span>{item.category}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm sm:text-base font-black text-[#123B6D]">
                        ₹{item.price}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.id, item.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove test"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Action */}
            {cartItems.length > 0 && (
              <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Total Booking Amount:</span>
                  <span className="text-xl font-black text-[#123B6D]">₹{cartTotalPrice}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToBooking}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#123B6D] via-[#1E4E8C] to-[#0F766E] hover:from-[#0e2c52] hover:to-[#0d5f58] text-white text-xs sm:text-sm font-black shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <ShoppingCart className="w-4 h-4 text-amber-400" />
                    <span>Proceed to Book ({cartItems.length} Tests)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Image Screen Lightbox Modal */}
      {fullScreenImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setFullScreenImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button & Title */}
            <div className="w-full flex items-center justify-between mb-3 px-2">
              <h3 className="text-white text-sm sm:text-base font-extrabold truncate pr-4">
                {fullScreenImage.title}
              </h3>
              <button
                type="button"
                onClick={() => setFullScreenImage(null)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer shrink-0"
                aria-label="Close full image view"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-Res Full Image Container */}
            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black max-h-[75vh] w-full flex items-center justify-center">
              <img
                src={fullScreenImage.url}
                alt={fullScreenImage.title}
                className="w-full h-auto max-h-[75vh] object-contain"
              />
            </div>

            <p className="text-slate-400 text-xs mt-3 text-center">
              Tap anywhere outside or press ✕ to close full image screen
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
