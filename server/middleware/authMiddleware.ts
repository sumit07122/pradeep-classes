import type { Request, Response, NextFunction } from 'express';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminAvailable } from '../firebaseAdmin';

export type ErpRole = 'institute_owner' | 'institute_admin' | 'accountant' | 'teacher';

export interface StaffSession {
  uid: string;
  email: string;
  role: ErpRole;
  instituteId: string;
  status: 'active' | 'suspended' | 'revoked';
}

declare global {
  namespace Express {
    interface Request {
      staffSession?: StaffSession;
    }
  }
}

/**
 * Validates the caller's Firebase ID token and ensures they hold an active staff profile & membership.
 */
export async function verifyStaffToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header.' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  if (!idToken) {
    res.status(401).json({ error: 'Empty bearer authentication token.' });
    return;
  }

  if (!isFirebaseAdminAvailable()) {
    res.status(503).json({
      error:
        'Trusted backend provisioning is currently unconfigured. Set FIREBASE_SERVICE_ACCOUNT_KEY in environment variables.',
      code: 'ADMIN_SDK_UNCONFIGURED',
    });
    return;
  }

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminFirestore();

    // 1. Verify Firebase Auth ID token cryptographically
    const decodedToken = await adminAuth.verifyIdToken(idToken, true);

    // 2. Email verification requirement
    if (!decodedToken.email_verified) {
      res.status(403).json({
        error: 'Email verification required before accessing ERP provisioning endpoints.',
        code: 'EMAIL_UNVERIFIED',
      });
      return;
    }

    const uid = decodedToken.uid;
    const requestedInstituteId =
      (req.headers['x-institute-id'] as string) || req.body?.instituteId || req.query?.instituteId;

    if (!requestedInstituteId) {
      res.status(400).json({ error: 'Institute scope ID is required (header: x-institute-id or body: instituteId).' });
      return;
    }

    // 3. Verify user profile exists and is active
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.status !== 'active') {
      res.status(403).json({ error: 'Caller user profile is missing or disabled.', code: 'PROFILE_INACTIVE' });
      return;
    }

    // 4. Verify membership in the requested institute exists and is active
    const membershipId = `${requestedInstituteId}_${uid}`;
    const membershipDoc = await adminDb.collection('memberships').doc(membershipId).get();
    if (!membershipDoc.exists) {
      res.status(403).json({ error: 'Caller holds no membership in the specified institute.', code: 'MEMBERSHIP_NOT_FOUND' });
      return;
    }

    const membershipData = membershipDoc.data();
    if (membershipData?.status !== 'active') {
      res.status(403).json({
        error: `Caller membership status is '${membershipData?.status}'. Only active members may perform staff actions.`,
        code: 'MEMBERSHIP_INACTIVE',
      });
      return;
    }

    // 5. Populate staffSession on the request
    req.staffSession = {
      uid,
      email: decodedToken.email || userDoc.data()?.email || '',
      role: membershipData.role as ErpRole,
      instituteId: requestedInstituteId,
      status: membershipData.status,
    };

    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[AuthMiddleware] Token verification failed:', message);
    res.status(401).json({ error: 'Invalid or expired Firebase ID token.', code: 'TOKEN_INVALID' });
    return;
  }
}

/**
 * Enforces that the caller possesses one of the authorized roles.
 */
export function requireStaffRole(allowedRoles: ErpRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const session = req.staffSession;
    if (!session) {
      res.status(401).json({ error: 'Authentication session not found.' });
      return;
    }

    if (!allowedRoles.includes(session.role)) {
      res.status(403).json({
        error: `Insufficient permissions. Role '${session.role}' is not authorized to perform this operation.`,
        code: 'ROLE_UNAUTHORIZED',
      });
      return;
    }

    next();
  };
}
