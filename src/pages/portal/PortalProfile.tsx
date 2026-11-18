import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRoleDefinition } from '../../erp/rbac';

export default function PortalProfile() {
  const { user, userProfile, activeMembership, activeInstitute, memberships, erpRole } = useAuth();
  const roleDef = getRoleDefinition(erpRole);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Staff Profile & Institute Access
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Verified identity, active institute membership, and RBAC permission scope loaded from
          Firestore.
        </p>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-200">
              Identity Record
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Display Name</dt>
                <dd className="font-medium text-slate-900 text-right">
                  {activeMembership?.displayName ||
                    userProfile?.displayName ||
                    user?.displayName ||
                    '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium text-slate-900 text-right">{user?.email || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Firebase UID</dt>
                <dd className="font-mono text-xs text-slate-800 text-right break-all">
                  {user?.uid || '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Profile Status</dt>
                <dd className="font-medium text-slate-900 capitalize text-right">
                  {userProfile?.status || 'active'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border border-slate-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-200">
              Active Institute & Role
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Institute</dt>
                <dd className="font-medium text-slate-900 text-right">
                  {activeInstitute?.name || activeMembership?.instituteId || '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Code · Session</dt>
                <dd className="font-mono text-xs text-slate-800 tabular-nums text-right">
                  {activeInstitute?.code || '—'} · {activeInstitute?.academicSession || '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Assigned Role</dt>
                <dd className="font-semibold text-brand-primary text-right">
                  {roleDef?.label || '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Membership ID</dt>
                <dd className="font-mono text-xs text-slate-800 text-right break-all">
                  {activeMembership?.id || '—'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <h2 className="text-base font-semibold text-slate-900">
          Institute Memberships ({memberships.length})
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-2.5 pr-4">Institute ID</th>
                <th className="py-2.5 pr-4">Role</th>
                <th className="py-2.5 pr-4">Designation</th>
                <th className="py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {memberships.map((m) => (
                <tr key={m.id}>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-800">{m.instituteId}</td>
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {getRoleDefinition(m.role)?.label ?? m.role}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{m.designation || '—'}</td>
                  <td className="py-3 capitalize font-medium text-slate-800">{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
