import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Student, StudentStatus } from './types';

export interface StudentFilter {
  batchId?: string;
  courseId?: string;
  status?: StudentStatus;
  search?: string;
}

/**
 * Fetch students for an institute with client-side filtering support.
 */
export async function fetchStudents(
  instituteId: string,
  filter?: StudentFilter
): Promise<Student[]> {
  if (!instituteId) return [];

  const q = query(collection(db, 'students'), where('instituteId', '==', instituteId));
  const snapshot = await getDocs(q);

  let results: Student[] = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      instituteId: String(data.instituteId || instituteId),
      admissionNumber: String(data.admissionNumber || ''),
      rollNumber: typeof data.rollNumber === 'string' ? data.rollNumber : undefined,
      fullName: String(data.fullName || ''),
      gender: (data.gender as 'male' | 'female' | 'other') || 'other',
      dob: typeof data.dob === 'string' ? data.dob : undefined,
      phone: String(data.phone || ''),
      email: typeof data.email === 'string' ? data.email : undefined,
      bloodGroup: typeof data.bloodGroup === 'string' ? data.bloodGroup : undefined,
      guardianName: String(data.guardianName || ''),
      guardianPhone: String(data.guardianPhone || ''),
      guardianRelation: String(data.guardianRelation || 'Guardian'),
      address: typeof data.address === 'string' ? data.address : undefined,
      courseId: String(data.courseId || ''),
      courseName: String(data.courseName || ''),
      batchId: String(data.batchId || ''),
      batchName: String(data.batchName || ''),
      academicSessionId: String(data.academicSessionId || ''),
      admissionDate: String(data.admissionDate || ''),
      status: (data.status as StudentStatus) || 'active',
      photoURL: typeof data.photoURL === 'string' ? data.photoURL : undefined,
      emergencyContact: typeof data.emergencyContact === 'string' ? data.emergencyContact : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });

  if (filter?.status) {
    results = results.filter((s) => s.status === filter.status);
  }

  if (filter?.courseId) {
    results = results.filter((s) => s.courseId === filter.courseId);
  }

  if (filter?.batchId) {
    results = results.filter((s) => s.batchId === filter.batchId);
  }

  if (filter?.search) {
    const term = filter.search.toLowerCase().trim();
    results = results.filter(
      (s) =>
        s.fullName.toLowerCase().includes(term) ||
        s.admissionNumber.toLowerCase().includes(term) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(term)) ||
        s.phone.includes(term) ||
        s.guardianName.toLowerCase().includes(term) ||
        s.guardianPhone.includes(term)
    );
  }

  return results;
}

/**
 * Fetch a single student by ID
 */
export async function fetchStudentById(studentId: string): Promise<Student | null> {
  if (!studentId) return null;
  const snap = await getDoc(doc(db, 'students', studentId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    instituteId: String(data.instituteId || ''),
    admissionNumber: String(data.admissionNumber || ''),
    rollNumber: typeof data.rollNumber === 'string' ? data.rollNumber : undefined,
    fullName: String(data.fullName || ''),
    gender: (data.gender as 'male' | 'female' | 'other') || 'other',
    dob: typeof data.dob === 'string' ? data.dob : undefined,
    phone: String(data.phone || ''),
    email: typeof data.email === 'string' ? data.email : undefined,
    bloodGroup: typeof data.bloodGroup === 'string' ? data.bloodGroup : undefined,
    guardianName: String(data.guardianName || ''),
    guardianPhone: String(data.guardianPhone || ''),
    guardianRelation: String(data.guardianRelation || 'Guardian'),
    address: typeof data.address === 'string' ? data.address : undefined,
    courseId: String(data.courseId || ''),
    courseName: String(data.courseName || ''),
    batchId: String(data.batchId || ''),
    batchName: String(data.batchName || ''),
    academicSessionId: String(data.academicSessionId || ''),
    admissionDate: String(data.admissionDate || ''),
    status: (data.status as StudentStatus) || 'active',
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : undefined,
    emergencyContact: typeof data.emergencyContact === 'string' ? data.emergencyContact : undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Create or update a student record
 */
export async function saveStudent(
  instituteId: string,
  student: Omit<Student, 'id' | 'instituteId'> & { id?: string }
): Promise<string> {
  const now = new Date();
  if (student.id) {
    const ref = doc(db, 'students', student.id);
    await updateDoc(ref, {
      ...student,
      updatedAt: now,
    });
    return student.id;
  } else {
    const ref = await addDoc(collection(db, 'students'), {
      ...student,
      instituteId,
      status: student.status || 'active',
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  }
}

/**
 * Transfer student to another batch
 */
export async function transferStudentBatch(
  studentId: string,
  newBatchId: string,
  newBatchName: string
): Promise<void> {
  const ref = doc(db, 'students', studentId);
  await updateDoc(ref, {
    batchId: newBatchId,
    batchName: newBatchName,
    updatedAt: new Date(),
  });
}

/**
 * Update student status (active, suspended, graduated, dropped)
 */
export async function updateStudentStatus(
  studentId: string,
  status: StudentStatus
): Promise<void> {
  const ref = doc(db, 'students', studentId);
  await updateDoc(ref, {
    status,
    updatedAt: new Date(),
  });
}
