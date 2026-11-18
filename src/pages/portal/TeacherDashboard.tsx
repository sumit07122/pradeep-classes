import React from 'react';
import WorkspaceDashboardShell from '../../components/erp/WorkspaceDashboardShell';

export default function TeacherDashboard() {
  return (
    <WorkspaceDashboardShell
      expectedRole="teacher"
      headline="Teacher Workspace"
      summary="Classroom-focused workspace for assigned student batches, daily attendance recording, and academic progress tracking."
      plannedModules={[
        {
          title: 'Assigned Batches & Class Schedule',
          description:
            'View your active teaching batches, subject timings, and enrolled student rosters.',
          phaseLabel: 'Next Phase',
        },
        {
          title: 'Daily Classroom Attendance',
          description:
            'Mark present, absent, and late statuses per batch session with automated history logs.',
          phaseLabel: 'Next Phase',
        },
        {
          title: 'Assessments & Study Notes',
          description:
            'Publish test scores, homework assignments, and batch-specific study resources.',
          phaseLabel: 'Scheduled',
        },
      ]}
      responsibilities={[
        'Record accurate classroom attendance for assigned batches.',
        'Review batch rosters and academic schedules.',
        'Track student test performance within authorized classes.',
      ]}
    />
  );
}
