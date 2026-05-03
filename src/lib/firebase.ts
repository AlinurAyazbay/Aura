/*
  FIREBASE SETUP — follow these steps:
  1. Go to console.firebase.google.com
  2. Create a new project (or use existing)
  3. Click "Add app" → Web → register app
  4. Copy the firebaseConfig values into .env.local:
     - NEXT_PUBLIC_FIREBASE_API_KEY          → apiKey
       (Found in: Project Settings → General → Your apps → SDK setup and configuration)
     - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN      → authDomain
       (Format: your-project-id.firebaseapp.com)
     - NEXT_PUBLIC_FIREBASE_PROJECT_ID       → projectId
       (Your project's unique identifier, visible in Project Settings)
     - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET   → storageBucket
       (Format: your-project-id.appspot.com)
     - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID → messagingSenderId
       (Numeric sender ID from Project Settings → Cloud Messaging)
     - NEXT_PUBLIC_FIREBASE_APP_ID           → appId
       (Format: 1:SENDER_ID:web:HASH, from Project Settings → Your apps)
     - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID   → measurementId
       (Optional. Format: G-XXXXXXXXXX, from Google Analytics integration)
  5. Go to Authentication → Sign-in method → Enable Email/Password
  6. Go to Firestore Database → Create database → Start in test mode
  7. Go to Firestore → Rules → paste the rules from README.md

  IMPORTANT: The app will show a configuration error until Firebase values are set.
*/

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export { app, db, auth };
