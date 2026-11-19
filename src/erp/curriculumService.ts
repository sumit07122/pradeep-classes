import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { DayOfWeek, Exam, ExamResult, Homework, TimetableSlot } from './types';

// ==========================================
// Timetable Operations
// ==========================================

export async function fetchBatchTimetable(
  instituteId: string,
  batchId: string
): Promise<TimetableSlot[]> {
  if (!instituteId || !batchId) return [];

  const q = query(
    collection(db, 'timetables'),
    where('instituteId', '==', instituteId),
    where('batchId', '==', batchId)
  );

  const snap = await getDocs(q);
  const slots: TimetableSlot[] = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      instituteId: String(data.instituteId || instituteId),
      batchId: String(data.batchId || batchId),
      batchName: String(data.batchName || ''),
      dayOfWeek: data.dayOfWeek as DayOfWeek,
      startTime: String(data.startTime || ''),
      endTime: String(data.endTime || ''),
      subjectName: String(data.subjectName || ''),
      teacherName: String(data.teacherName || ''),
      room: typeof data.room === 'string' ? data.room : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });

  const dayOrder: Record<DayOfWeek, number> = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
  };

  return slots.sort((a, b) => {
    const dayDiff = (dayOrder[a.dayOfWeek] || 0) - (dayOrder[b.dayOfWeek] || 0);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}

export async function saveTimetableSlot(
  instituteId: string,
  slot: Omit<TimetableSlot, 'id' | 'instituteId'> & { id?: string }
): Promise<string> {
  const now = new Date();
  if (slot.id) {
    const ref = doc(db, 'timetables', slot.id);
    await updateDoc(ref, {
      ...slot,
      updatedAt: now,
    });
    return slot.id;
  } else {
    const ref = await addDoc(collection(db, 'timetables'), {
      ...slot,
      instituteId,
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  }
}

export async function deleteTimetableSlot(slotId: string): Promise<void> {
  await deleteDoc(doc(db, 'timetables', slotId));
}

// ==========================================
// Homework & Assignments
// ==========================================

export async function fetchBatchHomework(
  instituteId: string,
  batchId: string
): Promise<Homework[]> {
  if (!instituteId || !batchId) return [];

  const q = query(
    collection(db, 'homework'),
    where('instituteId', '==', instituteId),
    where('batchId', '==', batchId)
  );

  const snap = await getDocs(q);
  const items = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      instituteId: String(data.instituteId || instituteId),
      batchId: String(data.batchId || batchId),
      batchName: String(data.batchName || ''),
      subjectName: String(data.subjectName || ''),
      title: String(data.title || ''),
      description: String(data.description || ''),
      dueDate: String(data.dueDate || ''),
      assignedBy: String(data.assignedBy || ''),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });

  return items.sort((a, b) => (b.dueDate > a.dueDate ? 1 : -1));
}

export async function saveHomework(
  instituteId: string,
  hw: Omit<Homework, 'id' | 'instituteId'> & { id?: string }
): Promise<string> {
  const now = new Date();
  if (hw.id) {
    const ref = doc(db, 'homework', hw.id);
    await updateDoc(ref, {
      ...hw,
      updatedAt: now,
    });
    return hw.id;
  } else {
    const ref = await addDoc(collection(db, 'homework'), {
      ...hw,
      instituteId,
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  }
}

export async function deleteHomework(hwId: string): Promise<void> {
  await deleteDoc(doc(db, 'homework', hwId));
}

// ==========================================
// Exams & Marks
// ==========================================

export async function fetchBatchExams(
  instituteId: string,
  batchId: string
): Promise<Exam[]> {
  if (!instituteId || !batchId) return [];

  const q = query(
    collection(db, 'exams'),
    where('instituteId', '==', instituteId),
    where('batchId', '==', batchId)
  );

  const snap = await getDocs(q);
  const list = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      instituteId: String(data.instituteId || instituteId),
      batchId: String(data.batchId || batchId),
      batchName: String(data.batchName || ''),
      title: String(data.title || ''),
      subjectName: String(data.subjectName || ''),
      examDate: String(data.examDate || ''),
      totalMarks: Number(data.totalMarks || 100),
      passingMarks: Number(data.passingMarks || 40),
      status: (data.status as 'scheduled' | 'completed' | 'graded') || 'scheduled',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });

  return list.sort((a, b) => (b.examDate > a.examDate ? 1 : -1));
}

export async function saveExam(
  instituteId: string,
  exam: Omit<Exam, 'id' | 'instituteId'> & { id?: string }
): Promise<string> {
  const now = new Date();
  if (exam.id) {
    const ref = doc(db, 'exams', exam.id);
    await updateDoc(ref, {
      ...exam,
      updatedAt: now,
    });
    return exam.id;
  } else {
    const ref = await addDoc(collection(db, 'exams'), {
      ...exam,
      instituteId,
      status: exam.status || 'scheduled',
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  }
}

export async function fetchExamResults(
  instituteId: string,
  examId: string
): Promise<ExamResult[]> {
  if (!instituteId || !examId) return [];

  const q = query(
    collection(db, 'exam_results'),
    where('instituteId', '==', instituteId),
    where('examId', '==', examId)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      instituteId: String(data.instituteId || instituteId),
      examId: String(data.examId || examId),
      studentId: String(data.studentId || ''),
      studentName: String(data.studentName || ''),
      admissionNumber: String(data.admissionNumber || ''),
      marksObtained: Number(data.marksObtained || 0),
      totalMarks: Number(data.totalMarks || 100),
      percentage: Number(data.percentage || 0),
      grade: String(data.grade || 'F'),
      remarks: typeof data.remarks === 'string' ? data.remarks : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });
}

export async function saveExamResults(
  instituteId: string,
  examId: string,
  results: Omit<ExamResult, 'id' | 'instituteId' | 'examId'>[]
): Promise<void> {
  const now = new Date();

  // First fetch any existing results to update or replace
  const existing = await fetchExamResults(instituteId, examId);
  const existingMap = new Map(existing.map((r) => [r.studentId, r.id]));

  const batch = writeBatch(db);

  for (const r of results) {
    const existingDocId = existingMap.get(r.studentId);
    if (existingDocId) {
      const docRef = doc(db, 'exam_results', existingDocId);
      batch.update(docRef, {
        ...r,
        updatedAt: now,
      });
    } else {
      const newRef = doc(collection(db, 'exam_results'));
      batch.set(newRef, {
        ...r,
        instituteId,
        examId,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Update exam status to 'graded'
  const examRef = doc(db, 'exams', examId);
  batch.update(examRef, {
    status: 'graded',
    updatedAt: now,
  });

  await batch.commit();
}
