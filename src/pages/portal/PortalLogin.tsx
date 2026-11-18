import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Building2, Lock, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDefaultPortalRoute, ROLE_DEFINITIONS } from '../../erp/rbac';

export default function PortalLogin() {
  const {
    user,
    activeMembership,
    erpRole,
    loading,
    erpLoading,
    erpError,
    signInWithGoogle,
    refreshErpContext,
    logout,
  } = useAuth();
  const location = useLocation();
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fromState = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const targetRoute =
    fromState && fromState.startsWith('/portal') && fromState !== '/portal/login'
      ? fromState
      : getDefaultPortalRoute(erpRole);

  if (loading || erpLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6"
      >
        <div className="w-10 h-10 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-700">Checking portal session...</p>
      </div>
    );
  }

  if (user && activeMembership && erpRole) {
    return <Navigate to={targetRoute} replace />;
  }

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to complete Google sign-in.';
      setAuthError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const roles = [
    ROLE_DEFINITIONS.institute_owner,
    ROLE_DEFINITIONS.institute_admin,
    ROLE_DEFINITIONS.accountant,
    ROLE_DEFINITIONS.teacher,
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Top Bar */}
      <header className="px-6 py-4 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-primary text-white flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="block text-sm font-bold text-slate-900 tracking-tight">
                Pradeep Classes
              </span>
              <span className="block text-xs text-slate-500">ERP Staff Portal</span>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Public Website</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Context Column */}
          <section className="order-2 lg:order-1 lg:col-span-7 bg-white border border-slate-200 rounded-xl p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-brand-primary">
                Institute Operations Platform
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Role-Scoped ERP Workspace
              </h1>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-xl">
                Sign in with your verified institutional Google account. Access is scoped by
                institute membership and enforced by server-side security rules.
              </p>

              <div className="mt-8 border-t border-slate-200 pt-6">
                <h2 className="text-xs font-semibold text-slate-500 mb-4">
                  Provisioned Staff Roles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {roles.map((r) => (
                    <div
                      key={r.role}
                      className="border border-slate-200 rounded-lg p-4 bg-slate-50/50"
                    >
                      <h3 className="text-sm font-semibold text-slate-900">{r.label}</h3>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        {r.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              <span>
                Staff memberships are provisioned strictly by the Institute Owner or System
                Administrator.
              </span>
            </div>
          </section>

          {/* Right Auth Card */}
          <section className="order-1 lg:order-2 lg:col-span-5 bg-white border border-slate-200 rounded-xl p-8 flex flex-col justify-center">
            {user ? (
              <div className="space-y-5">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Membership Not Provisioned
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Signed in as <span className="font-medium text-slate-900">{user.email}</span>.
                    No active institute membership was found for your Firebase UID.
                  </p>
                </div>

                {erpError && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"
                  >
                    {erpError}
                  </div>
                )}

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs font-medium text-slate-500">Firebase UID</p>
                  <p className="mt-1 font-mono text-xs text-slate-800 break-all">{user.uid}</p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => void refreshErpContext()}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    <span>Check Membership Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span>Sign Out & Switch Account</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Staff Sign In</h2>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Authenticate with Google to enter your assigned institute workspace.
                  </p>
                </div>

                {(authError || erpError) && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"
                  >
                    {authError || erpError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:border-slate-400 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-1 7.28-2.69l-3.57-2.77c-.99.69-2.26 1.1-3.71 1.1-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.11c-.22-.69-.35-1.43-.35-2.11s.13-1.42.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>{submitting ? 'Signing in...' : 'Sign in with Google'}</span>
                </button>

                <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between gap-4">
                  <span>Looking for website CMS?</span>
                  <Link
                    to="/admin/login"
                    className="font-medium text-brand-primary hover:underline whitespace-nowrap"
                  >
                    CMS Admin Login
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="px-6 py-4 border-t border-slate-200 bg-white text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Pradeep Classes · Mathura</span>
          <span>Zero-Trust Institute ERP</span>
        </div>
      </footer>
    </div>
  );
}
