/**
 * Firebase Configuration for Testing Suite
 * 
 * Simple Firebase setup for the clean data collection system.
 * Falls back gracefully to local storage if Firebase not configured.
 */

let firebaseApp = null;
let firebaseInitialized = false;

/**
 * Initialize Firebase if credentials are available
 */
export async function initializeFirebase() {
  try {
    // Check if Firebase config is available in environment
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    // Check if we have at least the basic config
    if (!firebaseConfig.projectId || !firebaseConfig.databaseURL) {
      console.log('🟡 Firebase config not found - testing suite will use local storage fallback');
      return null;
    }

    // Dynamic import Firebase
    const { initializeApp, getApps } = await import('firebase/app');
    
    // Initialize Firebase app if not already done
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
      firebaseInitialized = true;
      console.log('Firebase initialized for testing suite');
    } else {
      firebaseApp = getApps()[0];
      firebaseInitialized = true;
      console.log('Using existing Firebase app');
    }

    return firebaseApp;

  } catch (error) {
    console.log('🟡 Firebase initialization skipped:', error.message);
    firebaseInitialized = false;
    return null;
  }
}

/**
 * Get the Firebase app instance
 */
export function getFirebaseApp() {
  return firebaseApp;
}

/**
 * Check if Firebase is initialized
 */
export function isFirebaseInitialized() {
  return firebaseInitialized;
}

/**
 * Initialize Firebase on module load (if available)
 */
if (typeof window !== 'undefined') {
  // Delay initialization to avoid conflicts
  setTimeout(initializeFirebase, 500);
}