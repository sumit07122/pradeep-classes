import React from 'react';
import WorkspaceDashboardShell from '../../components/erp/WorkspaceDashboardShell';

export default function AdminErpDashboard() {
  return (
    <WorkspaceDashboardShell
      expectedRole="institute_admin"
      headline="Institute Admin Operations"
      summary="Operational coordination workspace for batch scheduling, admissions intake, faculty assignments, and daily institute administration."
      plannedModules={[
        {
          title: 'Student Directory & Admissions Intake',
          description:
            'Enroll students into courses and batches, maintain guardian contact records, and manage academic transfers.',
          phaseLabel: 'Next Phase',
        },
        {
          title: 'Batch & Timetable Management',
          description:
            'Create class batches, assign teachers, and publish weekly classroom schedules.',
          phaseLabel: 'Next Phase',
        },
        {
          title: 'Attendance & Academic Operations Audit',
          description:
            'Monitor daily batch attendance completion and review operational notices.',
          phaseLabel: 'Scheduled',
        },
      ]}
      responsibilities={[
        'Coordinate day-to-day batch schedules and classroom operations.',
        'Oversee student enrollment workflows and section allocations.',
        'Support faculty attendance tracking and academic reporting.',
      ]}
    />
  );
}
