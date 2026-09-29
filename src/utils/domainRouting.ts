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
 * Resolves the active application view and lab tenant based on domain, subdomains, and URL parameters.
 * 
 * Rules:
 * 1. indianlalaji.com / www.indianlalaji.com -> Main Platform Website ('website')
 * 2. <vendor>.indianlalaji.com -> Vendor Lab Website ('vendor_website') for that vendor
 * 3. indianlalaji.com/?lab=<vendor> -> Vendor Lab Website ('vendor_website') for that vendor
 * 4. app.indianlalaji.com -> Lab Management Software ('lab_app')
 * 5. report.indianlalaji.com -> Patient Report Portal ('patient_portal')
 * 6. admin.indianlalaji.com -> Super Admin Dashboard ('admin_dashboard')
 * 7. Custom domains (e.g. citycarelabs.com) -> Vendor Lab Website ('vendor_website')
 * 8. Any explicit ?view= parameter takes priority for navigation
 */
export function resolveAppRoute(
  hostname: string,
  search: string,
  vendorLabsList?: Array<{ id: string; domainPreview?: string }>
): DomainRouteResolution {
  const cleanHost = (hostname || '').toLowerCase().trim().replace(/^https?:\/\//, '').split(':')[0];
  const params = new URLSearchParams(search);
  const viewParam = params.get('view') as AppView | null;
  const labParam = params.get('lab') || params.get('subdomain');

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
