import { AppView } from '../types';

export interface DomainRouteResolution {
  view: AppView;
  targetLab?: string;
  isPlatformSubdomain?: boolean;
  isExplicitMainPlatform?: boolean;
}

const VALID_VIEWS: AppView[] = [
  'vendor_dashboard',
  'branch_manager_dashboard',
  'reception_dashboard',
  'technician_dashboard',
  'pathologist_dashboard',
  'admin_dashboard',
  'vendor_website',
  'website',
  'patient_portal',
  'lab_app',
];

/**
 * Resolves the active application view and lab tenant based on domain, subdomains, URL paths, and query parameters.
 * 
 * Rules:
 * 1. indianlalaji.com/shop/VENDOR_ID -> Vendor Lab Website ('vendor_website') for that vendor
 * 2. indianlalaji.com / www.indianlalaji.com -> Main Platform Website ('website')
 * 3. <vendor>.indianlalaji.com -> Vendor Lab Website ('vendor_website') for that vendor
 * 4. indianlalaji.com/?lab=<vendor> or ?shop=<vendor> -> Vendor Lab Website ('vendor_website')
 * 5. app.indianlalaji.com -> Lab Management Software ('lab_app')
 * 6. report.indianlalaji.com -> Patient Report Portal ('patient_portal')
 * 7. admin.indianlalaji.com -> Super Admin Dashboard ('admin_dashboard')
 * 8. Custom domains (e.g. citycarelabs.com) -> Vendor Lab Website ('vendor_website')
 * 9. Any explicit ?view= parameter takes priority for navigation
 */
export function resolveAppRoute(
  hostname: string,
  search: string,
  vendorLabsList?: Array<{ id: string; domainPreview?: string; phone?: string; slug?: string }>,
  pathname?: string
): DomainRouteResolution {
  const cleanHost = (hostname || '').toLowerCase().trim().replace(/^https?:\/\//, '').split(':')[0];
  const params = new URLSearchParams(search);
  const viewParam = params.get('view') as AppView | null;
  const labParam = params.get('lab') || params.get('subdomain');
  const shopParam = params.get('shop');
  const effectivePath = pathname !== undefined ? pathname : (typeof window !== 'undefined' ? window.location.pathname : '');

  // 0. Primary Vendor Shop URL Pattern: indianlalaji.com/shop/VENDOR_ID or /shop/VENDOR_ID
  const shopMatch = effectivePath.match(/^\/shop\/([^/?#]+)/i);
  if (shopMatch && shopMatch[1]) {
    const rawTarget = decodeURIComponent(shopMatch[1]).trim();
    // Resolve vendor from vendorLabsList if available
    let resolvedVendorId = rawTarget;
    if (vendorLabsList && vendorLabsList.length > 0) {
      const match = vendorLabsList.find((l) => {
        const idLower = l.id.toLowerCase();
        const targetLower = rawTarget.toLowerCase();
        if (idLower === targetLower) return true;
        if (idLower === `lab-${targetLower}` || idLower.replace(/^lab-/, '') === targetLower.replace(/^lab-/, '')) return true;
        if (l.domainPreview && l.domainPreview.toLowerCase().includes(targetLower)) return true;
        if (l.phone && l.phone.replace(/\D/g, '') === targetLower.replace(/\D/g, '')) return true;
        if (l.slug && l.slug.toLowerCase() === targetLower) return true;
        return false;
      });
      if (match) {
        resolvedVendorId = match.id;
      }
    }

    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
      targetLab: resolvedVendorId,
    };
  }

  // 0b. Direct shop query parameter: ?shop=VENDOR_ID
  if (shopParam) {
    const rawTarget = decodeURIComponent(shopParam).trim();
    let resolvedVendorId = rawTarget;
    if (vendorLabsList && vendorLabsList.length > 0) {
      const match = vendorLabsList.find((l) => {
        const idLower = l.id.toLowerCase();
        const targetLower = rawTarget.toLowerCase();
        if (idLower === targetLower) return true;
        if (idLower === `lab-${targetLower}` || idLower.replace(/^lab-/, '') === targetLower.replace(/^lab-/, '')) return true;
        if (l.domainPreview && l.domainPreview.toLowerCase().includes(targetLower)) return true;
        if (l.slug && l.slug.toLowerCase() === targetLower) return true;
        return false;
      });
      if (match) {
        resolvedVendorId = match.id;
      }
    }
    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
      targetLab: resolvedVendorId,
    };
  }

  // 0c. Standalone PWA detection: If user opens installed app from mobile home screen at root /
  if (typeof window !== 'undefined' && (effectivePath === '/' || effectivePath === '')) {
    try {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      if (isStandalone && !viewParam && !labParam && !shopParam) {
        const installedSlug =
          localStorage.getItem('cms_installed_vendor_app_slug') ||
          localStorage.getItem('cms_installed_vendor_app_id');
        if (installedSlug) {
          return {
            view: 'vendor_website',
            targetLab: installedSlug,
          };
        }
      }
    } catch {}
  }

  // 1. Check for platform root domain (indianalala.com, indianlalaji.com, or www.*)
  const isMainRootDomain =
    cleanHost === 'indianalala.com' ||
    cleanHost === 'www.indianalala.com' ||
    cleanHost === 'indianlalaji.com' ||
    cleanHost === 'www.indianlalaji.com';

  // 2. Check for subdomains on indianalala.com or indianlalaji.com
  let hostSubdomain: string | null = null;
  const isMatchedBaseDomain = cleanHost.endsWith('indianalala.com') || cleanHost.endsWith('indianlalaji.com');
  if (isMatchedBaseDomain && !isMainRootDomain) {
    const withoutSuffix = cleanHost.replace(/\.?(indianalala|indianlalaji)\.com$/, '');
    const parts = withoutSuffix.split('.');
    const sub = parts[parts.length - 1];
    if (sub && sub !== 'www') {
      hostSubdomain = sub;
    }
  }

  // 3. Platform reserved subdomains
  if (hostSubdomain === 'app') {
    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'lab_app',
      isPlatformSubdomain: true,
    };
  }
  if (hostSubdomain === 'report' || hostSubdomain === 'reports') {
    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'patient_portal',
      targetLab: labParam || undefined,
      isPlatformSubdomain: true,
    };
  }
  if (hostSubdomain === 'admin') {
    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'admin_dashboard',
      isPlatformSubdomain: true,
    };
  }
  if (hostSubdomain === 'reception') {
    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'reception_dashboard',
      isPlatformSubdomain: true,
    };
  }

  // 4. Vendor Subdomain on indianlalaji.com (e.g. apexdiagnostics.indianlalaji.com)
  // Each vendor has their own dedicated subdomain URL
  if (hostSubdomain) {
    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
      targetLab: hostSubdomain,
    };
  }

  // 5. Vendor direct link fallback parameter (?lab=<subdomain> or ?subdomain=<slug>)
  if (labParam) {
    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
      targetLab: labParam,
    };
  }

  // 6. Custom Domain Mapping check (e.g. citycarelabs.com or apexpathology.in)
  if (
    !isMainRootDomain &&
    cleanHost !== 'localhost' &&
    cleanHost !== '127.0.0.1' &&
    !cleanHost.includes('.run.app') &&
    !cleanHost.includes('.aistudio-preview.com') &&
    vendorLabsList &&
    vendorLabsList.length > 0
  ) {
    const matchedLab = vendorLabsList.find((l) => {
      const dp = (l.domainPreview || '').toLowerCase().trim();
      return dp === cleanHost || dp.replace(/^www\./, '') === cleanHost.replace(/^www\./, '');
    });
    if (matchedLab) {
      return {
        view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
        targetLab: matchedLab.id,
      };
    }
  }

  // 7. Explicit ?view= parameter in URL
  if (viewParam && VALID_VIEWS.includes(viewParam)) {
    return { view: viewParam };
  }

  // 8. Main Root Domain (indianlalaji.com) without ?lab or ?view:
  // ALWAYS opens the main company website ('website'). NEVER opens vendor_website!
  if (isMainRootDomain) {
    return {
      view: 'website',
      isExplicitMainPlatform: true,
    };
  }

  // 9. Default fallback (Preview / Localhost without query params)
  // Default is 'website' (The official INDIANLALAJI.COM Portal Homepage)
  return {
    view: 'website',
  };
}
