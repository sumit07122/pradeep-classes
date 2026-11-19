import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Eye,
  Filter,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchBatches, fetchCourses } from '../../erp/academicService';
import {
  fetchStudents,
  saveStudent,
  transferStudentBatch,
  updateStudentStatus,
} from '../../erp/studentService';
import type { Batch, Course, Student, StudentStatus } from '../../erp/types';

export default function StudentManagement() {
  const { activeInstitute, erpRole, hasPermission } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [admissionModalOpen, setAdmissionModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [detailsStudent, setDetailsStudent] = useState<Student | null>(null);
  const [transferStudent, setTransferStudent] = useState<Student | null>(null);
  const [statusModalStudent, setStatusModalStudent] = useState<Student | null>(null);

  // Admission Form State
  const [formData, setFormData] = useState({
    admissionNumber: '',
    rollNumber: '',
    fullName: '',
    gender: 'male' as 'male' | 'female' | 'other',
    dob: '',
    phone: '',
    email: '',
    bloodGroup: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: 'Father',
    address: '',
    courseId: '',
    batchId: '',
    admissionDate: new Date().toISOString().split('T')[0],
    emergencyContact: '',
  });

  const [transferTargetBatchId, setTransferTargetBatchId] = useState('');
  const [newStatus, setNewStatus] = useState<StudentStatus>('active');
  const [submittingModal, setSubmittingModal] = useState(false);

  const canManageStudents = hasPermission('students:manage');

  const loadData = async () => {
    if (!activeInstitute?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [stu, crs, btc] = await Promise.all([
        fetchStudents(activeInstitute.id),
        fetchCourses(activeInstitute.id),
        fetchBatches(activeInstitute.id),
      ]);
      setStudents(stu);
      setCourses(crs);
      setBatches(btc);
    } catch (err: unknown) {
      console.error('Error loading student records:', err);
      setError(err instanceof Error ? err.message : 'Failed to load students.');
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

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (courseFilter !== 'all' && s.courseId !== courseFilter) return false;
      if (batchFilter !== 'all' && s.batchId !== batchFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = s.fullName.toLowerCase().includes(query);
        const matchesAdm = s.admissionNumber.toLowerCase().includes(query);
        const matchesRoll = s.rollNumber ? s.rollNumber.toLowerCase().includes(query) : false;
        const matchesPhone = s.phone.includes(query);
        const matchesGuardian = s.guardianName.toLowerCase().includes(query);
        if (!matchesName && !matchesAdm && !matchesRoll && !matchesPhone && !matchesGuardian) {
          return false;
        }
      }
      return true;
    });
  }, [students, courseFilter, batchFilter, statusFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Batches filtered by selected course in admission form
  const availableBatchesForCourse = useMemo(() => {
    if (!formData.courseId) return batches;
    return batches.filter((b) => b.courseId === formData.courseId);
  }, [batches, formData.courseId]);

  // Open Admission Modal
  const openAdmissionModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber || '',
        fullName: student.fullName,
        gender: student.gender,
        dob: student.dob || '',
        phone: student.phone,
        email: student.email || '',
        bloodGroup: student.bloodGroup || '',
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        guardianRelation: student.guardianRelation,
        address: student.address || '',
        courseId: student.courseId,
        batchId: student.batchId,
        admissionDate: student.admissionDate || new Date().toISOString().split('T')[0],
        emergencyContact: student.emergencyContact || '',
      });
    } else {
      setEditingStudent(null);
      const nextAdmNum = `ADM-${new Date().getFullYear()}-${String(students.length + 1).padStart(3, '0')}`;
      setFormData({
        admissionNumber: nextAdmNum,
        rollNumber: '',
        fullName: '',
        gender: 'male',
        dob: '',
        phone: '',
        email: '',
        bloodGroup: '',
        guardianName: '',
        guardianPhone: '',
        guardianRelation: 'Father',
        address: '',
        courseId: courses[0]?.id || '',
        batchId: batches[0]?.id || '',
        admissionDate: new Date().toISOString().split('T')[0],
        emergencyContact: '',
      });
    }
    setAdmissionModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute?.id || !canManageStudents) return;
    setSubmittingModal(true);
    try {
      const selectedCourse = courses.find((c) => c.id === formData.courseId);
      const selectedBatch = batches.find((b) => b.id === formData.batchId);

      await saveStudent(activeInstitute.id, {
        id: editingStudent?.id,
        admissionNumber: formData.admissionNumber.trim().toUpperCase(),
        rollNumber: formData.rollNumber.trim() || undefined,
        fullName: formData.fullName.trim(),
        gender: formData.gender,
        dob: formData.dob || undefined,
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        bloodGroup: formData.bloodGroup.trim() || undefined,
        guardianName: formData.guardianName.trim(),
        guardianPhone: formData.guardianPhone.trim(),
        guardianRelation: formData.guardianRelation.trim(),
        address: formData.address.trim() || undefined,
        courseId: formData.courseId,
        courseName: selectedCourse?.name || 'Assigned Course',
        batchId: formData.batchId,
        batchName: selectedBatch?.name || 'Assigned Batch',
        academicSessionId: activeInstitute.academicSession || '2026-2027',
        admissionDate: formData.admissionDate,
        emergencyContact: formData.emergencyContact.trim() || undefined,
        status: editingStudent?.status || 'active',
      });

      setAdmissionModalOpen(false);
      showToast(editingStudent ? 'Student details updated.' : 'Student admitted successfully.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save student.');
    } finally {
      setSubmittingModal(false);
    }
  };

  // Handle Transfer Batch
  const handleTransferBatch = async () => {
    if (!transferStudent || !transferTargetBatchId || !canManageStudents) return;
    setSubmittingModal(true);
    try {
      const targetBatch = batches.find((b) => b.id === transferTargetBatchId);
      if (!targetBatch) throw new Error('Target batch not found.');

      await transferStudentBatch(transferStudent.id, targetBatch.id, targetBatch.name);
      setTransferStudent(null);
      showToast(`Student successfully transferred to ${targetBatch.name}.`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to transfer batch.');
    } finally {
      setSubmittingModal(false);
    }
  };

  // Handle Status Change
  const handleUpdateStatus = async () => {
    if (!statusModalStudent || !canManageStudents) return;
    setSubmittingModal(true);
    try {
      await updateStudentStatus(statusModalStudent.id, newStatus);
      setStatusModalStudent(null);
      showToast(`Student status updated to ${newStatus}.`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update student status.');
    } finally {
      setSubmittingModal(false);
    }
  };

  const getStatusBadge = (status: StudentStatus) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'suspended':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'graduated':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'dropped':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Student Directory & Admissions</h1>
            <p className="text-sm text-slate-500">
              Manage student enrollments, batches, guardian contacts, and academic history.
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

          {canManageStudents && (
            <button
              onClick={() => openAdmissionModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Admission
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-800">Operation Error</h4>
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
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Enrolled</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{students.length}</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Students</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900">
            {students.filter((s) => s.status === 'active').length}
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Course Programs</span>
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{courses.length}</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Batches</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{batches.length}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, admission #, roll #, phone, guardian..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={batchFilter}
            onChange={(e) => {
              setBatchFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="graduated">Graduated</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">Loading student directory...</p>
          </div>
        ) : paginatedStudents.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No students found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {searchQuery || courseFilter !== 'all' || batchFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search query or filters.'
                : 'Click "New Admission" to admit your first student.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-xs uppercase font-semibold">
                  <th className="px-5 py-3.5">Student Details</th>
                  <th className="px-5 py-3.5">Admission / Roll</th>
                  <th className="px-5 py-3.5">Course & Batch</th>
                  <th className="px-5 py-3.5">Guardian Contact</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {student.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{student.fullName}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{student.gender}</span>
                            {student.phone && <span>· {student.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-mono text-xs font-semibold text-slate-800">
                        {student.admissionNumber}
                      </div>
                      {student.rollNumber && (
                        <div className="text-xs text-slate-500 mt-0.5">Roll: {student.rollNumber}</div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{student.courseName}</div>
                      <div className="text-xs text-blue-600 font-medium mt-0.5">{student.batchName}</div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-slate-800">{student.guardianName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {student.guardianPhone} ({student.guardianRelation})
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                          student.status
                        )}`}
                      >
                        {student.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailsStudent(student)}
                          title="View Profile Details"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canManageStudents && (
                          <>
                            <button
                              onClick={() => openAdmissionModal(student)}
                              title="Edit Student Info"
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setTransferStudent(student);
                                setTransferTargetBatchId(batches.find((b) => b.id !== student.batchId)?.id || '');
                              }}
                              title="Transfer Batch"
                              className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setStatusModalStudent(student);
                                setNewStatus(student.status);
                              }}
                              title="Change Status"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && filteredStudents.length > pageSize && (
          <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length} students
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------ */}
      {/* MODAL: New Admission / Edit Student */}
      {/* ------------------------------------------------ */}
      {admissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-900">
                {editingStudent ? 'Edit Student Record' : 'New Student Admission'}
              </h3>
              <button onClick={() => setAdmissionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-5">
              {/* Personal Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
                  1. Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })
                      }
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Student Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                    <input
                      type="text"
                      placeholder="e.g. O+, B+"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                  <textarea
                    rows={2}
                    placeholder="Full postal address..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Guardian Information */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
                  2. Parent / Guardian Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sharma"
                      value={formData.guardianName}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 9811223344"
                      value={formData.guardianPhone}
                      onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Relation *</label>
                    <input
                      type="text"
                      required
                      placeholder="Father, Mother, Local Guardian"
                      value={formData.guardianRelation}
                      onChange={(e) => setFormData({ ...formData, guardianRelation: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Program & Batch Allocation */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
                  3. Academic Allocation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Course Program *</label>
                    <select
                      required
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Allocation *</label>
                    <select
                      required
                      value={formData.batchId}
                      onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select batch...</option>
                      {availableBatchesForCourse.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.admissionNumber}
                      onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Roll Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 101"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdmissionModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingModal ? 'Saving...' : editingStudent ? 'Update Student' : 'Admit Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* DRAWER: Student Profile Details */}
      {/* ------------------------------------------------ */}
      {detailsStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <h3 className="text-base font-bold text-slate-900">Student Profile</h3>
              <button onClick={() => setDetailsStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 font-bold text-xl flex items-center justify-center shrink-0">
                  {detailsStudent.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{detailsStudent.fullName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      {detailsStudent.admissionNumber}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(
                        detailsStudent.status
                      )}`}
                    >
                      {detailsStudent.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Academic Placement */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">Academic Placement</h5>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Course Program:</span>
                  <span className="font-semibold text-slate-800">{detailsStudent.courseName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Allocated Batch:</span>
                  <span className="font-semibold text-blue-600">{detailsStudent.batchName}</span>
                </div>
                {detailsStudent.rollNumber && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Roll Number:</span>
                    <span className="font-semibold text-slate-800">{detailsStudent.rollNumber}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Admission Date:</span>
                  <span className="font-semibold text-slate-800">{detailsStudent.admissionDate}</span>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">Personal Information</h5>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{detailsStudent.phone}</span>
                </div>
                {detailsStudent.email && (
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{detailsStudent.email}</span>
                  </div>
                )}
                {detailsStudent.dob && (
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>DOB: {detailsStudent.dob}</span>
                  </div>
                )}
                {detailsStudent.address && (
                  <div className="flex items-start gap-3 text-sm text-slate-700">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{detailsStudent.address}</span>
                  </div>
                )}
              </div>

              {/* Guardian Info */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">Guardian Details</h5>
                <div className="text-sm font-semibold text-slate-800">{detailsStudent.guardianName}</div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {detailsStudent.guardianPhone} ({detailsStudent.guardianRelation})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* MODAL: Batch Transfer */}
      {/* ------------------------------------------------ */}
      {transferStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Transfer Student Batch</h3>
              <button onClick={() => setTransferStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Transfer <span className="font-bold text-slate-900">{transferStudent.fullName}</span> from{' '}
                <span className="font-semibold text-blue-600">{transferStudent.batchName}</span> to another batch.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Select Target Batch *
                </label>
                <select
                  value={transferTargetBatchId}
                  onChange={(e) => setTransferTargetBatchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select destination batch...</option>
                  {batches
                    .filter((b) => b.id !== transferStudent.batchId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.courseName || b.code})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferStudent(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransferBatch}
                  disabled={submittingModal || !transferTargetBatchId}
                  className="px-5 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingModal ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* MODAL: Status Update */}
      {/* ------------------------------------------------ */}
      {statusModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Update Enrollment Status</h3>
              <button onClick={() => setStatusModalStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Select new status for <span className="font-bold text-slate-900">{statusModalStudent.fullName}</span>:
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as StudentStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active (Enrolled)</option>
                  <option value="suspended">Suspended</option>
                  <option value="graduated">Graduated (Completed Program)</option>
                  <option value="dropped">Dropped Out</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusModalStudent(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={submittingModal}
                  className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingModal ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
