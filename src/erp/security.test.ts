import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  canAlterStaffRole,
  canManageTargetRole,
  canRevokeStaffMembership,
  getDefaultPortalRoute,
  getVisibleNavItems,
  hasAnyErpRole,
  hasErpPermission,
  selectActiveMembership,
} from './rbac';
import type { InstituteMembership } from './types';

const rootDir = process.cwd();
const firestoreRules = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');
const portalLoginSource = fs.readFileSync(
  path.join(rootDir, 'src/pages/portal/PortalLogin.tsx'),
  'utf8'
);
const adminLoginSource = fs.readFileSync(
  path.join(rootDir, 'src/pages/admin/AdminLogin.tsx'),
  'utf8'
);
const authContextSource = fs.readFileSync(
  path.join(rootDir, 'src/context/AuthContext.tsx'),
  'utf8'
);
const portalRouteSource = fs.readFileSync(
  path.join(rootDir, 'src/components/PortalRoute.tsx'),
  'utf8'
);

function makeMembership(overrides: Partial<InstituteMembership> = {}): InstituteMembership {
  return {
    id: 'inst_main_uid1',
    uid: 'uid1',
    instituteId: 'inst_main',
    role: 'teacher',
    status: 'active',
    displayName: 'Test Staff',
    createdBy: 'owner_uid',
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

test('1. Unauthenticated access is denied across RBAC helpers and Firestore root rules', () => {
  assert.equal(hasErpPermission(null, 'portal:access'), false);
  assert.equal(hasErpPermission(undefined, 'dashboard:owner:view'), false);
  assert.equal(hasAnyErpRole(null, ['institute_owner', 'institute_admin', 'accountant', 'teacher']), false);
  assert.deepEqual(getVisibleNavItems(null), []);
  assert.equal(getDefaultPortalRoute(null), '/portal/unauthorized');

  assert.match(firestoreRules, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);
  assert.match(firestoreRules, /function isVerifiedUser\(\) \{ return isSignedIn\(\) && request\.auth\.token\.email_verified == true; \}/);
});

test('2. Wrong-role access is strictly blocked across all four ERP roles', () => {
  assert.equal(hasErpPermission('teacher', 'dashboard:owner:view'), false);
  assert.equal(hasErpPermission('teacher', 'dashboard:admin:view'), false);
  assert.equal(hasErpPermission('teacher', 'dashboard:accountant:view'), false);
  assert.equal(hasErpPermission('teacher', 'staff:manage'), false);

  assert.equal(hasErpPermission('accountant', 'dashboard:owner:view'), false);
  assert.equal(hasErpPermission('accountant', 'dashboard:admin:view'), false);
  assert.equal(hasErpPermission('accountant', 'dashboard:teacher:view'), false);
  assert.equal(hasErpPermission('accountant', 'academics:manage'), false);
  assert.equal(hasErpPermission('accountant', 'attendance:mark'), false);

  assert.equal(hasErpPermission('institute_admin', 'dashboard:owner:view'), false);
  assert.equal(hasErpPermission('institute_admin', 'dashboard:accountant:view'), false);
  assert.equal(hasErpPermission('institute_admin', 'staff:manage'), false);
  assert.equal(hasErpPermission('institute_admin', 'institute:settings:manage'), false);
  assert.equal(hasErpPermission('institute_admin', 'audit:view'), false);

  assert.deepEqual(
    getVisibleNavItems('teacher').map((item) => item.path),
    ['/portal/teacher', '/portal/students', '/portal/attendance', '/portal/academics', '/portal/communication', '/portal/profile']
  );
  assert.deepEqual(
    getVisibleNavItems('accountant').map((item) => item.path),
    ['/portal/accounts', '/portal/students', '/portal/fees', '/portal/communication', '/portal/profile']
  );

  // Assert strictly that unauthorized administrative & financial routes are never visible
  const teacherPaths = getVisibleNavItems('teacher').map((item) => item.path);
  assert.equal(teacherPaths.includes('/portal/owner'), false);
  assert.equal(teacherPaths.includes('/portal/admin'), false);
  assert.equal(teacherPaths.includes('/portal/staff'), false);
  assert.equal(teacherPaths.includes('/portal/settings'), false);
  assert.equal(teacherPaths.includes('/portal/fees'), false);

  const accountantPaths = getVisibleNavItems('accountant').map((item) => item.path);
  assert.equal(accountantPaths.includes('/portal/owner'), false);
  assert.equal(accountantPaths.includes('/portal/admin'), false);
  assert.equal(accountantPaths.includes('/portal/staff'), false);
  assert.equal(accountantPaths.includes('/portal/settings'), false);
  assert.equal(accountantPaths.includes('/portal/attendance'), false);
  assert.equal(accountantPaths.includes('/portal/academics'), false);
});

test('3. Cross-institute access cannot be escalated via preferred institute or profile update', () => {
  const memberships: InstituteMembership[] = [
    makeMembership({
      id: 'inst_alpha_u1',
      instituteId: 'inst_alpha',
      role: 'teacher',
      status: 'active',
    }),
  ];

  // Selecting an unowned institute falls back to owned active membership and never synthesizes foreign access
  const resolved = selectActiveMembership(memberships, 'inst_foreign');
  assert.equal(resolved?.instituteId, 'inst_alpha');
  assert.equal(selectActiveMembership([], 'inst_foreign'), null);

  // Firestore rules isolate institutes and memberships by instituteId and verify defaultInstituteId ownership
  assert.match(firestoreRules, /membershipId == \(incoming\(\)\.instituteId \+ '_' \+ incoming\(\)\.uid\)/);
  assert.match(firestoreRules, /isActiveInstituteMember\(incoming\(\)\.defaultInstituteId\)/);
  assert.match(firestoreRules, /allow get: if isValidId\(instituteId\) && \(isActiveInstituteMember\(instituteId\) \|\| isSuperAdmin\(\)\)/);
});

test('4. Self-role escalation is impossible from client auth or Firestore rules', () => {
  // No public signup or role mutation helpers exist in ERP login or AuthContext
  assert.equal(portalLoginSource.includes('createUserWithEmailAndPassword'), false);
  assert.equal(portalLoginSource.includes('signInWithGoogle'), false);
  assert.equal(portalLoginSource.includes('GoogleAuthProvider'), false);
  assert.equal(authContextSource.includes('createUserWithEmailAndPassword'), false);

  // Firestore rules lock membership creation/promotion away from non-owners and disallow owner self-promotion
  assert.match(firestoreRules, /isInstituteOwner\(incoming\(\)\.instituteId\) &&\s*incoming\(\)\.role != 'institute_owner'/);
  assert.match(firestoreRules, /incoming\(\)\.uid == existing\(\)\.uid &&\s*incoming\(\)\.instituteId == existing\(\)\.instituteId &&\s*incoming\(\)\.createdBy == existing\(\)\.createdBy/);
  assert.match(firestoreRules, /incoming\(\)\.diff\(existing\(\)\)\.affectedKeys\(\)\.hasOnly\(\['displayName', 'phone', 'photoURL', 'defaultInstituteId', 'updatedAt'\]\)/);
});

test('5. Suspended and revoked memberships/users immediately lose all ERP permissions', () => {
  assert.equal(hasErpPermission('institute_owner', 'dashboard:owner:view', 'suspended'), false);
  assert.equal(hasErpPermission('institute_owner', 'dashboard:owner:view', 'revoked'), false);
  assert.equal(hasAnyErpRole('accountant', ['accountant'], 'suspended'), false);
  assert.deepEqual(getVisibleNavItems('institute_admin', 'suspended'), []);
  assert.deepEqual(getVisibleNavItems('teacher', 'revoked'), []);

  const suspendedOnly: InstituteMembership[] = [
    makeMembership({ status: 'suspended', role: 'institute_owner' }),
    makeMembership({ id: 'inst_b_uid1', instituteId: 'inst_b', status: 'revoked', role: 'accountant' }),
  ];
  assert.equal(selectActiveMembership(suspendedOnly), null);

  assert.match(firestoreRules, /function isActiveUserRecord\(\)/);
  assert.match(firestoreRules, /get\(\/databases\/\$\(database\)\/documents\/users\/\$\(request\.auth\.uid\)\)\.data\.status == 'active'/);
  assert.match(firestoreRules, /isActiveUserRecord\(\) &&/);
  assert.match(firestoreRules, /isActiveInstitute\(incoming\(\)\.instituteId\)/);
});

test('6. Unauthorized financial access is denied to Teacher and Institute Admin', () => {
  for (const role of ['teacher', 'institute_admin'] as const) {
    assert.equal(hasErpPermission(role, 'finance:view'), false);
    assert.equal(hasErpPermission(role, 'finance:manage'), false);
    assert.equal(hasErpPermission(role, 'reports:financial'), false);
    assert.equal(hasErpPermission(role, 'dashboard:accountant:view'), false);
  }

  for (const role of ['accountant', 'institute_owner'] as const) {
    assert.equal(hasErpPermission(role, 'finance:view'), true);
    assert.equal(hasErpPermission(role, 'finance:manage'), true);
    assert.equal(hasErpPermission(role, 'reports:financial'), true);
    assert.equal(hasErpPermission(role, 'dashboard:accountant:view'), true);
  }
});

test('7. Legacy CMS authentication, super-admin allowlist, and collections remain preserved', () => {
  // Exact owner-only super admin emails in both rules and AuthContext
  assert.equal(firestoreRules.includes('krishna0202thakur@gmail.com'), false);
  assert.equal(authContextSource.includes('krishna0202thakur@gmail.com'), false);
  assert.match(firestoreRules, /request\.auth\.token\.email == 'sumitdevthakur@gmail\.com'/);
  assert.match(firestoreRules, /request\.auth\.token\.email == 'pradeepclasses\.in@gmail\.com'/);

  // Legacy CMS Google Sign-In remains intact on /admin/login
  assert.match(adminLoginSource, /signInWithGoogle/);

  // ERP login uses Email/Password, Password Reset, and Email Verification
  assert.match(portalLoginSource, /signInWithEmail/);
  assert.match(portalLoginSource, /sendPasswordReset/);
  assert.match(portalLoginSource, /resendVerificationEmail/);
  assert.match(portalLoginSource, /reloadVerificationStatus/);

  // Legacy Firestore collections remain declared
  for (const col of [
    'notices',
    'inquiries',
    'admins',
    'settings',
    'faculties',
    'toppers',
    'gallery',
    'reviews',
    'siteImages',
    'automated_content',
  ]) {
    assert.match(firestoreRules, new RegExp(`match /${col}/`));
  }
});

test('8. Institute-scoped membership listing enforces privileged institute scope and blocks cross-institute leaks', () => {
  // Firestore rules allow list only for:
  // (a) querying own memberships (uid == request.auth.uid)
  // (b) privileged institute members (Owner/Admin of that active institute)
  // (c) super admin
  assert.match(
    firestoreRules,
    /allow list: if isVerifiedUser\(\) && \(\s*resource\.data\.uid == request\.auth\.uid \|\|\s*\(isActiveInstitute\(resource\.data\.instituteId\) && isInstitutePrivileged\(resource\.data\.instituteId\)\) \|\|\s*isSuperAdmin\(\)\s*\);/
  );

  // In RBAC, teachers and accountants cannot list staff
  assert.equal(hasErpPermission('teacher', 'staff:view'), false);
  assert.equal(hasErpPermission('accountant', 'staff:view'), false);
  assert.equal(hasErpPermission('institute_admin', 'staff:view'), true);
  assert.equal(hasErpPermission('institute_owner', 'staff:view'), true);
});

test('9. Missing user profile fails closed across rules, auth context, and portal route', () => {
  // 1. In firestore.rules: isActiveUserRecord requires profile document existence and active status
  assert.match(
    firestoreRules,
    /function isActiveUserRecord\(\) \{\s*return exists\(\/databases\/\$\(database\)\/documents\/users\/\$\(request\.auth\.uid\)\) &&\s*get\(\/databases\/\$\(database\)\/documents\/users\/\$\(request\.auth\.uid\)\)\.data\.status == 'active';\s*\}/
  );
  // Ensure !exists() pattern is completely gone
  assert.equal(firestoreRules.includes('!exists(/databases/$(database)/documents/users/$(request.auth.uid))'), false);

  // 2. In AuthContext: erpRole is null if userProfile is missing or not active
  assert.match(authContextSource, /if \(!userProfile \|\| userProfile\.status !== 'active'\) \{\s*return null;\s*\}/);

  // 3. In PortalRoute: missing userProfile or inactive userProfile denies access with security notice
  assert.match(portalRouteSource, /if \(!userProfile \|\| userProfile\.status !== 'active'\)/);
  assert.match(portalRouteSource, /console\.warn\('\[SECURITY\] ERP Route access denied: Missing or disabled user profile'/);
  assert.match(portalRouteSource, /Staff Profile Not Found/);
});

test('10. Missing or inactive institute fails closed in auth context and portal route', () => {
  // 1. In AuthContext: erpRole is null if activeInstitute is missing or not active
  assert.match(authContextSource, /if \(!activeInstitute \|\| activeInstitute\.status !== 'active'\) \{\s*return null;\s*\}/);

  // 2. In PortalRoute: missing or inactive activeInstitute denies access with security notice
  assert.match(portalRouteSource, /if \(!activeInstitute \|\| activeInstitute\.status !== 'active'\)/);
  assert.match(portalRouteSource, /console\.warn\('\[SECURITY\] ERP Route access denied: Missing or inactive institute'/);
  assert.match(portalRouteSource, /Institute Workspace Not Found/);
  assert.match(portalRouteSource, /Institute Workspace Suspended/);
});

test('11. Staff management permission matrix enforces owner vs admin boundaries', () => {
  // Owner permissions: full lifecycle
  const ownerStaffPerms = [
    'staff:view',
    'staff:create',
    'staff:invite',
    'staff:designation:manage',
    'staff:role:manage',
    'staff:suspend',
    'staff:reactivate',
    'staff:revoke',
  ] as const;

  for (const perm of ownerStaffPerms) {
    assert.equal(hasErpPermission('institute_owner', perm), true, `Owner must have ${perm}`);
  }

  // Owner can manage all target roles and change roles/revoke
  assert.equal(canManageTargetRole('institute_owner', 'institute_owner'), true);
  assert.equal(canManageTargetRole('institute_owner', 'institute_admin'), true);
  assert.equal(canManageTargetRole('institute_owner', 'accountant'), true);
  assert.equal(canManageTargetRole('institute_owner', 'teacher'), true);
  assert.equal(canAlterStaffRole('institute_owner'), true);
  assert.equal(canRevokeStaffMembership('institute_owner'), true);

  // Admin permissions: limited non-owner staff management
  assert.equal(hasErpPermission('institute_admin', 'staff:view'), true);
  assert.equal(hasErpPermission('institute_admin', 'staff:create'), true);
  assert.equal(hasErpPermission('institute_admin', 'staff:invite'), true);
  assert.equal(hasErpPermission('institute_admin', 'staff:designation:manage'), true);
  assert.equal(hasErpPermission('institute_admin', 'staff:suspend'), true);
  assert.equal(hasErpPermission('institute_admin', 'staff:reactivate'), true);

  // Admin STRICTLY CANNOT change role, revoke, or hold staff:manage
  assert.equal(hasErpPermission('institute_admin', 'staff:role:manage'), false);
  assert.equal(hasErpPermission('institute_admin', 'staff:revoke'), false);
  assert.equal(hasErpPermission('institute_admin', 'staff:manage'), false);
  assert.equal(canAlterStaffRole('institute_admin'), false);
  assert.equal(canRevokeStaffMembership('institute_admin'), false);

  // Admin cannot create/promote to Owner or Admin
  assert.equal(canManageTargetRole('institute_admin', 'institute_owner'), false);
  assert.equal(canManageTargetRole('institute_admin', 'institute_admin'), false);
  // Admin can manage Accountant and Teacher
  assert.equal(canManageTargetRole('institute_admin', 'accountant'), true);
  assert.equal(canManageTargetRole('institute_admin', 'teacher'), true);

  // Accountant and Teacher: no staff management permissions
  for (const role of ['accountant', 'teacher'] as const) {
    for (const perm of ownerStaffPerms) {
      assert.equal(hasErpPermission(role, perm), false, `${role} must NOT have ${perm}`);
    }
    assert.equal(canManageTargetRole(role, 'teacher'), false);
    assert.equal(canAlterStaffRole(role), false);
    assert.equal(canRevokeStaffMembership(role), false);
  }
});
