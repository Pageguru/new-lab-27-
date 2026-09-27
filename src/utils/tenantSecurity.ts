import { CmsUser, AuditEntry } from '../types';

export const KNOWN_TENANTS = [
  { id: 'lab-apex', name: 'Apex Diagnostic & Clinical Pathology Laboratory', code: 'APEX' },
  { id: 'lab-citycare', name: 'CityCare Advanced Diagnostics & Scan Centre', code: 'CITY' },
  { id: 'lab-metropath', name: 'MetroPath Scans & Molecular Pathology Hub', code: 'METRO' },
  { id: 'lab-lifeline-due', name: 'LifeLine PathCare Diagnostic Centre', code: 'LIFE' },
  { id: 'lab-sanjivani', name: 'Sanjivani Pathology & Preventive Health Lab', code: 'SANJ' },
  { id: 'lab-healtech-pending', name: 'HealTech Molecular & Allergy Diagnostic Lab', code: 'HEAL' },
  { id: 'lab-pulse', name: 'Pulse Diagnostics & MRI Centre', code: 'PULSE' },
  { id: 'lab-carepoint', name: 'CarePoint Clinical Laboratory', code: 'CARE' },
] as const;

export const DEFAULT_TENANT_ID = 'lab-apex';

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
 * Verifies if an entity or lab ID belongs to the active tenant.
 * Accepts either a record object with labId or a raw string labId.
 */
export function isTenantMatch(
  recordOrLabId: { labId?: string } | string | undefined | null,
  activeTenantId: string | undefined | null
): boolean {
  if (!activeTenantId || activeTenantId === 'all') return true;

  let rawLabId: string | undefined;
  if (typeof recordOrLabId === 'string') {
    rawLabId = recordOrLabId;
  } else if (recordOrLabId && typeof recordOrLabId === 'object') {
    rawLabId = (recordOrLabId as { labId?: string }).labId;
  }

  const normalizedRecordId =
    typeof rawLabId === 'string' && rawLabId.trim()
      ? rawLabId.trim()
      : DEFAULT_TENANT_ID;
  const normalizedActiveId = String(activeTenantId).trim();

  return normalizedRecordId.toLowerCase() === normalizedActiveId.toLowerCase();
}

/**
 * Filter an array of items by tenant ID with mandatory isolation.
 */
export function filterTenantData<T extends { labId?: string }>(
  items: T[],
  activeTenantId: string | undefined | null
): T[] {
  if (!activeTenantId || activeTenantId === 'all') {
    return items;
  }
  const target = String(activeTenantId).trim().toLowerCase();
  return items.filter((item) => {
    const rawId = item && typeof item === 'object' ? item.labId : undefined;
    const itemLabId = (
      typeof rawId === 'string' && rawId.trim() ? rawId.trim() : DEFAULT_TENANT_ID
    ).toLowerCase();
    return itemLabId === target;
  });
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

  if (!activeTenantId || activeTenantId === 'all') {
    return true;
  }

  if (user?.role === 'admin') {
    return true;
  }

  const rawId = typeof record === 'object' ? record.labId : undefined;
  const recordLabId = (
    typeof rawId === 'string' && rawId.trim() ? rawId.trim() : DEFAULT_TENANT_ID
  ).toLowerCase();
  const currentTenant = String(activeTenantId).trim().toLowerCase();

  if (recordLabId !== currentTenant) {
    const errorMsg = `[SECURITY_VIOLATION] Cross-tenant modification rejected! Current Tenant: '${currentTenant}', Target Record Tenant: '${recordLabId}'.`;
    console.error(errorMsg);
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
  const labId = activeTenantId === 'all' ? DEFAULT_TENANT_ID : activeTenantId;
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
