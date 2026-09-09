import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  remove,
  push,
  onValue,
  off,
  query as rtdbQuery,
  orderByChild,
  equalTo,
  Database,
  DataSnapshot
} from 'firebase/database';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Load configuration from firebase-applet-config.json with environment variable overrides
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};

export const firebaseConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson?.projectId || 'hss-all-in-one',
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigJson?.appId || '',
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigJson?.apiKey || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson?.authDomain || `${firebaseConfigJson?.projectId || 'hss-all-in-one'}.firebaseapp.com`,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || firebaseConfigJson?.databaseURL || `https://${firebaseConfigJson?.projectId || 'hss-all-in-one'}-default-rtdb.firebaseio.com`,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson?.storageBucket || `${firebaseConfigJson?.projectId || 'hss-all-in-one'}.firebasestorage.app`,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson?.messagingSenderId || '',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson?.measurementId || '',
  oAuthClientId: env.VITE_FIREBASE_OAUTH_CLIENT_ID || firebaseConfigJson?.oAuthClientId || '',
  recaptchaSiteKey: env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || firebaseConfigJson?.recaptchaSiteKey || ''
};

// Safe Firebase App Initialization
let appInstance: any = null;
try {
  if (!getApps().length) {
    appInstance = initializeApp(firebaseConfig);
  } else {
    appInstance = getApp();
  }
} catch (err) {
  console.warn('[Firebase] App initialization warning:', err);
  if (getApps().length) {
    appInstance = getApp();
  }
}

const app = appInstance;

// Safe Auth Initialization
let authInstance: any = null;
try {
  authInstance = getAuth(app);
} catch (err) {
  console.warn('[Firebase Auth] Initialization warning:', err);
}
export const auth = authInstance;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const loginWithGoogle = async () => {
  try {
    if (!auth) {
      throw new Error('Firebase Authentication is currently not initialized. Please verify your network connection.');
    }
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Safe RTDB Initialization
let dbInstance: any = null;
try {
  dbInstance = getDatabase(app);
} catch (err) {
  console.warn('[Firebase RTDB] Initialization warning:', err);
}
export const database: Database = dbInstance;
export const db = database;

// Firestore-compatible wrappers backed by Firebase Realtime Database
export function doc(_db: any, ...pathSegments: string[]) {
  const fullPath = pathSegments.filter(Boolean).join('/');
  return ref(database, fullPath);
}

export async function getDoc(dbRef: any) {
  const snapshot: DataSnapshot = await get(dbRef);
  return {
    exists: () => snapshot.exists(),
    data: () => snapshot.val()
  };
}

export async function setDoc(dbRef: any, data: any, options?: { merge?: boolean }) {
  if (options?.merge) {
    return await update(dbRef, data);
  } else {
    return await set(dbRef, data);
  }
}

export async function updateDoc(dbRef: any, data: any) {
  return await update(dbRef, data);
}

export async function deleteDoc(dbRef: any) {
  return await remove(dbRef);
}

// Compatibility stubs for legacy Firestore queries
export function collection() { return {}; }
export function query() { return {}; }
export function where() { return {}; }
export async function getDocs() { return { exists: () => false, forEach: () => {} }; }
export async function addDoc() { return { id: '' }; }

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface DatabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: DatabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Database Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export {
  app,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  ref,
  get,
  set,
  update,
  remove,
  push,
  onValue,
  off,
  orderByChild,
  equalTo
};
export default app;
export type { FirebaseUser };
