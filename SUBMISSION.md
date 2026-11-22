# DongengKu — Devpost submission draft (DO NOT submit yet)

Fill in the bracketed fields after the user creates the Firebase project,
pushes the public repo, and uploads the YouTube video.

## Submission fields

- **Project name:** DongengKu — Teman Dongeng Anak
- **Tagline:** Bilingual bedtime stories for kids, written by hybrid AI: Gemini Nano on-device first, Gemini cloud when needed.
- **Platform:** Web (Chrome)
- **Built with:** Firebase AI Logic (Gemini Nano 4 on-device + Gemini cloud), Firestore, Authentication (anonymous), App Check
- **License:** Apache-2.0
- **Public repo:** [PASTE GITHUB URL]
- **Demo video (YouTube):** [PASTE YOUTUBE URL]
- **Hosted URL:** [PASTE HOSTING URL — strongly encouraged]

## Description (paste into Devpost)

**What it is.** DongengKu is a bilingual (Indonesian/English) children's story
companion. A child or parent picks a theme, a character, a reading age
(4–6 / 7–9 / 10–12) and a story length, and DongengKu writes a brand-new story —
then reads it aloud, retells it briefly, and saves favourites for bedtime.

**How Firebase AI Logic is used.** All AI inference runs through the Firebase AI
Logic SDK (`firebase/ai`). Short retellings use one hybrid model created with
`InferenceMode.PREFER_ON_DEVICE`: the SDK tries on-device Gemini Nano first
(Chrome Prompt API) and falls back to cloud Gemini automatically. Full stories
use the same hybrid model first, with an explicit cloud retry
(`gemini-2.5-flash`) if the hybrid call fails. Every response reports its route
via `response.inferenceSource` (`ON_DEVICE` / `IN_CLOUD`), and the UI shows the
route + latency under each story — so the hybrid behaviour is visible, not
claimed. `initializeDeviceModel()` warms up Nano on the Generate tap (user
gesture, as Chrome requires). Anonymous Auth + Firestore store favourites
(per-user rules); App Check protects AI Logic (debug token for submissions).

**Why hybrid fits this app.** Retellings are short, private and repeated — perfect
for free, instant, offline on-device inference. Full stories are longer and more
creative — worth the cloud model. Splitting this way keeps costs near zero,
keeps working offline for the short tasks, and never leaves a child without a
story.

**Value.** In Indonesia, quality bilingual bedtime stories are scarce and
expensive. DongengKu gives any family with Chrome a free, age-adapted,
read-aloud storyteller that respects privacy (short tasks never leave the
device) and works even on a weak connection.

## What was built during the hackathon (Nov 11–30, 2026)

Everything in this repo is new, built for #BuildHybridAI 2026: the full web app
(UI in Indonesian/English, reading-level adaptation, read-aloud, retellings,
Firestore favourites), the hybrid routing module (`src/ai.js`), App Check +
anonymous Auth + Firestore rules, the headless Playwright verification suite,
and the demo video.

## Known limitation (stated honestly in the README)

The repo ships with a placeholder Firebase config, so out of the box it runs in
a clearly-labelled Demo Mode (offline template stories, local favourites).
Connecting a real Firebase project (15 minutes, steps in README) switches on
live Gemini Nano + cloud Gemini with no code change. On-device Nano inference
could not be executed in the build sandbox (no Chrome desktop 139+ with the
Prompt API there); the routing follows the official Firebase hybrid docs
exactly.
