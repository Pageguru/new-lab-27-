import React from 'react';
import {
  Users,
  Building2,
  BookOpen,
  TestTubes,
  FileEdit,
  FileText,
  IndianRupee,
  History,
  CalendarCheck,
  Stethoscope,
  UserCog,
  Activity,
  Layers,
  Zap,
  Globe,
  MessageSquare,
  QrCode,
  Award,
  HardDriveDownload,
  Mail,
  Sparkles,
  CheckCircle2,
  PlusCircle,
} from 'lucide-react';

interface FeatureItem {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CORE_FEATURES: FeatureItem[] = [
  {
    id: 'f-1',
    title: 'Patient Management',
    desc: 'Token No., mobile search & patient records',
    icon: Users,
    color: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  {
    id: 'f-2',
    title: 'Reception Dashboard',
    desc: 'Tokens, billing & counter',
    icon: Building2,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  },
  {
    id: 'f-3',
    title: 'Test Management',
    desc: 'Tests, packages & pricing',
    icon: BookOpen,
    color: 'text-teal-600 bg-teal-50 border-teal-100',
  },
  {
    id: 'f-4',
    title: 'Sample Management',
    desc: 'Sample collection & tracking',
    icon: TestTubes,
    color: 'text-cyan-600 bg-cyan-50 border-cyan-100',
  },
  {
    id: 'f-5',
    title: 'Result Entry',
    desc: 'Fast result entry & value alerts',
    icon: FileEdit,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    id: 'f-6',
    title: 'Report Generation',
    desc: 'Branded reports',
    icon: FileText,
    color: 'text-sky-600 bg-sky-50 border-sky-100',
  },
  {
    id: 'f-7',
    title: 'Billing & Payments',
    desc: 'Cash, UPI & receipts',
    icon: IndianRupee,
    color: 'text-amber-600 bg-amber-50 border-amber-100',
  },
  {
    id: 'f-8',
    title: 'Patient History',
    desc: 'Complete patient records',
    icon: History,
    color: 'text-violet-600 bg-violet-50 border-violet-100',
  },
  {
    id: 'f-9',
    title: 'Booking Management',
    desc: 'Branch booking & home sample',
    icon: CalendarCheck,
    color: 'text-rose-600 bg-rose-50 border-rose-100',
  },
  {
    id: 'f-10',
    title: 'Doctor Management',
    desc: 'Doctor directory & referrals',
    icon: Stethoscope,
    color: 'text-blue-700 bg-blue-50 border-blue-100',
  },
  {
    id: 'f-11',
    title: 'Staff & Roles',
    desc: 'Reception, technician & admin access',
    icon: UserCog,
    color: 'text-purple-600 bg-purple-50 border-purple-100',
  },
  {
    id: 'f-12',
    title: 'Technician Dashboard',
    desc: 'Tests, worklists & reports',
    icon: Activity,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  },
  {
    id: 'f-13',
    title: 'Multi-Department',
    desc: 'Reception & technician workflow',
    icon: Layers,
    color: 'text-indigo-700 bg-indigo-50 border-indigo-100',
  },
  {
    id: 'f-14',
    title: 'Auto Report Generation',
    desc: 'Faster report preparation',
    icon: Zap,
    color: 'text-amber-500 bg-amber-50 border-amber-100',
  },
  {
    id: 'f-15',
    title: 'Online Reports',
    desc: 'Patient report access',
    icon: Globe,
    color: 'text-cyan-700 bg-cyan-50 border-cyan-100',
  },
  {
    id: 'f-16',
    title: 'WhatsApp Reports',
    desc: 'Quick report sharing',
    icon: MessageSquare,
    color: 'text-green-600 bg-green-50 border-green-100',
  },
  {
    id: 'f-17',
    title: 'QR Report Verification',
    desc: 'Instant report verification',
    icon: QrCode,
    color: 'text-teal-700 bg-teal-50 border-teal-100',
  },
  {
    id: 'f-18',
    title: 'NABL Formats',
    desc: 'Reference ranges & report formats',
    icon: Award,
    color: 'text-blue-800 bg-blue-50 border-blue-100',
  },
  {
    id: 'f-19',
    title: 'Backup & Restore',
    desc: 'Secure data backup',
    icon: HardDriveDownload,
    color: 'text-slate-700 bg-slate-100 border-slate-200',
  },
];

import { useCms } from '../context/CmsContext';

interface AddonFeatureItem {
  id: string;
  title: string;
  side: 'left' | 'right';
  sideLabel: string;
  tagline: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  color: string;
  highlights: string[];
}

const ADDON_FEATURES: AddonFeatureItem[] = [
  {
    id: 'addon-1',
    title: 'Custom Domain',
    side: 'left',
    sideLabel: 'Left Add-on',
    tagline: 'Your Own Dedicated Web Address',
    desc: 'Connect your own branded domain (e.g. www.yourlab.com or yourlab.in) instead of a subdomain for instant local patient trust and search credibility.',
    icon: Globe,
    badge: 'Popular Add-on',
    color: 'text-[#123B6D] bg-blue-50 border-blue-200',
    highlights: [
      'Dedicated Domain Binding (.com, .in, etc.)',
      'Free Lifetime SSL Certificate (HTTPS Secure)',
      'Automated DNS Routing & Fast CNAME Setup',
      'Boosts Local Patient Trust & Google Search SEO',
    ],
  },
  {
    id: 'addon-2',
    title: 'Professional Email',
    side: 'right',
    sideLabel: 'Right Add-on',
    tagline: 'Custom Corporate Mailbox',
    desc: 'Create personalized business email addresses matching your domain (e.g. contact@yourlab.com or reports@yourlab.com) with secure webmail sync.',
    icon: Mail,
    badge: 'Business Identity',
    color: 'text-[#0F766E] bg-teal-50 border-teal-200',
    highlights: [
      'Custom Corporate Mailbox on Your Domain',
      'Webmail, Outlook, Gmail & Mobile IMAP Sync',
      'Built-in Anti-Spam & Phishing Defense',
      'Direct Doctor Referrals & Corporate Lab Credibility',
    ],
  },
];

interface FeaturesSectionProps {
  onExploreFeatures?: () => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = () => {
  const { openRegisterLabModal } = useCms();

  return (
    <section
      id="features-section"
      className="py-14 sm:py-20 bg-linear-to-b from-white via-slate-50/50 to-white border-b border-slate-200 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* ========================================================
            SECTION HEADER
            ======================================================== */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#123B6D]/10 border border-[#123B6D]/15 text-[#123B6D] text-xs font-bold tracking-wide uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Complete Pathology System</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#123B6D] tracking-tight">
            Core Features
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
            Everything your laboratory needs to streamline reception, phlebotomy, diagnostics, billing, and automated patient delivery.
          </p>
        </div>

        {/* ========================================================
            CORE FEATURES GRID:
            - Mobile: 3 features per row (grid-cols-3) -> 7 rows (6x3=18, last=1)
            - Desktop: 4 features per row (md:grid-cols-4) -> 5 rows
            ======================================================== */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 lg:gap-5">
          {CORE_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="group relative p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white hover:border-[#123B6D]/40 hover:shadow-md transition-all duration-200 flex flex-col items-center sm:items-start text-center sm:text-left h-full"
              >
                {/* Feature Icon */}
                <div
                  className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 mb-2 sm:mb-3 border transition-transform duration-200 group-hover:scale-105 ${feat.color}`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>

                {/* Feature Title */}
                <h3 className="text-[11px] sm:text-sm font-bold text-slate-900 tracking-tight leading-snug sm:leading-normal">
                  {feat.title}
                </h3>

                {/* Feature Description */}
                <p className="text-[9.5px] sm:text-xs text-slate-500 mt-1 leading-tight sm:leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* ========================================================
            ADD-ON FEATURES: Core ke neeche separate section
            - Left: Custom Domain
            - Right: Professional Email
            ======================================================== */}
        <div className="mt-14 sm:mt-18 pt-12 sm:pt-14 border-t border-slate-200">
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

          {/* 2-Feature Row: Left (Custom Domain) & Right (Professional Email) */}
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

                {/* Feature Highlights */}
                <div className="mt-5 pt-4 border-t border-blue-100 space-y-2.5 text-xs">
                  {ADDON_FEATURES[0].highlights.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{item}</span>
                    </div>
                  ))}
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

                {/* Feature Highlights */}
                <div className="mt-5 pt-4 border-t border-teal-100 space-y-2.5 text-xs">
                  {ADDON_FEATURES[1].highlights.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{item}</span>
                    </div>
                  ))}
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

      </div>
    </section>
  );
};

