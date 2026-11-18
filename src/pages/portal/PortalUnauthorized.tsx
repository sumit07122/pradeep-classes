import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ShieldOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDefaultPortalRoute, getRoleDefinition } from '../../erp/rbac';

export default function PortalUnauthorized() {
  const { user, erpRole } = useAuth();
  const location = useLocation();
  const state = location.state as { attemptedPath?: string } | null;
  const roleDef = getRoleDefinition(erpRole);
  const homeRoute = erpRole ? getDefaultPortalRoute(erpRole) : '/portal/login';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-8">
        <div className="w-11 h-11 rounded-lg bg-red-50 text-red-700 flex items-center justify-center mb-5">
          <ShieldOff className="w-5 h-5" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Access Restricted</h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {user && roleDef ? (
            <>
              Your current role ({roleDef.label}) does not include permission to view{' '}
              <span className="font-mono text-xs text-slate-800">
                {state?.attemptedPath || 'this workspace route'}
              </span>
              .
            </>
          ) : (
            <>
              Sign in with an authorized staff account to access{' '}
              <span className="font-mono text-xs text-slate-800">
                {state?.attemptedPath || 'this workspace route'}
              </span>
              .
            </>
          )}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to={homeRoute}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{user && roleDef ? 'Return to My Dashboard' : 'Go to Staff Sign In'}</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
