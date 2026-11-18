/**
 * TASK 05A — Firestore Security Rules Emulator Test Suite
 * 
 * Verifies 16 critical authorization scenarios against firestore.rules
 * using @firebase/rules-unit-testing.
 * 
 * Blocker notice:
 * If the local Firestore emulator is not running or @firebase/rules-unit-testing
 * is blocked by dependency resolution (peer firebase@^13 vs firebase@^12),
 * this suite reports the exact environment blocker.
 */

import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const PROJECT_ID = 'pradeep-classes-rules-test';
const RULES_PATH = path.join(process.cwd(), 'firestore.rules');

let rulesTesting: typeof import('@firebase/rules-unit-testing') | null = null;

try {
  // Attempt dynamic import of @firebase/rules-unit-testing
  rulesTesting = await import('@firebase/rules-unit-testing');
} catch (err: unknown) {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.info(`[EMULATOR TEST SUITE] Notice: @firebase/rules-unit-testing is not loaded (${errMsg}).`);
}

test('Firestore Security Rules Emulator Suite — Environment Check & 16 Test Cases', async (t) => {
  if (!rulesTesting) {
    console.info('\n================================================================');
    console.info('FIRESTORE EMULATOR TEST SUITE — EXECUTION BLOCKED');
    console.info('================================================================');
    console.info('Blocker 1: @firebase/rules-unit-testing is not installed.');
    console.info('Root Cause: Upstream peer dependency conflict — @firebase/rules-unit-testing@6');
    console.info('requires peer firebase@^13.0.0, but this project runs firebase@^12.12.1.');
    console.info('Blocker 2: Firebase Tools CLI ("firebase") and local Firestore emulator');
    console.info('are not installed or started on this host environment.');
    console.info('Resolution for CI / Developer workstation:');
    console.info('  1. npm i -D @firebase/rules-unit-testing --legacy-peer-deps');
    console.info('  2. npm i -g firebase-tools');
    console.info('  3. firebase emulators:exec --only firestore "tsx src/erp/firestore.emulator.test.ts"');
    console.info('================================================================\n');

    t.todo('Firestore Emulator tests skipped due to missing emulator environment & peer dependency conflict');
    return;
  }

  const { initializeTestEnvironment, assertFails, assertSucceeds } = rulesTesting;
  const firestoreRules = fs.readFileSync(RULES_PATH, 'utf8');

  let testEnv: import('@firebase/rules-unit-testing').RulesTestEnvironment;
  try {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: firestoreRules,
        host: '127.0.0.1',
        port: 8080,
      },
    });
  } catch (err: unknown) {
    console.warn('[EMULATOR TEST SUITE] Firestore emulator not reachable on 127.0.0.1:8080:', err);
    t.todo('Firestore Emulator not active on port 8080');
    return;
  }

  // Seed baseline data
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const { doc, setDoc } = await import('firebase/firestore');

    // 1. Institute Alpha (Active)
    await setDoc(doc(db, 'institutes', 'inst_alpha'), {
      name: 'Pradeep Classes',
      code: 'PC01',
      status: 'active',
      ownerUid: 'uid_owner',
      academicSession: '2026-2027',
      timezone: 'Asia/Kolkata',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    // 2. Institute Beta (Active, Different Institute)
    await setDoc(doc(db, 'institutes', 'inst_beta'), {
      name: 'Other Coaching',
      code: 'OC01',
      status: 'active',
      ownerUid: 'uid_foreign_owner',
      academicSession: '2026-2027',
      timezone: 'Asia/Kolkata',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    // 3. User Profiles (all active)
    const users = ['uid_owner', 'uid_admin', 'uid_teacher', 'uid_acct', 'uid_foreign_owner', 'uid_outsider'];
    for (const u of users) {
      await setDoc(doc(db, 'users', u), {
        uid: u,
        email: `${u}@pradeep.test`,
        displayName: u,
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
    }

    // 4. Memberships for Institute Alpha
    await setDoc(doc(db, 'memberships', 'inst_alpha_uid_owner'), {
      id: 'inst_alpha_uid_owner',
      uid: 'uid_owner',
      instituteId: 'inst_alpha',
      role: 'institute_owner',
      status: 'active',
      displayName: 'Owner User',
      createdBy: 'uid_owner',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    await setDoc(doc(db, 'memberships', 'inst_alpha_uid_admin'), {
      id: 'inst_alpha_uid_admin',
      uid: 'uid_admin',
      instituteId: 'inst_alpha',
      role: 'institute_admin',
      status: 'active',
      displayName: 'Admin User',
      createdBy: 'uid_owner',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    await setDoc(doc(db, 'memberships', 'inst_alpha_uid_teacher'), {
      id: 'inst_alpha_uid_teacher',
      uid: 'uid_teacher',
      instituteId: 'inst_alpha',
      role: 'teacher',
      status: 'active',
      displayName: 'Teacher User',
      createdBy: 'uid_owner',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    await setDoc(doc(db, 'memberships', 'inst_alpha_uid_acct'), {
      id: 'inst_alpha_uid_acct',
      uid: 'uid_acct',
      instituteId: 'inst_alpha',
      role: 'accountant',
      status: 'active',
      displayName: 'Accountant User',
      createdBy: 'uid_owner',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    // 5. Membership for Institute Beta
    await setDoc(doc(db, 'memberships', 'inst_beta_uid_foreign_owner'), {
      id: 'inst_beta_uid_foreign_owner',
      uid: 'uid_foreign_owner',
      instituteId: 'inst_beta',
      role: 'institute_owner',
      status: 'active',
      displayName: 'Foreign Owner',
      createdBy: 'uid_foreign_owner',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  const { doc, getDoc, getDocs, query, where, setDoc, collection } = await import('firebase/firestore');

  // Helper contexts
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const ownerDb = testEnv.authenticatedContext('uid_owner', { email: 'uid_owner@pradeep.test', email_verified: true }).firestore();
  const adminDb = testEnv.authenticatedContext('uid_admin', { email: 'uid_admin@pradeep.test', email_verified: true }).firestore();
  const teacherDb = testEnv.authenticatedContext('uid_teacher', { email: 'uid_teacher@pradeep.test', email_verified: true }).firestore();
  const acctDb = testEnv.authenticatedContext('uid_acct', { email: 'uid_acct@pradeep.test', email_verified: true }).firestore();
  const foreignOwnerDb = testEnv.authenticatedContext('uid_foreign_owner', { email: 'uid_foreign_owner@pradeep.test', email_verified: true }).firestore();
  const outsiderDb = testEnv.authenticatedContext('uid_outsider', { email: 'uid_outsider@pradeep.test', email_verified: true }).firestore();

  // Test 1: Unauthenticated read on institute document: denied.
  await t.test('1. Unauthenticated read on institute document is denied', async () => {
    await assertFails(getDoc(doc(unauthDb, 'institutes', 'inst_alpha')));
  });

  // Test 2: Verified member reads their institute: allowed.
  await t.test('2. Verified member reads their institute is allowed', async () => {
    await assertSucceeds(getDoc(doc(teacherDb, 'institutes', 'inst_alpha')));
  });

  // Test 3: User reads an unrelated institute: denied.
  await t.test('3. User reads an unrelated institute is denied', async () => {
    await assertFails(getDoc(doc(outsiderDb, 'institutes', 'inst_alpha')));
  });

  // Test 4: User lists their own memberships: allowed.
  await t.test('4. User lists their own memberships is allowed', async () => {
    const qOwn = query(collection(teacherDb, 'memberships'), where('uid', '==', 'uid_teacher'));
    await assertSucceeds(getDocs(qOwn));
  });

  // Test 5: Owner lists memberships for their institute: allowed.
  await t.test('5. Owner lists memberships for their institute is allowed', async () => {
    const qInst = query(collection(ownerDb, 'memberships'), where('instituteId', '==', 'inst_alpha'));
    await assertSucceeds(getDocs(qInst));
  });

  // Test 6: Admin lists memberships for their institute: allowed.
  await t.test('6. Admin lists memberships for their institute is allowed', async () => {
    const qAdmin = query(collection(adminDb, 'memberships'), where('instituteId', '==', 'inst_alpha'));
    await assertSucceeds(getDocs(qAdmin));
  });

  // Test 7: Teacher lists memberships for their institute: denied.
  await t.test('7. Teacher lists memberships for their institute is denied', async () => {
    const qTeacher = query(collection(teacherDb, 'memberships'), where('instituteId', '==', 'inst_alpha'));
    await assertFails(getDocs(qTeacher));
  });

  // Test 8: Accountant lists memberships for their institute: denied.
  await t.test('8. Accountant lists memberships for their institute is denied', async () => {
    const qAcct = query(collection(acctDb, 'memberships'), where('instituteId', '==', 'inst_alpha'));
    await assertFails(getDocs(qAcct));
  });

  // Test 9: Owner lists memberships from another institute: denied.
  await t.test('9. Owner lists memberships from another institute is denied', async () => {
    const qForeign = query(collection(foreignOwnerDb, 'memberships'), where('instituteId', '==', 'inst_alpha'));
    await assertFails(getDocs(qForeign));
  });

  // Test 10: Unauthenticated membership list: denied.
  await t.test('10. Unauthenticated membership list is denied', async () => {
    const qUnauth = query(collection(unauthDb, 'memberships'), where('instituteId', '==', 'inst_alpha'));
    await assertFails(getDocs(qUnauth));
  });

  // Test 11: Owner creates a teacher membership in their institute: allowed.
  await t.test('11. Owner creates a teacher membership in their institute is allowed', async () => {
    await assertSucceeds(
      setDoc(doc(ownerDb, 'memberships', 'inst_alpha_uid_new_teacher'), {
        id: 'inst_alpha_uid_new_teacher',
        uid: 'uid_new_teacher',
        instituteId: 'inst_alpha',
        role: 'teacher',
        status: 'active',
        displayName: 'New Teacher',
        createdBy: 'uid_owner',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
  });

  // Test 12: Admin creates an owner membership: denied.
  await t.test('12. Admin creates an owner membership is denied', async () => {
    await assertFails(
      setDoc(doc(adminDb, 'memberships', 'inst_alpha_uid_escalated'), {
        id: 'inst_alpha_uid_escalated',
        uid: 'uid_escalated',
        instituteId: 'inst_alpha',
        role: 'institute_owner',
        status: 'active',
        displayName: 'Escalated Owner',
        createdBy: 'uid_admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
  });

  // Test 13: Teacher creates any membership: denied.
  await t.test('13. Teacher creates any membership is denied', async () => {
    await assertFails(
      setDoc(doc(teacherDb, 'memberships', 'inst_alpha_uid_subteacher'), {
        id: 'inst_alpha_uid_subteacher',
        uid: 'uid_subteacher',
        instituteId: 'inst_alpha',
        role: 'teacher',
        status: 'active',
        displayName: 'Sub Teacher',
        createdBy: 'uid_teacher',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
  });

  // Test 14: Accountant creates any membership: denied.
  await t.test('14. Accountant creates any membership is denied', async () => {
    await assertFails(
      setDoc(doc(acctDb, 'memberships', 'inst_alpha_uid_subacct'), {
        id: 'inst_alpha_uid_subacct',
        uid: 'uid_subacct',
        instituteId: 'inst_alpha',
        role: 'accountant',
        status: 'active',
        displayName: 'Sub Accountant',
        createdBy: 'uid_acct',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
  });

  // Test 15: User reads their own user profile: allowed.
  await t.test('15. User reads their own user profile is allowed', async () => {
    await assertSucceeds(getDoc(doc(teacherDb, 'users', 'uid_teacher')));
  });

  // Test 16: User reads another user\'s profile: denied.
  await t.test('16. User reads another user\'s profile is denied', async () => {
    await assertFails(getDoc(doc(teacherDb, 'users', 'uid_owner')));
  });

  await testEnv.cleanup();
});
