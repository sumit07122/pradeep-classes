import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDefaultPortalRoute, ROLE_DEFINITIONS } from '../../erp/rbac';

function mapFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid institutional email address.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Contact your Institute Owner if you need an account provisioned.';
    case 'auth/user-disabled':
      return 'This staff account has been disabled. Contact your Institute Owner.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes or reset your password.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method).';
    case 'auth/network-request-failed':
      return 'Network error while contacting authentication service. Please check your connection.';
    default:
      return error instanceof Error
        ? error.message
        : 'Unable to complete authentication. Please try again.';
  }
}

export default function PortalLogin() {
  const {
    user,
    activeMembership,
    erpRole,
    loading,
    erpLoading,
    erpError,
    emailVerificationRequired,
    signInWithEmail,
    sendPasswordReset,
    resendVerificationEmail,
    reloadVerificationStatus,
    refreshErpContext,
    logout,
  } = useAuth();
  const location = useLocation();

  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
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

  if (user && user.emailVerified && activeMembership && erpRole) {
    return <Navigate to={targetRoute} replace />;
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setStatusMessage(null);

    if (!email.trim() || !password) {
      setAuthError('Enter both your staff email address and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setStatusMessage(null);

    if (!email.trim()) {
      setAuthError('Enter your registered staff email address to receive a reset link.');
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      setStatusMessage(
        'If a provisioned staff account exists for that email, a password reset link has been sent.'
      );
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setAuthError(null);
    setStatusMessage(null);
    setSubmitting(true);
    try {
      await resendVerificationEmail();
      setStatusMessage(
        `Verification link sent to ${user?.email}. Open the link in your inbox, then click "I've Verified My Email".`
      );
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckVerification = async () => {
    setAuthError(null);
    setStatusMessage(null);
    setSubmitting(true);
    try {
      const verified = await reloadVerificationStatus();
      if (!verified) {
        setAuthError('Email is still unverified. Please click the verification link in your inbox.');
      }
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err));
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
                Sign in with your provisioned staff email and password. Access is verified by
                Firebase Authentication and scoped to your institute membership in Firestore.
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
                Public registration is disabled. Staff accounts are provisioned strictly by the
                Institute Owner or trusted backend administration.
              </span>
            </div>
          </section>

          {/* Right Auth Card */}
          <section className="order-1 lg:order-2 lg:col-span-5 bg-white border border-slate-200 rounded-xl p-8 flex flex-col justify-center">
            {user && emailVerificationRequired ? (
              <div className="space-y-5">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <MailCheck className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Verify Your Email</h2>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Signed in as <span className="font-medium text-slate-900">{user.email}</span>.
                    Your email address must be verified before ERP membership and workspace access
                    are granted.
                  </p>
                </div>

                {authError && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"
                  >
                    {authError}
                  </div>
                )}

                {statusMessage && (
                  <div
                    role="status"
                    className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800"
                  >
                    {statusMessage}
                  </div>
                )}

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleCheckVerification()}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    <span>I&apos;ve Verified My Email</span>
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleResendVerification()}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <span>Resend Verification Email</span>
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void logout()}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : user ? (
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
                    <span>Sign Out &amp; Switch Account</span>
                  </button>
                </div>
              </div>
            ) : mode === 'reset' ? (
              <form onSubmit={handlePasswordReset} className="space-y-5" noValidate>
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-brand-primary flex items-center justify-center">
                  <KeyRound className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Reset Staff Password</h2>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Enter your provisioned staff email address to receive a password reset link.
                  </p>
                </div>

                {authError && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"
                  >
                    {authError}
                  </div>
                )}

                {statusMessage && (
                  <div
                    role="status"
                    className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800"
                  >
                    {statusMessage}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="erp-reset-email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Staff Email Address
                  </label>
                  <input
                    id="erp-reset-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@pradeepclasses.in"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-4 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? 'Sending Reset Link...' : 'Send Password Reset Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setAuthError(null);
                      setStatusMessage(null);
                    }}
                    className="w-full px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Back to Staff Sign In
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleEmailSignIn} className="space-y-5" noValidate>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Staff Sign In</h2>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Sign in with your institute email and password.
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

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="erp-email"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Staff Email Address
                    </label>
                    <input
                      id="erp-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@pradeepclasses.in"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label
                        htmlFor="erp-password"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('reset');
                          setAuthError(null);
                          setStatusMessage(null);
                        }}
                        className="text-xs font-medium text-brand-primary hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="erp-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full rounded-lg border border-slate-300 bg-white pl-3.5 pr-11 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-slate-500 hover:text-slate-900 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-4 py-3 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Signing in...' : 'Sign In to ERP Portal'}
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
              </form>
            )}
          </section>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="px-6 py-4 border-t border-slate-200 bg-white text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Pradeep Classes · Mathura</span>
          <span>Email &amp; Password Staff Authentication</span>
        </div>
      </footer>
    </div>
  );
}
