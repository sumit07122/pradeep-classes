# Architecture Decision Records (ADR) — Pradeep Classes ERP

## ADR-001: Trusted Backend Provisioning via Firebase Admin with Compensating Transactions
- **Context**: In Firebase client-side SDKs, creating an Auth user logs the client in as that new user, which disrupts an administrative session. Furthermore, security rules cannot create Auth users or set claims.
- **Decision**: All staff provisioning (user creation, initial membership creation, password setup link generation) is executed exclusively on the trusted Express backend using `firebase-admin`. If Firestore document writing fails after Firebase Auth user creation, a compensating rollback operation (`admin.auth().deleteUser(uid)`) is triggered to avoid unlinked orphan Auth accounts.
- **Consequences**: Zero credential exposure on frontend, clean admin session retention, and guaranteed data consistency between Firebase Auth and Cloud Firestore.

---

## ADR-002: Dual-Gate Authentication and Strict Fail-Closed Verification
- **Context**: Relying solely on client-side state or Firestore token claims can lead to authorization bypasses if documents are missing, uninitialized, or deleted.
- **Decision**: Access to `/portal/*` requires a 5-step fail-closed verification:
  1. Firebase Auth authentication.
  2. Cryptographic email verification (`emailVerified === true`).
  3. Active user profile in `users/{uid}` (`status === 'active'`).
  4. Active institute membership in `memberships/{instituteId}_{uid}` (`status === 'active'`).
  5. Active institute document in `institutes/{instituteId}` (`status === 'active'`).
  If any document is absent or non-active, access is immediately denied.
- **Consequences**: No user can access ERP features without verified email and explicit active membership.

---

## ADR-003: Deterministic Membership IDs (`{instituteId}_{uid}`)
- **Context**: Natural auto-generated IDs require composite queries (`where('instituteId', '==', x).where('uid', '==', y)`) and risk duplicate memberships for the same user in an institute.
- **Decision**: All memberships use deterministic document IDs in the form `${instituteId}_${uid}`.
- **Consequences**:
  - Enforces a strict one-membership-per-institute invariant directly at the database key level.
  - Allows $O(1)$ direct document gets: `db.doc('memberships', `${instId}_${uid}`)`.
  - Simplifies Firestore rules: `membershipId == incoming().instituteId + '_' + incoming().uid`.

---

## ADR-004: Token Revocation on Suspension & Revocation
- **Context**: Firebase Auth JWT ID tokens are stateless and remain valid for up to 1 hour even if a user document is modified in Firestore.
- **Decision**: When a staff member is suspended or revoked, the backend explicitly issues:
  `await admin.auth().revokeRefreshTokens(targetUid);`
  Simultaneously, Firestore rules enforce live document lookups on `resource.data.status == 'active'` for data operations.
- **Consequences**: Immediate denial of Firestore operations, followed by immediate rejection upon next token refresh attempt.

---

## ADR-005: Strict Separation of Legacy CMS and Multi-Role ERP
- **Context**: The existing public website contains a functioning CMS on `/admin` utilizing Google Sign-In and super admin email allowlists.
- **Decision**: The legacy CMS is preserved 100% intact. The ERP portal operates independently under `/portal/*` with Email/Password authentication, multi-tenant institute routing, and granular RBAC.
- **Consequences**: Zero regression risk for the existing public website and marketing capabilities.
