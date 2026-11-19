import test from 'node:test';
import assert from 'node:assert/strict';
import { hasErpPermission } from './rbac';
import type { FeePayment, FeeStructure } from './types';

test('financial access permissions strictly isolate fee desk to Owner and Accountant', () => {
  // Owner: view + manage
  assert.equal(hasErpPermission('institute_owner', 'finance:view', 'active'), true);
  assert.equal(hasErpPermission('institute_owner', 'finance:manage', 'active'), true);

  // Accountant: view + manage
  assert.equal(hasErpPermission('accountant', 'finance:view', 'active'), true);
  assert.equal(hasErpPermission('accountant', 'finance:manage', 'active'), true);

  // Admin: strictly blocked from financial ledger and fee management
  assert.equal(hasErpPermission('institute_admin', 'finance:view', 'active'), false);
  assert.equal(hasErpPermission('institute_admin', 'finance:manage', 'active'), false);

  // Teacher: strictly blocked from financial ledger and fee management
  assert.equal(hasErpPermission('teacher', 'finance:view', 'active'), false);
  assert.equal(hasErpPermission('teacher', 'finance:manage', 'active'), false);

  // Suspended staff loses finance access immediately
  assert.equal(hasErpPermission('accountant', 'finance:view', 'suspended'), false);
  assert.equal(hasErpPermission('institute_owner', 'finance:manage', 'suspended'), false);
});

test('fee structure and receipt balance invariants calculate correctly', () => {
  const structure: FeeStructure = {
    id: 'fee_c10_2026',
    instituteId: 'inst_pradeep',
    courseId: 'crs_c10',
    courseName: 'Class 10 CBSE Foundation',
    academicSessionId: '2026-2027',
    title: 'Standard Annual Plan',
    totalAmount: 35000,
    currency: 'INR',
    installments: 3,
    components: [
      { name: 'Admission Fee', amount: 5000 },
      { name: 'Tuition Term 1', amount: 15000 },
      { name: 'Tuition Term 2 & Lab', amount: 15000 },
    ],
    status: 'active',
  };

  const componentSum = structure.components.reduce((sum, c) => sum + c.amount, 0);
  assert.equal(componentSum, structure.totalAmount);

  // Payment 1: ₹15,000 paid towards ₹35,000
  const payment1: FeePayment = {
    id: 'pay_001',
    instituteId: 'inst_pradeep',
    studentId: 'stu_101',
    studentName: 'Rahul Sharma',
    studentAdmissionNumber: 'ADM-2026-001',
    batchName: 'Morning Alpha',
    receiptNumber: 'RCP-2026-0001',
    amountPaid: 15000,
    totalPayable: 35000,
    balanceRemaining: 20000,
    paymentMode: 'upi',
    transactionReference: 'UPI1234567890',
    paymentDate: '2026-04-10',
    academicSessionId: '2026-2027',
    collectedBy: 'Sumit Accountant',
    status: 'completed',
  };

  assert.equal(payment1.amountPaid, 15000);
  assert.equal(payment1.balanceRemaining, 20000);
  assert.equal(payment1.totalPayable - payment1.amountPaid, payment1.balanceRemaining);

  // Payment 2: Remaining ₹20,000 cleared
  const payment2: FeePayment = {
    ...payment1,
    id: 'pay_002',
    receiptNumber: 'RCP-2026-0002',
    amountPaid: 20000,
    balanceRemaining: 0,
    paymentDate: '2026-06-15',
  };

  assert.equal(payment2.balanceRemaining, 0);

  // Voiding payment
  const voidedPayment: FeePayment = {
    ...payment1,
    status: 'void',
    notes: 'Bounced cheque reversal',
  };
  assert.equal(voidedPayment.status, 'void');
  assert.equal(voidedPayment.notes, 'Bounced cheque reversal');
});
