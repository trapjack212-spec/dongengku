/**
 * DongengKu — Firebase config.
 *
 * Real project dongengku-97df9 is embedded as the fallback below (wired
 * 2026-11-23). Firebase web API keys are public client identifiers, not
 * secrets — the key ships inside the app bundle to every visitor anyway;
 * security comes from Firestore rules + App Check, not from hiding it.
 * Values in a local `.env` (VITE_FIREBASE_*) still take precedence.
 *
 * With a real config present, the app runs in LIVE MODE (Firebase AI Logic
 * stories, Firestore favourites). Without one it falls back to DEMO MODE.
 */

const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyCkbIZN1OVxSbTaeZUuvsYiuiL6q1j_3HY",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "dongengku-97df9.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "dongengku-97df9",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "dongengku-97df9.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "734443590238",
  appId: env.VITE_FIREBASE_APP_ID || "1:734443590238:web:a0742aaaba449f8d61dacf",
};

/** True when the config still holds placeholder values (demo mode). */
export function isPlaceholderConfig(config) {
  if (!config) return true;
  return (
    !config.apiKey ||
    config.apiKey === "YOUR_API_KEY" ||
    !config.projectId ||
    config.projectId === "YOUR_PROJECT_ID" ||
    !config.appId ||
    config.appId === "YOUR_APP_ID"
  );
}
