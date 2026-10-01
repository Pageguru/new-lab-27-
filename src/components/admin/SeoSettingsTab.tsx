import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  ExternalLink, 
  Search, 
  Share2, 
  FileText, 
  Save, 
  RefreshCw,
  Eye,
  CheckCircle2,
  Sliders,
  Layers,
  ShieldCheck,
  Smartphone,
  Laptop
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';

const FAVICON_PRESETS = [
  {
    name: 'Diagnostic Portal',
    url: '/icon.svg',
    description: 'Modern blue medical cross SVG',
  },
  {
    name: 'Classic Favicon',
    url: '/favicon.ico',
    description: 'Standard 32x32 ICO icon',
  },
  {
    name: 'Clinical Microscope',
    url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=128&h=128&q=80',
    description: 'High-res laboratory pathology icon',
  },
  {
    name: 'Healthcare Cross',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=128&h=128&q=80',
    description: 'Diagnostic medical symbol',
  },
];

const FEATURE_IMAGE_PRESETS = [
  {
    name: 'Automated Pathology Laboratory',
    url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
    description: 'Modern clinical analyzer & digital reports',
  },
  {
    name: 'Diagnostic Center & Blood Testing',
    url: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1200&q=80',
    description: 'NABL accredited laboratory setup',
  },
  {
    name: 'Medical Scientist at Workstation',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
    description: 'Professional diagnostic healthcare team',
  },
  {
    name: 'Indian Pathology Cloud Network',
    url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80',
    description: 'Full-featured diagnostic operating system',
  },
];

export const SeoSettingsTab: React.FC = () => {
  const { companySettings, updateCompanySettings } = useCms();

  const [siteName, setSiteName] = useState(
    companySettings.siteName || companySettings.companyName || 'INDIANLALAJI.COM'
  );
  const [tagline, setTagline] = useState(
    companySettings.tagline || 'Modern Pathology Laboratory & Diagnostic Operating System'
  );
  const [siteDescription, setSiteDescription] = useState(
    companySettings.siteDescription ||
    companySettings.heroSubtitle ||
    'Complete Diagnostic Lab OS: Offline-ready desktop billing, 500+ pre-configured tests, automated WhatsApp PDF reports, central administration, and instant patient results portal without login.'
  );
  const [faviconUrl, setFaviconUrl] = useState(
    companySettings.faviconUrl || '/icon.svg'
  );
  const [featureImageUrl, setFeatureImageUrl] = useState(
    companySettings.featureImageUrl ||
    companySettings.ogImageUrl ||
    'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80'
  );
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync if context updates
  useEffect(() => {
    if (companySettings.siteName) setSiteName(companySettings.siteName);
    else if (companySettings.companyName) setSiteName(companySettings.companyName);

    if (companySettings.tagline) setTagline(companySettings.tagline);
    if (companySettings.siteDescription) setSiteDescription(companySettings.siteDescription);
    if (companySettings.faviconUrl) setFaviconUrl(companySettings.faviconUrl);
    if (companySettings.featureImageUrl) setFeatureImageUrl(companySettings.featureImageUrl);
  }, [companySettings]);

  const handleSaveSeo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanSiteName = siteName.trim() || 'INDIANLALAJI.COM';
    const cleanTagline = tagline.trim();
    const cleanDesc = siteDescription.trim();
    const cleanFavicon = faviconUrl.trim() || '/icon.svg';
    const cleanFeatureImg = featureImageUrl.trim();

    // 1. Update Company Settings in CMS Context & Sync to Cloud
    updateCompanySettings({
      siteName: cleanSiteName,
      companyName: cleanSiteName, // Sync public brand name
      tagline: cleanTagline,
      siteDescription: cleanDesc,
      heroSubtitle: cleanDesc, // Also sync hero description
      faviconUrl: cleanFavicon,
      featureImageUrl: cleanFeatureImg,
      ogImageUrl: cleanFeatureImg,
    });

    // 2. Dynamically apply directly to document Head for instant 0ms preview
    if (typeof document !== 'undefined') {
      document.title = `${cleanSiteName} - ${cleanTagline}`;
      
      // Update Favicon
      let linkIcon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!linkIcon) {
        linkIcon = document.createElement('link');
        linkIcon.rel = 'icon';
        document.head.appendChild(linkIcon);
      }
      linkIcon.href = cleanFavicon;

      // Update Meta Description
      let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement;
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = cleanDesc;

      // Update OpenGraph Title, Description, Image
      const setMetaProperty = (prop: string, val: string) => {
        let el = document.querySelector(`meta[property='${prop}']`) as HTMLMetaElement;
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute('property', prop);
          document.head.appendChild(el);
        }
        el.content = val;
      };

      setMetaProperty('og:title', `${cleanSiteName} - ${cleanTagline}`);
      setMetaProperty('og:description', cleanDesc);
      setMetaProperty('og:image', cleanFeatureImg);
      setMetaProperty('og:site_name', cleanSiteName);

      // Twitter tags
      const setMetaName = (name: string, val: string) => {
        let el = document.querySelector(`meta[name='${name}']`) as HTMLMetaElement;
        if (!el) {
          el = document.createElement('meta');
          el.name = name;
          document.head.appendChild(el);
        }
        el.content = val;
      };
      setMetaName('twitter:title', `${cleanSiteName} - ${cleanTagline}`);
      setMetaName('twitter:description', cleanDesc);
      setMetaName('twitter:image', cleanFeatureImg);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#123B6D] via-[#0F766E] to-[#123B6D] text-white p-5 sm:p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SEO, Favicon &amp; Brand Settings</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Global Public Website &amp; App Interface Branding
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
              Favicon, Feature Image, Site Name, Tagline और Site Description — ये सभी settings पूरे Public Website, 
              TopBar, Navbar, Hero, Social Share Cards और Google Search रिजल्ट पर लाइव लागू होंगी।
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleSaveSeo()}
            className="self-start sm:self-center px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm transition shadow-md flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save &amp; Apply to Website</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong>Settings Live!</strong> Favicon, Site Name, Tagline, Feature Image &amp; Meta Description पूरे 
            Public Website और App Interface पर तुरंत लागू कर दिए गए हैं।
          </span>
        </div>
      )}

      {/* Main Grid: Form Controls on Left, Live Previews on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <form onSubmit={handleSaveSeo} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#123B6D]" />
                <span>Core SEO &amp; Brand Fields</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">100% Real-Time Reactive</span>
            </div>

            {/* 1. Site Name */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Site Name (वेबसाइट का मुख्य नाम) *
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. INDIANLALAJI.COM"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                TopBar, Navbar Brand, Footer और Browser Tab Title में प्रदर्शित होगा।
              </span>
            </div>

            {/* 2. Tagline */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Tagline (टैगलाइन / सब-टाइटल) *
              </label>
              <input
                type="text"
                required
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Modern Pathology Laboratory & Diagnostic Operating System"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 font-medium"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                वेबसाइट हेडर, बैनर और सर्च इंजन स्निपेट्स में मुख्य नाम के साथ दिखेगा।
              </span>
            </div>

            {/* 3. Site Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Site Description (मेटा विवरण / संक्षिप्त विवरण) *
              </label>
              <textarea
                rows={3}
                required
                value={siteDescription}
                onChange={(e) => setSiteDescription(e.target.value)}
                placeholder="Diagnostic Laboratory software summary for SEO & Social..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 resize-none font-medium leading-relaxed"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>Google Search व WhatsApp शेयरिंग कार्ड पर दिखने वाला विवरण।</span>
                <span className="font-mono text-slate-400">{siteDescription.length} characters</span>
              </div>
            </div>

            {/* 4. Favicon URL & Presets */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>Favicon URL (ब्राउज़र टैब आइकन) *</span>
                <span className="text-[10px] text-[#0F766E] font-bold">Recommended: SVG / ICO / PNG (32x32)</span>
              </label>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  <img
                    src={faviconUrl}
                    alt="Favicon Preview"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icon.svg';
                    }}
                    className="w-7 h-7 object-contain"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  placeholder="/icon.svg or https://..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30"
                />
              </div>

              {/* Favicon Presets */}
              <div className="mt-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  ⚡ 1-Click Favicon Presets:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FAVICON_PRESETS.map((fav) => (
                    <button
                      key={fav.name}
                      type="button"
                      onClick={() => setFaviconUrl(fav.url)}
                      className={`p-2 rounded-lg border text-left transition flex items-center gap-2 cursor-pointer ${
                        faviconUrl === fav.url
                          ? 'border-[#123B6D] bg-blue-50/80 text-[#123B6D] ring-1 ring-[#123B6D]'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <img src={fav.url} alt="" className="w-5 h-5 object-contain shrink-0" />
                      <div className="truncate">
                        <div className="text-[11px] font-bold truncate">{fav.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Feature Image (OpenGraph / Social Card) */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>Feature Image URL (सोशल शेयर कार्ड व बैनर इमेज) *</span>
                <span className="text-[10px] text-[#0F766E] font-bold">Recommended: 1200 x 630 px</span>
              </label>

              <div className="flex items-center gap-3">
                <div className="w-16 h-11 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shrink-0 shadow-2xs">
                  <img
                    src={featureImageUrl}
                    alt="Feature Preview"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80';
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={featureImageUrl}
                  onChange={(e) => setFeatureImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30"
                />
              </div>

              {/* Feature Image Presets */}
              <div className="mt-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  ⚡ High-Resolution Lab Banner Presets:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FEATURE_IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setFeatureImageUrl(preset.url)}
                      className={`p-2 rounded-lg border text-left transition flex items-center gap-2.5 cursor-pointer ${
                        featureImageUrl === preset.url
                          ? 'border-[#123B6D] bg-blue-50/80 text-[#123B6D] ring-1 ring-[#123B6D]'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <img src={preset.url} alt="" className="w-10 h-7 rounded object-cover shrink-0" />
                      <div className="truncate">
                        <div className="text-[11px] font-bold truncate">{preset.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{preset.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white font-bold text-xs transition shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save All SEO Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Previews (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Preview Container */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#123B6D]" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Live Previews
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1 rounded cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-[#123B6D] text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Desktop Preview"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1 rounded cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-[#123B6D] text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Mobile Preview"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 1. Browser Tab Mockup */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                1. Browser Tab Mockup (ब्राउज़र टैब)
              </span>
              <div className="bg-slate-200 rounded-t-xl px-3 pt-2 pb-0 flex items-center gap-2 border-b border-slate-300">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                {/* Active Tab */}
                <div className="bg-white rounded-t-lg px-3 py-1.5 flex items-center gap-2 max-w-[240px] shadow-2xs border-t border-x border-slate-300 text-[11px] font-medium text-slate-800">
                  <img
                    src={faviconUrl}
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icon.svg';
                    }}
                    className="w-3.5 h-3.5 object-contain shrink-0"
                  />
                  <span className="truncate">{siteName} - {tagline}</span>
                </div>
              </div>
              <div className="bg-white border-x border-b border-slate-200 p-2 text-[10px] font-mono text-slate-400 flex items-center gap-2">
                <span className="text-emerald-700 font-bold">https://</span>
                <span className="text-slate-600 font-bold">{companySettings.platformDomain || 'indianlalaji.com'}</span>
              </div>
            </div>

            {/* 2. Google Search Result Mockup */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Search className="w-3 h-3" />
                <span>2. Google Search Result (Google SERP Snippet)</span>
              </span>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1 shadow-2xs">
                <div className="flex items-center gap-2 text-[11px] text-slate-700 font-medium">
                  <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center p-0.5 border border-slate-200 overflow-hidden">
                    <img
                      src={faviconUrl}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/icon.svg';
                      }}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-slate-900">{siteName}</span>
                    <span className="text-slate-400 ml-1">https://{companySettings.platformDomain || 'indianlalaji.com'}</span>
                  </div>
                </div>
                <div className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-1">
                  {siteName} — {tagline}
                </div>
                <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                  {siteDescription}
                </p>
              </div>
            </div>

            {/* 3. WhatsApp / Social Media Share Card */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Share2 className="w-3 h-3 text-emerald-600" />
                <span>3. WhatsApp / Social Share Card (OpenGraph)</span>
              </span>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-w-[340px] mx-auto">
                {/* Feature Image Banner */}
                <div className="h-36 bg-slate-100 relative overflow-hidden">
                  <img
                    src={featureImageUrl}
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80';
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono">
                    OpenGraph Preview
                  </div>
                </div>
                {/* Card Text Content */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    {companySettings.platformDomain || 'indianlalaji.com'}
                  </div>
                  <div className="text-xs font-bold text-slate-900 line-clamp-1">
                    {siteName} — {tagline}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                    {siteDescription}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Info */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 text-[11px] text-blue-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#123B6D]" />
                <span>Applied Components Across Platform:</span>
              </div>
              <ul className="list-disc list-inside text-blue-900/90 space-y-0.5 pl-1">
                <li>Navbar &amp; TopBar Site Logo &amp; Brand Name</li>
                <li>Browser Document Title &amp; Favicon (`link[rel="icon"]`)</li>
                <li>Meta Description &amp; OpenGraph Social Cards</li>
                <li>Public Website Footer Brand &amp; Tagline</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
