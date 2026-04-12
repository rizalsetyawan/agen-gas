import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDkbN-REj-9EO440zoWiLL5W0WROSfmPqI",
  authDomain: "agen-gas.firebaseapp.com",
  projectId: "agen-gas",
  storageBucket: "agen-gas.firebasestorage.app",
  messagingSenderId: "457757115894",
  appId: "1:457757115894:web:e8f27ed29406fcfdd733d7",
  measurementId: "G-BKLC7TNREZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, 'default'); // Menyesuaikan dengan ID database Anda yang tanpa kurung
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
