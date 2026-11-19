import { getAdminAuth, getAdminFirestore } from '../firebaseAdmin';
import { logAuditEvent } from './auditService';
import type { ErpRole } from '../middleware/authMiddleware';

export interface BootstrapOwnerInput {
  bootstrapSecret: string;
  instituteId: string;
  instituteName: string;
  instituteCode: string;
  ownerEmail: string;
  ownerDisplayName: string;
  academicSession?: string;
}

export interface CreateStaffInput {
  callerUid: string;
  callerRole: ErpRole;
  instituteId: string;
  email: string;
  displayName: string;
  role: ErpRole;
  designation?: string;
  phone?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UpdateStaffRoleInput {
  callerUid: string;
  callerRole: ErpRole;
  instituteId: string;
  targetUid: string;
  newRole: ErpRole;
  ipAddress?: string;
  userAgent?: string;
}

export interface SetStaffStatusInput {
  callerUid: string;
  callerRole: ErpRole;
  instituteId: string;
  targetUid: string;
  status: 'active' | 'suspended';
  ipAddress?: string;
  userAgent?: string;
}

export interface RevokeStaffInput {
  callerUid: string;
  callerRole: ErpRole;
  instituteId: string;
  targetUid: string;
  ipAddress?: string;
  userAgent?: string;
}

const SUPER_ADMIN_EMAILS = [
  'sumitdevthakur@gmail.com',
  'pradeepclasses.in@gmail.com',
];

const VALID_ROLES: readonly ErpRole[] = [
  'institute_owner',
  'institute_admin',
  'accountant',
  'teacher',
];

export async function bootstrapInstituteOwner(input: BootstrapOwnerInput) {
  const configuredSecret = process.env.BOOTSTRAP_SECRET;
  if (!configuredSecret || input.bootstrapSecret !== configuredSecret) {
    if (!SUPER_ADMIN_EMAILS.includes(input.ownerEmail.toLowerCase().trim())) {
      throw new Error('Invalid bootstrap credentials or unauthorized owner email.');
    }
  }

  const email = input.ownerEmail.trim().toLowerCase();
  const adminAuth = getAdminAuth();
  const adminDb = getAdminFirestore();

  // 1. Get or create owner Auth record
  let ownerRecord;
  try {
    ownerRecord = await adminAuth.getUserByEmail(email);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      ownerRecord = await adminAuth.createUser({
        email,
        displayName: input.ownerDisplayName.trim(),
        emailVerified: true,
      });
    } else {
      throw err;
    }
  }

  const ownerUid = ownerRecord.uid;
  const now = new Date().toISOString();
  const instRef = adminDb.collection('institutes').doc(input.instituteId);
  const userRef = adminDb.collection('users').doc(ownerUid);
  const membershipId = `${input.instituteId}_${ownerUid}`;
  const membershipRef = adminDb.collection('memberships').doc(membershipId);

  // 2. Atomic Firestore transaction
  await adminDb.runTransaction(async (transaction) => {
    const instDoc = await transaction.get(instRef);
    if (instDoc.exists) {
      throw new Error(`Institute '${input.instituteId}' already exists.`);
    }

    transaction.set(instRef, {
      name: input.instituteName.trim(),
      code: input.instituteCode.trim().toUpperCase(),
      status: 'active',
      ownerUid,
      academicSession: input.academicSession || '2026-2027',
      timezone: 'Asia/Kolkata',
      createdAt: now,
      updatedAt: now,
    });

    transaction.set(
      userRef,
      {
        uid: ownerUid,
        email,
        displayName: input.ownerDisplayName.trim(),
        status: 'active',
        defaultInstituteId: input.instituteId,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    transaction.set(membershipRef, {
      id: membershipId,
      uid: ownerUid,
      instituteId: input.instituteId,
      role: 'institute_owner',
      status: 'active',
      displayName: input.ownerDisplayName.trim(),
      designation: 'Director / Owner',
      createdBy: 'system_bootstrap',
      createdAt: now,
      updatedAt: now,
    });
  });

  await logAuditEvent({
    instituteId: input.instituteId,
    action: 'institute:bootstrapped',
    actorUid: ownerUid,
    actorRole: 'institute_owner',
    targetUid: ownerUid,
    newValue: { instituteId: input.instituteId, ownerEmail: email },
  });

  return {
    success: true,
    instituteId: input.instituteId,
    ownerUid,
    email,
  };
}

export async function createStaffAccount(input: CreateStaffInput) {
  const email = input.email.trim().toLowerCase();
  const role = input.role;

  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role '${role}'.`);
  }

  // Permission Hierarchy:
  // - Admin can ONLY create teacher or accountant. Admin CANNOT create Owner or Admin.
  if (input.callerRole === 'institute_admin') {
    if (role === 'institute_owner' || role === 'institute_admin') {
      throw new Error('Institute Admins cannot create Institute Owner or Admin accounts.');
    }
  } else if (input.callerRole !== 'institute_owner') {
    throw new Error('Caller does not hold staff creation authority.');
  }

  // Prevent creation of another Owner through standard staff creation
  if (role === 'institute_owner') {
    throw new Error('Institute Owner accounts cannot be created via standard staff provisioning.');
  }

  const adminAuth = getAdminAuth();
  const adminDb = getAdminFirestore();

  let staffUid: string;
  let isNewlyCreatedAuth = false;

  // 1. Get or create Firebase Auth user
  try {
    const existing = await adminAuth.getUserByEmail(email);
    staffUid = existing.uid;
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      const newUser = await adminAuth.createUser({
        email,
        displayName: input.displayName.trim(),
        emailVerified: false,
        disabled: false,
      });
      staffUid = newUser.uid;
      isNewlyCreatedAuth = true;
    } else {
      throw err;
    }
  }

  const now = new Date().toISOString();
  const userRef = adminDb.collection('users').doc(staffUid);
  const membershipId = `${input.instituteId}_${staffUid}`;
  const membershipRef = adminDb.collection('memberships').doc(membershipId);

  try {
    // 2. Transactional Firestore profile and membership creation
    await adminDb.runTransaction(async (transaction) => {
      const memDoc = await transaction.get(membershipRef);
      if (memDoc.exists) {
        throw new Error(`Staff member already holds a membership in this institute.`);
      }

      transaction.set(
        userRef,
        {
          uid: staffUid,
          email,
          displayName: input.displayName.trim(),
          phone: input.phone?.trim() || null,
          status: 'active',
          defaultInstituteId: input.instituteId,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

      transaction.set(membershipRef, {
        id: membershipId,
        uid: staffUid,
        instituteId: input.instituteId,
        role,
        status: 'active',
        displayName: input.displayName.trim(),
        designation: input.designation?.trim() || null,
        createdBy: input.callerUid,
        createdAt: now,
        updatedAt: now,
      });
    });
  } catch (firestoreError) {
    // 3. Compensating action: If this was a freshly created Auth user and Firestore failed, roll back the Auth user
    if (isNewlyCreatedAuth) {
      try {
        await adminAuth.deleteUser(staffUid);
      } catch (rollbackErr) {
        console.error('[CompensatingAction Failed] Could not delete Auth user after Firestore failure:', rollbackErr);
      }
    }
    throw firestoreError;
  }

  // 4. Generate onboarding link for staff
  let inviteLink: string | null = null;
  try {
    inviteLink = await adminAuth.generatePasswordResetLink(email);
  } catch (err) {
    console.warn('[StaffProvisioning] Password reset link generation skipped:', err);
  }

  // 5. Audit log
  await logAuditEvent({
    instituteId: input.instituteId,
    action: 'staff:created',
    actorUid: input.callerUid,
    actorRole: input.callerRole,
    targetUid: staffUid,
    newValue: { email, role, designation: input.designation },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return {
    success: true,
    uid: staffUid,
    email,
    role,
    membershipId,
    inviteLink,
  };
}

export async function inviteStaffMember(input: {
  callerUid: string;
  callerRole: ErpRole;
  instituteId: string;
  targetUid: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminFirestore();

  const membershipId = `${input.instituteId}_${input.targetUid}`;
  const membershipDoc = await adminDb.collection('memberships').doc(membershipId).get();

  if (!membershipDoc.exists) {
    throw new Error('Target membership does not exist.');
  }

  const memberData = membershipDoc.data()!;
  if (input.callerRole === 'institute_admin' && memberData.role === 'institute_owner') {
    throw new Error('Institute Admin cannot manage Owner invitations.');
  }

  const userRecord = await adminAuth.getUser(input.targetUid);
  if (!userRecord.email) {
    throw new Error('Staff user has no email address configured.');
  }

  const inviteLink = await adminAuth.generatePasswordResetLink(userRecord.email);

  await logAuditEvent({
    instituteId: input.instituteId,
    action: 'staff:invited',
    actorUid: input.callerUid,
    actorRole: input.callerRole,
    targetUid: input.targetUid,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return {
    success: true,
    uid: input.targetUid,
    email: userRecord.email,
    inviteLink,
  };
}

export async function updateStaffRole(input: UpdateStaffRoleInput) {
  // STRICT RULE: Only institute_owner can change roles
  if (input.callerRole !== 'institute_owner') {
    throw new Error('Only the Institute Owner is authorized to change staff roles.');
  }

  if (!VALID_ROLES.includes(input.newRole) || input.newRole === 'institute_owner') {
    throw new Error('Invalid target role or unauthorized owner promotion.');
  }

  const adminDb = getAdminFirestore();
  const membershipId = `${input.instituteId}_${input.targetUid}`;
  const memRef = adminDb.collection('memberships').doc(membershipId);

  const memDoc = await memRef.get();
  if (!memDoc.exists) {
    throw new Error('Staff membership record not found.');
  }

  const currentRole = memDoc.data()?.role;
  if (currentRole === 'institute_owner') {
    throw new Error('Cannot demote or alter primary Institute Owner role via standard role update.');
  }

  const now = new Date().toISOString();
  await memRef.update({
    role: input.newRole,
    updatedAt: now,
  });

  await logAuditEvent({
    instituteId: input.instituteId,
    action: 'staff:role:changed',
    actorUid: input.callerUid,
    actorRole: input.callerRole,
    targetUid: input.targetUid,
    previousValue: { role: currentRole },
    newValue: { role: input.newRole },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return {
    success: true,
    uid: input.targetUid,
    previousRole: currentRole,
    newRole: input.newRole,
  };
}

export async function setStaffStatus(input: SetStaffStatusInput) {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminFirestore();
  const membershipId = `${input.instituteId}_${input.targetUid}`;
  const memRef = adminDb.collection('memberships').doc(membershipId);

  const memDoc = await memRef.get();
  if (!memDoc.exists) {
    throw new Error('Staff membership record not found.');
  }

  const currentData = memDoc.data()!;
  if (input.callerRole === 'institute_admin') {
    if (currentData.role === 'institute_owner' || currentData.role === 'institute_admin') {
      throw new Error('Admins cannot alter access status for Owners or other Admins.');
    }
  } else if (input.callerRole !== 'institute_owner') {
    throw new Error('Caller does not hold staff status management authority.');
  }

  const now = new Date().toISOString();
  await memRef.update({
    status: input.status,
    updatedAt: now,
  });

  // If suspending: Revoke refresh tokens immediately to invalidate active JWT session
  if (input.status === 'suspended') {
    try {
      await adminAuth.revokeRefreshTokens(input.targetUid);
    } catch (err) {
      console.warn('[StaffStatus] Could not revoke refresh tokens on target user:', err);
    }
  }

  await logAuditEvent({
    instituteId: input.instituteId,
    action: input.status === 'suspended' ? 'staff:suspended' : 'staff:reactivated',
    actorUid: input.callerUid,
    actorRole: input.callerRole,
    targetUid: input.targetUid,
    previousValue: { status: currentData.status },
    newValue: { status: input.status },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return {
    success: true,
    uid: input.targetUid,
    status: input.status,
  };
}

export async function revokeStaffMembership(input: RevokeStaffInput) {
  // STRICT RULE: Only Institute Owner can revoke membership permanently
  if (input.callerRole !== 'institute_owner') {
    throw new Error('Only the Institute Owner is authorized to revoke staff memberships.');
  }

  const adminAuth = getAdminAuth();
  const adminDb = getAdminFirestore();
  const membershipId = `${input.instituteId}_${input.targetUid}`;
  const memRef = adminDb.collection('memberships').doc(membershipId);

  const memDoc = await memRef.get();
  if (!memDoc.exists) {
    throw new Error('Staff membership record not found.');
  }

  const currentData = memDoc.data()!;
  if (currentData.role === 'institute_owner') {
    throw new Error('Cannot revoke primary Institute Owner membership.');
  }

  const now = new Date().toISOString();
  await memRef.update({
    status: 'revoked',
    updatedAt: now,
  });

  // Terminate active sessions immediately
  try {
    await adminAuth.revokeRefreshTokens(input.targetUid);
  } catch (err) {
    console.warn('[StaffRevocation] Could not revoke refresh tokens:', err);
  }

  await logAuditEvent({
    instituteId: input.instituteId,
    action: 'staff:revoked',
    actorUid: input.callerUid,
    actorRole: input.callerRole,
    targetUid: input.targetUid,
    previousValue: { status: currentData.status },
    newValue: { status: 'revoked' },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return {
    success: true,
    uid: input.targetUid,
    status: 'revoked',
  };
}
