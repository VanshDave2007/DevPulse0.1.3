import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

// Configuration loaded from firebase-applet-config.json
const firebaseConfig = {
  projectId: 'hallowed-resolver-qc9s2',
  appId: '1:302460196835:web:9c51be726d5fb1da6db2d6',
  apiKey: 'AIzaSyCz9uuOyOuX4Fpd3BOJVaIK0GsMBSVY4yo',
  authDomain: 'hallowed-resolver-qc9s2.firebaseapp.com',
  storageBucket: 'hallowed-resolver-qc9s2.firebasestorage.app',
  messagingSenderId: '302460196835',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

export interface DevPulseUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: number;
  updatedAt?: number;
  learningLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguage?: string;
  analysisCount?: number;
}

export interface SavedAnalysisRecord {
  id: string;
  fileName: string;
  language: string;
  codeSnippet: string;
  healthScore: number;
  maintainabilityScore: number;
  cyclomaticComplexity: number;
  loc: number;
  smellsCount: number;
  timestamp: number;
}

export interface SavedAiRecord {
  id: string;
  title: string;
  language: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: number }>;
  timestamp: number;
}

export interface SavedSnippetRecord {
  id: string;
  title: string;
  language: string;
  code: string;
  timestamp: number;
}

// User Auth API
export async function signUpUser(email: string, pass: string, name: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }

  // Create initial user profile doc in Firestore
  const userRef = doc(db, 'users', cred.user.uid);
  await setDoc(userRef, {
    uid: cred.user.uid,
    email: cred.user.email || email,
    displayName: name.trim() || email.split('@')[0],
    createdAt: Date.now(),
    analysisCount: 0,
    learningLevel: 'intermediate',
  }, { merge: true });

  return cred.user;
}

export async function signInUser(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function logOutUser(): Promise<void> {
  await signOut(auth);
}

// Profile API
export async function getUserProfile(uid: string): Promise<DevPulseUserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as DevPulseUserProfile;
    }
    return null;
  } catch (err) {
    console.warn('Error reading user profile:', err);
    return null;
  }
}

export async function updateUserProfileDoc(uid: string, data: Partial<DevPulseUserProfile>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { ...data, updatedAt: Date.now() }, { merge: true });
}

// Analysis History Persistence
export async function persistAnalysis(uid: string, record: Omit<SavedAnalysisRecord, 'id'>): Promise<string> {
  const recordId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const recordDoc = doc(db, 'users', uid, 'analysisHistory', recordId);
  const data: SavedAnalysisRecord = {
    id: recordId,
    ...record,
  };
  await setDoc(recordDoc, data);

  // Increment user analysis counter
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    const currentCount = snap.exists() ? (snap.data().analysisCount || 0) : 0;
    await setDoc(userRef, { analysisCount: currentCount + 1, updatedAt: Date.now() }, { merge: true });
  } catch {
    // Non-blocking
  }

  return recordId;
}

export async function fetchAnalysisHistory(uid: string, maxItems = 25): Promise<SavedAnalysisRecord[]> {
  try {
    const historyCol = collection(db, 'users', uid, 'analysisHistory');
    const q = query(historyCol, orderBy('timestamp', 'desc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SavedAnalysisRecord);
  } catch (err) {
    console.warn('Could not fetch Firestore analysis history:', err);
    return [];
  }
}

export async function deleteAnalysisRecordDoc(uid: string, recordId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'analysisHistory', recordId));
}

// AI Conversation History Persistence
export async function persistAiConversation(uid: string, record: Omit<SavedAiRecord, 'id'>): Promise<string> {
  const convId = `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const convDoc = doc(db, 'users', uid, 'aiHistory', convId);
  const data: SavedAiRecord = {
    id: convId,
    ...record,
  };
  await setDoc(convDoc, data);
  return convId;
}

export async function fetchAiConversations(uid: string, maxItems = 20): Promise<SavedAiRecord[]> {
  try {
    const aiCol = collection(db, 'users', uid, 'aiHistory');
    const q = query(aiCol, orderBy('timestamp', 'desc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SavedAiRecord);
  } catch (err) {
    console.warn('Could not fetch AI conversation history:', err);
    return [];
  }
}

export async function deleteAiConversationDoc(uid: string, convId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'aiHistory', convId));
}
