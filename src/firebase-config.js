/**
 * DongengKu — Firebase config (PLACEHOLDER).
 *
 * This file intentionally contains NO real credentials. Paste your web
 * app's config here after creating a Firebase project (see README.md
 * "Firebase console steps"), or set the same values as Vite env vars in
 * a `.env` file (see `.env.example`).
 *
 * While the placeholder values below are present, the app runs in
 * DEMO MODE (offline template stories, local favourites) and makes no
 * Firebase calls.
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
