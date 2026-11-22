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
  apiKey: env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
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
