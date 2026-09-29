import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Building2,
  Globe,
  Mail,
} from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/mockData';
import { useCms } from '../context/CmsContext';

// Import clean, high-resolution laboratory photography
import receptionImg from '../assets/images/lab_reception_lounge_1790347166531.jpg';
import hematologyImg from '../assets/images/lab_hematology_analyzer_1790347081554.jpg';
import biochemistryImg from '../assets/images/lab_biochemistry_platform_1790347095136.jpg';
import microscopeImg from '../assets/images/lab_clinical_microscope_1790347120478.jpg';
import pathologistImg from '../assets/images/lab_pathologist_workstation_1790347181032.jpg';
import barcodeImg from '../assets/images/lab_barcode_station_1790347227373.jpg';

interface HeroProps {
  onOpenDemo: () => void;
  onLaunchApp: () => void;
  onLaunchLabShop?: () => void;
  language?: Language;
}

const CAROUSEL_IMAGES = [
  { id: '1', src: receptionImg, alt: 'Laboratory Reception Lounge & Registration' },
  { id: '2', src: hematologyImg, alt: '5-Part Hematology Analyzer' },
  { id: '3', src: biochemistryImg, alt: 'Biochemistry Platform' },
  { id: '4', src: microscopeImg, alt: 'Clinical Diagnostic Microscope' },
  { id: '5', src: pathologistImg, alt: 'Pathologist Doctor Workstation' },
  { id: '6', src: barcodeImg, alt: 'Thermal Barcode Sample Station' },
];

const ADDON_BOXES = [
  {
    id: 'custom-domain',
    title: 'Custom Domain',
    badge: 'Branded Web Address',
    badgeColor: 'bg-blue-50 text-[#123B6D] border-blue-200',
    iconBg: 'bg-blue-100/80 text-[#123B6D] border-blue-200',
    icon: Globe,
    headline: 'www.yourlab.com or yourlab.in',
    description: 'Connect your own branded domain name with free SSL certificate for instant local patient trust.',
    features: ['Dedicated Branded URL', 'Free Lifetime SSL (HTTPS)', 'Instant DNS Activation'],
    btnText: 'Request Domain',
  },
  {
    id: 'pro-email',
    title: 'Professional Email',
    badge: 'Business Identity',
    badgeColor: 'bg-teal-50 text-[#0F766E] border-teal-200',
    iconBg: 'bg-teal-100/80 text-[#0F766E] border-teal-200',
    icon: Mail,
    headline: 'contact@yourlab.com & reports@yourlab.com',
    description: 'Establish official corporate credibility with branded inboxes, anti-spam protection, and webmail access.',
    features: ['Branded Inboxes', '99.9% Inbox Delivery', 'Webmail & Mobile Sync'],
    btnText: 'Get Official Email',
  },
];

export const Hero: React.FC<HeroProps> = ({
  onOpenDemo,
  onLaunchApp,
  onLaunchLabShop,
  language = 'en',
}) => {
  const { companySettings, openRegisterLabModal, selectedVendorLabId, selectVendorLab } = useCms();
  const t = (language && TRANSLATIONS[language]) || TRANSLATIONS['en'];

  // Dynamic CMS copy
  const heroBadge = language === 'en' ? companySettings.heroBadge : t.tagline;
  const heroHeading = language === 'en' ? companySettings.heroTitle : t.heroHeading;
  const heroSubheading = language === 'en' ? companySettings.heroSubtitle : t.heroSubheading;

  // Simple image carousel state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Small Box Add-on Slider State (Custom Domain & Professional Email)
  const [activeAddonIndex, setActiveAddonIndex] = useState(0);
  const [isAddonHovered, setIsAddonHovered] = useState(false);

  useEffect(() => {
    if (isAddonHovered) return;
    const interval = setInterval(() => {
      setActiveAddonIndex((prev) => (prev === 0 ? 1 : 0));
    }, 4500);
    return () => clearInterval(interval);
  }, [isAddonHovered]);

  // Auto-advance slides every 4 seconds when not hovered
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? CAROUSEL_IMAGES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
  };

  const currentAddon = ADDON_BOXES[activeAddonIndex];
  const CurrentAddonIcon = currentAddon.icon;

  return (
    <section id="hero-section" className="relative overflow-hidden bg-[#F8FAFC] pt-6 pb-12 sm:pt-10 sm:pb-16 border-b border-slate-200">
      {/* Subtle Background Radial Gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Two-Column Grid: Left Content | Right Simple Plain Image Carousel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ========================================================
              LEFT SIDE: Content, Highlights & CTAs
              ======================================================== */}
          <div className="lg:col-span-6 space-y-6">
            {/* Live Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#123B6D]/10 border border-[#123B6D]/15 text-[#123B6D] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{heroBadge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] leading-[1.18] lg:leading-[1.12] font-black text-[#123B6D] tracking-tight">
              {heroHeading}
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-[540px]">
              {heroSubheading}
            </p>

            {/* Key Lab Benefits Checklist - Left-Right 2 Columns on Mobile & Desktop */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-1">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cloud-Based System</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Online Reports</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Multi-Department</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="leading-tight sm:leading-normal">One Click Report Generation</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-btn-start"
                onClick={openRegisterLabModal}
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-8 py-3.5 rounded-xl font-bold text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{t.getStarted}</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>

          {/* ========================================================
              RIGHT SIDE: Simple Plain Image Carousel (No Banners)
              ======================================================== */}
          <div className="lg:col-span-6 relative">
            <div
              className="group relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 bg-white"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Plain Image Canvas */}
              <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden bg-slate-100 select-none">
                {CAROUSEL_IMAGES.map((img, index) => {
                  const isActive = index === currentSlideIndex;
                  return (
                    <div
                      key={img.id}
                      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                        isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                      }`}
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-full h-full object-cover object-center"
                        loading={index === 0 ? 'eager' : 'lazy'}
                      />
                    </div>
                  );
                })}

                {/* Subtle Prev / Next Navigation Arrows */}
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-slate-800 backdrop-blur-sm border border-slate-200/80 flex items-center justify-center transition shadow-md hover:scale-105 active:scale-95 cursor-pointer opacity-70 group-hover:opacity-100"
                  aria-label="Previous Image"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>

                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-slate-800 backdrop-blur-sm border border-slate-200/80 flex items-center justify-center transition shadow-md hover:scale-105 active:scale-95 cursor-pointer opacity-70 group-hover:opacity-100"
                  aria-label="Next Image"
                >
                  <ChevronRight className="w-5 h-5 text-slate-700" />
                </button>
              </div>

              {/* Clean Dot Indicators Below Image */}
              <div className="py-3 bg-white flex items-center justify-center gap-2 border-t border-slate-100">
                {CAROUSEL_IMAGES.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlideIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      index === currentSlideIndex
                        ? 'w-7 bg-[#123B6D]'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Small Box Add-on Slider: Custom Domain & Professional Email (Mobile View & Desktop View) */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-center">
          <div
            className="w-full max-w-xl bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-300 p-4 sm:p-5 relative group"
            onMouseEnter={() => setIsAddonHovered(true)}
            onMouseLeave={() => setIsAddonHovered(false)}
          >
            {/* Top row: Icon, Title & Badge, Slider Prev/Next Controls */}
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border ${currentAddon.iconBg}`}>
                  <CurrentAddonIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm sm:text-base text-slate-900 tracking-tight truncate">
                      {currentAddon.title}
                    </h4>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${currentAddon.badgeColor}`}>
                      {currentAddon.badge}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs font-mono font-bold text-[#123B6D] truncate">
                    {currentAddon.headline}
                  </p>
                </div>
              </div>

              {/* Slider Prev / Next Arrows */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveAddonIndex((prev) => (prev === 0 ? ADDON_BOXES.length - 1 : prev - 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition cursor-pointer active:scale-95"
                  aria-label="Previous Add-on"
                  title="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAddonIndex((prev) => (prev === ADDON_BOXES.length - 1 ? 0 : prev + 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition cursor-pointer active:scale-95"
                  aria-label="Next Add-on"
                  title="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              {currentAddon.description}
            </p>

            {/* Feature Pills / Badges */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3">
              {currentAddon.features.map((feat, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-semibold text-slate-700 bg-slate-100/90 px-2 sm:px-2.5 py-0.5 rounded-md border border-slate-200"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </span>
              ))}
            </div>

            {/* Bottom Row: CTA Button + Dot Indicators */}
            <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
              {/* Slider Dots */}
              <div className="flex items-center gap-1.5">
                {ADDON_BOXES.map((box, idx) => (
                  <button
                    key={box.id}
                    type="button"
                    onClick={() => setActiveAddonIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === activeAddonIndex
                        ? 'w-6 bg-[#123B6D]'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Slide ${idx + 1}: ${box.title}`}
                    title={box.title}
                  />
                ))}
                <span className="text-[10px] text-slate-500 font-semibold ml-1">
                  {activeAddonIndex + 1}/{ADDON_BOXES.length}
                </span>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => openRegisterLabModal()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold transition shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
              >
                <span>{currentAddon.btnText}</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
