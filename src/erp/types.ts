export type ErpRole =
  | 'institute_owner'
  | 'institute_admin'
  | 'accountant'
  | 'teacher';

export type MembershipStatus = 'active' | 'suspended' | 'revoked';

export type UserProfileStatus = 'active' | 'disabled';

export type InstituteStatus = 'active' | 'suspended';

export type ErpPermission =
  | 'portal:access'
  | 'dashboard:owner:view'
  | 'dashboard:admin:view'
  | 'dashboard:accountant:view'
  | 'dashboard:teacher:view'
  | 'institute:settings:view'
  | 'institute:settings:manage'
  | 'staff:view'
  | 'staff:create'
  | 'staff:invite'
  | 'staff:designation:manage'
  | 'staff:role:manage'
  | 'staff:suspend'
  | 'staff:reactivate'
  | 'staff:revoke'
  | 'staff:manage'
  | 'students:view'
  | 'students:manage'
  | 'academics:view'
  | 'academics:manage'
  | 'finance:view'
  | 'finance:manage'
  | 'attendance:view'
  | 'attendance:mark'
  | 'reports:view'
  | 'reports:financial'
  | 'audit:view';

export interface ErpUserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  status: UserProfileStatus;
  defaultInstituteId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Institute {
  id: string;
  name: string;
  code: string;
  status: InstituteStatus;
  ownerUid: string;
  academicSession: string;
  timezone: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AcademicSession {
  id: string;
  instituteId: string;
  name: string; // e.g. "2026-2027"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'active' | 'archived';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Course {
  id: string;
  instituteId: string;
  name: string; // e.g. "Class 10 CBSE Foundation"
  code: string; // e.g. "C10-CBSE"
  description?: string;
  durationMonths?: number;
  status: 'active' | 'archived';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Batch {
  id: string;
  instituteId: string;
  courseId: string;
  courseName?: string;
  name: string; // e.g. "Morning Alpha Batch"
  code: string; // e.g. "B-MOR-01"
  academicSessionId: string;
  startDate: string;
  endDate?: string;
  maxCapacity: number;
  room?: string;
  teacherUid?: string;
  status: 'active' | 'completed' | 'archived';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Classroom {
  id: string;
  instituteId: string;
  roomNumber: string; // e.g. "Room 101"
  name: string; // e.g. "Aryabhata Hall"
  capacity: number;
  status: 'active' | 'inactive';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Subject {
  id: string;
  instituteId: string;
  courseId?: string;
  name: string; // e.g. "Advanced Mathematics"
  code: string; // e.g. "MATH-ADV"
  teacherUid?: string;
  teacherName?: string;
  status: 'active' | 'archived';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type StudentStatus = 'active' | 'suspended' | 'graduated' | 'dropped';

export interface FeeComponent {
  name: string;
  amount: number;
}

export interface FeeStructure {
  id: string;
  instituteId: string;
  courseId: string;
  courseName: string;
  academicSessionId: string;
  title: string;
  totalAmount: number;
  currency: string;
  installments: number;
  components: FeeComponent[];
  status: 'active' | 'archived';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'card';
export type PaymentStatus = 'completed' | 'refunded' | 'void';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceEntry {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  rollNumber?: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface AttendanceRecord {
  id: string;
  instituteId: string;
  batchId: string;
  batchName: string;
  courseId: string;
  date: string; // YYYY-MM-DD
  markedBy: string;
  markedByName: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  entries: AttendanceEntry[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface TimetableSlot {
  id: string;
  instituteId: string;
  batchId: string;
  batchName: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName: string;
  room?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Homework {
  id: string;
  instituteId: string;
  batchId: string;
  batchName: string;
  subjectName: string;
  title: string;
  description: string;
  dueDate: string;
  assignedBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Exam {
  id: string;
  instituteId: string;
  batchId: string;
  batchName: string;
  title: string;
  subjectName: string;
  examDate: string;
  totalMarks: number;
  passingMarks: number;
  status: 'scheduled' | 'completed' | 'graded';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ExamResult {
  id: string;
  instituteId: string;
  examId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  remarks?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FeePayment {
  id: string;
  instituteId: string;
  studentId: string;
  studentName: string;
  studentAdmissionNumber: string;
  batchName: string;
  receiptNumber: string;
  amountPaid: number;
  totalPayable: number;
  balanceRemaining: number;
  paymentMode: PaymentMode;
  transactionReference?: string;
  paymentDate: string;
  academicSessionId: string;
  collectedBy: string;
  notes?: string;
  status: PaymentStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Student {
  id: string;
  instituteId: string;
  admissionNumber: string;
  rollNumber?: string;
  fullName: string;
  gender: 'male' | 'female' | 'other';
  dob?: string;
  phone: string;
  email?: string;
  bloodGroup?: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  address?: string;
  courseId: string;
  courseName: string;
  batchId: string;
  batchName: string;
  academicSessionId: string;
  admissionDate: string;
  status: StudentStatus;
  photoURL?: string;
  emergencyContact?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface InstituteMembership {
  id: string;
  uid: string;
  instituteId: string;
  role: ErpRole;
  status: MembershipStatus;
  displayName: string;
  email?: string;
  designation?: string;
  department?: string;
  phone?: string;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RoleDefinition {
  role: ErpRole;
  label: string;
  shortLabel: string;
  description: string;
  defaultRoute: string;
  permissions: readonly ErpPermission[];
}

export type ErpNavIcon =
  | 'owner'
  | 'admin'
  | 'accounts'
  | 'teacher'
  | 'profile'
  | 'staff'
  | 'students'
  | 'fees'
  | 'attendance'
  | 'academics'
  | 'communication'
  | 'settings';

export interface ErpNavItem {
  id: string;
  label: string;
  path: string;
  icon: ErpNavIcon;
  section: 'Workspaces' | 'Administration' | 'Academics' | 'Account';
  requiredPermission: ErpPermission;
}
