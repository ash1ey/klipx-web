import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import { getAnalytics, Analytics, isSupported, logEvent as firebaseLogEvent } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only once (singleton pattern)
function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

// Create singleton instances
const app: FirebaseApp = getFirebaseApp();
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
const functions: Functions = getFunctions(app, 'us-central1');

// Analytics - only initialize on client side
let analytics: Analytics | null = null;

// Initialize analytics (call this from a client component)
export async function initializeAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;

  if (analytics) return analytics;

  const supported = await isSupported();
  if (supported) {
    analytics = getAnalytics(app);
  }
  return analytics;
}

// Helper function to log events safely
export function logEvent(eventName: string, eventParams?: Record<string, unknown>) {
  if (analytics) {
    firebaseLogEvent(analytics, eventName, eventParams);
  }
}

// Get analytics instance (may be null if not initialized)
export function getAnalyticsInstance(): Analytics | null {
  return analytics;
}

export { app, auth, db, storage, functions, analytics };
