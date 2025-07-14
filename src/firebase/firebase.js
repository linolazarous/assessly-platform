import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  connectAuthEmulator,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getPerformance } from "firebase/performance";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, "us-central1");
const storage = getStorage(app);

// Initialize performance monitoring and analytics in production
let analytics, performance;
if (import.meta.env.PROD) {
  performance = getPerformance(app);
  analytics = getAnalytics(app);
}

// Configure persistence
const configurePersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    
    await enableIndexedDbPersistence(db, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      forceOwnership: true
    });
    
    console.log('Firebase offline persistence enabled');
  } catch (err) {
    if (err.code === 'failed-precondition') {
      console.warn(
        'Offline persistence can only be enabled in one tab at a time. ' +
        'Other tabs must be closed or persistence must be disabled.'
      );
    } else if (err.code === 'unimplemented') {
      console.warn(
        'The current browser does not support all of the features required ' +
        'to enable offline persistence.'
      );
    } else {
      console.error('Firebase persistence error:', err);
    }
  }
};

configurePersistence();

// Connect to emulators in development
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { 
      disableWarnings: true 
    });
    connectFirestoreEmulator(db, "localhost", 8080);
    connectFunctionsEmulator(functions, "localhost", 5001);
    connectStorageEmulator(storage, "localhost", 9199);
    console.log('Connected to Firebase emulators');
  } catch (err) {
    console.error('Emulator connection error:', err);
  }
}

export { 
  auth, 
  db, 
  functions, 
  storage,
  analytics,
  performance
};
