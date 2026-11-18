# Security Specification — Pradeep Classes ERP Foundation

## 1. Data Invariants

1. **Identity Authority**: Every ERP user profile (`users/{uid}`) is keyed strictly by Firebase Authentication `uid`. Client code cannot impersonate another UID or forge `createdBy` fields.
2. **No Self-Assigned Roles**: Public or unprovisioned users cannot create `memberships` documents or write `role` / `status` / `instituteId` privileges to their own profile.
3. **Deterministic Membership Key**: Every `memberships/{membershipId}` document uses the deterministic ID `${instituteId}_${uid}` so a user holds at most one role per institute, preventing duplicate/conflicting privilege records.
4. **Master Gate & Referential Integrity**: Every membership references an existing `institutes/{instituteId}` document with `status == 'active'` on staff membership creation/updates (`isActiveInstitute(...)`). Revoking/suspending a membership (`status != 'active'`) or disabling the user profile (`users/{uid}.status != 'active'`) immediately removes institute access across all rules.
5. **Email Verification Mandate**: All privileged writes, ERP reads/writes, and Super Admin checks (`sumitdevthakur@gmail.com`, `pradeepclasses.in@gmail.com`) require `request.auth.token.email_verified == true`.
6. **PII Isolation & Cross-Institute Guard**: `users/{uid}` (containing personal email and phone) is readable only by the owning user (`request.auth.uid == uid`) or `isSuperAdmin()`. Self-updates to `defaultInstituteId` are restricted to institutes where the user holds an active membership.
7. **Zero Query Trust**: Every `allow list` rule evaluates `resource.data` directly (e.g., `resource.data.uid == request.auth.uid`) without calling `get()` or `exists()` inside `allow list`.
8. **Legacy CMS Preservation**: Existing public website collections (`notices`, `inquiries`, `admins`, `settings`, `faculties`, `toppers`, `gallery`, `reviews`, `siteImages`, `automated_content`) retain their exact security invariants.

## 2. "Dirty Dozen" Adversarial Payloads

| # | Target Collection | Attack Vector | Expected Result |
|---|---|---|---|
| 1 | `memberships` | Unauthenticated user attempts `create` with `role: 'institute_owner'` | `PERMISSION_DENIED` |
| 2 | `memberships` | Authenticated non-member attempts self-assignment `memberships/inst1_attackerUid` | `PERMISSION_DENIED` |
| 3 | `memberships` | Authenticated `teacher` attempts to update own membership `role` to `'institute_owner'` | `PERMISSION_DENIED` |
| 4 | `memberships` | `institute_admin` attempts to create a membership with `role: 'institute_owner'` | `PERMISSION_DENIED` |
| 5 | `memberships` | `institute_owner` attempts to create membership with non-deterministic ID `randomId` | `PERMISSION_DENIED` |
| 6 | `memberships` | `institute_owner` attempts to create membership for non-existent `instituteId: 'ghost_inst'` | `PERMISSION_DENIED` |
| 7 | `memberships` | Payload includes ghost field `isSuperAdmin: true` ("Shadow Update") | `PERMISSION_DENIED` |
| 8 | `memberships` | Spoofed `createdAt` backdated timestamp (not `request.time`) | `PERMISSION_DENIED` |
| 9 | `institutes` | Public or `accountant` user attempts `create` on `institutes/fake_inst` | `PERMISSION_DENIED` |
| 10 | `institutes` | `institute_owner` attempts to mutate immutable `ownerUid` on update | `PERMISSION_DENIED` |
| 11 | `users` | Authenticated user attempts `get` on another user's `users/otherUid` PII document | `PERMISSION_DENIED` |
| 12 | `users` | Super Admin email with `email_verified: false` attempts write | `PERMISSION_DENIED` |
