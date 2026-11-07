import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firestore connected successfully.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently operating in offline mode.');
    }
  }
}

testConnection();

// Generic Firestore Sync Helper with LocalStorage fallback
export function subscribeCollection<T>(
  collectionName: string,
  onUpdate: (data: T[]) => void,
  filterField?: string,
  filterValue?: string
): Unsubscribe {
  const localKey = `hss_backup_${collectionName}_${filterValue || 'all'}`;
  
  // Try loading local cache immediately for instant UI render
  try {
    const cached = localStorage.getItem(localKey);
    if (cached) {
      onUpdate(JSON.parse(cached));
    }
  } catch (e) {
    console.error('Local cache read error', e);
  }

  const colRef = collection(db, collectionName);
  const q = filterField && filterValue ? query(colRef, where(filterField, '==', filterValue)) : colRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as T);
      });
      try {
        localStorage.setItem(localKey, JSON.stringify(items));
      } catch (e) {
        console.error('Local cache write error', e);
      }
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, collectionName);
    }
  );
}

export async function saveDocument(collectionName: string, docId: string, data: any) {
  const path = `${collectionName}/${docId}`;
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    
    // Also save in local backup
    const localKey = `hss_doc_${path}`;
    localStorage.setItem(localKey, JSON.stringify(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    // Save locally if offline
    const localKey = `hss_doc_${path}`;
    localStorage.setItem(localKey, JSON.stringify(data));
  }
}

export async function removeDocument(collectionName: string, docId: string) {
  const path = `${collectionName}/${docId}`;
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
