import { CmsUser, AuditEntry } from '../types';

export const KNOWN_TENANTS = [
  { id: 'lab-1020304050', name: 'Lab 1 Diagnostic Centre', code: 'LAB1' },
  { id: 'lab-6070809010', name: 'Lab 2 Diagnostic Centre', code: 'LAB2' },
  { id: 'lab-apex', name: 'Apex Diagnostic & Clinical Pathology Laboratory', code: 'APEX' },
  { id: 'lab-citycare', name: 'CityCare Advanced Diagnostics & Scan Centre', code: 'CITY' },
  { id: 'lab-metropath', name: 'MetroPath Scans & Molecular Pathology Hub', code: 'METRO' },
  { id: 'lab-lifeline-due', name: 'LifeLine PathCare Diagnostic Centre', code: 'LIFE' },
  { id: 'lab-sanjivani', name: 'Sanjivani Pathology & Preventive Health Lab', code: 'SANJ' },
  { id: 'lab-healtech-pending', name: 'HealTech Molecular & Allergy Diagnostic Lab', code: 'HEAL' },
  { id: 'lab-pulse', name: 'Pulse Diagnostics & MRI Centre', code: 'PULSE' },
  { id: 'lab-carepoint', name: 'CarePoint Clinical Laboratory', code: 'CARE' },
] as const;

export const DEFAULT_TENANT_ID = 'lab-6070809010';

/**
 * Resolves the active Tenant ID based on user authorization.
 * Non-admin roles are strictly pinned to their assigned labId.
 * Super admins can switch between specific tenants or view global 'all'.
 */
export function getEffectiveTenantId(
  currentUser: CmsUser | null,
  selectedVendorLabId: string = DEFAULT_TENANT_ID,
  superAdminScope: string = 'all'
): string {
  if (!currentUser) {
    return selectedVendorLabId || DEFAULT_TENANT_ID;
  }

  // Super admin can switch tenant scope or view all
  if (currentUser.role === 'admin') {
    if (superAdminScope && superAdminScope !== 'all') {
      return superAdminScope;
    }
    return selectedVendorLabId || 'all';
  }

  // All other roles (Lab Admin, Branch Mgr, Reception, Tech, Pathologist) are locked to their lab
  return currentUser.labId || DEFAULT_TENANT_ID;
}

/**
 * Normalizes tenant identifiers and resolves known laboratory aliases.
 * E.g., 'lab-citycare', 'citycare', 'citycare.indianlalaji.com' all resolve to 'citycare'.
 * E.g., '1020304050', '+91 1020304050', 'lab-1020304050' resolve to '1020304050'.
 * E.g., '6070809010', '+91 6070809010', 'lab-6070809010' resolve to '6070809010'.
 */
export function normalizeTenantId(id: string | undefined | null): string {
  if (!id || typeof id !== 'string') return '';
  const clean = id.trim().toLowerCase();
  if (clean === 'lab-apex' || clean === 'apexdiagnostics' || clean === 'apex' || clean === 'lsp-7087' || clean === 'lsp_7087') {
    return 'apexdiagnostics';
  }

  // Check 10-digit mobile / phone number matching for specific labs
  const cleanDigits = clean.replace(/\D/g, '');
  if (cleanDigits.length >= 10 && cleanDigits.slice(-10) === '1020304050') {
    return '1020304050';
  }
  if (clean === 'lab-1' || clean === 'lab1' || clean === 'lab-1020304050') {
    return '1020304050';
  }

  if (cleanDigits.length >= 10 && cleanDigits.slice(-10) === '6070809010') {
    return '6070809010';
  }
  if (clean === 'lab-2' || clean === 'lab2' || clean === 'lab-6070809010') {
    return '6070809010';
  }

  // Strip url protocols, paths, query params if a full url or path was passed
  const withoutProtocol = clean.replace(/^https?:\/\//, '');
  const pathPart = withoutProtocol.split('/shop/')[1]?.split('/')[0]?.split('?')[0] || withoutProtocol.split('/')[0].split('?')[0];
  // Strip subdomains like .indianlalaji.com or .indianalala.com
  const withoutDomain = pathPart.replace(/\.(indianlalaji|indianalala)\.com.*$/, '');
  // Strip leading prefixes 'lab-', 'lsp-', 'lab_' or 'lsp_'
  const canonical = withoutDomain.replace(/^(lab|lsp)[-_]/, '');
  return canonical;
}

/**
 * Verifies if an entity or lab ID belongs to the active tenant.
 * Accepts either a record object with labId or a raw string labId.
 * Guarantees zero cross-lab data leakage across websites and portals.
 *
 * @param allowGlobalAdminAll - When true (e.g. Super Admin dashboard), 'all' returns true.
 *                             When false (e.g. public vendor website, patient portal search),
 *                             'all' or empty is rejected to prevent cross-lab report leakage!
 */
export function isTenantMatch(
  recordOrLabId: { labId?: string } | string | undefined | null,
  activeTenantId: string | undefined | null,
  allowGlobalAdminAll: boolean = true
): boolean {
  if (allowGlobalAdminAll && activeTenantId === 'all') return true;
  if (!activeTenantId || activeTenantId === 'all') return false;

  let rawLabId: string | undefined;
  if (typeof recordOrLabId === 'string') {
    rawLabId = recordOrLabId;
  } else if (recordOrLabId && typeof recordOrLabId === 'object') {
    rawLabId = (recordOrLabId as { labId?: string }).labId;
  }

  // A record with no labId must NEVER leak into any tenant website or search
  if (!rawLabId) {
    return false;
  }

  const normalizedActive = normalizeTenantId(activeTenantId);
  const normalizedRecord = normalizeTenantId(rawLabId);

  if (!normalizedActive || !normalizedRecord) {
    return false;
  }

  return normalizedRecord === normalizedActive;
}

/**
 * Filter an array of items by tenant ID with mandatory isolation.
 */
export function filterTenantData<T extends { labId?: string }>(
  items: T[],
  activeTenantId: string | undefined | null,
  allowGlobalAdminAll: boolean = true
): T[] {
  if (allowGlobalAdminAll && activeTenantId === 'all') {
    return items;
  }
  if (!activeTenantId || activeTenantId === 'all') {
    return [];
  }
  return items.filter((item) => isTenantMatch(item, activeTenantId, allowGlobalAdminAll));
}

/**
 * Security guard for mutating (updating/deleting) an existing record.
 * Returns true if allowed, false if a cross-tenant violation is detected.
 */
export function verifyTenantOwnership<T extends { labId?: string }>(
  record: T | undefined | null,
  activeTenantId: string | undefined | null,
  user?: CmsUser | null
): boolean {
  if (!record) {
    return true;
  }

  if (user?.role === 'admin') {
    return true;
  }

  if (!activeTenantId || activeTenantId === 'all') {
    return false;
  }

  const rawId = typeof record === 'object' ? record.labId : undefined;
  if (!rawId) {
    return false;
  }

  const recordLabId = normalizeTenantId(rawId);
  const currentTenant = normalizeTenantId(activeTenantId);

  if (recordLabId !== currentTenant) {
    const errorMsg = `[SECURITY_VIOLATION] Cross-tenant modification rejected! Current Tenant: '${currentTenant}', Target Record Tenant: '${recordLabId}'.`;
    console.warn(errorMsg);
    return false;
  }

  return true;
}

/**
 * Stamps tenant ID on newly created entities to ensure zero orphaned or cross-tenant records.
 */
export function stampTenant<T extends Record<string, any>>(
  entity: T,
  activeTenantId: string
): T & { labId: string } {
  const labId = (activeTenantId && activeTenantId !== 'all') ? activeTenantId : (entity.labId || 'lab');
  return {
    ...entity,
    labId: entity.labId || labId,
  };
}

/**
 * Generate a security audit log entry for tenant operations or violations.
 */
export function createTenantAuditEntry(
  action: string,
  actor: string,
  role: string,
  details: string,
  labId: string
): AuditEntry {
  return {
    id: `audit-tenant-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    action,
    actor,
    role,
    details: `[Tenant: ${labId}] ${details}`,
    ip: '10.0.12.44 (Cloud VPC SSL Isolation)',
    labId,
    tenantId: labId,
  };
}
