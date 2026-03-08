import { registerPlugin, Capacitor } from '@capacitor/core';

// Reference our local native plugin
const NativeGoogleAuth = registerPlugin<any>('NativeGoogleAuth');

// Fallback or Mock for Web/Dev (optional)
const GoogleAuthWeb = {
  signIn: async () => { throw new Error("Google Auth not implemented on Web"); },
  signOut: async () => { },
  initialize: () => { }
};

const GoogleAuth = Capacitor.getPlatform() === 'android' ? NativeGoogleAuth : GoogleAuthWeb;

export const initializeGoogleAuth = () => {
  if (Capacitor.getPlatform() === 'android') {
    // Initialization is handled natively in NativeGoogleAuthPlugin.java
    console.log("Native Google Auth initialized");
  }
};

export const signInWithGoogle = async () => {
  if (Capacitor.getPlatform() === 'android') {
    return await NativeGoogleAuth.signIn();
  }
  return await GoogleAuthWeb.signIn();
};

export const signOutGoogle = async () => {
  if (Capacitor.getPlatform() === 'android') {
    // If your native plugin has a signOut method, call it here.
    // Otherwise, you can just return.
    return;
  }
  await GoogleAuthWeb.signOut();
};
