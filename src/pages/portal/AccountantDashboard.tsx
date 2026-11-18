import React from 'react';
import WorkspaceDashboardShell from '../../components/erp/WorkspaceDashboardShell';

export default function AccountantDashboard() {
  return (
    <WorkspaceDashboardShell
      expectedRole="accountant"
      headline="Accounts & Fee Ledger Desk"
      summary="Dedicated financial workspace for fee structure administration, student payment receipts, dues reconciliation, and ledger reporting."
      plannedModules={[
        {
          title: 'Fee Structures & Installment Plans',
          description:
            'Define course-wise tuition schedules, admission charges, scholarships, and due dates.',
          phaseLabel: 'Next Phase',
        },
        {
          title: 'Fee Collection & Receipt Generation',
          description:
            'Record cash, UPI, and bank transfer payments and issue numbered institutional receipts.',
          phaseLabel: 'Next Phase',
        },
        {
          title: 'Pending Dues & Ledger Reconciliation',
          description:
            'Track overdue installments, daily collection registers, and monthly financial summaries.',
          phaseLabel: 'Scheduled',
        },
      ]}
      responsibilities={[
        'Manage institutional fee ledgers and payment verification.',
        'Generate financial collection and pending-dues statements.',
        'Maintain strict separation between accounting and academic controls.',
      ]}
    />
  );
}
