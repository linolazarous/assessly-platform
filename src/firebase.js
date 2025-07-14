import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { 
  getFunctions, 
  connectFunctionsEmulator
} from 'firebase/functions';
import { 
  getStorage, 
  connectStorageEmulator
} from 'firebase/storage';
import { 
  getPerformance,
  trace
} from 'firebase/performance';
import { 
  getAnalytics,
  isSupported as isAnalyticsSupported
} from 'firebase/analytics';
import { getRemoteConfig } from 'firebase/remote-config';

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
const functions = getFunctions(app, 'us-central1');
const storage = getStorage(app);
const performance = getPerformance(app);
const remoteConfig = getRemoteConfig(app);

// Analytics - initialize only if supported
let analytics;
isAnalyticsSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
    analytics.setAnalyticsCollectionEnabled(import.meta.env.PROD);
  }
});

// Configure persistence
const configurePersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    
    await enableIndexedDbPersistence(db, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      forceOwnership: true
    });
    
    if (import.meta.env.DEV) {
      console.log('Firebase offline persistence enabled');
    }
  } catch (err) {
    if (err.code === 'failed-precondition') {
      console.warn(
        'Offline persistence can only be enabled in one tab at a time.'
      );
    } else if (err.code === 'unimplemented') {
      console.warn(
        'The current browser does not support offline persistence.'
      );
    }
  }
};

configurePersistence();

// Remote Config settings
remoteConfig.settings = {
  minimumFetchIntervalMillis: 3600000, // 1 hour
  fetchTimeoutMillis: 60000 // 1 minute
};

// Set default values
remoteConfig.defaultConfig = {
  'feature_assessments_enabled': true,
  'maintenance_mode': false
};

// Connect to emulators in development
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { 
      disableWarnings: true 
    });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (err) {
    console.error('Emulator connection error:', err);
  }
}

// Performance monitoring helper
export const startTrace = (name) => {
  const t = trace(performance, name);
  t.start();
  return t;
};

export { 
  app,
  auth,
  db,
  functions,
  storage,
  performance,
  analytics,
  remoteConfig
};
