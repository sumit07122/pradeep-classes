import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  DEMO_BATCHES,
  DEMO_CLASSROOMS,
  DEMO_COURSES,
  DEMO_INSTITUTE,
  DEMO_SUBJECTS,
} from './demoData';
import type {
  AcademicSession,
  Batch,
  Classroom,
  Course,
  Institute,
  Subject,
} from './types';

// ==========================================
// Institute Profile & Settings
// ==========================================

export async function fetchInstituteProfile(instituteId: string): Promise<Institute | null> {
  if (!instituteId) return DEMO_INSTITUTE;
  try {
    const snap = await getDoc(doc(db, 'institutes', instituteId));
    if (!snap.exists()) return DEMO_INSTITUTE;
    const d = snap.data();
    return {
      id: snap.id,
      name: String(d.name || ''),
      code: String(d.code || ''),
      status: d.status || 'active',
      ownerUid: String(d.ownerUid || ''),
      academicSession: String(d.academicSession || ''),
      timezone: String(d.timezone || 'Asia/Kolkata'),
      logo: typeof d.logo === 'string' ? d.logo : undefined,
      address: typeof d.address === 'string' ? d.address : undefined,
      phone: typeof d.phone === 'string' ? d.phone : undefined,
      email: typeof d.email === 'string' ? d.email : undefined,
      website: typeof d.website === 'string' ? d.website : undefined,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  } catch {
    return DEMO_INSTITUTE;
  }
}

export async function updateInstituteProfile(
  instituteId: string,
  data: Partial<Pick<Institute, 'name' | 'code' | 'academicSession' | 'timezone' | 'logo' | 'address' | 'phone' | 'email' | 'website'>>
): Promise<void> {
  const instRef = doc(db, 'institutes', instituteId);
  const now = new Date();
  await updateDoc(instRef, {
    ...data,
    updatedAt: now,
  });
}

// ==========================================
// Academic Sessions
// ==========================================

export async function fetchAcademicSessions(instituteId: string): Promise<AcademicSession[]> {
  try {
    const q = query(collection(db, 'academic_sessions'), where('instituteId', '==', instituteId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        instituteId,
        name: String(d.data().name || ''),
        startDate: String(d.data().startDate || ''),
        endDate: String(d.data().endDate || ''),
        isCurrent: Boolean(d.data().isCurrent),
        status: d.data().status === 'archived' ? 'archived' : 'active',
        createdAt: d.data().createdAt,
        updatedAt: d.data().updatedAt,
      }));
    }
  } catch {}
  return [
    {
      id: 'ses_2026_27',
      instituteId,
      name: '2026-2027',
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      isCurrent: true,
      status: 'active',
    },
  ];
}

export async function saveAcademicSession(
  instituteId: string,
  session: Omit<AcademicSession, 'id' | 'instituteId'> & { id?: string }
): Promise<string> {
  const now = new Date();
  if (session.id) {
    const ref = doc(db, 'academic_sessions', session.id);
    await updateDoc(ref, {
      ...session,
      updatedAt: now,
    });
    return session.id;
  } else {
    const ref = await addDoc(collection(db, 'academic_sessions'), {
      ...session,
      instituteId,
      status: session.status || 'active',
      isCurrent: session.isCurrent || false,
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  }
}

// ==========================================
// Courses
// ==========================================

export async function fetchCourses(instituteId: string): Promise<Course[]> {
  try {
    const q = query(collection(db, 'courses'), where('instituteId', '==', instituteId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        instituteId,
        name: String(d.data().name || ''),
        code: String(d.data().code || ''),
        description: typeof d.data().description === 'string' ? d.data().description : undefined,
        durationMonths: typeof d.data().durationMonths === 'number' ? d.data().durationMonths : undefined,
        status: d.data().status === 'archived' ? 'archived' : 'active',
        createdAt: d.data().createdAt,
        updatedAt: d.data().updatedAt,
      }));
    }
  } catch {}
  return DEMO_COURSES;
}

export async function saveCourse(
  instituteId: string,
  course: Omit<Course, 'id' | 'instituteId'> & { id?: string }
): Promise<string> {
  const now = new Date();
  if (course.id) {
    const ref = doc(db, 'courses', course.id);
    await updateDoc(ref, {
      ...course,
      updatedAt: now,
    });
    return course.id;
  } else {
    const ref = await addDoc(collection(db, 'courses'), {
      ...course,
      instituteId,
      status: course.status || 'active',
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  }
}

export async function archiveCourse(courseId: string): Promise<void> {
  const ref = doc(db, 'courses', courseId);
  await updateDoc(ref, {
    status: 'archived',
    updatedAt: new Date(),
  });
}

// ==========================================
// Batches
// ==========================================

export async function fetchBatches(instituteId: string): Promise<Batch[]> {
  try {
    const q = query(collection(db, 'batches'), where('instituteId', '==', instituteId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        instituteId,
        courseId: String(d.data().courseId || ''),
        courseName: typeof d.data().courseName === 'string' ? d.data().courseName : undefined,
        name: String(d.data().name || ''),
        code: String(d.data().code || ''),
        academicSessionId: String(d.data().academicSessionId || ''),
        startDate: String(d.data().startDate || ''),
        endDate: typeof d.data().endDate === 'string' ? d.data().endDate : undefined,
        maxCapacity: Number(d.data().maxCapacity || 40),
        room: typeof d.data().room === 'string' ? d.data().room : undefined,
        teacherUid: typeof d.data().teacherUid === 'string' ? d.data().teacherUid : undefined,
        status: (d.data().status as any) || 'active',
        createdAt: d.data().createdAt,
        updatedAt: d.data().updatedAt,
      }));
    }
  } catch {}
  return DEMO_BATCHES;
}

export async function saveBatch(
  instituteId: string,
  batch: Omit<Batch, 'id' | 'instituteId'> & { id?: string }
): Promise<string> {
  const now = new Date();
  if (batch.id) {
    const ref = doc(db, 'batches', batch.id);
    await updateDoc(ref, {
      ...batch,
      updatedAt: now,
    });
    return batch.id;
  } else {
    const ref = await addDoc(collection(db, 'batches'), {
      ...batch,
      instituteId,
      status: batch.status || 'active',
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  }
}

export async function archiveBatch(batchId: string): Promise<void> {
  const ref = doc(db, 'batches', batchId);
  await updateDoc(ref, {
    status: 'archived',
    updatedAt: new Date(),
  });
}

// ==========================================
// Classrooms
// ==========================================

export async function fetchClassrooms(instituteId: string): Promise<Classroom[]> {
  try {
    const q = query(collection(db, 'classrooms'), where('instituteId', '==', instituteId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        instituteId,
        roomNumber: String(d.data().roomNumber || ''),
        name: String(d.data().name || ''),
        capacity: Number(d.data().capacity || 30),
        status: d.data().status === 'inactive' ? 'inactive' : 'active',
        createdAt: d.data().createdAt,
        updatedAt: d.data().updatedAt,
      }));
    }
  } catch {}
  return DEMO_CLASSROOMS;
}

export async function saveClassroom(
  instituteId: string,
  room: Omit<Classroom, 'id' | 'instituteId'> & { id?: string }
): Promise<string> {
  const now = new Date();
  if (room.id) {
    const ref = doc(db, 'classrooms', room.id);
    await updateDoc(ref, {
      ...room,
      updatedAt: now,
    });
    return room.id;
  } else {
    const ref = await addDoc(collection(db, 'classrooms'), {
      ...room,
      instituteId,
      status: room.status || 'active',
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  }
}

// ==========================================
// Subjects
// ==========================================

export async function fetchSubjects(instituteId: string): Promise<Subject[]> {
  try {
    const q = query(collection(db, 'subjects'), where('instituteId', '==', instituteId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        instituteId,
        courseId: typeof d.data().courseId === 'string' ? d.data().courseId : undefined,
        name: String(d.data().name || ''),
        code: String(d.data().code || ''),
        teacherUid: typeof d.data().teacherUid === 'string' ? d.data().teacherUid : undefined,
        teacherName: typeof d.data().teacherName === 'string' ? d.data().teacherName : undefined,
        status: d.data().status === 'archived' ? 'archived' : 'active',
        createdAt: d.data().createdAt,
        updatedAt: d.data().updatedAt,
      }));
    }
  } catch {}
  return DEMO_SUBJECTS;
}

export async function saveSubject(
  instituteId: string,
  subject: Omit<Subject, 'id' | 'instituteId'> & { id?: string }
): Promise<string> {
  const now = new Date();
  if (subject.id) {
    const ref = doc(db, 'subjects', subject.id);
    await updateDoc(ref, {
      ...subject,
      updatedAt: now,
    });
    return subject.id;
  } else {
    const ref = await addDoc(collection(db, 'subjects'), {
      ...subject,
      instituteId,
      status: subject.status || 'active',
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  }
}
