import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  Filter,
  GraduationCap,
  History,
  RefreshCw,
  Save,
  Search,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchBatches } from '../../erp/academicService';
import {
  fetchAttendanceRecord,
  fetchBatchAttendanceHistory,
  saveAttendanceRecord,
} from '../../erp/attendanceService';
import { fetchStudents } from '../../erp/studentService';
import type {
  AttendanceEntry,
  AttendanceRecord,
  AttendanceStatus,
  Batch,
  Student,
} from '../../erp/types';

export default function AttendanceManagement() {
  const { user, activeInstitute, erpRole, hasPermission } = useAuth();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [students, setStudents] = useState<Student[]>([]);
  const [existingRecord, setExistingRecord] = useState<AttendanceRecord | null>(null);
  const [entries, setEntries] = useState<Record<string, AttendanceEntry>>({});
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);

  const [activeView, setActiveView] = useState<'sheet' | 'history'>('sheet');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canMarkAttendance = hasPermission('attendance:mark');

  // Load Batches initially
  useEffect(() => {
    async function loadBatches() {
      if (!activeInstitute?.id) return;
      try {
        const btc = await fetchBatches(activeInstitute.id);
        const activeBatches = btc.filter((b) => b.status === 'active');
        setBatches(activeBatches);
        if (activeBatches.length > 0 && !selectedBatchId) {
          setSelectedBatchId(activeBatches[0].id);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load batches.');
      }
    }
    loadBatches();
  }, [activeInstitute?.id]);

  // Load students and attendance for selected batch and date
  const loadBatchAttendance = async () => {
    if (!activeInstitute?.id || !selectedBatchId) return;
    setLoading(true);
    setError(null);
    try {
      const [stu, attRecord, hist] = await Promise.all([
        fetchStudents(activeInstitute.id, { batchId: selectedBatchId }),
        fetchAttendanceRecord(activeInstitute.id, selectedBatchId, selectedDate),
        fetchBatchAttendanceHistory(activeInstitute.id, selectedBatchId),
      ]);

      const activeStudents = stu.filter((s) => s.status === 'active');
      setStudents(activeStudents);
      setExistingRecord(attRecord);
      setHistoryRecords(hist);

      // Initialize entries map
      const entryMap: Record<string, AttendanceEntry> = {};
      if (attRecord && attRecord.entries && attRecord.entries.length > 0) {
        for (const e of attRecord.entries) {
          entryMap[e.studentId] = e;
        }
      }

      // Ensure every enrolled active student has an entry (default 'present' if not previously marked)
      for (const s of activeStudents) {
        if (!entryMap[s.id]) {
          entryMap[s.id] = {
            studentId: s.id,
            studentName: s.fullName,
            admissionNumber: s.admissionNumber,
            rollNumber: s.rollNumber,
            status: 'present',
            remarks: '',
          };
        }
      }

      setEntries(entryMap);
    } catch (err: unknown) {
      console.error('Error loading attendance:', err);
      setError(err instanceof Error ? err.message : 'Failed to load batch attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatchAttendance();
  }, [activeInstitute?.id, selectedBatchId, selectedDate]);

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Selected batch object
  const currentBatch = useMemo(() => {
    return batches.find((b) => b.id === selectedBatchId);
  }, [batches, selectedBatchId]);

  // Filtered students for display
  const displayedStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const term = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(term) ||
        s.admissionNumber.toLowerCase().includes(term) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(term))
    );
  }, [students, searchQuery]);

  // Live KPI Summary
  const kpiStats = useMemo(() => {
    const total = students.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    for (const s of students) {
      const status = entries[s.id]?.status || 'present';
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
      else if (status === 'excused') excused++;
    }

    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, excused, rate };
  }, [students, entries]);

  // Bulk status updates
  const setAllStatus = (status: AttendanceStatus) => {
    if (!canMarkAttendance) return;
    const updated = { ...entries };
    for (const s of students) {
      if (updated[s.id]) {
        updated[s.id] = { ...updated[s.id], status };
      }
    }
    setEntries(updated);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (!canMarkAttendance) return;
    setEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    if (!canMarkAttendance) return;
    setEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  // Save Attendance Record
  const handleSaveAttendance = async () => {
    if (!activeInstitute?.id || !selectedBatchId || !currentBatch || !canMarkAttendance) return;
    setSaving(true);
    setError(null);
    try {
      const entryList = students.map((s) => entries[s.id]).filter(Boolean);

      const presentCount = entryList.filter((e) => e.status === 'present').length;
      const absentCount = entryList.filter((e) => e.status === 'absent').length;
      const lateCount = entryList.filter((e) => e.status === 'late').length;
      const excusedCount = entryList.filter((e) => e.status === 'excused').length;

      await saveAttendanceRecord(activeInstitute.id, {
        id: existingRecord?.id,
        batchId: selectedBatchId,
        batchName: currentBatch.name,
        courseId: currentBatch.courseId,
        date: selectedDate,
        markedBy: user?.uid || 'staff',
        markedByName: user?.displayName || user?.email || 'Teacher',
        totalStudents: students.length,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        entries: entryList,
      });

      showToast(`Attendance for ${currentBatch.name} on ${selectedDate} saved successfully.`);
      await loadBatchAttendance();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Attendance Register & Tracker</h1>
            <p className="text-sm text-slate-500">
              Batch roll call, presenteeism monitoring, and student attendance registers.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Batch Selector */}
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          {/* Date Selector */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 text-sm font-medium rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={loadBatchAttendance}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canMarkAttendance && activeView === 'sheet' && (
            <button
              onClick={handleSaveAttendance}
              disabled={saving || loading || students.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : existingRecord ? 'Update Attendance' : 'Save Attendance'}
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-800">Attendance Error</h4>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Enrolled</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{kpiStats.total}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Present</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-bold text-emerald-600">{kpiStats.present}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-600">Absent</span>
            <UserX className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-2xl font-bold text-red-600">{kpiStats.absent}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Late / Excused</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-bold text-amber-600">
            {kpiStats.late + kpiStats.excused}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Present Rate</span>
            <span className="text-xs font-bold text-blue-600">{kpiStats.rate}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${kpiStats.rate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveView('sheet')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeView === 'sheet'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Daily Roll Call Sheet
        </button>

        <button
          onClick={() => setActiveView('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeView === 'history'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          Batch History Log ({historyRecords.length})
        </button>
      </div>

      {/* ------------------------------------------------ */}
      {/* VIEW 1: Daily Roll Call Sheet */}
      {/* ------------------------------------------------ */}
      {activeView === 'sheet' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student by name, roll #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {canMarkAttendance && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAllStatus('present')}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => setAllStatus('absent')}
                  className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  Mark All Absent
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">Loading batch students...</p>
              </div>
            ) : displayedStudents.length === 0 ? (
              <div className="p-12 text-center">
                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">No students enrolled</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Assign active students to this batch in Student Admissions to begin recording daily attendance.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-xs uppercase font-semibold">
                      <th className="px-5 py-3.5">Roll #</th>
                      <th className="px-5 py-3.5">Student</th>
                      <th className="px-5 py-3.5">Admission #</th>
                      <th className="px-5 py-3.5 text-center">Attendance Status</th>
                      <th className="px-5 py-3.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {displayedStudents.map((student) => {
                      const entry = entries[student.id];
                      const currentStatus = entry?.status || 'present';

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-xs text-slate-700">
                            {student.rollNumber || '-'}
                          </td>

                          <td className="px-5 py-3.5 font-semibold text-slate-900">
                            {student.fullName}
                          </td>

                          <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                            {student.admissionNumber}
                          </td>

                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Present Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'present')}
                                disabled={!canMarkAttendance}
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                                  currentStatus === 'present'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50'
                                }`}
                              >
                                P
                              </button>

                              {/* Absent Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'absent')}
                                disabled={!canMarkAttendance}
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                                  currentStatus === 'absent'
                                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                                    : 'bg-white text-red-700 border-slate-200 hover:bg-red-50'
                                }`}
                              >
                                A
                              </button>

                              {/* Late Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'late')}
                                disabled={!canMarkAttendance}
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                                  currentStatus === 'late'
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                    : 'bg-white text-amber-700 border-slate-200 hover:bg-amber-50'
                                }`}
                              >
                                L
                              </button>

                              {/* Excused Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'excused')}
                                disabled={!canMarkAttendance}
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                                  currentStatus === 'excused'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-white text-blue-700 border-slate-200 hover:bg-blue-50'
                                }`}
                              >
                                E
                              </button>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <input
                              type="text"
                              placeholder="Notes (optional)..."
                              value={entry?.remarks || ''}
                              onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                              disabled={!canMarkAttendance}
                              className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* VIEW 2: Batch History Log */}
      {/* ------------------------------------------------ */}
      {activeView === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Attendance Log for {currentBatch?.name || 'Selected Batch'}
              </h3>
              <p className="text-xs text-slate-500">Historical records recorded for this batch.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-xs uppercase font-semibold">
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Recorded By</th>
                    <th className="px-5 py-3.5">Enrolled</th>
                    <th className="px-5 py-3.5">Present</th>
                    <th className="px-5 py-3.5">Absent</th>
                    <th className="px-5 py-3.5">Rate</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {historyRecords.map((record) => {
                    const rate =
                      record.totalStudents > 0
                        ? Math.round((record.presentCount / record.totalStudents) * 100)
                        : 0;

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900">{record.date}</td>
                        <td className="px-5 py-4 text-xs text-slate-600">{record.markedByName}</td>
                        <td className="px-5 py-4 text-slate-800">{record.totalStudents}</td>
                        <td className="px-5 py-4 font-semibold text-emerald-600">
                          {record.presentCount}
                        </td>
                        <td className="px-5 py-4 font-semibold text-red-600">{record.absentCount}</td>
                        <td className="px-5 py-4">
                          <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-full">
                            {rate}%
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedDate(record.date);
                              setActiveView('sheet');
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            Open Sheet
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {historyRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                        <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        No past attendance records found for this batch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
