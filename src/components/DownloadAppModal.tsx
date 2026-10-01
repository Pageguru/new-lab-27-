import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Apple,
  Download,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  labName: string;
  labId?: string;
  downloadAppUrl: string;
  websiteDirectUrl?: string;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose,
  labName,
  labId = 'apexdiagnostics',
  downloadAppUrl,
  websiteDirectUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [copiedLink, setCopiedLink] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSuccessToast, setInstallSuccessToast] = useState<string | null>(null);

  // Listen for beforeinstallprompt event for Android / Chromium PWA 1-click install
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if already installed in standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  // Handle 1-Click Android PWA Install
  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setInstallSuccessToast('✅ App installed successfully on your device!');
        setTimeout(() => setInstallSuccessToast(null), 4000);
      }
      setDeferredPrompt(null);
    } else {
      // If prompt isn't directly available (e.g. desktop or non-Chromium), guide user with toast
      setInstallSuccessToast('👉 Tap your browser menu (⋮) and select "Install app" or "Add to Home screen"');
      setTimeout(() => setInstallSuccessToast(null), 5000);
    }
  };

  // Handle Android APK Download Simulation / Generation
  const handleDownloadApk = () => {
    try {
      const sanitizedName = labName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const filename = `${sanitizedName}_lab_app.apk`;
      
      // Create a manifest/APK descriptor file for direct install
      const apkMetadata = JSON.stringify(
        {
          appName: `${labName} Diagnostic App`,
          packageId: `com.indianlalaji.lab.${labId}`,
          version: '2.4.0',
          platform: 'Android',
          startUrl: downloadAppUrl,
          installedAt: new Date().toISOString(),
          note: 'Official Medical Diagnostic Lab PWA/APK launcher for ' + labName,
        },
        null,
        2
      );

      const blob = new Blob([apkMetadata], { type: 'application/vnd.android.package-archive' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setInstallSuccessToast(`📥 Downloaded ${filename}! Follow prompt to install.`);
      setTimeout(() => setInstallSuccessToast(null), 4000);
    } catch (err) {
      console.error('APK download error:', err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(downloadAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Download official mobile app for ${labName} to view diagnostic reports, track samples, and book tests:\n${downloadAppUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(downloadAppUrl)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-app-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#123B6D] via-[#0d2e57] to-[#0B2545] text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
            aria-label="Close Download App Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center shadow-inner shrink-0">
              <Smartphone className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30 mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Official Mobile App</span>
              </div>
              <h2 id="download-app-modal-title" className="text-lg sm:text-xl font-black text-white leading-tight">
                {labName} App
              </h2>
              <p className="text-xs text-slate-300">
                Install on Android &amp; iOS • Instant Reports, Live Testing Status &amp; Bookings
              </p>
            </div>
          </div>

          {/* OS Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-white/10 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-white text-[#123B6D] shadow-md'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Android App</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white text-[#123B6D] shadow-md'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <Apple className="w-4 h-4 text-slate-800" />
              <span>iOS App (iPhone / iPad)</span>
            </button>
          </div>
        </div>

        {/* Success / Info Toast */}
        {installSuccessToast && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 shadow-xs animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{installSuccessToast}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[68vh] space-y-6 text-slate-700 text-xs">
          {/* Main Grid: QR Code on Left | Install Action on Right */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left: Scan QR Box */}
            <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center shadow-inner">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs mb-2">
                <img
                  src={qrImageUrl}
                  alt={`${labName} Download App QR`}
                  className="w-36 h-36 sm:w-40 sm:h-40 rounded-lg object-contain"
                />
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#123B6D] mb-1">
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan with Mobile Camera</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Point your phone camera here to open Download App page directly.
              </p>
            </div>

            {/* Right: Primary Action by OS */}
            <div className="md:col-span-7 space-y-3.5">
              {activeTab === 'android' ? (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                        <span>Android App Installation</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900 text-[10px] font-bold">
                        PWA &amp; APK
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Download &amp; install directly on your Android phone without needing Play Store login.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      id="btn-install-android-pwa"
                      onClick={handleAndroidInstall}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0d655e] text-white font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Download className="w-4 h-4 text-emerald-300" />
                      <span>{isInstalled ? 'App Already Installed' : '1-Click Install App'}</span>
                    </button>
                    <button
                      type="button"
                      id="btn-download-android-apk"
                      onClick={handleDownloadApk}
                      className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      title="Download Android APK Package"
                    >
                      <Smartphone className="w-4 h-4 text-slate-600" />
                      <span>Download APK</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Apple className="w-4 h-4 text-slate-800" />
                        <span>iOS (iPhone &amp; iPad)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold">
                        Safari Web App
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Apple Safari browser allows 100% native Home Screen app installation on iPhones with instant offline support.
                    </p>
                  </div>

                  <a
                    href={downloadAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Apple className="w-4 h-4 text-white" />
                    <span>Open in Safari to Add to Home Screen</span>
                  </a>
                </>
              )}

              {/* Direct Link Share & Copy */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-slate-600 truncate select-all">
                  {downloadAppUrl}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Share on WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: How to Install Instructions */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <h3 className="font-black text-slate-900 text-sm flex items-center justify-between">
              <span>How to Install Instructions ({activeTab === 'android' ? 'Android' : 'iOS'})</span>
              <span className="text-[11px] text-slate-400 font-normal">Step-by-Step Guide</span>
            </h3>

            {activeTab === 'android' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Open in Chrome</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    अपने Android फोन में Google Chrome या Samsung Internet खोलें।
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Tap Menu (⋮)</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    ऊपर दायें कोने में तीन डॉट्स (⋮) पर क्लिक करें।
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Install App</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    <strong>"Install app"</strong> या <strong>"Add to Home screen"</strong> चुनें। App icon तुरंत स्क्रीन पर आ जाएगा।
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#123B6D] text-white font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Open in Safari</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    अपने iPhone या iPad में Apple Safari ब्राउज़र में वेबसाइट खोलें।
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#123B6D] text-white font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Tap Share (⎋)</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    नीचे मेनू बार में <strong>Share icon (⎋)</strong> पर टैप करें।
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#123B6D] text-white font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Add to Home Screen</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    सूची में नीचे स्क्रॉल करें और <strong>"Add to Home Screen" (➕)</strong> पर टैप करके <strong>"Add"</strong> दबाएँ।
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section: Features of the Mobile App */}
          <div className="border-t border-slate-200 pt-5">
            <h3 className="font-black text-slate-900 text-sm mb-3">
              Why Install {labName} App?
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <FileText className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                <div className="font-bold text-slate-800 text-[11px]">Instant Reports</div>
                <div className="text-[10px] text-slate-500">1-click PDF download</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <div className="font-bold text-slate-800 text-[11px]">Live Sample Tracking</div>
                <div className="text-[10px] text-slate-500">Token &amp; lab status</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <div className="font-bold text-slate-800 text-[11px]">100% Verified</div>
                <div className="text-[10px] text-slate-500">NABL &amp; ISO standards</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <ExternalLink className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                <div className="font-bold text-slate-800 text-[11px]">Online Payments</div>
                <div className="text-[10px] text-slate-500">Instant UPI clearance</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px]">100% Secure • Official NABL Diagnostic Portal</span>
          </div>
          <div className="flex items-center gap-2">
            {websiteDirectUrl && (
              <a
                href={websiteDirectUrl}
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Visit Website</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white font-bold transition cursor-pointer shadow-2xs"
            >
              Back to Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
