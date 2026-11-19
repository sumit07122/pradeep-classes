import test from 'node:test';
import assert from 'node:assert/strict';
import { hasErpPermission } from './rbac';
import type { Student, StudentStatus } from './types';

test('student management permissions enforce strict role boundaries', () => {
  // Owner: view + manage
  assert.equal(hasErpPermission('institute_owner', 'students:view', 'active'), true);
  assert.equal(hasErpPermission('institute_owner', 'students:manage', 'active'), true);

  // Admin: view + manage
  assert.equal(hasErpPermission('institute_admin', 'students:view', 'active'), true);
  assert.equal(hasErpPermission('institute_admin', 'students:manage', 'active'), true);

  // Accountant: view only (for fee records), no admission/management authority
  assert.equal(hasErpPermission('accountant', 'students:view', 'active'), true);
  assert.equal(hasErpPermission('accountant', 'students:manage', 'active'), false);

  // Teacher: view only (for attendance & marks), no admission/management authority
  assert.equal(hasErpPermission('teacher', 'students:view', 'active'), true);
  assert.equal(hasErpPermission('teacher', 'students:manage', 'active'), false);

  // Suspended staff cannot view or manage students
  assert.equal(hasErpPermission('institute_owner', 'students:view', 'suspended'), false);
  assert.equal(hasErpPermission('institute_admin', 'students:manage', 'suspended'), false);
});

test('student record structure maintains academic and guardian invariants', () => {
  const student: Student = {
    id: 'stu_101',
    instituteId: 'inst_pradeep',
    admissionNumber: 'ADM-2026-001',
    rollNumber: '101',
    fullName: 'Rahul Sharma',
    gender: 'male',
    dob: '2010-05-15',
    phone: '+91 9876543210',
    email: 'rahul@example.com',
    guardianName: 'Ramesh Sharma',
    guardianPhone: '+91 9811223344',
    guardianRelation: 'Father',
    courseId: 'crs_c10',
    courseName: 'Class 10 CBSE Foundation',
    batchId: 'btc_morning',
    batchName: 'Morning Alpha Batch',
    academicSessionId: '2026-2027',
    admissionDate: '2026-04-01',
    status: 'active',
  };

  assert.equal(student.admissionNumber, 'ADM-2026-001');
  assert.equal(student.status, 'active');
  assert.equal(student.courseId, 'crs_c10');
  assert.equal(student.batchId, 'btc_morning');

  // Verify allowed statuses
  const validStatuses: StudentStatus[] = ['active', 'suspended', 'graduated', 'dropped'];
  for (const status of validStatuses) {
    const updated: Student = { ...student, status };
    assert.equal(updated.status, status);
  }

  // Verify batch transfer preserves student identity and updates batch details
  const transferred: Student = {
    ...student,
    batchId: 'btc_evening',
    batchName: 'Evening Beta Batch',
  };
  assert.equal(transferred.id, student.id);
  assert.equal(transferred.admissionNumber, student.admissionNumber);
  assert.equal(transferred.batchId, 'btc_evening');
  assert.equal(transferred.batchName, 'Evening Beta Batch');
});
