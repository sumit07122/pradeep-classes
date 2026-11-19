import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ERP_ROLES,
  getDefaultPortalRoute,
  getRoleDefinition,
  getRolePermissions,
  getVisibleNavItems,
  hasAnyErpRole,
  hasErpPermission,
  isValidErpRole,
  selectActiveMembership,
} from './rbac';
import type { InstituteMembership } from './types';

test('isValidErpRole validates only the four canonical ERP roles', () => {
  for (const role of ERP_ROLES) {
    assert.equal(isValidErpRole(role), true);
  }
  assert.equal(isValidErpRole('student'), false);
  assert.equal(isValidErpRole('super_admin'), false);
  assert.equal(isValidErpRole(''), false);
  assert.equal(isValidErpRole(null), false);
});

test('each role resolves to its dedicated default portal route', () => {
  assert.equal(getDefaultPortalRoute('institute_owner'), '/portal/owner');
  assert.equal(getDefaultPortalRoute('institute_admin'), '/portal/admin');
  assert.equal(getDefaultPortalRoute('accountant'), '/portal/accounts');
  assert.equal(getDefaultPortalRoute('teacher'), '/portal/teacher');
  assert.equal(getDefaultPortalRoute(null), '/portal/unauthorized');
});

test('hasErpPermission enforces strict role boundaries and active status', () => {
  assert.equal(hasErpPermission('institute_owner', 'staff:manage', 'active'), true);
  assert.equal(hasErpPermission('institute_owner', 'finance:manage', 'active'), true);

  assert.equal(hasErpPermission('institute_admin', 'academics:manage', 'active'), true);
  assert.equal(hasErpPermission('institute_admin', 'finance:manage', 'active'), false);
  assert.equal(hasErpPermission('institute_admin', 'staff:manage', 'active'), false);

  assert.equal(hasErpPermission('accountant', 'finance:manage', 'active'), true);
  assert.equal(hasErpPermission('accountant', 'dashboard:admin:view', 'active'), false);
  assert.equal(hasErpPermission('accountant', 'attendance:mark', 'active'), false);

  assert.equal(hasErpPermission('teacher', 'attendance:mark', 'active'), true);
  assert.equal(hasErpPermission('teacher', 'finance:view', 'active'), false);

  // Suspended or revoked memberships must never grant permissions
  assert.equal(hasErpPermission('institute_owner', 'portal:access', 'suspended'), false);
  assert.equal(hasErpPermission('institute_owner', 'portal:access', 'revoked'), false);
});

test('hasAnyErpRole rejects inactive memberships and unauthorized roles', () => {
  assert.equal(hasAnyErpRole('accountant', ['institute_owner', 'accountant'], 'active'), true);
  assert.equal(hasAnyErpRole('teacher', ['institute_owner', 'accountant'], 'active'), false);
  assert.equal(hasAnyErpRole('institute_owner', 'institute_owner', 'revoked'), false);
});

test('getVisibleNavItems filters workspace routes per role', () => {
  const ownerLinks = getVisibleNavItems('institute_owner').map((i) => i.path);
  assert.deepEqual(ownerLinks, [
    '/portal/owner',
    '/portal/admin',
    '/portal/accounts',
    '/portal/teacher',
    '/portal/staff',
    '/portal/settings',
    '/portal/students',
    '/portal/profile',
  ]);

  const adminLinks = getVisibleNavItems('institute_admin').map((i) => i.path);
  assert.deepEqual(adminLinks, [
    '/portal/admin',
    '/portal/teacher',
    '/portal/staff',
    '/portal/settings',
    '/portal/students',
    '/portal/profile',
  ]);

  const accountantLinks = getVisibleNavItems('accountant').map((i) => i.path);
  assert.deepEqual(accountantLinks, ['/portal/accounts', '/portal/students', '/portal/profile']);

  const teacherLinks = getVisibleNavItems('teacher').map((i) => i.path);
  assert.deepEqual(teacherLinks, ['/portal/teacher', '/portal/students', '/portal/profile']);

  assert.deepEqual(getVisibleNavItems('teacher', 'suspended'), []);
});

test('selectActiveMembership ignores suspended/revoked memberships and respects preference', () => {
  const memberships: InstituteMembership[] = [
    {
      id: 'inst_suspended_u1',
      uid: 'u1',
      instituteId: 'inst_suspended',
      role: 'institute_owner',
      status: 'suspended',
      displayName: 'User One',
      createdBy: 'admin',
    },
    {
      id: 'inst_a_u1',
      uid: 'u1',
      instituteId: 'inst_a',
      role: 'teacher',
      status: 'active',
      displayName: 'User One',
      createdBy: 'admin',
    },
    {
      id: 'inst_b_u1',
      uid: 'u1',
      instituteId: 'inst_b',
      role: 'accountant',
      status: 'active',
      displayName: 'User One',
      createdBy: 'admin',
    },
  ];

  const first = selectActiveMembership(memberships);
  assert.equal(first?.instituteId, 'inst_a');

  const preferred = selectActiveMembership(memberships, 'inst_b');
  assert.equal(preferred?.instituteId, 'inst_b');
  assert.equal(preferred?.role, 'accountant');

  // Preference pointing to suspended membership falls back to first active
  const fallback = selectActiveMembership(memberships, 'inst_suspended');
  assert.equal(fallback?.instituteId, 'inst_a');

  // Empty or all-inactive returns null
  assert.equal(selectActiveMembership([memberships[0]]), null);
});

test('getRoleDefinition and getRolePermissions handle unknown roles safely', () => {
  assert.equal(getRoleDefinition(undefined), null);
  assert.deepEqual(getRolePermissions(null), []);
});
