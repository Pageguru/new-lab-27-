import React, { useState } from 'react';
import {
  Check,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Mail,
  PlusCircle,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';

interface PricingSectionProps {
  onOpenDemo?: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = () => {
  const { pricingPlans, openRegisterLabModal } = useCms();
  const [activeSlide, setActiveSlide] = useState(1); // Default to 3 Month (index 1)

  // Touch swipe handling for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 45;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeSlide < pricingPlans.length - 1) {
      setActiveSlide((prev) => prev + 1);
    }
    if (isRightSwipe && activeSlide > 0) {
      setActiveSlide((prev) => prev - 1);
    }
  };

  // Helper to get formatted duration / billing cycle subtitle
  const getBillingSubtitle = (name: string, price: number) => {
    const lower = name.toLowerCase();
    if (lower.includes('1 month') || lower.includes('1mopnth') || lower.includes('monthly')) {
      return {
        rateText: `/ 1 Month`,
        breakdownText: 'Billed monthly • Complete software access',
        badge: 'Flexible Monthly',
        accentColor: 'blue',
      };
    }
    if (lower.includes('3 month') || lower.includes('quarterly')) {
      const perMonth = Math.round(price / 3);
      return {
        rateText: `/ 3 Months`,
        breakdownText: `₹${perMonth.toLocaleString('en-IN')}/month • Billed quarterly`,
        badge: 'Most Popular',
        accentColor: 'teal',
      };
    }
    if (lower.includes('year') || lower.includes('annual') || lower.includes('1 year')) {
      const perMonth = Math.round(price / 12);
      return {
        rateText: `/ 1 Year`,
        breakdownText: `₹${perMonth.toLocaleString('en-IN')}/month • Best Value Annual Saver`,
        badge: 'Best Value • Maximum Savings',
        accentColor: 'indigo',
      };
    }
    return {
      rateText: `/ period`,
      breakdownText: 'Full access with all features',
      badge: 'Standard Plan',
      accentColor: 'blue',
    };
  };

  const validActiveIndex = Math.min(Math.max(0, activeSlide), Math.max(0, pricingPlans.length - 1));
  const activeMobilePlan = pricingPlans[validActiveIndex];

  return (
    <section id="pricing-section" className="py-16 sm:py-20 bg-linear-to-b from-white via-slate-50/50 to-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#123B6D]/10 text-[#123B6D] text-xs font-bold mb-3 border border-[#123B6D]/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Transparent INR Pricing • 3 Flexible Packages</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#123B6D] tracking-tight">
            Simple, All-Inclusive Plans for Every Laboratory
          </h2>
          <p className="text-xs sm:text-base text-slate-600 mt-3 leading-relaxed">
            Choose your duration: <span className="font-semibold text-slate-900">1 Month</span>,{' '}
            <span className="font-semibold text-slate-900">3 Months</span>, or{' '}
            <span className="font-semibold text-slate-900">1 Year</span>. All software features, test libraries, WhatsApp PDF sharing, and Indian support are 100% included in every package.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] sm:text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Same Full Features Across All 3 Packages • No Hidden Setup Fees</span>
          </div>
        </div>

        {/* =========================================================================
            MOBILE VIEW: Interactive Touch Carousel (< md breakpoint)
            ========================================================================= */}
        <div className="block md:hidden max-w-md mx-auto">
          {/* Quick Pill Selector Tabs */}
          <div className="flex items-center justify-between p-1 bg-slate-100 rounded-2xl border border-slate-200 mb-5">
            {pricingPlans.map((p, idx) => {
              const isCurrent = validActiveIndex === idx;
              return (
                <button
                  key={p.id || idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`flex-1 py-2 px-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    isCurrent
                      ? 'bg-[#123B6D] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{p.name}</span>
                  {p.isPopular && (
                    <span className={`block text-[9px] font-extrabold leading-none mt-0.5 ${isCurrent ? 'text-amber-300' : 'text-amber-600'}`}>
                      ★ Popular
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Carousel Card with Swipe Handlers & Arrows */}
          {activeMobilePlan && (() => {
            const price = activeMobilePlan.priceINR ?? activeMobilePlan.monthlyPriceINR;
            const meta = getBillingSubtitle(activeMobilePlan.name, price);
            const isHighlighted = activeMobilePlan.isPopular || activeMobilePlan.name.includes('3 Month');

            return (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="relative select-none"
              >
                {/* Main Card */}
                <div
                  className={`rounded-3xl transition-all duration-300 flex flex-col justify-between relative bg-white ${
                    isHighlighted
                      ? 'border-2 border-[#123B6D] shadow-xl ring-4 ring-[#123B6D]/5'
                      : 'border border-slate-200 shadow-md'
                  } p-6`}
                >
                  {/* Highlight Ribbon */}
                  {isHighlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#123B6D] text-amber-300 text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Most Popular Choice</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                          isHighlighted
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-blue-50 text-[#123B6D] border-blue-200'
                        }`}
                      >
                        {activeMobilePlan.target || meta.badge}
                      </span>

                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        {validActiveIndex + 1} / {pricingPlans.length}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900">{activeMobilePlan.name} Plan</h3>
                    <p className="text-xs text-slate-500 mt-1 min-h-[30px] leading-relaxed">
                      {activeMobilePlan.description || 'Full software access with all features included.'}
                    </p>

                    {/* Price Block */}
                    <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-[#123B6D]">
                          ₹{price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">{meta.rateText}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium mt-1">
                        {meta.breakdownText}
                      </div>
                    </div>

                    {/* Features List - Identical across all plans */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                        <span>Included in this package:</span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          100% Features
                        </span>
                      </div>
                      {activeMobilePlan.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-slate-700 leading-snug">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
                    <button
                      onClick={() => openRegisterLabModal()}
                      className={`w-full py-3.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                        isHighlighted
                          ? 'bg-[#123B6D] hover:bg-[#0e2c52] text-white shadow-md active:scale-98'
                          : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-98'
                      }`}
                    >
                      <span>Choose {activeMobilePlan.name} • Register Lab</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                    <div className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Instant Access • GST Tax Invoice Included</span>
                    </div>
                  </div>
                </div>

                {/* Carousel Controls Below Card */}
                <div className="mt-4 flex items-center justify-between px-2">
                  <button
                    onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
                    disabled={validActiveIndex === 0}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs hover:bg-slate-50 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    aria-label="Previous Plan"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prev</span>
                  </button>

                  {/* Dot Indicators */}
                  <div className="flex items-center gap-2">
                    {pricingPlans.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        onClick={() => setActiveSlide(dotIdx)}
                        aria-label={`Slide ${dotIdx + 1}`}
                        className={`h-2.5 rounded-full transition-all cursor-pointer ${
                          validActiveIndex === dotIdx
                            ? 'w-7 bg-[#123B6D]'
                            : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveSlide((prev) => Math.min(pricingPlans.length - 1, prev + 1))}
                    disabled={validActiveIndex === pricingPlans.length - 1}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs hover:bg-slate-50 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    aria-label="Next Plan"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center text-[11px] text-slate-400 mt-2 font-medium">
                  ← Swipe left or right to view other packages →
                </div>
              </div>
            );
          })()}
        </div>

        {/* =========================================================================
            DESKTOP & TABLET VIEW: 3 Side-by-Side Grid (>= md breakpoint)
            ========================================================================= */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {pricingPlans.map((plan, idx) => {
            const price = plan.priceINR ?? plan.monthlyPriceINR;
            const meta = getBillingSubtitle(plan.name, price);
            const isHighlighted = plan.isPopular || plan.name.includes('3 Month');

            return (
              <div
                key={plan.id || idx}
                className={`rounded-3xl transition-all duration-200 flex flex-col justify-between relative ${
                  isHighlighted
                    ? 'border-2 border-[#123B6D] bg-white shadow-xl ring-4 ring-[#123B6D]/5 -translate-y-1'
                    : 'border border-slate-200 bg-white shadow-xs hover:shadow-md hover:border-slate-300'
                } p-6 sm:p-8`}
              >
                {/* Highlight Ribbon */}
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#123B6D] text-amber-300 text-[11px] font-extrabold uppercase tracking-wider px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Most Popular Choice</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                        isHighlighted
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : 'bg-blue-50 text-[#123B6D] border-blue-200'
                      }`}
                    >
                      {plan.target || meta.badge}
                    </span>

                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isHighlighted ? 'bg-[#123B6D] text-amber-400' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {idx === 0 && <Zap className="w-4 h-4" />}
                      {idx === 1 && <Sparkles className="w-4 h-4" />}
                      {idx === 2 && <Award className="w-4 h-4" />}
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900">{plan.name} Plan</h3>
                  <p className="text-xs text-slate-500 mt-1.5 min-h-[32px] leading-relaxed">
                    {plan.description || 'Full software access with all features included.'}
                  </p>

                  {/* Price Block */}
                  <div className="my-6 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-[#123B6D]">
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">{meta.rateText}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium mt-1">
                      {meta.breakdownText}
                    </div>
                  </div>

                  {/* Features List - Identical across all 3 plans */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Included in this package:
                    </div>
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-slate-700 leading-snug">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 space-y-2.5">
                  <button
                    onClick={() => openRegisterLabModal()}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                      isHighlighted
                        ? 'bg-[#123B6D] hover:bg-[#0e2c52] text-white shadow-md hover:shadow-lg active:scale-98'
                        : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-98'
                    }`}
                  >
                    <span>Choose {plan.name} • Register Lab</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                  <div className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Instant Access • GST Tax Invoice Included</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* =========================================================================
            ADD-ON FEATURES: Left (Custom Domain) & Right (Professional Email)
            ========================================================================= */}
        <div className="mt-14 sm:mt-16 pt-12 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-2.5">
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Optional Upgrades</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-[#123B6D] tracking-tight">
              Add-on Features
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-xl mx-auto leading-relaxed">
              Elevate your laboratory's direct brand identity with our two high-impact add-ons: custom domain mapping on the left and corporate professional email on the right.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
            {/* Left Card: Custom Domain */}
            <div className="relative p-6 sm:p-7 rounded-3xl border-2 border-blue-200/90 bg-linear-to-br from-blue-50/50 via-white to-slate-50/40 hover:border-[#123B6D] shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-blue-200 bg-blue-100/70 text-[#123B6D]">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-[#123B6D] border border-blue-200">
                      Popular Add-on
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                      Left
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-1">
                  Branded Web Address
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Custom Domain
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Connect your own branded domain (e.g.{' '}
                  <span className="font-bold text-[#123B6D]">www.yourlab.com</span> or{' '}
                  <span className="font-bold text-[#123B6D]">yourlab.in</span>) instead of a subdomain for instant local patient trust and search credibility.
                </p>

                <div className="mt-5 pt-4 border-t border-blue-100 space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">Dedicated Domain Binding (.com, .in, etc.)</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">Free Lifetime SSL Certificate (HTTPS Secure)</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">Automated DNS Routing &amp; Fast CNAME Setup</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">Boosts Local Patient Trust &amp; Google Search SEO</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-blue-100 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-500">
                  Ready in under 24 hrs
                </span>
                <button
                  type="button"
                  onClick={() => openRegisterLabModal()}
                  className="px-4 py-2 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold transition shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
                >
                  Request Custom Domain
                </button>
              </div>
            </div>

            {/* Right Card: Professional Email */}
            <div className="relative p-6 sm:p-7 rounded-3xl border-2 border-teal-200/90 bg-linear-to-br from-teal-50/50 via-white to-slate-50/40 hover:border-[#0F766E] shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-teal-200 bg-teal-100/70 text-[#0F766E]">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
                      Business Identity
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                      Right
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 mb-1">
                  Corporate Mailbox
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Professional Email
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Establish corporate trust with dedicated business email addresses (e.g.{' '}
                  <span className="font-bold text-[#0F766E]">contact@yourlab.com</span> or{' '}
                  <span className="font-bold text-[#0F766E]">reports@yourlab.com</span>) matching your lab's domain.
                </p>

                <div className="mt-5 pt-4 border-t border-teal-100 space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">Custom Corporate Mailbox on Your Domain</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">Webmail, Outlook, Gmail &amp; Mobile IMAP Sync</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">Built-in Anti-Spam &amp; Phishing Defense</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">Direct Doctor Referrals &amp; Corporate Lab Credibility</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-teal-100 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-500">
                  IMAP / Webmail Included
                </span>
                <button
                  type="button"
                  onClick={() => openRegisterLabModal()}
                  className="px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0c5f58] text-white text-xs font-bold transition shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
                >
                  Request Professional Email
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Assurance Banner */}
        <div className="mt-14 max-w-4xl mx-auto rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Need Custom Branch Licensing or Dedicated On-Premise Server?</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Our Indian technical team assists with data import from older software, barcode scanners, and custom lab letterheads.
              </p>
            </div>
          </div>
          <button
            onClick={() => openRegisterLabModal()}
            className="shrink-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Talk to Lab Specialist
          </button>
        </div>
      </div>
    </section>
  );
};
