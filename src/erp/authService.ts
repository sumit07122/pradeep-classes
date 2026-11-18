import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { isValidErpRole, selectActiveMembership } from './rbac';
import type {
  ErpUserProfile,
  Institute,
  InstituteMembership,
  MembershipStatus,
} from './types';

export interface ErpSessionSnapshot {
  userProfile: ErpUserProfile | null;
  memberships: InstituteMembership[];
  activeMembership: InstituteMembership | null;
  activeInstitute: Institute | null;
}

const VALID_MEMBERSHIP_STATUSES: readonly MembershipStatus[] = [
  'active',
  'suspended',
  'revoked',
];

function isValidMembershipStatus(value: unknown): value is MembershipStatus {
  return (
    typeof value === 'string' &&
    (VALID_MEMBERSHIP_STATUSES as readonly string[]).includes(value)
  );
}

export async function fetchInstituteById(instituteId: string): Promise<Institute | null> {
  const path = `institutes/${instituteId}`;
  try {
    const snap = await getDoc(doc(db, 'institutes', instituteId));
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      id: snap.id,
      name: String(data.name || ''),
      code: String(data.code || ''),
      status: data.status === 'suspended' ? 'suspended' : 'active',
      ownerUid: String(data.ownerUid || ''),
      academicSession: String(data.academicSession || ''),
      timezone: String(data.timezone || 'Asia/Kolkata'),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function fetchErpSessionData(
  uid: string,
  preferredInstituteId?: string | null
): Promise<ErpSessionSnapshot> {
  // 1. Load staff identity profile keyed by Firebase UID
  let userProfile: ErpUserProfile | null = null;
  const userPath = `users/${uid}`;
  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (userSnap.exists()) {
      const data = userSnap.data();
      userProfile = {
        uid: String(data.uid || uid),
        email: String(data.email || ''),
        displayName: String(data.displayName || ''),
        phone: typeof data.phone === 'string' ? data.phone : undefined,
        photoURL: typeof data.photoURL === 'string' ? data.photoURL : undefined,
        status: data.status === 'disabled' ? 'disabled' : 'active',
        defaultInstituteId:
          typeof data.defaultInstituteId === 'string' ? data.defaultInstituteId : undefined,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  // 2. Load verified institute memberships scoped strictly to this Firebase UID
  const memberships: InstituteMembership[] = [];
  const membershipsPath = 'memberships';
  try {
    const q = query(collection(db, 'memberships'), where('uid', '==', uid));
    const snapshot = await getDocs(q);
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!isValidErpRole(data.role) || !isValidMembershipStatus(data.status)) {
        return;
      }
      memberships.push({
        id: docSnap.id,
        uid: String(data.uid || uid),
        instituteId: String(data.instituteId || ''),
        role: data.role,
        status: data.status,
        displayName: String(data.displayName || ''),
        designation: typeof data.designation === 'string' ? data.designation : undefined,
        createdBy: String(data.createdBy || ''),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, membershipsPath);
  }

  // 3. Resolve active membership and load corresponding institute document
  const activeMembership = selectActiveMembership(
    memberships,
    preferredInstituteId ?? userProfile?.defaultInstituteId ?? null
  );

  let activeInstitute: Institute | null = null;
  if (activeMembership && activeMembership.instituteId) {
    activeInstitute = await fetchInstituteById(activeMembership.instituteId);
  }

  return {
    userProfile,
    memberships,
    activeMembership,
    activeInstitute,
  };
}
