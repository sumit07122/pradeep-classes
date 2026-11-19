import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  DoorOpen,
  Edit2,
  Eye,
  FileCheck,
  FileText,
  Filter,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchBatches, fetchSubjects } from '../../erp/academicService';
import {
  deleteHomework,
  deleteTimetableSlot,
  fetchBatchExams,
  fetchBatchHomework,
  fetchBatchTimetable,
  fetchExamResults,
  saveExam,
  saveExamResults,
  saveHomework,
  saveTimetableSlot,
} from '../../erp/curriculumService';
import { fetchStudents } from '../../erp/studentService';
import type {
  Batch,
  DayOfWeek,
  Exam,
  ExamResult,
  Homework,
  Student,
  Subject,
  TimetableSlot,
} from '../../erp/types';

type AcademicTab = 'timetable' | 'homework' | 'exams';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function AcademicManagement() {
  const { user, activeInstitute, erpRole, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<AcademicTab>('timetable');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Data states
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [examsList, setExamsList] = useState<Exam[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [timetableModalOpen, setTimetableModalOpen] = useState(false);
  const [timetableForm, setTimetableForm] = useState({
    dayOfWeek: 'Monday' as DayOfWeek,
    startTime: '09:00',
    endTime: '10:30',
    subjectName: '',
    teacherName: '',
    room: '',
  });

  const [homeworkModalOpen, setHomeworkModalOpen] = useState(false);
  const [homeworkForm, setHomeworkForm] = useState({
    subjectName: '',
    title: '',
    description: '',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
  });

  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examForm, setExamForm] = useState({
    title: '',
    subjectName: '',
    examDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    totalMarks: 100,
    passingMarks: 40,
  });

  const [gradingExam, setGradingExam] = useState<Exam | null>(null);
  const [gradingEntries, setGradingEntries] = useState<
    Record<string, { marksObtained: number; remarks: string }>
  >({});

  const [resultsModalExam, setResultsModalExam] = useState<Exam | null>(null);
  const [currentExamResults, setCurrentExamResults] = useState<ExamResult[]>([]);

  const [submittingModal, setSubmittingModal] = useState(false);

  const canManage = hasPermission('academics:manage') || erpRole === 'teacher';

  // Load Batches & Subjects
  useEffect(() => {
    async function init() {
      if (!activeInstitute?.id) return;
      try {
        const [btc, sbj] = await Promise.all([
          fetchBatches(activeInstitute.id),
          fetchSubjects(activeInstitute.id),
        ]);
        const activeBatches = btc.filter((b) => b.status === 'active');
        setBatches(activeBatches);
        setSubjects(sbj);
        if (activeBatches.length > 0 && !selectedBatchId) {
          setSelectedBatchId(activeBatches[0].id);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to initialize academic modules.');
      }
    }
    init();
  }, [activeInstitute?.id]);

  // Load Batch Data
  const loadBatchData = async () => {
    if (!activeInstitute?.id || !selectedBatchId) return;
    setLoading(true);
    setError(null);
    try {
      const [tt, hw, ex, stu] = await Promise.all([
        fetchBatchTimetable(activeInstitute.id, selectedBatchId),
        fetchBatchHomework(activeInstitute.id, selectedBatchId),
        fetchBatchExams(activeInstitute.id, selectedBatchId),
        fetchStudents(activeInstitute.id, { batchId: selectedBatchId }),
      ]);
      setTimetableSlots(tt);
      setHomeworkList(hw);
      setExamsList(ex);
      setStudents(stu.filter((s) => s.status === 'active'));
    } catch (err: unknown) {
      console.error('Error loading academic data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load batch data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatchData();
  }, [activeInstitute?.id, selectedBatchId]);

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const currentBatch = useMemo(() => {
    return batches.find((b) => b.id === selectedBatchId);
  }, [batches, selectedBatchId]);

  // ----------------------------------------------------
  // Timetable Handlers
  // ----------------------------------------------------
  const handleSaveTimetableSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute?.id || !selectedBatchId || !currentBatch) return;
    setSubmittingModal(true);
    try {
      await saveTimetableSlot(activeInstitute.id, {
        batchId: selectedBatchId,
        batchName: currentBatch.name,
        dayOfWeek: timetableForm.dayOfWeek,
        startTime: timetableForm.startTime,
        endTime: timetableForm.endTime,
        subjectName: timetableForm.subjectName.trim(),
        teacherName: timetableForm.teacherName.trim(),
        room: timetableForm.room.trim() || undefined,
      });

      setTimetableModalOpen(false);
      showToast('Timetable class slot scheduled.');
      await loadBatchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save timetable slot.');
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to remove this timetable slot?')) return;
    try {
      await deleteTimetableSlot(slotId);
      showToast('Timetable slot removed.');
      await loadBatchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete slot.');
    }
  };

  // ----------------------------------------------------
  // Homework Handlers
  // ----------------------------------------------------
  const handleSaveHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute?.id || !selectedBatchId || !currentBatch) return;
    setSubmittingModal(true);
    try {
      await saveHomework(activeInstitute.id, {
        batchId: selectedBatchId,
        batchName: currentBatch.name,
        subjectName: homeworkForm.subjectName.trim(),
        title: homeworkForm.title.trim(),
        description: homeworkForm.description.trim(),
        dueDate: homeworkForm.dueDate,
        assignedBy: user?.displayName || user?.email || 'Faculty',
      });

      setHomeworkModalOpen(false);
      showToast('Homework assignment published.');
      await loadBatchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save homework.');
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleDeleteHomework = async (hwId: string) => {
    if (!confirm('Are you sure you want to delete this homework assignment?')) return;
    try {
      await deleteHomework(hwId);
      showToast('Homework assignment removed.');
      await loadBatchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete homework.');
    }
  };

  // ----------------------------------------------------
  // Exam Handlers
  // ----------------------------------------------------
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute?.id || !selectedBatchId || !currentBatch) return;
    setSubmittingModal(true);
    try {
      await saveExam(activeInstitute.id, {
        batchId: selectedBatchId,
        batchName: currentBatch.name,
        title: examForm.title.trim(),
        subjectName: examForm.subjectName.trim(),
        examDate: examForm.examDate,
        totalMarks: Number(examForm.totalMarks) || 100,
        passingMarks: Number(examForm.passingMarks) || 40,
        status: 'scheduled',
      });

      setExamModalOpen(false);
      showToast('New examination scheduled.');
      await loadBatchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to schedule exam.');
    } finally {
      setSubmittingModal(false);
    }
  };

  // Open Grading Modal
  const openGradingModal = async (exam: Exam) => {
    if (!activeInstitute?.id) return;
    setGradingExam(exam);
    const existing = await fetchExamResults(activeInstitute.id, exam.id);
    const entryMap: Record<string, { marksObtained: number; remarks: string }> = {};

    for (const r of existing) {
      entryMap[r.studentId] = {
        marksObtained: r.marksObtained,
        remarks: r.remarks || '',
      };
    }

    for (const s of students) {
      if (!entryMap[s.id]) {
        entryMap[s.id] = {
          marksObtained: 0,
          remarks: '',
        };
      }
    }

    setGradingEntries(entryMap);
  };

  const computeGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 65) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const handleSaveGrading = async () => {
    if (!activeInstitute?.id || !gradingExam) return;
    setSubmittingModal(true);
    try {
      const resultsToSave = students.map((s) => {
        const entry = gradingEntries[s.id] || { marksObtained: 0, remarks: '' };
        const marks = Number(entry.marksObtained) || 0;
        const total = gradingExam.totalMarks || 100;
        const pct = Math.round((marks / total) * 100);

        return {
          studentId: s.id,
          studentName: s.fullName,
          admissionNumber: s.admissionNumber,
          marksObtained: marks,
          totalMarks: total,
          percentage: pct,
          grade: computeGrade(pct),
          remarks: entry.remarks.trim() || undefined,
        };
      });

      await saveExamResults(activeInstitute.id, gradingExam.id, resultsToSave);
      setGradingExam(null);
      showToast('Exam results and student marks recorded successfully.');
      await loadBatchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save marks.');
    } finally {
      setSubmittingModal(false);
    }
  };

  // Open View Results Modal
  const openResultsModal = async (exam: Exam) => {
    if (!activeInstitute?.id) return;
    setResultsModalExam(exam);
    const results = await fetchExamResults(activeInstitute.id, exam.id);
    setCurrentExamResults(results.sort((a, b) => b.marksObtained - a.marksObtained));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Academic & Examination Management</h1>
            <p className="text-sm text-slate-500">
              Timetable schedules, homework distribution, and examination marksheets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Batch Selector */}
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          <button
            onClick={loadBatchData}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-800">Academic Operation Error</h4>
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('timetable')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'timetable'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Weekly Timetable ({timetableSlots.length})
        </button>

        <button
          onClick={() => setActiveTab('homework')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'homework'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Homework & Assignments ({homeworkList.length})
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'exams'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          Exams & Marks ({examsList.length})
        </button>
      </div>

      {/* ------------------------------------------------ */}
      {/* TAB 1: Weekly Timetable */}
      {/* ------------------------------------------------ */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Weekly class routine for <span className="font-bold text-slate-900">{currentBatch?.name}</span>.
            </p>
            {canManage && (
              <button
                onClick={() => {
                  setTimetableForm({
                    dayOfWeek: 'Monday',
                    startTime: '09:00',
                    endTime: '10:30',
                    subjectName: subjects[0]?.name || '',
                    teacherName: user?.displayName || 'Faculty',
                    room: currentBatch?.room || 'Room 101',
                  });
                  setTimetableModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Class Slot
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAYS_OF_WEEK.map((day) => {
              const daySlots = timetableSlots.filter((s) => s.dayOfWeek === day);

              return (
                <div
                  key={day}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="font-bold text-slate-900">{day}</span>
                    <span className="text-xs text-slate-500 font-semibold">{daySlots.length} Classes</span>
                  </div>

                  <div className="space-y-2.5">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">{slot.subjectName}</h4>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Teacher: {slot.teacherName}
                            {slot.room && <span> · {slot.room}</span>}
                          </div>
                        </div>

                        {canManage && (
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    {daySlots.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-2 text-center">No classes scheduled</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* TAB 2: Homework & Assignments */}
      {/* ------------------------------------------------ */}
      {activeTab === 'homework' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Active assignments and study tasks assigned to <span className="font-bold text-slate-900">{currentBatch?.name}</span>.
            </p>
            {canManage && (
              <button
                onClick={() => {
                  setHomeworkForm({
                    subjectName: subjects[0]?.name || '',
                    title: '',
                    description: '',
                    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                  });
                  setHomeworkModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Publish Homework
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {homeworkList.map((hw) => (
              <div
                key={hw.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md">
                      {hw.subjectName}
                    </span>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      Due: {hw.dueDate}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">{hw.title}</h3>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-3 mb-4">
                    {hw.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                  <span>Assigned by: {hw.assignedBy}</span>
                  {canManage && (
                    <button
                      onClick={() => handleDeleteHomework(hw.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {homeworkList.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-700">No Homework Assigned</h3>
                <p className="text-xs text-slate-500 mt-1">Publish homework tasks for student home practice.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* TAB 3: Exams & Student Marks */}
      {/* ------------------------------------------------ */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Assessment tests, mid-terms, and marksheets for <span className="font-bold text-slate-900">{currentBatch?.name}</span>.
            </p>
            {canManage && (
              <button
                onClick={() => {
                  setExamForm({
                    title: '',
                    subjectName: subjects[0]?.name || '',
                    examDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
                    totalMarks: 100,
                    passingMarks: 40,
                  });
                  setExamModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Schedule Exam
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examsList.map((exam) => (
              <div
                key={exam.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                      {exam.subjectName}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        exam.status === 'graded'
                          ? 'bg-emerald-50 text-emerald-700'
                          : exam.status === 'completed'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {exam.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{exam.title}</h3>
                  <div className="space-y-1 text-xs text-slate-500 mt-2">
                    <div className="flex justify-between">
                      <span>Exam Date:</span>
                      <span className="font-semibold text-slate-800">{exam.examDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maximum Marks:</span>
                      <span className="font-semibold text-slate-800">{exam.totalMarks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passing Marks:</span>
                      <span className="font-semibold text-slate-800">{exam.passingMarks}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                  {exam.status === 'graded' && (
                    <button
                      onClick={() => openResultsModal(exam)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      View Results
                    </button>
                  )}

                  {canManage && (
                    <button
                      onClick={() => openGradingModal(exam)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-xs"
                    >
                      {exam.status === 'graded' ? 'Edit Marks' : 'Enter Marks'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {examsList.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
                <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-700">No Exams Scheduled</h3>
                <p className="text-xs text-slate-500 mt-1">Schedule exams to evaluate student academic progress.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* MODAL: Add Timetable Slot */}
      {/* ------------------------------------------------ */}
      {timetableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Schedule Class Slot</h3>
              <button onClick={() => setTimetableModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTimetableSlot} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Day of Week *
                </label>
                <select
                  value={timetableForm.dayOfWeek}
                  onChange={(e) => setTimetableForm({ ...timetableForm, dayOfWeek: e.target.value as DayOfWeek })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={timetableForm.startTime}
                    onChange={(e) => setTimetableForm({ ...timetableForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={timetableForm.endTime}
                    onChange={(e) => setTimetableForm({ ...timetableForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics / Physics"
                  value={timetableForm.subjectName}
                  onChange={(e) => setTimetableForm({ ...timetableForm, subjectName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Faculty Teacher *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. Pradeep"
                    value={timetableForm.teacherName}
                    onChange={(e) => setTimetableForm({ ...timetableForm, teacherName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Classroom (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 101"
                    value={timetableForm.room}
                    onChange={(e) => setTimetableForm({ ...timetableForm, room: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTimetableModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingModal ? 'Scheduling...' : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* MODAL: Publish Homework */}
      {/* ------------------------------------------------ */}
      {homeworkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Publish Homework Assignment</h3>
              <button onClick={() => setHomeworkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHomework} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={homeworkForm.subjectName}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, subjectName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Homework Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4 Trigonometry Problem Set 1"
                  value={homeworkForm.title}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Detailed Instructions *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Solve problems 1-15 on page 84..."
                  value={homeworkForm.description}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={homeworkForm.dueDate}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHomeworkModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingModal ? 'Publishing...' : 'Publish Homework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* MODAL: Schedule Exam */}
      {/* ------------------------------------------------ */}
      {examModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Schedule Examination</h3>
              <button onClick={() => setExamModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Exam Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit Test 1 - Algebra"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={examForm.subjectName}
                  onChange={(e) => setExamForm({ ...examForm, subjectName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Exam Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={examForm.examDate}
                    onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Total Marks *
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    required
                    value={examForm.totalMarks}
                    onChange={(e) => setExamForm({ ...examForm, totalMarks: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Passing Marks *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={examForm.passingMarks}
                    onChange={(e) => setExamForm({ ...examForm, passingMarks: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExamModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingModal ? 'Scheduling...' : 'Save Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* MODAL: Grading & Marks Entry */}
      {/* ------------------------------------------------ */}
      {gradingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{gradingExam.title}</h3>
                <p className="text-xs text-slate-500">
                  Subject: {gradingExam.subjectName} · Maximum Marks: {gradingExam.totalMarks}
                </p>
              </div>
              <button onClick={() => setGradingExam(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Admission #</th>
                    <th className="px-4 py-3 text-center">Marks (/{gradingExam.totalMarks})</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {students.map((stu) => {
                    const entry = gradingEntries[stu.id] || { marksObtained: 0, remarks: '' };

                    return (
                      <tr key={stu.id}>
                        <td className="px-4 py-3 font-semibold text-slate-900">{stu.fullName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          {stu.admissionNumber}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={gradingExam.totalMarks}
                            value={entry.marksObtained}
                            onChange={(e) =>
                              setGradingEntries((prev) => ({
                                ...prev,
                                [stu.id]: {
                                  ...prev[stu.id],
                                  marksObtained: Math.min(
                                    gradingExam.totalMarks,
                                    Math.max(0, Number(e.target.value))
                                  ),
                                },
                              }))
                            }
                            className="w-20 px-2 py-1 text-center font-bold text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder="Feedback / notes..."
                            value={entry.remarks}
                            onChange={(e) =>
                              setGradingEntries((prev) => ({
                                ...prev,
                                [stu.id]: {
                                  ...prev[stu.id],
                                  remarks: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setGradingExam(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingModal}
                onClick={handleSaveGrading}
                className="px-5 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm disabled:opacity-50"
              >
                {submittingModal ? 'Saving Marks...' : 'Save & Grade Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* MODAL: View Exam Results Sheet */}
      {/* ------------------------------------------------ */}
      {resultsModalExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {resultsModalExam.title} - Scorecard
                </h3>
                <p className="text-xs text-slate-500">
                  Subject: {resultsModalExam.subjectName} · Maximum: {resultsModalExam.totalMarks}
                </p>
              </div>
              <button onClick={() => setResultsModalExam(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Marks</th>
                    <th className="px-4 py-3">Percentage</th>
                    <th className="px-4 py-3">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {currentExamResults.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-bold text-slate-500">#{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {r.studentName}
                        <span className="block font-mono text-xs text-slate-400">
                          {r.admissionNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {r.marksObtained} / {r.totalMarks}
                      </td>
                      <td className="px-4 py-3 font-semibold text-purple-600">{r.percentage}%</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                            r.grade === 'A+' || r.grade === 'A'
                              ? 'bg-emerald-50 text-emerald-700'
                              : r.grade === 'F'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {r.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResultsModalExam(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
