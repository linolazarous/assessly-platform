// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getPerformance } from 'firebase/performance';

// After app initialization
const perf = getPerformance(app);

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  projectId: "your-saas-app",
  // ... other config
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);