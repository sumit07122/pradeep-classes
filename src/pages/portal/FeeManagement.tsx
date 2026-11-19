import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  IndianRupee,
  Layers,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchCourses } from '../../erp/academicService';
import {
  fetchFeePayments,
  fetchFeeStructures,
  recordFeePayment,
  saveFeeStructure,
  voidFeePayment,
} from '../../erp/feeService';
import { fetchStudents } from '../../erp/studentService';
import type {
  Course,
  FeeComponent,
  FeePayment,
  FeeStructure,
  PaymentMode,
  Student,
} from '../../erp/types';

type FeeTab = 'payments' | 'structures' | 'dues';

export default function FeeManagement() {
  const { user, activeInstitute, erpRole, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<FeeTab>('payments');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Data states
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [receiptModalPayment, setReceiptModalPayment] = useState<FeePayment | null>(null);
  const [voidModalPayment, setVoidModalPayment] = useState<FeePayment | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Payment Form state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amountPaidInput, setAmountPaidInput] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Structure Form state
  const [structureForm, setStructureForm] = useState({
    courseId: '',
    title: '',
    totalAmount: 30000,
    installments: 3,
    components: [
      { name: 'Admission & Registration Fee', amount: 5000 },
      { name: 'Tuition Fee (Term 1)', amount: 15000 },
      { name: 'Examination & Materials', amount: 10000 },
    ] as FeeComponent[],
  });

  const [submittingModal, setSubmittingModal] = useState(false);

  const canManageFinance = hasPermission('finance:manage');

  const loadData = async () => {
    if (!activeInstitute?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [pay, str, stu, crs] = await Promise.all([
        fetchFeePayments(activeInstitute.id),
        fetchFeeStructures(activeInstitute.id),
        fetchStudents(activeInstitute.id),
        fetchCourses(activeInstitute.id),
      ]);
      setPayments(pay);
      setStructures(str);
      setStudents(stu);
      setCourses(crs);
    } catch (err: unknown) {
      console.error('Error loading finance records:', err);
      setError(err instanceof Error ? err.message : 'Failed to load financial records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeInstitute?.id]);

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // KPI Calculations
  const totalCollected = useMemo(() => {
    return payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amountPaid, 0);
  }, [payments]);

  const completedReceiptsCount = useMemo(() => {
    return payments.filter((p) => p.status === 'completed').length;
  }, [payments]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (paymentModeFilter !== 'all' && p.paymentMode !== paymentModeFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = p.studentName.toLowerCase().includes(query);
        const matchesAdm = p.studentAdmissionNumber.toLowerCase().includes(query);
        const matchesReceipt = p.receiptNumber.toLowerCase().includes(query);
        const matchesRef = p.transactionReference?.toLowerCase().includes(query) ?? false;
        if (!matchesName && !matchesAdm && !matchesReceipt && !matchesRef) return false;
      }
      return true;
    });
  }, [payments, paymentModeFilter, statusFilter, searchQuery]);

  // Selected student computation for Payment Record
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const studentFeeStructure = useMemo(() => {
    if (!selectedStudent) return null;
    return structures.find((s) => s.courseId === selectedStudent.courseId) || structures[0] || null;
  }, [structures, selectedStudent]);

  const studentTotalPaidSoFar = useMemo(() => {
    if (!selectedStudent) return 0;
    return payments
      .filter((p) => p.studentId === selectedStudent.id && p.status === 'completed')
      .reduce((acc, p) => acc + p.amountPaid, 0);
  }, [payments, selectedStudent]);

  const computedTotalPayable = useMemo(() => {
    return studentFeeStructure?.totalAmount || 35000;
  }, [studentFeeStructure]);

  const computedCurrentBalance = useMemo(() => {
    return Math.max(0, computedTotalPayable - studentTotalPaidSoFar);
  }, [computedTotalPayable, studentTotalPaidSoFar]);

  const computedBalanceRemainingAfterPayment = useMemo(() => {
    return Math.max(0, computedCurrentBalance - (Number(amountPaidInput) || 0));
  }, [computedCurrentBalance, amountPaidInput]);

  // Dues calculation per student
  const studentDuesList = useMemo(() => {
    return students.map((stu) => {
      const stuStructure = structures.find((s) => s.courseId === stu.courseId);
      const totalFee = stuStructure?.totalAmount || 35000;
      const paid = payments
        .filter((p) => p.studentId === stu.id && p.status === 'completed')
        .reduce((sum, p) => sum + p.amountPaid, 0);
      const due = Math.max(0, totalFee - paid);
      return {
        student: stu,
        totalFee,
        paid,
        due,
      };
    });
  }, [students, structures, payments]);

  const totalOutstandingDues = useMemo(() => {
    return studentDuesList.reduce((acc, item) => acc + item.due, 0);
  }, [studentDuesList]);

  // Handle Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute?.id || !selectedStudent || !canManageFinance) return;
    if (amountPaidInput <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    setSubmittingModal(true);
    try {
      const receiptNo = `RCP-${new Date().getFullYear()}-${String(payments.length + 1).padStart(4, '0')}`;
      await recordFeePayment(activeInstitute.id, {
        studentId: selectedStudent.id,
        studentName: selectedStudent.fullName,
        studentAdmissionNumber: selectedStudent.admissionNumber,
        batchName: selectedStudent.batchName,
        receiptNumber: receiptNo,
        amountPaid: Number(amountPaidInput),
        totalPayable: computedTotalPayable,
        balanceRemaining: computedBalanceRemainingAfterPayment,
        paymentMode,
        transactionReference: transactionRef.trim() || undefined,
        paymentDate,
        academicSessionId: activeInstitute.academicSession || '2026-2027',
        collectedBy: user?.displayName || user?.email || 'Accounts Desk',
        notes: paymentNotes.trim() || undefined,
        status: 'completed',
      });

      setRecordPaymentModalOpen(false);
      showToast(`Payment of ₹${amountPaidInput.toLocaleString('en-IN')} recorded successfully.`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record payment.');
    } finally {
      setSubmittingModal(false);
    }
  };

  // Handle Save Fee Structure
  const handleSaveFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute?.id || !canManageFinance) return;
    setSubmittingModal(true);
    try {
      const course = courses.find((c) => c.id === structureForm.courseId);
      const totalComponentSum = structureForm.components.reduce((sum, c) => sum + c.amount, 0);

      await saveFeeStructure(activeInstitute.id, {
        courseId: structureForm.courseId,
        courseName: course?.name || 'Selected Program',
        academicSessionId: activeInstitute.academicSession || '2026-2027',
        title: structureForm.title.trim(),
        totalAmount: totalComponentSum || structureForm.totalAmount,
        currency: 'INR',
        installments: Number(structureForm.installments) || 1,
        components: structureForm.components,
        status: 'active',
      });

      setStructureModalOpen(false);
      showToast('Fee structure created successfully.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save fee structure.');
    } finally {
      setSubmittingModal(false);
    }
  };

  // Handle Void Payment
  const handleVoidPayment = async () => {
    if (!voidModalPayment || !canManageFinance) return;
    setSubmittingModal(true);
    try {
      await voidFeePayment(voidModalPayment.id, voidReason || 'Voided by authorized accounts staff');
      setVoidModalPayment(null);
      setVoidReason('');
      showToast(`Payment receipt ${voidModalPayment.receiptNumber} voided.`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to void payment.');
    } finally {
      setSubmittingModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Fee Desk & Financial Management</h1>
            <p className="text-sm text-slate-500">
              Fee collection ledgers, printable tax receipts, installment plans, and outstanding balance tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {canManageFinance && (
            <button
              onClick={() => {
                setSelectedStudentId(students[0]?.id || '');
                setAmountPaidInput(10000);
                setRecordPaymentModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-800">Financial Error</h4>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Collected</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900">
            ₹{totalCollected.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Outstanding Dues</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-bold text-amber-600">
            ₹{totalOutstandingDues.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Receipts Issued</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{completedReceiptsCount}</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fee Plans</span>
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{structures.length}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'payments'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Payments & Receipts ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('structures')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'structures'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Fee Structures ({structures.length})
        </button>

        <button
          onClick={() => setActiveTab('dues')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'dues'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Outstanding Dues ({studentDuesList.filter((d) => d.due > 0).length})
        </button>
      </div>

      {/* ------------------------------------------------ */}
      {/* TAB 1: Payments & Receipts */}
      {/* ------------------------------------------------ */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name, admission #, receipt #, UPI reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <select
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 text-slate-700 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Payment Modes</option>
                <option value="upi">UPI / QR</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="cheque">Cheque</option>
                <option value="card">Debit/Credit Card</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 text-slate-700 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="void">Void / Cancelled</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">Loading fee payment records...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">No payment receipts found</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Click "Record Payment" to issue your first student fee receipt.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-xs uppercase font-semibold">
                      <th className="px-5 py-3.5">Receipt #</th>
                      <th className="px-5 py-3.5">Student Details</th>
                      <th className="px-5 py-3.5">Amount Paid</th>
                      <th className="px-5 py-3.5">Balance</th>
                      <th className="px-5 py-3.5">Mode & Reference</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-xs text-slate-900">
                          {payment.receiptNumber}
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">{payment.studentName}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{payment.studentAdmissionNumber}</span>
                            <span>· {payment.batchName}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-bold text-emerald-600">
                          ₹{payment.amountPaid.toLocaleString('en-IN')}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          ₹{payment.balanceRemaining.toLocaleString('en-IN')}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded uppercase">
                            {payment.paymentMode}
                          </span>
                          {payment.transactionReference && (
                            <div className="text-xs text-slate-500 font-mono mt-0.5 truncate max-w-[120px]">
                              {payment.transactionReference}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-600">{payment.paymentDate}</td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              payment.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setReceiptModalPayment(payment)}
                              title="Print Official Receipt"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {canManageFinance && payment.status === 'completed' && (
                              <button
                                onClick={() => setVoidModalPayment(payment)}
                                title="Void Receipt"
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* TAB 2: Fee Structures */}
      {/* ------------------------------------------------ */}
      {activeTab === 'structures' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Institutional fee plans, tuition fee components, and installment rules.
            </p>
            {canManageFinance && (
              <button
                onClick={() => {
                  setStructureForm({
                    courseId: courses[0]?.id || '',
                    title: 'Annual Course Fee Plan',
                    totalAmount: 35000,
                    installments: 3,
                    components: [
                      { name: 'Admission & Registration', amount: 5000 },
                      { name: 'Tuition & Study Modules', amount: 20000 },
                      { name: 'Test Series & Lab Support', amount: 10000 },
                    ],
                  });
                  setStructureModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Fee Structure
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {structures.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                      {item.courseName}
                    </span>
                    <span className="text-xs text-slate-500">{item.installments} Installments</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{item.title}</h3>
                  <div className="text-2xl font-bold text-emerald-600 my-2">
                    ₹{item.totalAmount.toLocaleString('en-IN')}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Component Breakdown
                    </span>
                    {item.components.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-600">
                        <span>{c.name}</span>
                        <span className="font-semibold text-slate-800">
                          ₹{c.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {structures.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-700">No Fee Structures Configured</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Create course fee structures to automate student payment calculations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* TAB 3: Outstanding & Dues */}
      {/* ------------------------------------------------ */}
      {activeTab === 'dues' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Student Fee Defaulters & Balance Ledger</h3>
                <p className="text-xs text-slate-500">
                  Track students with outstanding pending balances for the current academic session.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-xs uppercase font-semibold">
                    <th className="px-5 py-3.5">Student Details</th>
                    <th className="px-5 py-3.5">Course / Batch</th>
                    <th className="px-5 py-3.5">Total Fee</th>
                    <th className="px-5 py-3.5">Paid So Far</th>
                    <th className="px-5 py-3.5">Balance Due</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {studentDuesList
                    .filter((item) => item.due > 0)
                    .map((item) => (
                      <tr key={item.student.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">{item.student.fullName}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            {item.student.admissionNumber} · {item.student.guardianPhone}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-900">{item.student.courseName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.student.batchName}</div>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          ₹{item.totalFee.toLocaleString('en-IN')}
                        </td>

                        <td className="px-5 py-4 font-semibold text-emerald-600">
                          ₹{item.paid.toLocaleString('en-IN')}
                        </td>

                        <td className="px-5 py-4 font-bold text-amber-600">
                          ₹{item.due.toLocaleString('en-IN')}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {canManageFinance && (
                            <button
                              onClick={() => {
                                setSelectedStudentId(item.student.id);
                                setAmountPaidInput(item.due);
                                setRecordPaymentModalOpen(true);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                            >
                              Collect Due
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                  {studentDuesList.filter((item) => item.due > 0).length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                        All enrolled students have cleared their academic fees!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* MODAL: Record Fee Payment */}
      {/* ------------------------------------------------ */}
      {recordPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Record Student Fee Payment</h3>
              <button onClick={() => setRecordPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Select Student *
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Choose student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.admissionNumber} - {s.courseName})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent && (
                <div className="p-4 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Program Fee:</span>
                    <span className="font-semibold text-slate-800">
                      ₹{computedTotalPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paid to date:</span>
                    <span className="font-semibold text-emerald-600">
                      ₹{studentTotalPaidSoFar.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1">
                    <span className="text-slate-700 font-semibold">Current Balance Due:</span>
                    <span className="font-bold text-amber-600">
                      ₹{computedCurrentBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Amount Paying (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-base focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="upi">UPI / QR Code</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Transaction Ref / UTR
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI Ref / Cheque #"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="Installment 1 / Special concession notes..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                <span>Remaining Balance After Payment:</span>
                <span className="font-bold text-sm">
                  ₹{computedBalanceRemainingAfterPayment.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRecordPaymentModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal || !selectedStudentId}
                  className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingModal ? 'Recording...' : 'Generate Receipt & Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* MODAL: Printable Fee Receipt */}
      {/* ------------------------------------------------ */}
      {receiptModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-600" />
                Official Fee Receipt
              </h3>
              <button onClick={() => setReceiptModalPayment(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div id="printable-receipt" className="p-8 space-y-6 bg-white text-slate-900">
              {/* Institute Brand Header */}
              <div className="text-center border-b border-slate-200 pb-5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">PRADEEP CLASSES</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Center for Academic Excellence & Competitive Examinations
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Session: {receiptModalPayment.academicSessionId}
                </p>
              </div>

              {/* Receipt Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Receipt Number:</span>
                  <span className="font-mono font-bold text-sm text-slate-800">
                    {receiptModalPayment.receiptNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Payment Date:</span>
                  <span className="font-semibold text-slate-800">{receiptModalPayment.paymentDate}</span>
                </div>
              </div>

              {/* Student Details */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-bold text-slate-900">{receiptModalPayment.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admission Number:</span>
                  <span className="font-mono text-slate-800">
                    {receiptModalPayment.studentAdmissionNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Batch / Program:</span>
                  <span className="text-slate-800">{receiptModalPayment.batchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-semibold uppercase text-slate-800">
                    {receiptModalPayment.paymentMode}
                  </span>
                </div>
                {receiptModalPayment.transactionReference && (
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">Ref / UTR:</span>
                    <span className="text-slate-800">{receiptModalPayment.transactionReference}</span>
                  </div>
                )}
              </div>

              {/* Amount Breakdown */}
              <div className="space-y-2 border-t border-b border-slate-200 py-4 text-sm">
                <div className="flex justify-between font-bold text-base text-emerald-700">
                  <span>AMOUNT PAID:</span>
                  <span>₹{receiptModalPayment.amountPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Balance Remaining:</span>
                  <span>₹{receiptModalPayment.balanceRemaining.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Footer Signatures */}
              <div className="pt-6 flex items-end justify-between text-xs text-slate-500">
                <div>
                  <p>Collected by: {receiptModalPayment.collectedBy}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Computer Generated Receipt</p>
                </div>
                <div className="text-center">
                  <div className="w-28 border-b border-slate-400 mb-1"></div>
                  <span className="text-[11px] font-medium text-slate-700">Authorized Signature</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReceiptModalPayment(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* MODAL: Fee Structure */}
      {/* ------------------------------------------------ */}
      {structureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add Fee Structure</h3>
              <button onClick={() => setStructureModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFeeStructure} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Course Program *
                </label>
                <select
                  required
                  value={structureForm.courseId}
                  onChange={(e) => setStructureForm({ ...structureForm, courseId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select course...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Fee Structure Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 10 Full Annual Package"
                  value={structureForm.title}
                  onChange={(e) => setStructureForm({ ...structureForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Installments Allowed
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={structureForm.installments}
                  onChange={(e) => setStructureForm({ ...structureForm, installments: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStructureModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingModal ? 'Saving...' : 'Save Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* MODAL: Void Payment */}
      {/* ------------------------------------------------ */}
      {voidModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-red-600">Void Payment Receipt</h3>
              <button onClick={() => setVoidModalPayment(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to void receipt{' '}
                <span className="font-bold text-slate-900">{voidModalPayment.receiptNumber}</span> (₹
                {voidModalPayment.amountPaid.toLocaleString('en-IN')}) for student{' '}
                <span className="font-bold text-slate-900">{voidModalPayment.studentName}</span>?
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Reason for Cancellation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Incorrect amount entered / Cheque bounced"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVoidModalPayment(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVoidPayment}
                  disabled={submittingModal}
                  className="px-5 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingModal ? 'Voiding...' : 'Confirm Void'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
