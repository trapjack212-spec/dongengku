# 📚 DongengKu — Teman Dongeng Anak

> A bilingual (Indonesian / English) children's story companion.
> A **#BuildHybridAI 2026** hackathon entry — Devpost: <https://firebasehybridaihackathon.devpost.com/>
> Deadline: **Mon Nov 30, 2026, 2:00 PM PT** (Tue Dec 1, 2026, 05:00 WIB).

A child (or parent) picks a **theme**, a **character**, a **reading age** (4–6 / 7–9 / 10–12)
and a **story length**. DongengKu writes a brand-new story, can **read it aloud**,
can **retell it briefly**, and can **save favourites**.

## Why hybrid? (the hackathon idea)

| Task | Where it runs | Why |
|---|---|---|
| Short retellings / summaries | **On-device first** — Gemini Nano in Chrome, via Firebase AI Logic (`PREFER_ON_DEVICE`) | Private, instant, free, works offline |
| Full story generation | **Hybrid** — same model, cloud fallback automatic; explicit cloud retry (`gemini-2.5-flash`) if both fail | Long, creative text deserves the bigger model; nobody is ever stranded |
| Every response | UI shows the **route** (`ON_DEVICE` / `IN_CLOUD`) + latency, from `response.inferenceSource` | Judges and parents can *see* the hybrid working |

**All AI inference goes through Firebase AI Logic (`firebase/ai`). No other model API is called anywhere.**
Text-only inference, free tier. No image generation, no quota request.

## Features

- 🎨 6 themes (Magic Forest, Outer Space, Blue Ocean, Night Market, Rainbow Mountain, Future City) × 6 characters
- 👶 Reading-level adaptation: ages 4–6 / 7–9 / 10–12 (sentence length, vocabulary, plot complexity)
- 🌏 Bilingual: full UI in Indonesian or English + story language choice (ID/EN)
- 🔊 Read-aloud via Web Speech API (`id-ID` / `en-US` voices), sentence-chunked
- 🔁 One-tap short retelling (the on-device-friendly task)
- ❤️ Save favourites to **Firestore** (anonymous Auth, per-user rules) — localStorage fallback in demo mode
- 🛡️ **AppCheck** (debug provider for local dev; reCAPTCHA v3 for production)
- 📱 Works offline in **Demo Mode** (see below) — the whole UI is usable with zero setup

## Quick start (no Firebase needed)

```bash
npm install
npm run dev        # http://localhost:5173 — demo mode, offline template stories
npm run build      # production build into dist/
npm run preview    # serve the build at http://127.0.0.1:4173
npm run verify     # headless Playwright checks (19 checks) + screenshots
```

> **Demo Mode:** this repo ships with a *placeholder* Firebase config on purpose.
> Until you connect a real project, stories come from the built-in offline template
> storyteller (`src/demoStories.js`) and favourites live in `localStorage`.
> The UI says so loudly ("MODE DEMO — template offline") and the route badge says
> "Demo — template offline". Demo stories are never presented as AI output.

## Firebase console steps (for the user — ~15 minutes)

Do these once, in the [Firebase console](https://console.firebase.google.com/):

1. **Create a project** — "Add project", name it e.g. `dongengku`, **skip Google Analytics** (not needed).
2. **AI Logic** — left menu **AI Services › AI Logic** (or "Build › AI Logic") › **Get started**.
   Choose **Gemini Developer API** as the provider (free tier, no billing).
   This enables the required APIs. App Check gets enforced for AI Logic automatically.
3. **Register the web app** — Project settings (⚙️) › **Your apps** › Web `</>` › nickname `dongengku-web`.
   Copy the `firebaseConfig` object it shows.
4. **Paste the config** — either:
   - edit `src/firebase-config.js` (replace the `YOUR_*` placeholders), **or**
   - copy `.env.example` to `.env` and fill in the `VITE_FIREBASE_*` values.
5. **Authentication** — Build › Authentication › Get started › Sign-in method › enable **Anonymous**.
6. **Firestore** — Build › Firestore Database › Create database › **Production mode** › region
   `asia-southeast2` (Singapore, closest to Indonesia) › Create.
   Then Rules tab: paste the contents of `firestore.rules` in this repo and Publish.
7. **App Check** — Security › App Check › Apps › select the web app › register **reCAPTCHA v3**:
   create a key at <https://www.google.com/recaptcha/admin> (type v3, add `localhost` + your
   hosting domain), paste the **site key** into `.env` as `VITE_RECAPTCHA_V3_SITE_KEY`.
   - *Local dev / submission:* the app sets `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` on
     localhost, so the browser console prints a debug token like
     `AppCheck debug token: "123a4567-..."`. Register it at App Check › Apps › (⋮) ›
     **Manage debug tokens**. Debug tokens are accepted for hackathon submissions.
8. **On-device model (for the demo video / judging on Chrome desktop 139+):**
   - Open `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` → **Enabled** → relaunch.
   - DevTools console: `await LanguageModel.availability()` → should print `available`
     (or `downloading`/`downloadable`; run `await LanguageModel.create()` once to start the download).
9. **Run it:** `npm run dev`, open the app, press **✨ Buatkan Dongeng!**. The route badge
   under the story shows `On-device (Gemini Nano)` or `Cloud (Gemini)` with latency.

### Local emulators (optional)

```bash
npm run emulators   # Auth :9099, Firestore :8080, UI :4000 — needs a Java runtime (JRE)
VITE_USE_EMULATOR=true npm run dev
```

> Note: the Firebase emulator suite needs Java; the sandbox this was built in has no
> JRE, so the emulator path is configured but could not be run here. It is a one-command
> check on any machine with Java installed.

## How the hybrid routing is implemented

`src/ai.js` — the whole routing, in one place:

```js
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";

const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

// Short tasks + first try for stories: on-device first, cloud fallback (SDK handles it)
const hybridModel = getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE });

// Explicit second chance if the hybrid call throws: cloud-only model
const cloudModel = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

const result = await hybridModel.generateContent(prompt);
result.response.inferenceSource; // "ON_DEVICE" | "IN_CLOUD" — shown in the UI
```

- `model.initializeDeviceModel(progress => …)` is called on the Generate tap (user gesture,
  as Chrome requires) to warm up / download Gemini Nano, with progress in the UI.
- Prompts are **single-turn text only** — the only shape on-device inference supports.
- Route + latency are stored with every saved story in Firestore.

## Project structure

```
dongengku/
├── index.html                  # app shell
├── src/
│   ├── main.js                 # UI wiring, read-aloud, favourites
│   ├── ai.js                   # ★ hybrid routing (Firebase AI Logic)
│   ├── firebase.js             # init: App / Auth / Firestore / AppCheck / AI
│   ├── firebase-config.js      # ★ PLACEHOLDER config — paste your real config here
│   ├── demoStories.js          # offline template storyteller (demo mode only)
│   ├── i18n.js                 # Indonesian / English UI strings
│   └── styles.css
├── scripts/verify.mjs          # headless Playwright verification + screenshots
├── demo/
│   ├── DEMO_SCRIPT.md          # demo-video script + storyboard
│   ├── dongengku-demo.mp4      # demo video (built from screenshots + TTS)
│   └── screenshots/            # Playwright captures used in the video
├── firebase.json / firestore.rules / firestore.indexes.json
├── .env.example
├── LICENSE                     # Apache-2.0
└── SUBMISSION.md               # Devpost submission text (draft)
```

## Verification (what was actually checked)

Run in this sandbox on Sun 2026-11-22 (headless Chromium via Playwright):

```
npm run build && npm run verify     →  19/19 checks passed
```

- Production build succeeds (`vite build`, Firebase SDK v13.4.0 bundled — the bundle
  contains `firebase/ai` and the `prefer_on_device` mode string).
- All UI flows work: pickers, story generation, retelling, save-to-favourites,
  favourites survive reload, EN/ID toggle, read-aloud control — zero console errors,
  zero failed requests.
- `InferenceMode` + `initializeDeviceModel` verified present on the hybrid model
  object in the installed SDK (Node check; see `docs/` note in the repo history).

### What could NOT be verified live (honest list)

- **On-device Gemini Nano inference** — the sandbox has no Chrome desktop 139+ with the
  Prompt API / downloadable Nano model, and no Firebase project exists yet. The routing
  code follows the official Firebase docs exactly (`PREFER_ON_DEVICE`,
  `initializeDeviceModel`, `inferenceSource`), but the Nano path has not executed.
- **Cloud Gemini inference** — needs a real Firebase project + AI Logic enabled
  (user step above). The cloud fallback model name (`gemini-2.5-flash`) is the standard
  free-tier text model.
- **Firestore / anonymous Auth against a real project or the emulator suite** —
  no project exists yet, and the emulator needs a Java runtime that this sandbox lacks.
  The Firestore code paths are written against the documented SDK and the rules file
  is included; they run end-to-end once the console steps are done.
- **Read-aloud audio** — the control works headless, but no audio can be heard in a
  headless browser; verify by ear in a real Chrome.

## Submission checklist (for the user)

- [ ] Firebase console steps above → app shows "Firebase connected — AI is live"
- [ ] Record/confirm the demo video shows a real AI story (optional re-record with a real project)
- [ ] `git push` to a **public** GitHub repo (Apache-2.0 visible in About)
- [ ] Upload `demo/dongengku-demo.mp4` to **YouTube** (public, ≤ 3 min)
- [ ] Submit on **Devpost** (see `SUBMISSION.md` for the draft text) before
      **Mon Nov 30, 2026 2:00 PM PT / Tue Dec 1, 2026 05:00 WIB**
- [ ] (Optional) Deploy hosting: `firebase deploy --only hosting` or any static host, and
      paste the URL into Devpost ("hosted project URL strongly encouraged")

## License

Apache License 2.0 — see [LICENSE](LICENSE). Copyright 2026 trapjack212.
