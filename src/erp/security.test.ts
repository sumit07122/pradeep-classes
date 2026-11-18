import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
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
    ['/portal/teacher', '/portal/profile']
  );
  assert.deepEqual(
    getVisibleNavItems('accountant').map((item) => item.path),
    ['/portal/accounts', '/portal/profile']
  );
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
