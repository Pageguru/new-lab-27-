/**
 * Central Domain Configuration for INDIANLALAJI.COM Healthcare Platform
 * "Har Lab Ka Apna URL" - Every Diagnostic Lab has its own dedicated website URL & subdomain.
 */

export const SUPER_ADMIN_DOMAIN = 'indianlalaji.com';
export const SUPER_ADMIN_NAME = 'INDIANLALAJI.COM';
export const SUPER_ADMIN_EMAIL = 'admin@indianlalaji.com';
export const SUPPORT_PHONE = '7087033009';
export const SUPPORT_PHONE_FORMATTED = '+91 7087033009';

/**
 * Returns clean subdomain slug for a lab (e.g. 'apexdiagnostics' from 'apexdiagnostics.indianlalaji.com' or 'lab-apex')
 */
export function getTenantSubdomain(subdomainOrDomain?: string): string {
  if (!subdomainOrDomain) return 'apexdiagnostics';
  const clean = subdomainOrDomain.trim().toLowerCase().replace(/^https?:\/\//, '');
  if (clean.includes('.')) {
    return clean.split('.')[0];
  }
  return clean.replace(/^lab-/, '');
}

/**
 * Returns the 100% working live direct link for any browser without requiring wildcard DNS setup
 * e.g. https://<domain>/?lab=sanjivanipath or https://indianlalaji.com/?lab=sanjivanipath
 */
export function getTenantDirectUrl(subdomainOrDomain?: string): string {
  const cleanSub = getTenantSubdomain(subdomainOrDomain);
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/?lab=${cleanSub}`;
  }
  return `https://${SUPER_ADMIN_DOMAIN}/?lab=${cleanSub}`;
}

/**
 * Returns formatted canonical website/app URL for a tenant or platform service
 * e.g., https://apexdiagnostics.indianlalaji.com or custom domain https://apexdiagnostics.in
 */
export function getTenantWebsiteUrl(subdomainOrDomain?: string): string {
  if (!subdomainOrDomain) return `https://apexdiagnostics.${SUPER_ADMIN_DOMAIN}`;
  const clean = subdomainOrDomain.trim().toLowerCase().replace(/^https?:\/\//, '');
  if (clean.includes('.')) {
    return `https://${clean}`;
  }
  return `https://${clean}.${SUPER_ADMIN_DOMAIN}`;
}

/**
 * Generates an active, interactive preview link that works directly in the user's browser/preview
 * as well as direct link on indianlalaji.com
 */
export function getTenantBrowserUrl(subdomainOrDomain: string, targetView: string = 'vendor_website'): string {
  const cleanSub = getTenantSubdomain(subdomainOrDomain);
  if (typeof window !== 'undefined' && window.location.origin) {
    const origin = window.location.origin;
    // If running on actual indianlalaji.com domain
    if (window.location.hostname.endsWith(SUPER_ADMIN_DOMAIN)) {
      return `https://${cleanSub}.${SUPER_ADMIN_DOMAIN}`;
    }
    // In preview / container / local dev: generate accessible deep link
    return `${origin}/?lab=${cleanSub}&view=${targetView}`;
  }
  return `https://${cleanSub}.${SUPER_ADMIN_DOMAIN}`;
}

export function getSuperAdminDashboardUrl(): string {
  return `https://${SUPER_ADMIN_DOMAIN}/admin`;
}
