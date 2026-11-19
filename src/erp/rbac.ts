import type {
  ErpNavItem,
  ErpPermission,
  ErpRole,
  InstituteMembership,
  MembershipStatus,
  RoleDefinition,
} from './types';

export const ERP_ROLES: readonly ErpRole[] = [
  'institute_owner',
  'institute_admin',
  'accountant',
  'teacher',
] as const;

export const ROLE_DEFINITIONS: Record<ErpRole, RoleDefinition> = {
  institute_owner: {
    role: 'institute_owner',
    label: 'Institute Owner',
    shortLabel: 'Owner',
    description:
      'Full institutional governance across academic operations, financial oversight, staff provisioning, and audit records.',
    defaultRoute: '/portal/owner',
    permissions: [
      'portal:access',
      'dashboard:owner:view',
      'dashboard:admin:view',
      'dashboard:accountant:view',
      'dashboard:teacher:view',
      'institute:settings:view',
      'institute:settings:manage',
      'staff:view',
      'staff:create',
      'staff:invite',
      'staff:designation:manage',
      'staff:role:manage',
      'staff:suspend',
      'staff:reactivate',
      'staff:revoke',
      'staff:manage',
      'students:view',
      'students:manage',
      'academics:view',
      'academics:manage',
      'finance:view',
      'finance:manage',
      'attendance:view',
      'attendance:mark',
      'reports:view',
      'reports:financial',
      'audit:view',
    ],
  },
  institute_admin: {
    role: 'institute_admin',
    label: 'Institute Admin',
    shortLabel: 'Admin',
    description:
      'Day-to-day academic operations, batch scheduling, faculty coordination, and non-owner staff management.',
    defaultRoute: '/portal/admin',
    permissions: [
      'portal:access',
      'dashboard:admin:view',
      'dashboard:teacher:view',
      'institute:settings:view',
      'staff:view',
      'staff:create',
      'staff:invite',
      'staff:designation:manage',
      'staff:suspend',
      'staff:reactivate',
      'students:view',
      'students:manage',
      'academics:view',
      'academics:manage',
      'attendance:view',
      'attendance:mark',
      'reports:view',
    ],
  },
  accountant: {
    role: 'accountant',
    label: 'Accountant',
    shortLabel: 'Accountant',
    description:
      'Fee structures, student billing ledgers, receipts, reconciliation, and institutional financial reporting.',
    defaultRoute: '/portal/accounts',
    permissions: [
      'portal:access',
      'dashboard:accountant:view',
      'students:view',
      'finance:view',
      'finance:manage',
      'reports:financial',
    ],
  },
  teacher: {
    role: 'teacher',
    label: 'Teacher',
    shortLabel: 'Teacher',
    description:
      'Assigned batches, classroom attendance, academic material delivery, and student assessment tracking.',
    defaultRoute: '/portal/teacher',
    permissions: [
      'portal:access',
      'dashboard:teacher:view',
      'students:view',
      'academics:view',
      'attendance:view',
      'attendance:mark',
    ],
  },
};

export const ERP_NAV_ITEMS: readonly ErpNavItem[] = [
  {
    id: 'owner-dashboard',
    label: 'Owner Overview',
    path: '/portal/owner',
    icon: 'owner',
    section: 'Workspaces',
    requiredPermission: 'dashboard:owner:view',
  },
  {
    id: 'admin-dashboard',
    label: 'Admin Operations',
    path: '/portal/admin',
    icon: 'admin',
    section: 'Workspaces',
    requiredPermission: 'dashboard:admin:view',
  },
  {
    id: 'accounts-dashboard',
    label: 'Accounts Desk',
    path: '/portal/accounts',
    icon: 'accounts',
    section: 'Workspaces',
    requiredPermission: 'dashboard:accountant:view',
  },
  {
    id: 'teacher-dashboard',
    label: 'Teacher Workspace',
    path: '/portal/teacher',
    icon: 'teacher',
    section: 'Workspaces',
    requiredPermission: 'dashboard:teacher:view',
  },
  {
    id: 'staff-management',
    label: 'Staff Directory',
    path: '/portal/staff',
    icon: 'staff',
    section: 'Administration',
    requiredPermission: 'staff:view',
  },
  {
    id: 'institute-settings',
    label: 'Institute & Academics',
    path: '/portal/settings',
    icon: 'settings',
    section: 'Administration',
    requiredPermission: 'institute:settings:view',
  },
  {
    id: 'student-directory',
    label: 'Students',
    path: '/portal/students',
    icon: 'students',
    section: 'Academics',
    requiredPermission: 'students:view',
  },
  {
    id: 'fees-management',
    label: 'Fee Desk & Accounts',
    path: '/portal/fees',
    icon: 'fees',
    section: 'Administration',
    requiredPermission: 'finance:view',
  },
  {
    id: 'profile-access',
    label: 'Profile & Access',
    path: '/portal/profile',
    icon: 'profile',
    section: 'Account',
    requiredPermission: 'portal:access',
  },
];

export function isValidErpRole(value: unknown): value is ErpRole {
  return typeof value === 'string' && (ERP_ROLES as readonly string[]).includes(value);
}

export function getRoleDefinition(role: ErpRole | null | undefined): RoleDefinition | null {
  if (!role || !isValidErpRole(role)) return null;
  return ROLE_DEFINITIONS[role];
}

export function getRolePermissions(role: ErpRole | null | undefined): readonly ErpPermission[] {
  const def = getRoleDefinition(role);
  return def ? def.permissions : [];
}

export function hasErpPermission(
  role: ErpRole | null | undefined,
  permission: ErpPermission,
  status: MembershipStatus | null | undefined = 'active'
): boolean {
  if (status !== 'active') return false;
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

export function hasAnyErpRole(
  role: ErpRole | null | undefined,
  allowedRoles: ErpRole | readonly ErpRole[],
  status: MembershipStatus | null | undefined = 'active'
): boolean {
  if (status !== 'active' || !role || !isValidErpRole(role)) return false;
  const list = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return list.includes(role);
}

export function getDefaultPortalRoute(role: ErpRole | null | undefined): string {
  const def = getRoleDefinition(role);
  return def ? def.defaultRoute : '/portal/unauthorized';
}

export function getVisibleNavItems(
  role: ErpRole | null | undefined,
  status: MembershipStatus | null | undefined = 'active'
): ErpNavItem[] {
  if (status !== 'active' || !role || !isValidErpRole(role)) {
    return [];
  }
  return ERP_NAV_ITEMS.filter((item) => hasErpPermission(role, item.requiredPermission, status));
}

export function selectActiveMembership(
  memberships: readonly InstituteMembership[],
  preferredInstituteId?: string | null
): InstituteMembership | null {
  const active = memberships.filter((m) => m.status === 'active' && isValidErpRole(m.role));
  if (active.length === 0) return null;

  if (preferredInstituteId) {
    const matched = active.find((m) => m.instituteId === preferredInstituteId);
    if (matched) return matched;
  }

  return active[0];
}

/**
 * Evaluates whether an actor role has authority to create, invite, suspend, or reactivate a target staff role.
 * - Institute Owner can manage all roles (Owner, Admin, Accountant, Teacher).
 * - Institute Admin can only manage non-owner staff (Accountant, Teacher). Admins cannot manage Owner or other Admins.
 * - Other roles (Accountant, Teacher) cannot manage any staff members.
 */
export function canManageTargetRole(
  actorRole: ErpRole | null | undefined,
  targetRole: ErpRole,
  status: MembershipStatus | null | undefined = 'active'
): boolean {
  if (status !== 'active' || !actorRole || !isValidErpRole(actorRole)) return false;
  if (!isValidErpRole(targetRole)) return false;
  if (actorRole === 'institute_owner') return true;
  if (actorRole === 'institute_admin') {
    return targetRole === 'accountant' || targetRole === 'teacher';
  }
  return false;
}

/**
 * Evaluates whether an actor role can modify the role assigned to a staff membership.
 * Strictly limited to Institute Owners.
 */
export function canAlterStaffRole(
  actorRole: ErpRole | null | undefined,
  status: MembershipStatus | null | undefined = 'active'
): boolean {
  return hasErpPermission(actorRole, 'staff:role:manage', status);
}

/**
 * Evaluates whether an actor role can revoke a staff membership permanently.
 * Strictly limited to Institute Owners.
 */
export function canRevokeStaffMembership(
  actorRole: ErpRole | null | undefined,
  status: MembershipStatus | null | undefined = 'active'
): boolean {
  return hasErpPermission(actorRole, 'staff:revoke', status);
}

