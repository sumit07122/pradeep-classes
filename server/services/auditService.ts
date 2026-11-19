import { getAdminFirestore, isFirebaseAdminAvailable } from '../firebaseAdmin';

export interface AuditEventPayload {
  instituteId: string;
  action: string;
  actorUid: string;
  actorRole: string;
  targetUid?: string;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(payload: AuditEventPayload): Promise<string> {
  const timestamp = new Date().toISOString();

  const auditRecord = {
    instituteId: payload.instituteId,
    action: payload.action,
    actorUid: payload.actorUid,
    actorRole: payload.actorRole,
    targetUid: payload.targetUid || null,
    previousValue: payload.previousValue || null,
    newValue: payload.newValue || null,
    ipAddress: payload.ipAddress || 'unknown',
    userAgent: payload.userAgent || 'unknown',
    metadata: payload.metadata || {},
    timestamp,
    createdAt: timestamp,
  };

  if (!isFirebaseAdminAvailable()) {
    console.info('[AuditLog Fallback - SDK Unconfigured]', JSON.stringify(auditRecord));
    return `local_audit_${Date.now()}`;
  }

  try {
    const adminDb = getAdminFirestore();
    const docRef = await adminDb.collection('audit_logs').add(auditRecord);
    return docRef.id;
  } catch (err: unknown) {
    console.error('[AuditService] Failed to persist audit record to Firestore:', err);
    // Non-fatal fallback logging to ensure event is not completely lost
    console.info('[AuditLog Fallback - Write Failure]', JSON.stringify(auditRecord));
    return `fallback_audit_${Date.now()}`;
  }
}
