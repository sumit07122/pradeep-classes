import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAlterStaffRole,
  canManageTargetRole,
  canRevokeStaffMembership,
  getVisibleNavItems,
  hasErpPermission,
} from './rbac';
import type { ErpRole } from './types';

test('1. Staff navigation item is visible ONLY to Owner and Admin', () => {
  const ownerNav = getVisibleNavItems('institute_owner').map((i) => i.path);
  const adminNav = getVisibleNavItems('institute_admin').map((i) => i.path);
  const acctNav = getVisibleNavItems('accountant').map((i) => i.path);
  const teacherNav = getVisibleNavItems('teacher').map((i) => i.path);

  assert.equal(ownerNav.includes('/portal/staff'), true, 'Owner must see /portal/staff');
  assert.equal(adminNav.includes('/portal/staff'), true, 'Admin must see /portal/staff');
  assert.equal(acctNav.includes('/portal/staff'), false, 'Accountant must NOT see /portal/staff');
  assert.equal(teacherNav.includes('/portal/staff'), false, 'Teacher must NOT see /portal/staff');
});

test('2. Owner holds full staff management permissions', () => {
  const ownerPerms = [
    'staff:view',
    'staff:create',
    'staff:invite',
    'staff:designation:manage',
    'staff:role:manage',
    'staff:suspend',
    'staff:reactivate',
    'staff:revoke',
  ] as const;

  for (const perm of ownerPerms) {
    assert.equal(hasErpPermission('institute_owner', perm), true, `Owner must hold ${perm}`);
  }

  assert.equal(canAlterStaffRole('institute_owner'), true);
  assert.equal(canRevokeStaffMembership('institute_owner'), true);
  assert.equal(canManageTargetRole('institute_owner', 'teacher'), true);
  assert.equal(canManageTargetRole('institute_owner', 'accountant'), true);
  assert.equal(canManageTargetRole('institute_owner', 'institute_admin'), true);
});

test('3. Admin holds non-owner staff management permissions and is blocked from role alteration or revocation', () => {
  assert.equal(hasErpPermission('institute_admin', 'staff:view'), true);
  assert.equal(hasErpPermission('institute_admin', 'staff:create'), true);
  assert.equal(hasErpPermission('institute_admin', 'staff:invite'), true);
  assert.equal(hasErpPermission('institute_admin', 'staff:designation:manage'), true);
  assert.equal(hasErpPermission('institute_admin', 'staff:suspend'), true);
  assert.equal(hasErpPermission('institute_admin', 'staff:reactivate'), true);

  // Admin cannot alter roles or revoke memberships
  assert.equal(hasErpPermission('institute_admin', 'staff:role:manage'), false);
  assert.equal(hasErpPermission('institute_admin', 'staff:revoke'), false);
  assert.equal(canAlterStaffRole('institute_admin'), false);
  assert.equal(canRevokeStaffMembership('institute_admin'), false);

  // Admin can manage Teacher and Accountant
  assert.equal(canManageTargetRole('institute_admin', 'teacher'), true);
  assert.equal(canManageTargetRole('institute_admin', 'accountant'), true);

  // Admin CANNOT manage Owner or Admin
  assert.equal(canManageTargetRole('institute_admin', 'institute_owner'), false);
  assert.equal(canManageTargetRole('institute_admin', 'institute_admin'), false);
});

test('4. Accountant and Teacher hold zero staff management authority', () => {
  const restrictedRoles: ErpRole[] = ['accountant', 'teacher'];

  for (const role of restrictedRoles) {
    assert.equal(hasErpPermission(role, 'staff:view'), false);
    assert.equal(hasErpPermission(role, 'staff:create'), false);
    assert.equal(hasErpPermission(role, 'staff:suspend'), false);
    assert.equal(canAlterStaffRole(role), false);
    assert.equal(canRevokeStaffMembership(role), false);
    assert.equal(canManageTargetRole(role, 'teacher'), false);
  }
});

test('5. Suspended members immediately lose staff view and management permissions', () => {
  assert.equal(hasErpPermission('institute_owner', 'staff:view', 'suspended'), false);
  assert.equal(hasErpPermission('institute_admin', 'staff:view', 'suspended'), false);
  assert.equal(hasErpPermission('institute_owner', 'staff:create', 'suspended'), false);
  assert.equal(canManageTargetRole('institute_owner', 'teacher', 'suspended'), false);
  assert.equal(canAlterStaffRole('institute_owner', 'suspended'), false);
  assert.equal(canRevokeStaffMembership('institute_owner', 'suspended'), false);
});
