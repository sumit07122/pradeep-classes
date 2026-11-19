import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  Edit2,
  Filter,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canAlterStaffRole, canManageTargetRole, canRevokeStaffMembership, getRoleDefinition } from '../../erp/rbac';
import {
  createStaff,
  fetchInstituteStaff,
  inviteStaff,
  revokeStaffMembership,
  setStaffStatus,
  updateStaffRole,
  type StaffMemberRecord,
} from '../../erp/staffService';
import type { ErpRole, MembershipStatus } from '../../erp/types';

export default function StaffManagement() {
  const { user, activeInstitute, erpRole, hasPermission } = useAuth();

  const [staff, setStaff] = useState<StaffMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsStaff, setDetailsStaff] = useState<StaffMemberRecord | null>(null);
  const [roleChangeStaff, setRoleChangeStaff] = useState<StaffMemberRecord | null>(null);
  const [actionConfirmStaff, setActionConfirmStaff] = useState<{
    staff: StaffMemberRecord;
    action: 'suspend' | 'reactivate' | 'revoke';
  } | null>(null);

  // Form states
  const [formBusy, setFormBusy] = useState(false);
  const [createForm, setCreateForm] = useState({
    displayName: '',
    email: '',
    role: 'teacher' as ErpRole,
    designation: '',
    department: '',
    phone: '',
  });
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState<ErpRole>('teacher');

  const instituteId = activeInstitute?.id || '';
  const isOwner = erpRole === 'institute_owner';
  const isAdmin = erpRole === 'institute_admin';

  const loadStaff = async () => {
    if (!instituteId) return;
    setLoading(true);
    setError(null);
    try {
      const records = await fetchInstituteStaff(instituteId);
      setStaff(records);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load institute staff directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [instituteId]);

  // Filtered & Searched staff
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      // Role filter
      if (roleFilter !== 'all' && member.role !== roleFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && member.status !== statusFilter) {
        return false;
      }
      // Search query (name, email, designation, phone)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = member.displayName?.toLowerCase().includes(query);
        const matchEmail = member.email?.toLowerCase().includes(query);
        const matchDesig = member.designation?.toLowerCase().includes(query);
        const matchPhone = member.phone?.toLowerCase().includes(query);
        return matchName || matchEmail || matchDesig || matchPhone;
      }
      return true;
    });
  }, [staff, roleFilter, statusFilter, searchQuery]);

  // Paginated records
  const totalPages = Math.ceil(filteredStaff.length / pageSize) || 1;
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  // Statistics
  const stats = useMemo(() => {
    const total = staff.length;
    const teachers = staff.filter((m) => m.role === 'teacher' && m.status === 'active').length;
    const admins = staff.filter((m) => (m.role === 'institute_admin' || m.role === 'institute_owner') && m.status === 'active').length;
    const suspended = staff.filter((m) => m.status === 'suspended' || m.status === 'revoked').length;
    return { total, teachers, admins, suspended };
  }, [staff]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormBusy(true);
    setError(null);
    try {
      const res = await createStaff(instituteId, {
        displayName: createForm.displayName,
        email: createForm.email,
        role: createForm.role,
        designation: createForm.designation || undefined,
        department: createForm.department || undefined,
        phone: createForm.phone || undefined,
      });

      setSuccessMessage(`Staff account created for ${createForm.displayName}.`);
      if (res.inviteLink) {
        setCreatedInviteLink(res.inviteLink);
      } else {
        setCreateModalOpen(false);
        setCreateForm({
          displayName: '',
          email: '',
          role: 'teacher',
          designation: '',
          department: '',
          phone: '',
        });
      }
      await loadStaff();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create staff account.');
    } finally {
      setFormBusy(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (!createdInviteLink) return;
    navigator.clipboard.writeText(createdInviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSendInvite = async (target: StaffMemberRecord) => {
    setError(null);
    try {
      const res = await inviteStaff(instituteId, target.uid);
      setSuccessMessage(`Invitation link generated for ${target.displayName}.`);
      if (res.inviteLink) {
        navigator.clipboard.writeText(res.inviteLink);
        setSuccessMessage(`Invitation link copied to clipboard for ${target.displayName}!`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation.');
    }
  };

  const handleRoleChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleChangeStaff) return;
    setFormBusy(true);
    setError(null);
    try {
      await updateStaffRole(instituteId, roleChangeStaff.uid, selectedNewRole);
      setSuccessMessage(`Role updated to ${getRoleDefinition(selectedNewRole)?.label} for ${roleChangeStaff.displayName}.`);
      setRoleChangeStaff(null);
      await loadStaff();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update staff role.');
    } finally {
      setFormBusy(false);
    }
  };

  const handleActionConfirm = async () => {
    if (!actionConfirmStaff) return;
    const { staff: target, action } = actionConfirmStaff;
    setFormBusy(true);
    setError(null);
    try {
      if (action === 'suspend') {
        await setStaffStatus(instituteId, target.uid, 'suspended');
        setSuccessMessage(`Staff access suspended for ${target.displayName}.`);
      } else if (action === 'reactivate') {
        await setStaffStatus(instituteId, target.uid, 'active');
        setSuccessMessage(`Staff access reactivated for ${target.displayName}.`);
      } else if (action === 'revoke') {
        await revokeStaffMembership(instituteId, target.uid);
        setSuccessMessage(`Staff membership permanently revoked for ${target.displayName}.`);
      }
      setActionConfirmStaff(null);
      await loadStaff();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setFormBusy(false);
    }
  };

  const getRoleBadge = (role: ErpRole) => {
    switch (role) {
      case 'institute_owner':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">Owner</span>;
      case 'institute_admin':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Admin</span>;
      case 'accountant':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Accountant</span>;
      case 'teacher':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Teacher</span>;
    }
  };

  const getStatusBadge = (status: MembershipStatus) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active</span>;
      case 'suspended':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Suspended</span>;
      case 'revoked':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Revoked</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Directory, roles, designations, and account authorization for {activeInstitute?.name || 'Institute'}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadStaff}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>
          {(isOwner || isAdmin) && (
            <button
              type="button"
              onClick={() => {
                setCreatedInviteLink(null);
                setCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>Add Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div role="status" className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {error && (
        <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Staff</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Teachers</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.teachers}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Administration</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.admins}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Suspended / Revoked</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.suspended}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserMinus className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by staff name, email, designation, or phone..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <option value="all">All Roles</option>
            <option value="institute_owner">Institute Owner</option>
            <option value="institute_admin">Institute Admin</option>
            <option value="accountant">Accountant</option>
            <option value="teacher">Teacher</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-500">Loading staff directory...</p>
          </div>
        ) : paginatedStaff.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No staff members found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'Get started by inviting teachers, administrators, or accountants.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th scope="col" className="px-6 py-3.5">Staff Member</th>
                  <th scope="col" className="px-6 py-3.5">Role</th>
                  <th scope="col" className="px-6 py-3.5">Designation / Dept</th>
                  <th scope="col" className="px-6 py-3.5">Status</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedStaff.map((member) => {
                  const isCurrentSelf = member.uid === user?.uid;
                  const canManageThis = isOwner
                    ? true
                    : isAdmin && (member.role === 'teacher' || member.role === 'accountant');

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold flex items-center justify-center shrink-0 uppercase text-xs">
                            {member.displayName?.slice(0, 2) || 'ST'}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 flex items-center gap-2">
                              <span>{member.displayName}</span>
                              {isCurrentSelf && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">You</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{member.email || 'No email associated'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(member.role)}</td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 font-medium">{member.designation || 'Staff'}</div>
                        {member.department && <div className="text-xs text-slate-500">{member.department}</div>}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(member.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailsStaff(member)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Staff Details"
                          >
                            <Users className="w-4 h-4" />
                          </button>

                          {/* Role Change Button (Owner only, not on self or other owners) */}
                          {isOwner && member.role !== 'institute_owner' && (
                            <button
                              type="button"
                              onClick={() => {
                                setRoleChangeStaff(member);
                                setSelectedNewRole(member.role);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                              title="Change Role"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Invite / Setup Link Button */}
                          {canManageThis && member.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => handleSendInvite(member)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Generate Setup/Invite Link"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}

                          {/* Suspend / Reactivate Button */}
                          {canManageThis && !isCurrentSelf && member.role !== 'institute_owner' && member.status !== 'revoked' && (
                            <button
                              type="button"
                              onClick={() =>
                                setActionConfirmStaff({
                                  staff: member,
                                  action: member.status === 'active' ? 'suspend' : 'reactivate',
                                })
                              }
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                member.status === 'active'
                                  ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={member.status === 'active' ? 'Suspend Access' : 'Reactivate Access'}
                            >
                              {member.status === 'active' ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Revoke Button (Owner Only) */}
                          {isOwner && !isCurrentSelf && member.role !== 'institute_owner' && member.status !== 'revoked' && (
                            <button
                              type="button"
                              onClick={() =>
                                setActionConfirmStaff({
                                  staff: member,
                                  action: 'revoke',
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Permanently Revoke Membership"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-900">{filteredStaff.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="font-semibold text-slate-900">{Math.min(currentPage * pageSize, filteredStaff.length)}</span> of{' '}
            <span className="font-semibold text-slate-900">{filteredStaff.length}</span> staff members
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Create Staff Member */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-primary" />
                <span>Add New Staff Account</span>
              </h2>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdInviteLink ? (
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                  <p className="font-semibold">Staff Account Created Successfully!</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    An onboarding invitation has been configured. Share the setup link below with the staff member to complete password creation:
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdInviteLink}
                    className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-700 truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-primary text-white text-xs font-medium hover:bg-brand-primary/90"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateModalOpen(false);
                      setCreatedInviteLink(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.displayName}
                    onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="e.g. ramesh@pradeepclasses.in"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as ErpRole })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  >
                    <option value="teacher">Teacher (Classroom & Attendance)</option>
                    <option value="accountant">Accountant (Fees & Billing)</option>
                    {isOwner && <option value="institute_admin">Institute Admin (Operations)</option>}
                  </select>
                  {!isOwner && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Admins can only provision Teacher and Accountant accounts.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={createForm.designation}
                      onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
                      placeholder="e.g. Senior Math Faculty"
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={createForm.department}
                      onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                      placeholder="e.g. Mathematics"
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formBusy}
                    className="px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50"
                  >
                    {formBusy ? 'Creating Account...' : 'Create Staff Member'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Staff Details Drawer */}
      {detailsStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-primary" />
                <span>Staff Profile Details</span>
              </h2>
              <button
                type="button"
                onClick={() => setDetailsStaff(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center text-sm uppercase">
                  {detailsStaff.displayName?.slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{detailsStaff.displayName}</h3>
                  <p className="text-xs text-slate-500">{detailsStaff.email}</p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3 border border-slate-200 rounded-xl p-4 text-xs">
                <div>
                  <dt className="text-slate-500 font-medium">Role</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{getRoleDefinition(detailsStaff.role)?.label}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">Status</dt>
                  <dd className="mt-1">{getStatusBadge(detailsStaff.status)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">Designation</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{detailsStaff.designation || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">Department</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{detailsStaff.department || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">Phone</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{detailsStaff.phone || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">Firebase UID</dt>
                  <dd className="mt-1 font-mono text-slate-700 truncate">{detailsStaff.uid}</dd>
                </div>
              </dl>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailsStaff(null)}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Change Staff Role */}
      {roleChangeStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-600" />
                <span>Modify Staff Role</span>
              </h2>
              <button
                type="button"
                onClick={() => setRoleChangeStaff(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRoleChangeSubmit} className="mt-4 space-y-4">
              <p className="text-sm text-slate-600">
                Change authorization role for <span className="font-semibold text-slate-900">{roleChangeStaff.displayName}</span>:
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Role</label>
                <select
                  value={selectedNewRole}
                  onChange={(e) => setSelectedNewRole(e.target.value as ErpRole)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="teacher">Teacher (Academics & Attendance)</option>
                  <option value="accountant">Accountant (Financial Ledgers)</option>
                  <option value="institute_admin">Institute Admin (Operations)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                Role modifications update permissions instantly across all ERP portal screens.
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRoleChangeStaff(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formBusy}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {formBusy ? 'Saving...' : 'Confirm Role Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Action Confirmation (Suspend / Reactivate / Revoke) */}
      {actionConfirmStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  actionConfirmStaff.action === 'revoke'
                    ? 'bg-rose-100 text-rose-600'
                    : actionConfirmStaff.action === 'suspend'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 capitalize">
                  {actionConfirmStaff.action} Staff Access
                </h3>
                <p className="text-xs text-slate-500">
                  {actionConfirmStaff.staff.displayName} ({actionConfirmStaff.staff.email})
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {actionConfirmStaff.action === 'suspend' &&
                'Suspending access will immediately revoke active session tokens and prevent this staff member from reading or modifying any institute data.'}
              {actionConfirmStaff.action === 'reactivate' &&
                'Reactivating access will restore this staff member to active status, allowing them to sign in and resume their role duties.'}
              {actionConfirmStaff.action === 'revoke' &&
                'Permanently revoking this membership will remove this user from the institute staff roster. This action cannot be automatically undone.'}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActionConfirmStaff(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={formBusy}
                onClick={handleActionConfirm}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 ${
                  actionConfirmStaff.action === 'revoke'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : actionConfirmStaff.action === 'suspend'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {formBusy ? 'Processing...' : `Confirm ${actionConfirmStaff.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
