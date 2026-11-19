import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AttendanceRecord } from './types';

/**
 * Fetch attendance record for a specific batch on a specific date
 */
export async function fetchAttendanceRecord(
  instituteId: string,
  batchId: string,
  date: string
): Promise<AttendanceRecord | null> {
  if (!instituteId || !batchId || !date) return null;

  const q = query(
    collection(db, 'attendance_records'),
    where('instituteId', '==', instituteId),
    where('batchId', '==', batchId),
    where('date', '==', date)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const d = snap.docs[0];
  const data = d.data();
  return {
    id: d.id,
    instituteId: String(data.instituteId || instituteId),
    batchId: String(data.batchId || batchId),
    batchName: String(data.batchName || ''),
    courseId: String(data.courseId || ''),
    date: String(data.date || date),
    markedBy: String(data.markedBy || ''),
    markedByName: String(data.markedByName || ''),
    totalStudents: Number(data.totalStudents || 0),
    presentCount: Number(data.presentCount || 0),
    absentCount: Number(data.absentCount || 0),
    lateCount: Number(data.lateCount || 0),
    excusedCount: Number(data.excusedCount || 0),
    entries: Array.isArray(data.entries) ? data.entries : [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Save or update an attendance record
 */
export async function saveAttendanceRecord(
  instituteId: string,
  record: Omit<AttendanceRecord, 'id' | 'instituteId'> & { id?: string }
): Promise<string> {
  const now = new Date();
  if (record.id) {
    const ref = doc(db, 'attendance_records', record.id);
    await updateDoc(ref, {
      ...record,
      updatedAt: now,
    });
    return record.id;
  } else {
    const ref = await addDoc(collection(db, 'attendance_records'), {
      ...record,
      instituteId,
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  }
}

/**
 * Fetch historical attendance records for a batch
 */
export async function fetchBatchAttendanceHistory(
  instituteId: string,
  batchId: string
): Promise<AttendanceRecord[]> {
  if (!instituteId || !batchId) return [];

  const q = query(
    collection(db, 'attendance_records'),
    where('instituteId', '==', instituteId),
    where('batchId', '==', batchId)
  );

  const snap = await getDocs(q);
  const records = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      instituteId: String(data.instituteId || instituteId),
      batchId: String(data.batchId || batchId),
      batchName: String(data.batchName || ''),
      courseId: String(data.courseId || ''),
      date: String(data.date || ''),
      markedBy: String(data.markedBy || ''),
      markedByName: String(data.markedByName || ''),
      totalStudents: Number(data.totalStudents || 0),
      presentCount: Number(data.presentCount || 0),
      absentCount: Number(data.absentCount || 0),
      lateCount: Number(data.lateCount || 0),
      excusedCount: Number(data.excusedCount || 0),
      entries: Array.isArray(data.entries) ? data.entries : [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });

  // Sort descending by date
  return records.sort((a, b) => (b.date > a.date ? 1 : -1));
}
