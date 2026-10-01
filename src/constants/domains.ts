/**
 * Central Domain Configuration for INDIANLALAJI.COM Healthcare Platform
 * "Har Lab Ka Apna URL" - Every Diagnostic Lab has its own dedicated website shop URL:
 * Format: indianlalaji.com/shop/VENDOR_ID
 */

export const SUPER_ADMIN_DOMAIN = 'indianlalaji.com';
export const SUPER_ADMIN_NAME = 'INDIANLALAJI.COM';
export const SUPER_ADMIN_EMAIL = 'admin@indianlalaji.com';
export const SUPPORT_PHONE = '7087033009';
export const SUPPORT_PHONE_FORMATTED = '+91 7087033009';

/**
 * Returns clean vendor slug/ID for a lab (e.g. 'lab-apex', 'apexdiagnostics')
 */
export function getTenantSubdomain(subdomainOrDomain?: string): string {
  if (!subdomainOrDomain) return 'lab-apex';
  const clean = subdomainOrDomain.trim().toLowerCase().replace(/^https?:\/\//, '');
  if (clean.includes('/shop/')) {
    return clean.split('/shop/')[1].split('/')[0].split('?')[0];
  }
  if (clean.includes('.')) {
    const part = clean.split('.')[0];
    if (part !== 'indianlalaji' && part !== 'www') return part;
  }
  return clean;
}

/**
 * Returns canonical vendor shop URL on indianlalaji.com:
 * indianlalaji.com/shop/VENDOR_ID
 */
export function getVendorShopUrl(vendorIdOrSlug?: string): string {
  const cleanId = getTenantSubdomain(vendorIdOrSlug);
  return `https://${SUPER_ADMIN_DOMAIN}/shop/${cleanId}`;
}

/**
 * Returns relative pathname for vendor shop:
 * /shop/VENDOR_ID
 */
export function getTenantShopPath(vendorIdOrSlug?: string): string {
  const cleanId = getTenantSubdomain(vendorIdOrSlug);
  return `/shop/${cleanId}`;
}

/**
 * Returns the 100% working live direct link for any browser/environment:
 * e.g. https://<domain>/shop/VENDOR_ID or https://indianlalaji.com/shop/VENDOR_ID
 */
export function getTenantDirectUrl(subdomainOrDomain?: string): string {
  const cleanId = getTenantSubdomain(subdomainOrDomain);
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/shop/${cleanId}`;
  }
  return `https://${SUPER_ADMIN_DOMAIN}/shop/${cleanId}`;
}

/**
 * Returns formatted canonical website/shop URL for a vendor
 * e.g., https://indianlalaji.com/shop/VENDOR_ID or custom domain if configured
 */
export function getTenantWebsiteUrl(subdomainOrDomain?: string): string {
  if (!subdomainOrDomain) return `https://${SUPER_ADMIN_DOMAIN}/shop/lab-apex`;
  const clean = subdomainOrDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  // Custom domains without indianlalaji.com or indianalala.com
  if (clean.includes('.') && !clean.includes('indianlalaji.com') && !clean.includes('indianalala.com')) {
    return `https://${clean}`;
  }
  const cleanId = getTenantSubdomain(subdomainOrDomain);
  return `https://${SUPER_ADMIN_DOMAIN}/shop/${cleanId}`;
}

/**
 * Generates an active, interactive preview link that works directly in the user's browser/preview
 * as well as direct link on indianlalaji.com: indianlalaji.com/shop/VENDOR_ID
 */
export function getTenantBrowserUrl(subdomainOrDomain: string, targetView: string = 'vendor_website'): string {
  const cleanId = getTenantSubdomain(subdomainOrDomain);
  if (typeof window !== 'undefined' && window.location.origin) {
    const origin = window.location.origin;
    if (targetView === 'vendor_website') {
      return `${origin}/shop/${cleanId}`;
    }
    return `${origin}/?lab=${cleanId}&view=${targetView}`;
  }
  return `https://${SUPER_ADMIN_DOMAIN}/shop/${cleanId}`;
}

export function getSuperAdminDashboardUrl(): string {
  return `https://${SUPER_ADMIN_DOMAIN}/admin`;
}
