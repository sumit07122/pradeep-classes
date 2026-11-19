import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DoorOpen,
  Edit2,
  Globe,
  GraduationCap,
  Library,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  archiveBatch,
  archiveCourse,
  fetchAcademicSessions,
  fetchBatches,
  fetchClassrooms,
  fetchCourses,
  fetchInstituteProfile,
  fetchSubjects,
  saveAcademicSession,
  saveBatch,
  saveClassroom,
  saveCourse,
  saveSubject,
  updateInstituteProfile,
} from '../../erp/academicService';
import type {
  AcademicSession,
  Batch,
  Classroom,
  Course,
  Institute,
  Subject,
} from '../../erp/types';

type SettingsTab = 'profile' | 'sessions' | 'courses' | 'batches' | 'classrooms' | 'subjects';

export default function InstituteSettings() {
  const { activeInstitute, erpRole, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Data states
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    code: '',
    academicSession: '',
    timezone: 'Asia/Kolkata',
    phone: '',
    email: '',
    website: '',
    address: '',
    logo: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Modals state
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);
  const [sessionForm, setSessionForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
  });

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    description: '',
    durationMonths: 12,
  });

  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [batchForm, setBatchForm] = useState({
    name: '',
    code: '',
    courseId: '',
    academicSessionId: '',
    startDate: '',
    endDate: '',
    maxCapacity: 40,
    room: '',
  });

  const [classroomModalOpen, setClassroomModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [classroomForm, setClassroomForm] = useState({
    roomNumber: '',
    name: '',
    capacity: 35,
  });

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    courseId: '',
  });

  const [submittingModal, setSubmittingModal] = useState(false);

  // Permission flags
  const canManageInstitute = hasPermission('institute:settings:manage');
  const canManageAcademics = hasPermission('academics:manage');

  const loadData = async () => {
    if (!activeInstitute?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [inst, sess, crs, btc, cls, sbj] = await Promise.all([
        fetchInstituteProfile(activeInstitute.id),
        fetchAcademicSessions(activeInstitute.id),
        fetchCourses(activeInstitute.id),
        fetchBatches(activeInstitute.id),
        fetchClassrooms(activeInstitute.id),
        fetchSubjects(activeInstitute.id),
      ]);

      if (inst) {
        setInstitute(inst);
        setProfileForm({
          name: inst.name || '',
          code: inst.code || '',
          academicSession: inst.academicSession || '',
          timezone: inst.timezone || 'Asia/Kolkata',
          phone: inst.phone || '',
          email: inst.email || '',
          website: inst.website || '',
          address: inst.address || '',
          logo: inst.logo || '',
        });
      }

      setSessions(sess);
      setCourses(crs);
      setBatches(btc);
      setClassrooms(cls);
      setSubjects(sbj);
    } catch (err: unknown) {
      console.error('Error loading academic settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load institute academic configuration.');
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

  // ----------------------------------------------------
  // Profile Handlers
  // ----------------------------------------------------
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute?.id || !canManageInstitute) return;
    setSavingProfile(true);
    setError(null);
    try {
      await updateInstituteProfile(activeInstitute.id, {
        name: profileForm.name.trim(),
        code: profileForm.code.trim().toUpperCase(),
        academicSession: profileForm.academicSession.trim(),
        timezone: profileForm.timezone.trim(),
        phone: profileForm.phone.trim() || undefined,
        email: profileForm.email.trim() || undefined,
        website: profileForm.website.trim() || undefined,
        address: profileForm.address.trim() || undefined,
        logo: profileForm.logo.trim() || undefined,
      });
      showToast('Institute profile updated successfully.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update institute profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // ----------------------------------------------------
  // Session Handlers
  // ----------------------------------------------------
  const openSessionModal = (session?: AcademicSession) => {
    if (session) {
      setEditingSession(session);
      setSessionForm({
        name: session.name,
        startDate: session.startDate,
        endDate: session.endDate,
        isCurrent: session.isCurrent,
      });
    } else {
      setEditingSession(null);
      setSessionForm({
        name: '',
        startDate: '',
        endDate: '',
        isCurrent: sessions.length === 0,
      });
    }
    setSessionModalOpen(true);
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute?.id || !canManageAcademics) return;
    setSubmittingModal(true);
    try {
      await saveAcademicSession(activeInstitute.id, {
        id: editingSession?.id,
        name: sessionForm.name.trim(),
        startDate: sessionForm.startDate,
        endDate: sessionForm.endDate,
        isCurrent: sessionForm.isCurrent,
        status: editingSession?.status || 'active',
      });
      setSessionModalOpen(false);
      showToast(editingSession ? 'Academic session updated.' : 'Academic session created.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save academic session.');
    } finally {
      setSubmittingModal(false);
    }
  };

  // ----------------------------------------------------
  // Course Handlers
  // ----------------------------------------------------
  const openCourseModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        name: course.name,
        code: course.code,
        description: course.description || '',
        durationMonths: course.durationMonths || 12,
      });
    } else {
      setEditingCourse(null);
      setCourseForm({
        name: '',
        code: '',
        description: '',
        durationMonths: 12,
      });
    }
    setCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute?.id || !canManageAcademics) return;
    setSubmittingModal(true);
    try {
      await saveCourse(activeInstitute.id, {
        id: editingCourse?.id,
        name: courseForm.name.trim(),
        code: courseForm.code.trim().toUpperCase(),
        description: courseForm.description.trim() || undefined,
        durationMonths: Number(courseForm.durationMonths) || undefined,
        status: editingCourse?.status || 'active',
      });
      setCourseModalOpen(false);
      showToast(editingCourse ? 'Course updated.' : 'Course created.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save course.');
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleArchiveCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to archive this course? Existing records will be preserved.')) return;
    try {
      await archiveCourse(courseId);
      showToast('Course archived.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to archive course.');
    }
  };

  // ----------------------------------------------------
  // Batch Handlers
  // ----------------------------------------------------
  const openBatchModal = (batch?: Batch) => {
    if (batch) {
      setEditingBatch(batch);
      setBatchForm({
        name: batch.name,
        code: batch.code,
        courseId: batch.courseId,
        academicSessionId: batch.academicSessionId,
        startDate: batch.startDate,
        endDate: batch.endDate || '',
        maxCapacity: batch.maxCapacity,
        room: batch.room || '',
      });
    } else {
      setEditingBatch(null);
      setBatchForm({
        name: '',
        code: '',
        courseId: courses[0]?.id || '',
        academicSessionId: sessions.find((s) => s.isCurrent)?.id || sessions[0]?.id || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        maxCapacity: 40,
        room: classrooms[0]?.roomNumber || '',
      });
    }
    setBatchModalOpen(true);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute?.id || !canManageAcademics) return;
    setSubmittingModal(true);
    try {
      const selectedCourse = courses.find((c) => c.id === batchForm.courseId);
      await saveBatch(activeInstitute.id, {
        id: editingBatch?.id,
        name: batchForm.name.trim(),
        code: batchForm.code.trim().toUpperCase(),
        courseId: batchForm.courseId,
        courseName: selectedCourse?.name,
        academicSessionId: batchForm.academicSessionId,
        startDate: batchForm.startDate,
        endDate: batchForm.endDate || undefined,
        maxCapacity: Number(batchForm.maxCapacity) || 40,
        room: batchForm.room || undefined,
        status: editingBatch?.status || 'active',
      });
      setBatchModalOpen(false);
      showToast(editingBatch ? 'Batch updated.' : 'Batch created.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save batch.');
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleArchiveBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to archive this batch?')) return;
    try {
      await archiveBatch(batchId);
      showToast('Batch archived.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to archive batch.');
    }
  };

  // ----------------------------------------------------
  // Classroom Handlers
  // ----------------------------------------------------
  const openClassroomModal = (room?: Classroom) => {
    if (room) {
      setEditingClassroom(room);
      setClassroomForm({
        roomNumber: room.roomNumber,
        name: room.name,
        capacity: room.capacity,
      });
    } else {
      setEditingClassroom(null);
      setClassroomForm({
        roomNumber: '',
        name: '',
        capacity: 35,
      });
    }
    setClassroomModalOpen(true);
  };

  const handleSaveClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute?.id || !canManageAcademics) return;
    setSubmittingModal(true);
    try {
      await saveClassroom(activeInstitute.id, {
        id: editingClassroom?.id,
        roomNumber: classroomForm.roomNumber.trim().toUpperCase(),
        name: classroomForm.name.trim(),
        capacity: Number(classroomForm.capacity) || 30,
        status: editingClassroom?.status || 'active',
      });
      setClassroomModalOpen(false);
      showToast(editingClassroom ? 'Classroom updated.' : 'Classroom added.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save classroom.');
    } finally {
      setSubmittingModal(false);
    }
  };

  // ----------------------------------------------------
  // Subject Handlers
  // ----------------------------------------------------
  const openSubjectModal = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setSubjectForm({
        name: subject.name,
        code: subject.code,
        courseId: subject.courseId || '',
      });
    } else {
      setEditingSubject(null);
      setSubjectForm({
        name: '',
        code: '',
        courseId: courses[0]?.id || '',
      });
    }
    setSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute?.id || !canManageAcademics) return;
    setSubmittingModal(true);
    try {
      await saveSubject(activeInstitute.id, {
        id: editingSubject?.id,
        name: subjectForm.name.trim(),
        code: subjectForm.code.trim().toUpperCase(),
        courseId: subjectForm.courseId || undefined,
        status: editingSubject?.status || 'active',
      });
      setSubjectModalOpen(false);
      showToast(editingSubject ? 'Subject updated.' : 'Subject added.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save subject.');
    } finally {
      setSubmittingModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Institute & Academic Structure</h1>
              <p className="text-sm text-slate-500">
                Configure institutional settings, academic sessions, courses, batches, classrooms, and curriculum.
              </p>
            </div>
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Institute Profile
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'sessions'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Academic Sessions ({sessions.length})
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'courses'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Courses ({courses.length})
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'batches'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Batches ({batches.length})
        </button>

        <button
          onClick={() => setActiveTab('classrooms')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'classrooms'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          Classrooms ({classrooms.length})
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'subjects'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Library className="w-4 h-4" />
          Subjects ({subjects.length})
        </button>
      </div>

      {/* Loading Placeholder */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading academic structure data...</p>
        </div>
      )}

      {/* Tab 1: Institute Profile */}
      {!loading && activeTab === 'profile' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Institute Profile & Legal Identity</h2>
              <p className="text-sm text-slate-500">
                Official registration details, active academic session, and public contact information.
              </p>
            </div>
            {!canManageInstitute && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                <ShieldAlert className="w-3.5 h-3.5" />
                Read-Only (Owner Access Required)
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Institute Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={!canManageInstitute}
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Institute Code *
                </label>
                <input
                  type="text"
                  required
                  disabled={!canManageInstitute}
                  value={profileForm.code}
                  onChange={(e) => setProfileForm({ ...profileForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Active Academic Session *
                </label>
                <input
                  type="text"
                  required
                  disabled={!canManageInstitute}
                  value={profileForm.academicSession}
                  onChange={(e) => setProfileForm({ ...profileForm, academicSession: e.target.value })}
                  placeholder="e.g. 2026-2027"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Timezone *
                </label>
                <input
                  type="text"
                  required
                  disabled={!canManageInstitute}
                  value={profileForm.timezone}
                  onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  disabled={!canManageInstitute}
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Official Email
                </label>
                <input
                  type="email"
                  disabled={!canManageInstitute}
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="contact@pradeepclasses.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Official Website
                </label>
                <input
                  type="url"
                  disabled={!canManageInstitute}
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                  placeholder="https://pradeepclasses.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Logo Image URL
                </label>
                <input
                  type="url"
                  disabled={!canManageInstitute}
                  value={profileForm.logo}
                  onChange={(e) => setProfileForm({ ...profileForm, logo: e.target.value })}
                  placeholder="https://cdn.example.com/logo.png"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Physical Campus Address
              </label>
              <textarea
                rows={3}
                disabled={!canManageInstitute}
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                placeholder="Building No, Street, City, State, PIN"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            {canManageInstitute && (
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingProfile ? 'Saving Changes...' : 'Save Profile Settings'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 2: Academic Sessions */}
      {!loading && activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Manage academic years and active enrollment cycles.
            </p>
            {canManageAcademics && (
              <button
                onClick={() => openSessionModal()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Session
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className={`p-5 rounded-2xl border bg-white shadow-sm flex flex-col justify-between transition-all ${
                  sess.isCurrent ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-slate-900">{sess.name}</span>
                    {sess.isCurrent && (
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        Current Session
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Start: {sess.startDate || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>End: {sess.endDate || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                {canManageAcademics && (
                  <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => openSessionModal(sess)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}

            {sessions.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-700">No Academic Sessions Defined</h3>
                <p className="text-xs text-slate-500 mt-1">Create an academic session to organize batches and courses.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Courses */}
      {!loading && activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Curriculum programs offered by Pradeep Classes.
            </p>
            {canManageAcademics && (
              <button
                onClick={() => openCourseModal()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Course
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      {course.code}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        course.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {course.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{course.name}</h3>
                  {course.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{course.description}</p>
                  )}
                  {course.durationMonths && (
                    <p className="text-xs text-slate-600">
                      Duration: <span className="font-semibold">{course.durationMonths} months</span>
                    </p>
                  )}
                </div>

                {canManageAcademics && (
                  <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => openCourseModal(course)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    {course.status === 'active' && (
                      <button
                        onClick={() => handleArchiveCourse(course.id)}
                        className="px-3 py-1.5 text-xs font-medium text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {courses.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-700">No Courses Registered</h3>
                <p className="text-xs text-slate-500 mt-1">Add courses to enable student enrollment and batch allocation.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Batches */}
      {!loading && activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Active student batches, room scheduling, and capacity limits.
            </p>
            {canManageAcademics && (
              <button
                onClick={() => openBatchModal()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Batch
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      {batch.code}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        batch.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{batch.name}</h3>
                  {batch.courseName && (
                    <p className="text-xs text-blue-600 font-medium mb-3">{batch.courseName}</p>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Max Capacity:</span>
                      <span className="font-semibold text-slate-700">{batch.maxCapacity} students</span>
                    </div>
                    {batch.room && (
                      <div className="flex items-center justify-between">
                        <span>Assigned Room:</span>
                        <span className="font-semibold text-slate-700">{batch.room}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span>Start Date:</span>
                      <span className="font-semibold text-slate-700">{batch.startDate || '-'}</span>
                    </div>
                  </div>
                </div>

                {canManageAcademics && (
                  <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => openBatchModal(batch)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    {batch.status === 'active' && (
                      <button
                        onClick={() => handleArchiveBatch(batch.id)}
                        className="px-3 py-1.5 text-xs font-medium text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {batches.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
                <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-700">No Batches Formed</h3>
                <p className="text-xs text-slate-500 mt-1">Form batches to assign students and track daily attendance.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Classrooms */}
      {!loading && activeTab === 'classrooms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Campus physical rooms, halls, and seating capacities.
            </p>
            {canManageAcademics && (
              <button
                onClick={() => openClassroomModal()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Classroom
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {classrooms.map((room) => (
              <div
                key={room.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                      {room.roomNumber}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        room.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{room.name}</h3>
                  <p className="text-xs text-slate-600">
                    Seating Capacity: <span className="font-semibold">{room.capacity} seats</span>
                  </p>
                </div>

                {canManageAcademics && (
                  <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => openClassroomModal(room)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}

            {classrooms.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
                <DoorOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-700">No Classrooms Configured</h3>
                <p className="text-xs text-slate-500 mt-1">Configure physical rooms for batch allocations.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Subjects */}
      {!loading && activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Curricular subjects and curriculum modules.
            </p>
            {canManageAcademics && (
              <button
                onClick={() => openSubjectModal()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Subject
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subj) => (
              <div
                key={subj.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      {subj.code}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        subj.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {subj.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{subj.name}</h3>
                </div>

                {canManageAcademics && (
                  <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => openSubjectModal(subj)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}

            {subjects.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
                <Library className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-700">No Subjects Configured</h3>
                <p className="text-xs text-slate-500 mt-1">Configure subjects for test performance and curriculum planning.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------- */}
      {/* MODAL: Academic Session */}
      {/* ----------------------------------------------- */}
      {sessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingSession ? 'Edit Academic Session' : 'Add Academic Session'}
              </h3>
              <button onClick={() => setSessionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Session Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-2027"
                  value={sessionForm.name}
                  onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={sessionForm.startDate}
                    onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={sessionForm.endDate}
                    onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sessionForm.isCurrent}
                  onChange={(e) => setSessionForm({ ...sessionForm, isCurrent: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                Mark as Current Active Session
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSessionModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingModal ? 'Saving...' : 'Save Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------- */}
      {/* MODAL: Course */}
      {/* ----------------------------------------------- */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h3>
              <button onClick={() => setCourseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Course Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 10 CBSE Foundation"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. C10-CBSE"
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={courseForm.durationMonths}
                    onChange={(e) => setCourseForm({ ...courseForm, durationMonths: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief curriculum notes..."
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingModal ? 'Saving...' : 'Save Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------- */}
      {/* MODAL: Batch */}
      {/* ----------------------------------------------- */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingBatch ? 'Edit Batch' : 'Create New Batch'}
              </h3>
              <button onClick={() => setBatchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Batch Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Morning Alpha Batch"
                    value={batchForm.name}
                    onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Batch Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B-MOR-01"
                    value={batchForm.code}
                    onChange={(e) => setBatchForm({ ...batchForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Course Program *
                  </label>
                  <select
                    required
                    value={batchForm.courseId}
                    onChange={(e) => setBatchForm({ ...batchForm, courseId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
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
                    Academic Session *
                  </label>
                  <select
                    required
                    value={batchForm.academicSessionId}
                    onChange={(e) => setBatchForm({ ...batchForm, academicSessionId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select session...</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.isCurrent ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Max Capacity (Students)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={batchForm.maxCapacity}
                    onChange={(e) => setBatchForm({ ...batchForm, maxCapacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Classroom
                  </label>
                  <select
                    value={batchForm.room}
                    onChange={(e) => setBatchForm({ ...batchForm, room: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None assigned</option>
                    {classrooms.map((cl) => (
                      <option key={cl.id} value={cl.roomNumber}>
                        {cl.roomNumber} - {cl.name} (Cap: {cl.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={batchForm.startDate}
                    onChange={(e) => setBatchForm({ ...batchForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={batchForm.endDate}
                    onChange={(e) => setBatchForm({ ...batchForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingModal ? 'Saving...' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------- */}
      {/* MODAL: Classroom */}
      {/* ----------------------------------------------- */}
      {classroomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingClassroom ? 'Edit Classroom' : 'Add New Classroom'}
              </h3>
              <button onClick={() => setClassroomModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClassroom} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Room Number / Identifier *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 101"
                  value={classroomForm.roomNumber}
                  onChange={(e) => setClassroomForm({ ...classroomForm, roomNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Room / Hall Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aryabhata Hall"
                  value={classroomForm.name}
                  onChange={(e) => setClassroomForm({ ...classroomForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Seating Capacity *
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  required
                  value={classroomForm.capacity}
                  onChange={(e) => setClassroomForm({ ...classroomForm, capacity: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClassroomModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingModal ? 'Saving...' : 'Save Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------- */}
      {/* MODAL: Subject */}
      {/* ----------------------------------------------- */}
      {subjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button onClick={() => setSubjectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Mathematics"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Subject Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MATH-ADV"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Linked Course Program (Optional)
                </label>
                <select
                  value={subjectForm.courseId}
                  onChange={(e) => setSubjectForm({ ...subjectForm, courseId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">General (All courses)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubjectModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingModal ? 'Saving...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
