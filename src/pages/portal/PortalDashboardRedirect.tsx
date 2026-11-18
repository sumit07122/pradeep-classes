import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDefaultPortalRoute } from '../../erp/rbac';

export default function PortalDashboardRedirect() {
  const { erpRole } = useAuth();
  return <Navigate to={getDefaultPortalRoute(erpRole)} replace />;
}
