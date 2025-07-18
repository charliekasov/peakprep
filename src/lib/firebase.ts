// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Function to check if the provided Firebase config is valid
function isConfigValid(config: FirebaseOptions): boolean {
    return !!(config.apiKey && config.projectId && config.projectId !== 'your-project-id' && config.projectId !== 'put-your-project-id-here');
}

// Initialize Firebase only if the config is valid
let db;
const validConfig = isConfigValid(firebaseConfig);

if (validConfig) {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
} else {
  console.warn("Firebase configuration is missing or invalid. Using mock data instead. Please update your .env file with your project's credentials.");
}

export { db, validConfig };
