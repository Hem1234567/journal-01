import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCxRrhwANQz_0UEF1m3qxhTcKKlgPMtcek",
  authDomain: "journals-app-eaa7e.firebaseapp.com",
  projectId: "journals-app-eaa7e",
  storageBucket: "journals-app-eaa7e.firebasestorage.app",
  messagingSenderId: "975153403282",
  appId: "1:975153403282:web:bf3545b3f48467abd3dd4b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
