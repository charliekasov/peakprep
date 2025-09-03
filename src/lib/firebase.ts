// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCOmZZITPwGwIlyMcwHS-6vHNnt1qNEm_M",
  authDomain: "tutorflow-ivaba.firebaseapp.com",
  projectId: "tutorflow-ivaba",
  storageBucket: "tutorflow-ivaba.firebasestorage.app",
  messagingSenderId: "743946118520",
  appId: "1:743946118520:web:b73df158fb73ce3358d48d"
};

// Initialize Firebase for the client
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Initialize Firestore for the client
const db = getFirestore(app);

export { db, auth };
