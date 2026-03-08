import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBT4SnPWErSoCQrvlVIEkZRwQyEf0dgzDc",
  authDomain: "qariai-9012d.firebaseapp.com",
  projectId: "qariai-9012d",
  storageBucket: "qariai-9012d.firebasestorage.app",
  messagingSenderId: "284616519796",
  appId: "1:284616519796:web:19aa1f86da2ca62747e121",
  measurementId: "G-D55KK2YBKH"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
export const googleProvider = new GoogleAuthProvider();

let analyticsInstance = null;
try {
  if (typeof window !== 'undefined') {
    analyticsInstance = getAnalytics(app);
  }
} catch (e) { }

export const analytics = analyticsInstance;
