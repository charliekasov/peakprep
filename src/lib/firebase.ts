
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyCOmZZITPwGwIlyMcwHS-6vHNnt1qNEm_M", // <--- PASTE YOUR API KEY HERE
  authDomain: "tutorflow-ivaba.firebaseapp.com",
  projectId: "tutorflow-ivaba",
  storageBucket: "tutorflow-ivaba.appspot.com",
  messagingSenderId: "155331393444",
  appId: "1:155331393444:web:603173740269389771191a"
};

// Initialize Firebase for the client
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Initialize Firestore for the client
const db = getFirestore(app);

export { db, auth };
