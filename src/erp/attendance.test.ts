import test from 'node:test';
import assert from 'node:assert/strict';
import { hasErpPermission } from './rbac';
import type { AttendanceEntry, AttendanceRecord, AttendanceStatus } from './types';

test('attendance management permissions grant marking authority to Owner, Admin, and Teacher', () => {
  // Owner: view + mark
  assert.equal(hasErpPermission('institute_owner', 'attendance:view', 'active'), true);
  assert.equal(hasErpPermission('institute_owner', 'attendance:mark', 'active'), true);

  // Admin: view + mark
  assert.equal(hasErpPermission('institute_admin', 'attendance:view', 'active'), true);
  assert.equal(hasErpPermission('institute_admin', 'attendance:mark', 'active'), true);

  // Teacher: view + mark
  assert.equal(hasErpPermission('teacher', 'attendance:view', 'active'), true);
  assert.equal(hasErpPermission('teacher', 'attendance:mark', 'active'), true);

  // Accountant: no attendance viewing or marking authority
  assert.equal(hasErpPermission('accountant', 'attendance:view', 'active'), false);
  assert.equal(hasErpPermission('accountant', 'attendance:mark', 'active'), false);

  // Suspended staff loses attendance authority immediately
  assert.equal(hasErpPermission('teacher', 'attendance:mark', 'suspended'), false);
  assert.equal(hasErpPermission('institute_owner', 'attendance:view', 'suspended'), false);
});

test('attendance record structure calculates present and absent metrics accurately', () => {
  const entries: AttendanceEntry[] = [
    {
      studentId: 'stu_1',
      studentName: 'Aarav Verma',
      admissionNumber: 'ADM-001',
      rollNumber: '1',
      status: 'present',
    },
    {
      studentId: 'stu_2',
      studentName: 'Bhavna Sen',
      admissionNumber: 'ADM-002',
      rollNumber: '2',
      status: 'absent',
      remarks: 'Sick leave',
    },
    {
      studentId: 'stu_3',
      studentName: 'Chirag Patil',
      admissionNumber: 'ADM-003',
      rollNumber: '3',
      status: 'late',
      remarks: 'Arrived 15m late',
    },
    {
      studentId: 'stu_4',
      studentName: 'Diya Rao',
      admissionNumber: 'ADM-004',
      rollNumber: '4',
      status: 'excused',
      remarks: 'School sports meet',
    },
  ];

  const presentCount = entries.filter((e) => e.status === 'present').length;
  const absentCount = entries.filter((e) => e.status === 'absent').length;
  const lateCount = entries.filter((e) => e.status === 'late').length;
  const excusedCount = entries.filter((e) => e.status === 'excused').length;

  const record: AttendanceRecord = {
    id: 'att_2026_04_15',
    instituteId: 'inst_pradeep',
    batchId: 'btc_alpha',
    batchName: 'Morning Alpha Batch',
    courseId: 'crs_c10',
    date: '2026-04-15',
    markedBy: 'teacher_uid',
    markedByName: 'Prof. Sharma',
    totalStudents: entries.length,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    entries,
  };

  assert.equal(record.totalStudents, 4);
  assert.equal(record.presentCount, 1);
  assert.equal(record.absentCount, 1);
  assert.equal(record.lateCount, 1);
  assert.equal(record.excusedCount, 1);
  assert.equal(
    record.totalStudents,
    record.presentCount + record.absentCount + record.lateCount + record.excusedCount
  );
});
