import React from 'react';
import WorkspaceDashboardShell from '../../components/erp/WorkspaceDashboardShell';

export default function OwnerDashboard() {
  return (
    <WorkspaceDashboardShell
      expectedRole="institute_owner"
      headline="Institute Owner Workspace"
      summary="Executive governance console for institute configuration, staff role provisioning, academic health, and financial oversight."
      plannedModules={[
        {
          title: 'Staff Provisioning & Role Governance',
          description:
            'Provision verified staff memberships across Institute Admin, Accountant, and Teacher roles with instant revocation controls.',
          phaseLabel: 'Next Phase',
        },
        {
          title: 'Institute & Academic Session Settings',
          description:
            'Manage active academic sessions, branch metadata, fee cycle policies, and institutional defaults.',
          phaseLabel: 'Next Phase',
        },
        {
          title: 'Executive Financial & Enrollment Summary',
          description:
            'Consolidated revenue, pending fee dues, batch capacity utilization, and audit trail reports.',
          phaseLabel: 'Scheduled',
        },
      ]}
      responsibilities={[
        'Approve and revoke staff memberships within the institute.',
        'Configure institute academic sessions and governance rules.',
        'Review cross-functional academic and financial reports.',
        'Access all operational, accounting, and faculty workspaces.',
      ]}
    />
  );
}
