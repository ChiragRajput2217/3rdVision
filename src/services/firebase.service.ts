import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyMockKeyForMineSafeHackathon2026',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'minesafe-sih.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'minesafe-sih',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'minesafe-sih.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<{ firebaseUser: FirebaseUser; idToken: string }> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return { firebaseUser: result.user, idToken };
  } catch (error: any) {
    console.warn('Firebase Google Sign-In notice:', error?.message || error);
    throw error;
  }
};

export const signOutFirebase = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Firebase signOut error:', error);
  }
};
