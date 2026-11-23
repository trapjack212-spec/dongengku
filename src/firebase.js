/**
 * DongengKu — Firebase initialisation.
 *
 * PLACEHOLDER CONFIG: this repo ships WITHOUT a real Firebase project on
 * purpose. The user (Juragan) creates the project in the Firebase console
 * (see README.md "Firebase console steps") and pastes the web-app config
 * into `src/firebase-config.js` (copy from `src/firebase-config.example.js`)
 * or via Vite env vars (`.env` — see `.env.example`).
 *
 * Until a real config is present the app runs in DEMO MODE: the full UI
 * works, stories come from the built-in offline storyteller
 * (`src/demoStories.js`, clearly labelled in the UI), and favourites are
 * kept in localStorage. No Firebase call is attempted in demo mode.
 */

import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
} from "firebase/app-check";
import { getAI, GoogleAIBackend } from "firebase/ai";

import { firebaseConfig, isPlaceholderConfig } from "./firebase-config.js";

// reCAPTCHA Enterprise site key for App Check (Fraud Defense registration
// in the Firebase console). Public by design — fill in once the key exists.
const RECAPTCHA_ENTERPRISE_SITE_KEY = "6Lf97y0uAAAAAF9YUon9iACg3aWJZmkt5_fwJTE8";

export const FIREBASE_CONFIGURED = !isPlaceholderConfig(firebaseConfig);
export const USE_EMULATOR =
  import.meta.env.VITE_USE_EMULATOR === "true" && FIREBASE_CONFIGURED;

let app = null;
let auth = null;
let db = null;
let ai = null;
let appCheckReady = false;
let signInPromise = null;

if (FIREBASE_CONFIGURED) {
  app = initializeApp(firebaseConfig);

  // App Check (required by Firebase AI Logic — without a valid token the
  // AI calls are rejected with 401 "Firebase App Check token is invalid").
  // The console registration for dongengku-web is Fraud Defense
  // (reCAPTCHA Enterprise), so the Enterprise provider is used first.
  // Site keys are public by design (they ship in the page source of any
  // reCAPTCHA site), so the key is embedded as a fallback below, exactly
  // like the Firebase web apiKey in firebase-config.js. A value in `.env`
  // (VITE_RECAPTCHA_ENTERPRISE_SITE_KEY) still takes precedence.
  const isLocalhost =
    location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (isLocalhost) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  const enterpriseSiteKey =
    import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY ||
    RECAPTCHA_ENTERPRISE_SITE_KEY;
  const v3SiteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;
  const provider = enterpriseSiteKey
    ? new ReCaptchaEnterpriseProvider(enterpriseSiteKey)
    : v3SiteKey
      ? new ReCaptchaV3Provider(v3SiteKey)
      : null;
  if (provider) {
    try {
      initializeAppCheck(app, { provider });
      appCheckReady = true;
    } catch (err) {
      console.warn("[DongengKu] App Check init failed:", err);
    }
  } else {
    console.warn(
      "[DongengKu] No App Check site key set — App Check skipped. " +
        "AI Logic calls may be rejected once App Check is enforced. See README."
    );
  }

  auth = getAuth(app);
  db = getFirestore(app);

  if (USE_EMULATOR) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    console.info("[DongengKu] Using Firebase emulators (Auth :9099, Firestore :8080).");
  }

  // Firebase AI Logic service (Gemini Developer API backend).
  // All AI inference in this app goes through this instance — see src/ai.js.
  ai = getAI(app, { backend: new GoogleAIBackend() });
} else {
  console.info(
    "[DongengKu] No Firebase config yet — running in DEMO MODE " +
      "(offline template stories, local favourites). Follow README.md to connect Firebase."
  );
}

export { app, auth, db, ai, appCheckReady };

/** Sign in anonymously (lazy). Returns the uid, or null in demo mode. */
export async function ensureSignedIn() {
  if (!FIREBASE_CONFIGURED || !auth) return null;
  if (auth.currentUser) return auth.currentUser.uid;
  if (!signInPromise) {
    signInPromise = signInAnonymously(auth)
      .then((cred) => cred.user.uid)
      .catch((err) => {
        console.warn("[DongengKu] Anonymous sign-in failed:", err);
        signInPromise = null;
        return null;
      });
  }
  return signInPromise;
}

/** Save a story to Firestore under users/{uid}/stories. Returns doc id or null. */
export async function saveStoryToFirestore(story) {
  const uid = await ensureSignedIn();
  if (!uid || !db) return null;
  const ref = await addDoc(collection(db, "users", uid, "stories"), {
    ...story,
    uid,
    favourite: true,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** List saved stories from Firestore (newest first). */
export async function listStoriesFromFirestore() {
  const uid = await ensureSignedIn();
  if (!uid || !db) return [];
  const q = query(
    collection(db, "users", uid, "stories"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Delete a saved story from Firestore. */
export async function deleteStoryFromFirestore(id) {
  const uid = await ensureSignedIn();
  if (!uid || !db) return;
  await deleteDoc(doc(db, "users", uid, "stories", id));
}
