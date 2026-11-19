import React, { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  Building2,
  Calculator,
  CalendarCheck,
  ExternalLink,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  RefreshCw,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRoleDefinition, getVisibleNavItems } from '../erp/rbac';
import type { ErpNavIcon } from '../erp/types';

function NavIcon({ icon, className }: { icon: ErpNavIcon; className?: string }) {
  switch (icon) {
    case 'owner':
      return <ShieldCheck className={className} aria-hidden="true" />;
    case 'admin':
      return <LayoutDashboard className={className} aria-hidden="true" />;
    case 'accounts':
      return <Calculator className={className} aria-hidden="true" />;
    case 'teacher':
      return <GraduationCap className={className} aria-hidden="true" />;
    case 'profile':
      return <UserCheck className={className} aria-hidden="true" />;
    case 'staff':
      return <Users className={className} aria-hidden="true" />;
    case 'students':
      return <GraduationCap className={className} aria-hidden="true" />;
    case 'fees':
      return <Receipt className={className} aria-hidden="true" />;
    case 'attendance':
      return <CalendarCheck className={className} aria-hidden="true" />;
    case 'academics':
      return <BookOpen className={className} aria-hidden="true" />;
    case 'communication':
      return <Bell className={className} aria-hidden="true" />;
    case 'settings':
      return <Settings className={className} aria-hidden="true" />;
  }
}

export default function ErpLayout() {
  const {
    user,
    userProfile,
    memberships,
    activeMembership,
    activeInstitute,
    erpRole,
    erpLoading,
    switchInstitute,
    refreshErpContext,
    logout,
  } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const roleDef = getRoleDefinition(erpRole);
  const visibleNavItems = useMemo(
    () => getVisibleNavItems(erpRole, activeMembership?.status),
    [activeMembership?.status, erpRole]
  );

  const activeMemberships = useMemo(
    () => memberships.filter((m) => m.status === 'active'),
    [memberships]
  );

  const workspaceItems = visibleNavItems.filter((item) => item.section === 'Workspaces');
  const administrationItems = visibleNavItems.filter((item) => item.section === 'Administration');
  const academicsItems = visibleNavItems.filter((item) => item.section === 'Academics');
  const accountItems = visibleNavItems.filter((item) => item.section === 'Account');

  const currentNavItem = visibleNavItems.find((item) =>
    location.pathname.startsWith(item.path)
  );
  const breadcrumbLabel = currentNavItem?.label ?? 'Workspace';

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshErpContext();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/portal/login', { replace: true });
  };

  const handleInstituteChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await switchInstitute(e.target.value);
    setMobileMenuOpen(false);
  };

  const displayName =
    activeMembership?.displayName ||
    userProfile?.displayName ||
    user?.displayName ||
    'Staff Member';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-slate-200 flex items-center justify-between gap-3">
        <Link
          to="/portal/dashboard"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-3 min-w-0"
        >
          <div className="w-9 h-9 rounded-lg bg-brand-primary text-white flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-bold text-slate-900 tracking-tight truncate">
              Pradeep Classes
            </span>
            <span className="block text-xs text-slate-500 truncate">
              ERP Portal
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Active Institute Context */}
      <div className="px-4 py-4 border-b border-slate-200 bg-slate-50/70">
        <p className="text-xs font-medium text-slate-500 mb-1.5">Institute Workspace</p>
        {activeMemberships.length > 1 ? (
          <div>
            <label htmlFor="institute-switcher" className="sr-only">
              Select active institute
            </label>
            <select
              id="institute-switcher"
              value={activeMembership?.instituteId || ''}
              onChange={handleInstituteChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              {activeMemberships.map((m) => (
                <option key={m.id} value={m.instituteId}>
                  {m.instituteId} ({getRoleDefinition(m.role)?.shortLabel ?? m.role})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-slate-900 truncate">
              {activeInstitute?.name || activeMembership?.instituteId || 'Unassigned Institute'}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
              <span>{activeInstitute?.code || 'ERP'}</span>
              <span aria-hidden="true">·</span>
              <span>{activeInstitute?.academicSession || 'Active Session'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav aria-label="ERP Workspace Navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {workspaceItems.length > 0 && (
          <div>
            <p className="px-3 mb-2 text-xs font-semibold text-slate-400">Workspaces</p>
            <ul className="space-y-1">
              {workspaceItems.map((item) => (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-brand-primary text-white'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <NavIcon icon={item.icon} className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}

        {administrationItems.length > 0 && (
          <div>
            <p className="px-3 mb-2 text-xs font-semibold text-slate-400">Administration</p>
            <ul className="space-y-1">
              {administrationItems.map((item) => (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-brand-primary text-white'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <NavIcon icon={item.icon} className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}

        {academicsItems.length > 0 && (
          <div>
            <p className="px-3 mb-2 text-xs font-semibold text-slate-400">Academics</p>
            <ul className="space-y-1">
              {academicsItems.map((item) => (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-brand-primary text-white'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <NavIcon icon={item.icon} className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}

        {accountItems.length > 0 && (
          <div>
            <p className="px-3 mb-2 text-xs font-semibold text-slate-400">Account</p>
            <ul className="space-y-1">
              {accountItems.map((item) => (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-brand-primary text-white'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <NavIcon icon={item.icon} className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Staff Identity & Session Footer */}
      <div className="p-4 border-t border-slate-200 space-y-3 bg-white">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          <p className="mt-1 text-xs font-medium text-brand-primary">
            {roleDef?.label || 'Staff Member'}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
          <Link
            to="/"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <span>Public Website</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <span>Sign Out</span>
            <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workspace Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 font-medium shrink-0">Portal</span>
              <span className="text-slate-300 shrink-0" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-900 truncate">{breadcrumbLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap">
              <span className="font-medium text-slate-700">{roleDef?.label}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {activeInstitute?.academicSession || 'Session Pending'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || erpLoading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing || erpLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
