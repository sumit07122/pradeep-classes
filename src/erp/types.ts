export type ErpRole =
  | 'institute_owner'
  | 'institute_admin'
  | 'accountant'
  | 'teacher';

export type MembershipStatus = 'active' | 'suspended' | 'revoked';

export type UserProfileStatus = 'active' | 'disabled';

export type InstituteStatus = 'active' | 'suspended';

export type ErpPermission =
  | 'portal:access'
  | 'dashboard:owner:view'
  | 'dashboard:admin:view'
  | 'dashboard:accountant:view'
  | 'dashboard:teacher:view'
  | 'institute:settings:view'
  | 'institute:settings:manage'
  | 'staff:view'
  | 'staff:create'
  | 'staff:invite'
  | 'staff:designation:manage'
  | 'staff:role:manage'
  | 'staff:suspend'
  | 'staff:reactivate'
  | 'staff:revoke'
  | 'staff:manage'
  | 'academics:view'
  | 'academics:manage'
  | 'finance:view'
  | 'finance:manage'
  | 'attendance:view'
  | 'attendance:mark'
  | 'reports:view'
  | 'reports:financial'
  | 'audit:view';

export interface ErpUserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  status: UserProfileStatus;
  defaultInstituteId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Institute {
  id: string;
  name: string;
  code: string;
  status: InstituteStatus;
  ownerUid: string;
  academicSession: string;
  timezone: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface InstituteMembership {
  id: string;
  uid: string;
  instituteId: string;
  role: ErpRole;
  status: MembershipStatus;
  displayName: string;
  designation?: string;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RoleDefinition {
  role: ErpRole;
  label: string;
  shortLabel: string;
  description: string;
  defaultRoute: string;
  permissions: readonly ErpPermission[];
}

export type ErpNavIcon =
  | 'owner'
  | 'admin'
  | 'accounts'
  | 'teacher'
  | 'profile';

export interface ErpNavItem {
  id: string;
  label: string;
  path: string;
  icon: ErpNavIcon;
  section: 'Workspaces' | 'Account';
  requiredPermission: ErpPermission;
}
