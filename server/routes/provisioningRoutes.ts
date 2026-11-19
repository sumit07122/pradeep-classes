import { Router } from 'express';
import type { Request, Response } from 'express';
import { isFirebaseAdminAvailable } from '../firebaseAdmin';
import { verifyStaffToken, requireStaffRole } from '../middleware/authMiddleware';
import { createRateLimiter } from '../middleware/rateLimiter';
import {
  bootstrapInstituteOwner,
  createStaffAccount,
  inviteStaffMember,
  updateStaffRole,
  setStaffStatus,
  revokeStaffMembership,
} from '../services/provisioningService';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  const isAvailable = isFirebaseAdminAvailable();
  res.json({
    status: 'ok',
    firebaseAdminAvailable: isAvailable,
    mode: isAvailable ? 'production_active' : 'service_account_unconfigured',
    message: isAvailable
      ? 'Firebase Admin SDK is initialized and ready for trusted operations.'
      : 'Firebase Admin credentials not set. Set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS.',
  });
});

// Rate limiter for provisioning endpoints
const provisionLimiter = createRateLimiter(60000, 15, 'provisioning');

// 1. Bootstrap Institute Owner
router.post('/bootstrap-owner', provisionLimiter, async (req: Request, res: Response) => {
  const {
    bootstrapSecret,
    instituteId,
    instituteName,
    instituteCode,
    ownerEmail,
    ownerDisplayName,
    academicSession,
  } = req.body;

  if (!instituteId || !instituteName || !instituteCode || !ownerEmail || !ownerDisplayName) {
    res.status(400).json({
      error: 'Missing required fields: instituteId, instituteName, instituteCode, ownerEmail, ownerDisplayName.',
    });
    return;
  }

  try {
    const result = await bootstrapInstituteOwner({
      bootstrapSecret: String(bootstrapSecret || ''),
      instituteId: String(instituteId).trim(),
      instituteName: String(instituteName).trim(),
      instituteCode: String(instituteCode).trim(),
      ownerEmail: String(ownerEmail).trim(),
      ownerDisplayName: String(ownerDisplayName).trim(),
      academicSession: academicSession ? String(academicSession).trim() : undefined,
    });
    res.status(201).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to bootstrap institute owner.';
    res.status(400).json({ error: message });
  }
});

// 2. Create Staff Account (Owner or Admin)
router.post(
  '/staff',
  provisionLimiter,
  verifyStaffToken,
  requireStaffRole(['institute_owner', 'institute_admin']),
  async (req: Request, res: Response) => {
    const session = req.staffSession!;
    const { email, displayName, role, designation, phone } = req.body;

    if (!email || !displayName || !role) {
      res.status(400).json({ error: 'Missing required fields: email, displayName, role.' });
      return;
    }

    try {
      const result = await createStaffAccount({
        callerUid: session.uid,
        callerRole: session.role,
        instituteId: session.instituteId,
        email: String(email).trim(),
        displayName: String(displayName).trim(),
        role,
        designation: designation ? String(designation).trim() : undefined,
        phone: phone ? String(phone).trim() : undefined,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.status(201).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create staff account.';
      res.status(400).json({ error: message });
    }
  }
);

// 3. Invite Staff Member (Re-generate onboarding link)
router.post(
  '/staff/:uid/invite',
  provisionLimiter,
  verifyStaffToken,
  requireStaffRole(['institute_owner', 'institute_admin']),
  async (req: Request, res: Response) => {
    const session = req.staffSession!;
    const targetUid = req.params.uid;

    if (!targetUid) {
      res.status(400).json({ error: 'Target staff UID is required.' });
      return;
    }

    try {
      const result = await inviteStaffMember({
        callerUid: session.uid,
        callerRole: session.role,
        instituteId: session.instituteId,
        targetUid,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate staff invitation.';
      res.status(400).json({ error: message });
    }
  }
);

// 4. Update Staff Role (Owner Only)
router.patch(
  '/staff/:uid/role',
  verifyStaffToken,
  requireStaffRole(['institute_owner']),
  async (req: Request, res: Response) => {
    const session = req.staffSession!;
    const targetUid = req.params.uid;
    const { newRole } = req.body;

    if (!targetUid || !newRole) {
      res.status(400).json({ error: 'Missing required fields: targetUid, newRole.' });
      return;
    }

    try {
      const result = await updateStaffRole({
        callerUid: session.uid,
        callerRole: session.role,
        instituteId: session.instituteId,
        targetUid,
        newRole,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update staff role.';
      res.status(400).json({ error: message });
    }
  }
);

// 5. Set Staff Status (Active / Suspended)
router.patch(
  '/staff/:uid/status',
  verifyStaffToken,
  requireStaffRole(['institute_owner', 'institute_admin']),
  async (req: Request, res: Response) => {
    const session = req.staffSession!;
    const targetUid = req.params.uid;
    const { status } = req.body;

    if (!targetUid || !status || (status !== 'active' && status !== 'suspended')) {
      res.status(400).json({ error: "Valid status ('active' | 'suspended') is required." });
      return;
    }

    try {
      const result = await setStaffStatus({
        callerUid: session.uid,
        callerRole: session.role,
        instituteId: session.instituteId,
        targetUid,
        status,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update staff status.';
      res.status(400).json({ error: message });
    }
  }
);

// 6. Revoke Staff Membership (Owner Only)
router.post(
  '/staff/:uid/revoke',
  verifyStaffToken,
  requireStaffRole(['institute_owner']),
  async (req: Request, res: Response) => {
    const session = req.staffSession!;
    const targetUid = req.params.uid;

    if (!targetUid) {
      res.status(400).json({ error: 'Target staff UID is required.' });
      return;
    }

    try {
      const result = await revokeStaffMembership({
        callerUid: session.uid,
        callerRole: session.role,
        instituteId: session.instituteId,
        targetUid,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to revoke staff membership.';
      res.status(400).json({ error: message });
    }
  }
);

export default router;
