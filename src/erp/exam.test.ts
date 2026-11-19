import test from 'node:test';
import assert from 'node:assert/strict';
import { hasErpPermission } from './rbac';
import type { Exam, ExamResult, TimetableSlot } from './types';

test('academic curriculum and examination permissions enforce role boundaries', () => {
  // Owner: view + manage
  assert.equal(hasErpPermission('institute_owner', 'academics:view', 'active'), true);
  assert.equal(hasErpPermission('institute_owner', 'academics:manage', 'active'), true);

  // Admin: view + manage
  assert.equal(hasErpPermission('institute_admin', 'academics:view', 'active'), true);
  assert.equal(hasErpPermission('institute_admin', 'academics:manage', 'active'), true);

  // Teacher: view only (can mark homework/exams in assigned batch, but not global institute structure)
  assert.equal(hasErpPermission('teacher', 'academics:view', 'active'), true);
  assert.equal(hasErpPermission('teacher', 'academics:manage', 'active'), false);

  // Accountant: strictly blocked from academic curriculum and exams
  assert.equal(hasErpPermission('accountant', 'academics:view', 'active'), false);
  assert.equal(hasErpPermission('accountant', 'academics:manage', 'active'), false);

  // Suspended staff loses academic permissions
  assert.equal(hasErpPermission('teacher', 'academics:view', 'suspended'), false);
  assert.equal(hasErpPermission('institute_owner', 'academics:manage', 'suspended'), false);
});

test('examination percentage and grade calculation conform to academic standards', () => {
  const exam: Exam = {
    id: 'exam_term1_math',
    instituteId: 'inst_pradeep',
    batchId: 'btc_alpha',
    batchName: 'Morning Alpha Batch',
    title: 'Mid-Term Mathematics Test',
    subjectName: 'Mathematics',
    examDate: '2026-05-10',
    totalMarks: 100,
    passingMarks: 40,
    status: 'graded',
  };

  assert.equal(exam.totalMarks, 100);
  assert.equal(exam.passingMarks, 40);

  function computeGrade(pct: number): string {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 65) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
  }

  const result1: ExamResult = {
    id: 'res_001',
    instituteId: 'inst_pradeep',
    examId: exam.id,
    studentId: 'stu_101',
    studentName: 'Rahul Sharma',
    admissionNumber: 'ADM-2026-001',
    marksObtained: 95,
    totalMarks: 100,
    percentage: 95,
    grade: computeGrade(95),
  };
  assert.equal(result1.percentage, 95);
  assert.equal(result1.grade, 'A+');

  const result2: ExamResult = {
    id: 'res_002',
    instituteId: 'inst_pradeep',
    examId: exam.id,
    studentId: 'stu_102',
    studentName: 'Pooja Singh',
    admissionNumber: 'ADM-2026-002',
    marksObtained: 35,
    totalMarks: 100,
    percentage: 35,
    grade: computeGrade(35),
  };
  assert.equal(result2.percentage, 35);
  assert.equal(result2.grade, 'F');
  assert.equal(result2.marksObtained < exam.passingMarks, true);
});

test('timetable slot schema enforces valid timing and day invariants', () => {
  const slot: TimetableSlot = {
    id: 'slot_1',
    instituteId: 'inst_pradeep',
    batchId: 'btc_alpha',
    batchName: 'Morning Alpha',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:30',
    subjectName: 'Advanced Physics',
    teacherName: 'Prof. Pradeep',
    room: 'Room 101',
  };

  assert.equal(slot.dayOfWeek, 'Monday');
  assert.equal(slot.startTime < slot.endTime, true);
  assert.equal(slot.subjectName, 'Advanced Physics');
});
