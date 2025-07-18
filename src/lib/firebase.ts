// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: "YOUR_API_KEY", // <--- PASTE YOUR API KEY HERE
  authDomain: "tutorflow-ivaba.firebaseapp.com",
  projectId: "tutorflow-ivaba",
  storageBucket: "tutorflow-ivaba.appspot.com",
  messagingSenderId: "155331393444",
  appId: "1:155331393444:web:603173740269389771191a"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
