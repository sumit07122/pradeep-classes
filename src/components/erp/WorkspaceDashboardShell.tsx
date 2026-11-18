import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRoleDefinition } from '../../erp/rbac';
import type { ErpRole } from '../../erp/types';

export interface PlannedModuleItem {
  title: string;
  description: string;
  phaseLabel: string;
}

interface WorkspaceDashboardShellProps {
  expectedRole: ErpRole;
  headline: string;
  summary: string;
  plannedModules: readonly PlannedModuleItem[];
  responsibilities: readonly string[];
}

export default function WorkspaceDashboardShell({
  expectedRole,
  headline,
  summary,
  plannedModules,
  responsibilities,
}: WorkspaceDashboardShellProps) {
  const { user, activeInstitute, activeMembership, erpRole } = useAuth();
  const roleDef = getRoleDefinition(expectedRole);
  const activeRoleDef = getRoleDefinition(erpRole);

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-brand-primary">{roleDef?.label}</span>
              <span aria-hidden="true">·</span>
              <span>{activeInstitute?.name || activeMembership?.instituteId}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                Session {activeInstitute?.academicSession || 'Active'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {headline}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{summary}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/portal/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              <span>View Access Profile</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Verified Context Strip */}
        <dl className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <dt className="text-xs font-medium text-slate-500">Active Role</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {activeRoleDef?.label || 'Verified Staff'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Institute Code</dt>
            <dd className="mt-1 text-sm font-mono font-medium text-slate-900 tabular-nums">
              {activeInstitute?.code || activeMembership?.instituteId || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Membership Status</dt>
            <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 capitalize">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>{activeMembership?.status || 'active'}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Identity UID</dt>
            <dd className="mt-1 text-xs font-mono text-slate-700 truncate" title={user?.uid}>
              {user?.uid}
            </dd>
          </div>
        </dl>
      </section>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Planned Module Slots */}
        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Scheduled Workspace Modules
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Foundation shell active. Operational modules are scheduled for upcoming tasks.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-200 mt-2">
            {plannedModules.map((mod) => (
              <div
                key={mod.title}
                className="py-4 first:pt-3 last:pb-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900">{mod.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{mod.description}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 whitespace-nowrap shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>{mod.phaseLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Role Scope & Granted Permissions */}
        <aside className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Role Responsibilities</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
              {responsibilities.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-5 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 mb-3">
              Granted RBAC Permissions ({roleDef?.permissions.length ?? 0})
            </h3>
            <ul className="space-y-1.5 text-xs font-mono text-slate-700">
              {roleDef?.permissions.map((perm) => (
                <li key={perm} className="py-1 border-b border-slate-100 last:border-b-0">
                  {perm}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
