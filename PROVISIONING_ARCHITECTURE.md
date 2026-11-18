# Trusted Backend Provisioning & Identity Architecture — Pradeep Classes ERP

## 1. Current Infrastructure & Exact Blocker Analysis

- **Firebase Project**: `gen-lang-client-0277566445` (Firestore database: `ai-studio-e49bdfd8-185d-4071-a5dc-e984b04839e2`).
- **Environment Limitation (Starter Tier / Google-Hosted Project)**:
  - Google-hosted Starter Tier projects provisioned through AI Studio do **not** provide user-managed GCP Cloud Billing, IAM role grants (`roles/firebaseauth.admin`, `roles/datastore.user`), or Cloud Functions deployment permissions for the application runtime service account.
  - Calling `firebase-admin` server-side Firestore reads/writes (`db.doc(...)`) or Firebase Auth user-management APIs (`admin.auth().createUser`, `setCustomUserClaims`, `revokeRefreshTokens`, `generatePasswordResetLink`) from `server.ts` fails with `7 PERMISSION_DENIED` / HTTP 403.
  - **Security Decision**: `firebase-admin` and service-account JSON keys are deliberately **not** included in this repository or client/server bundles. Client-side code is never trusted to self-assign roles or call privileged provisioning APIs.
- **Firebase Console Auth Prerequisite (Email/Password)**:
  - The AI Studio Firebase provisioning flow enables Google Sign-In by default for `/admin/login`.
  - For `/portal/login`, the project owner must manually enable **Email/Password** in Firebase Console:
    `Authentication -> Sign-in method -> Email/Password -> Enable -> Save`.
  - Until enabled, `signInWithEmailAndPassword` returns `auth/operation-not-allowed`.

---

## 2. Supported Production Provisioning Architecture (Blaze / Cloud Functions v2)

Once the project owner upgrades to a user-owned Firebase/GCP project on the **Blaze** plan (or attaches a Cloud Functions / Cloud Run backend with a service account holding `roles/firebaseauth.admin` and `roles/datastore.user`), all staff lifecycle operations must run exclusively in trusted HTTPS Callable / Express endpoints authenticated with `admin.auth().verifyIdToken(idToken)` and verified against Firestore `institutes` / `memberships`.

### A. One-Time Owner Initialization (`bootstrapInstituteOwner`)
1. Run once as an idempotent CLI/Admin script or protected setup endpoint gated by an environment bootstrap secret and verified owner email allowlist (`sumitdevthakur@gmail.com`, `pradeepclasses.in@gmail.com`).
2. Verify/create the owner's Firebase Auth user (`email`, `emailVerified: true`, temporary password or password reset link).
3. In a single Firestore batch/transaction:
   - Create `institutes/{instituteId}` (e.g., `pradeep_classes_mathura`) with `ownerUid`, `status: 'active'`, `academicSession`.
   - Create `users/{ownerUid}` with `status: 'active'`, `defaultInstituteId`.
   - Create deterministic `memberships/{instituteId}_{ownerUid}` with `role: 'institute_owner'`, `status: 'active'`, `createdBy: ownerUid`.

### B. Creating Staff Accounts (`createStaffAccount`)
1. Caller submits Firebase ID token (`Authorization: Bearer <idToken>`).
2. Backend verifies token (`email_verified === true`), checks caller holds active `memberships/{instituteId}_{callerUid}` with `role === 'institute_owner'` (or future delegated `institute_admin` for `teacher`/`accountant` only), and verifies `institutes/{instituteId}.status === 'active'`.
3. Backend validates requested role (`'institute_admin' | 'accountant' | 'teacher'`; never `'institute_owner'` via self-service).
4. Backend calls `admin.auth().createUser({ email, displayName, emailVerified: false, disabled: false })` (or fetches existing Auth user by email if multi-institute staff).
5. Backend writes `users/{staffUid}` (`status: 'active'`) and `memberships/{instituteId}_{staffUid}` (`role`, `status: 'active'`, `createdBy: callerUid`) inside a Firestore transaction.
6. Backend generates onboarding verification + password-setup link (`generatePasswordResetLink` / `generateEmailVerificationLink`) and dispatches via transactional email (never returning raw passwords in logs).

### C. Assigning & Updating Roles (`updateStaffMembershipRole`)
1. Only an active `institute_owner` of `{instituteId}` may assign or change roles for non-owner staff (`institute_admin`, `accountant`, `teacher`) in that institute.
2. Owner-to-owner transfers require an explicit super-admin/owner transfer workflow so an institute cannot be orphaned or hijacked.
3. Backend updates `memberships/{instituteId}_{targetUid}.role` and logs an immutable audit entry.

### D. Suspending & Revoking Accounts (`setStaffAccessStatus`)
1. **Per-Institute Suspension/Revocation**: Update `memberships/{instituteId}_{targetUid}.status` to `'suspended'` or `'revoked'`. Firestore rules immediately deny all institute reads/writes on the next request.
2. **Global Account Disable**: Update `users/{targetUid}.status = 'disabled'` **and** call `admin.auth().updateUser(targetUid, { disabled: true })` followed by `admin.auth().revokeRefreshTokens(targetUid)` so existing JWT sessions cannot refresh.

### E. Password Setup & Reset
- **Self-Service Reset**: Staff members on `/portal/login` use Firebase Auth `sendPasswordResetEmail(auth, email)` ("Forgot password?"), which sends a signed one-time reset link to verified staff emails without exposing account existence.
- **Admin-Initiated Reset / Onboarding**: Trusted backend generates a reset link via `admin.auth().generatePasswordResetLink(email)` and forces re-authentication on compromised accounts via `revokeRefreshTokens(uid)`.

---

## 3. Client-Side Guarantees Already Enforced Today
- Zero public sign-up (`createUserWithEmailAndPassword` is absent from the codebase).
- Zero client-side role selection or self-provisioning of `users` / `memberships` documents.
- `AuthContext` requires `user.emailVerified === true` before querying ERP memberships or exposing `erpRole`.
- `firestore.rules` enforces `isVerifiedUser()`, `isActiveUserRecord()`, `isActiveInstituteMember(instituteId)`, deterministic `${instituteId}_${uid}` keys, immutable `uid`/`instituteId`/`createdBy`/`createdAt` fields, and `isSuperAdmin()` restricted solely to `sumitdevthakur@gmail.com` and `pradeepclasses.in@gmail.com`.
