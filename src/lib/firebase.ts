// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCOmZZITPwGwIlyMcwHS-6vHNnt1qNEm_M",
  authDomain: "tutorflow-ivaba.firebaseapp.com",
  projectId: "tutorflow-ivaba",
  storageBucket: "tutorflow-ivaba.appspot.com",
  messagingSenderId: "743946118520",
  appId: "1:743946118520:web:b73df158fb73ce3358d48d"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };