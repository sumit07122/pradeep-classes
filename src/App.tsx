import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';

// Layouts & Route Guards
import PublicLayout from './layouts/PublicLayout';
import ErpLayout from './layouts/ErpLayout';
import AdminRoute from './components/AdminRoute';
import PortalRoute from './components/PortalRoute';

// Public Website Pages
import Home from './pages/Home';
import Courses from './pages/Courses';
import Results from './pages/Results';
import Faculty from './pages/Faculty';
import Gallery from './pages/Gallery';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import Resources from './pages/Resources';

// Legacy CMS Admin Pages (preserved)
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

// ERP Portal Pages
import PortalLogin from './pages/portal/PortalLogin';
import PortalDashboardRedirect from './pages/portal/PortalDashboardRedirect';
import OwnerDashboard from './pages/portal/OwnerDashboard';
import AdminErpDashboard from './pages/portal/AdminErpDashboard';
import AccountantDashboard from './pages/portal/AccountantDashboard';
import TeacherDashboard from './pages/portal/TeacherDashboard';
import PortalProfile from './pages/portal/PortalProfile';
import StaffManagement from './pages/portal/StaffManagement';
import InstituteSettings from './pages/portal/InstituteSettings';
import StudentManagement from './pages/portal/StudentManagement';
import AttendanceManagement from './pages/portal/AttendanceManagement';
import AcademicManagement from './pages/portal/AcademicManagement';
import FeeManagement from './pages/portal/FeeManagement';
import CommunicationManagement from './pages/portal/CommunicationManagement';
import PortalUnauthorized from './pages/portal/PortalUnauthorized';

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <AppProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Public Website & Legacy CMS Admin Layout */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/results" element={<Results />} />
                <Route path="/faculty" element={<Faculty />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/contact" element={<Contact />} />

                {/* Existing CMS Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route element={<AdminRoute />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Route>
              </Route>

              {/* ERP Authentication & Unauthorized Routes (Isolated from Public Layout) */}
              <Route path="/portal/login" element={<PortalLogin />} />
              <Route path="/portal/unauthorized" element={<PortalUnauthorized />} />

              {/* Protected ERP Workspace Routes */}
              <Route path="/portal" element={<PortalRoute />}>
                <Route element={<ErpLayout />}>
                  <Route index element={<Navigate to="/portal/dashboard" replace />} />
                  <Route path="dashboard" element={<PortalDashboardRedirect />} />

                  <Route element={<PortalRoute requiredPermission="dashboard:owner:view" />}>
                    <Route path="owner" element={<OwnerDashboard />} />
                  </Route>

                  <Route element={<PortalRoute requiredPermission="dashboard:admin:view" />}>
                    <Route path="admin" element={<AdminErpDashboard />} />
                  </Route>

                  <Route element={<PortalRoute requiredPermission="dashboard:accountant:view" />}>
                    <Route path="accounts" element={<AccountantDashboard />} />
                  </Route>

                  <Route element={<PortalRoute requiredPermission="dashboard:teacher:view" />}>
                    <Route path="teacher" element={<TeacherDashboard />} />
                  </Route>

                  <Route element={<PortalRoute requiredPermission="staff:view" />}>
                    <Route path="staff" element={<StaffManagement />} />
                  </Route>

                  <Route element={<PortalRoute requiredPermission="institute:settings:view" />}>
                    <Route path="settings" element={<InstituteSettings />} />
                  </Route>

                  <Route element={<PortalRoute requiredPermission="students:view" />}>
                    <Route path="students" element={<StudentManagement />} />
                  </Route>

                  <Route element={<PortalRoute requiredPermission="attendance:view" />}>
                    <Route path="attendance" element={<AttendanceManagement />} />
                  </Route>

                  <Route element={<PortalRoute requiredPermission="academics:view" />}>
                    <Route path="academics" element={<AcademicManagement />} />
                  </Route>

                  <Route element={<PortalRoute requiredPermission="finance:view" />}>
                    <Route path="fees" element={<FeeManagement />} />
                  </Route>

                  <Route element={<PortalRoute requiredPermission="portal:access" />}>
                    <Route path="communication" element={<CommunicationManagement />} />
                  </Route>

                  <Route element={<PortalRoute requiredPermission="portal:access" />}>
                    <Route path="profile" element={<PortalProfile />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/portal/dashboard" replace />} />
                </Route>
              </Route>
            </Routes>
          </Router>
        </AppProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
