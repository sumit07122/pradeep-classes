import { getApps, initializeApp, cert, applicationDefault, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let isInitialized = false;
let initError: string | null = null;

export function initFirebaseAdmin(): {
  app: App | null;
  auth: Auth | null;
  firestore: Firestore | null;
  error: string | null;
} {
  const apps = getApps();
  if (isInitialized && apps.length > 0) {
    const currentApp = apps[0];
    return {
      app: currentApp,
      auth: getAuth(currentApp),
      firestore: getFirestore(currentApp),
      error: null,
    };
  }

  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0277566445';

    let app: App;
    if (serviceAccountKey) {
      const parsedKey = JSON.parse(serviceAccountKey);
      app = initializeApp({
        credential: cert(parsedKey),
        projectId: parsedKey.project_id || projectId,
      });
      isInitialized = true;
      initError = null;
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      app = initializeApp({
        credential: applicationDefault(),
        projectId,
      });
      isInitialized = true;
      initError = null;
    } else if (process.env.NODE_ENV === 'test') {
      isInitialized = true;
      initError = null;
      return {
        app: null,
        auth: null,
        firestore: null,
        error: null,
      };
    } else {
      initError =
        'Firebase Admin credentials not found. Set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS in environment variables for trusted backend operations.';
      return {
        app: null,
        auth: null,
        firestore: null,
        error: initError,
      };
    }

    return {
      app,
      auth: getAuth(app),
      firestore: getFirestore(app),
      error: null,
    };
  } catch (err: unknown) {
    initError = err instanceof Error ? err.message : String(err);
    console.error('[FirebaseAdmin] Failed to initialize Firebase Admin SDK:', initError);
    return {
      app: null,
      auth: null,
      firestore: null,
      error: initError,
    };
  }
}

export function isFirebaseAdminAvailable(): boolean {
  return isInitialized && getApps().length > 0;
}

export function getAdminAuth(): Auth {
  const { auth, error } = initFirebaseAdmin();
  if (!auth) {
    throw new Error(error || 'Firebase Admin Auth is not initialized');
  }
  return auth;
}

export function getAdminFirestore(): Firestore {
  const { firestore, error } = initFirebaseAdmin();
  if (!firestore) {
    throw new Error(error || 'Firebase Admin Firestore is not initialized');
  }
  return firestore;
}
