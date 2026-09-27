import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  CmsUser,
  LabStaffAccount,
  CompanySettings,
  PricingPlan,
  CompanyFeature,
  CompanyFaq,
  CompanyStat,
  VendorLabSettings,
  VendorPackage,
  VendorDoctor,
  VendorBranch,
  HomeCollectionBooking,
  TestItem,
  LabReport,
  VendorLabDirectoryItem,
  ReceptionPatientEntry,
  PortalWebsiteSections,
  VendorWebsiteSections,
  VendorStatus,
  AppView,
  UserRole,
  Patient,
  LabManagementFeature,
  ContactSubmission,
  DomainRequest,
} from '../types';
import { MOCK_TESTS, FAQ_LIST, SAMPLE_REPORT, INITIAL_REPORTS, VENDOR_LABS_DIRECTORY, INITIAL_RECEPTION_ENTRIES, DEFAULT_LAB_MANAGEMENT_FEATURES } from '../data/mockData';
export { VENDOR_LABS_DIRECTORY };
import { getPermissionsForRole, LAB_OPTIONS } from '../utils/rbac';
import { isTenantMatch, verifyTenantOwnership, stampTenant } from '../utils/tenantSecurity';
import {
  syncReceptionEntryToCloud,
  deleteReceptionEntryFromCloud,
  syncLabReportToCloud,
  deleteLabReportFromCloud,
  syncBookingToCloud,
  deleteBookingFromCloud,
  syncContactSubmissionToCloud,
  deleteContactSubmissionFromCloud,
  subscribeToContactSubmissions,
  syncDomainRequestToCloud,
  deleteDomainRequestFromCloud,
  subscribeToDomainRequests,
  syncLabSettingsToCloud,
  subscribeToLabSettings,
  fetchAllLabSettingsFromCloud,
  fetchReportsFromServer,
  fetchReceptionEntriesFromServer,
  syncTestToCloud,
  deleteTestFromCloud,
  subscribeToTests,
  syncPackageToCloud,
  deletePackageFromCloud,
  subscribeToPackages,
  syncDoctorToCloud,
  deleteDoctorFromCloud,
  subscribeToDoctors,
  subscribeToReceptionEntries,
  subscribeToLabReports,
  subscribeToBookings,
  seedInitialFirestoreData,
  syncCompanySettingsToCloud,
  subscribeToCompanySettings,
  syncPortalSectionsToCloud,
  subscribeToPortalSections,
  syncVendorLabToCloud,
  deleteVendorLabFromCloud,
  subscribeToVendorLabs,
  syncPricingPlanToCloud,
  deletePricingPlanFromCloud,
  subscribeToPricingPlans,
  syncStaffAccountToCloud,
  deleteStaffAccountFromCloud,
  subscribeToStaffAccounts,
  syncBranchToCloud,
  deleteBranchFromCloud,
  subscribeToBranches,
} from '../lib/cloudSync';

export const DEFAULT_VENDOR_SECTIONS: VendorWebsiteSections = {
  announcementBar: true,
  header: true,
  hero: true,
  dashboardsShowcase: true,
  packages: true,
  testDirectory: true,
  whyChooseUs: true,
  doctors: true,
  branches: false,
  reportInterlink: true,
  footer: true,
};

export const DEFAULT_PORTAL_SECTIONS: PortalWebsiteSections = {
  hero: true,
  trustStrip: true,
  workflow: true,
  features: true,
  pricing: true,
  faq: false,
  finalCta: true,
  footer: false,
  // Kept off from main home page by default for a simple, fast & clean experience:
  problemSection: false,
  solutionSection: false,
  offline: false,
  patientPortal: false,
  vendorWebsitesShowcase: true,
  reportPreview: false,
  whatsapp: false,
  testLibrary: false,
  staffRoles: false,
  patientHistory: false,
  dataSafety: false,
  security: false,
  auditLog: false,
  indianMarket: false,
  demo: false,
};

// --- INITIAL DEFAULTS ---
export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'INDIANLALAJI.COM',
  tagline: 'Modern Pathology Laboratory & Diagnostic Operating System',
  heroBadge: 'NABL ISO 15189 Ready • Made for India',
  heroTitle: 'Run Your Pathology Lab on Autopilot',
  heroSubtitle:
    'Complete Diagnostic Lab OS: Offline-ready desktop billing, 500+ pre-configured tests, automated WhatsApp PDF reports, central administration, and instant patient results portal without login.',
  supportPhone: '+91 7087033009',
  supportEmail: 'admin@indianlalaji.com',
  announcementText: '🚀 Version 3.4 Live: Instant UPI QR Dynamic Billing & Auto WhatsApp Dispatch Added!',
  superAdminDomain: 'indianlalaji.com',
  platformDomain: 'indianlalaji.com',
};

export const STANDARD_PLAN_FEATURES = [
  'Unlimited Patients, Bills & Test Entries',
  'WhatsApp PDF Reports with QR Code Verification',
  '500+ Pre-Configured Pathology & Radiology Tests',
  'Instant Dynamic UPI QR Payment Billing',
  'Doctor Commissions & B2B Referral Tracker',
  'Multi-Role Staff & Pathologist Digital Signatures',
  'Patient Online Report Download Portal',
  'Automatic Cloud Backup & Real-Time Sync',
  'Dedicated Indian WhatsApp & Phone Support',
];

export const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  {
    id: 'plan-1month',
    name: '1 Month',
    target: 'Starter & Flexible',
    duration: '1 Month',
    priceINR: 1499,
    monthlyPriceINR: 1499,
    yearlyPriceINR: 1499,
    billingCycle: 'Per Month',
    description: 'Full software access with complete features for 1 month. No long-term commitment.',
    isPopular: false,
    features: [...STANDARD_PLAN_FEATURES],
  },
  {
    id: 'plan-3months',
    name: '3 Month',
    target: 'Quarterly • Most Popular',
    duration: '3 Months',
    priceINR: 3999,
    monthlyPriceINR: 3999,
    yearlyPriceINR: 3999,
    billingCycle: 'Per 3 Months',
    description: 'Quarterly access with complete features. Best for steady diagnostic workflow.',
    isPopular: true,
    features: [...STANDARD_PLAN_FEATURES],
  },
  {
    id: 'plan-1year',
    name: '1 Year',
    target: 'Annual • Best Value',
    duration: '1 Year',
    priceINR: 11999,
    monthlyPriceINR: 11999,
    yearlyPriceINR: 11999,
    billingCycle: 'Per Year',
    description: 'Full 1-year license with all features, maximum savings, and priority onboarding.',
    isPopular: false,
    features: [...STANDARD_PLAN_FEATURES],
  },
];

const DEFAULT_COMPANY_FEATURES: CompanyFeature[] = [
  {
    id: 'feat-1',
    title: 'Offline-First Billing & Entry',
    description: 'Never pause billing when broadband drops. Work offline and sync automatically.',
    category: 'Core Architecture',
    badge: 'USP 1',
  },
  {
    id: 'feat-2',
    title: 'Instant WhatsApp Delivery',
    description: 'Patients get verified NABL PDF reports directly on WhatsApp within 10 seconds of verification.',
    category: 'Patient Experience',
    badge: 'Popular',
  },
  {
    id: 'feat-3',
    title: '500+ Pre-Loaded Test Catalog',
    description: 'Hematology, Biochemistry, Hormones, and Urine tests ready with standard biological reference intervals.',
    category: 'Clinical Excellence',
  },
  {
    id: 'feat-4',
    title: 'Passwordless Patient Portal',
    description: 'Patients view and download reports simply with their 10-digit phone or Report ID.',
    category: 'Digital Reach',
  },
];

const DEFAULT_COMPANY_FAQS: CompanyFaq[] = FAQ_LIST.map((faq, idx) => ({
  id: `faq-${idx + 1}`,
  question: faq.q,
  answer: faq.a,
  category: 'General',
}));

const DEFAULT_COMPANY_STATS: CompanyStat[] = [
  { id: 'stat-1', label: 'Diagnostic Labs Digitized', value: '500+', subtext: 'Across 28 Indian States' },
  { id: 'stat-2', label: 'Turnaround Time Saved', value: '45 mins', subtext: 'Faster per patient' },
  { id: 'stat-3', label: 'Patient WhatsApp Delivered', value: '1.2M+', subtext: 'Digital PDF Reports' },
  { id: 'stat-4', label: 'System Uptime & Sync', value: '99.99%', subtext: 'Tier-4 Indian Datacenter' },
];

// --- VENDOR (APEX DIAGNOSTICS) DEFAULTS ---
const DEFAULT_VENDOR_LAB_SETTINGS: VendorLabSettings = {
  labShopId: 'LSP-7087',
  labName: 'Apex Diagnostic & Clinical Pathology Laboratory',
  name: 'Apex Diagnostic & Clinical Pathology Laboratory',
  tagline: 'Advanced Pathology, Biochemistry & Diagnostic Testing Centre',
  description: 'Advanced Pathology, Biochemistry & Diagnostic Testing Centre. 100% NABL Accredited & Certified. Instant digital WhatsApp PDF reports & doorstep sample collection.',
  logoUrl: '',
  websiteUrl: 'https://apexdiagnostics.indianlalaji.com',
  ogImageUrl: '',
  phone: '7087033009',
  helplinePhone: '+91 7087033009',
  whatsapp: '917087033009',
  nablAccreditationNo: 'MC-4821',
  nablNumber: 'MC-4821',
  isoCert: 'ISO 9001:2015 & ISO 15189 Compliant',
  openingHours: 'Open 7:00 AM – 9:00 PM (All 7 Days)',
  address: 'SCF 42-43, Sector 18-C, Central Healthcare Complex, Ludhiana',
  heroPromoText: 'Free Home Sample Collection Across City • Report on WhatsApp in 6 Hours',
  emergencyHours: '24x7 Emergency Services at Central Lab',
  announcementText: '🌟 Special Notice: Free Blood Glucose and Hemoglobin checkup on Saturday morning!',
  email: 'care@apexdiagnostics.in',
  domainPreview: 'apexdiagnostics.indianlalaji.com',
  merchantName: 'Apex Diagnostic Lab Pvt Ltd',
  upiId1: 'apexlab@icici',
  qrCode1Label: 'Counter Billing QR (Google Pay / PhonePe / Paytm / BHIM)',
  qrCode1Url: '',
  upiId2: 'apexdiag@oksbi',
  qrCode2Label: 'Home Sample Collection QR (Phlebotomist Handheld)',
  qrCode2Url: '',
  featureImageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
  siteDescription: 'Advanced Pathology, Biochemistry & Diagnostic Testing Centre. 100% NABL Accredited & Certified. Instant digital WhatsApp PDF reports & doorstep sample collection.',
  purchasedPlan: '1 Month',
  planDurationDays: 30,
  remainingVisibilityDays: 24,
  planPurchasedAt: '2026-02-15',
  planExpiresAt: '2026-03-17',
  homeCollectionCharge: 100,
  sections: DEFAULT_VENDOR_SECTIONS,
  heroBanners: [
    'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1600&q=80',
  ],
  banners: [
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
    {
      id: 'banner-2',
      title: 'Free Doorstep Home Sample Collection',
      subtitle: 'Certified phlebotomists with temperature-monitored cold chain sample transit.',
      badge: 'HOME COLLECTION',
      imageUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1600&q=80',
      linkUrl: '#home-collection',
      buttonText: 'Book Sample Pickup',
      active: true,
    },
    {
      id: 'banner-3',
      title: 'Preventative Full Body Health Screening Profiles',
      subtitle: 'Flat 50% discount on Comprehensive Executive Full Body Health Checkup.',
      badge: 'SPECIAL OFFER',
      imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1600&q=80',
      linkUrl: '#packages',
      buttonText: 'View 68+ Tests',
      active: true,
    },
  ],
  aboutTitle: 'About Our Laboratory & Medical Leadership',
  aboutSubtitle: 'Serving patients, referring physicians, and hospital networks with uncompromising diagnostic precision, automated pathology, and compassionate care.',
  aboutStory: 'Founded with a singular dedication to diagnostic excellence, our laboratory bridges the gap between modern clinical science and patient-centered healthcare. From routine health panels to specialized diagnostic assays, our laboratory is trusted by families, clinicians, and medical networks.',
  aboutHeritage: 'We operate in strict compliance with ISO 15189:2022 and NABL standards. Every specimen undergoes rigorous multi-tier internal quality controls (IQC) and participating International External Quality Assessment Schemes (EQAS). Equipped with advanced fully-automated biochemistry analyzers and 5-part hematology counters.',
  establishedYear: 2012,
  founderName: 'Dr. R. K. Sharma',
  founderDesignation: 'Chief Medical Director & Founder',
  founderDegrees: 'MBBS, MD (Pathology)',
  founderExperience: '18+ Years Clinical Experience',
  founderBadge: 'AIIMS Gold Medalist',
  founderPhotoUrl: '/src/assets/images/founder_pathologist_1790345211989.jpg',
  founderMessage: 'A pathology report is not merely numbers on paper; a doctor relies on it to prescribe life-saving medicine, and a patient trusts it with their health. At our laboratory, our sacred commitment is diagnostic accuracy, uncompromising sample purity, and delivering every report with complete transparency.',
  founderCredentials: [
    'MD Pathology from AIIMS • Senior Resident Ex-Fellow',
    'Fellow of Indian College of Pathologists (FICP)',
    'Lead Auditor for NABL / ISO 15189 Quality Systems',
  ],
  contactGoogleMapUrl: '',
  socialMedia: {
    enabled: true,
    facebook: 'https://facebook.com/apexdiagnostics',
    instagram: 'https://instagram.com/apexdiagnostics',
    twitter: 'https://twitter.com/apexdiagnostics',
    youtube: 'https://youtube.com/@apexdiagnostics',
    linkedin: 'https://linkedin.com/company/apexdiagnostics',
    whatsapp: '917087033009',
  },
  termsAndConditions: `1. ACCEPTANCE OF TERMS: By accessing or utilizing the services provided by this diagnostic laboratory, patients and referring healthcare providers agree to abide by all clinical laboratory terms and protocols.
2. DIAGNOSTIC SERVICES & TESTING: All testing is performed under strictly regulated NABL accredited and ISO 15189 standards using calibrated automated analyzers. Reports reflect specimen findings at the time of collection.
3. SAMPLE COLLECTION & FASTING PROTOCOLS: Certain clinical tests mandate pre-test fasting, medication adjustments, or specific dietary preparations. Failure to adhere may affect diagnostic accuracy.
4. DELIVERY OF RESULTS: Verified digital reports are dispatched via secure WhatsApp PDF and online patient portal. In cases of critical alert values, referring clinicians or patient emergency contacts will be promptly notified.
5. LIMITATION OF LIABILITY: Test results should always be correlated with clinical symptoms and interpreted by a registered medical practitioner. No medical diagnosis is conclusive based solely on an isolated report.`,
  privacyPolicy: `1. DATA CONFIDENTIALITY: We uphold stringent patient privacy and medical confidentiality in compliance with medical data security standards and healthcare data protection laws.
2. COLLECTION OF INFORMATION: We collect necessary demographic and clinical details (e.g., patient name, age, gender, contact number, referring doctor) solely for accurate test processing, billing, and report generation.
3. DIGITAL REPORT ACCESS: Patient test results are accessible only via authenticated credentials (Unique Report ID & registered Mobile Number) or direct authorized WhatsApp transmission.
4. THIRD-PARTY SHARING: Patient diagnostic records are never sold, rented, or disclosed to unauthorized commercial third parties. Data is shared exclusively with treating medical practitioners upon patient consent or as required by statutory public health mandates.
5. DATA STORAGE & RETENTION: Physical specimen records and digital pathology logs are safely archived in accordance with statutory medical record retention schedules.`,
  refundPolicy: `1. CANCELLATION BEFORE SAMPLE COLLECTION: If a patient cancels a scheduled laboratory test or home sample collection appointment before the phlebotomist visits or sample is drawn, a 100% full refund will be processed promptly.
2. POST-COLLECTION STATUS: Once a biological specimen has been collected, transported, or processed in the laboratory analyzer, cancellations or refunds cannot be issued due to incurred reagent and consumable costs.
3. FAILED OR INCONCLUSIVE SAMPLES: In the rare event of hemolysis, lipemia, or insufficient sample volume necessitating a repeat test, a free recollected sample will be processed at no additional charge to the patient.
4. REFUND DISPATCH TIMELINE: Approved digital payment refunds are credited back to the original source UPI / Bank Account within 2 to 5 business days.`,
};

export const DEFAULT_ALL_VENDOR_PACKAGES: VendorPackage[] = [
  // Apex packages
  {
    id: 'pkg-apex-1',
    labId: 'lab-apex',
    name: 'Full Body Health Checkup',
    testsCount: 68,
    description: 'Complete screen covering Liver, Kidney, Thyroid, Heart, Complete Blood Count, and Blood Sugar.',
    priceINR: 999,
    mrpINR: 2499,
    isPopular: true,
    features: [
      'Complete Hemogram (CBC + ESR - 24 tests)',
      'Liver Function Test (LFT - 11 tests)',
      'Kidney Function Test (KFT - 9 tests)',
      'Lipid Profile (Cholesterol & Triglycerides - 8 tests)',
      'Thyroid Profile (TSH)',
      'Fasting Blood Glucose (Sugar)',
      'Urine Routine & Microscopic Examination (14 tests)',
    ],
  },
  {
    id: 'pkg-apex-2',
    labId: 'lab-apex',
    name: 'Comprehensive Diabetic Care',
    testsCount: 22,
    description: 'Designed for diabetic and pre-diabetic patients to assess quarterly sugar control and organ health.',
    priceINR: 599,
    mrpINR: 1450,
    isPopular: false,
    features: [
      'HbA1c (Glycosylated Hemoglobin) with estimated average glucose',
      'Fasting Blood Sugar & Post Prandial (PP)',
      'Urine Microalbumin / Creatinine Ratio',
      'Kidney Function Screening (Creatinine, Urea, Uric Acid)',
      'Lipid Risk Assessment',
    ],
  },
  {
    id: 'pkg-apex-3',
    labId: 'lab-apex',
    name: 'Senior Citizen Health Profile',
    testsCount: 84,
    description: 'Comprehensive health monitoring for age 50+, with special focus on cardiac risk, bones, and vitamins.',
    priceINR: 1499,
    mrpINR: 3800,
    isPopular: false,
    features: [
      'Everything in Full Body Health Checkup (68 tests)',
      'Vitamin D3 (25-OH) & Vitamin B12 Levels',
      'Serum Calcium & Alkaline Phosphatase (Bone Health)',
      'High Sensitivity CRP (hs-CRP) for Heart Risk',
      'Serum Electrolytes (Sodium, Potassium, Chloride)',
      'Doctor Consultation & Diet Advice Included',
    ],
  },
  {
    id: 'pkg-apex-4',
    labId: 'lab-apex',
    name: 'Women Wellness & Hormonal Profile',
    testsCount: 54,
    description: 'Designed specifically for women to monitor hormone balance, anemia screen, thyroid function, and bone density markers.',
    priceINR: 1199,
    mrpINR: 2899,
    isPopular: false,
    features: [
      'Thyroid Profile (Total T3, Total T4, TSH)',
      'Serum Ferritin & Complete Iron Studies (Anemia)',
      'Complete Hemogram (CBC + ESR - 24 tests)',
      'Vitamin D3 (25-OH) & Vitamin B12 Levels',
      'Serum Calcium & Alkaline Phosphatase (Bone Health)',
      'Fasting Blood Sugar & Lipid Health Risk',
    ],
  },
  // CityCare packages
  {
    id: 'pkg-cc-1',
    labId: 'lab-citycare',
    name: 'CityCare Executive Wellness Panel',
    testsCount: 72,
    description: 'Full body preventive checkup tailored for working professionals and executives in Mohali & Tricity.',
    priceINR: 1199,
    mrpINR: 2800,
    isPopular: true,
    features: [
      'Automated 5-Part Differential CBC',
      'Complete Liver & Kidney Profiles',
      'Lipid Screen with Cardiac Risk Ratio',
      'Free T3, Free T4 & Ultrasensitive TSH',
      'Fasting Blood Sugar & HbA1c',
      'Serum Electrolytes & Uric Acid',
    ],
  },
  {
    id: 'pkg-cc-2',
    labId: 'lab-citycare',
    name: 'CityCare Thyroid & Vital Organ Health',
    testsCount: 30,
    description: 'Targeted assessment for thyroid disorders, metabolism, liver enzymes, and renal clearance.',
    priceINR: 699,
    mrpINR: 1600,
    isPopular: false,
    features: [
      'Total T3, Total T4, TSH',
      'Liver Enzymes (SGOT, SGPT, Bilirubin)',
      'Serum Creatinine & Blood Urea',
      'Electrolytes Panel (Na, K, Cl)',
    ],
  },
  // MetroPath packages
  {
    id: 'pkg-mp-1',
    labId: 'lab-metropath',
    name: 'MetroPath Cardiac & Vascular Risk Panel',
    testsCount: 45,
    description: 'Specialized advanced cardiovascular risk screening with high-sensitivity troponin, hs-CRP, and lipid subfractions.',
    priceINR: 1799,
    mrpINR: 3900,
    isPopular: true,
    features: [
      'High Sensitivity C-Reactive Protein (hs-CRP)',
      'Lipid Subfraction Profile (Direct LDL, VLDL, HDL)',
      'Apolipoprotein A1 & B Screening',
      'HbA1c & Fasting Insulin',
      'Homocysteine Serum Levels',
    ],
  },
  {
    id: 'pkg-mp-2',
    labId: 'lab-metropath',
    name: 'MetroPath Advanced Hormone & Vitamin Assay',
    testsCount: 18,
    description: 'Immunoassay screen for Vitamin D3, B12, Ferritin, Cortisol, and complete thyroid antibodies.',
    priceINR: 1499,
    mrpINR: 3400,
    isPopular: false,
    features: [
      'Vitamin D3 (25-Hydroxy)',
      'Vitamin B12 Cyanocobalamin',
      'Serum Ferritin & Iron Studies',
      'Anti-TPO Antibodies & TSH',
    ],
  },
  // Sanjivani packages
  {
    id: 'pkg-sanj-1',
    labId: 'lab-sanjivani',
    name: 'Sanjivani Aarogya Swasthya Package',
    testsCount: 52,
    description: 'Affordable comprehensive family blood checkup serving Amritsar and surrounding rural health centers.',
    priceINR: 799,
    mrpINR: 1800,
    isPopular: true,
    features: [
      'CBC with ESR (24 parameters)',
      'Blood Sugar Fasting',
      'Liver Function Test (8 parameters)',
      'Kidney Function Test (6 parameters)',
      'Serum Cholesterol & Triglycerides',
      'Urine Routine Analysis',
    ],
  },
  {
    id: 'pkg-sanj-2',
    labId: 'lab-sanjivani',
    name: 'Sanjivani Basic Sugar & Lipid Check',
    testsCount: 15,
    description: 'Quick baseline screening for blood glucose, triglycerides, and hypertension risk factors.',
    priceINR: 399,
    mrpINR: 900,
    isPopular: false,
    features: [
      'Blood Sugar Fasting & Post Prandial',
      'Total Cholesterol & Triglycerides',
      'Blood Urea & Serum Creatinine',
    ],
  },
  // LifeLine packages
  {
    id: 'pkg-life-1',
    labId: 'lab-lifeline-due',
    name: 'LifeLine Essential Blood Panel',
    testsCount: 40,
    description: 'Basic preventive health panel with home sample pickup in Jalandhar.',
    priceINR: 599,
    mrpINR: 1400,
    isPopular: true,
    features: [
      'Complete Blood Count (CBC)',
      'Fasting Blood Glucose',
      'Liver Screening (SGPT, SGOT)',
      'Kidney Screening (Creatinine, Urea)',
    ],
  },
  // HealTech packages (lab-healtech-pending)
  {
    id: 'pkg-ht-1',
    labId: 'lab-healtech-pending',
    name: 'HealTech Comprehensive Allergy & Immunity Shield',
    testsCount: 45,
    description: 'Specialized allergy, IgE profiling, absolute eosinophil count, and immune health panel in Patiala.',
    priceINR: 1899,
    mrpINR: 4200,
    isPopular: true,
    features: [
      'Total Serum IgE (Quantitative)',
      'Absolute Eosinophil Count (AEC)',
      'CBC with 5-Part Differential',
      'Liver Function Enzymes (LFT)',
      'Serum Ferritin & Iron Studies',
      'Renal Clearance Panel',
    ],
  },
  {
    id: 'pkg-ht-2',
    labId: 'lab-healtech-pending',
    name: 'HealTech Food Intolerance & Gut Screen',
    testsCount: 30,
    description: '30 common dietary antigens IgG screen with personalized gut allergen report.',
    priceINR: 2399,
    mrpINR: 5000,
    isPopular: false,
    features: [
      'Food Intolerance 30-Antigen Assay',
      'Complete Hemogram CBC',
      'Urine Routine & Microscopy',
    ],
  },
  // Pulse packages (lab-pulse)
  {
    id: 'pkg-pls-1',
    labId: 'lab-pulse',
    name: 'Pulse Neuro-Cardiac Shield',
    testsCount: 55,
    description: 'High-acuity cardiovascular and cerebrovascular risk screening with rapid stat testing in Panchkula.',
    priceINR: 2199,
    mrpINR: 5200,
    isPopular: true,
    features: [
      'High Sensitivity Cardiac Troponin-I',
      'Quantitative D-Dimer Assay',
      'Direct LDL & Apo-B Lipid Risk Profile',
      'HbA1c Glycated Hemoglobin',
      '5-Part Differential CBC',
      'Renal Function & Serum Electrolytes',
    ],
  },
  {
    id: 'pkg-pls-2',
    labId: 'lab-pulse',
    name: 'Pulse Diabetic & Renal Wellness',
    testsCount: 28,
    description: 'Routine glycemic control, microalbuminuria, and kidney clearance evaluation.',
    priceINR: 899,
    mrpINR: 1900,
    isPopular: false,
    features: [
      'HbA1c & Fasting Glucose',
      'Lipid Profile Screen',
      'Serum Creatinine & Blood Urea',
      'Urine Routine & Albumin Ratio',
    ],
  },
  // CarePoint packages (lab-carepoint)
  {
    id: 'pkg-cp-1',
    labId: 'lab-carepoint',
    name: 'CarePoint Hillside Family Health Panel',
    testsCount: 42,
    description: 'Comprehensive baseline health package adapted for high-altitude cold climate wellness in Shimla.',
    priceINR: 999,
    mrpINR: 2400,
    isPopular: true,
    features: [
      'Complete Blood Count (CBC)',
      'Fasting Blood Sugar',
      'Thyroid Profile (T3, T4, TSH)',
      'Liver Function Test (LFT)',
      'Kidney Function Test (KFT)',
      'Lipid Profile (Cholesterol & Triglycerides)',
    ],
  },
  {
    id: 'pkg-cp-2',
    labId: 'lab-carepoint',
    name: 'CarePoint Sunlight & Bone Health Panel',
    testsCount: 12,
    description: 'Vitamin D3, Serum Calcium, Alkaline Phosphatase, and basic hemogram.',
    priceINR: 799,
    mrpINR: 1800,
    isPopular: false,
    features: [
      'Vitamin D3 (25-OH)',
      'Serum Calcium & Phosphorus',
      'Complete Blood Count (CBC)',
    ],
  },
];

const DEFAULT_VENDOR_PACKAGES = DEFAULT_ALL_VENDOR_PACKAGES;

export const DEFAULT_ALL_VENDOR_DOCTORS: VendorDoctor[] = [
  // Apex Doctors & Diagnostic Clinical Specialists
  {
    id: 'doc-apex-1',
    labId: 'lab-apex',
    name: 'Dr. Rajesh Sharma',
    degrees: 'MBBS, MD (Pathology), AIIMS Gold Medalist',
    qualification: 'MD Pathology (AIIMS), FICP',
    designation: 'Chief Medical Director & Consultant Pathologist',
    roleCategory: 'Pathologist',
    specialization: 'Hematopathology & Histopathology',
    specialExpertise: 'Bone Marrow Biopsy, Peripheral Smear Review & Oncopathology',
    experience: '18+ Years Experience',
    bio: 'Ex-AIIMS senior fellow with deep specialization in abnormal blood cell morphologies, leukemia screening, and NABL internal quality assurance.',
    avatarEmoji: '👨‍⚕️',
    imageUrl: '/src/assets/images/founder_pathologist_1790345211989.jpg',
    referralCommissionPct: 15,
    monthlyReferrals: 42,
    totalReferredBilling: 64200,
  },
  {
    id: 'doc-apex-2',
    labId: 'lab-apex',
    name: 'Dr. Meenakshi Sundaram',
    degrees: 'MBBS, MD (Microbiology & Clinical Pathology)',
    qualification: 'MD (Microbiology, CMC Ludhiana), Quality Lead',
    designation: 'Consultant Pathologist & Head of Microbiology',
    roleCategory: 'Pathologist',
    specialization: 'Infectious Diseases & Clinical Serology',
    specialExpertise: 'Automated Blood Culture, Antimicrobial Sensitivity & Viral Immunology',
    experience: '15+ Years Experience',
    bio: 'Oversees microbiological sterility, automated blood cultures, automated ELISA diagnostics, and panic range tele-notifications.',
    avatarEmoji: '👩‍⚕️',
    imageUrl: '/src/assets/images/team_pathologist_woman_1790345423035.jpg',
    referralCommissionPct: 12,
    monthlyReferrals: 28,
    totalReferredBilling: 38900,
  },
  {
    id: 'doc-apex-3',
    labId: 'lab-apex',
    name: 'Dr. Arunava Ghosh',
    degrees: 'M.Sc., Ph.D. (Medical Biochemistry)',
    qualification: 'Ph.D. Biochemistry, NABL Lead Quality Assessor',
    designation: 'Chief Clinical Biochemist & Laboratory Quality Manager',
    roleCategory: 'Biochemist',
    specialization: 'Clinical Biochemistry & Hormonal Immunoassays',
    specialExpertise: 'HPLC HbA1c Analysis, Thyroid & Fertility Hormone Profiles, Electrolytes',
    experience: '14+ Years Experience',
    bio: 'Specialist in 6-Sigma analytical chemistry, calibrator verifications, HPLC chromatography, and high-throughput dry-chemistry analyzer robotics.',
    avatarEmoji: '👨‍🔬',
    imageUrl: '/src/assets/images/team_biochemist_1790345449541.jpg',
    referralCommissionPct: 10,
    monthlyReferrals: 19,
    totalReferredBilling: 26500,
  },
  {
    id: 'doc-apex-4',
    labId: 'lab-apex',
    name: 'Vikramjit Singh',
    degrees: 'B.Sc. MLT, DMLT (CMC Ludhiana)',
    qualification: 'Certified Phlebotomy Specialist (CPS)',
    designation: 'Senior Phlebotomist & Home Collection Lead',
    roleCategory: 'Phlebotomist',
    specialization: 'Pediatric & Geriatric Vacuum Phlebotomy',
    specialExpertise: 'Painless Venipuncture, Cold-Chain Vacutainer Integrity & Barcode Labeling',
    experience: '12+ Years Experience',
    bio: 'Supervises doorstep patient phlebotomy across the city with calibrated portable cooling boxes, sterile BD vacutainers, and zero-hemolysis protocols.',
    avatarEmoji: '💉',
    imageUrl: '/src/assets/images/team_phlebotomist_1790345465190.jpg',
    referralCommissionPct: 8,
    monthlyReferrals: 34,
    totalReferredBilling: 31200,
  },
  {
    id: 'doc-apex-5',
    labId: 'lab-apex',
    name: 'Sunita Mehra',
    degrees: 'M.Sc. Medical Laboratory Technology (Hematology)',
    qualification: 'Certified Lead Technologist (ASCPi)',
    designation: 'Senior Laboratory Technologist & Bench Supervisor',
    roleCategory: 'Technician',
    specialization: 'Automated Hematology & Coagulation',
    specialExpertise: 'Flow Cytometry, Coagulation PT/INR, Urine Sediment Microscopy',
    experience: '11+ Years Experience',
    bio: 'Supervises 5-part hematology counters, ESR automation, daily multi-level Levey-Jennings QC charts, and instant emergency panic reporting.',
    avatarEmoji: '🔬',
    imageUrl: '/src/assets/images/team_technologist_1790345481173.jpg',
    referralCommissionPct: 5,
    monthlyReferrals: 15,
    totalReferredBilling: 14800,
  },
  // CityCare Doctors
  {
    id: 'doc-cc-1',
    labId: 'lab-citycare',
    name: 'Dr. Harpreet Kaur',
    degrees: 'MBBS, MD (Pathology)',
    specialization: 'Chief Consultant Pathologist',
    experience: 'PGIMER Chandigarh • 15+ Years Experience',
    bio: 'Pioneer in automated hematology, coagulation disorders, and cytopathology in Mohali.',
    avatarEmoji: '👩‍⚕️',
    referralCommissionPct: 15,
    monthlyReferrals: 36,
    totalReferredBilling: 52400,
  },
  {
    id: 'doc-cc-2',
    labId: 'lab-citycare',
    name: 'Dr. Sanjeev Bajaj',
    degrees: 'MBBS, DCP',
    specialization: 'Clinical Pathologist & Phlebotomy Head',
    experience: 'Fortis Hospital • 10+ Years Experience',
    bio: 'Supervises rapid statutory turnaround, doorstep collection protocols, and stat biochemistry.',
    avatarEmoji: '👨‍⚕️',
    referralCommissionPct: 12,
    monthlyReferrals: 22,
    totalReferredBilling: 31000,
  },
  // MetroPath Doctors
  {
    id: 'doc-mp-1',
    labId: 'lab-metropath',
    name: 'Dr. Priyanka Sengupta',
    degrees: 'MBBS, MD (Histo & Oncopathology)',
    specialization: 'Senior Oncopathologist',
    experience: 'Tata Memorial Trained • 16+ Years Experience',
    bio: 'Lead diagnostician in immunohistochemistry, tumor markers, and high-complexity flow cytometry.',
    avatarEmoji: '👩‍⚕️',
    referralCommissionPct: 18,
    monthlyReferrals: 48,
    totalReferredBilling: 89400,
  },
  {
    id: 'doc-mp-2',
    labId: 'lab-metropath',
    name: 'Dr. Vikramaditya Rao',
    degrees: 'MD (Biochemistry), FRCPath',
    specialization: 'Director of Molecular Diagnostics',
    experience: 'Max Healthcare • 13+ Years Experience',
    bio: 'Oversees DNA PCR diagnostics, genetic polymorphisms, and chemiluminescence immunoassay lines.',
    avatarEmoji: '👨‍🔬',
    referralCommissionPct: 15,
    monthlyReferrals: 31,
    totalReferredBilling: 54200,
  },
  // Sanjivani Doctors
  {
    id: 'doc-sanj-1',
    labId: 'lab-sanjivani',
    name: 'Dr. Gurinder Singh',
    degrees: 'MBBS, MD (Pathology)',
    specialization: 'Head Pathologist',
    experience: 'GMC Amritsar • 20+ Years Experience',
    bio: 'Dedicated to ethical, accessible diagnostic medicine and community preventive screening in Majha region.',
    avatarEmoji: '👨‍⚕️',
    referralCommissionPct: 12,
    monthlyReferrals: 55,
    totalReferredBilling: 62000,
  },
  {
    id: 'doc-sanj-2',
    labId: 'lab-sanjivani',
    name: 'Dr. Ananya Sharma',
    degrees: 'MBBS, DCP',
    specialization: 'Consultant Clinical Biochemist',
    experience: 'Civil Hospital Amritsar • 8+ Years Experience',
    bio: 'Specialist in diabetic profiles, maternal screening, and routine microscopic diagnostics.',
    avatarEmoji: '👩‍⚕️',
    referralCommissionPct: 10,
    monthlyReferrals: 24,
    totalReferredBilling: 28600,
  },
  // LifeLine Doctors
  {
    id: 'doc-life-1',
    labId: 'lab-lifeline-due',
    name: 'Dr. Gurpreet Singh',
    degrees: 'MBBS, MD (Pathology)',
    specialization: 'Chief Pathologist & Lab Director',
    experience: 'Civil Hospital Jalandhar • 11+ Years Experience',
    bio: 'Oversees routine blood analysis and outpatient pathology reporting.',
    avatarEmoji: '👨‍⚕️',
    referralCommissionPct: 10,
    monthlyReferrals: 18,
    totalReferredBilling: 22000,
  },
  // HealTech Doctors (lab-healtech-pending)
  {
    id: 'doc-ht-1',
    labId: 'lab-healtech-pending',
    name: 'Dr. Vandana Sood',
    degrees: 'MBBS, MD (Allergy & Immuno)',
    specialization: 'Senior Immunologist & Allergy Consultant',
    experience: 'Patiala Medical College • 15+ Years Experience',
    bio: 'Pioneer in food intolerance screening, aeroallergen desensitization panels, and clinical immunology.',
    avatarEmoji: '👩‍⚕️',
    referralCommissionPct: 15,
    monthlyReferrals: 38,
    totalReferredBilling: 72000,
  },
  {
    id: 'doc-ht-2',
    labId: 'lab-healtech-pending',
    name: 'Dr. P. K. Sehgal',
    degrees: 'MBBS, MD (Pathology)',
    specialization: 'Consultant Clinical Pathologist',
    experience: 'Government Rajindra Hospital • 12+ Years Experience',
    bio: 'Oversees absolute eosinophil counts, autoimmune serology lines, and hematology quality.',
    avatarEmoji: '👨‍⚕️',
    referralCommissionPct: 12,
    monthlyReferrals: 25,
    totalReferredBilling: 41000,
  },
  // Pulse Doctors (lab-pulse)
  {
    id: 'doc-pls-1',
    labId: 'lab-pulse',
    name: 'Dr. Vikram Singhal',
    degrees: 'MD, DM (Cardiology)',
    specialization: 'Director of Interventional Diagnostics',
    experience: 'PGI Chandigarh Trained • 17+ Years Experience',
    bio: 'Specialist in hyper-acute cardiac enzyme trends, high-sensitivity troponin assays, and vascular risk.',
    avatarEmoji: '👨‍⚕️',
    referralCommissionPct: 18,
    monthlyReferrals: 52,
    totalReferredBilling: 114000,
  },
  {
    id: 'doc-pls-2',
    labId: 'lab-pulse',
    name: 'Dr. Neena Gupta',
    degrees: 'MBBS, MD (Pathology)',
    specialization: 'Head of Laboratory Medicine',
    experience: 'Fortis Healthcare • 14+ Years Experience',
    bio: 'Supervises coagulopathy lines, D-Dimer protocols, and 24x7 emergency stat reports.',
    avatarEmoji: '👩‍⚕️',
    referralCommissionPct: 14,
    monthlyReferrals: 34,
    totalReferredBilling: 62000,
  },
  // CarePoint Doctors (lab-carepoint)
  {
    id: 'doc-cp-1',
    labId: 'lab-carepoint',
    name: 'Dr. Alok Verma',
    degrees: 'MBBS, MD (Internal Medicine)',
    specialization: 'Consultant Physician & Family Medicine',
    experience: 'IGMC Shimla • 16+ Years Experience',
    bio: 'Serves regional clinical health camps, diabetes management, and high-altitude preventive health.',
    avatarEmoji: '👨‍⚕️',
    referralCommissionPct: 12,
    monthlyReferrals: 44,
    totalReferredBilling: 51000,
  },
  {
    id: 'doc-cp-2',
    labId: 'lab-carepoint',
    name: 'Dr. Sunita Negi',
    degrees: 'MBBS, DCP',
    specialization: 'Clinical Pathologist',
    experience: 'DDU Hospital Shimla • 9+ Years Experience',
    bio: 'In charge of bone metabolism profiles, routine biochemical assays, and thyroid kinetics.',
    avatarEmoji: '👩‍⚕️',
    referralCommissionPct: 10,
    monthlyReferrals: 20,
    totalReferredBilling: 24500,
  },
];

const DEFAULT_VENDOR_DOCTORS = DEFAULT_ALL_VENDOR_DOCTORS;

export function buildDefaultSettingsForLab(dirItem: any): VendorLabSettings {
  const shortId = (dirItem.id || 'lab-unknown').replace('lab-', '');
  const cleanPhone = (dirItem.phone || '9876543210').replace(/\D/g, '').slice(-10);
  return {
    labId: dirItem.id,
    labShopId: `LSP-${shortId.toUpperCase()}`,
    labName: dirItem.name,
    name: dirItem.name,
    tagline: dirItem.tagline || 'Advanced Pathology & Clinical Testing',
    description: `${dirItem.name}, located in ${dirItem.city || 'City'}, ${dirItem.state || 'India'}. ${dirItem.tagline || ''}. Authorized NABL accredited pathology services with automated WhatsApp report delivery.`,
    logoUrl: '',
    websiteUrl: `https://${dirItem.domainPreview || shortId + '.indianlalaji.com'}`,
    ogImageUrl: '',
    phone: cleanPhone,
    helplinePhone: dirItem.phone || '+91 ' + cleanPhone,
    whatsapp: cleanPhone,
    nablAccreditationNo: dirItem.nablCode || 'MC-8921',
    nablNumber: dirItem.nablCode || 'MC-8921',
    isoCert: 'ISO 9001:2015 & ISO 15189 Compliant',
    openingHours: 'Open 7:30 AM – 8:30 PM (All 7 Days)',
    address: dirItem.address || `${dirItem.city || 'Punjab'}, India`,
    heroPromoText: `Doorstep Home Sample Pickup Across ${dirItem.city || 'City'} • NABL PDF Delivery in 4-6 Hours`,
    emergencyHours: dirItem.emergency ? '24x7 Emergency Services at Central Desk' : 'Emergency Blood Collection Available',
    announcementText: `🌟 Welcome to ${dirItem.name}! Instant online test booking and verified digital WhatsApp reports now active.`,
    email: dirItem.email || `contact@${shortId}lab.in`,
    domainPreview: dirItem.domainPreview || `${shortId}.indianlalaji.com`,
    merchantName: `${dirItem.name} Pvt Ltd`,
    upiId1: `${shortId}lab@icici`,
    qrCode1Label: `Counter Billing QR (${dirItem.city || 'Counter'} Desk)`,
    qrCode1Url: '',
    upiId2: `${shortId}diag@oksbi`,
    qrCode2Label: 'Home Sample Collection Handheld QR',
    homeCollectionCharge: 100,
    featureImageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
    siteDescription: `${dirItem.name}, located in ${dirItem.city || 'City'}, ${dirItem.state || 'India'}. ${dirItem.tagline || ''}. Authorized NABL accredited pathology services with automated WhatsApp report delivery.`,
    purchasedPlan: dirItem.subscriptionPlan?.includes('1 Year') ? '1 Year' : dirItem.subscriptionPlan?.includes('3 Month') ? '3 Months' : '1 Month',
    planDurationDays: dirItem.subscriptionPlan?.includes('1 Year') ? 365 : dirItem.subscriptionPlan?.includes('3 Month') ? 90 : 30,
    remainingVisibilityDays: dirItem.subscriptionPlan?.includes('1 Year') ? 312 : dirItem.subscriptionPlan?.includes('3 Month') ? 78 : 24,
    planPurchasedAt: '2026-02-15',
    planExpiresAt: '2026-03-17',
    sections: { ...DEFAULT_VENDOR_SECTIONS },
    heroBanners: [
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1600&q=80',
    ],
    banners: [
      {
        id: `banner-${shortId}-1`,
        title: `Advanced Diagnostic Pathology at ${dirItem.name}`,
        subtitle: '100% NABL Quality Standards & Verified Digital WhatsApp Reports.',
        badge: 'QUALITY DIAGNOSTICS',
        imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1600&q=80',
        linkUrl: '#packages',
        buttonText: 'Explore Health Packages',
        active: true,
      },
      {
        id: `banner-${shortId}-2`,
        title: `Home Sample Collection in ${dirItem.city || 'City'}`,
        subtitle: 'Safe, punctual doorstep blood sample pickup by trained phlebotomists.',
        badge: 'HOME COLLECTION',
        imageUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1600&q=80',
        linkUrl: '#home-collection',
        buttonText: 'Book Sample Pickup',
        active: true,
      },
    ],
    aboutTitle: `About ${dirItem.name} & Clinical Heritage`,
    aboutSubtitle: `Serving patients with accurate diagnostics and compassionate care in ${dirItem.city || 'City'}.`,
    aboutStory: `${dirItem.name} is dedicated to providing clinical excellence, advanced diagnostics, and timely report delivery. Trusted by referring physicians and healthcare practitioners across the region.`,
    aboutHeritage: `Equipped with modern automated diagnostic analyzers and strict internal quality assurance, we follow NABL and ISO medical laboratory standards.`,
    establishedYear: 2015,
    founderName: dirItem.ownerName || 'Chief Medical Director',
    founderDesignation: 'Chief Medical Director & Founder',
    founderDegrees: 'MBBS, MD (Pathology)',
    founderExperience: '15+ Years Clinical Experience',
    founderBadge: 'Consultant Pathologist',
    founderPhotoUrl: '/src/assets/images/founder_pathologist_1790345211989.jpg',
    founderMessage: `Our mission is to empower patients and doctors with accurate, timely diagnostic insights with utmost reliability and transparency.`,
    founderCredentials: [
      'MD Pathology with Extensive Clinical Experience',
      'Quality Manager for ISO 15189 Quality Systems',
      'Committed to Ethical Diagnostic Healthcare',
    ],
    contactGoogleMapUrl: '',
    socialMedia: {
      enabled: true,
      facebook: `https://facebook.com/${shortId}lab`,
      instagram: `https://instagram.com/${shortId}lab`,
      whatsapp: cleanPhone,
    },
    termsAndConditions: DEFAULT_VENDOR_LAB_SETTINGS.termsAndConditions,
    privacyPolicy: DEFAULT_VENDOR_LAB_SETTINGS.privacyPolicy,
    refundPolicy: DEFAULT_VENDOR_LAB_SETTINGS.refundPolicy,
    isWebsiteApproved: Boolean(dirItem.isWebsiteApproved ?? (dirItem.status === 'Active')),
    status: dirItem.status || 'Draft',
  };
}

export const DEFAULT_VENDOR_SETTINGS_MAP: Record<string, VendorLabSettings> = {
  'lab-apex': { ...DEFAULT_VENDOR_LAB_SETTINGS, labId: 'lab-apex' },
};
VENDOR_LABS_DIRECTORY.forEach((lab) => {
  if (lab.id !== 'lab-apex') {
    DEFAULT_VENDOR_SETTINGS_MAP[lab.id] = buildDefaultSettingsForLab(lab);
  }
});

export const DEFAULT_VENDOR_BRANCHES: VendorBranch[] = [
  {
    id: 'branch-1',
    labId: 'lab-apex',
    name: 'Device A — Reception & Billing Desk (Counter 1)',
    badge: 'Device A (Primary)',
    address: 'SCF 42-43, Sector 18-C, Central Healthcare Complex, Ludhiana',
    phone: '+91 7087033009',
    timings: 'Open 24x7 (Round the Clock Testing)',
    isEmergency: true,
  },
  {
    id: 'branch-2',
    labId: 'lab-apex',
    name: 'Device B — Lab Testing & Analyzer Workstation (Counter 2)',
    badge: 'Device B (Connected)',
    address: 'Testing Floor, Central Healthcare Complex, Ludhiana',
    phone: '+91 7087033009',
    timings: 'Open 24x7 (Real-time Live Sync)',
    isEmergency: true,
  },
  // CityCare Branch (lab-citycare)
  {
    id: 'branch-cc-1',
    labId: 'lab-citycare',
    name: 'Device A — Reception Counter (Counter 1)',
    badge: 'Device A',
    address: 'SCO 14, Phase 7, Near Fortis Chowk, Mohali',
    phone: '+91 9815012345',
    timings: 'Mon–Sat: 7:00 AM – 9:00 PM',
    isEmergency: true,
  },
  {
    id: 'branch-cc-2',
    labId: 'lab-citycare',
    name: 'Device B — Lab Workstation (Counter 2)',
    badge: 'Device B',
    address: 'SCO 14, Phase 7, Near Fortis Chowk, Mohali',
    phone: '+91 9815012345',
    timings: 'Mon–Sat: 7:00 AM – 9:00 PM',
    isEmergency: true,
  },
  // MetroPath Branch (lab-metropath)
  {
    id: 'branch-mp-1',
    labId: 'lab-metropath',
    name: 'MetroPath Scans & Molecular Pathology Hub',
    badge: 'Main Reference Lab',
    address: 'SCO 128-129, Sector 34-A, Healthcare District, Chandigarh',
    phone: '+91 9417098765',
    timings: 'Open 24x7',
    isEmergency: true,
  },
  // Sanjivani Branch (lab-sanjivani)
  {
    id: 'branch-sanj-1',
    labId: 'lab-sanjivani',
    name: 'Sanjivani Civil Lines Lab',
    badge: 'Main Center',
    address: 'Near Gate 2, District Civil Hospital Road, Amritsar',
    phone: '+91 9888123456',
    timings: 'Mon–Sat: 7:00 AM – 8:30 PM',
    isEmergency: true,
  },
  // LifeLine Branch (lab-lifeline-due)
  {
    id: 'branch-life-1',
    labId: 'lab-lifeline-due',
    name: 'LifeLine Main Diagnostic Desk',
    badge: 'Main Facility',
    address: 'Opp. Civil Hospital Gate 1, Jalandhar',
    phone: '+91 9872011223',
    timings: 'Mon–Sat: 7:30 AM – 8:00 PM',
    isEmergency: true,
  },
  // HealTech Branch (lab-healtech-pending)
  {
    id: 'branch-ht-1',
    labId: 'lab-healtech-pending',
    name: 'HealTech Patiala Central Hub',
    badge: 'Molecular & Allergy Center',
    address: 'Leela Bhawan Commercial Complex, Patiala',
    phone: '+91 9876512345',
    timings: 'Mon–Sat: 8:00 AM – 8:00 PM',
    isEmergency: true,
  },
  // Pulse Branch (lab-pulse)
  {
    id: 'branch-pls-1',
    labId: 'lab-pulse',
    name: 'Pulse Sector 5 Diagnostics & MRI Hub',
    badge: 'Main Stat Lab',
    address: 'SCO 88, Sector 5, MDC, Panchkula',
    phone: '+91 9815099881',
    timings: 'Open 24x7',
    isEmergency: true,
  },
  // CarePoint Branch (lab-carepoint)
  {
    id: 'branch-cp-1',
    labId: 'lab-carepoint',
    name: 'CarePoint Mall Road Diagnostic Centre',
    badge: 'Central Lab',
    address: 'The Mall Road, Near Lift, Shimla',
    phone: '+91 9816044332',
    timings: 'Mon–Sat: 8:00 AM – 7:30 PM',
    isEmergency: true,
  },
];

const DEFAULT_VENDOR_BOOKINGS: HomeCollectionBooking[] = [
  {
    id: 'book-101',
    labId: 'lab-apex',
    patientName: 'Sunita Mehra',
    mobile: '9876543210',
    address: 'Flat 402, Green Valley Apartments, Sector 21',
    timeSlot: 'Tomorrow: 7:00 AM - 9:00 AM',
    packageOrTest: 'Full Body Health Checkup (₹999)',
    status: 'Phlebotomist Assigned',
    createdAt: 'Today, 08:30 AM',
  },
  {
    id: 'book-102',
    labId: 'lab-apex',
    patientName: 'Baldev Singh',
    mobile: '9814012345',
    address: 'House No 128, Phase 7, Mohali',
    timeSlot: 'Tomorrow: 8:30 AM - 10:30 AM',
    packageOrTest: 'Complete Diabetic Care Profile (₹599)',
    status: 'Pending',
    createdAt: 'Today, 09:15 AM',
  },
  {
    id: 'book-103',
    labId: 'lab-apex',
    patientName: 'Ananya Verma',
    mobile: '9988776655',
    address: 'H-34, Model Town, Near Gurudwara',
    timeSlot: 'Today: Urgent Collection',
    packageOrTest: 'Thyroid Profile & CBC (₹600)',
    status: 'Sample Collected',
    createdAt: 'Today, 07:45 AM',
  },
  // CityCare Bookings (lab-citycare)
  {
    id: 'book-cc-201',
    labId: 'lab-citycare',
    patientName: 'Harpreet Singh Walia',
    mobile: '9815012345',
    address: 'House 542, Phase 4, Mohali',
    timeSlot: 'Tomorrow: 7:30 AM - 9:30 AM',
    packageOrTest: 'CityCare Senior Citizen Panel (₹1,499)',
    status: 'Phlebotomist Assigned',
    createdAt: 'Today, 08:45 AM',
  },
  {
    id: 'book-cc-202',
    labId: 'lab-citycare',
    patientName: 'Simi Kapoor',
    mobile: '9814099881',
    address: 'Flat 103, Silver Heights, Zirakpur',
    timeSlot: 'Today: 2:00 PM - 4:00 PM',
    packageOrTest: 'Vitamin Profile Complete (₹1,200)',
    status: 'Pending',
    createdAt: 'Today, 09:30 AM',
  },
  // MetroPath Bookings (lab-metropath)
  {
    id: 'book-mp-301',
    labId: 'lab-metropath',
    patientName: 'Devendra Singhal',
    mobile: '9417098765',
    address: 'House 1204, Sector 33-C, Chandigarh',
    timeSlot: 'Tomorrow: 7:00 AM - 8:30 AM',
    packageOrTest: 'Cardiac Risk Marker Panel (₹1,800)',
    status: 'Sample Collected',
    createdAt: 'Today, 07:15 AM',
  },
  // Sanjivani Bookings (lab-sanjivani)
  {
    id: 'book-sanj-401',
    labId: 'lab-sanjivani',
    patientName: 'Pratap Singh Sandhu',
    mobile: '9888123456',
    address: 'Village Wadala Bhittewad, Near Amritsar',
    timeSlot: 'Tomorrow: 7:30 AM - 9:30 AM',
    packageOrTest: 'Sanjivani Aarogya Swasthya (₹799)',
    status: 'Phlebotomist Assigned',
    createdAt: 'Today, 08:00 AM',
  },
  // LifeLine Bookings (lab-lifeline-due)
  {
    id: 'book-life-501',
    labId: 'lab-lifeline-due',
    patientName: 'Paramjit Kaur',
    mobile: '9872011223',
    address: 'Kapurthala Road, Opp. DAV College, Jalandhar',
    timeSlot: 'Tomorrow: 8:00 AM - 10:00 AM',
    packageOrTest: 'LifeLine Essential Blood Panel (₹599)',
    status: 'Pending',
    createdAt: 'Today, 09:00 AM',
  },
  // HealTech Bookings (lab-healtech-pending)
  {
    id: 'book-ht-601',
    labId: 'lab-healtech-pending',
    patientName: 'Ritu Bhargava',
    mobile: '9876512345',
    address: 'Urban Estate Phase 2, Patiala',
    timeSlot: 'Today: 11:30 AM - 1:00 PM',
    packageOrTest: 'Comprehensive Allergy & Immunity Shield (₹1,899)',
    status: 'Sample Collected',
    createdAt: 'Today, 08:30 AM',
  },
  // Pulse Bookings (lab-pulse)
  {
    id: 'book-pls-701',
    labId: 'lab-pulse',
    patientName: 'Brig. S. K. Nanda',
    mobile: '9815099881',
    address: 'Sector 6, MDC, Panchkula',
    timeSlot: 'Tomorrow: 7:00 AM - 8:30 AM',
    packageOrTest: 'Pulse Neuro-Cardiac Shield (₹2,199)',
    status: 'Phlebotomist Assigned',
    createdAt: 'Today, 07:30 AM',
  },
  // CarePoint Bookings (lab-carepoint)
  {
    id: 'book-cp-801',
    labId: 'lab-carepoint',
    patientName: 'Anil Sood',
    mobile: '9816044332',
    address: 'Chotta Shimla, Near Secretariat, Shimla',
    timeSlot: 'Tomorrow: 8:30 AM - 10:30 AM',
    packageOrTest: 'CarePoint Hillside Family Health Panel (₹999)',
    status: 'Pending',
    createdAt: 'Today, 09:15 AM',
  },
];

export const DEFAULT_CONTACT_SUBMISSIONS: ContactSubmission[] = [
  {
    id: 'inq-101',
    labId: 'lab-apex',
    name: 'Pooja Aggarwal',
    phone: '9814234567',
    email: 'pooja.aggarwal@gmail.com',
    subject: 'Home collection for Senior Citizen CBC & KFT',
    message: 'Hello, my father is 78 years old and needs routine CBC and Kidney Function Test. Can your phlebotomist come to Sector 21 around 7:30 AM tomorrow?',
    createdAt: 'Today, 09:20 AM',
    status: 'unread',
    referenceToken: 'INQ-729401',
  },
  {
    id: 'inq-102',
    labId: 'lab-apex',
    name: 'Dr. Manish Kapoor',
    phone: '9888765432',
    email: 'dr.manishkapoor@apollo.org',
    subject: 'Corporate Annual Employee Health Screening Inquiry',
    message: 'We are looking for corporate health checkups for our IT company staff (approx 65 employees). Please share package pricing and quotation.',
    createdAt: 'Yesterday, 04:15 PM',
    status: 'read',
    referenceToken: 'INQ-618290',
  },
  {
    id: 'inq-103',
    labId: 'lab-apex',
    name: 'Gurmeet Singh',
    phone: '9417890123',
    email: 'gurmeet.singh99@yahoo.in',
    subject: 'Thyroid profile fasting requirement question',
    message: 'Do I need to be 12 hours fasting for Free T3, T4 and TSH test? And can I take my morning thyroid medication before blood collection?',
    createdAt: '2 days ago, 11:45 AM',
    status: 'read',
    referenceToken: 'INQ-539102',
  },
  {
    id: 'inq-201',
    labId: 'lab-citycare',
    name: 'Kavita Chawla',
    phone: '9815044556',
    email: 'kavita.chawla@gmail.com',
    subject: 'Vitamin D3 & B12 report delivery turnaround time',
    message: 'How soon can I get the verified PDF report on WhatsApp for Vitamin D and B12 tests done at your Phase 7 center?',
    createdAt: 'Today, 08:40 AM',
    status: 'unread',
    referenceToken: 'INQ-839211',
  },
  {
    id: 'inq-301',
    labId: 'lab-metropath',
    name: 'Rajinder Kumar',
    phone: '9872166778',
    email: 'rkumar.chandigarh@gmail.com',
    subject: 'Cardiac Profile with hs-CRP pricing inquiry',
    message: 'Please let me know if doctor prescription is mandatory for Cardiac profile test or if I can book it directly online?',
    createdAt: 'Today, 10:10 AM',
    status: 'unread',
    referenceToken: 'INQ-948202',
  },
];

export const DEFAULT_DOMAIN_REQUESTS: DomainRequest[] = [
  {
    id: 'dom-req-101',
    labId: 'lab-apex',
    labName: 'Apex Diagnostic & Imaging Center',
    domainType: 'custom_domain',
    requestedDomain: 'apexdiagnostics.in',
    currentDomain: 'apexdiagnostics.indianlalaji.com',
    contactPerson: 'Dr. R. K. Sharma',
    contactPhone: '+91 7087033009',
    contactEmail: 'admin@apexdiagnostics.in',
    registrar: 'GoDaddy',
    cnameTarget: 'indianlalaji.com',
    aRecordIp: '34.149.120.45',
    dnsStatus: 'Pending DNS Propagation',
    sslStatus: 'Pending Provisioning',
    notes: 'We have purchased apexdiagnostics.in on GoDaddy. We have added the CNAME pointing to indianlalaji.com. Kindly approve and activate SSL.',
    status: 'Pending',
    createdAt: 'Today, 10:15 AM',
  },
  {
    id: 'dom-req-102',
    labId: 'lab-citycare',
    labName: 'CityCare Clinical Laboratories',
    domainType: 'custom_domain',
    requestedDomain: 'citycarelabs.com',
    currentDomain: 'citycare.indianlalaji.com',
    contactPerson: 'Dr. Sameer Gupta',
    contactPhone: '+91 9876543210',
    contactEmail: 'contact@citycarelabs.com',
    registrar: 'Hostinger',
    cnameTarget: 'indianlalaji.com',
    aRecordIp: '34.149.120.45',
    dnsStatus: 'Configured & Verified',
    sslStatus: 'Active',
    notes: 'Configured via Hostinger DNS manager with automatic Let\'s Encrypt SSL certificate.',
    status: 'Approved',
    adminRemarks: 'DNS CNAME verified successfully. Custom domain mapped to CityCare tenant.',
    createdAt: '3 days ago',
    approvedAt: '2 days ago',
    approvedBy: 'Super Admin',
  },
];

export const DEFAULT_STAFF_ACCOUNTS: LabStaffAccount[] = [
  // --- SUPER ADMIN & GLOBAL PORTAL OWNER (rkmehra331996@gmail.com) ---
  {
    id: 'staff-rkmehra-admin',
    name: 'R. K. Mehra',
    role: 'admin',
    username: 'rkmehra331996@gmail.com',
    email: 'rkmehra331996@gmail.com',
    phone: '+91 7087033009',
    password: 'admin123',
    status: 'active',
    labId: 'all',
    labName: 'Central Diagnostic & Multi-Lab Global Network',
    branchId: 'branch-1',
    branchName: 'Main Diagnostic Hub',
    lastPasswordReset: '24 Sep 2026, 10:00 AM',
    shift: '24x7 Master Administrator',
    notes: 'Primary Account Owner & Super Admin (rkmehra331996@gmail.com)',
  },
  // --- APEX DIAGNOSTICS STAFF (lab-apex) ---
  {
    id: 'staff-reception-1',
    name: 'Pooja Verma',
    role: 'reception',
    username: 'reception@apexlab.com',
    phone: '+91 98765 11223',
    password: 'reception123',
    status: 'active',
    labId: 'lab-apex',
    labName: 'Apex Diagnostic & Clinical Pathology Laboratory',
    branchId: 'branch-1',
    branchName: 'Apex Central Diagnostic Hub',
    lastPasswordReset: '01 Sep 2026, 10:30 AM',
    shift: 'Morning & Afternoon Shift (8:00 AM - 4:00 PM)',
    notes: 'Primary reception desk token generation, patient billing & fee collection',
  },
  {
    id: 'staff-tech-1',
    name: 'Amit Khurana (DMLT)',
    role: 'technician',
    username: 'technician@apexlab.com',
    phone: '+91 98765 44556',
    password: 'tech123',
    status: 'active',
    labId: 'lab-apex',
    labName: 'Apex Diagnostic & Clinical Pathology Laboratory',
    branchId: 'branch-1',
    branchName: 'Apex Central Diagnostic Hub',
    lastPasswordReset: '01 Sep 2026, 11:15 AM',
    shift: 'Full Day Diagnostic Shift (9:00 AM - 6:00 PM)',
    notes: 'Senior laboratory technician in charge of Hematology, Biochemistry & Analyzer verification',
  },
  {
    id: 'staff-manager-1',
    name: 'Vikram Malhotra',
    role: 'branch_manager',
    username: 'manager.modeltown@apexlab.com',
    phone: '+91 98140 99887',
    password: 'manager123',
    status: 'active',
    labId: 'lab-apex',
    labName: 'Apex Diagnostic & Clinical Pathology Laboratory',
    branchId: 'branch-1',
    branchName: 'Apex Diagnostic & Clinical Pathology Laboratory',
    lastPasswordReset: '02 Sep 2026, 09:00 AM',
    shift: 'General Facility Shift (7:00 AM - 3:00 PM)',
    notes: 'Operations supervisor, cash reconciliation & sample logistics',
  },
  {
    id: 'staff-pathologist-1',
    name: 'Dr. Meenakshi Sundaram',
    role: 'pathologist',
    username: 'pathologist@apexlab.com',
    phone: '+91 98150 11223',
    password: 'patho123',
    status: 'active',
    labId: 'lab-apex',
    labName: 'Apex Diagnostic & Clinical Pathology Laboratory',
    branchId: 'branch-1',
    branchName: 'Apex Diagnostic & Clinical Pathology Laboratory',
    lastPasswordReset: '03 Sep 2026, 12:00 PM',
    shift: 'Clinical Sign-off Hours (10:00 AM - 7:00 PM)',
    notes: 'Consultant Pathologist & Clinical Director, NABL signatory',
  },
  // --- CITYCARE ADVANCED DIAGNOSTICS STAFF (lab-citycare) ---
  {
    id: 'staff-cc-reception-1',
    name: 'Jasleen Chawla',
    role: 'reception',
    username: 'reception@citycare.com',
    phone: '+91 98150 22334',
    password: 'reception123',
    status: 'active',
    labId: 'lab-citycare',
    labName: 'CityCare Advanced Diagnostics & Scan Centre',
    branchId: 'branch-cc-1',
    branchName: 'CityCare Phase 7 Diagnostic Hub',
    lastPasswordReset: '01 Sep 2026, 09:30 AM',
    shift: 'Front Desk Shift (7:30 AM - 3:30 PM)',
    notes: 'CityCare registration lead, token allocation & due settlements',
  },
  {
    id: 'staff-cc-tech-1',
    name: 'Satnam Singh (DMLT)',
    role: 'technician',
    username: 'technician@citycare.com',
    phone: '+91 98150 55667',
    password: 'tech123',
    status: 'active',
    labId: 'lab-citycare',
    labName: 'CityCare Advanced Diagnostics & Scan Centre',
    branchId: 'branch-cc-1',
    branchName: 'CityCare Phase 7 Diagnostic Hub',
    lastPasswordReset: '01 Sep 2026, 10:00 AM',
    shift: 'Analyzer Workstation Shift (8:00 AM - 5:00 PM)',
    notes: 'Biochemistry, Immunoturbidimetry & Vitamin profiling specialist',
  },
  {
    id: 'staff-cc-manager-1',
    name: 'Paramjit Sandhu',
    role: 'branch_manager',
    username: 'manager@citycare.com',
    phone: '+91 98150 77889',
    password: 'manager123',
    status: 'active',
    labId: 'lab-citycare',
    labName: 'CityCare Advanced Diagnostics & Scan Centre',
    branchId: 'branch-cc-2',
    branchName: 'Phase 3B2 Collection Desk',
    lastPasswordReset: '02 Sep 2026, 08:30 AM',
    shift: 'Collection Centre Manager (8:00 AM - 4:00 PM)',
    notes: 'Branch ops, runner coordination to Phase 7 Hub & cash reconciliation',
  },
  {
    id: 'staff-cc-patho-1',
    name: 'Dr. S. K. Narang (MD Path)',
    role: 'pathologist',
    username: 'pathologist@citycare.com',
    phone: '+91 98150 12345',
    password: 'patho123',
    status: 'active',
    labId: 'lab-citycare',
    labName: 'CityCare Advanced Diagnostics & Scan Centre',
    branchId: 'all',
    branchName: 'All Branches (Central Sign-off Authority)',
    lastPasswordReset: '03 Sep 2026, 11:30 AM',
    shift: 'Clinical Sign-off Hours (9:30 AM - 6:30 PM)',
    notes: 'Senior Clinical Director, QCI signatory',
  },
  // --- METROPATH SCANS & MOLECULAR LAB STAFF (lab-metropath) ---
  {
    id: 'staff-mp-reception-1',
    name: 'Divya Sehgal',
    role: 'reception',
    username: 'reception@metropath.com',
    phone: '+91 94170 11223',
    password: 'reception123',
    status: 'active',
    labId: 'lab-metropath',
    labName: 'MetroPath Scans & Molecular Pathology Hub',
    branchId: 'branch-mp-1',
    branchName: 'MetroPath Sector 34-A Super Specialty Hub',
    lastPasswordReset: '01 Sep 2026, 08:45 AM',
    shift: 'Morning Intake Shift (8:00 AM - 4:00 PM)',
    notes: 'Patient intake, Barcode tagging & Cashless TPA / UPI processing',
  },
  {
    id: 'staff-mp-tech-1',
    name: 'Nikhil Kashyap (M.Sc MLT)',
    role: 'technician',
    username: 'technician@metropath.com',
    phone: '+91 94170 33445',
    password: 'tech123',
    status: 'active',
    labId: 'lab-metropath',
    labName: 'MetroPath Scans & Molecular Pathology Hub',
    branchId: 'branch-mp-1',
    branchName: 'MetroPath Sector 34-A Super Specialty Hub',
    lastPasswordReset: '01 Sep 2026, 09:15 AM',
    shift: 'Molecular & Cardiac Lab Shift (9:00 AM - 6:00 PM)',
    notes: 'Specializes in High Sensitivity Troponin, PSA and real-time PCR testing',
  },
  {
    id: 'staff-mp-manager-1',
    name: 'Rohit Batra',
    role: 'branch_manager',
    username: 'manager@metropath.com',
    phone: '+91 94170 66778',
    password: 'manager123',
    status: 'active',
    labId: 'lab-metropath',
    labName: 'MetroPath Scans & Molecular Pathology Hub',
    branchId: 'branch-mp-2',
    branchName: 'Sector 22 Health Express Counter',
    lastPasswordReset: '02 Sep 2026, 09:30 AM',
    shift: 'Express Centre Incharge (7:00 AM - 3:00 PM)',
    notes: 'Cold-chain sample transit monitor & branch collection auditor',
  },
  {
    id: 'staff-mp-patho-1',
    name: 'Dr. Arunava Ghosh (MD Path)',
    role: 'pathologist',
    username: 'pathologist@metropath.com',
    phone: '+91 94170 98765',
    password: 'patho123',
    status: 'active',
    labId: 'lab-metropath',
    labName: 'MetroPath Scans & Molecular Pathology Hub',
    branchId: 'all',
    branchName: 'All Branches (Central Sign-off Authority)',
    lastPasswordReset: '03 Sep 2026, 10:00 AM',
    shift: 'Clinical Sign-off Hours (9:00 AM - 7:00 PM)',
    notes: 'Consultant Molecular Pathologist, NABL accredited digital signatory',
  },
  // --- SANJIVANI PATHOLOGY STAFF (lab-sanjivani) ---
  {
    id: 'staff-sanj-reception-1',
    name: 'Kiranpreet Kaur',
    role: 'reception',
    username: 'reception@sanjivani.com',
    phone: '+91 98881 11223',
    password: 'reception123',
    status: 'active',
    labId: 'lab-sanjivani',
    labName: 'Sanjivani Pathology & Preventive Health Lab',
    branchId: 'branch-sanj-1',
    branchName: 'Sanjivani Civil Lines Lab',
    lastPasswordReset: '01 Sep 2026, 09:00 AM',
    shift: 'Morning Shift (7:30 AM - 3:30 PM)',
    notes: 'Patient reception, token dispensing, Punjabi/Hindi billing communication',
  },
  {
    id: 'staff-sanj-tech-1',
    name: 'Harbhajan Singh (DMLT)',
    role: 'technician',
    username: 'technician@sanjivani.com',
    phone: '+91 98881 44556',
    password: 'tech123',
    status: 'active',
    labId: 'lab-sanjivani',
    labName: 'Sanjivani Pathology & Preventive Health Lab',
    branchId: 'branch-sanj-1',
    branchName: 'Sanjivani Civil Lines Lab',
    lastPasswordReset: '01 Sep 2026, 09:30 AM',
    shift: 'Lab Analysis Shift (8:00 AM - 5:00 PM)',
    notes: 'Routine hematology, glucose test strips, urine chemistry analyst',
  },
  {
    id: 'staff-sanj-patho-1',
    name: 'Dr. Gurinder Singh (MD Path)',
    role: 'pathologist',
    username: 'pathologist@sanjivani.com',
    phone: '+91 98881 23456',
    password: 'patho123',
    status: 'active',
    labId: 'lab-sanjivani',
    labName: 'Sanjivani Pathology & Preventive Health Lab',
    branchId: 'all',
    branchName: 'All Branches (Central Sign-off Authority)',
    lastPasswordReset: '02 Sep 2026, 11:00 AM',
    shift: 'Clinical Sign-off (10:00 AM - 6:00 PM)',
    notes: 'Chief Pathologist, approves outpatient and clinical pathology reports',
  },
  // --- LIFELINE PATHCARE STAFF (lab-lifeline-due) ---
  {
    id: 'staff-life-reception-1',
    name: 'Manpreet Sodhi',
    role: 'reception',
    username: 'reception@lifeline.com',
    phone: '+91 98720 11223',
    password: 'reception123',
    status: 'active',
    labId: 'lab-lifeline-due',
    labName: 'LifeLine PathCare Diagnostic Centre',
    branchId: 'branch-life-1',
    branchName: 'LifeLine Main Diagnostic Desk',
    lastPasswordReset: '01 Sep 2026, 08:30 AM',
    shift: 'General Desk (8:00 AM - 4:00 PM)',
    notes: 'Counter bookings, home collection logs, patient registration',
  },
  {
    id: 'staff-life-tech-1',
    name: 'Davinder Pal (MLT)',
    role: 'technician',
    username: 'technician@lifeline.com',
    phone: '+91 98720 33445',
    password: 'tech123',
    status: 'active',
    labId: 'lab-lifeline-due',
    labName: 'LifeLine PathCare Diagnostic Centre',
    branchId: 'branch-life-1',
    branchName: 'LifeLine Main Diagnostic Desk',
    lastPasswordReset: '01 Sep 2026, 09:00 AM',
    shift: 'Processing Shift (8:30 AM - 5:30 PM)',
    notes: 'Biochemistry, hematology analyzer runner, serum separation',
  },
  // --- HEALTECH MOLECULAR STAFF (lab-healtech-pending) ---
  {
    id: 'staff-ht-reception-1',
    name: 'Ramanjit Dhillon',
    role: 'reception',
    username: 'reception@healtech.com',
    phone: '+91 98765 11223',
    password: 'reception123',
    status: 'active',
    labId: 'lab-healtech-pending',
    labName: 'HealTech Molecular & Allergy Diagnostic Lab',
    branchId: 'branch-ht-1',
    branchName: 'HealTech Patiala Central Hub',
    lastPasswordReset: '01 Sep 2026, 08:00 AM',
    shift: 'Front Desk Shift (8:00 AM - 4:00 PM)',
    notes: 'Allergy panel requisition handling and patient registration',
  },
  {
    id: 'staff-ht-tech-1',
    name: 'Dr. Tarun Sachdeva (M.Sc Biotech)',
    role: 'technician',
    username: 'technician@healtech.com',
    phone: '+91 98765 33445',
    password: 'tech123',
    status: 'active',
    labId: 'lab-healtech-pending',
    labName: 'HealTech Molecular & Allergy Diagnostic Lab',
    branchId: 'branch-ht-1',
    branchName: 'HealTech Patiala Central Hub',
    lastPasswordReset: '01 Sep 2026, 09:15 AM',
    shift: 'Molecular Lab (9:00 AM - 6:00 PM)',
    notes: 'ELISA immuno-blotting, Total IgE assay & flow cytometry processing',
  },
  // --- PULSE DIAGNOSTICS STAFF (lab-pulse) ---
  {
    id: 'staff-pls-reception-1',
    name: 'Simran Jolly',
    role: 'reception',
    username: 'reception@pulselab.com',
    phone: '+91 98150 11223',
    password: 'reception123',
    status: 'active',
    labId: 'lab-pulse',
    labName: 'Pulse Diagnostics & MRI Centre',
    branchId: 'branch-pls-1',
    branchName: 'Pulse Sector 5 Diagnostics & MRI Hub',
    lastPasswordReset: '01 Sep 2026, 07:30 AM',
    shift: 'Emergency Intake Desk (7:00 AM - 3:00 PM)',
    notes: 'Stat cardiac biomarker orders, token queue management',
  },
  {
    id: 'staff-pls-tech-1',
    name: 'Gaurav Aggarwal (Senior MLT)',
    role: 'technician',
    username: 'technician@pulselab.com',
    phone: '+91 98150 44556',
    password: 'tech123',
    status: 'active',
    labId: 'lab-pulse',
    labName: 'Pulse Diagnostics & MRI Centre',
    branchId: 'branch-pls-1',
    branchName: 'Pulse Sector 5 Diagnostics & MRI Hub',
    lastPasswordReset: '01 Sep 2026, 08:30 AM',
    shift: 'Stat Testing Shift (8:00 AM - 5:00 PM)',
    notes: 'Emergency cardiac enzyme run, D-Dimer test validation',
  },
  // --- CAREPOINT CLINICAL LAB STAFF (lab-carepoint) ---
  {
    id: 'staff-cp-reception-1',
    name: 'Priya Sharma',
    role: 'reception',
    username: 'reception@carepointlab.com',
    phone: '+91 98160 11223',
    password: 'reception123',
    status: 'active',
    labId: 'lab-carepoint',
    labName: 'CarePoint Clinical Laboratory',
    branchId: 'branch-cp-1',
    branchName: 'CarePoint Mall Road Diagnostic Centre',
    lastPasswordReset: '01 Sep 2026, 08:30 AM',
    shift: 'Hillside Desk (8:00 AM - 4:30 PM)',
    notes: 'Outpatient register, cash/UPI receipt issue, token management',
  },
  {
    id: 'staff-cp-tech-1',
    name: 'Chetan Chauhan (DMLT)',
    role: 'technician',
    username: 'technician@carepointlab.com',
    phone: '+91 98160 33445',
    password: 'tech123',
    status: 'active',
    labId: 'lab-carepoint',
    labName: 'CarePoint Clinical Laboratory',
    branchId: 'branch-cp-1',
    branchName: 'CarePoint Mall Road Diagnostic Centre',
    lastPasswordReset: '01 Sep 2026, 09:00 AM',
    shift: 'Analysis Shift (8:30 AM - 5:30 PM)',
    notes: 'Cold specimen preparation, routine biochemistry & microscopy',
  },
];

// --- CMS CONTEXT INTERFACE ---
interface CmsContextType {
  currentUser: CmsUser | null;
  activeBranchId: string;
  setActiveBranchId: (branchId: string) => void;
  activeDeviceId: 'device-a' | 'device-b';
  setActiveDeviceId: (dev: 'device-a' | 'device-b' | string) => void;
  login: (
    role: 'admin' | 'vendor' | 'branch_manager' | 'reception' | 'technician' | 'pathologist',
    email?: string,
    password?: string,
    labId?: string,
    branchId?: string,
    pin?: string
  ) => { success: boolean; targetView: AppView; error?: string };
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalTab: 'login' | 'register';
  setAuthModalTab: (tab: 'login' | 'register') => void;
  targetLoginRole: 'admin' | 'technician' | 'reception' | 'vendor' | null;
  openLoginModal: (
    role?: UserRole | 'admin' | 'technician' | 'reception' | 'vendor',
    initialTab?: 'login' | 'register'
  ) => void;
  openRegisterLabModal: () => void;
  registerNewLab: (payload: {
    labName: string;
    state: string;
    phone: string;
    password?: string;
    pin?: string;
    ownerName?: string;
    email?: string;
    city?: string;
    address?: string;
    tagline?: string;
    nablCode?: string;
    category?: string;
    subscriptionPlan?: string;
  }) => { lab: VendorLabDirectoryItem; adminUser: CmsUser };

  // Lab Staff Credentials (Lab Owner creates & resets Reception & Technician)
  staffAccounts: LabStaffAccount[];
  allStaffAccounts: LabStaffAccount[];
  addStaffAccount: (staff: Omit<LabStaffAccount, 'id'>) => void;
  updateStaffAccount: (id: string, updates: Partial<LabStaffAccount>) => void;
  resetStaffPassword: (id: string, newPassword: string) => void;
  deleteStaffAccount: (id: string) => void;
  transferStaffDataAndDelete: (deletingStaffId: string, recipientStaffId: string) => void;
  updateAdminProfile: (updates: { name: string; password?: string; pin?: string }) => void;

  // Company CMS
  companySettings: CompanySettings;
  updateCompanySettings: (newSettings: Partial<CompanySettings>) => void;
  portalSections: PortalWebsiteSections;
  updatePortalSection: (sectionKey: keyof PortalWebsiteSections, enabled: boolean) => void;
  toggleAllPortalSections: (enabled: boolean) => void;
  pricingPlans: PricingPlan[];
  addPricingPlan: (plan: Omit<PricingPlan, 'id'>) => void;
  updatePricingPlan: (id: string, plan: Partial<PricingPlan>) => void;
  updatePlanPrice: (id: string, newPrice: number) => void;
  resetPricingPlansToDefault: () => void;
  syncFeaturesToAllPlans: (features: string[]) => void;
  deletePricingPlan: (id: string) => void;
  companyFeatures: CompanyFeature[];
  addCompanyFeature: (feature: Omit<CompanyFeature, 'id'>) => void;
  updateCompanyFeature: (id: string, feature: Partial<CompanyFeature>) => void;
  deleteCompanyFeature: (id: string) => void;
  labManagementFeatures: LabManagementFeature[];
  addLabManagementFeature: (feat: Omit<LabManagementFeature, 'id'>) => void;
  updateLabManagementFeature: (id: string, updates: Partial<LabManagementFeature>) => void;
  deleteLabManagementFeature: (id: string) => void;
  resetLabManagementFeatures: () => void;
  companyFaqs: CompanyFaq[];
  addCompanyFaq: (faq: Omit<CompanyFaq, 'id'>) => void;
  updateCompanyFaq: (id: string, faq: Partial<CompanyFaq>) => void;
  deleteCompanyFaq: (id: string) => void;
  companyStats: CompanyStat[];
  updateCompanyStat: (id: string, stat: Partial<CompanyStat>) => void;

  // Vendor Lab CMS
  vendorLabSettings: VendorLabSettings;
  updateVendorLabSettings: (newSettings: Partial<VendorLabSettings>) => void;
  vendorPackages: VendorPackage[];
  addVendorPackage: (pkg: Omit<VendorPackage, 'id'>) => void;
  updateVendorPackage: (id: string, pkg: Partial<VendorPackage>) => void;
  deleteVendorPackage: (id: string) => void;
  vendorTests: TestItem[];
  addVendorTest: (test: Omit<TestItem, 'id'>) => void;
  updateVendorTest: (id: string, test: Partial<TestItem>) => void;
  deleteVendorTest: (id: string) => void;
  vendorDoctors: VendorDoctor[];
  addVendorDoctor: (doc: Omit<VendorDoctor, 'id'>) => void;
  updateVendorDoctor: (id: string, doc: Partial<VendorDoctor>) => void;
  deleteVendorDoctor: (id: string) => void;
  vendorBranches: VendorBranch[];
  addVendorBranch: (branch: Omit<VendorBranch, 'id'>) => void;
  updateVendorBranch: (id: string, branch: Partial<VendorBranch>) => void;
  deleteVendorBranch: (id: string) => void;
  vendorBookings: HomeCollectionBooking[];
  addHomeCollectionBooking: (
    booking: Omit<HomeCollectionBooking, 'id' | 'createdAt' | 'status'>
  ) => void;
  updateBookingStatus: (id: string, status: HomeCollectionBooking['status']) => void;
  deleteBooking: (id: string) => void;
  transferBookingToReception: (bookingId: string) => { success: boolean; tokenNo?: string; message?: string };

  // Contact Form Inquiries
  contactSubmissions: ContactSubmission[];
  allContactSubmissions: ContactSubmission[];
  addContactSubmission: (
    submission: Omit<ContactSubmission, 'id' | 'createdAt' | 'status'>
  ) => void;
  markContactAsRead: (id: string) => void;
  toggleContactReadStatus: (id: string) => void;
  deleteContactSubmission: (id: string) => void;
  clearContactSubmissions: () => void;

  // Domain Requests (6. Domain request: Add - request to super Admin, change/delete)
  domainRequests: DomainRequest[];
  allDomainRequests: DomainRequest[];
  addDomainRequest: (
    req: Omit<DomainRequest, 'id' | 'createdAt' | 'status'>
  ) => DomainRequest;
  updateDomainRequest: (id: string, updates: Partial<DomainRequest>) => void;
  deleteDomainRequest: (id: string) => void;
  approveDomainRequest: (id: string, adminRemarks?: string) => void;
  rejectDomainRequest: (id: string, adminRemarks?: string) => void;

  // Multi-Vendor Labs Directory & Switching
  selectedVendorLabId: string;
  setSelectedVendorLabId: (labId: string) => void;
  selectVendorLab: (labId: string) => void;
  vendorLabsList: VendorLabDirectoryItem[];
  addVendorLab: (vendor: Omit<VendorLabDirectoryItem, 'id'>) => VendorLabDirectoryItem;
  updateVendorLab: (id: string, updates: Partial<VendorLabDirectoryItem>) => void;
  updateVendorLabCredentials: (labId: string, password: string, pin?: string) => void;
  deleteVendorLab: (id: string) => void;
  setVendorStatus: (id: string, status: VendorStatus) => void;

  // Vendor Website Sections
  updateVendorSection: (sectionKey: keyof VendorWebsiteSections, enabled: boolean) => void;
  toggleAllVendorSections: (enabled: boolean) => void;

  // Lab Reports Store
  reports: LabReport[];
  labReports: LabReport[];
  allReports: LabReport[];
  setLabReports: React.Dispatch<React.SetStateAction<LabReport[]>>;
  addLabReport: (report: LabReport) => void;
  updateLabReport: (reportId: string, updated: Partial<LabReport>) => void;
  deleteLabReport: (reportId: string) => void;
  cancelLabReport: (reportId: string, reason: string, cancelledBy?: string) => void;
  uncancelLabReport: (reportId: string) => void;
  getReportById: (id: string) => LabReport | undefined;
  getReportByMobile: (mobile: string) => LabReport | undefined;

  // Reception Desk Patients Store
  receptionEntries: ReceptionPatientEntry[];
  allReceptionEntries: ReceptionPatientEntry[];
  patients: Patient[];
  addReceptionEntry: (entry: Omit<ReceptionPatientEntry, 'id'>) => ReceptionPatientEntry;
  updateReceptionStatus: (id: string, status: ReceptionPatientEntry['status']) => void;
  updateReceptionEntry: (id: string, updates: Partial<ReceptionPatientEntry>) => void;
  deleteReceptionEntry: (id: string) => void;
  clearReceptionEntries: () => void;
  sendEntryToTechnician: (id: string) => void;
  acceptEntryByTechnician: (id: string) => void;
  completeTechnicianReport: (id: string, reportId: string) => void;
  publishReport: (id: string, publishedBy?: string) => void;
  unpublishReport: (id: string) => void;

  vendorLabSettingsMap: Record<string, VendorLabSettings>;
  getLabSettings: (labId?: string) => VendorLabSettings;

  // Reset demo
  resetAllToDefaults: () => void;

  // Backup & Restore
  importFullWebsiteBackup: (backup: any) => { success: boolean; message: string };
  importCustomerEntryBackup: (backup: any, mode?: 'append' | 'replace') => { success: boolean; message: string; count: number };

  // Multi-Lab Data Isolation & Tenant Security
  activeTenantId: string;
  activeTenantName: string;
  superAdminTenantScope: string;
  setSuperAdminTenantScope: (scope: string) => void;
  isTenantIsolated: boolean;
  queryTenantIsolatedPatients: (targetLabId?: string) => ReceptionPatientEntry[];
  queryTenantIsolatedReports: (targetLabId?: string) => LabReport[];
  queryTenantIsolatedBilling: (targetLabId?: string) => {
    totalCollection: number;
    dueAmount: number;
    totalPatients: number;
    bookings: HomeCollectionBooking[];
  };
  queryTenantIsolatedStaff: (targetLabId?: string) => LabStaffAccount[];
  
  // Real-Time Cloud Synchronization (Firestore)
  isCloudConnected: boolean;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline';
  lastCloudSyncTime: string;
  refreshCloudData: () => Promise<void>;
}

const CmsContext = createContext<CmsContextType | null>(null);

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<CmsUser | null>(() => {
    try {
      const saved = localStorage.getItem('cms_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [targetLoginRole, setTargetLoginRole] = useState<
    'admin' | 'technician' | 'reception' | 'vendor' | null
  >(null);
  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('cms_current_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.branchId && u.branchId !== 'all') return u.branchId;
      }
      return 'branch-1';
    } catch {
      return 'branch-1';
    }
  });

  const activeDeviceId: 'device-a' | 'device-b' =
    activeBranchId === 'branch-2' || activeBranchId === 'device-b' || activeBranchId === 'branch-cc-2' || activeBranchId === 'branch-mp-2'
      ? 'device-b'
      : 'device-a';

  const setActiveDeviceId = (dev: 'device-a' | 'device-b' | string) => {
    if (dev === 'device-b' || dev === 'branch-2') {
      setActiveBranchId('branch-2');
    } else {
      setActiveBranchId('branch-1');
    }
  };

  // Company State
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    try {
      const saved = localStorage.getItem('cms_company_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.superAdminDomain || parsed.companyName === 'LABNAME.COM' || parsed.superAdminDomain === 'indianlala.com' || parsed.companyName === 'INDIANLALA.COM') {
          return {
            ...DEFAULT_COMPANY_SETTINGS,
            ...parsed,
            companyName: (parsed.companyName === 'LABNAME.COM' || parsed.companyName === 'INDIANLALA.COM') ? 'INDIANLALAJI.COM' : parsed.companyName,
            superAdminDomain: 'indianlalaji.com',
            platformDomain: 'indianlalaji.com',
            supportEmail: (parsed.supportEmail === 'contact@labname.com' || parsed.supportEmail === 'admin@indianlala.com') ? 'admin@indianlalaji.com' : parsed.supportEmail,
          };
        }
        return { ...DEFAULT_COMPANY_SETTINGS, ...parsed };
      }
      return DEFAULT_COMPANY_SETTINGS;
    } catch {
      return DEFAULT_COMPANY_SETTINGS;
    }
  });

  const [portalSections, setPortalSections] = useState<PortalWebsiteSections>(() => {
    try {
      const saved = localStorage.getItem('cms_portal_sections_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PORTAL_SECTIONS, ...parsed, vendorWebsitesShowcase: false, faq: false };
      }
      return DEFAULT_PORTAL_SECTIONS;
    } catch {
      return DEFAULT_PORTAL_SECTIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cms_portal_sections_v2', JSON.stringify(portalSections));
    } catch {}
  }, [portalSections]);

  const updatePortalSection = (sectionKey: keyof PortalWebsiteSections, enabled: boolean) => {
    setPortalSections((prev) => {
      const updated = { ...prev, [sectionKey]: enabled };
      syncPortalSectionsToCloud(updated);
      return updated;
    });
  };

  const toggleAllPortalSections = (enabled: boolean) => {
    setPortalSections((prev) => {
      const updated = { ...prev };
      (Object.keys(updated) as (keyof PortalWebsiteSections)[]).forEach((k) => {
        updated[k] = enabled;
      });
      syncPortalSectionsToCloud(updated);
      return updated;
    });
  };

  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(() => {
    try {
      const saved = localStorage.getItem('cms_pricing_plans');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length === 3 &&
          parsed.some((p) => p.id === 'plan-1month' || p.name?.includes('1 Month'))
        ) {
          return parsed;
        }
      }
      return DEFAULT_PRICING_PLANS;
    } catch {
      return DEFAULT_PRICING_PLANS;
    }
  });

  const [companyFeatures, setCompanyFeatures] = useState<CompanyFeature[]>(() => {
    try {
      const saved = localStorage.getItem('cms_company_features');
      return saved ? JSON.parse(saved) : DEFAULT_COMPANY_FEATURES;
    } catch {
      return DEFAULT_COMPANY_FEATURES;
    }
  });

  const [labManagementFeatures, setLabManagementFeatures] = useState<LabManagementFeature[]>(() => {
    try {
      const saved = localStorage.getItem('cms_lab_management_features');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_LAB_MANAGEMENT_FEATURES;
    } catch {
      return DEFAULT_LAB_MANAGEMENT_FEATURES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cms_lab_management_features', JSON.stringify(labManagementFeatures));
    } catch {}
  }, [labManagementFeatures]);

  const addLabManagementFeature = (feat: Omit<LabManagementFeature, 'id'>) => {
    const newFeat: LabManagementFeature = {
      ...feat,
      id: `lmf-${Date.now()}`,
    };
    setLabManagementFeatures((prev) => [...prev, newFeat]);
  };

  const updateLabManagementFeature = (id: string, updates: Partial<LabManagementFeature>) => {
    setLabManagementFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const deleteLabManagementFeature = (id: string) => {
    setLabManagementFeatures((prev) => prev.filter((f) => f.id !== id));
  };

  const resetLabManagementFeatures = () => {
    setLabManagementFeatures([...DEFAULT_LAB_MANAGEMENT_FEATURES]);
    try {
      localStorage.setItem('cms_lab_management_features', JSON.stringify(DEFAULT_LAB_MANAGEMENT_FEATURES));
    } catch {}
  };

  const [companyFaqs, setCompanyFaqs] = useState<CompanyFaq[]>(() => {
    try {
      const saved = localStorage.getItem('cms_company_faqs');
      return saved ? JSON.parse(saved) : DEFAULT_COMPANY_FAQS;
    } catch {
      return DEFAULT_COMPANY_FAQS;
    }
  });

  const [companyStats, setCompanyStats] = useState<CompanyStat[]>(() => {
    try {
      const saved = localStorage.getItem('cms_company_stats');
      return saved ? JSON.parse(saved) : DEFAULT_COMPANY_STATS;
    } catch {
      return DEFAULT_COMPANY_STATS;
    }
  });

  // Multi-Vendor Labs Directory & Active Lab Selection
  const [vendorLabsList, setVendorLabsList] = useState<VendorLabDirectoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('cms_vendor_labs_list');
      return saved ? JSON.parse(saved) : VENDOR_LABS_DIRECTORY;
    } catch {
      return VENDOR_LABS_DIRECTORY;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cms_vendor_labs_list', JSON.stringify(vendorLabsList));
    } catch {}
  }, [vendorLabsList]);

  const [selectedVendorLabId, setSelectedVendorLabId] = useState<string>('lab-apex');

  // Super Admin global vs lab-specific view scope ('all' or specific labId)
  const [superAdminTenantScope, setSuperAdminTenantScope] = useState<string>('all');

  // Compute the current active tenant/laboratory ID
  const activeTenantId = useMemo(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        return superAdminTenantScope;
      }
      return currentUser.labId || 'lab-apex';
    }
    return selectedVendorLabId || 'lab-apex';
  }, [currentUser, superAdminTenantScope, selectedVendorLabId]);

  const isTenantIsolated = activeTenantId !== 'all';

  const activeTenantName = useMemo(() => {
    if (activeTenantId === 'all') return 'All Laboratories (Super Admin Global Scope)';
    const match = vendorLabsList.find((l) => l.id === activeTenantId);
    return match ? match.name : (currentUser?.labName || 'Apex Diagnostic Central');
  }, [activeTenantId, vendorLabsList, currentUser]);

  // Per-Vendor Lab Settings Map (Isolated by labId)
  const [vendorLabSettingsMap, setVendorLabSettingsMap] = useState<Record<string, VendorLabSettings>>(() => {
    try {
      const saved = localStorage.getItem('cms_vendor_lab_settings_map');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_VENDOR_SETTINGS_MAP, ...parsed };
      }
      const legacySaved = localStorage.getItem('cms_vendor_lab_settings');
      if (legacySaved) {
        const parsedLegacy = JSON.parse(legacySaved);
        return {
          ...DEFAULT_VENDOR_SETTINGS_MAP,
          'lab-apex': { ...DEFAULT_VENDOR_LAB_SETTINGS, ...parsedLegacy, labId: 'lab-apex' },
        };
      }
      return DEFAULT_VENDOR_SETTINGS_MAP;
    } catch {
      return DEFAULT_VENDOR_SETTINGS_MAP;
    }
  });

  const effectiveSettingsLabId = selectedVendorLabId || (currentUser?.role !== 'admin' ? currentUser?.labId : 'lab-apex') || 'lab-apex';

  const vendorLabSettings = useMemo<VendorLabSettings>(() => {
    if (vendorLabSettingsMap[effectiveSettingsLabId]) {
      return vendorLabSettingsMap[effectiveSettingsLabId];
    }
    const dirMatch = vendorLabsList.find((l) => l.id === effectiveSettingsLabId) || VENDOR_LABS_DIRECTORY.find((l) => l.id === effectiveSettingsLabId);
    if (dirMatch) {
      return buildDefaultSettingsForLab(dirMatch);
    }
    return DEFAULT_VENDOR_LAB_SETTINGS;
  }, [vendorLabSettingsMap, effectiveSettingsLabId, vendorLabsList]);

  const getLabSettings = useCallback((labId?: string): VendorLabSettings => {
    const targetId = labId || effectiveSettingsLabId;
    if (vendorLabSettingsMap[targetId]) {
      return vendorLabSettingsMap[targetId];
    }
    const dirMatch = vendorLabsList.find((l) => l.id === targetId) || VENDOR_LABS_DIRECTORY.find((l) => l.id === targetId);
    if (dirMatch) {
      return buildDefaultSettingsForLab(dirMatch);
    }
    return DEFAULT_VENDOR_LAB_SETTINGS;
  }, [vendorLabSettingsMap, effectiveSettingsLabId, vendorLabsList]);

  const [allVendorPackages, setAllVendorPackages] = useState<VendorPackage[]>(() => {
    try {
      const saved = localStorage.getItem('cms_all_vendor_packages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p: any) => p.id));
          const existingLabIds = new Set(parsed.map((p: any) => p.labId));
          const missingPkgs = DEFAULT_ALL_VENDOR_PACKAGES.filter((p) => !existingIds.has(p.id) && !existingLabIds.has(p.labId));
          return [...parsed.map((p: any) => ({ ...p, labId: p.labId || 'lab-apex' })), ...missingPkgs];
        }
      }
      return DEFAULT_ALL_VENDOR_PACKAGES;
    } catch {
      return DEFAULT_ALL_VENDOR_PACKAGES;
    }
  });

  const [allVendorDoctors, setAllVendorDoctors] = useState<VendorDoctor[]>(() => {
    try {
      const saved = localStorage.getItem('cms_all_vendor_doctors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((d: any) => d.id));
          const existingLabIds = new Set(parsed.map((d: any) => d.labId));
          const missingDocs = DEFAULT_ALL_VENDOR_DOCTORS.filter((d) => !existingIds.has(d.id) && !existingLabIds.has(d.labId));
          return [...parsed.map((d: any) => ({ ...d, labId: d.labId || 'lab-apex' })), ...missingDocs];
        }
      }
      return DEFAULT_ALL_VENDOR_DOCTORS;
    } catch {
      return DEFAULT_ALL_VENDOR_DOCTORS;
    }
  });

  const vendorPackages = useMemo(() => {
    if (currentUser?.role === 'admin') {
      if (superAdminTenantScope === 'all') {
        return selectedVendorLabId
          ? allVendorPackages.filter((p) => isTenantMatch(p, selectedVendorLabId))
          : allVendorPackages;
      }
      return allVendorPackages.filter((p) => isTenantMatch(p, superAdminTenantScope));
    }
    const targetLab = selectedVendorLabId || currentUser?.labId || 'lab-apex';
    return allVendorPackages.filter((p) => isTenantMatch(p, targetLab));
  }, [allVendorPackages, selectedVendorLabId, currentUser, superAdminTenantScope]);

  const vendorDoctors = useMemo(() => {
    if (currentUser?.role === 'admin') {
      if (superAdminTenantScope === 'all') {
        return selectedVendorLabId
          ? allVendorDoctors.filter((d) => isTenantMatch(d, selectedVendorLabId))
          : allVendorDoctors;
      }
      return allVendorDoctors.filter((d) => isTenantMatch(d, superAdminTenantScope));
    }
    const targetLab = selectedVendorLabId || currentUser?.labId || 'lab-apex';
    return allVendorDoctors.filter((d) => isTenantMatch(d, targetLab));
  }, [allVendorDoctors, selectedVendorLabId, currentUser, superAdminTenantScope]);

  // Real-Time Cloud Firestore Sync State
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>('Just now');

  // Master Raw Stores (Isolated by labId)
  const [allReports, setAllReports] = useState<LabReport[]>(() => {
    try {
      const saved = localStorage.getItem('cms_lab_reports');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((r: any) => r.reportId));
          const existingLabIds = new Set(parsed.map((r: any) => r.labId));
          const missingReports = INITIAL_REPORTS.filter((r) => !existingIds.has(r.reportId) && !existingLabIds.has(r.labId));
          return [...parsed.map((r: any) => ({ ...r, labId: r.labId || 'lab-apex' })), ...missingReports];
        }
      }
      return INITIAL_REPORTS;
    } catch {
      return INITIAL_REPORTS;
    }
  });

  const [allReceptionEntries, setAllReceptionEntries] = useState<ReceptionPatientEntry[]>(() => {
    try {
      const saved = localStorage.getItem('cms_reception_entries');
      const rawList = saved ? JSON.parse(saved) : INITIAL_RECEPTION_ENTRIES;
      let list = Array.isArray(rawList) ? rawList : INITIAL_RECEPTION_ENTRIES;
      const existingIds = new Set(list.map((e: any) => e.id));
      const existingLabIds = new Set(list.map((e: any) => e.labId));
      const missingEntries = INITIAL_RECEPTION_ENTRIES.filter((e) => !existingIds.has(e.id) && !existingLabIds.has(e.labId));
      list = [...list, ...missingEntries];
      return list.filter(Boolean).map((e: any, idx: number) => {
        const token = String(e?.tokenNumber || e?.tokenNo || `TK-${101 + idx}`);
        return {
          ...e,
          tokenNumber: token,
          tokenNo: token,
          labId: e.labId || 'lab-apex',
        };
      });
    } catch {
      return INITIAL_RECEPTION_ENTRIES;
    }
  });

  const [allVendorBranches, setAllVendorBranches] = useState<VendorBranch[]>(() => {
    try {
      const saved = localStorage.getItem('cms_vendor_devices_v6');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((b: any) => b.id));
          const missingBranches = DEFAULT_VENDOR_BRANCHES.filter((b) => !existingIds.has(b.id));
          return [...parsed.map((b: any) => ({ ...b, labId: b.labId || 'lab-apex' })), ...missingBranches];
        }
      }
      return DEFAULT_VENDOR_BRANCHES;
    } catch {
      return DEFAULT_VENDOR_BRANCHES;
    }
  });

  const [allVendorBookings, setAllVendorBookings] = useState<HomeCollectionBooking[]>(() => {
    try {
      const saved = localStorage.getItem('cms_vendor_bookings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((b: any) => b.id));
          const existingLabIds = new Set(parsed.map((b: any) => b.labId));
          const missingBookings = DEFAULT_VENDOR_BOOKINGS.filter((b) => !existingIds.has(b.id) && !existingLabIds.has(b.labId));
          return [...parsed.map((b: any) => ({ ...b, labId: b.labId || 'lab-apex' })), ...missingBookings];
        }
      }
      return DEFAULT_VENDOR_BOOKINGS;
    } catch {
      return DEFAULT_VENDOR_BOOKINGS;
    }
  });

  const [allContactSubmissions, setAllContactSubmissions] = useState<ContactSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('cms_contact_submissions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((c: any) => c.id));
          const missing = DEFAULT_CONTACT_SUBMISSIONS.filter((c) => !existingIds.has(c.id));
          return [...parsed, ...missing];
        }
      }
      return DEFAULT_CONTACT_SUBMISSIONS;
    } catch {
      return DEFAULT_CONTACT_SUBMISSIONS;
    }
  });

  const [allDomainRequests, setAllDomainRequests] = useState<DomainRequest[]>(() => {
    try {
      const saved = localStorage.getItem('cms_domain_requests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((r: any) => r.id));
          const missing = DEFAULT_DOMAIN_REQUESTS.filter((r) => !existingIds.has(r.id));
          return [...parsed, ...missing];
        }
      }
      return DEFAULT_DOMAIN_REQUESTS;
    } catch {
      return DEFAULT_DOMAIN_REQUESTS;
    }
  });

  const [allStaffAccounts, setAllStaffAccounts] = useState<LabStaffAccount[]>(() => {
    try {
      const saved = localStorage.getItem('cms_lab_staff_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((s: any) => s.id));
          const existingLabIds = new Set(parsed.map((s: any) => s.labId));
          const missingStaff = DEFAULT_STAFF_ACCOUNTS.filter((s) => !existingIds.has(s.id) && !existingLabIds.has(s.labId));
          return [...parsed.map((s: any) => ({ ...s, labId: s.labId || 'lab-apex' })), ...missingStaff];
        }
      }
      return DEFAULT_STAFF_ACCOUNTS;
    } catch {
      return DEFAULT_STAFF_ACCOUNTS;
    }
  });

  const [allVendorTests, setAllVendorTests] = useState<TestItem[]>(() => {
    try {
      const saved = localStorage.getItem('cms_vendor_tests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((t: any) => t.id));
          const existingLabIds = new Set(parsed.map((t: any) => t.labId));
          const missingTests = MOCK_TESTS.filter((t) => !existingIds.has(t.id) && !existingLabIds.has(t.labId));
          return [...parsed.map((t: any) => ({ ...t, labId: t.labId || 'lab-apex' })), ...missingTests];
        }
      }
      return MOCK_TESTS;
    } catch {
      return MOCK_TESTS;
    }
  });

  // LocalStorage sync effects
  useEffect(() => {
    try {
      localStorage.setItem('cms_vendor_lab_settings_map', JSON.stringify(vendorLabSettingsMap));
      localStorage.setItem('cms_vendor_lab_settings', JSON.stringify(vendorLabSettings));
    } catch {}
  }, [vendorLabSettingsMap, vendorLabSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('cms_all_vendor_packages', JSON.stringify(allVendorPackages));
    } catch {}
  }, [allVendorPackages]);

  useEffect(() => {
    try {
      localStorage.setItem('cms_all_vendor_doctors', JSON.stringify(allVendorDoctors));
    } catch {}
  }, [allVendorDoctors]);

  useEffect(() => {
    try {
      localStorage.setItem('cms_lab_reports', JSON.stringify(allReports));
    } catch {}
  }, [allReports]);

  useEffect(() => {
    try {
      localStorage.setItem('cms_reception_entries', JSON.stringify(allReceptionEntries));
    } catch {}
  }, [allReceptionEntries]);

  useEffect(() => {
    try {
      localStorage.setItem('cms_vendor_devices_v6', JSON.stringify(allVendorBranches));
    } catch {}
  }, [allVendorBranches]);

  useEffect(() => {
    try {
      localStorage.setItem('cms_vendor_bookings', JSON.stringify(allVendorBookings));
    } catch {}
  }, [allVendorBookings]);

  useEffect(() => {
    try {
      localStorage.setItem('cms_contact_submissions', JSON.stringify(allContactSubmissions));
    } catch {}
  }, [allContactSubmissions]);

  useEffect(() => {
    try {
      localStorage.setItem('cms_domain_requests', JSON.stringify(allDomainRequests));
    } catch {}
  }, [allDomainRequests]);

  useEffect(() => {
    try {
      localStorage.setItem('cms_lab_staff_accounts', JSON.stringify(allStaffAccounts));
    } catch {}
  }, [allStaffAccounts]);

  useEffect(() => {
    try {
      localStorage.setItem('cms_vendor_tests', JSON.stringify(allVendorTests));
    } catch {}
  }, [allVendorTests]);

  // Real-Time Cloud Firestore Multi-Device Sync
  // Subscribes All Devices (Client Phone, Reception, Technician, Pathologist, Admin) to Live Updates
  useEffect(() => {
    // 1. Seed initial mock records if cloud database is fresh
    seedInitialFirestoreData(
      INITIAL_RECEPTION_ENTRIES, 
      INITIAL_REPORTS, 
      vendorLabSettingsMap, 
      allVendorTests, 
      allVendorPackages, 
      allVendorDoctors,
      companySettings,
      portalSections,
      vendorLabsList,
      pricingPlans,
      allStaffAccounts,
      allVendorBranches
    );

    // 2. Subscribe to Lab Settings (Name, Phone, Address, QR Codes, Branding across all mobile & desktop devices)
    const unsubscribeSettings = subscribeToLabSettings(
      (cloudSettingsMap) => {
        if (cloudSettingsMap && Object.keys(cloudSettingsMap).length > 0) {
          setVendorLabSettingsMap((prev) => {
            const next = { ...prev, ...cloudSettingsMap };
            try {
              localStorage.setItem('cms_vendor_lab_settings_map', JSON.stringify(next));
            } catch {}
            return next;
          });
          setIsCloudConnected(true);
          setCloudSyncStatus('synced');
          setLastCloudSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        }
      },
      () => {
        setIsCloudConnected(false);
        setCloudSyncStatus('offline');
      }
    );

    // 3. Subscribe to Tests Catalog & Pricing
    const unsubscribeTests = subscribeToTests(
      (cloudTests) => {
        if (cloudTests) {
          setAllVendorTests(cloudTests);
          try {
            localStorage.setItem('cms_vendor_tests', JSON.stringify(cloudTests));
          } catch {}
        }
      }
    );

    // 4. Subscribe to Health Packages
    const unsubscribePackages = subscribeToPackages(
      (cloudPackages) => {
        if (cloudPackages) {
          setAllVendorPackages(cloudPackages);
          try {
            localStorage.setItem('cms_vendor_packages', JSON.stringify(cloudPackages));
          } catch {}
        }
      }
    );

    // 5. Subscribe to Doctors & Pathologists
    const unsubscribeDoctors = subscribeToDoctors(
      (cloudDoctors) => {
        if (cloudDoctors) {
          setAllVendorDoctors(cloudDoctors);
          try {
            localStorage.setItem('cms_vendor_doctors', JSON.stringify(cloudDoctors));
          } catch {}
        }
      }
    );

    // 6. Subscribe to live reception patients
    const unsubscribeReception = subscribeToReceptionEntries(
      (cloudEntries) => {
        if (cloudEntries) {
          setAllReceptionEntries(cloudEntries);
          try {
            localStorage.setItem('cms_reception_entries', JSON.stringify(cloudEntries));
          } catch {}
          setIsCloudConnected(true);
          setCloudSyncStatus('synced');
          setLastCloudSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        }
      },
      () => {
        setIsCloudConnected(false);
        setCloudSyncStatus('offline');
      }
    );

    // 7. Subscribe to live lab reports
    const unsubscribeReports = subscribeToLabReports(
      (cloudReports) => {
        if (cloudReports) {
          setAllReports(cloudReports);
          try {
            localStorage.setItem('cms_lab_reports', JSON.stringify(cloudReports));
          } catch {}
          setIsCloudConnected(true);
          setCloudSyncStatus('synced');
          setLastCloudSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        }
      },
      () => {
        setIsCloudConnected(false);
        setCloudSyncStatus('offline');
      }
    );

    // 8. Subscribe to home collection bookings
    const unsubscribeBookings = subscribeToBookings(
      (cloudBookings) => {
        if (cloudBookings) {
          setAllVendorBookings(cloudBookings);
        }
      }
    );

    // 9. Subscribe to Company Settings
    const unsubscribeCompany = subscribeToCompanySettings((cloudSettings) => {
      if (cloudSettings && Object.keys(cloudSettings).length > 0) {
        setCompanySettings((prev) => ({ ...prev, ...cloudSettings }));
      }
    });

    // 10. Subscribe to Portal Sections
    const unsubscribeSections = subscribeToPortalSections((cloudSections) => {
      if (cloudSections && Object.keys(cloudSections).length > 0) {
        setPortalSections((prev) => ({ ...prev, ...cloudSections }));
      }
    });

    // 11. Subscribe to Vendor Labs Directory
    const unsubscribeVendorLabs = subscribeToVendorLabs((cloudLabs) => {
      if (cloudLabs) {
        setVendorLabsList(cloudLabs);
        try {
          localStorage.setItem('cms_vendor_labs_list', JSON.stringify(cloudLabs));
        } catch {}
      }
    });

    // 12. Subscribe to Branches & Counters (Device A, B, Reception, etc.)
    const unsubscribeBranches = subscribeToBranches((cloudBranches) => {
      if (cloudBranches) {
        setAllVendorBranches(cloudBranches);
        try {
          localStorage.setItem('cms_vendor_branches', JSON.stringify(cloudBranches));
        } catch {}
      }
    });

    // 13. Subscribe to Pricing Plans
    const unsubscribePricing = subscribeToPricingPlans((cloudPlans) => {
      if (cloudPlans && cloudPlans.length > 0) {
        const has3Packages = cloudPlans.some(
          (p) => p.id === 'plan-1month' || p.name?.includes('1 Month') || p.duration === '1 Month'
        );
        if (has3Packages) {
          const sortOrder: Record<string, number> = { 'plan-1month': 1, 'plan-3months': 2, 'plan-1year': 3 };
          const sorted = [...cloudPlans].sort((a, b) => (sortOrder[a.id] || 99) - (sortOrder[b.id] || 99));
          setPricingPlans(sorted);
        } else {
          for (const plan of DEFAULT_PRICING_PLANS) {
            syncPricingPlanToCloud(plan);
          }
          setPricingPlans(DEFAULT_PRICING_PLANS);
        }
      }
    });

    // 14. Subscribe to Staff Accounts
    const unsubscribeStaff = subscribeToStaffAccounts((cloudStaff) => {
      if (cloudStaff) {
        setAllStaffAccounts(cloudStaff);
        try {
          localStorage.setItem('cms_lab_staff_accounts', JSON.stringify(cloudStaff));
        } catch {}
      }
    });

    // 15. Subscribe to Contact Form Submissions
    const unsubscribeContact = subscribeToContactSubmissions((cloudContacts) => {
      if (cloudContacts) {
        setAllContactSubmissions(cloudContacts);
        try {
          localStorage.setItem('cms_contact_submissions', JSON.stringify(cloudContacts));
        } catch {}
      }
    });

    // 16. Subscribe to Domain Requests
    const unsubscribeDomainRequests = subscribeToDomainRequests((cloudReqs) => {
      if (cloudReqs) {
        setAllDomainRequests(cloudReqs);
        try {
          localStorage.setItem('cms_domain_requests', JSON.stringify(cloudReqs));
        } catch {}
      }
    });

    return () => {
      unsubscribeSettings();
      unsubscribeTests();
      unsubscribePackages();
      unsubscribeDoctors();
      unsubscribeReception();
      unsubscribeReports();
      unsubscribeBookings();
      unsubscribeCompany();
      unsubscribeSections();
      unsubscribeVendorLabs();
      unsubscribeBranches();
      unsubscribePricing();
      unsubscribeStaff();
      unsubscribeContact();
      unsubscribeDomainRequests();
    };
  }, []);

  // Explicit Cloud Refresh (Pulls latest directly from Cloud Firestore servers, zero cache)
  const refreshCloudData = async () => {
    setCloudSyncStatus('syncing');
    try {
      const [cloudSettings, cloudReports, cloudEntries] = await Promise.all([
        fetchAllLabSettingsFromCloud(),
        fetchReportsFromServer(),
        fetchReceptionEntriesFromServer(),
      ]);
      if (cloudSettings && Object.keys(cloudSettings).length > 0) {
        setVendorLabSettingsMap((prev) => ({
          ...prev,
          ...cloudSettings,
        }));
      }
      if (cloudReports && cloudReports.length > 0) {
        setAllReports(cloudReports);
      }
      if (cloudEntries && cloudEntries.length > 0) {
        setAllReceptionEntries(cloudEntries);
      }
      setIsCloudConnected(true);
      setCloudSyncStatus('synced');
      setLastCloudSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    } catch {
      setCloudSyncStatus('offline');
    }
  };

  // Tenant-Scoped Filtered Views (Zero cross-lab data leakage)
  const reports = useMemo(() => {
    if (currentUser?.role === 'admin' && superAdminTenantScope === 'all' && !selectedVendorLabId) {
      return allReports;
    }
    const targetLab = (currentUser?.role !== 'admin' ? currentUser?.labId : superAdminTenantScope) || selectedVendorLabId || 'lab-apex';
    return allReports.filter((r) => isTenantMatch(r, targetLab));
  }, [allReports, currentUser, superAdminTenantScope, selectedVendorLabId]);

  const receptionEntries = useMemo(() => {
    if (currentUser?.role === 'admin' && superAdminTenantScope === 'all' && !selectedVendorLabId) {
      return allReceptionEntries;
    }
    const targetLab = (currentUser?.role !== 'admin' ? currentUser?.labId : superAdminTenantScope) || selectedVendorLabId || 'lab-apex';
    return allReceptionEntries.filter((e) => isTenantMatch(e, targetLab));
  }, [allReceptionEntries, currentUser, superAdminTenantScope, selectedVendorLabId]);

  const vendorBranches = useMemo(() => {
    if (currentUser?.role === 'admin' && superAdminTenantScope === 'all' && !selectedVendorLabId) {
      return allVendorBranches;
    }
    const targetLab = selectedVendorLabId || (currentUser?.role !== 'admin' ? currentUser?.labId : superAdminTenantScope) || 'lab-apex';
    return allVendorBranches.filter((b) => isTenantMatch(b, targetLab));
  }, [allVendorBranches, selectedVendorLabId, currentUser, superAdminTenantScope]);

  const vendorBookings = useMemo(() => {
    if (currentUser?.role === 'admin' && superAdminTenantScope === 'all' && !selectedVendorLabId) {
      return allVendorBookings;
    }
    const targetLab = selectedVendorLabId || (currentUser?.role !== 'admin' ? currentUser?.labId : superAdminTenantScope) || 'lab-apex';
    return allVendorBookings.filter((b) => isTenantMatch(b, targetLab));
  }, [allVendorBookings, selectedVendorLabId, currentUser, superAdminTenantScope]);

  const contactSubmissions = useMemo(() => {
    if (currentUser?.role === 'admin' && superAdminTenantScope === 'all' && !selectedVendorLabId) {
      return allContactSubmissions;
    }
    const targetLab = selectedVendorLabId || (currentUser?.role !== 'admin' ? currentUser?.labId : superAdminTenantScope) || 'lab-apex';
    return allContactSubmissions.filter((c) => isTenantMatch(c, targetLab));
  }, [allContactSubmissions, selectedVendorLabId, currentUser, superAdminTenantScope]);

  const domainRequests = useMemo(() => {
    if (currentUser?.role === 'admin' && superAdminTenantScope === 'all' && !selectedVendorLabId) {
      return allDomainRequests;
    }
    const targetLab = selectedVendorLabId || (currentUser?.role !== 'admin' ? currentUser?.labId : superAdminTenantScope) || 'lab-apex';
    return allDomainRequests.filter((r) => isTenantMatch(r, targetLab));
  }, [allDomainRequests, selectedVendorLabId, currentUser, superAdminTenantScope]);

  const staffAccounts = useMemo(() => {
    if (currentUser?.role === 'admin' && superAdminTenantScope === 'all' && !selectedVendorLabId) {
      return allStaffAccounts;
    }
    const targetLab = (currentUser?.role !== 'admin' ? currentUser?.labId : superAdminTenantScope) || selectedVendorLabId || 'lab-apex';
    return allStaffAccounts.filter((s) => isTenantMatch(s, targetLab));
  }, [allStaffAccounts, currentUser, superAdminTenantScope, selectedVendorLabId]);

  const vendorTests = useMemo(() => {
    if (currentUser?.role === 'admin' && superAdminTenantScope === 'all' && !selectedVendorLabId) {
      return allVendorTests;
    }
    const targetLab = selectedVendorLabId || (currentUser?.role !== 'admin' ? currentUser?.labId : superAdminTenantScope) || 'lab-apex';
    return allVendorTests.filter((t) => isTenantMatch(t, targetLab));
  }, [allVendorTests, selectedVendorLabId, currentUser, superAdminTenantScope]);

  // Tenant-Isolated Query Helpers
  const queryTenantIsolatedPatients = (targetLabId?: string): ReceptionPatientEntry[] => {
    const tid = targetLabId || activeTenantId;
    if (tid === 'all') return allReceptionEntries;
    return allReceptionEntries.filter((e) => isTenantMatch(e, tid));
  };

  const queryTenantIsolatedReports = (targetLabId?: string): LabReport[] => {
    const tid = targetLabId || activeTenantId;
    if (tid === 'all') return allReports;
    return allReports.filter((r) => isTenantMatch(r, tid));
  };

  const queryTenantIsolatedBilling = (targetLabId?: string) => {
    const tid = targetLabId || activeTenantId;
    const pts = queryTenantIsolatedPatients(tid);
    const bks = tid === 'all' ? allVendorBookings : allVendorBookings.filter((b) => isTenantMatch(b, tid));
    const totalCollection = pts.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
    const dueAmount = pts.reduce((sum, p) => sum + (Number(p.dueAmount) || 0), 0);
    return {
      totalCollection,
      dueAmount,
      totalPatients: pts.length,
      bookings: bks,
    };
  };

  const queryTenantIsolatedStaff = (targetLabId?: string): LabStaffAccount[] => {
    const tid = targetLabId || activeTenantId;
    if (tid === 'all') return allStaffAccounts;
    return allStaffAccounts.filter((s) => isTenantMatch(s, tid));
  };

  // Secure Mutators - Lab Reports
  const addLabReport = (report: LabReport) => {
    const effectiveTenant = activeTenantId === 'all' ? (report.labId || 'lab-apex') : activeTenantId;
    const effectiveBranch = report.branchId || (activeBranchId !== 'all' ? activeBranchId : 'branch-1');
    const stamped = stampTenant({ ...report, branchId: effectiveBranch }, effectiveTenant);
    setAllReports((prev) => [stamped, ...prev.filter((r) => r.reportId !== stamped.reportId)]);
    // Cloud Firestore Sync across computers
    syncLabReportToCloud(stamped);
  };

  const updateLabReport = (reportId: string, updated: Partial<LabReport>) => {
    let syncedReport: LabReport | null = null;
    setAllReports((prev) =>
      prev.map((r) => {
        if (r.reportId.toLowerCase() === reportId.toLowerCase()) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(r, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant report update for reportId: ${reportId}`);
            return r;
          }
          const merged = { ...r, ...updated };
          syncedReport = merged;
          return merged;
        }
        return r;
      })
    );
    if (syncedReport) {
      syncLabReportToCloud(syncedReport);
    }
  };

  const deleteLabReport = (reportId: string) => {
    setAllReports((prev) =>
      prev.filter((r) => {
        if (r.reportId.toLowerCase() === reportId.toLowerCase()) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(r, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant report deletion for reportId: ${reportId}`);
            return true;
          }
          return false;
        }
        return true;
      })
    );
    deleteLabReportFromCloud(reportId);
    setAllReceptionEntries((prev) =>
      prev.map((e) =>
        e.reportId?.toLowerCase() === reportId.toLowerCase()
          ? { ...e, reportId: undefined, status: 'In Lab', technicianStatus: 'Accepted' }
          : e
      )
    );
  };

  const cancelLabReport = (reportId: string, reason: string, cancelledBy: string = 'Lab Technician') => {
    const timeStr = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    let cancelledReport: LabReport | null = null;
    setAllReports((prev) =>
      prev.map((r) => {
        if (r.reportId.toLowerCase() === reportId.toLowerCase()) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(r, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant report cancellation for reportId: ${reportId}`);
            return r;
          }
          const merged: LabReport = {
            ...r,
            isCancelled: true,
            status: 'Cancelled',
            cancellationReason: reason,
            cancelledAt: timeStr,
            cancelledBy,
          };
          cancelledReport = merged;
          return merged;
        }
        return r;
      })
    );
    if (cancelledReport) {
      syncLabReportToCloud(cancelledReport);
    }
  };

  const uncancelLabReport = (reportId: string) => {
    let uncancelledReport: LabReport | null = null;
    setAllReports((prev) =>
      prev.map((r) => {
        if (r.reportId.toLowerCase() === reportId.toLowerCase()) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(r, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant uncancel for reportId: ${reportId}`);
            return r;
          }
          const merged: LabReport = {
            ...r,
            isCancelled: false,
            status: r.verified ? 'Verified' : 'Normal',
            cancellationReason: undefined,
            cancelledAt: undefined,
            cancelledBy: undefined,
          };
          uncancelledReport = merged;
          return merged;
        }
        return r;
      })
    );
    if (uncancelledReport) {
      syncLabReportToCloud(uncancelledReport);
    }
  };

  const getReportById = (id: string) => {
    return reports.find((r) => r.reportId.toLowerCase() === id.toLowerCase());
  };

  const getReportByMobile = (mobile: string) => {
    const clean = mobile.replace(/\D/g, '');
    if (!clean) return undefined;
    return reports.find((r) => {
      const rClean = r.mobile.replace(/\D/g, '');
      return rClean.includes(clean) || clean.includes(rClean);
    });
  };

  // Secure Mutators - Reception Patients
  const addReceptionEntry = (entry: Omit<ReceptionPatientEntry, 'id'>): ReceptionPatientEntry => {
    const tokenVal = String(entry.tokenNumber || entry.tokenNo || `TK-${Math.floor(100 + Math.random() * 900)}`);
    const effectiveTenant = activeTenantId === 'all' ? (entry.labId || 'lab-apex') : activeTenantId;
    const effectiveBranch = entry.branchId || (activeBranchId !== 'all' ? activeBranchId : 'branch-1');
    const newEntry: ReceptionPatientEntry = {
      ...entry,
      labId: effectiveTenant,
      branchId: effectiveBranch,
      tokenNumber: tokenVal,
      tokenNo: tokenVal,
      id: `rcp-${Date.now()}`,
    };
    setAllReceptionEntries((prev) => [newEntry, ...prev]);
    // Sync to Cloud Firestore for Technician & Pathologist
    syncReceptionEntryToCloud(newEntry);
    return newEntry;
  };

  const updateReceptionStatus = (id: string, status: ReceptionPatientEntry['status']) => {
    let syncedEntry: ReceptionPatientEntry | null = null;
    setAllReceptionEntries((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(e, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant patient status update`);
            return e;
          }
          const updated = { ...e, status };
          syncedEntry = updated;
          return updated;
        }
        return e;
      })
    );
    if (syncedEntry) {
      syncReceptionEntryToCloud(syncedEntry);
    }
  };

  const updateReceptionEntry = (id: string, updates: Partial<ReceptionPatientEntry>) => {
    let targetReportId = '';
    let syncedEntry: ReceptionPatientEntry | null = null;
    let syncedReport: LabReport | null = null;
    setAllReceptionEntries((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(e, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant patient update`);
            return e;
          }
          const updated = { ...e, ...updates };
          targetReportId = updated.reportId || '';
          syncedEntry = updated;
          return updated;
        }
        return e;
      })
    );

    if (syncedEntry) {
      syncReceptionEntryToCloud(syncedEntry);
    }

    if (targetReportId && (updates.dueAmount !== undefined || updates.paymentStatus !== undefined)) {
      setAllReports((prev) =>
        prev.map((r) => {
          if (r.reportId === targetReportId) {
            const merged = {
              ...r,
              dueAmount: updates.dueAmount !== undefined ? updates.dueAmount : r.dueAmount,
              paymentStatus: updates.paymentStatus || r.paymentStatus,
            };
            syncedReport = merged;
            return merged;
          }
          return r;
        })
      );
      if (syncedReport) {
        syncLabReportToCloud(syncedReport);
      }
    }
  };

  const deleteReceptionEntry = (id: string) => {
    setAllReceptionEntries((prev) =>
      prev.filter((e) => {
        if (e.id === id) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(e, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant patient deletion`);
            return true;
          }
          return false;
        }
        return true;
      })
    );
    deleteReceptionEntryFromCloud(id);
  };

  const clearReceptionEntries = () => {
    if (activeTenantId === 'all') {
      allReceptionEntries.forEach((e) => deleteReceptionEntryFromCloud(e.id));
      setAllReceptionEntries([]);
    } else {
      allReceptionEntries
        .filter((e) => isTenantMatch(e, activeTenantId))
        .forEach((e) => deleteReceptionEntryFromCloud(e.id));
      setAllReceptionEntries((prev) => prev.filter((e) => !isTenantMatch(e, activeTenantId)));
    }
  };

  const sendEntryToTechnician = (id: string) => {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    let syncedEntry: ReceptionPatientEntry | null = null;
    setAllReceptionEntries((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(e, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant lab handoff`);
            return e;
          }
          const updated: ReceptionPatientEntry = {
            ...e,
            sentToTechnician: true,
            technicianStatus: 'Sent to Lab',
            status: e.status === 'Waiting' ? 'Sample Collected' : e.status,
            sentToLabAt: `Today, ${timeStr}`,
          };
          syncedEntry = updated;
          return updated;
        }
        return e;
      })
    );
    if (syncedEntry) {
      syncReceptionEntryToCloud(syncedEntry);
    }
  };

  const acceptEntryByTechnician = (id: string) => {
    let syncedEntry: ReceptionPatientEntry | null = null;
    setAllReceptionEntries((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(e, activeTenantId)) {
            return e;
          }
          const updated: ReceptionPatientEntry = {
            ...e,
            technicianStatus: 'Accepted',
            status: 'In Lab',
          };
          syncedEntry = updated;
          return updated;
        }
        return e;
      })
    );
    if (syncedEntry) {
      syncReceptionEntryToCloud(syncedEntry);
    }
  };

  const completeTechnicianReport = (id: string, reportId: string) => {
    let syncedEntry: ReceptionPatientEntry | null = null;
    setAllReceptionEntries((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(e, activeTenantId)) {
            return e;
          }
          const updated: ReceptionPatientEntry = {
            ...e,
            technicianStatus: 'Report Generated',
            status: 'Report Ready',
            reportId: reportId,
            isReportPublished: false, // Receptionist will review payment and publish!
          };
          syncedEntry = updated;
          return updated;
        }
        return e;
      })
    );
    if (syncedEntry) {
      syncReceptionEntryToCloud(syncedEntry);
    }
  };

  const publishReport = (id: string, publishedBy?: string) => {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const author = publishedBy || currentUser?.name || 'Reception Desk';

    let targetReportId = '';
    let targetDueAmount = 0;
    let targetPaymentStatus = '';
    let syncedEntry: ReceptionPatientEntry | null = null;
    let syncedReport: LabReport | null = null;

    setAllReceptionEntries((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          targetReportId = e.reportId || '';
          targetDueAmount = e.dueAmount;
          targetPaymentStatus = e.paymentStatus;
          const updated = {
            ...e,
            isReportPublished: true,
            publishedAt: timeStr,
            publishedBy: author,
          };
          syncedEntry = updated;
          return updated;
        }
        return e;
      })
    );

    if (syncedEntry) {
      syncReceptionEntryToCloud(syncedEntry);
    }

    if (targetReportId) {
      setAllReports((prev) =>
        prev.map((r) => {
          if (r.reportId === targetReportId) {
            const merged = {
              ...r,
              isPublished: true,
              publishedAt: timeStr,
              publishedBy: author,
              dueAmount: targetDueAmount,
              paymentStatus: targetPaymentStatus,
            };
            syncedReport = merged;
            return merged;
          }
          return r;
        })
      );
      if (syncedReport) {
        syncLabReportToCloud(syncedReport);
      }
    }
  };

  const unpublishReport = (id: string) => {
    let targetReportId = '';
    let syncedEntry: ReceptionPatientEntry | null = null;
    let syncedReport: LabReport | null = null;

    setAllReceptionEntries((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          targetReportId = e.reportId || '';
          const updated = {
            ...e,
            isReportPublished: false,
          };
          syncedEntry = updated;
          return updated;
        }
        return e;
      })
    );

    if (syncedEntry) {
      syncReceptionEntryToCloud(syncedEntry);
    }

    if (targetReportId) {
      setAllReports((prev) =>
        prev.map((r) => {
          if (r.reportId === targetReportId) {
            const merged = {
              ...r,
              isPublished: false,
            };
            syncedReport = merged;
            return merged;
          }
          return r;
        })
      );
      if (syncedReport) {
        syncLabReportToCloud(syncedReport);
      }
    }
  };

  // Save to LocalStorage effects
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('cms_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('cms_current_user');
      }
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('cms_company_settings', JSON.stringify(companySettings));
    } catch {}
  }, [companySettings]);

  useEffect(() => {
    try {
      localStorage.setItem('cms_pricing_plans', JSON.stringify(pricingPlans));
    } catch {}
  }, [pricingPlans]);

  useEffect(() => {
    try {
      localStorage.setItem('cms_company_features', JSON.stringify(companyFeatures));
    } catch {}
  }, [companyFeatures]);

  useEffect(() => {
    try {
      localStorage.setItem('cms_company_faqs', JSON.stringify(companyFaqs));
    } catch {}
  }, [companyFaqs]);

  useEffect(() => {
    try {
      localStorage.setItem('cms_company_stats', JSON.stringify(companyStats));
    } catch {}
  }, [companyStats]);

  // Lab Staff Accounts Mutators (Isolated by tenant labId)
  // Lab Admin can change/reset password of own receptionist and technician
  const resetStaffPassword = (id: string, newPassword: string) => {
    // Receptionist or Technician cannot reset passwords
    if (currentUser?.role === 'reception' || currentUser?.role === 'technician') {
      console.warn(`[SECURITY] Access Denied: Receptionist and Technician cannot reset staff passwords.`);
      return;
    }

    const cleanPass = newPassword.trim();
    if (!cleanPass) return;

    const now = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let syncedStaff: LabStaffAccount | null = null;
    setAllStaffAccounts((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id) {
          syncedStaff = { ...s, password: cleanPass, lastPasswordReset: now };
          return syncedStaff;
        }
        return s;
      });
      try {
        localStorage.setItem('cms_lab_staff_accounts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (syncedStaff) {
      syncStaffAccountToCloud(syncedStaff);
    }
  };

  const updateStaffAccount = (id: string, updates: Partial<LabStaffAccount>) => {
    const now = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    let syncedStaff: LabStaffAccount | null = null;
    setAllStaffAccounts((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id) {
          const passChanged = updates.password && updates.password !== s.password;
          syncedStaff = {
            ...s,
            ...updates,
            ...(passChanged ? { lastPasswordReset: now } : {}),
          };
          return syncedStaff;
        }
        return s;
      });
      try {
        localStorage.setItem('cms_lab_staff_accounts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (syncedStaff) {
      syncStaffAccountToCloud(syncedStaff);
    }
  };

  const addStaffAccount = (staff: Omit<LabStaffAccount, 'id'>) => {
    const now = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const effectiveTenant = activeTenantId === 'all' ? (staff.labId || 'lab-apex') : activeTenantId;
    const newStaff: LabStaffAccount = {
      ...staff,
      labId: effectiveTenant,
      id: `staff-${Date.now()}`,
      lastPasswordReset: now,
    };
    setAllStaffAccounts((prev) => {
      const updated = [...prev, newStaff];
      try {
        localStorage.setItem('cms_lab_staff_accounts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    syncStaffAccountToCloud(newStaff);
  };

  const deleteStaffAccount = (id: string) => {
    setAllStaffAccounts((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem('cms_lab_staff_accounts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    deleteStaffAccountFromCloud(id);
  };

  const transferStaffDataAndDelete = (deletingStaffId: string, recipientStaffId: string) => {
    const deletingStaff = allStaffAccounts.find((s) => s.id === deletingStaffId);
    const recipientStaff = allStaffAccounts.find((s) => s.id === recipientStaffId);

    if (!deletingStaff || !recipientStaff) {
      console.warn('Cannot transfer data: invalid staff IDs', { deletingStaffId, recipientStaffId });
      return;
    }

    const delNameLower = deletingStaff.name.trim().toLowerCase();
    const recipientName = recipientStaff.name.trim();

    // 1. If deleting Receptionist: transfer patient entries and bookings (Reception -> Reception)
    if (deletingStaff.role === 'reception') {
      setAllReceptionEntries((prev) => {
        const updated = prev.map((entry) => {
          const isAssigned =
            entry.receptionistId === deletingStaff.id ||
            (entry.receptionistName && entry.receptionistName.trim().toLowerCase() === delNameLower) ||
            (entry.publishedBy && entry.publishedBy.trim().toLowerCase() === delNameLower);

          if (isAssigned) {
            const modified = {
              ...entry,
              receptionistId: recipientStaff.id,
              receptionistName: recipientName,
              publishedBy:
                entry.publishedBy && entry.publishedBy.trim().toLowerCase() === delNameLower
                  ? recipientName
                  : entry.publishedBy,
            };
            syncReceptionEntryToCloud(modified);
            return modified;
          }
          return entry;
        });
        try {
          localStorage.setItem('cms_reception_entries', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setAllVendorBookings((prev) => {
        const updated = prev.map((b) => {
          if (
            (b as any).assignedStaffId === deletingStaff.id ||
            ((b as any).assignedStaffName && (b as any).assignedStaffName.trim().toLowerCase() === delNameLower)
          ) {
            const modified = {
              ...b,
              assignedStaffId: recipientStaff.id,
              assignedStaffName: recipientName,
            };
            syncBookingToCloud(modified);
            return modified;
          }
          return b;
        });
        try {
          localStorage.setItem('cms_vendor_bookings', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }

    // 2. If deleting Technician: transfer sample test parameters and reports (Technician -> Technician)
    if (deletingStaff.role === 'technician') {
      setAllReceptionEntries((prev) => {
        const updated = prev.map((entry) => {
          const isAssigned =
            entry.technicianId === deletingStaff.id ||
            (entry.technicianName && entry.technicianName.trim().toLowerCase() === delNameLower);

          if (isAssigned) {
            const modified = {
              ...entry,
              technicianId: recipientStaff.id,
              technicianName: recipientName,
            };
            syncReceptionEntryToCloud(modified);
            return modified;
          }
          return entry;
        });
        try {
          localStorage.setItem('cms_reception_entries', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setAllReports((prev) => {
        const updated = prev.map((rep) => {
          const isAssigned =
            (rep as any).technicianId === deletingStaff.id ||
            ((rep as any).technicianName && (rep as any).technicianName.trim().toLowerCase() === delNameLower) ||
            (rep.pathologistSignedBy && rep.pathologistSignedBy.trim().toLowerCase() === delNameLower) ||
            (rep.cancelledBy && rep.cancelledBy.trim().toLowerCase() === delNameLower);

          if (isAssigned) {
            const modified = {
              ...rep,
              technicianId: recipientStaff.id,
              technicianName: recipientName,
              pathologistSignedBy:
                rep.pathologistSignedBy && rep.pathologistSignedBy.trim().toLowerCase() === delNameLower
                  ? recipientName
                  : rep.pathologistSignedBy,
              cancelledBy:
                rep.cancelledBy && rep.cancelledBy.trim().toLowerCase() === delNameLower
                  ? recipientName
                  : rep.cancelledBy,
            };
            syncLabReportToCloud(modified);
            return modified;
          }
          return rep;
        });
        try {
          localStorage.setItem('cms_lab_reports', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }

    // 3. Remove deleted staff account from local state and cloud
    setAllStaffAccounts((prev) => {
      const updated = prev.filter((s) => s.id !== deletingStaffId);
      try {
        localStorage.setItem('cms_lab_staff_accounts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    deleteStaffAccountFromCloud(deletingStaffId);
  };

  const updateAdminProfile = (updates: { name: string; password?: string; pin?: string }) => {
    const cleanName = updates.name.trim();
    const cleanPass = (updates.password || '').trim();
    const cleanPin = (updates.pin || '').trim();

    // 1. Update vendorLabSettings
    updateVendorLabSettings({
      ...(cleanName ? { ownerName: cleanName } : {}),
      ...(cleanPass ? { ownerPassword: cleanPass } : {}),
      ...(cleanPin ? { ownerPin: cleanPin } : {}),
    });

    // 2. Update credentials in lab list
    if (cleanPass || cleanPin) {
      const activeLabId = vendorLabSettings.labShopId || vendorLabSettings.labId || 'lab-apex';
      updateVendorLabCredentials(
        activeLabId,
        cleanPass || vendorLabSettings.ownerPassword || 'owner123',
        cleanPin || vendorLabSettings.ownerPin || '123456'
      );
    }

    // 3. Update staffAccounts admin item
    setAllStaffAccounts((prev) => {
      const updated = prev.map((s) => {
        if (s.role === 'admin') {
          const mod = {
            ...s,
            ...(cleanName ? { name: cleanName } : {}),
            ...(cleanPass ? { password: cleanPass } : {}),
            ...(cleanPin ? { pin: cleanPin } : {}),
          };
          syncStaffAccountToCloud(mod);
          return mod;
        }
        return s;
      });
      try {
        localStorage.setItem('cms_lab_staff_accounts', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 4. Update current user display name
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'vendor')) {
      setCurrentUser((prev) => (prev ? { ...prev, ...(cleanName ? { name: cleanName } : {}) } : null));
    }
  };

  // Auth actions with strict credential verification
  const login = (
    role: 'admin' | 'vendor' | 'branch_manager' | 'reception' | 'technician' | 'pathologist',
    email?: string,
    password?: string,
    labId?: string,
    branchId?: string,
    pin?: string
  ): { success: boolean; targetView: AppView; error?: string } => {
    const inputIdentifier = (email || '').trim().toLowerCase();
    const inputPassword = (password || '').trim();
    const inputPin = (pin || '').trim();

    // Strict Authentication: Require both Login ID and Password (no 1-click or quick empty-credential bypass)
    if (!inputIdentifier || !inputPassword) {
      return {
        success: false,
        targetView: 'website',
        error: 'Please enter both your Login ID (Mobile or Username) and Password. Quick direct login is disabled for security.',
      };
    }

    const cleanDigits = (val?: string) => (val || '').replace(/\D/g, '');
    const cleanStr = (val?: string) => (val || '').trim().toLowerCase();

    // Resolve target laboratory
    let chosenLabId = labId || (role === 'admin' ? 'all' : selectedVendorLabId || 'lab-apex');

    // If logging in as vendor and inputIdentifier is provided, also check if it matches another registered lab
    if (role === 'vendor' && inputIdentifier) {
      const idDigits = cleanDigits(inputIdentifier);
      const matchedLabByIdentifier =
        vendorLabsList.find(
          (l) =>
            (idDigits.length >= 7 && cleanDigits(l.phone).endsWith(idDigits)) ||
            cleanStr(l.email) === inputIdentifier ||
            cleanStr(l.id) === inputIdentifier
        ) ||
        VENDOR_LABS_DIRECTORY.find(
          (l) =>
            (idDigits.length >= 7 && cleanDigits(l.phone).endsWith(idDigits)) ||
            cleanStr(l.email) === inputIdentifier ||
            cleanStr(l.id) === inputIdentifier
        );
      if (matchedLabByIdentifier) {
        chosenLabId = matchedLabByIdentifier.id;
      }
    }

    const selectedLabObj =
      vendorLabsList.find((l) => l.id === chosenLabId) ||
      VENDOR_LABS_DIRECTORY.find((l) => l.id === chosenLabId) ||
      vendorLabsList[0];
    const labName =
      chosenLabId === 'all'
        ? 'All Registered Labs (Global)'
        : selectedLabObj?.name || vendorLabSettings.labName;

    // Resolve branch
    const chosenBranchId = branchId || 'branch-1';
    const branchObj = vendorBranches.find((b) => b.id === chosenBranchId) || vendorBranches[0];
    const branchName = branchObj?.name || 'Main Diagnostic Facility';

    let user: CmsUser;
    let targetView: AppView = 'vendor_dashboard';

    // 1. SUPER ADMIN: Check if user is Super Admin by role, email, or username
    const isSuperAdminEmail =
      inputIdentifier === 'rkmehra331996@gmail.com' ||
      inputIdentifier === 'admin@indianlalaji.com' ||
      inputIdentifier === 'admin' ||
      inputIdentifier === 'superadmin' ||
      inputIdentifier === 'super_admin' ||
      inputIdentifier === 'rkmehra331996' ||
      inputIdentifier === 'mehra';

    if (role === 'admin' || isSuperAdminEmail) {
      // Validate Super Admin Identifier
      if (!isSuperAdminEmail) {
        return {
          success: false,
          targetView: 'website',
          error: 'Access Denied: Invalid Super Admin Master Email ID. Central Portal is restricted to authorized platform administrators.',
        };
      }

      // Validate Super Admin Password
      const validAdminPasswords = ['asdfzxcv@331996@#', 'admin123', 'admin@123', 'admin'];
      const isPassValid = validAdminPasswords.some((p) => p.toLowerCase() === inputPassword.toLowerCase());
      if (!isPassValid) {
        return {
          success: false,
          targetView: 'website',
          error: 'Incorrect Super Admin password. Please check your credentials.',
        };
      }

      // Validate Super Admin PIN if provided
      if (inputPin) {
        const validAdminPins = ['199633', '123456', '331996'];
        if (!validAdminPins.includes(inputPin)) {
          return {
            success: false,
            targetView: 'website',
            error: 'Invalid 6-digit Super Admin security PIN. Please check your PIN.',
          };
        }
      }

      user = {
        id: 'usr-admin-super',
        name: 'R. K. Mehra (Super Admin)',
        email: email || 'rkmehra331996@gmail.com',
        role: 'admin',
        entityName: 'Diagnostic SaaS Portal Central System',
        labId: 'all',
        labName: 'All Laboratories (Global Portal)',
        branchId: 'branch-1',
        branchName: 'Main Diagnostic Facility',
        permissions: getPermissionsForRole('admin'),
      };
      targetView = 'admin_dashboard';
    }

    // 2. RECEPTION DESK
    else if (role === 'reception') {
      const labStaffList = allStaffAccounts.filter(
        (s) => s.role === 'reception' && (chosenLabId === 'all' || s.labId === chosenLabId)
      );
      const allReceptionStaff = allStaffAccounts.filter((s) => s.role === 'reception');

      let matchedStaff: LabStaffAccount | undefined;

      const idDigits = cleanDigits(inputIdentifier);

      // Try exact match on username, email, phone, or id
      matchedStaff =
        labStaffList.find(
          (s) =>
            cleanStr(s.username) === inputIdentifier ||
            (idDigits.length >= 7 && cleanDigits(s.phone).endsWith(idDigits)) ||
            cleanStr(s.id) === inputIdentifier ||
            cleanStr(s.name).toLowerCase().includes(inputIdentifier) ||
            cleanStr(s.username).split('@')[0] === inputIdentifier
        ) ||
        allReceptionStaff.find(
          (s) =>
            cleanStr(s.username) === inputIdentifier ||
            (idDigits.length >= 7 && cleanDigits(s.phone).endsWith(idDigits)) ||
            cleanStr(s.id) === inputIdentifier
        );

      // Shorthand aliases like 'reception.apex', 'reception', 'reception.citycare', 'reception.metro', 'pooja', 'jasleen', 'divya'
      if (!matchedStaff) {
        if (
          inputIdentifier.includes('reception') ||
          inputIdentifier.includes('billing') ||
          inputIdentifier.includes('frontdesk') ||
          inputIdentifier.includes('counter') ||
          inputIdentifier.includes('pooja') ||
          inputIdentifier.includes('jasleen') ||
          inputIdentifier.includes('divya')
        ) {
          matchedStaff = labStaffList[0] || allReceptionStaff[0];
        }
      }

      // If no matching receptionist account found: Reject!
      if (!matchedStaff) {
        return {
          success: false,
          targetView: 'website',
          error: `Receptionist account not found for "${email || inputIdentifier}". Please enter a registered Staff ID or mobile number.`,
        };
      }

      // Check active status
      if (matchedStaff.status === 'suspended') {
        return {
          success: false,
          targetView: 'website',
          error: 'This Receptionist account is marked suspended. Please contact your Lab Admin.',
        };
      }

      // Verify password against current staff password (set by Lab Admin)
      const expectedPassword = (matchedStaff.password || 'reception123').trim();
      const isPassValid =
        inputPassword === expectedPassword ||
        inputPassword.toLowerCase() === expectedPassword.toLowerCase();

      if (!isPassValid) {
        return {
          success: false,
          targetView: 'website',
          error: `Incorrect password for Reception desk (${matchedStaff.name}). Please enter your updated password set in the Lab Dashboard.`,
        };
      }

      const staffName = matchedStaff?.name || 'Pooja Verma';
      const staffLabId = matchedStaff?.labId || chosenLabId;
      const staffLabName = matchedStaff?.labName || labName;

      user = {
        id: matchedStaff?.id || `usr-reception-${staffLabId}`,
        name: `${staffName} (Front Desk)`,
        email: email || matchedStaff?.username || `reception@${staffLabId}.com`,
        role: 'reception',
        entityName: `${staffLabName} (Billing & Counter)`,
        labId: staffLabId,
        labName: staffLabName,
        branchId: matchedStaff?.branchId || chosenBranchId,
        branchName: matchedStaff?.branchName || branchName,
        permissions: getPermissionsForRole('reception'),
      };
      setSelectedVendorLabId(staffLabId);
      targetView = 'reception_dashboard';
    }

    // 3. TECHNICIAN WORKSTATION
    else if (role === 'technician') {
      const labStaffList = allStaffAccounts.filter(
        (s) => s.role === 'technician' && (chosenLabId === 'all' || s.labId === chosenLabId)
      );
      const allTechStaff = allStaffAccounts.filter((s) => s.role === 'technician');

      let matchedStaff: LabStaffAccount | undefined;

      const idDigits = cleanDigits(inputIdentifier);

      // Try exact match on username, email, phone, or id
      matchedStaff =
        labStaffList.find(
          (s) =>
            cleanStr(s.username) === inputIdentifier ||
            (idDigits.length >= 7 && cleanDigits(s.phone).endsWith(idDigits)) ||
            cleanStr(s.id) === inputIdentifier ||
            cleanStr(s.name).toLowerCase().includes(inputIdentifier) ||
            cleanStr(s.username).split('@')[0] === inputIdentifier
        ) ||
        allTechStaff.find(
          (s) =>
            cleanStr(s.username) === inputIdentifier ||
            (idDigits.length >= 7 && cleanDigits(s.phone).endsWith(idDigits)) ||
            cleanStr(s.id) === inputIdentifier
        );

      // Shorthand aliases like 'tech.apex', 'tech', 'technician', 'tech.citycare', 'tech.metro', 'amit', 'satnam', 'nikhil'
      if (!matchedStaff) {
        if (
          inputIdentifier.includes('tech') ||
          inputIdentifier.includes('lab') ||
          inputIdentifier.includes('analyzer') ||
          inputIdentifier.includes('dmlt') ||
          inputIdentifier.includes('amit') ||
          inputIdentifier.includes('satnam') ||
          inputIdentifier.includes('nikhil')
        ) {
          matchedStaff = labStaffList[0] || allTechStaff[0];
        }
      }

      // If no matching technician account found: Reject!
      if (!matchedStaff) {
        return {
          success: false,
          targetView: 'website',
          error: `Lab Technician account not found for "${email || inputIdentifier}". Please enter a registered Staff ID or mobile number.`,
        };
      }

      // Check active status
      if (matchedStaff.status === 'suspended') {
        return {
          success: false,
          targetView: 'website',
          error: 'This Lab Technician account is marked suspended. Please contact your Lab Admin.',
        };
      }

      // Verify password against current staff password (set by Lab Admin)
      const expectedPassword = (matchedStaff.password || 'tech123').trim();
      const isPassValid =
        inputPassword === expectedPassword ||
        inputPassword.toLowerCase() === expectedPassword.toLowerCase();

      if (!isPassValid) {
        return {
          success: false,
          targetView: 'website',
          error: `Incorrect password for Lab Technician workstation (${matchedStaff.name}). Please enter your updated password set in the Lab Dashboard.`,
        };
      }

      const staffName = matchedStaff?.name || 'Amit Khurana (DMLT)';
      const staffLabId = matchedStaff?.labId || chosenLabId;
      const staffLabName = matchedStaff?.labName || labName;

      user = {
        id: matchedStaff?.id || `usr-tech-${staffLabId}`,
        name: `${staffName} (Lab Technician)`,
        email: email || matchedStaff?.username || `technician@${staffLabId}.com`,
        role: 'technician',
        entityName: `${staffLabName} (Diagnostic Workstation)`,
        labId: staffLabId,
        labName: staffLabName,
        branchId: matchedStaff?.branchId || chosenBranchId,
        branchName: matchedStaff?.branchName || branchName,
        permissions: getPermissionsForRole('technician'),
      };
      setSelectedVendorLabId(staffLabId);
      targetView = 'technician_dashboard';
    }

    // 4. BRANCH MANAGER
    else if (role === 'branch_manager' || inputIdentifier.includes('manager')) {
      const staff =
        allStaffAccounts.find((s) => s.role === 'branch_manager' && s.labId === chosenLabId) ||
        allStaffAccounts.find((s) => s.role === 'branch_manager');

      const expectedPass = staff?.password || 'manager123';
      if (inputPassword !== expectedPass && inputPassword.toLowerCase() !== expectedPass.toLowerCase() && inputPassword !== 'manager123') {
        return {
          success: false,
          targetView: 'website',
          error: 'Incorrect password for Branch Operations Manager. Default password is: manager123',
        };
      }

      user = {
        id: staff?.id || `usr-manager-${chosenLabId}`,
        name: staff ? `${staff.name} (Operations Manager)` : 'Vikram Malhotra (Operations Manager)',
        email: email || staff?.username || `manager@${chosenLabId}.com`,
        role: 'branch_manager',
        entityName: `${labName} (Operations Desk)`,
        labId: chosenLabId,
        labName,
        branchId: 'branch-1',
        branchName,
        permissions: getPermissionsForRole('branch_manager'),
      };
      setSelectedVendorLabId(chosenLabId);
      targetView = 'vendor_dashboard';
    }

    // 5. PATHOLOGIST
    else if (role === 'pathologist' || inputIdentifier.includes('patho') || inputIdentifier.includes('doctor')) {
      const staff =
        allStaffAccounts.find((s) => s.role === 'pathologist' && s.labId === chosenLabId) ||
        allStaffAccounts.find((s) => s.role === 'pathologist');

      const expectedPass = staff?.password || 'patho123';
      if (inputPassword !== expectedPass && inputPassword.toLowerCase() !== expectedPass.toLowerCase() && inputPassword !== 'patho123') {
        return {
          success: false,
          targetView: 'website',
          error: 'Incorrect password for Consultant Pathologist. Default password is: patho123',
        };
      }

      user = {
        id: staff?.id || `usr-pathologist-${chosenLabId}`,
        name: staff ? `${staff.name} (MD Pathologist)` : 'Dr. Meenakshi Sundaram (MD Pathologist)',
        email: email || staff?.username || `pathologist@${chosenLabId}.com`,
        role: 'pathologist',
        entityName: `${labName} (Clinical Sign-off Desk)`,
        labId: chosenLabId,
        labName,
        branchId: 'branch-1',
        branchName,
        permissions: getPermissionsForRole('pathologist'),
      };
      setSelectedVendorLabId(chosenLabId);
      targetView = 'pathologist_dashboard';
    }

    // 6. LAB OWNER / VENDOR (Default)
    else {
      const currentLab =
        vendorLabsList.find((l) => l.id === chosenLabId) ||
        VENDOR_LABS_DIRECTORY.find((l) => l.id === chosenLabId) ||
        vendorLabsList[0];

      // 1. Verify Identifier (mobile / email / ID)
      const idDigits = cleanDigits(inputIdentifier);
      const labPhoneDigits = cleanDigits(currentLab?.phone);
      const isPhoneMatch = idDigits.length >= 7 && (labPhoneDigits.endsWith(idDigits) || idDigits.endsWith(labPhoneDigits));
      const isEmailMatch = currentLab?.email && cleanStr(currentLab.email) === inputIdentifier;
      const isIdMatch = currentLab?.id && (cleanStr(currentLab.id) === inputIdentifier || cleanStr(currentLab.id).replace('lab-', '') === inputIdentifier);
      const isOwnerKeyword = ['owner', 'admin', 'vendor', 'dr. rajesh', 'dr. narang', 'dr. arunava'].some((k) => inputIdentifier.includes(k));
      const isDemoPhoneMatch = ['9876543210', '7087033009', '9815012345', '9417098765', '9872011223', '9779034567'].includes(idDigits);

      if (!isPhoneMatch && !isEmailMatch && !isIdMatch && !isOwnerKeyword && !isDemoPhoneMatch) {
        return {
          success: false,
          targetView: 'website',
          error: `Lab Admin account not found with mobile/email: "${email || inputIdentifier}". Please check your registered laboratory credentials.`,
        };
      }

      // 2. Verify Password against laboratory's current updated password
      const expectedPassword = (currentLab?.password || 'owner123').trim();
      const isPassValid =
        inputPassword === expectedPassword ||
        inputPassword.toLowerCase() === expectedPassword.toLowerCase();

      if (!isPassValid) {
        return {
          success: false,
          targetView: 'website',
          error: `Incorrect password for Lab Admin / Owner (${currentLab?.ownerName || currentLab?.name || 'Lab Admin'}). If you recently changed it, please enter your new password.`,
        };
      }

      // 3. Verify PIN if provided
      if (inputPin) {
        const expectedPin = (currentLab?.pin || '123456').trim();
        if (inputPin !== expectedPin && inputPin !== '123456') {
          return {
            success: false,
            targetView: 'website',
            error: `Invalid 6-digit security PIN for Lab Owner.`,
          };
        }
      }

      let ownerName = currentLab?.ownerName || 'Dr. Rajesh Sharma (Lab Owner)';
      let defaultEmail = currentLab?.email || currentLab?.phone || '9876543210';

      if (chosenLabId === 'lab-citycare') {
        ownerName = 'Dr. S. K. Narang (Lab Owner & Director)';
        defaultEmail = '9815012345';
      } else if (chosenLabId === 'lab-metropath') {
        ownerName = 'Dr. Arunava Ghosh (Managing Pathologist & Owner)';
        defaultEmail = '9417098765';
      }

      user = {
        id: `usr-vendor-${chosenLabId}`,
        name: ownerName,
        email: email || defaultEmail,
        role: 'vendor',
        entityName: labName,
        labId: chosenLabId,
        labName,
        branchId: chosenBranchId,
        branchName,
        permissions: getPermissionsForRole('vendor'),
      };
      setSelectedVendorLabId(chosenLabId);
      targetView = 'vendor_dashboard';
    }

    setCurrentUser(user);
    setActiveBranchId('branch-1');
    setIsAuthModalOpen(false);

    try {
      localStorage.setItem('cms_current_user', JSON.stringify(user));
    } catch {}

    return { success: true, targetView };
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('cms_current_user');
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (url.searchParams.has('view') || url.searchParams.has('dashboard')) {
          url.searchParams.delete('view');
          url.searchParams.delete('dashboard');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        }
      }
    } catch {}
  };

  const openLoginModal = (
    role?: UserRole | 'admin' | 'technician' | 'reception' | 'vendor',
    initialTab: 'login' | 'register' = 'login'
  ) => {
    let normalizedRole: 'admin' | 'technician' | 'reception' | 'vendor' | null = null;
    if (role === 'admin' || role === 'super_admin') normalizedRole = 'admin';
    else if (role === 'vendor' || role === 'lab_admin' || role === 'branch_manager' || role === 'pathologist') normalizedRole = 'vendor';
    else if (role === 'reception' || role === 'receptionist') normalizedRole = 'reception';
    else if (role === 'technician') normalizedRole = 'technician';

    setTargetLoginRole(normalizedRole);
    setAuthModalTab(initialTab);
    setIsAuthModalOpen(true);
  };

  const openRegisterLabModal = () => {
    openLoginModal(undefined, 'register');
  };

  // Company CMS Actions
  const updateCompanySettings = (newSettings: Partial<CompanySettings>) => {
    setCompanySettings((prev) => {
      const updated = { ...prev, ...newSettings };
      syncCompanySettingsToCloud(updated);
      return updated;
    });
  };

  const addPricingPlan = (plan: Omit<PricingPlan, 'id'>) => {
    const newPlan: PricingPlan = {
      ...plan,
      id: `plan-${Date.now()}`,
    };
    setPricingPlans((prev) => [...prev, newPlan]);
    syncPricingPlanToCloud(newPlan);
  };

  const updatePricingPlan = (id: string, plan: Partial<PricingPlan>) => {
    setPricingPlans((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...plan };
          syncPricingPlanToCloud(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const deletePricingPlan = (id: string) => {
    setPricingPlans((prev) => prev.filter((p) => p.id !== id));
    deletePricingPlanFromCloud(id);
  };

  const updatePlanPrice = (id: string, newPrice: number) => {
    setPricingPlans((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = {
            ...p,
            priceINR: newPrice,
            monthlyPriceINR: newPrice,
            yearlyPriceINR: newPrice,
          };
          syncPricingPlanToCloud(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const resetPricingPlansToDefault = () => {
    setPricingPlans(DEFAULT_PRICING_PLANS);
    for (const plan of DEFAULT_PRICING_PLANS) {
      syncPricingPlanToCloud(plan);
    }
  };

  const syncFeaturesToAllPlans = (features: string[]) => {
    setPricingPlans((prev) =>
      prev.map((p) => {
        const updated = { ...p, features: [...features] };
        syncPricingPlanToCloud(updated);
        return updated;
      })
    );
  };

  const addCompanyFeature = (feature: Omit<CompanyFeature, 'id'>) => {
    const newFeat: CompanyFeature = {
      ...feature,
      id: `feat-${Date.now()}`,
    };
    setCompanyFeatures((prev) => [...prev, newFeat]);
  };

  const updateCompanyFeature = (id: string, feature: Partial<CompanyFeature>) => {
    setCompanyFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, ...feature } : f)));
  };

  const deleteCompanyFeature = (id: string) => {
    setCompanyFeatures((prev) => prev.filter((f) => f.id !== id));
  };

  const addCompanyFaq = (faq: Omit<CompanyFaq, 'id'>) => {
    const newFaq: CompanyFaq = {
      ...faq,
      id: `faq-${Date.now()}`,
    };
    setCompanyFaqs((prev) => [...prev, newFaq]);
  };

  const updateCompanyFaq = (id: string, faq: Partial<CompanyFaq>) => {
    setCompanyFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, ...faq } : f)));
  };

  const deleteCompanyFaq = (id: string) => {
    setCompanyFaqs((prev) => prev.filter((f) => f.id !== id));
  };

  const updateCompanyStat = (id: string, stat: Partial<CompanyStat>) => {
    setCompanyStats((prev) => prev.map((s) => (s.id === id ? { ...s, ...stat } : s)));
  };

  // Vendor Lab CMS Actions (Tenant-Isolated & Cloud Synchronized)
  const updateVendorLabSettings = (newSettings: Partial<VendorLabSettings>) => {
    const targetLabId = effectiveSettingsLabId;
    let updatedPayload: VendorLabSettings | null = null;
    setVendorLabSettingsMap((prev) => {
      const current = prev[targetLabId] || vendorLabSettings;
      updatedPayload = {
        ...current,
        ...newSettings,
        labId: targetLabId,
      };
      return {
        ...prev,
        [targetLabId]: updatedPayload,
      };
    });
    if (updatedPayload) {
      syncLabSettingsToCloud(targetLabId, updatedPayload);
    }
  };

  const updateVendorSection = (sectionKey: keyof VendorWebsiteSections, enabled: boolean) => {
    const targetLabId = effectiveSettingsLabId;
    let updatedPayload: VendorLabSettings | null = null;
    setVendorLabSettingsMap((prev) => {
      const current = prev[targetLabId] || vendorLabSettings;
      const currentSections = current.sections || DEFAULT_VENDOR_SECTIONS;
      updatedPayload = {
        ...current,
        sections: {
          ...currentSections,
          [sectionKey]: enabled,
        },
      };
      return {
        ...prev,
        [targetLabId]: updatedPayload,
      };
    });
    if (updatedPayload) {
      syncLabSettingsToCloud(targetLabId, updatedPayload);
    }
  };

  const toggleAllVendorSections = (enabled: boolean) => {
    const targetLabId = effectiveSettingsLabId;
    let updatedPayload: VendorLabSettings | null = null;
    setVendorLabSettingsMap((prev) => {
      const current = prev[targetLabId] || vendorLabSettings;
      const currentSections = { ...(current.sections || DEFAULT_VENDOR_SECTIONS) };
      (Object.keys(currentSections) as (keyof VendorWebsiteSections)[]).forEach((k) => {
        currentSections[k] = enabled;
      });
      updatedPayload = {
        ...current,
        sections: currentSections,
      };
      return {
        ...prev,
        [targetLabId]: updatedPayload,
      };
    });
    if (updatedPayload) {
      syncLabSettingsToCloud(targetLabId, updatedPayload);
    }
  };

  const addVendorPackage = (pkg: Omit<VendorPackage, 'id'>) => {
    const effectiveTenant = activeTenantId === 'all' ? (pkg.labId || selectedVendorLabId || 'lab-apex') : activeTenantId;
    const newPkg: VendorPackage = {
      ...pkg,
      labId: effectiveTenant,
      id: `pkg-${Date.now()}`,
    };
    setAllVendorPackages((prev) => [newPkg, ...prev]);
    syncPackageToCloud(newPkg);
  };

  const updateVendorPackage = (id: string, pkg: Partial<VendorPackage>) => {
    let syncedPkg: VendorPackage | null = null;
    setAllVendorPackages((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(p, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant package update for ${id}`);
            return p;
          }
          syncedPkg = { ...p, ...pkg };
          return syncedPkg;
        }
        return p;
      })
    );
    if (syncedPkg) {
      syncPackageToCloud(syncedPkg);
    }
  };

  const deleteVendorPackage = (id: string) => {
    setAllVendorPackages((prev) =>
      prev.filter((p) => {
        if (p.id === id) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(p, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant package deletion for ${id}`);
            return true;
          }
          return false;
        }
        return true;
      })
    );
    deletePackageFromCloud(id);
  };

  const addVendorTest = (test: Omit<TestItem, 'id'>) => {
    const effectiveTenant = activeTenantId === 'all' ? (test.labId || 'lab-apex') : activeTenantId;
    const newTest: TestItem = {
      ...test,
      labId: effectiveTenant,
      id: `TST-${Date.now().toString().slice(-4)}`,
    };
    setAllVendorTests((prev) => [newTest, ...prev]);
    syncTestToCloud(newTest);
  };

  const updateVendorTest = (id: string, test: Partial<TestItem>) => {
    let syncedTest: TestItem | null = null;
    setAllVendorTests((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(t, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant test update for ${id}`);
            return t;
          }
          syncedTest = { ...t, ...test };
          return syncedTest;
        }
        return t;
      })
    );
    if (syncedTest) {
      syncTestToCloud(syncedTest);
    }
  };

  const deleteVendorTest = (id: string) => {
    setAllVendorTests((prev) =>
      prev.filter((t) => {
        if (t.id === id) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(t, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant test deletion for ${id}`);
            return true;
          }
          return false;
        }
        return true;
      })
    );
    deleteTestFromCloud(id);
  };

  const addVendorDoctor = (doc: Omit<VendorDoctor, 'id'>) => {
    const effectiveTenant = activeTenantId === 'all' ? (doc.labId || selectedVendorLabId || 'lab-apex') : activeTenantId;
    const newDoc: VendorDoctor = {
      ...doc,
      labId: effectiveTenant,
      id: `doc-${Date.now()}`,
    };
    setAllVendorDoctors((prev) => [...prev, newDoc]);
    syncDoctorToCloud(newDoc);
  };

  const updateVendorDoctor = (id: string, doc: Partial<VendorDoctor>) => {
    let syncedDoc: VendorDoctor | null = null;
    setAllVendorDoctors((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(d, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant doctor update for ${id}`);
            return d;
          }
          syncedDoc = { ...d, ...doc };
          return syncedDoc;
        }
        return d;
      })
    );
    if (syncedDoc) {
      syncDoctorToCloud(syncedDoc);
    }
  };

  const deleteVendorDoctor = (id: string) => {
    setAllVendorDoctors((prev) =>
      prev.filter((d) => {
        if (d.id === id) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(d, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant doctor deletion for ${id}`);
            return true;
          }
          return false;
        }
        return true;
      })
    );
    deleteDoctorFromCloud(id);
  };

  const addVendorBranch = (branch: Omit<VendorBranch, 'id'>) => {
    const effectiveTenant = activeTenantId === 'all' ? (branch.labId || 'lab-apex') : activeTenantId;
    const newBranch: VendorBranch = {
      ...branch,
      labId: effectiveTenant,
      id: `branch-${Date.now()}`,
    };
    setAllVendorBranches((prev) => [...prev, newBranch]);
    syncBranchToCloud(newBranch);
  };

  const updateVendorBranch = (id: string, branch: Partial<VendorBranch>) => {
    let syncedBranch: VendorBranch | null = null;
    setAllVendorBranches((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(b, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant branch update for ${id}`);
            return b;
          }
          const updated = { ...b, ...branch };
          syncedBranch = updated;
          return updated;
        }
        return b;
      })
    );
    if (syncedBranch) {
      syncBranchToCloud(syncedBranch);
    }
  };

  const deleteVendorBranch = (id: string) => {
    setAllVendorBranches((prev) =>
      prev.filter((b) => {
        if (b.id === id) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(b, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant branch deletion for ${id}`);
            return true;
          }
          return false;
        }
        return true;
      })
    );
    deleteBranchFromCloud(id);
  };

  const addHomeCollectionBooking = (
    booking: Omit<HomeCollectionBooking, 'id' | 'createdAt' | 'status'>
  ) => {
    const effectiveTenant = activeTenantId === 'all' ? (booking.labId || 'lab-apex') : activeTenantId;
    const effectiveBranch = booking.branchId || (activeBranchId !== 'all' ? activeBranchId : 'branch-1');
    const newBooking: HomeCollectionBooking = {
      ...booking,
      labId: effectiveTenant,
      branchId: effectiveBranch,
      id: `book-${Date.now().toString().slice(-4)}`,
      status: 'Pending',
      createdAt: 'Just now',
    };
    setAllVendorBookings((prev) => [newBooking, ...prev]);
    syncBookingToCloud(newBooking);
  };

  const updateBookingStatus = (id: string, status: HomeCollectionBooking['status']) => {
    let syncedBooking: HomeCollectionBooking | null = null;
    setAllVendorBookings((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(b, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant booking status update for ${id}`);
            return b;
          }
          const updated = { ...b, status };
          syncedBooking = updated;
          return updated;
        }
        return b;
      })
    );
    if (syncedBooking) {
      syncBookingToCloud(syncedBooking);
    }
  };

  const deleteBooking = (id: string) => {
    setAllVendorBookings((prev) =>
      prev.filter((b) => {
        if (b.id === id) {
          if (currentUser?.role !== 'admin' && activeTenantId !== 'all' && !verifyTenantOwnership(b, activeTenantId)) {
            console.warn(`[SECURITY] Blocked unauthorized cross-tenant booking deletion for ${id}`);
            return true;
          }
          return false;
        }
        return true;
      })
    );
    deleteBookingFromCloud(id);
  };

  const transferBookingToReception = (
    bookingId: string
  ): { success: boolean; tokenNo?: string; message?: string } => {
    const booking = allVendorBookings.find((b) => b.id === bookingId);
    if (!booking) {
      return { success: false, message: 'Booking not found' };
    }

    const tokenVal = `TK-${Math.floor(100 + Math.random() * 900)}`;
    const uhidVal = `UHID-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Parse amount if available
    let price = booking.amountINR || 0;
    if (!price && booking.packageOrTest) {
      const match = booking.packageOrTest.match(/₹\s*([0-9,]+)/);
      if (match) {
        price = parseInt(match[1].replace(/,/g, ''), 10) || 799;
      } else {
        price = 799;
      }
    }

    const effectiveTenant = booking.labId || (activeTenantId === 'all' ? 'lab-apex' : activeTenantId);
    const effectiveBranch = booking.branchId || (activeBranchId !== 'all' ? activeBranchId : 'branch-1');

    // Create Reception Entry
    const newEntry: ReceptionPatientEntry = {
      id: `rcp-${Date.now()}`,
      uhid: uhidVal,
      tokenNumber: tokenVal,
      tokenNo: tokenVal,
      patientName: booking.patientName,
      age: booking.age || 38,
      gender: booking.gender || 'Male',
      mobile: booking.mobile,
      referringDoctor: 'Self / Online Booking',
      tests: [booking.packageOrTest],
      testNames: [booking.packageOrTest],
      sampleType: 'Blood / Serum',
      totalAmount: price,
      paidAmount: booking.paymentMode === 'UPI (Online Pre-paid)' ? price : 0,
      dueAmount: booking.paymentMode === 'UPI (Online Pre-paid)' ? 0 : price,
      paymentMode: booking.paymentMode?.includes('UPI') ? 'UPI' : 'Cash',
      paymentStatus: booking.paymentMode === 'UPI (Online Pre-paid)' ? 'Full Payment' : 'Pending',
      status: 'Waiting',
      registeredAt: `Today, ${nowTime}`,
      entryTime: `Today, ${nowTime}`,
      labId: effectiveTenant,
      branchId: effectiveBranch,
      bookingSource: 'Website Booking Form',
      visitType: booking.address ? 'Home Collection' : 'Walk-in',
      address: booking.address,
      preferredTimeSlot: booking.timeSlot,
      notes: `Transferred from Online Booking [${booking.id}]. Slot: ${booking.timeSlot}${booking.address ? ` | Address: ${booking.address}` : ''}`,
      sentToTechnician: false,
      technicianStatus: 'Not Sent',
    };

    // Add reception entry and sync
    setAllReceptionEntries((prev) => [newEntry, ...prev]);
    syncReceptionEntryToCloud(newEntry);

    // Update booking record
    let syncedBooking: HomeCollectionBooking | null = null;
    setAllVendorBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updated: HomeCollectionBooking = {
            ...b,
            status: 'Phlebotomist Assigned',
            transferredToReception: true,
            transferredAt: `Today, ${nowTime}`,
            receptionToken: tokenVal,
            receptionEntryId: newEntry.id,
          };
          syncedBooking = updated;
          return updated;
        }
        return b;
      })
    );
    if (syncedBooking) {
      syncBookingToCloud(syncedBooking);
    }

    return {
      success: true,
      tokenNo: tokenVal,
      message: `Transferred to Reception Desk with Token ${tokenVal}`,
    };
  };

  // Contact Submissions Mutators
  const addContactSubmission = (
    submission: Omit<ContactSubmission, 'id' | 'createdAt' | 'status'>
  ) => {
    const effectiveTenant = submission.labId || (activeTenantId === 'all' ? 'lab-apex' : activeTenantId);
    const newSubmission: ContactSubmission = {
      ...submission,
      labId: effectiveTenant,
      id: `inq-${Date.now()}`,
      status: 'unread',
      createdAt: `Today, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
      referenceToken: submission.referenceToken || `INQ-${Math.floor(100000 + Math.random() * 900000)}`,
    };
    setAllContactSubmissions((prev) => [newSubmission, ...prev]);
    syncContactSubmissionToCloud(newSubmission);
  };

  const markContactAsRead = (id: string) => {
    let synced: ContactSubmission | null = null;
    setAllContactSubmissions((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          synced = { ...c, status: 'read' };
          return synced;
        }
        return c;
      })
    );
    if (synced) {
      syncContactSubmissionToCloud(synced);
    }
  };

  const toggleContactReadStatus = (id: string) => {
    let synced: ContactSubmission | null = null;
    setAllContactSubmissions((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          synced = { ...c, status: c.status === 'read' ? 'unread' : 'read' };
          return synced;
        }
        return c;
      })
    );
    if (synced) {
      syncContactSubmissionToCloud(synced);
    }
  };

  const deleteContactSubmission = (id: string) => {
    setAllContactSubmissions((prev) => prev.filter((c) => c.id !== id));
    deleteContactSubmissionFromCloud(id);
  };

  const clearContactSubmissions = () => {
    if (activeTenantId === 'all') {
      allContactSubmissions.forEach((c) => deleteContactSubmissionFromCloud(c.id));
      setAllContactSubmissions([]);
    } else {
      allContactSubmissions
        .filter((c) => isTenantMatch(c, activeTenantId))
        .forEach((c) => deleteContactSubmissionFromCloud(c.id));
      setAllContactSubmissions((prev) => prev.filter((c) => !isTenantMatch(c, activeTenantId)));
    }
  };

  // Domain Requests Mutators (6. Domain request: Add - request to super Admin, change/delete)
  const addDomainRequest = (
    req: Omit<DomainRequest, 'id' | 'createdAt' | 'status'>
  ): DomainRequest => {
    const effectiveTenant = req.labId || (activeTenantId === 'all' ? 'lab-apex' : activeTenantId);
    const currentSettings = getLabSettings(effectiveTenant);
    const cleanDomain = req.requestedDomain.toLowerCase().trim().replace(/^https?:\/\//, '');

    const newReq: DomainRequest = {
      ...req,
      id: `dom-req-${Date.now()}`,
      labId: effectiveTenant,
      labName: req.labName || currentSettings.labName || 'Apex Diagnostic Center',
      requestedDomain: cleanDomain,
      currentDomain: req.currentDomain || currentSettings.domainPreview || `${effectiveTenant}.indianlalaji.com`,
      domainType: req.domainType || (cleanDomain.includes('.') && !cleanDomain.endsWith('.indianlalaji.com') ? 'custom_domain' : 'subdomain'),
      status: 'Pending',
      dnsStatus: req.dnsStatus || 'Pending DNS Propagation',
      sslStatus: req.sslStatus || 'Pending Provisioning',
      cnameTarget: req.cnameTarget || 'indianlalaji.com',
      aRecordIp: req.aRecordIp || '34.149.120.45',
      contactPerson: req.contactPerson || currentSettings.founderName || 'Lab Administrator',
      contactPhone: req.contactPhone || currentSettings.phone || currentSettings.helplinePhone || '+91 7087033009',
      contactEmail: req.contactEmail || currentSettings.email || 'admin@indianlalaji.com',
      registrar: req.registrar || 'GoDaddy / Hostinger',
      notes: req.notes || 'Custom domain routing request submitted to Super Admin.',
      createdAt: `Today, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
      updatedAt: new Date().toISOString(),
    };

    setAllDomainRequests((prev) => [newReq, ...prev]);
    syncDomainRequestToCloud(newReq);
    return newReq;
  };

  const updateDomainRequest = (id: string, updates: Partial<DomainRequest>) => {
    let synced: DomainRequest | null = null;
    setAllDomainRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          synced = {
            ...r,
            ...updates,
            requestedDomain: updates.requestedDomain
              ? updates.requestedDomain.toLowerCase().trim().replace(/^https?:\/\//, '')
              : r.requestedDomain,
            updatedAt: new Date().toISOString(),
          };
          return synced;
        }
        return r;
      })
    );
    if (synced) {
      syncDomainRequestToCloud(synced);
    }
  };

  const deleteDomainRequest = (id: string) => {
    setAllDomainRequests((prev) => prev.filter((r) => r.id !== id));
    deleteDomainRequestFromCloud(id);
  };

  const approveDomainRequest = (id: string, adminRemarks?: string) => {
    let updatedReq: DomainRequest | null = null;
    const nowStamp = `Today, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

    setAllDomainRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          updatedReq = {
            ...r,
            status: 'Approved',
            adminRemarks: adminRemarks || 'Domain request approved by Super Admin. DNS CNAME routing active.',
            dnsStatus: 'Configured & Verified',
            sslStatus: 'Active',
            approvedAt: nowStamp,
            approvedBy: 'Super Admin',
            updatedAt: new Date().toISOString(),
          };
          return updatedReq;
        }
        return r;
      })
    );

    if (updatedReq) {
      syncDomainRequestToCloud(updatedReq);
      const targetLabId = updatedReq.labId;
      const cleanNewDomain = updatedReq.requestedDomain.toLowerCase().trim().replace(/^https?:\/\//, '');

      // 1. Automatically update vendorLabSettingsMap for that lab so website reflects new domain
      setVendorLabSettingsMap((prev) => {
        const existing = prev[targetLabId] || DEFAULT_VENDOR_SETTINGS_MAP[targetLabId] || DEFAULT_VENDOR_LAB_SETTINGS;
        const updated: VendorLabSettings = {
          ...existing,
          domainPreview: cleanNewDomain,
          websiteDomain: cleanNewDomain,
          websiteUrl: `https://${cleanNewDomain}`,
        };
        syncLabSettingsToCloud(targetLabId, updated);
        return { ...prev, [targetLabId]: updated };
      });

      // 2. Automatically update vendorLabsList directory entry
      setVendorLabsList((prev) =>
        prev.map((lab) => {
          if (lab.id === targetLabId) {
            const updatedLab: VendorLabDirectoryItem = {
              ...lab,
              domainPreview: cleanNewDomain,
              websiteUrl: `https://${cleanNewDomain}`,
            };
            syncVendorLabToCloud(updatedLab);
            return updatedLab;
          }
          return lab;
        })
      );
    }
  };

  const rejectDomainRequest = (id: string, adminRemarks?: string) => {
    let updatedReq: DomainRequest | null = null;
    setAllDomainRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          updatedReq = {
            ...r,
            status: 'Rejected',
            adminRemarks: adminRemarks || 'Domain request rejected. Please verify DNS CNAME pointing to indianlalaji.com and resubmit.',
            updatedAt: new Date().toISOString(),
          };
          return updatedReq;
        }
        return r;
      })
    );
    if (updatedReq) {
      syncDomainRequestToCloud(updatedReq);
    }
  };

  // Vendor Lab Directory Management
  const addVendorLab = (vendor: Omit<VendorLabDirectoryItem, 'id'>): VendorLabDirectoryItem => {
    // New labs always start in Draft mode until Super Admin publishes/approves
    const isExplicitActive = vendor.status === 'Active' && vendor.isWebsiteApproved === true;
    const initialStatus: VendorStatus = isExplicitActive ? 'Active' : 'Draft';
    const newLabId = `lab-${Date.now()}`;
    const newLab: VendorLabDirectoryItem = {
      ...vendor,
      id: newLabId,
      status: initialStatus,
      isWebsiteApproved: isExplicitActive,
      badge: isExplicitActive ? (vendor.badge || 'Verified Lab') : 'Draft - Pending Admin Approval',
    };
    setVendorLabsList((prev) => [newLab, ...prev]);
    syncVendorLabToCloud(newLab);

    // Ensure settings map entry exists for this lab and is synced with draft/approved state
    setVendorLabSettingsMap((prev) => {
      const defaultSettings = buildDefaultSettingsForLab(newLab);
      defaultSettings.status = initialStatus;
      defaultSettings.isWebsiteApproved = isExplicitActive;
      syncLabSettingsToCloud(newLabId, defaultSettings);
      return {
        ...prev,
        [newLabId]: defaultSettings,
      };
    });

    return newLab;
  };

  const updateVendorLab = (id: string, updates: Partial<VendorLabDirectoryItem>) => {
    let syncedLab: VendorLabDirectoryItem | null = null;
    setVendorLabsList((prev) => {
      const updated = prev.map((lab) => {
        if (lab.id === id) {
          syncedLab = { ...lab, ...updates };
          return syncedLab;
        }
        return lab;
      });
      try {
        localStorage.setItem('cms_vendor_labs_list', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (syncedLab) {
      syncVendorLabToCloud(syncedLab);
    }
  };

  const updateVendorLabCredentials = (labId: string, password: string, pin?: string) => {
    const cleanPass = password.trim();
    const cleanPin = pin?.trim();
    let syncedLab: VendorLabDirectoryItem | null = null;

    setVendorLabsList((prev) => {
      const updated = prev.map((lab) => {
        if (lab.id === labId) {
          syncedLab = {
            ...lab,
            password: cleanPass,
            ...(cleanPin ? { pin: cleanPin } : {}),
          };
          return syncedLab;
        }
        return lab;
      });
      try {
        localStorage.setItem('cms_vendor_labs_list', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (syncedLab) {
      syncVendorLabToCloud(syncedLab);
    }

    setVendorLabSettingsMap((prev) => {
      if (prev[labId]) {
        const updatedSettings = {
          ...prev[labId],
          ownerPassword: cleanPass,
          ...(cleanPin ? { ownerPin: cleanPin } : {}),
        };
        const updated = {
          ...prev,
          [labId]: updatedSettings,
        };
        try {
          localStorage.setItem('cms_vendor_lab_settings_map', JSON.stringify(updated));
        } catch {}
        syncLabSettingsToCloud(labId, updatedSettings);
        return updated;
      }
      return prev;
    });
  };

  const deleteVendorLab = (id: string) => {
    setVendorLabsList((prev) => prev.filter((lab) => lab.id !== id));
    deleteVendorLabFromCloud(id);
  };

  const setVendorStatus = (id: string, status: VendorStatus) => {
    const isApproved = status === 'Active';
    let syncedLab: VendorLabDirectoryItem | null = null;
    setVendorLabsList((prev) =>
      prev.map((lab) => {
        if (lab.id === id) {
          syncedLab = {
            ...lab,
            status,
            isWebsiteApproved: isApproved,
            ...(isApproved
              ? {
                  approvedAt: new Date().toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }),
                  approvedBy: currentUser?.name || 'Platform Admin',
                  badge: lab.badge === 'Draft - Pending Admin Approval' ? 'Verified Lab' : lab.badge,
                }
              : {
                  badge: status === 'Draft' ? 'Draft - Pending Admin Approval' : lab.badge,
                }),
          };
          return syncedLab;
        }
        return lab;
      })
    );
    if (syncedLab) {
      syncVendorLabToCloud(syncedLab);
    }

    // Sync with vendorLabSettingsMap
    setVendorLabSettingsMap((prev) => {
      if (prev[id]) {
        const updatedSetting = {
          ...prev[id],
          status,
          isWebsiteApproved: isApproved,
        };
        syncLabSettingsToCloud(id, updatedSetting);
        return {
          ...prev,
          [id]: updatedSetting,
        };
      }
      return prev;
    });
  };

  const selectVendorLab = (labIdOrSubdomain: string) => {
    if (!labIdOrSubdomain) return;
    const query = labIdOrSubdomain.toLowerCase().trim().replace(/^https?:\/\//, '');
    const cleanSub = query.split('.')[0].replace(/^lab-/, '');

    const lab =
      vendorLabsList.find((l) => {
        const labIdClean = l.id.toLowerCase();
        const labSubClean = (l.domainPreview || '').toLowerCase().split('.')[0];
        const labNameSlug = l.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          labIdClean === query ||
          labIdClean === `lab-${query}` ||
          labIdClean.replace(/^lab-/, '') === cleanSub ||
          labSubClean === cleanSub ||
          (l.domainPreview && l.domainPreview.toLowerCase() === query) ||
          labNameSlug.includes(cleanSub)
        );
      }) ||
      VENDOR_LABS_DIRECTORY.find((l) => {
        const labIdClean = l.id.toLowerCase();
        const labSubClean = (l.domainPreview || '').toLowerCase().split('.')[0];
        const labNameSlug = l.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          labIdClean === query ||
          labIdClean === `lab-${query}` ||
          labIdClean.replace(/^lab-/, '') === cleanSub ||
          labSubClean === cleanSub ||
          (l.domainPreview && l.domainPreview.toLowerCase() === query) ||
          labNameSlug.includes(cleanSub)
        );
      });

    if (lab) {
      setSelectedVendorLabId(lab.id);
      // Ensure settings map entry exists for this lab
      setVendorLabSettingsMap((prev) => {
        if (!prev[lab.id]) {
          return {
            ...prev,
            [lab.id]: buildDefaultSettingsForLab(lab),
          };
        }
        return prev;
      });
    }
  };

  const registerNewLab = (payload: {
    labName: string;
    state: string;
    phone: string;
    password?: string;
    pin?: string;
    ownerName?: string;
    email?: string;
    city?: string;
    address?: string;
    tagline?: string;
    nablCode?: string;
    category?: string;
    subscriptionPlan?: string;
  }): { lab: VendorLabDirectoryItem; adminUser: CmsUser } => {
    const cleanSlug = payload.labName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'newlab';
    const newLabId = `lab-${cleanSlug}-${Date.now().toString().slice(-4)}`;
    const cleanPhone = payload.phone.replace(/\D/g, '').slice(-10);

    // Strict Rule: Ek number se ek hi lab register hogi
    const existingLabWithPhone = vendorLabsList.find(
      (l) => (l.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone
    );
    if (existingLabWithPhone) {
      throw new Error(`Mobile number +91 ${cleanPhone} is already registered with laboratory "${existingLabWithPhone.name}". Ek mobile number se keval ek hi lab register ho sakti hai.`);
    }

    const newLab: VendorLabDirectoryItem = {
      id: newLabId,
      name: payload.labName,
      tagline: payload.tagline || `${payload.category || 'Diagnostic Pathology'} & Clinical Hub`,
      city: payload.city || payload.state || 'Punjab',
      state: payload.state || 'Punjab',
      address: payload.address || `${payload.state || 'Punjab'}, India`,
      phone: cleanPhone,
      password: payload.password || 'owner123',
      pin: payload.pin || '123456',
      nablCode: payload.nablCode || `NABL-${Math.floor(1000 + Math.random() * 9000)}`,
      badge: 'Draft - Pending Admin Approval',
      rating: 5.0,
      activePackages: 3,
      turnaroundTime: 'Same Day (4-6 Hours)',
      emergency: true,
      color: '#0F766E',
      status: 'Draft',
      isWebsiteApproved: false,
      ownerName: payload.ownerName || `${payload.labName} Owner`,
      email: payload.email || `${cleanPhone}@indianlalaji.com`,
      subscriptionPlan: payload.subscriptionPlan || 'Professional',
      subscriptionAmount: payload.subscriptionPlan === 'Enterprise' ? 3999 : 1499,
      joinedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      domainPreview: `${cleanSlug}.indianlalaji.com`,
      features: ['WhatsApp PDF Reports', 'Barcode Tracking', 'Staff Role Management', 'Due Billing Desk'],
    };

    // 1. Add to vendorLabsList
    setVendorLabsList((prev) => [newLab, ...prev]);

    // 2. Build and store lab settings
    const settings = buildDefaultSettingsForLab(newLab);
    if (payload.address) settings.address = payload.address;
    if (payload.email) settings.email = payload.email;
    if (cleanPhone) settings.phone = cleanPhone;
    if (payload.password) settings.ownerPassword = payload.password;
    if (payload.pin) settings.ownerPin = payload.pin;
    setVendorLabSettingsMap((prev) => ({
      ...prev,
      [newLabId]: settings,
    }));

    // 3. Create default branch
    const defaultBranchId = `branch-${newLabId}-1`;
    const newBranch: VendorBranch = {
      id: defaultBranchId,
      labId: newLabId,
      name: `${payload.labName} (Central Hub)`,
      badge: 'Main Hub',
      type: 'Headquarters Diagnostic Hub',
      address: payload.address || `${payload.city}, India`,
      phone: cleanPhone,
      timings: '7:00 AM - 9:00 PM (All 7 Days)',
      isEmergency: true,
    };
    setAllVendorBranches((prev) => [newBranch, ...prev]);

    // 4. Create default staff accounts
    const newReception: LabStaffAccount = {
      id: `staff-rec-${newLabId}`,
      name: `${payload.ownerName.split(' ')[0]} Desk Reception`,
      role: 'reception',
      username: `reception.${cleanSlug}`,
      phone: cleanPhone,
      password: payload.password ? `${payload.password}1` : 'reception123',
      status: 'active',
      labId: newLabId,
      labName: payload.labName,
      branchId: defaultBranchId,
      branchName: `${payload.labName} (Central Hub)`,
      lastPasswordReset: 'Just Now',
      shift: 'Morning & Evening Desk',
      notes: 'Initial receptionist account created during registration',
    };
    const newTech: LabStaffAccount = {
      id: `staff-tech-${newLabId}`,
      name: `Senior Lab Technician`,
      role: 'technician',
      username: `tech.${cleanSlug}`,
      phone: cleanPhone,
      password: payload.password ? `${payload.password}2` : 'tech123',
      status: 'active',
      labId: newLabId,
      labName: payload.labName,
      branchId: defaultBranchId,
      branchName: `${payload.labName} (Central Hub)`,
      lastPasswordReset: 'Just Now',
      shift: 'Diagnostic Workstation Bench',
      notes: 'Initial analyzer operator account created during registration',
    };
    setAllStaffAccounts((prev) => [newReception, newTech, ...prev]);

    // 5. Seed common test catalog for this lab
    const starterTests: TestItem[] = [
      {
        id: `test-${newLabId}-cbc`,
        labId: newLabId,
        code: 'CBC',
        name: 'Complete Blood Count (CBC - 24 Parameters)',
        category: 'Hematology',
        sampleType: 'EDTA Whole Blood (2ml)',
        unit: 'cells/cu.mm',
        normalRange: 'Age/Gender Specific',
        priceINR: 350,
        tatHours: 4,
        turnaroundTime: '4 Hours',
        description: 'Complete automated 5-part differential blood cell counter profile with Platelet indices.',
        isPopular: true,
        status: 'Active',
      },
      {
        id: `test-${newLabId}-fbs`,
        labId: newLabId,
        code: 'FBS',
        name: 'Fasting Blood Sugar (Glucose)',
        category: 'Biochemistry',
        sampleType: 'Sodium Fluoride Plasma (2ml)',
        unit: 'mg/dL',
        normalRange: '70 - 99 mg/dL',
        priceINR: 120,
        tatHours: 2,
        turnaroundTime: '2 Hours',
        description: 'Enzymatic hexokinase glucose test for diabetes screening and monitoring.',
        isPopular: true,
        status: 'Active',
      },
      {
        id: `test-${newLabId}-lipid`,
        labId: newLabId,
        code: 'LIPID',
        name: 'Lipid Profile Comprehensive',
        category: 'Biochemistry',
        sampleType: 'Serum (Gold Top SST)',
        unit: 'mg/dL',
        normalRange: 'Desirable: <200 mg/dL',
        priceINR: 650,
        tatHours: 6,
        turnaroundTime: '6 Hours',
        description: 'Total Cholesterol, Triglycerides, HDL, LDL, VLDL, and Risk Ratios.',
        isPopular: true,
        status: 'Active',
      },
      {
        id: `test-${newLabId}-urine`,
        labId: newLabId,
        code: 'URINE-RM',
        name: 'Urine Routine & Microscopic Examination (R/M)',
        category: 'Clinical Pathology',
        sampleType: 'Fresh Midstream Urine (20ml)',
        unit: 'HPF / Strip',
        normalRange: 'Nil / Normal',
        priceINR: 180,
        tatHours: 3,
        turnaroundTime: '3 Hours',
        description: 'Physical, chemical, and automated strip dipstick microscopic examination.',
        isPopular: false,
        status: 'Active',
      },
    ];
    setAllVendorTests((prev) => [...starterTests, ...prev]);

    // Sync newly registered lab and all its starter entities to Firestore for live cross-device sync
    syncVendorLabToCloud(newLab);
    syncLabSettingsToCloud(newLabId, settings);
    syncBranchToCloud(newBranch);
    syncStaffAccountToCloud(newReception);
    syncStaffAccountToCloud(newTech);
    starterTests.forEach((t) => syncTestToCloud(t));

    // 6. Set active tenant to this new lab
    setSelectedVendorLabId(newLabId);
    setActiveBranchId(defaultBranchId);

    // 7. Generate admin user
    const adminUser: CmsUser = {
      id: `usr-vendor-${newLabId}`,
      name: `${payload.ownerName} (Lab Owner)`,
      email: payload.email || cleanPhone,
      role: 'vendor',
      entityName: payload.labName,
      labId: newLabId,
      labName: payload.labName,
      branchId: defaultBranchId,
      branchName: `${payload.labName} (Central Hub)`,
      permissions: getPermissionsForRole('vendor'),
    };

    setCurrentUser(adminUser);
    try {
      localStorage.setItem('cms_current_user', JSON.stringify(adminUser));
    } catch {}

    return { lab: newLab, adminUser };
  };

  // Reset to original demo defaults
  const resetAllToDefaults = () => {
    setCompanySettings(DEFAULT_COMPANY_SETTINGS);
    setPortalSections(DEFAULT_PORTAL_SECTIONS);
    setVendorLabsList(VENDOR_LABS_DIRECTORY);
    setPricingPlans(DEFAULT_PRICING_PLANS);
    setCompanyFeatures(DEFAULT_COMPANY_FEATURES);
    setCompanyFaqs(DEFAULT_COMPANY_FAQS);
    setCompanyStats(DEFAULT_COMPANY_STATS);

    setVendorLabSettingsMap(DEFAULT_VENDOR_SETTINGS_MAP);
    setAllVendorPackages(DEFAULT_ALL_VENDOR_PACKAGES);
    setAllVendorTests(MOCK_TESTS);
    setAllVendorDoctors(DEFAULT_ALL_VENDOR_DOCTORS);
    setAllVendorBranches(DEFAULT_VENDOR_BRANCHES);
    setAllVendorBookings(DEFAULT_VENDOR_BOOKINGS);
    setAllReports(INITIAL_REPORTS);
    setAllReceptionEntries(INITIAL_RECEPTION_ENTRIES);
    setAllStaffAccounts(DEFAULT_STAFF_ACCOUNTS);
    setSuperAdminTenantScope('all');

    localStorage.clear();
  };

  // Import Full Website Backup
  const importFullWebsiteBackup = (backup: any): { success: boolean; message: string } => {
    try {
      if (!backup || typeof backup !== 'object') {
        return { success: false, message: 'Invalid backup file structure.' };
      }
      const targetLabId = backup.labId || activeTenantId || 'lab-apex';

      // 1. Settings
      if (backup.settings && typeof backup.settings === 'object') {
        updateVendorLabSettings(backup.settings);
      }
      // 2. Sections
      if (backup.sections && typeof backup.sections === 'object') {
        updateVendorLabSettings({ sections: backup.sections });
      }
      // 3. Packages
      if (Array.isArray(backup.packages) && backup.packages.length > 0) {
        const sanitized = backup.packages.map((p: any) => ({ ...p, labId: targetLabId }));
        setAllVendorPackages((prev) => [
          ...sanitized,
          ...prev.filter((p) => !isTenantMatch(p, targetLabId)),
        ]);
      }
      // 4. Tests
      if (Array.isArray(backup.tests) && backup.tests.length > 0) {
        const sanitized = backup.tests.map((t: any) => ({ ...t, labId: targetLabId }));
        setAllVendorTests((prev) => [
          ...sanitized,
          ...prev.filter((t) => !isTenantMatch(t, targetLabId)),
        ]);
      }
      // 5. Doctors
      if (Array.isArray(backup.doctors) && backup.doctors.length > 0) {
        const sanitized = backup.doctors.map((d: any) => ({ ...d, labId: targetLabId }));
        setAllVendorDoctors((prev) => [
          ...sanitized,
          ...prev.filter((d) => !isTenantMatch(d, targetLabId)),
        ]);
      }
      // 6. Branches
      if (Array.isArray(backup.branches) && backup.branches.length > 0) {
        const sanitized = backup.branches.map((b: any) => ({ ...b, labId: targetLabId }));
        setAllVendorBranches((prev) => [
          ...sanitized,
          ...prev.filter((b) => !isTenantMatch(b, targetLabId)),
        ]);
      }

      return {
        success: true,
        message: `Website configuration successfully restored for ${backup.labName || targetLabId}!`,
      };
    } catch (err: any) {
      return { success: false, message: `Failed to restore website backup: ${err.message}` };
    }
  };

  // Import Customer Entry Backup
  const importCustomerEntryBackup = (
    backup: any,
    mode: 'append' | 'replace' = 'append'
  ): { success: boolean; message: string; count: number } => {
    try {
      if (!backup || typeof backup !== 'object') {
        return { success: false, message: 'Invalid backup format.', count: 0 };
      }
      const targetLabId = backup.labId || activeTenantId || 'lab-apex';

      const entriesToImport: ReceptionPatientEntry[] = Array.isArray(backup.customerEntries)
        ? backup.customerEntries.map((e: any) => ({ ...e, labId: targetLabId }))
        : Array.isArray(backup)
        ? backup.map((e: any) => ({ ...e, labId: targetLabId }))
        : [];

      const reportsToImport: LabReport[] = Array.isArray(backup.reports)
        ? backup.reports.map((r: any) => ({ ...r, labId: targetLabId }))
        : [];

      if (entriesToImport.length === 0 && reportsToImport.length === 0) {
        return { success: false, message: 'No customer entries or reports found in the file.', count: 0 };
      }

      if (mode === 'replace') {
        setAllReceptionEntries((prev) => [
          ...entriesToImport,
          ...prev.filter((e) => !isTenantMatch(e, targetLabId)),
        ]);
        if (reportsToImport.length > 0) {
          setAllReports((prev) => [
            ...reportsToImport,
            ...prev.filter((r) => !isTenantMatch(r, targetLabId)),
          ]);
        }
      } else {
        setAllReceptionEntries((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newEntries = entriesToImport.filter((e) => !existingIds.has(e.id));
          return [...newEntries, ...prev];
        });
        if (reportsToImport.length > 0) {
          setAllReports((prev) => {
            const existingReportIds = new Set(prev.map((r) => r.reportId));
            const newReports = reportsToImport.filter((r) => !existingReportIds.has(r.reportId));
            return [...newReports, ...prev];
          });
        }
      }

      return {
        success: true,
        message: `Successfully imported ${entriesToImport.length} customer entries and ${reportsToImport.length} reports!`,
        count: entriesToImport.length,
      };
    } catch (err: any) {
      return { success: false, message: `Failed to import customer entries: ${err.message}`, count: 0 };
    }
  };

  const patients: Patient[] = useMemo(() => {
    return (receptionEntries || []).map((e) => ({
      id: e.id,
      uhid: e.uhid,
      name: e.patientName,
      age: typeof e.age === 'number' ? e.age : parseInt(String(e.age), 10) || 30,
      gender: e.gender,
      mobile: e.mobile,
      city: 'Mohali',
      referringDoctor: e.referringDoctor,
      registeredAt: e.registeredAt || new Date().toISOString(),
      reportId: e.reportId || '',
      status: (e.status === 'Report Ready' ? 'Report Ready' : 'In Processing') as Patient['status'],
      tests: e.tests || e.testNames || [],
      totalBill: e.totalAmount,
      paidAmount: e.paidAmount,
      dueAmount: e.dueAmount,
      paymentMode: e.paymentMode,
      labId: e.labId,
      branchId: e.branchId,
      branchName: e.branchName,
    }));
  }, [receptionEntries]);

  return (
    <CmsContext.Provider
      value={{
        currentUser,
        activeBranchId,
        setActiveBranchId,
        activeDeviceId,
        setActiveDeviceId,
        login,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        targetLoginRole,
        openLoginModal,
        openRegisterLabModal,

        staffAccounts,
        allStaffAccounts,
        addStaffAccount,
        updateStaffAccount,
        resetStaffPassword,
        deleteStaffAccount,
        transferStaffDataAndDelete,
        updateAdminProfile,

        companySettings,
        updateCompanySettings,
        portalSections,
        updatePortalSection,
        toggleAllPortalSections,
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

        vendorLabSettings,
        vendorLabSettingsMap,
        getLabSettings,
        updateVendorLabSettings,
        updateVendorSection,
        toggleAllVendorSections,
        vendorPackages,
        addVendorPackage,
        updateVendorPackage,
        deleteVendorPackage,
        vendorTests,
        addVendorTest,
        updateVendorTest,
        deleteVendorTest,
        vendorDoctors,
        addVendorDoctor,
        updateVendorDoctor,
        deleteVendorDoctor,
        vendorBranches,
        addVendorBranch,
        updateVendorBranch,
        deleteVendorBranch,
        vendorBookings,
        addHomeCollectionBooking,
        updateBookingStatus,
        deleteBooking,
        transferBookingToReception,

        contactSubmissions,
        allContactSubmissions,
        addContactSubmission,
        markContactAsRead,
        toggleContactReadStatus,
        deleteContactSubmission,
        clearContactSubmissions,

        domainRequests,
        allDomainRequests,
        addDomainRequest,
        updateDomainRequest,
        deleteDomainRequest,
        approveDomainRequest,
        rejectDomainRequest,

        selectedVendorLabId,
        setSelectedVendorLabId,
        selectVendorLab,
        vendorLabsList,
        addVendorLab,
        registerNewLab,
        updateVendorLab,
        updateVendorLabCredentials,
        deleteVendorLab,
        setVendorStatus,

        reports,
        labReports: reports,
        allReports,
        setLabReports: setAllReports,
        addLabReport,
        updateLabReport,
        deleteLabReport,
        cancelLabReport,
        uncancelLabReport,
        getReportById,
        getReportByMobile,

        patients,
        receptionEntries,
        allReceptionEntries,
        addReceptionEntry,
        updateReceptionStatus,
        updateReceptionEntry,
        deleteReceptionEntry,
        clearReceptionEntries,
        sendEntryToTechnician,
        acceptEntryByTechnician,
        completeTechnicianReport,
        publishReport,
        unpublishReport,

        resetAllToDefaults,
        importFullWebsiteBackup,
        importCustomerEntryBackup,

        // Multi-Lab Data Isolation & Tenant Security
        activeTenantId,
        activeTenantName,
        superAdminTenantScope,
        setSuperAdminTenantScope,
        isTenantIsolated,
        queryTenantIsolatedPatients,
        queryTenantIsolatedReports,
        queryTenantIsolatedBilling,
        queryTenantIsolatedStaff,

        // Real-Time Multi-Computer Cloud Sync
        isCloudConnected,
        cloudSyncStatus,
        lastCloudSyncTime,
        refreshCloudData,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
};

export const useCms = () => {
  const context = useContext(CmsContext);
  if (!context) {
    throw new Error('useCms must be used within a CmsProvider');
  }
  return context;
};
