import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signInWithCredential, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Capacitor, registerPlugin } from '@capacitor/core';

// Correctly link to your custom Native bridge
const NativeGoogleAuth = registerPlugin<any>('NativeGoogleAuth');

const Auth: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-detect if we are on a native phone platform
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      if (isNative) {
        // --- MOBILE FLOW: Custom Native Bridge ---
        console.log("QARI: Starting custom native sign-in...");
        const result = await NativeGoogleAuth.signIn();

        if (result && result.idToken) {
          console.log("QARI: Native token received, authenticating...");
          const credential = GoogleAuthProvider.credential(result.idToken);
          await signInWithCredential(auth, credential);
        } else {
          throw new Error("No ID Token returned from Native layer");
        }
      } else {
        // --- WEB FLOW: Standard Google Popup ---
        console.log("QARI: Starting web browser sign-in...");
        const result = await signInWithPopup(auth, googleProvider);
        console.log("QARI: Web sign-in successful!");
      }
    } catch (error: any) {
      console.error("QARI: Login failed", error);
      if (error.code !== 'auth/popup-closed-by-user' && error.message !== 'user cancelled') {
        alert("Login failed: " + (error.message || "Unknown error"));
      }
    }
  };

  const handleLogout = async () => {
    try {
      if (isNative) {
        // Custom plugin might not have signOut, so we wrap in try/catch
        try { await NativeGoogleAuth.signOut(); } catch (e) {}
      }
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (loading) return <div className="px-3 text-xs text-slate-400 animate-pulse font-medium">Auth...</div>;

  return (
    <div className="flex items-center transition-all duration-300">
      {user ? (
        <div className="flex items-center gap-3 group">
          <div className="flex flex-col items-end leading-none">
            <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100 truncate max-w-[80px]">
              {user.displayName?.split(' ')[0]}
            </span>
            <button
              onClick={handleLogout}
              className="text-[9px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-tighter transition-colors"
            >
              Exit
            </button>
          </div>
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs border border-slate-200 dark:border-slate-700">
              👤
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleLogin}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-all rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
        >
          <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12.545,11.033H22.016c0.111,0.612,0.174,1.259,0.174,1.967c0,5.654-3.793,9.683-9.5,9.683C7.142,22.683,2,17.541,2,12s5.142-10.683,10.683-10.683c2.7,0,4.958,0.992,6.7,2.617l-2.733,2.733c-0.817-0.783-2.242-1.692-3.967-1.692c-3.392,0-6.167,2.808-6.167,6.267s2.775,6.267,6.167,6.267c3.942,0,5.417-2.833,5.642-4.292H12.545V11.033z"/>
          </svg>
          <span>Sign In</span>
        </button>
      )}
    </div>
  );
};

export default Auth;
