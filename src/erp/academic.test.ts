import test from 'node:test';
import assert from 'node:assert/strict';
import { hasErpPermission } from './rbac';
import type { AcademicSession, Batch, Classroom, Course, Subject } from './types';

test('academic permission hierarchy enforces administrative governance', () => {
  // Owner permissions
  assert.equal(hasErpPermission('institute_owner', 'institute:settings:view', 'active'), true);
  assert.equal(hasErpPermission('institute_owner', 'institute:settings:manage', 'active'), true);
  assert.equal(hasErpPermission('institute_owner', 'academics:manage', 'active'), true);
  assert.equal(hasErpPermission('institute_owner', 'academics:view', 'active'), true);

  // Admin permissions (can manage courses/batches, can view settings, but cannot update institute legal/owner settings)
  assert.equal(hasErpPermission('institute_admin', 'institute:settings:view', 'active'), true);
  assert.equal(hasErpPermission('institute_admin', 'institute:settings:manage', 'active'), false);
  assert.equal(hasErpPermission('institute_admin', 'academics:manage', 'active'), true);
  assert.equal(hasErpPermission('institute_admin', 'academics:view', 'active'), true);

  // Accountant restrictions
  assert.equal(hasErpPermission('accountant', 'institute:settings:view', 'active'), false);
  assert.equal(hasErpPermission('accountant', 'institute:settings:manage', 'active'), false);
  assert.equal(hasErpPermission('accountant', 'academics:manage', 'active'), false);

  // Teacher restrictions (can view academics e.g. assigned batch curriculum, but cannot manage institute structure)
  assert.equal(hasErpPermission('teacher', 'institute:settings:view', 'active'), false);
  assert.equal(hasErpPermission('teacher', 'institute:settings:manage', 'active'), false);
  assert.equal(hasErpPermission('teacher', 'academics:manage', 'active'), false);
  assert.equal(hasErpPermission('teacher', 'academics:view', 'active'), true);
});

test('academic structures conform to required schema types and invariants', () => {
  const session: AcademicSession = {
    id: 'sess_2026',
    instituteId: 'inst_pradeep',
    name: '2026-2027',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    isCurrent: true,
    status: 'active',
  };
  assert.equal(session.name, '2026-2027');
  assert.equal(session.isCurrent, true);

  const course: Course = {
    id: 'course_c10',
    instituteId: 'inst_pradeep',
    name: 'Class 10 CBSE Board',
    code: 'C10-CBSE',
    durationMonths: 12,
    status: 'active',
  };
  assert.equal(course.code, 'C10-CBSE');
  assert.equal(course.status, 'active');

  const batch: Batch = {
    id: 'batch_alpha',
    instituteId: 'inst_pradeep',
    courseId: course.id,
    courseName: course.name,
    name: 'Morning Alpha',
    code: 'B-MOR-01',
    academicSessionId: session.id,
    startDate: '2026-04-15',
    maxCapacity: 45,
    room: 'Room 101',
    status: 'active',
  };
  assert.equal(batch.maxCapacity, 45);
  assert.equal(batch.courseId, 'course_c10');

  const classroom: Classroom = {
    id: 'room_101',
    instituteId: 'inst_pradeep',
    roomNumber: 'ROOM-101',
    name: 'Aryabhata Hall',
    capacity: 50,
    status: 'active',
  };
  assert.equal(classroom.capacity, 50);

  const subject: Subject = {
    id: 'sub_math',
    instituteId: 'inst_pradeep',
    courseId: course.id,
    name: 'Mathematics',
    code: 'MATH-10',
    status: 'active',
  };
  assert.equal(subject.code, 'MATH-10');
});
