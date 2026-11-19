# Pradeep Classes & Enterprise Resource Planning (ERP) Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v12-orange.svg)](https://firebase.google.com/)
[![Express](https://img.shields.io/badge/Express-Backend-green.svg)](https://expressjs.com/)

An enterprise coaching management and institutional ERP platform built alongside the existing public website and CMS for **Pradeep Classes**.

---

## 1. High-Level Architecture

The platform operates as a unified dual-application architecture designed to preserve the public-facing brand website and legacy CMS while delivering a multi-tenant institutional ERP:

```
                                  Pradeep Classes Platform
                                             │
         ┌───────────────────────────────────┼───────────────────────────────────┐
         │                                   │                                   │
   Public Website                       Legacy CMS                        Multi-Tenant ERP
   Routes: / ...                 Route: /admin/dashboard            Route: /portal/*
   Layout: PublicLayout          Layout: AdminLayout                Layout: ErpLayout
   Auth: None (Public)           Auth: Google Sign-In               Auth: Email & Password
   State: Read-Only Data         Auth: Super-Admin Allowlist        Auth: Firestore Memberships
```

### Core Architectural Guarantees
1. **Public Website Preservation**: The public website (`/`, `/about`, `/courses`, `/results`, `/contact`) remains untouched and fast.
2. **Legacy CMS Independence**: The existing CMS `/admin/dashboard` remains operational with Google OAuth and super-admin email verification.
3. **Multi-Tenant ERP Isolation**: The ERP (`/portal/*`) operates under strict institutional scoping where all documents require an `instituteId` matching the caller's active, verified membership.
4. **Trusted Provisioning**: Staff accounts are provisioned exclusively through a protected Express backend with Firebase Admin SDK, rate limiting, and audit logging.

---

## 2. Role-Based Access Control (RBAC) Matrix

The ERP architecture enforces strict role separation across four canonical staff roles:

| Module / Route | Required Permission | Institute Owner | Institute Admin | Accountant | Teacher |
|---|---|:---:|:---:|:---:|:---:|
| **Owner Dashboard** (`/portal/owner`) | `dashboard:owner:view` | ✅ | ❌ | ❌ | ❌ |
| **Admin Dashboard** (`/portal/admin`) | `dashboard:admin:view` | ✅ | ✅ | ❌ | ❌ |
| **Accounts Dashboard** (`/portal/accounts`) | `dashboard:accountant:view` | ✅ | ❌ | ✅ | ❌ |
| **Teacher Dashboard** (`/portal/teacher`) | `dashboard:teacher:view` | ✅ | ✅ | ❌ | ✅ |
| **Staff Directory** (`/portal/staff`) | `staff:view` | ✅ | ✅ | ❌ | ❌ |
| **Staff Provisioning / Role Alteration** | `staff:manage` / `staff:role:manage` | ✅ (Full) | ⚠️ (No Owner/Admin create) | ❌ | ❌ |
| **Institute Settings** (`/portal/settings`) | `institute:settings:view` | ✅ | ✅ | ❌ | ❌ |
| **Legal Profile Editing** | `institute:settings:manage` | ✅ | ❌ | ❌ | ❌ |
| **Student Directory** (`/portal/students`) | `students:view` | ✅ | ✅ | ✅ (Read) | ✅ (Read) |
| **Student Admissions & Edit** | `students:manage` | ✅ | ✅ | ❌ | ❌ |
| **Attendance Roll Call** (`/portal/attendance`) | `attendance:view` / `attendance:mark` | ✅ | ✅ | ❌ | ✅ |
| **Academic Timetable & Exams** (`/portal/academics`) | `academics:view` / `academics:manage` | ✅ | ✅ | ❌ | ✅ (Classroom) |
| **Fee Desk & Ledgers** (`/portal/fees`) | `finance:view` / `finance:manage` | ✅ | ❌ | ✅ | ❌ |
| **Notice Board & Comms** (`/portal/communication`) | `portal:access` | ✅ | ✅ | ✅ | ✅ |
| **Staff Profile & Switcher** (`/portal/profile`) | `portal:access` | ✅ | ✅ | ✅ | ✅ |

---

## 3. ERP Modules Overview

### 3.1 Staff Management (`/portal/staff`)
- Real-time directory with filters by role, status, and text search (name, email, phone, designation).
- Create Staff Wizard: Validates email, full name, temporary password, phone, department, and role.
- Permission-gated role hierarchy: Admins cannot create Owner or Admin accounts.
- Staff details drawer, change role modal (Owner only), suspension/reactivation toggles, and permanent revocation.

### 3.2 Institute Settings & Academic Structure (`/portal/settings`)
- 6 interactive tabs:
  1. **Institute Profile**: Legal name, registration number, phone, email, website, and physical address.
  2. **Academic Sessions**: Academic year lifecycle with active session marker.
  3. **Course Programs**: Program code, description, duration, and archival controls.
  4. **Student Batches**: Batch code, maximum seat capacity, linked course and academic session.
  5. **Classrooms & Halls**: Seating capacities, room numbers, and facility notes.
  6. **Curriculum Subjects**: Subject catalog mapped to courses.

### 3.3 Student Admissions & Directory (`/portal/students`)
- Filterable directory by course, batch, status (`active`, `suspended`, `graduated`, `dropped`), and search.
- Live KPI cards: Total Enrolled, Active Students, Courses, Batches.
- Admission Modal: Captures personal info, guardian contacts, prior education, course & batch assignment.
- Student Profile Drawer: Complete academic history, guardian details, and admission metadata.
- Batch Transfer & Enrollment Status modals.

### 3.4 Fee Desk & Financial Management (`/portal/fees`)
- Strictly isolated to `institute_owner` and `accountant` via Firestore `isFinancePrivileged()`.
- **Payments & Receipts**: Search by student name, admission #, receipt #, or UPI ref.
- **Record Fee Payment Modal**: Real-time balance calculations, payment mode selection (Cash, UPI, Cheque, Bank Transfer, Card), and instant official printable receipt generation.
- **Fee Structures**: Fee schedules broken down by components (Admission, Tuition, Lab, Exam).
- **Outstanding Dues**: Student-wise pending balance ledger with instant collection shortcut.
- **Void Payment**: Audited receipt voiding with mandatory justification.

### 3.5 Attendance Registers (`/portal/attendance`)
- Batch-wise roll call sheet with interactive date selection.
- Color-coded status toggles: **Present (P)**, **Absent (A)**, **Late (L)**, **Excused (E)**.
- Bulk shortcuts: "Mark All Present" and "Mark All Absent".
- Live KPI progress bar showing batch attendance percentage in real-time.
- Batch History Log: Past roll-call sheets with presenteeism metrics and one-click edit shortcut.

### 3.6 Academic Management (`/portal/academics`)
- **Weekly Timetable**: Monday–Sunday schedule grid with period timing, subject, room, and assigned faculty.
- **Homework & Assignments**: Assignment publisher with due dates and submission guidelines.
- **Exams & Grading**: Scheduled exams, passing threshold, and student marks roster.
- Live percentage and letter grade calculation (`A+`, `A`, `B`, `C`, `D`, `F`).
- Comprehensive Scorecard and student ranking modal.

### 3.7 Notice Board & WhatsApp Parent Messenger (`/portal/communication`)
- **Notice Board**: Announcements categorized by priority (`normal`, `important`, `urgent`) and target audience (`all`, `staff`, `students`, `batch`).
- **WhatsApp Parent Messenger**: Direct click-to-chat integration using standard `https://wa.me/...` protocols without recurring third-party SMS costs or external PII leakage.
- Pre-built notification templates:
  - Fee Payment Reminders (student name, balance, UPI ID).
  - Daily Absence Alerts (student name, date, batch).
  - Examination Score Reports (marks, percentage, letter grade).
- Real-time smartphone preview bubble showing live message rendering before dispatch.

---

## 4. Backend Provisioning Architecture

Staff provisioning and privileged account lifecycles are handled through an Express backend service:

```
[ERP Frontend] ──(ID Token)──> [Express /api/erp/provisioning] ──(Admin SDK)──> [Firebase Auth & Firestore]
                                        │
                                        ├─► verifyStaffToken (Bearer ID Token check)
                                        ├─► requireStaffRole (Owner / Admin enforcement)
                                        ├─► RateLimiter (Abuse prevention)
                                        └─► AuditService (Immutable audit log trail)
```

### Key API Endpoints (`/api/erp/provisioning`):
- `POST /bootstrap`: Atomic creation of initial institute and owner membership.
- `POST /create-staff`: Staff creation in Firebase Auth + Firestore `users` + `institute_memberships`.
- `POST /invite-staff`: Secure password setup link generation via Admin SDK.
- `PATCH /update-role`: Role modification (Owner only).
- `PATCH /status`: Suspend or reactivate staff with immediate `revokeRefreshTokens()`.
- `DELETE /membership`: Membership revocation (Owner only) with token revocation.

---

## 5. Security & Multi-Tenancy Invariants

1. **Multi-Tenant Firestore Scoping**:
   All collection rules require `resource.data.instituteId == activeInstituteId` or `incoming().instituteId == activeInstituteId`.
2. **Fail-Closed Authorization**:
   `isActiveUserRecord()` in Firestore rules and `useAuth()` on the client strictly fail closed if user profiles or memberships are non-existent, inactive, or revoked.
3. **Zero Financial Exposure**:
   The `isFinancePrivileged()` Firestore helper and route guards prevent Teachers and Institute Admins from querying or viewing fee ledgers or financial documents.
4. **Token Revocation on Suspension**:
   Suspending or revoking any staff account triggers `admin.auth().revokeRefreshTokens(uid)` on the backend, ensuring immediate session termination across all devices.

---

## 6. Automated Test Suite

The project includes 10 dedicated test suites validating security, RBAC, business logic, and API endpoints:

```bash
# Security & RBAC
npx tsx src/erp/security.test.ts          # 11 tests (Cross-institute, self-elevation, fail-closed)
npx tsx src/erp/rbac.test.ts              # 7 tests (Role permissions, visible routes, active membership)

# Module Invariants
npx tsx src/erp/staff.test.ts             # 5 tests (Staff permission hierarchy, role alteration)
npx tsx src/erp/academic.test.ts          # 2 tests (Academic structure & settings invariants)
npx tsx src/erp/student.test.ts           # 2 tests (Admissions, transfer invariants)
npx tsx src/erp/fee.test.ts               # 2 tests (Fee balance calculation, receipt integrity)
npx tsx src/erp/attendance.test.ts        # 2 tests (Roll call metrics, marking authority)
npx tsx src/erp/exam.test.ts              # 3 tests (Grade computation, timetable invariants)
node --test --test-force-exit --import tsx src/erp/communication.test.ts # 6 tests (WhatsApp links & templates)

# Backend Provisioning
npx tsx server/provisioning.test.ts       # 3 tests (Rate limiter, middleware, role hierarchy)
```

### Full Verification Commands
```bash
npm run lint      # TypeScript strict compilation (tsc --noEmit)
npm run build     # Production Vite bundle build
```

---

## 7. Local Development Setup

### Prerequisites
- Node.js (v20+ recommended)
- Firebase Project with Authentication & Cloud Firestore enabled

### Installation
```bash
# Clone the repository
git clone https://github.com/sumit07122/pradeep-classes.git
cd pradeep-classes

# Switch to the development branch
git checkout feat/erp-foundation

# Install dependencies
npm install
```

### Environment Configuration
Create a `.env` or `.env.local` file:
```env
# Firebase Client Configuration (Frontend)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Backend Server)
FIREBASE_PROJECT_ID=your_project_id
# Either set path to service account JSON:
FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
# Or provide inline JSON string:
# FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Optional Express Server Port
PORT=5000
```

### Running Locally
```bash
# Start frontend Vite development server (http://localhost:5173)
npm run dev

# Start Express provisioning backend server (http://localhost:5000)
npm run server
```

---

## 8. Git Branching & Release Information

- **Working Branch**: `feat/erp-foundation`
- **Base Commit**: `83676f9fe3dd12d522f7a1db2225114e73eedb54`
- **Release Tracking**: Detailed audit logs, decisions, and sequential commits are tracked in `ERP_EXECUTION_TRACKER.md`.
