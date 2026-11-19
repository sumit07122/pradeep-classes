import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEMO_ANNOUNCEMENTS } from './demoData';
import type { Announcement } from './types';

/**
 * Fetch announcements for an institute
 */
export async function fetchAnnouncements(
  instituteId: string,
  audienceFilter?: string
): Promise<Announcement[]> {
  if (!instituteId) return DEMO_ANNOUNCEMENTS;
  let results: Announcement[] = [];

  try {
    const q = query(collection(db, 'announcements'), where('instituteId', '==', instituteId));
    const snap = await getDocs(q);

    if (!snap.empty) {
      results = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          instituteId: String(data.instituteId || instituteId),
          title: String(data.title || ''),
          content: String(data.content || ''),
          targetAudience: data.targetAudience || 'all',
          batchId: typeof data.batchId === 'string' ? data.batchId : undefined,
          batchName: typeof data.batchName === 'string' ? data.batchName : undefined,
          priority: data.priority || 'normal',
          publishedBy: String(data.publishedBy || 'Admin Desk'),
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });
    }
  } catch {}

  if (results.length === 0) {
    results = [...DEMO_ANNOUNCEMENTS];
  }

  if (audienceFilter && audienceFilter !== 'all') {
    results = results.filter(
      (a) => a.targetAudience === 'all' || a.targetAudience === audienceFilter
    );
  }

  // Sort descending by creation
  return results.sort((a, b) => {
    const timeA = (a.createdAt as any)?.seconds || 0;
    const timeB = (b.createdAt as any)?.seconds || 0;
    return timeB - timeA;
  });
}

/**
 * Save or update an announcement
 */
export async function saveAnnouncement(
  instituteId: string,
  ann: Omit<Announcement, 'id' | 'instituteId'> & { id?: string }
): Promise<string> {
  const now = new Date();
  if (ann.id) {
    const ref = doc(db, 'announcements', ann.id);
    await updateDoc(ref, {
      ...ann,
      updatedAt: now,
    });
    return ann.id;
  } else {
    const ref = await addDoc(collection(db, 'announcements'), {
      ...ann,
      instituteId,
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  }
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(annId: string): Promise<void> {
  await deleteDoc(doc(db, 'announcements', annId));
}

// ==========================================
// WhatsApp Dispatch & Template Generators
// ==========================================

export function cleanPhoneNumber(phone: string): string {
  // Strip non-digits
  let digits = phone.replace(/\D/g, '');
  // If 10 digits (standard Indian mobile), prepend 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return digits;
}

export function generateWhatsAppLink(rawPhone: string, message: string): string {
  const cleaned = cleanPhoneNumber(rawPhone);
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function formatFeeReminderMessage(
  studentName: string,
  balance: number,
  instituteName: string = 'Pradeep Classes',
  upiId?: string
): string {
  return `Dear Parent / Guardian,

This is a gentle reminder from *${instituteName}* regarding the fee payment for *${studentName}*.

Pending Balance Due: *₹${balance.toLocaleString('en-IN')}*
${upiId ? `Payment UPI ID: *${upiId}*\n` : ''}
Kindly settle the outstanding amount at your earliest convenience. If already paid, please ignore this notice.

Thank you,
Accounts Desk, ${instituteName}`;
}

export function formatAbsenceNotice(
  studentName: string,
  date: string,
  batchName: string,
  instituteName: string = 'Pradeep Classes'
): string {
  return `Dear Parent / Guardian,

This is to inform you that *${studentName}* (${batchName}) was marked *ABSENT* today (*${date}*) at *${instituteName}*.

Regular attendance is critical for academic progress. If this absence was unplanned, please contact the institute office.

Regards,
Attendance Desk, ${instituteName}`;
}

export function formatExamScoreNotice(
  studentName: string,
  examTitle: string,
  marksObtained: number,
  totalMarks: number,
  grade: string,
  instituteName: string = 'Pradeep Classes'
): string {
  const percentage = Math.round((marksObtained / totalMarks) * 100);
  return `Dear Parent / Guardian,

Results for *${examTitle}* at *${instituteName}*:

Student: *${studentName}*
Marks Obtained: *${marksObtained} / ${totalMarks}* (${percentage}%)
Performance Grade: *${grade}*

We appreciate their efforts and encourage continued dedication.

Warm regards,
Academic Department, ${instituteName}`;
}
