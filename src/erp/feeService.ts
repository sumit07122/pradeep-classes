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
import type { FeePayment, FeeStructure, PaymentMode, PaymentStatus } from './types';

export interface FeePaymentFilter {
  studentId?: string;
  paymentMode?: PaymentMode;
  search?: string;
  status?: PaymentStatus;
}

/**
 * Fetch all fee structures configured for an institute
 */
export async function fetchFeeStructures(instituteId: string): Promise<FeeStructure[]> {
  if (!instituteId) return [];
  const q = query(collection(db, 'fee_structures'), where('instituteId', '==', instituteId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      instituteId: String(data.instituteId || instituteId),
      courseId: String(data.courseId || ''),
      courseName: String(data.courseName || ''),
      academicSessionId: String(data.academicSessionId || ''),
      title: String(data.title || ''),
      totalAmount: Number(data.totalAmount || 0),
      currency: String(data.currency || 'INR'),
      installments: Number(data.installments || 1),
      components: Array.isArray(data.components) ? data.components : [],
      status: data.status === 'archived' ? 'archived' : 'active',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });
}

/**
 * Create or update a fee structure
 */
export async function saveFeeStructure(
  instituteId: string,
  structure: Omit<FeeStructure, 'id' | 'instituteId'> & { id?: string }
): Promise<string> {
  const now = new Date();
  if (structure.id) {
    const ref = doc(db, 'fee_structures', structure.id);
    await updateDoc(ref, {
      ...structure,
      updatedAt: now,
    });
    return structure.id;
  } else {
    const ref = await addDoc(collection(db, 'fee_structures'), {
      ...structure,
      instituteId,
      status: structure.status || 'active',
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  }
}

/**
 * Fetch fee payments and collection ledgers
 */
export async function fetchFeePayments(
  instituteId: string,
  filter?: FeePaymentFilter
): Promise<FeePayment[]> {
  if (!instituteId) return [];
  const q = query(collection(db, 'fee_payments'), where('instituteId', '==', instituteId));
  const snap = await getDocs(q);

  let results: FeePayment[] = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      instituteId: String(data.instituteId || instituteId),
      studentId: String(data.studentId || ''),
      studentName: String(data.studentName || ''),
      studentAdmissionNumber: String(data.studentAdmissionNumber || ''),
      batchName: String(data.batchName || ''),
      receiptNumber: String(data.receiptNumber || ''),
      amountPaid: Number(data.amountPaid || 0),
      totalPayable: Number(data.totalPayable || 0),
      balanceRemaining: Number(data.balanceRemaining || 0),
      paymentMode: (data.paymentMode as PaymentMode) || 'cash',
      transactionReference: typeof data.transactionReference === 'string' ? data.transactionReference : undefined,
      paymentDate: String(data.paymentDate || ''),
      academicSessionId: String(data.academicSessionId || ''),
      collectedBy: String(data.collectedBy || ''),
      notes: typeof data.notes === 'string' ? data.notes : undefined,
      status: (data.status as PaymentStatus) || 'completed',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });

  if (filter?.studentId) {
    results = results.filter((p) => p.studentId === filter.studentId);
  }

  if (filter?.paymentMode) {
    results = results.filter((p) => p.paymentMode === filter.paymentMode);
  }

  if (filter?.status) {
    results = results.filter((p) => p.status === filter.status);
  }

  if (filter?.search) {
    const term = filter.search.toLowerCase().trim();
    results = results.filter(
      (p) =>
        p.studentName.toLowerCase().includes(term) ||
        p.studentAdmissionNumber.toLowerCase().includes(term) ||
        p.receiptNumber.toLowerCase().includes(term) ||
        (p.transactionReference && p.transactionReference.toLowerCase().includes(term))
    );
  }

  // Sort descending by payment date / timestamp
  return results.sort((a, b) => (b.paymentDate > a.paymentDate ? 1 : -1));
}

/**
 * Record a new fee payment and generate receipt
 */
export async function recordFeePayment(
  instituteId: string,
  payment: Omit<FeePayment, 'id' | 'instituteId'>
): Promise<string> {
  const now = new Date();
  const ref = await addDoc(collection(db, 'fee_payments'), {
    ...payment,
    instituteId,
    status: payment.status || 'completed',
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

/**
 * Void a payment entry (Owner action)
 */
export async function voidFeePayment(paymentId: string, reason: string): Promise<void> {
  const ref = doc(db, 'fee_payments', paymentId);
  await updateDoc(ref, {
    status: 'void',
    notes: reason,
    updatedAt: new Date(),
  });
}
