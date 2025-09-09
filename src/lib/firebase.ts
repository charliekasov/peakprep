// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "your-credentials-here",
  authDomain: "your-auth-domain-here",
  projectId: "your-project-id-here",
  storageBucket: "tutorflow-ivaba.firebasestorage.app",
  messagingSenderId: "your-sender-id-here",
  appId: "your-app-id-here"
};

// Initialize Firebase for the client
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Initialize Firestore for the client
const db = getFirestore(app);

export { db, auth };
