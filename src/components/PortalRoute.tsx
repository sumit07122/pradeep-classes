import React, { useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  LogOut,
  MailCheck,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRoleDefinition } from '../erp/rbac';
import type { ErpPermission, ErpRole } from '../erp/types';

interface PortalRouteProps {
  requiredPermission?: ErpPermission;
  allowedRoles?: readonly ErpRole[];
}

export default function PortalRoute({ requiredPermission, allowedRoles }: PortalRouteProps) {
  const {
    user,
    userProfile,
    memberships,
    activeMembership,
    activeInstitute,
    erpRole,
    loading,
    erpLoading,
    erpError,
    emailVerificationRequired,
    resendVerificationEmail,
    reloadVerificationStatus,
    refreshErpContext,
    hasPermission,
    hasRole,
    logout,
  } = useAuth();
  const location = useLocation();
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);

  if (loading || erpLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6"
      >
        <div className="w-10 h-10 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-700">Verifying ERP workspace access...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  if (emailVerificationRequired) {
    const handleResend = async () => {
      setVerifyBusy(true);
      setVerifyError(null);
      setVerifyNotice(null);
      try {
        await resendVerificationEmail();
        setVerifyNotice(`Verification link sent to ${user.email}.`);
      } catch (err) {
        setVerifyError(err instanceof Error ? err.message : 'Unable to send verification email.');
      } finally {
        setVerifyBusy(false);
      }
    };

    const handleCheck = async () => {
      setVerifyBusy(true);
      setVerifyError(null);
      setVerifyNotice(null);
      try {
        const verified = await reloadVerificationStatus();
        if (!verified) {
          setVerifyError('Email is still unverified. Check your inbox and try again.');
        }
      } catch (err) {
        setVerifyError(err instanceof Error ? err.message : 'Unable to reload verification status.');
      } finally {
        setVerifyBusy(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-8">
          <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-5">
            <MailCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Email Verification Required</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Your staff account (<span className="font-medium text-slate-900">{user.email}</span>)
            must verify its email address before accessing any ERP institute workspace.
          </p>

          {verifyError && (
            <div
              role="alert"
              className="mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"
            >
              {verifyError}
            </div>
          )}

          {verifyNotice && (
            <div
              role="status"
              className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800"
            >
              {verifyNotice}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={verifyBusy}
              onClick={() => void handleCheck()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Check Verification Status</span>
            </button>
            <button
              type="button"
              disabled={verifyBusy}
              onClick={() => void handleResend()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60 cursor-pointer"
            >
              <span>Resend Email</span>
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (erpError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-8">
          <div className="w-11 h-11 rounded-lg bg-red-50 text-red-700 flex items-center justify-center mb-5">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Unable to Verify Workspace Session</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{erpError}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void refreshErpContext()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Retry Verification</span>
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile || userProfile.status !== 'active') {
    console.warn('[SECURITY] ERP Route access denied: Missing or disabled user profile', {
      uid: user.uid,
      status: userProfile?.status ?? 'missing',
      path: location.pathname,
    });

    const isMissing = !userProfile;
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-8">
          <div className="w-11 h-11 rounded-lg bg-red-50 text-red-700 flex items-center justify-center mb-5">
            <ShieldAlert className="w-5 h-5" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {isMissing ? 'Staff Profile Not Found' : 'Staff Account Disabled'}
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {isMissing ? (
              <>
                No active ERP staff profile was found for{' '}
                <span className="font-medium text-slate-900">{user.email}</span>. Staff accounts
                must be provisioned through trusted administrative channels.
              </>
            ) : (
              <>
                Your ERP profile for <span className="font-medium text-slate-900">{user.email}</span>{' '}
                is currently disabled. Contact the Institute Owner to restore access.
              </>
            )}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Return to Public Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!activeMembership || activeMembership.status !== 'active') {
    console.warn('[SECURITY] ERP Route access denied: Missing or inactive membership', {
      uid: user.uid,
      path: location.pathname,
    });

    const inactiveList = memberships.filter((m) => m.status !== 'active');

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl p-8">
          <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-5">
            <Building2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Staff Membership Required</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            You are signed in, but no active institute membership is linked to this account. Staff
            roles cannot be self-assigned and must be provisioned by an Institute Owner or
            authorized administrator.
          </p>

          <dl className="mt-6 border border-slate-200 rounded-lg divide-y divide-slate-200 text-sm">
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-slate-500">Signed-in Email</dt>
              <dd className="font-medium text-slate-900">{user.email}</dd>
            </div>
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-slate-500">Firebase UID</dt>
              <dd className="font-mono text-xs text-slate-800 break-all">{user.uid}</dd>
            </div>
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-slate-500">Email Verified</dt>
              <dd className="font-medium text-slate-900">
                {user.emailVerified ? 'Verified' : 'Unverified'}
              </dd>
            </div>
          </dl>

          {inactiveList.length > 0 && (
            <div className="mt-5 border border-slate-200 rounded-lg p-4 bg-slate-50">
              <p className="text-xs font-semibold text-slate-700 mb-2">
                Inactive Membership Records
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {inactiveList.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <span>
                      {m.instituteId} · {getRoleDefinition(m.role)?.label ?? m.role}
                    </span>
                    <span className="font-medium text-amber-700 capitalize">{m.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void refreshErpContext()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Refresh Access</span>
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!activeInstitute || activeInstitute.status !== 'active') {
    console.warn('[SECURITY] ERP Route access denied: Missing or inactive institute', {
      uid: user.uid,
      instituteId: activeMembership.instituteId,
      status: activeInstitute?.status ?? 'missing',
      path: location.pathname,
    });

    const isMissingInstitute = !activeInstitute;
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-8">
          <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-5">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {isMissingInstitute ? 'Institute Workspace Not Found' : 'Institute Workspace Suspended'}
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {isMissingInstitute ? (
              <>
                The institute workspace linked to your membership could not be found or loaded.
                Please contact the Institute Owner.
              </>
            ) : (
              <>
                Access to <span className="font-medium text-slate-900">{activeInstitute.name}</span>{' '}
                is currently suspended. Please contact your system administrator.
              </>
            )}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Return to Public Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!erpRole) {
    console.warn('[SECURITY] ERP Route access denied: No active role resolved', {
      uid: user.uid,
      path: location.pathname,
    });
    return (
      <Navigate
        to="/portal/unauthorized"
        state={{ attemptedPath: location.pathname }}
        replace
      />
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.warn('[SECURITY] ERP Route access denied: Missing required permission', {
      uid: user.uid,
      role: erpRole,
      requiredPermission,
      path: location.pathname,
    });
    return (
      <Navigate
        to="/portal/unauthorized"
        state={{ attemptedPath: location.pathname }}
        replace
      />
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    console.warn('[SECURITY] ERP Route access denied: Role not allowed', {
      uid: user.uid,
      role: erpRole,
      allowedRoles,
      path: location.pathname,
    });
    return (
      <Navigate
        to="/portal/unauthorized"
        state={{ attemptedPath: location.pathname }}
        replace
      />
    );
  }

  return <Outlet />;
}
