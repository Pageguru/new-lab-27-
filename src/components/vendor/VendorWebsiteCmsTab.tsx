import React, { useState, useEffect } from 'react';
import {
  Globe,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Layers,
  Check,
  Upload,
  Image as ImageIcon,
  Share2,
  Link as LinkIcon,
  Copy,
  Users,
  Edit2,
  Award,
  FileText,
  Shield,
  RotateCcw,
  Mail,
  MessageSquare,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  X,
  Camera,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useCms, DEFAULT_VENDOR_SECTIONS, DEFAULT_ALL_VENDOR_DOCTORS } from '../../context/CmsContext';
import { VendorWebsiteSections, VendorLabSettings, VendorBannerItem, VendorDoctor, VendorSocialLinks } from '../../types';
import { generateDefaultOgImage } from '../../utils/seo';
import { getTenantWebsiteUrl, getTenantDirectUrl, SUPER_ADMIN_DOMAIN } from '../../constants/domains';
import { VendorPolicyModal, PolicyTabType } from './VendorPolicyModal';

export type WebsiteSubSection =
  | 'banners'
  | 'about'
  | 'founder'
  | 'team'
  | 'contact'
  | 'social'
  | 'legal'
  | 'sections';

interface VendorWebsiteCmsTabProps {
  onPreviewWebsite?: () => void;
  activeSubTab?: WebsiteSubSection;
  onSubTabChange?: (tab: WebsiteSubSection) => void;
}

interface SectionMeta {
  key: keyof VendorWebsiteSections;
  name: string;
  description: string;
  badge: string;
  category: 'Core' | 'Public Info' | 'Clinical';
}

const SECTION_METAS: SectionMeta[] = [
  {
    key: 'announcementBar',
    name: 'Top Emergency & Notice Bar',
    description: 'Displays 24x7 lab helpline, opening hours, NABL accreditation status, and emergency alert message.',
    badge: 'Notice Strip',
    category: 'Public Info',
  },
  {
    key: 'header',
    name: 'Main Website Header & Navigation',
    description: 'Lab logo, name, tagline, navigation menu links, and quick action buttons (Book Test, Reception Desk, Download Report).',
    badge: 'Header',
    category: 'Core',
  },
  {
    key: 'hero',
    name: 'Hero Banner & Instant Home Booking Card',
    description: 'Main promotional headline, WhatsApp booking button, trust badges, and home sample collection booking form.',
    badge: 'Hero Section',
    category: 'Core',
  },
  {
    key: 'dashboardsShowcase',
    name: 'Dedicated Operational Portals Showcase',
    description: 'Interactive cards linking to Reception Desk, Lab Software & Technician, Patient Portal, and Vendor CMS.',
    badge: 'Portals',
    category: 'Core',
  },
  {
    key: 'packages',
    name: 'Preventive Health Packages Grid',
    description: 'Full Body Health Checkup, Diabetic Care, Senior Citizen profiles with INR pricing, MRP discount, and test counts.',
    badge: 'Packages',
    category: 'Clinical',
  },
  {
    key: 'testDirectory',
    name: '500+ Diagnostic Tests Directory & Search',
    description: 'Searchable directory with categories (Hematology, Biochemistry, Thyroid, Urine, etc.), sample types, TAT, and prices.',
    badge: 'Test Library',
    category: 'Clinical',
  },
  {
    key: 'whyChooseUs',
    name: 'Why Choose Us / Quality Assurance',
    description: 'Highlights automated analyzers, Barcode vacutainer tracking, MD Pathologist review, and cold-chain sample logistics.',
    badge: 'Quality Strip',
    category: 'Public Info',
  },
  {
    key: 'doctors',
    name: 'Pathologists & Consultant Doctors Section',
    description: 'Profiles of chief pathologist, biochemist, and microbiologist with medical council registration numbers and degrees.',
    badge: 'Doctors',
    category: 'Clinical',
  },
  {
    key: 'branches',
    name: 'Our Centers & Collection Desks',
    description: 'List of all branches, central labs, phlebotomy centers with addresses, contact numbers, and timings.',
    badge: 'Centers',
    category: 'Public Info',
  },
  {
    key: 'reportInterlink',
    name: 'Patient Report Download Callout',
    description: 'Direct callout banner allowing patients to look up and download their authenticated NABL report via Report ID & Mobile.',
    badge: 'Reports CTA',
    category: 'Core',
  },
  {
    key: 'footer',
    name: 'Website Footer & Legal Disclaimers',
    description: 'Copyright, lab address, emergency contacts, quick links, and medical laboratory accreditation disclaimers.',
    badge: 'Footer',
    category: 'Public Info',
  },
];

export const VendorWebsiteCmsTab: React.FC<VendorWebsiteCmsTabProps> = ({
  onPreviewWebsite,
  activeSubTab: externalSubTab,
  onSubTabChange,
}) => {
  const {
    vendorLabSettings,
    updateVendorLabSettings,
    updateVendorSection,
    toggleAllVendorSections,
    vendorLabsList,
    selectedVendorLabId,
    currentUser,
    setVendorStatus,
    vendorDoctors,
    addVendorDoctor,
    updateVendorDoctor,
    deleteVendorDoctor,
  } = useCms();

  // Internal Sub-tab State
  const [internalSubTab, setInternalSubTab] = useState<WebsiteSubSection>('banners');
  const activeSubTab = externalSubTab || internalSubTab;

  const handleSelectSubTab = (tab: WebsiteSubSection) => {
    setInternalSubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  const currentLabItem = vendorLabsList.find(
    (l) => l.id === (vendorLabSettings?.labId || selectedVendorLabId)
  ) || vendorLabsList.find(
    (l) => l.name?.toLowerCase() === (vendorLabSettings?.labName || vendorLabSettings?.name)?.toLowerCase()
  );

  const isDraft = currentLabItem
    ? (currentLabItem.status === 'Draft' || currentLabItem.status === 'Pending' || currentLabItem.status !== 'Active' || !currentLabItem.isWebsiteApproved)
    : false;

  // Local form for Website Details
  const [formData, setFormData] = useState<VendorLabSettings>({
    ...vendorLabSettings,
  });

  useEffect(() => {
    setFormData({
      ...vendorLabSettings,
    });
  }, [vendorLabSettings]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastText, setToastText] = useState('Website updates saved successfully!');

  const triggerToast = (msg: string) => {
    setToastText(msg);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // ==========================================
  // 1. BANNERS SECTION STATE & HANDLERS
  // ==========================================
  const [bannerList, setBannerList] = useState<VendorBannerItem[]>(() => {
    if (vendorLabSettings.banners && vendorLabSettings.banners.length > 0) {
      return vendorLabSettings.banners;
    }
    if (vendorLabSettings.heroBanners && vendorLabSettings.heroBanners.length > 0) {
      return vendorLabSettings.heroBanners.map((imgUrl, idx) => ({
        id: `banner-${idx + 1}`,
        title: idx === 0
          ? 'Advanced Diagnostic Pathology & Automated Biochemistry'
          : idx === 1
          ? 'Free Doorstep Home Sample Collection'
          : 'Preventative Full Body Health Screening Profiles',
        subtitle: idx === 0
          ? 'NABL Accredited & ISO 15189 Certified. 100% Verified Digital WhatsApp Reports.'
          : idx === 1
          ? 'Certified phlebotomists with temperature-monitored cold chain sample transit.'
          : 'Flat 50% discount on Comprehensive Executive Full Body Health Checkup.',
        badge: idx === 0 ? 'NABL ACCREDITED' : idx === 1 ? 'HOME COLLECTION' : 'SPECIAL OFFER',
        imageUrl: imgUrl,
        linkUrl: idx === 1 ? '#home-collection' : '#packages',
        buttonText: idx === 1 ? 'Book Sample Pickup' : 'Explore Packages',
        active: true,
      }));
    }
    return [
      {
        id: 'banner-1',
        title: 'Advanced Diagnostic Pathology & Automated Biochemistry',
        subtitle: 'NABL Accredited & ISO 15189 Certified. 100% Verified Digital WhatsApp Reports.',
        badge: 'NABL ACCREDITED',
        imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1600&q=80',
        linkUrl: '#packages',
        buttonText: 'Explore Health Packages',
        active: true,
      },
    ];
  });

  const [editingBanner, setEditingBanner] = useState<VendorBannerItem | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerForm, setBannerForm] = useState<VendorBannerItem>({
    id: '',
    title: '',
    subtitle: '',
    badge: 'SPECIAL OFFER',
    imageUrl: '',
    linkUrl: '#packages',
    buttonText: 'View Details',
    active: true,
  });

  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      id: `banner-${Date.now()}`,
      title: 'Special Health Checkup Camp',
      subtitle: 'Accurate pathology testing with 100% verified digital reports on WhatsApp.',
      badge: 'LIMITED TIME',
      imageUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1600&q=80',
      linkUrl: '#packages',
      buttonText: 'Book Now',
      active: true,
    });
    setIsBannerModalOpen(true);
  };

  const handleOpenEditBanner = (b: VendorBannerItem) => {
    setEditingBanner(b);
    setBannerForm({ ...b });
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: VendorBannerItem[];
    if (editingBanner) {
      updated = bannerList.map((b) => (b.id === editingBanner.id ? bannerForm : b));
    } else {
      updated = [bannerForm, ...bannerList];
    }
    setBannerList(updated);
    // Sync to context
    updateVendorLabSettings({
      banners: updated,
      heroBanners: updated.filter((b) => b.active).map((b) => b.imageUrl),
    });
    setIsBannerModalOpen(false);
    triggerToast(editingBanner ? 'Banner updated successfully!' : 'New banner added successfully!');
  };

  const handleDeleteBanner = (id: string) => {
    const updated = bannerList.filter((b) => b.id !== id);
    setBannerList(updated);
    updateVendorLabSettings({
      banners: updated,
      heroBanners: updated.filter((b) => b.active).map((b) => b.imageUrl),
    });
    triggerToast('Banner deleted successfully!');
  };

  const handleToggleBannerActive = (id: string) => {
    const updated = bannerList.map((b) => (b.id === id ? { ...b, active: !b.active } : b));
    setBannerList(updated);
    updateVendorLabSettings({
      banners: updated,
      heroBanners: updated.filter((b) => b.active).map((b) => b.imageUrl),
    });
    triggerToast('Banner status updated!');
  };

  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBannerForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // Simple Hero Banner Photo Upload (Pure image banners without complex codes)
  const [heroBanners, setHeroBanners] = useState<string[]>(() => {
    if (vendorLabSettings.heroBanners && vendorLabSettings.heroBanners.length > 0) {
      return vendorLabSettings.heroBanners;
    }
    return [
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1600&q=80',
    ];
  });
  const [heroBannerUrlInput, setHeroBannerUrlInput] = useState('');
  const heroBannerFileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (vendorLabSettings.heroBanners && vendorLabSettings.heroBanners.length > 0) {
      setHeroBanners(vendorLabSettings.heroBanners);
    }
  }, [vendorLabSettings.heroBanners]);

  const handleHeroBannerPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const updated = [...heroBanners, dataUrl];
        setHeroBanners(updated);
        updateVendorLabSettings({ heroBanners: updated });
        triggerToast('Hero banner photo uploaded & published to website!');
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleAddHeroBannerUrl = () => {
    const trimmed = heroBannerUrlInput.trim();
    if (!trimmed) return;
    const updated = [...heroBanners, trimmed];
    setHeroBanners(updated);
    updateVendorLabSettings({ heroBanners: updated });
    setHeroBannerUrlInput('');
    triggerToast('Hero banner photo added & published to website!');
  };

  const handleRemoveHeroBannerPhoto = (idx: number) => {
    const updated = heroBanners.filter((_, i) => i !== idx);
    setHeroBanners(updated);
    updateVendorLabSettings({ heroBanners: updated });
    triggerToast('Hero banner photo removed!');
  };

  const handleMoveHeroBanner = (idx: number, direction: 'prev' | 'next') => {
    const target = direction === 'prev' ? idx - 1 : idx + 1;
    if (target < 0 || target >= heroBanners.length) return;
    const updated = [...heroBanners];
    const [moved] = updated.splice(idx, 1);
    updated.splice(target, 0, moved);
    setHeroBanners(updated);
    updateVendorLabSettings({ heroBanners: updated });
    triggerToast('Hero banner order updated!');
  };

  // ==========================================
  // 2. ABOUT US SECTION FORM
  // ==========================================
  const [aboutForm, setAboutForm] = useState({
    aboutTitle: vendorLabSettings.aboutTitle || 'About Our Laboratory & Medical Leadership',
    aboutSubtitle: vendorLabSettings.aboutSubtitle || 'Serving patients, referring physicians, and hospital networks with uncompromising diagnostic precision, automated pathology, and compassionate care.',
    establishedYear: vendorLabSettings.establishedYear || 2012,
    aboutStory: vendorLabSettings.aboutStory || 'Founded with a singular dedication to diagnostic excellence, our laboratory bridges the gap between modern clinical science and patient-centered healthcare. From routine health panels to specialized diagnostic assays, our laboratory is trusted by families, clinicians, and medical networks.',
    aboutHeritage: vendorLabSettings.aboutHeritage || 'We operate in strict compliance with ISO 15189:2022 and NABL standards. Every specimen undergoes rigorous multi-tier internal quality controls (IQC) and participating International External Quality Assessment Schemes (EQAS). Equipped with advanced fully-automated biochemistry analyzers and 5-part hematology counters.',
  });

  const handleSaveAbout = (e: React.FormEvent) => {
    e.preventDefault();
    updateVendorLabSettings({
      ...aboutForm,
    });
    triggerToast('About Us section updated successfully!');
  };

  // ==========================================
  // 3. FOUNDER SECTION FORM
  // ==========================================
  const [founderForm, setFounderForm] = useState({
    founderName: vendorLabSettings.founderName || 'Dr. R. K. Sharma',
    founderDesignation: vendorLabSettings.founderDesignation || 'Chief Medical Director & Founder',
    founderDegrees: vendorLabSettings.founderDegrees || 'MBBS, MD (Pathology)',
    founderExperience: vendorLabSettings.founderExperience || 'Chief Pathologist • 18+ Years Clinical Experience',
    founderBadge: vendorLabSettings.founderBadge || 'AIIMS Gold Medalist',
    founderPhotoUrl: vendorLabSettings.founderPhotoUrl || '/src/assets/images/founder_pathologist_1790345211989.jpg',
    founderMessage: vendorLabSettings.founderMessage || 'A pathology report is not merely numbers on paper; a doctor relies on it to prescribe life-saving medicine, and a patient trusts it with their health. At our laboratory, our sacred commitment is diagnostic accuracy, uncompromising sample purity, and delivering every report with complete transparency.',
    founderCredentials: vendorLabSettings.founderCredentials || [
      'MD Pathology from AIIMS • Senior Resident Ex-Fellow',
      'Fellow of Indian College of Pathologists (FICP)',
      'Lead Auditor for NABL / ISO 15189 Quality Systems',
    ],
  });

  const [newCredential, setNewCredential] = useState('');

  const handleFounderPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFounderForm((prev) => ({ ...prev, founderPhotoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddCredential = () => {
    if (!newCredential.trim()) return;
    setFounderForm((prev) => ({
      ...prev,
      founderCredentials: [...(prev.founderCredentials || []), newCredential.trim()],
    }));
    setNewCredential('');
  };

  const handleRemoveCredential = (index: number) => {
    setFounderForm((prev) => ({
      ...prev,
      founderCredentials: (prev.founderCredentials || []).filter((_, i) => i !== index),
    }));
  };

  const handleSaveFounder = (e: React.FormEvent) => {
    e.preventDefault();
    updateVendorLabSettings({
      ...founderForm,
    });
    triggerToast('Founder Section updated successfully!');
  };

  // ==========================================
  // 4. TEAM SECTION (ADD / EDIT / DELETE)
  // ==========================================
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<VendorDoctor | null>(null);
  const [teamForm, setTeamForm] = useState<Omit<VendorDoctor, 'id'>>({
    name: '',
    degrees: 'MBBS, MD (Pathology)',
    qualification: 'MD Pathology',
    designation: 'Consultant Pathologist',
    roleCategory: 'Pathologist',
    specialization: 'Clinical Pathology & Histopathology',
    specialExpertise: 'Hematology & Bone Marrow Aspiration',
    experience: '10+ Years Experience',
    bio: 'Dedicated medical laboratory specialist ensuring highest accuracy and prompt digital report validation.',
    avatarEmoji: '👨‍⚕️',
    imageUrl: '/src/assets/images/team_pathologist_woman_1790345423035.jpg',
  });

  const handleOpenAddTeam = () => {
    setEditingTeamMember(null);
    setTeamForm({
      name: '',
      degrees: 'MBBS, MD (Pathology)',
      qualification: 'MD Pathology',
      designation: 'Consultant Clinical Pathologist',
      roleCategory: 'Pathologist',
      specialization: 'Clinical Pathology',
      specialExpertise: 'Automated Hematology & Quality Assurance',
      experience: '8+ Years Experience',
      bio: 'Experienced clinical pathologist overseeing daily specimen verifications and critical alert findings.',
      avatarEmoji: '👨‍⚕️',
      imageUrl: '/src/assets/images/team_pathologist_woman_1790345423035.jpg',
    });
    setIsTeamModalOpen(true);
  };

  const handleOpenEditTeam = (doc: VendorDoctor) => {
    setEditingTeamMember(doc);
    setTeamForm({
      name: doc.name,
      degrees: doc.degrees || doc.qualification || 'MBBS, MD',
      qualification: doc.qualification || doc.degrees,
      designation: doc.designation || 'Consultant Specialist',
      roleCategory: doc.roleCategory || 'Pathologist',
      specialization: doc.specialization || 'Clinical Pathology',
      specialExpertise: doc.specialExpertise || '',
      experience: doc.experience || '5+ Years Experience',
      bio: doc.bio || '',
      avatarEmoji: doc.avatarEmoji || '👨‍⚕️',
      imageUrl: doc.imageUrl || '',
    });
    setIsTeamModalOpen(true);
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) return;

    if (editingTeamMember) {
      updateVendorDoctor(editingTeamMember.id, teamForm);
      triggerToast(`Team member "${teamForm.name}" updated successfully!`);
    } else {
      addVendorDoctor(teamForm);
      triggerToast(`New team expert "${teamForm.name}" added successfully!`);
    }
    setIsTeamModalOpen(false);
  };

  const handleDeleteTeam = (id: string, name: string) => {
    deleteVendorDoctor(id);
    triggerToast(`Team member "${name}" removed.`);
  };

  const handleTeamPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setTeamForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // 5. CONTACT US SECTION FORM
  // ==========================================
  const [contactForm, setContactForm] = useState({
    phone: vendorLabSettings.phone || '',
    helplinePhone: vendorLabSettings.helplinePhone || '',
    whatsapp: vendorLabSettings.whatsapp || '',
    email: vendorLabSettings.email || '',
    address: vendorLabSettings.address || '',
    openingHours: vendorLabSettings.openingHours || 'Open 7:00 AM – 9:00 PM (All 7 Days)',
    emergencyHours: vendorLabSettings.emergencyHours || '24x7 Emergency Services at Central Lab',
    contactGoogleMapUrl: vendorLabSettings.contactGoogleMapUrl || '',
  });

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    updateVendorLabSettings({
      ...contactForm,
    });
    triggerToast('Contact Us details updated successfully!');
  };

  // ==========================================
  // 6. SOCIAL MEDIA SECTION FORM (Edit, Disable)
  // ==========================================
  const [socialForm, setSocialForm] = useState<VendorSocialLinks>({
    enabled: vendorLabSettings.socialMedia?.enabled !== false,
    facebook: vendorLabSettings.socialMedia?.facebook || 'https://facebook.com',
    instagram: vendorLabSettings.socialMedia?.instagram || 'https://instagram.com',
    twitter: vendorLabSettings.socialMedia?.twitter || 'https://twitter.com',
    youtube: vendorLabSettings.socialMedia?.youtube || 'https://youtube.com',
    linkedin: vendorLabSettings.socialMedia?.linkedin || 'https://linkedin.com',
    whatsapp: vendorLabSettings.socialMedia?.whatsapp || vendorLabSettings.whatsapp || '',
  });

  const handleSaveSocial = (e: React.FormEvent) => {
    e.preventDefault();
    updateVendorLabSettings({
      socialMedia: socialForm,
    });
    triggerToast('Social Media settings updated successfully!');
  };

  // ==========================================
  // 7. LEGAL PAGES SECTION FORM (T&C, P&P, Refund)
  // ==========================================
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy' | 'refund'>('terms');
  const [legalForm, setLegalForm] = useState({
    termsAndConditions: vendorLabSettings.termsAndConditions || '',
    privacyPolicy: vendorLabSettings.privacyPolicy || '',
    refundPolicy: vendorLabSettings.refundPolicy || '',
  });

  const [isPreviewPolicyModalOpen, setIsPreviewPolicyModalOpen] = useState(false);

  const handleSaveLegal = (e: React.FormEvent) => {
    e.preventDefault();
    updateVendorLabSettings({
      ...legalForm,
    });
    triggerToast('Legal policies saved successfully!');
  };

  const handleResetLegalToDefault = (type: 'terms' | 'privacy' | 'refund') => {
    if (type === 'terms') {
      const def = `1. ACCEPTANCE OF TERMS: By accessing or utilizing the services provided by this diagnostic laboratory, patients and referring healthcare providers agree to abide by all clinical laboratory terms and protocols.
2. DIAGNOSTIC SERVICES & TESTING: All testing is performed under strictly regulated NABL accredited and ISO 15189 standards using calibrated automated analyzers. Reports reflect specimen findings at the time of collection.
3. SAMPLE COLLECTION & FASTING PROTOCOLS: Certain clinical tests mandate pre-test fasting, medication adjustments, or specific dietary preparations. Failure to adhere may affect diagnostic accuracy.
4. DELIVERY OF RESULTS: Verified digital reports are dispatched via secure WhatsApp PDF and online patient portal. In cases of critical alert values, referring clinicians or patient emergency contacts will be promptly notified.
5. LIMITATION OF LIABILITY: Test results should always be correlated with clinical symptoms and interpreted by a registered medical practitioner. No medical diagnosis is conclusive based solely on an isolated report.`;
      setLegalForm((prev) => ({ ...prev, termsAndConditions: def }));
    } else if (type === 'privacy') {
      const def = `1. DATA CONFIDENTIALITY: We uphold stringent patient privacy and medical confidentiality in compliance with medical data security standards and healthcare data protection laws.
2. COLLECTION OF INFORMATION: We collect necessary demographic and clinical details (e.g., patient name, age, gender, contact number, referring doctor) solely for accurate test processing, billing, and report generation.
3. DIGITAL REPORT ACCESS: Patient test results are accessible only via authenticated credentials (Unique Report ID & registered Mobile Number) or direct authorized WhatsApp transmission.
4. THIRD-PARTY SHARING: Patient diagnostic records are never sold, rented, or disclosed to unauthorized commercial third parties. Data is shared exclusively with treating medical practitioners upon patient consent or as required by statutory public health mandates.
5. DATA STORAGE & RETENTION: Physical specimen records and digital pathology logs are safely archived in accordance with statutory medical record retention schedules.`;
      setLegalForm((prev) => ({ ...prev, privacyPolicy: def }));
    } else if (type === 'refund') {
      const def = `1. CANCELLATION BEFORE SAMPLE COLLECTION: If a patient cancels a scheduled laboratory test or home sample collection appointment before the phlebotomist visits or sample is drawn, a 100% full refund will be processed promptly.
2. POST-COLLECTION STATUS: Once a biological specimen has been collected, transported, or processed in the laboratory analyzer, cancellations or refunds cannot be issued due to incurred reagent and consumable costs.
3. FAILED OR INCONCLUSIVE SAMPLES: In the rare event of hemolysis, lipemia, or insufficient sample volume necessitating a repeat test, a free recollected sample will be processed at no additional charge to the patient.
4. REFUND DISPATCH TIMELINE: Approved digital payment refunds are credited back to the original source UPI / Bank Account within 2 to 5 business days.`;
      setLegalForm((prev) => ({ ...prev, refundPolicy: def }));
    }
    triggerToast('Reset to standard medical policy template.');
  };

  // ==========================================
  // 8. URLS & CONTROLS HELPER
  // ==========================================
  const [copiedMeta, setCopiedMeta] = useState(false);
  const [copiedSubdomain, setCopiedSubdomain] = useState(false);
  const [copiedDirectUrl, setCopiedDirectUrl] = useState(false);

  const tenantSubdomainUrl = getTenantWebsiteUrl(
    currentLabItem?.domainPreview || `${currentLabItem?.id || 'apexdiagnostics'}.${SUPER_ADMIN_DOMAIN}`
  );
  const tenantDirectUrl = getTenantDirectUrl(
    currentLabItem?.domainPreview || currentLabItem?.id || 'apexdiagnostics'
  );

  const [activeSectionFilter, setActiveSectionFilter] = useState<'All' | 'Core' | 'Public Info' | 'Clinical'>('All');
  const currentSections: VendorWebsiteSections = {
    ...DEFAULT_VENDOR_SECTIONS,
    ...(vendorLabSettings?.sections || {}),
  };
  const activeSectionsCount = Object.values(currentSections).filter(Boolean).length;
  const totalSectionsCount = SECTION_METAS.length;

  const filteredSections = SECTION_METAS.filter((s) => {
    if (activeSectionFilter === 'All') return true;
    return s.category === activeSectionFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Sub-Nav */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#123B6D]/10 text-[#123B6D]">
                <Globe className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-[#123B6D]">
                  Website Section Management
                </h2>
                <span className="text-[11px] text-slate-500">
                  Real-time CMS for Banners, About Us, Founder, Team, Contact, Social Media &amp; Legal Policies.
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onPreviewWebsite && (
              <button
                type="button"
                onClick={onPreviewWebsite}
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span>{isDraft ? 'Preview Draft Website' : 'Live Website Preview'}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </button>
            )}
          </div>
        </div>

        {/* Website Sub-Section Tabs Strip */}
        <div className="pt-3 flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => handleSelectSubTab('banners')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'banners'
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>🖼️ Banner Section ({bannerList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubTab('about')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'about'
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🏛️ About Us</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubTab('founder')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'founder'
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>👑 Founder Section</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubTab('team')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'team'
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>👨‍⚕️ Team Section ({vendorDoctors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubTab('contact')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'contact'
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>📞 Contact Us</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubTab('social')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'social'
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>🔗 Social Media {socialForm.enabled ? '✓' : '(Disabled)'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubTab('legal')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'legal'
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>📜 Legal Pages (T&C, P&P, Refund)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubTab('sections')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'sections'
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>⚙️ Sections ON/OFF &amp; Domains</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastText}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. BANNER SECTION (Change / Delete / Add) */}
      {/* ======================================================== */}
      {activeSubTab === 'banners' && (
        <div className="space-y-6">
          {/* HERO SECTION SIMPLE IMAGE BANNER UPLOAD CARD */}
          <div className="bg-white rounded-2xl border-2 border-[#123B6D]/30 shadow-md overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#123B6D] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Hero Section • Pure Photo Upload
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Live on Website ({heroBanners.length} Banners)
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#123B6D]" />
                  <span>Hero Section Photo Banners (Simple Image Upload)</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Direct photo upload for the main Hero banner carousel. No complex codes or text overlays — simply upload or paste your high-resolution banner photo!
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => heroBannerFileInputRef.current?.click()}
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                  title="Upload image photo directly from your device"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Upload Banner Photo</span>
                </button>
                <input
                  ref={heroBannerFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleHeroBannerPhotoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* URL Upload Bar & Guidelines */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Or paste direct image URL (e.g. https://yourcdn.com/banner.jpg)..."
                  value={heroBannerUrlInput}
                  onChange={(e) => setHeroBannerUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddHeroBannerUrl();
                    }
                  }}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30"
                />
                <button
                  type="button"
                  onClick={handleAddHeroBannerUrl}
                  disabled={!heroBannerUrlInput.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
                >
                  Add Photo
                </button>
              </div>

              <span className="text-[11px] text-slate-500 whitespace-nowrap hidden lg:inline">
                Recommended aspect ratio: <strong>21:9</strong> or <strong>16:9</strong> (1600×700 px)
              </span>
            </div>

            {/* Active Hero Banner Photos Grid */}
            <div className="p-5">
              {heroBanners.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                  No hero banner photos uploaded yet. Click "Upload Banner Photo" above to add your first photo banner.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {heroBanners.map((imgUrl, hIdx) => (
                    <div
                      key={hIdx}
                      className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-[16/9] shadow-sm hover:shadow-md transition"
                    >
                      <img
                        src={imgUrl}
                        alt={`Hero Banner ${hIdx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                      />
                      {/* Slide Badge */}
                      <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border border-white/20">
                        Slide #{hIdx + 1}
                      </div>

                      {/* Action Controls Overlay: Move Left, Move Right, Delete */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                        {hIdx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveHeroBanner(hIdx, 'prev')}
                            className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center shadow-md transition cursor-pointer active:scale-90"
                            title="Move Banner Left (Earlier in carousel)"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hIdx < heroBanners.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveHeroBanner(hIdx, 'next')}
                            className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center shadow-md transition cursor-pointer active:scale-90"
                            title="Move Banner Right (Later in carousel)"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveHeroBannerPhoto(hIdx)}
                          className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md transition cursor-pointer active:scale-90"
                          title="Delete this hero banner photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Bottom Quick Indicator */}
                      <div className="absolute bottom-2 left-2 right-2 text-[10px] text-white/90 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded text-center truncate">
                        {hIdx === 0 ? '★ Primary (First) Banner' : `Secondary Carousel Banner #${hIdx + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#123B6D]" />
                  <span>Website Hero &amp; Promotional Banners</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Change existing banners, delete obsolete offers, or upload fresh high-resolution promotions for your lab website.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddBanner}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Banner</span>
                </button>
              </div>
            </div>

            {/* Banners Grid */}
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {bannerList.map((banner, bIdx) => (
                <div
                  key={banner.id || bIdx}
                  className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition shadow-xs hover:shadow-md ${
                    banner.active ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50/70 opacity-75'
                  }`}
                >
                  {/* Banner Image Preview */}
                  <div className="w-full h-44 bg-slate-900 relative overflow-hidden group">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="bg-[#123B6D] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                        {banner.badge || 'PROMO'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          banner.active ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
                        }`}
                      >
                        {banner.active ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded font-mono">
                      #{bIdx + 1}
                    </div>
                  </div>

                  {/* Banner Content Details */}
                  <div className="p-4 space-y-2 flex-1">
                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2">
                      {banner.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {banner.subtitle}
                    </p>
                    {banner.buttonText && (
                      <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#123B6D] font-bold">
                        <span>Action Button:</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{banner.buttonText}</span>
                      </div>
                    )}
                  </div>

                  {/* Banner Action Buttons: Change, Delete, Toggle Active */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleBannerActive(banner.id)}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                        banner.active
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                      title={banner.active ? 'Click to Disable Banner' : 'Click to Enable Banner'}
                    >
                      {banner.active ? 'Disable' : 'Enable'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditBanner(banner)}
                        className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Change / Edit Banner"
                      >
                        <Edit2 className="w-3 h-3 text-amber-300" />
                        <span>Change</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Delete this banner"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add / Edit Banner Modal */}
          {isBannerModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#123B6D] text-white">
                  <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>{editingBanner ? 'Change / Edit Banner' : 'Add New Promotional Banner'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsBannerModalOpen(false)}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveBanner} className="p-6 space-y-4 overflow-y-auto text-xs">
                  {/* Banner Image Preview & Upload */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Banner Image Preview &amp; Upload <span className="text-rose-500">*</span>
                    </label>
                    <div className="w-full h-36 rounded-xl border border-slate-300 bg-slate-900 overflow-hidden relative mb-2 flex items-center justify-center">
                      {bannerForm.imageUrl ? (
                        <img
                          src={bannerForm.imageUrl}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-slate-400 text-xs font-bold flex flex-col items-center gap-1">
                          <ImageIcon className="w-6 h-6 stroke-1" />
                          <span>No Image Selected</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition">
                        <Upload className="w-3.5 h-3.5 text-[#123B6D]" />
                        <span>Upload Photo File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleBannerFileUpload}
                        />
                      </label>
                      <span className="text-slate-400">or enter image link:</span>
                    </div>
                    <input
                      type="url"
                      required
                      value={bannerForm.imageUrl}
                      onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/... or uploaded link"
                      className="w-full px-3 py-2 mt-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px] focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Banner Headline / Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      placeholder="e.g. Complete Diagnostic Pathology & NABL Verified Testing"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Subtitle / Promotional Details
                    </label>
                    <textarea
                      rows={2}
                      value={bannerForm.subtitle || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                      placeholder="e.g. Free Home Sample Collection across city • Instant report on WhatsApp in 4-6 hours."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Badge Text
                      </label>
                      <input
                        type="text"
                        value={bannerForm.badge || ''}
                        onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                        placeholder="e.g. 50% OFF or NABL ACCREDITED"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 uppercase font-bold text-[11px] focus:ring-2 focus:ring-[#123B6D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={bannerForm.buttonText || ''}
                        onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                        placeholder="e.g. Book Test"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold text-[11px] focus:ring-2 focus:ring-[#123B6D]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Action Link Target (URL / Hash)
                    </label>
                    <input
                      type="text"
                      value={bannerForm.linkUrl || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                      placeholder="e.g. #packages or #home-collection or https://..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px] focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="bannerActive"
                      checked={bannerForm.active}
                      onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })}
                      className="rounded text-[#123B6D] focus:ring-[#123B6D]"
                    />
                    <label htmlFor="bannerActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Keep this banner active and visible on website
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsBannerModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5 text-amber-400" />
                      <span>{editingBanner ? 'Save Changes' : 'Add Banner'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ABOUT US SECTION (Edit) */}
      {/* ======================================================== */}
      {activeSubTab === 'about' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>About Us Section Editor (Lab Story &amp; Clinical Heritage)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize your lab's founding history, established year, clinical heritage, and ISO/NABL quality commitment.
              </p>
            </div>
            <button
              onClick={handleSaveAbout}
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save About Section</span>
            </button>
          </div>

          <form onSubmit={handleSaveAbout} className="p-6 space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Section Headline / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={aboutForm.aboutTitle}
                  onChange={(e) => setAboutForm({ ...aboutForm, aboutTitle: e.target.value })}
                  placeholder="About Our Laboratory & Medical Leadership"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Established Year
                </label>
                <input
                  type="number"
                  value={aboutForm.establishedYear}
                  onChange={(e) => setAboutForm({ ...aboutForm, establishedYear: Number(e.target.value) || 2012 })}
                  placeholder="2012"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono font-bold focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Sub-heading / Summary Statement
              </label>
              <textarea
                rows={2}
                value={aboutForm.aboutSubtitle}
                onChange={(e) => setAboutForm({ ...aboutForm, aboutSubtitle: e.target.value })}
                placeholder="Serving patients, referring physicians, and hospital networks with uncompromising diagnostic precision..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#123B6D]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Our Journey &amp; Legacy of Clinical Excellence (Main Story) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={aboutForm.aboutStory}
                onChange={(e) => setAboutForm({ ...aboutForm, aboutStory: e.target.value })}
                placeholder="Founded with a singular dedication to diagnostic excellence, our laboratory bridges the gap between modern clinical science and patient-centered healthcare..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 leading-relaxed focus:ring-2 focus:ring-[#123B6D]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Clinical Equipment &amp; Quality Control Highlights
              </label>
              <textarea
                rows={3}
                value={aboutForm.aboutHeritage}
                onChange={(e) => setAboutForm({ ...aboutForm, aboutHeritage: e.target.value })}
                placeholder="Equipped with advanced fully-automated biochemistry analyzers, 5-part hematology counters, and bidirectionally interfaced barcode systems..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 leading-relaxed focus:ring-2 focus:ring-[#123B6D]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save About Us Content</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. FOUNDER SECTION (Edit) */}
      {/* ======================================================== */}
      {activeSubTab === 'founder' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Founder / Chief Medical Director Section Editor</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Edit the Founder's name, photograph, qualifications, clinical credentials, and personalized message to patients.
              </p>
            </div>
            <button
              onClick={handleSaveFounder}
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Founder Section</span>
            </button>
          </div>

          <form onSubmit={handleSaveFounder} className="p-6 space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              {/* Founder Photo */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-[11px] font-bold text-slate-700">
                  Founder Photograph
                </label>
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-300 mx-auto bg-slate-100 shadow-sm relative group">
                  <img
                    src={founderForm.founderPhotoUrl || '/src/assets/images/founder_pathologist_1790345211989.jpg'}
                    alt="Founder Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition">
                    <Upload className="w-3.5 h-3.5 text-[#123B6D]" />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFounderPhotoUpload}
                    />
                  </label>
                  <input
                    type="url"
                    value={founderForm.founderPhotoUrl}
                    onChange={(e) => setFounderForm({ ...founderForm, founderPhotoUrl: e.target.value })}
                    placeholder="or paste image URL"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-[11px] font-mono"
                  />
                </div>
              </div>

              {/* Founder Credentials & Details */}
              <div className="md:col-span-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Founder Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={founderForm.founderName}
                      onChange={(e) => setFounderForm({ ...founderForm, founderName: e.target.value })}
                      placeholder="e.g. Dr. R. K. Sharma"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Founder Designation / Role
                    </label>
                    <input
                      type="text"
                      value={founderForm.founderDesignation}
                      onChange={(e) => setFounderForm({ ...founderForm, founderDesignation: e.target.value })}
                      placeholder="e.g. Chief Medical Director & Founder"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Medical Degrees &amp; Fellowship
                    </label>
                    <input
                      type="text"
                      value={founderForm.founderDegrees}
                      onChange={(e) => setFounderForm({ ...founderForm, founderDegrees: e.target.value })}
                      placeholder="e.g. MBBS, MD (Pathology), FICP"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Experience &amp; Specialty
                    </label>
                    <input
                      type="text"
                      value={founderForm.founderExperience}
                      onChange={(e) => setFounderForm({ ...founderForm, founderExperience: e.target.value })}
                      placeholder="e.g. Chief Pathologist • 18+ Years Clinical Experience"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Top Honor / Accreditation Badge
                    </label>
                    <input
                      type="text"
                      value={founderForm.founderBadge}
                      onChange={(e) => setFounderForm({ ...founderForm, founderBadge: e.target.value })}
                      placeholder="e.g. AIIMS Gold Medalist or Senior Consultant Pathologist"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold text-[#0F766E] focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Founder's Message to Patients &amp; Doctors
                  </label>
                  <textarea
                    rows={3}
                    value={founderForm.founderMessage}
                    onChange={(e) => setFounderForm({ ...founderForm, founderMessage: e.target.value })}
                    placeholder="A pathology report is not merely numbers on paper; a doctor relies on it to prescribe life-saving medicine..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 italic leading-relaxed focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>
              </div>
            </div>

            {/* Clinical Credentials List (Add / Delete) */}
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
              <label className="block text-[11px] font-bold text-slate-700">
                Clinical Credentials &amp; Certifications (Bullet points)
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCredential}
                  onChange={(e) => setNewCredential(e.target.value)}
                  placeholder="e.g. Lead Auditor for NABL / ISO 15189 Quality Systems"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddCredential}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold cursor-pointer"
                >
                  Add Credential
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                {(founderForm.founderCredentials || []).map((cred, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-slate-800">{cred}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCredential(idx)}
                      className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save Founder Details</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TEAM SECTION (Add / Edit / Delete) */}
      {/* ======================================================== */}
      {activeSubTab === 'team' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#123B6D]" />
                  <span>Qualified Clinical Team &amp; Specialists (Add / Edit / Delete)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage Pathologists, Biochemists, Microbiologists, and Senior Technologists displayed on your website.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddTeam}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Team Expert</span>
              </button>
            </div>

            {/* Team Grid */}
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {vendorDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-[#123B6D]/40 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                        {doc.imageUrl ? (
                          <img
                            src={doc.imageUrl}
                            alt={doc.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {doc.avatarEmoji || '👨‍⚕️'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#123B6D] inline-block mb-0.5">
                          {doc.roleCategory || 'Specialist'}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">
                          {doc.name}
                        </h4>
                        <div className="text-[11px] text-slate-600 font-semibold truncate">
                          {doc.degrees || doc.qualification || 'MBBS, MD'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="text-slate-700 font-bold">
                        {doc.specialization || doc.designation}
                      </div>
                      <div className="text-[11px] text-emerald-800 font-semibold">
                        {doc.experience || 'Experienced Specialist'}
                      </div>
                      {doc.bio && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                          {doc.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditTeam(doc)}
                      className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-amber-300" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(doc.id, doc.name)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add / Edit Team Modal */}
          {isTeamModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#123B6D] text-white">
                  <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>{editingTeamMember ? 'Edit Team Expert' : 'Add New Medical Team Member'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsTeamModalOpen(false)}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveTeam} className="p-6 space-y-4 overflow-y-auto text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Doctor / Expert Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      placeholder="e.g. Dr. Kavita Deshmukh"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Role Category
                      </label>
                      <select
                        value={teamForm.roleCategory || 'Pathologist'}
                        onChange={(e) => setTeamForm({ ...teamForm, roleCategory: e.target.value as any })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold bg-white"
                      >
                        <option value="Pathologist">Pathologist</option>
                        <option value="Biochemist">Biochemist</option>
                        <option value="Microbiologist">Microbiologist</option>
                        <option value="Technician">Senior Lab Technologist</option>
                        <option value="Phlebotomist">Senior Phlebotomist</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Qualifications / Degrees
                      </label>
                      <input
                        type="text"
                        value={teamForm.degrees}
                        onChange={(e) => setTeamForm({ ...teamForm, degrees: e.target.value, qualification: e.target.value })}
                        placeholder="e.g. MBBS, MD (Microbiology)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Specialization / Focus
                      </label>
                      <input
                        type="text"
                        value={teamForm.specialization}
                        onChange={(e) => setTeamForm({ ...teamForm, specialization: e.target.value })}
                        placeholder="e.g. Clinical Immunology & Serology"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Experience
                      </label>
                      <input
                        type="text"
                        value={teamForm.experience}
                        onChange={(e) => setTeamForm({ ...teamForm, experience: e.target.value })}
                        placeholder="e.g. 12+ Years Clinical Experience"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Doctor Photo
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition">
                        <Upload className="w-3.5 h-3.5 text-[#123B6D]" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleTeamPhotoUpload}
                        />
                      </label>
                      <span className="text-slate-400">or paste link:</span>
                    </div>
                    <input
                      type="url"
                      value={teamForm.imageUrl || ''}
                      onChange={(e) => setTeamForm({ ...teamForm, imageUrl: e.target.value })}
                      placeholder="https://... or uploaded file"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Short Biography
                    </label>
                    <textarea
                      rows={3}
                      value={teamForm.bio || ''}
                      onChange={(e) => setTeamForm({ ...teamForm, bio: e.target.value })}
                      placeholder="Specialized expertise and clinical hospital affiliations..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsTeamModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5 text-amber-400" />
                      <span>{editingTeamMember ? 'Save Changes' : 'Add Member'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. CONTACT US SECTION (Edit) */}
      {/* ======================================================== */}
      {activeSubTab === 'contact' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Contact Us &amp; Location Section (Edit)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Edit physical address, helpline numbers, WhatsApp dispatch, timings, and map location.
              </p>
            </div>
            <button
              onClick={handleSaveContact}
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Contact Info</span>
            </button>
          </div>

          <form onSubmit={handleSaveContact} className="p-6 space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Primary Helpline Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="e.g. 7087033009"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  24x7 Emergency Line
                </label>
                <input
                  type="text"
                  value={contactForm.helplinePhone}
                  onChange={(e) => setContactForm({ ...contactForm, helplinePhone: e.target.value })}
                  placeholder="e.g. +91 7087033009"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  WhatsApp Booking &amp; Dispatch Number
                </label>
                <input
                  type="text"
                  value={contactForm.whatsapp}
                  onChange={(e) => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                  placeholder="e.g. 917087033009"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="e.g. care@apexdiagnostics.in"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Physical Laboratory Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={contactForm.address}
                  onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                  placeholder="SCF 42-43, Sector 18-C, Central Healthcare Complex, Ludhiana, Punjab"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Laboratory Timings
                </label>
                <input
                  type="text"
                  value={contactForm.openingHours}
                  onChange={(e) => setContactForm({ ...contactForm, openingHours: e.target.value })}
                  placeholder="e.g. Open 7:00 AM – 9:00 PM (All 7 Days)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Emergency Services Availability
                </label>
                <input
                  type="text"
                  value={contactForm.emergencyHours}
                  onChange={(e) => setContactForm({ ...contactForm, emergencyHours: e.target.value })}
                  placeholder="e.g. 24x7 Emergency Services at Central Lab"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Google Maps Location Link or Embed URL
                </label>
                <input
                  type="text"
                  value={contactForm.contactGoogleMapUrl}
                  onChange={(e) => setContactForm({ ...contactForm, contactGoogleMapUrl: e.target.value })}
                  placeholder="e.g. https://maps.google.com/?q=Apex+Diagnostic+Ludhiana"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save Contact Details</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. SOCIAL MEDIA (Edit, Disable) */}
      {/* ======================================================== */}
      {activeSubTab === 'social' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>Social Media Profiles &amp; Display Control (Edit &amp; Disable)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your social media links or disable the social icons completely from the website.
              </p>
            </div>
            <button
              onClick={handleSaveSocial}
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Social Settings</span>
            </button>
          </div>

          <form onSubmit={handleSaveSocial} className="p-6 space-y-5 text-xs">
            {/* Master Toggle to Enable / Disable Social Media */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition ${
              socialForm.enabled ? 'bg-emerald-50/60 border-emerald-300' : 'bg-rose-50/60 border-rose-300'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                  socialForm.enabled ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}>
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                    <span>Display Social Media Icons on Website</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      socialForm.enabled ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                    }`}>
                      {socialForm.enabled ? 'Enabled' : 'Disabled (Hidden)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {socialForm.enabled
                      ? 'Social media links will be prominently shown in your website footer and contact section.'
                      : 'All social media links and icons are completely hidden from patients on the website.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSocialForm({ ...socialForm, enabled: !socialForm.enabled })}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                  socialForm.enabled
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {socialForm.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                <span>{socialForm.enabled ? 'Turn OFF' : 'Turn ON'}</span>
              </button>
            </div>

            {/* Social Links Inputs */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${!socialForm.enabled ? 'opacity-60 pointer-events-none' : ''}`}>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                  <span>Facebook Profile / Page URL</span>
                </label>
                <input
                  type="url"
                  value={socialForm.facebook || ''}
                  onChange={(e) => setSocialForm({ ...socialForm, facebook: e.target.value })}
                  placeholder="https://facebook.com/yourlab"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-rose-600" />
                  <span>Instagram Handle / Profile URL</span>
                </label>
                <input
                  type="url"
                  value={socialForm.instagram || ''}
                  onChange={(e) => setSocialForm({ ...socialForm, instagram: e.target.value })}
                  placeholder="https://instagram.com/yourlab"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Twitter className="w-3.5 h-3.5 text-slate-800" />
                  <span>Twitter / X Profile URL</span>
                </label>
                <input
                  type="url"
                  value={socialForm.twitter || ''}
                  onChange={(e) => setSocialForm({ ...socialForm, twitter: e.target.value })}
                  placeholder="https://twitter.com/yourlab"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Youtube className="w-3.5 h-3.5 text-red-600" />
                  <span>YouTube Channel URL</span>
                </label>
                <input
                  type="url"
                  value={socialForm.youtube || ''}
                  onChange={(e) => setSocialForm({ ...socialForm, youtube: e.target.value })}
                  placeholder="https://youtube.com/@yourlab"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                  <span>LinkedIn Company URL</span>
                </label>
                <input
                  type="url"
                  value={socialForm.linkedin || ''}
                  onChange={(e) => setSocialForm({ ...socialForm, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/company/yourlab"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Link / Number</span>
                </label>
                <input
                  type="text"
                  value={socialForm.whatsapp || ''}
                  onChange={(e) => setSocialForm({ ...socialForm, whatsapp: e.target.value })}
                  placeholder="917087033009"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save Social Media Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. LEGAL PAGES (T&C, P&P, Refund : Edit) */}
      {/* ======================================================== */}
      {activeSubTab === 'legal' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#123B6D]" />
                <span>Legal Pages Editor (Terms &amp; Conditions, Privacy Policy &amp; Refund)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize your medical laboratory terms, patient data privacy statement, and cancellation &amp; refund clauses.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewPolicyModalOpen(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Preview Modal</span>
              </button>

              <button
                onClick={handleSaveLegal}
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Legal Policies</span>
              </button>
            </div>
          </div>

          {/* Sub-tabs for T&C, Privacy, Refund */}
          <div className="px-6 pt-4 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setLegalTab('terms')}
              className={`px-4 py-2 rounded-t-xl font-bold transition border-b-2 cursor-pointer ${
                legalTab === 'terms'
                  ? 'border-[#123B6D] text-[#123B6D] bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              📋 Terms &amp; Conditions (T&amp;C)
            </button>

            <button
              type="button"
              onClick={() => setLegalTab('privacy')}
              className={`px-4 py-2 rounded-t-xl font-bold transition border-b-2 cursor-pointer ${
                legalTab === 'privacy'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              🛡️ Privacy Policy (P&amp;P)
            </button>

            <button
              type="button"
              onClick={() => setLegalTab('refund')}
              className={`px-4 py-2 rounded-t-xl font-bold transition border-b-2 cursor-pointer ${
                legalTab === 'refund'
                  ? 'border-rose-600 text-rose-700 bg-rose-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              🔄 Refund &amp; Cancellation Policy
            </button>
          </div>

          <form onSubmit={handleSaveLegal} className="p-6 space-y-4 text-xs">
            {legalTab === 'terms' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Terms &amp; Conditions Content
                  </label>
                  <button
                    type="button"
                    onClick={() => handleResetLegalToDefault('terms')}
                    className="text-xs text-[#123B6D] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Standard Medical Template</span>
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={legalForm.termsAndConditions}
                  onChange={(e) => setLegalForm({ ...legalForm, termsAndConditions: e.target.value })}
                  placeholder="Enter custom terms and conditions..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 font-mono text-[11px] leading-relaxed focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>
            )}

            {legalTab === 'privacy' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Privacy Policy &amp; Data Protection Statement
                  </label>
                  <button
                    type="button"
                    onClick={() => handleResetLegalToDefault('privacy')}
                    className="text-xs text-emerald-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Standard Privacy Template</span>
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={legalForm.privacyPolicy}
                  onChange={(e) => setLegalForm({ ...legalForm, privacyPolicy: e.target.value })}
                  placeholder="Enter custom privacy policy details..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 font-mono text-[11px] leading-relaxed focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            )}

            {legalTab === 'refund' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Refund &amp; Cancellation Policy Content
                  </label>
                  <button
                    type="button"
                    onClick={() => handleResetLegalToDefault('refund')}
                    className="text-xs text-rose-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Standard Refund Template</span>
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={legalForm.refundPolicy}
                  onChange={(e) => setLegalForm({ ...legalForm, refundPolicy: e.target.value })}
                  placeholder="Enter custom cancellation and refund policies..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 font-mono text-[11px] leading-relaxed focus:ring-2 focus:ring-rose-600"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save Legal Policies</span>
              </button>
            </div>
          </form>

          {/* Test Policy Modal */}
          <VendorPolicyModal
            isOpen={isPreviewPolicyModalOpen}
            onClose={() => setIsPreviewPolicyModalOpen(false)}
            activeTab={legalTab}
            onSelectTab={setLegalTab}
            labName={vendorLabSettings.labName}
            labPhone={vendorLabSettings.phone}
            labEmail={vendorLabSettings.email}
            customTerms={legalForm.termsAndConditions}
            customPrivacy={legalForm.privacyPolicy}
            customRefund={legalForm.refundPolicy}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. SECTIONS ON/OFF & DOMAINS CONTROLS */}
      {/* ======================================================== */}
      {activeSubTab === 'sections' && (
        <div className="space-y-6">
          {/* Website Status: Draft Mode vs Live Mode Notice */}
          {isDraft ? (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                  <Clock className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-amber-950">
                      Website Status: Draft Mode (ड्राफ्ट मोड - एडमिन अप्रूवल पेंडिंग)
                    </span>
                    <span className="text-[10px] font-black uppercase bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                      Awaiting Admin Approval
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 mt-1 max-w-2xl leading-relaxed">
                    लैब बनाने के बाद वेबसाइट अभी <strong>ड्राफ्ट मोड</strong> में है। जब प्लेटफॉर्म एडमिन (Admin) इसे अप्रूव करेंगे, तभी यह पब्लिकली लाइव होगी। आप सेटिंग्स एडिट कर सकते हैं और प्रीव्यू देख सकते हैं।
                  </p>
                </div>
              </div>
              {currentUser?.role === 'admin' ? (
                <button
                  onClick={() => {
                    if (currentLabItem) {
                      setVendorStatus(currentLabItem.id, 'Active');
                      triggerToast('Website approved and published live!');
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Approve &amp; Make Live (एडमिन अप्रूवल)</span>
                </button>
              ) : (
                <div className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-3 py-1.5 rounded-lg border border-amber-300 shrink-0">
                  ⏳ Pending Admin Approval
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                    <span>Website Status: LIVE &amp; Approved (वेबसाइट लाइव है)</span>
                    <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                      Publicly Active
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Your dedicated laboratory portal is published and accessible to patients online for booking and reports.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dedicated Working URL Card */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/80 p-5 rounded-2xl border border-indigo-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-indigo-950">
                    Your Dedicated Laboratory Website (Har Lab Ka Apna URL)
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Patients can directly visit this URL to view test menus, book home collection, and download reports.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
                Unique Subdomain
              </span>
            </div>

            {/* Direct Live Working URL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Direct Live Working URL (तुरंत खुलने वाला लिंक):</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                  100% Active in Any Browser
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-300">
                <div className="flex-1 flex items-center gap-2 font-mono text-xs text-emerald-950 font-bold px-2 truncate">
                  <span className="text-emerald-700 truncate">{tenantDirectUrl}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(tenantDirectUrl);
                      } catch {}
                      setCopiedDirectUrl(true);
                      setTimeout(() => setCopiedDirectUrl(false), 2500);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    {copiedDirectUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Working Link</span>
                      </>
                    )}
                  </button>

                  {onPreviewWebsite && (
                    <button
                      type="button"
                      onClick={onPreviewWebsite}
                      className="px-3 py-1.5 rounded-lg bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                      <span>Preview</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sections ON / OFF Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#123B6D]" />
                  <h3 className="text-sm font-black text-slate-800">Website Sections ON / OFF Control</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {activeSectionsCount} of {totalSectionsCount} Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Turn any section of your public website ON or OFF with a single toggle. Disabled sections will be completely hidden.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => toggleAllVendorSections(true)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Turn All ON
                </button>
                <button
                  type="button"
                  onClick={() => toggleAllVendorSections(false)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Turn All OFF
                </button>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-slate-400 font-bold mr-1">Filter:</span>
              {(['All', 'Core', 'Clinical', 'Public Info'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveSectionFilter(cat)}
                  className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                    activeSectionFilter === cat
                      ? 'bg-[#123B6D] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSections.map((sec) => {
                const isEnabled = !!currentSections[sec.key];
                return (
                  <div
                    key={sec.key}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isEnabled
                        ? 'border-emerald-200 bg-emerald-50/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50/60 opacity-75'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            isEnabled
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {sec.badge}
                        </span>
                        <span className="text-xs font-black text-slate-800">{sec.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed pr-2">
                        {sec.description}
                      </p>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => updateVendorSection(sec.key, !isEnabled)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isEnabled
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-300 hover:bg-slate-400 text-slate-700'
                        }`}
                        title={isEnabled ? 'Click to Turn OFF' : 'Click to Turn ON'}
                      >
                        {isEnabled ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            <span>ON</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            <span>OFF</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
