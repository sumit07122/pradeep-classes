import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ExternalLink,
  Filter,
  Megaphone,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchBatches } from '../../erp/academicService';
import {
  deleteAnnouncement,
  fetchAnnouncements,
  formatAbsenceNotice,
  formatExamScoreNotice,
  formatFeeReminderMessage,
  generateWhatsAppLink,
  saveAnnouncement,
} from '../../erp/communicationService';
import { fetchFeePayments, fetchFeeStructures } from '../../erp/feeService';
import { fetchStudents } from '../../erp/studentService';
import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementPriority,
  Batch,
  Student,
} from '../../erp/types';

type CommsTab = 'notices' | 'whatsapp';
type TemplateType = 'fee' | 'absence' | 'exam' | 'custom';

export default function CommunicationManagement() {
  const { user, activeInstitute, erpRole, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<CommsTab>('notices');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Fee dues state for WhatsApp fee reminders
  const [studentDues, setStudentDues] = useState<Record<string, number>>({});

  const [audienceFilter, setAudienceFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Announcement Modal
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    targetAudience: 'all' as AnnouncementAudience,
    batchId: '',
    priority: 'normal' as AnnouncementPriority,
  });

  // WhatsApp Messenger state
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [templateType, setTemplateType] = useState<TemplateType>('fee');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [examNameInput, setExamNameInput] = useState<string>('Mid-Term Assessment');
  const [marksInput, setMarksInput] = useState<number>(85);
  const [totalMarksInput, setTotalMarksInput] = useState<number>(100);

  const [submittingModal, setSubmittingModal] = useState(false);

  const canPostAnnouncements =
    erpRole === 'institute_owner' || erpRole === 'institute_admin' || erpRole === 'teacher';

  const loadData = async () => {
    if (!activeInstitute?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [ann, stu, btc, payments, structures] = await Promise.all([
        fetchAnnouncements(activeInstitute.id),
        fetchStudents(activeInstitute.id),
        fetchBatches(activeInstitute.id),
        fetchFeePayments(activeInstitute.id),
        fetchFeeStructures(activeInstitute.id),
      ]);

      setAnnouncements(ann);
      setStudents(stu.filter((s) => s.status === 'active'));
      setBatches(btc.filter((b) => b.status === 'active'));

      if (stu.length > 0 && !selectedStudentId) {
        setSelectedStudentId(stu[0].id);
      }

      // Calculate dues per student
      const duesMap: Record<string, number> = {};
      for (const s of stu) {
        const struct = structures.find((st) => st.courseId === s.courseId);
        const total = struct?.totalAmount || 35000;
        const paid = payments
          .filter((p) => p.studentId === s.id && p.status === 'completed')
          .reduce((sum, p) => sum + p.amountPaid, 0);
        duesMap[s.id] = Math.max(0, total - paid);
      }
      setStudentDues(duesMap);
    } catch (err: unknown) {
      console.error('Error loading communications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notices.');
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

  // Selected student for WhatsApp
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Computed WhatsApp message based on template
  const computedWhatsAppMessage = useMemo(() => {
    if (!selectedStudent) return '';
    const instName = activeInstitute?.name || 'Pradeep Classes';

    switch (templateType) {
      case 'fee': {
        const due = studentDues[selectedStudent.id] || 15000;
        return formatFeeReminderMessage(
          selectedStudent.fullName,
          due,
          instName,
          'pradeepclasses@upi'
        );
      }
      case 'absence': {
        const today = new Date().toISOString().split('T')[0];
        return formatAbsenceNotice(
          selectedStudent.fullName,
          today,
          selectedStudent.batchName,
          instName
        );
      }
      case 'exam': {
        const pct = Math.round((marksInput / totalMarksInput) * 100);
        const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 65 ? 'B' : pct >= 40 ? 'Pass' : 'Needs Improvement';
        return formatExamScoreNotice(
          selectedStudent.fullName,
          examNameInput,
          marksInput,
          totalMarksInput,
          grade,
          instName
        );
      }
      case 'custom': {
        return customMessage.trim() || `Notice from ${instName} regarding ${selectedStudent.fullName}.`;
      }
    }
  }, [
    selectedStudent,
    templateType,
    studentDues,
    activeInstitute,
    marksInput,
    totalMarksInput,
    examNameInput,
    customMessage,
  ]);

  // Handle Post Announcement
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute?.id || !canPostAnnouncements) return;
    setSubmittingModal(true);
    try {
      const selectedBatch = batches.find((b) => b.id === announcementForm.batchId);

      await saveAnnouncement(activeInstitute.id, {
        title: announcementForm.title.trim(),
        content: announcementForm.content.trim(),
        targetAudience: announcementForm.targetAudience,
        batchId: announcementForm.batchId || undefined,
        batchName: selectedBatch?.name,
        priority: announcementForm.priority,
        publishedBy: user?.displayName || user?.email || 'Institute Office',
      });

      setAnnouncementModalOpen(false);
      showToast('Announcement published successfully.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to publish announcement.');
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await deleteAnnouncement(annId);
      showToast('Announcement removed.');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete announcement.');
    }
  };

  // Launch WhatsApp Dispatch
  const handleSendWhatsApp = () => {
    if (!selectedStudent || !selectedStudent.guardianPhone) {
      setError('Guardian phone number is missing for this student.');
      return;
    }
    const link = generateWhatsAppLink(selectedStudent.guardianPhone, computedWhatsAppMessage);
    window.open(link, '_blank');
  };

  const getPriorityBadge = (p: AnnouncementPriority) => {
    switch (p) {
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'important':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'normal':
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notice & Communication Hub</h1>
            <p className="text-sm text-slate-500">
              Broadcast institute circulars, urgent alerts, and instant parent WhatsApp messages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canPostAnnouncements && (
            <button
              onClick={() => {
                setAnnouncementForm({
                  title: '',
                  content: '',
                  targetAudience: 'all',
                  batchId: '',
                  priority: 'normal',
                });
                setAnnouncementModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Post Announcement
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-800">Communication Error</h4>
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
          onClick={() => setActiveTab('notices')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'notices'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Notice Board ({announcements.length})
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'whatsapp'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          Parent WhatsApp Messenger
        </button>
      </div>

      {/* ------------------------------------------------ */}
      {/* TAB 1: Notice Board */}
      {/* ------------------------------------------------ */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Institutional notices visible to teachers, staff, and enrolled batches.
            </p>

            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Audiences</option>
              <option value="staff">Staff Only</option>
              <option value="students">Students / Parents</option>
              <option value="batch">Batch Specific</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${getPriorityBadge(
                        ann.priority
                      )}`}
                    >
                      {ann.priority}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">
                      {ann.targetAudience === 'batch' && ann.batchName
                        ? ann.batchName
                        : `Audience: ${ann.targetAudience}`}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">{ann.title}</h3>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-4">
                    {ann.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs text-slate-400">
                  <span>By: {ann.publishedBy}</span>
                  {canPostAnnouncements && (
                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {announcements.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
                <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-700">No Announcements Active</h3>
                <p className="text-xs text-slate-500 mt-1">Post a circular to keep students and staff informed.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* TAB 2: WhatsApp Messenger */}
      {/* ------------------------------------------------ */}
      {activeTab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Parent Notification Dispatch
              </h3>
              <p className="text-xs text-slate-500">
                Select student, customize alert parameters, and launch instant pre-filled WhatsApp message.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Select Student *
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.admissionNumber} - {s.batchName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Notification Template
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTemplateType('fee')}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                    templateType === 'fee'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  💰 Fee Due Reminder
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType('absence')}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                    templateType === 'absence'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ⚠️ Absentee Notice
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType('exam')}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                    templateType === 'exam'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  📊 Exam Scorecard
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType('custom')}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                    templateType === 'custom'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ✏️ Custom Message
                </button>
              </div>
            </div>

            {/* Template Specific Inputs */}
            {templateType === 'exam' && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Exam Title</label>
                  <input
                    type="text"
                    value={examNameInput}
                    onChange={(e) => setExamNameInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Marks Obtained</label>
                    <input
                      type="number"
                      value={marksInput}
                      onChange={(e) => setMarksInput(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Maximum Marks</label>
                    <input
                      type="number"
                      value={totalMarksInput}
                      onChange={(e) => setTotalMarksInput(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {templateType === 'custom' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Message Body
                </label>
                <textarea
                  rows={4}
                  placeholder="Type official notification message..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Recipient Guardian Info */}
            {selectedStudent && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-emerald-800 uppercase tracking-wider block">
                  Guardian Contact
                </span>
                <div className="text-slate-800 font-semibold">{selectedStudent.guardianName}</div>
                <div className="text-emerald-700 font-mono font-bold">
                  {selectedStudent.guardianPhone} ({selectedStudent.guardianRelation})
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">WhatsApp Live Message Preview</h4>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  WhatsApp Direct API
                </span>
              </div>

              {/* Chat Bubble Style */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 font-sans text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-xs">
                {computedWhatsAppMessage}
              </div>
            </div>

            <button
              onClick={handleSendWhatsApp}
              disabled={!selectedStudent || !selectedStudent.guardianPhone}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Open in WhatsApp & Send
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* MODAL: Post Announcement */}
      {/* ------------------------------------------------ */}
      {announcementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Publish Announcement</h3>
              <button onClick={() => setAnnouncementModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Holiday Notice for Holi Celebrations"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={announcementForm.priority}
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        priority: e.target.value as AnnouncementPriority,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Target Audience *
                  </label>
                  <select
                    value={announcementForm.targetAudience}
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        targetAudience: e.target.value as AnnouncementAudience,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Entire Institute</option>
                    <option value="staff">Staff Members Only</option>
                    <option value="students">Students & Parents</option>
                    <option value="batch">Specific Batch</option>
                  </select>
                </div>
              </div>

              {announcementForm.targetAudience === 'batch' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Select Target Batch *
                  </label>
                  <select
                    required
                    value={announcementForm.batchId}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, batchId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select batch...</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Circular Content *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detailed circular notice body..."
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAnnouncementModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingModal ? 'Posting...' : 'Post Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
