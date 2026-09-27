import React, { useState } from 'react';
import {
  Headphones,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  Building,
  HelpCircle,
  PhoneCall,
  Send,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';

export const VendorTechSupportTab: React.FC = () => {
  const { vendorLabSettings, currentUser } = useCms();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const [issueCategory, setIssueCategory] = useState('Report & Billing Help');
  const [issueMessage, setIssueMessage] = useState('');

  const supportEmail = 'Info@indianlalaji.com';
  const supportPhone = '7087033009';
  const supportPhoneFormatted = '70870 33009';
  const supportHours = 'Monday–Friday';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2500);
  };

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const labName = vendorLabSettings.labName || 'Laboratory';
    const labId = vendorLabSettings.labShopId || 'LSP-7087';
    const userName = currentUser?.name || 'Lab Administrator';

    const fullMessage = `Hello IndianLalaji Tech Support Team,\n\n*Lab Name:* ${labName} (${labId})\n*Contact Person:* ${userName}\n*Topic:* ${issueCategory}\n\n*Message:* ${issueMessage.trim() || 'Need technical assistance.'}`;

    const waUrl = `https://wa.me/91${supportPhone}?text=${encodeURIComponent(fullMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {copiedItem && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>Copied {copiedItem} to clipboard!</span>
        </div>
      )}

      {/* Main Header Strip */}
      <div className="bg-gradient-to-r from-[#123B6D] via-[#0F355F] to-[#0A2540] text-white p-6 sm:p-7 rounded-3xl shadow-md border border-[#123B6D]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold mb-2">
            <Headphones className="w-3.5 h-3.5 text-amber-300" />
            <span>Section 12 • Priority Support & Technical Helpdesk</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            12. Tech Support
          </h2>
          <p className="text-xs sm:text-sm text-slate-200/90 mt-1 max-w-2xl">
            Direct priority technical assistance for laboratory software operations, reports, billing, online tests catalog, and system inquiries.
          </p>
        </div>

        {/* Quick Lab Identity Tag */}
        <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-2xl border border-white/15 backdrop-blur-xs shrink-0">
          <Building className="w-5 h-5 text-amber-300" />
          <div className="text-right sm:text-left">
            <div className="text-xs font-bold text-white truncate max-w-[200px]">
              {vendorLabSettings.labName || 'Laboratory'}
            </div>
            <div className="text-[11px] text-slate-300 font-mono">
              ID: {vendorLabSettings.labShopId || 'LSP-7087'} • {vendorLabSettings.city || 'Central'}
            </div>
          </div>
        </div>
      </div>

      {/* 3-GRID CARDS FOR THE REQUESTED CONTACT DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {/* CARD 1: EMAIL SUPPORT */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 transition">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
                <Mail className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider">
                Official Email
              </span>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Email Support
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Send official inquiries, attachments, or bug reports
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">
                Support Email
              </div>
              <div className="text-sm sm:text-base font-mono font-bold text-indigo-950 truncate select-all">
                {supportEmail}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={`mailto:${supportEmail}?subject=Tech%20Support%20Request%20-%20${encodeURIComponent(vendorLabSettings.labName || 'Lab')}`}
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer text-center"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Mail</span>
            </a>
            <button
              type="button"
              onClick={() => copyToClipboard(supportEmail, 'Email Address')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
        </div>

        {/* CARD 2: WHATSAPP SUPPORT */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-400 transition ring-2 ring-emerald-500/10">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Fastest Response</span>
              </span>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                WhatsApp Support
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Instant chat assistance with dedicated technical agents
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-slate-800">
              <div className="text-[11px] font-semibold text-emerald-800 uppercase">
                WhatsApp Number
              </div>
              <div className="text-base font-mono font-black text-emerald-950 select-all">
                {supportPhoneFormatted} <span className="text-xs text-emerald-700 font-sans font-medium">(WhatsApp)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={`https://wa.me/91${supportPhone}?text=${encodeURIComponent(`Hello IndianLalaji Tech Support Team, I need assistance with lab: ${vendorLabSettings.labName || 'Laboratory'}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer text-center"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat Now</span>
            </a>
            <button
              type="button"
              onClick={() => copyToClipboard(supportPhone, 'WhatsApp Number')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
        </div>

        {/* CARD 3: SCHEDULE & TIMINGS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-300 transition">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                Support Schedule
              </span>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Working Days
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Active business hours for technical escalations
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-slate-800">
              <div className="text-[11px] font-semibold text-amber-800 uppercase">
                Operating Days
              </div>
              <div className="text-base font-black text-amber-950">
                {supportHours}
              </div>
              <div className="text-xs text-slate-600 mt-0.5 font-medium">
                9:30 AM – 7:00 PM IST
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>24/7 Automated Cloud & Backup Monitoring Active</span>
          </div>
        </div>
      </div>

      {/* QUICK INQUIRY / TICKET SUBMISSION FORM (OPENS WHATSAPP WITH STRUCTURED QUERY) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#123B6D] border border-blue-200 flex items-center justify-center font-bold shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Quick Tech Support Message (WhatsApp Dispatch)
              </h3>
              <p className="text-xs text-slate-500">
                Type your inquiry below and dispatch directly to the IndianLalaji support desk in 1-click
              </p>
            </div>
          </div>

          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
            Priority Queue
          </span>
        </div>

        <form onSubmit={handleSendWhatsApp} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Support Category
              </label>
              <select
                value={issueCategory}
                onChange={(e) => setIssueCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] bg-white"
              >
                <option value="Report & Billing Help">📄 Patient Reports & Billing Dues</option>
                <option value="Website Configuration">🌐 Website Domain & Sections ON/OFF</option>
                <option value="Tests Catalog & Pricing">🧪 Tests Catalog, Packages & Prices</option>
                <option value="Staff Roles & Passwords">🔐 Staff Accounts & Permissions</option>
                <option value="Full Website Backup Restore">💾 Backup Download / Restore Assistance</option>
                <option value="General Technical Question">❓ General Technical Support</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Laboratory ID & Name
              </label>
              <input
                type="text"
                disabled
                value={`${vendorLabSettings.labName} (${vendorLabSettings.labShopId || 'LSP-7087'})`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium bg-slate-50 text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Describe your question or technical issue
            </label>
            <textarea
              rows={3}
              value={issueMessage}
              onChange={(e) => setIssueMessage(e.target.value)}
              placeholder="e.g. Please help configure our custom header logo or verify the WhatsApp delivery gateway for patient reports..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D]"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Available <strong>Monday–Friday</strong> • Direct WhatsApp escalation: <strong>{supportPhoneFormatted}</strong></span>
            </div>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs sm:text-sm px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send via WhatsApp (70870 33009)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
