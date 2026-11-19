import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { DEMO_MEMBERSHIPS } from './demoData';
import type { ErpRole, InstituteMembership, MembershipStatus } from './types';

export interface StaffMemberRecord extends InstituteMembership {
  phone?: string;
  photoURL?: string;
  emailVerified?: boolean;
}

export interface CreateStaffPayload {
  email: string;
  displayName: string;
  role: ErpRole;
  designation?: string;
  department?: string;
  phone?: string;
}

async function getAuthHeader(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to perform staff operations.');
  }
  const token = await currentUser.getIdToken();
  return `Bearer ${token}`;
}

export async function fetchInstituteStaff(instituteId: string): Promise<StaffMemberRecord[]> {
  if (!instituteId) {
    return DEMO_MEMBERSHIPS;
  }

  const staffList: StaffMemberRecord[] = [];

  try {
    // Scoped query that complies strictly with Firestore Security Rules
    const q = query(collection(db, 'memberships'), where('instituteId', '==', instituteId));
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const uid = String(data.uid || '');

      let userEmail = typeof data.email === 'string' ? data.email : '';
      let phone = typeof data.phone === 'string' ? data.phone : undefined;
      let photoURL = typeof data.photoURL === 'string' ? data.photoURL : undefined;

      // Fetch corresponding user document for enriched details
      if (uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const uData = userDoc.data();
            if (!userEmail && typeof uData.email === 'string') {
              userEmail = uData.email;
            }
            if (!phone && typeof uData.phone === 'string') {
              phone = uData.phone;
            }
            if (!photoURL && typeof uData.photoURL === 'string') {
              photoURL = uData.photoURL;
            }
          }
        } catch {
          // Individual user read errors do not break entire listing
        }
      }

      staffList.push({
        id: docSnap.id,
        uid,
        instituteId: String(data.instituteId || instituteId),
        role: data.role as ErpRole,
        status: data.status as MembershipStatus,
        displayName: String(data.displayName || 'Staff Member'),
        email: userEmail,
        designation: typeof data.designation === 'string' ? data.designation : undefined,
        department: typeof data.department === 'string' ? data.department : undefined,
        phone,
        photoURL,
        createdBy: String(data.createdBy || ''),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    }
  } catch {}

  if (staffList.length === 0) {
    return DEMO_MEMBERSHIPS;
  }

  return staffList;
}

export async function createStaff(
  instituteId: string,
  payload: CreateStaffPayload
): Promise<{ success: boolean; uid: string; email: string; inviteLink?: string }> {
  const authHeader = await getAuthHeader();

  const res = await fetch('/api/erp/provisioning/staff', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
      'x-institute-id': instituteId,
    },
    body: JSON.stringify({
      ...payload,
      instituteId,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create staff account.');
  }

  return data;
}

export async function inviteStaff(
  instituteId: string,
  targetUid: string
): Promise<{ success: boolean; inviteLink?: string }> {
  const authHeader = await getAuthHeader();

  const res = await fetch(`/api/erp/provisioning/staff/${targetUid}/invite`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'x-institute-id': instituteId,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to send staff invitation.');
  }

  return data;
}

export async function updateStaffRole(
  instituteId: string,
  targetUid: string,
  newRole: ErpRole
): Promise<{ success: boolean; newRole: ErpRole }> {
  const authHeader = await getAuthHeader();

  const res = await fetch(`/api/erp/provisioning/staff/${targetUid}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
      'x-institute-id': instituteId,
    },
    body: JSON.stringify({ newRole }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update staff role.');
  }

  return data;
}

export async function setStaffStatus(
  instituteId: string,
  targetUid: string,
  status: 'active' | 'suspended'
): Promise<{ success: boolean; status: 'active' | 'suspended' }> {
  const authHeader = await getAuthHeader();

  const res = await fetch(`/api/erp/provisioning/staff/${targetUid}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
      'x-institute-id': instituteId,
    },
    body: JSON.stringify({ status }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update staff status.');
  }

  return data;
}

export async function revokeStaffMembership(
  instituteId: string,
  targetUid: string
): Promise<{ success: boolean }> {
  const authHeader = await getAuthHeader();

  const res = await fetch(`/api/erp/provisioning/staff/${targetUid}/revoke`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'x-institute-id': instituteId,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to revoke staff membership.');
  }

  return data;
}
