/**
 * DongengKu — hybrid AI routing with Firebase AI Logic.
 *
 * HOW THE HYBRID ROUTING WORKS (the core of this hackathon entry):
 *
 * 1. SHORT tasks (retellings / summaries) use ONE hybrid model created with
 *    `InferenceMode.PREFER_ON_DEVICE`. The Firebase AI Logic SDK itself
 *    tries the on-device Gemini Nano model first (Chrome Prompt API) and
 *    falls back to the cloud-hosted Gemini model when Nano is unavailable.
 *    The response tells us which path served it via
 *    `result.response.inferenceSource` ("ON_DEVICE" | "IN_CLOUD"), and the
 *    UI shows that route to the user.
 *
 * 2. FULL story generation uses the same hybrid model first. If that call
 *    throws (both paths failed — e.g. no network AND no on-device model),
 *    we retry once with an explicit cloud-only model
 *    (`gemini-2.5-flash`, free-tier text model). The route + latency of
 *    every generation is shown in the UI and stored with the saved story.
 *
 * 3. `initializeDeviceModel()` is called on the user's Generate tap (a user
 *    gesture, as Chrome requires) before the first request, with a download
 *    progress callback wired to the UI. On Chrome desktop 139+ with the
 *    Prompt API flag enabled this downloads/caches Gemini Nano.
 *
 * ALL AI inference in this app goes through `firebase/ai`. No other model
 * API is called anywhere. When Firebase is not configured yet, the app does
 * NOT fake AI output: it uses the clearly-labelled offline template
 * storyteller in `src/demoStories.js` (see `generateStory()` below).
 */

import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
} from "firebase/ai";

import { ai as aiService, app, FIREBASE_CONFIGURED } from "./firebase.js";
import { generateDemoStory } from "./demoStories.js";

// ---------------------------------------------------------------------------
// Model instances (lazy — only created when Firebase is configured)
// ---------------------------------------------------------------------------

let hybridModel = null; // PREFER_ON_DEVICE — short tasks + first try for stories
let cloudModel = null; // explicit cloud fallback: gemini-2.5-flash

export const CLOUD_MODEL_ID = "gemini-2.5-flash";

/** The hybrid model: on-device Gemini Nano when available, cloud otherwise. */
export function getHybridModel() {
  if (!FIREBASE_CONFIGURED || !aiService) return null;
  if (!hybridModel) {
    // NOTE: no `model` name here on purpose — the SDK picks the cloud
    // fallback model for this hybrid model (default: gemini-3.5-flash-lite
    // on JS SDK v13+). The on-device side is Gemini Nano via Chrome.
    hybridModel = getGenerativeModel(aiService, {
      mode: InferenceMode.PREFER_ON_DEVICE,
    });
  }
  return hybridModel;
}

/** Explicit cloud-only model, used as the second-chance fallback. */
export function getCloudModel() {
  if (!FIREBASE_CONFIGURED || !aiService) return null;
  if (!cloudModel) {
    cloudModel = getGenerativeModel(aiService, { model: CLOUD_MODEL_ID });
  }
  return cloudModel;
}

/** Re-create the AI service (used only by tests / emulator runs). */
export function getAIServiceForTest(firebaseApp) {
  return getAI(firebaseApp, { backend: new GoogleAIBackend() });
}

// ---------------------------------------------------------------------------
// On-device availability probe (Chrome Prompt API, read-only check)
// ---------------------------------------------------------------------------

/**
 * Probe whether Gemini Nano is available in this browser.
 * Returns one of: "available" | "downloading" | "downloadable" |
 * "unavailable" | "unsupported" (no Prompt API in this browser).
 * Never throws.
 */
export async function probeOnDevice() {
  try {
    const LM = globalThis.LanguageModel;
    if (!LM || typeof LM.availability !== "function") return "unsupported";
    const status = await LM.availability();
    return typeof status === "string" ? status : "unavailable";
  } catch {
    return "unsupported";
  }
}

/**
 * Warm up / download the on-device model. MUST be called from a user
 * gesture (button tap) and before the first generateContent() call.
 * `onProgress` receives 0..1 download progress. Never throws — a failure
 * here just means the SDK will fall back to the cloud.
 */
export async function warmUpDeviceModel(onProgress) {
  const model = getHybridModel();
  if (!model || typeof model.initializeDeviceModel !== "function") return false;
  try {
    await model.initializeDeviceModel((progress) => {
      if (typeof onProgress === "function") onProgress(progress);
    });
    return true;
  } catch (err) {
    console.warn("[DongengKu] initializeDeviceModel failed (cloud fallback will be used):", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Prompt builders (single-turn text only — all on-device inference supports)
// ---------------------------------------------------------------------------

const AGE_GUIDANCE = {
  "4-6": {
    id: "Kalimat sangat pendek dan sederhana, banyak pengulangan, kata-kata yang mudah untuk anak usia 4-6 tahun.",
    en: "Very short, simple sentences, lots of repetition, easy words for a 4-6 year old.",
  },
  "7-9": {
    id: "Kalimat sedang, ada sedikit dialog, kosakata sedikit menantang untuk anak usia 7-9 tahun.",
    en: "Medium-length sentences, a little dialogue, slightly challenging vocabulary for a 7-9 year old.",
  },
  "10-12": {
    id: "Kalimat lebih panjang dan kaya, ada kejutan dalam cerita dan pesan moral yang dalam untuk anak usia 10-12 tahun.",
    en: "Longer, richer sentences, a plot twist and a thoughtful moral for a 10-12 year old.",
  },
};

const LENGTH_WORDS = { short: "80-140", medium: "180-260", long: "300-420" };

export function buildStoryPrompt({ theme, character, ageBand, length, lang }) {
  const guidance = AGE_GUIDANCE[ageBand] || AGE_GUIDANCE["7-9"];
  const words = LENGTH_WORDS[length] || LENGTH_WORDS.medium;
  if (lang === "id") {
    return (
      `Tuliskan dongeng anak berbahasa Indonesia tentang "${theme}" dengan tokoh utama "${character}". ` +
      `Panjang sekitar ${words} kata. ${guidance.id} ` +
      `Cerita harus hangat, aman untuk anak, dan diakhiri dengan satu kalimat pesan moral. ` +
      `Baris pertama harus berupa judul cerita dengan format "Judul: <judul>". ` +
      `Setelah judul, beri satu baris kosong, lalu isi cerita. Jangan tambahkan penjelasan lain.`
    );
  }
  return (
    `Write a children's story in English about "${theme}" starring "${character}". ` +
    `About ${words} words long. ${guidance.en} ` +
    `The story must be warm, safe for children, and end with one sentence stating the moral. ` +
    `The first line must be the story title in the format "Title: <title>". ` +
    `After the title, leave one blank line, then the story. Do not add any other explanation.`
  );
}

export function buildRetellPrompt(storyText, lang) {
  if (lang === "id") {
    return (
      `Ceritakan kembali dongeng berikut dengan singkat, dalam 2-3 kalimat sederhana ` +
      `yang mudah dipahami anak kecil. Jawab hanya dengan penceritaan ulangnya, tanpa penjelasan.\n\n${storyText}`
    );
  }
  return (
    `Retell the following story briefly, in 2-3 simple sentences a small child ` +
    `can understand. Reply with only the retelling, no explanation.\n\n${storyText}`
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a full story.
 * Route: hybrid model (on-device first, cloud fallback) -> explicit cloud
 * model retry if the hybrid call throws. In demo mode (no Firebase config)
 * returns a template story with route "demo".
 *
 * @returns {Promise<{title, body, moral, route, inferenceSource, latencyMs, modelNote}>}
 * route is one of: "on-device" | "cloud" | "cloud-fallback" | "demo"
 */
export async function generateStory(params, callbacks = {}) {
  const startedAt = performance.now();
  const { onProgress } = callbacks;

  if (!FIREBASE_CONFIGURED) {
    const demo = generateDemoStory(params);
    return {
      ...demo,
      route: "demo",
      inferenceSource: null,
      latencyMs: Math.round(performance.now() - startedAt),
      modelNote: "demo-template",
    };
  }

  const model = getHybridModel();
  const prompt = buildStoryPrompt(params);

  // User-gesture warm-up of the on-device model (best effort).
  await warmUpDeviceModel(onProgress);

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const inferenceSource = response.inferenceSource || null; // "ON_DEVICE" | "IN_CLOUD"
    return {
      ...parseStoryResponse(response.text(), params),
      route: inferenceSource === "ON_DEVICE" ? "on-device" : "cloud",
      inferenceSource,
      latencyMs: Math.round(performance.now() - startedAt),
      modelNote: "hybrid:prefer-on-device",
    };
  } catch (hybridErr) {
    console.warn("[DongengKu] Hybrid model failed, retrying with cloud model:", hybridErr);
    // Second chance: explicit cloud-only model.
    const fallback = getCloudModel();
    const result = await fallback.generateContent(prompt);
    const response = result.response;
    return {
      ...parseStoryResponse(response.text(), params),
      route: "cloud-fallback",
      inferenceSource: response.inferenceSource || "IN_CLOUD",
      latencyMs: Math.round(performance.now() - startedAt),
      modelNote: `cloud:${CLOUD_MODEL_ID}`,
    };
  }
}

/**
 * Short retelling / summary of a story.
 * Route: the hybrid PREFER_ON_DEVICE model — this is the Nano-friendly
 * task (short, single-turn text). The SDK falls back to cloud by itself;
 * `inferenceSource` tells us which path actually served it.
 * In demo mode returns a shortened extract, labelled route "demo".
 */
export async function retellStory(story, lang) {
  const startedAt = performance.now();
  if (!FIREBASE_CONFIGURED) {
    const sentences = story.body.split(/(?<=[.!?])\s+/).filter(Boolean);
    const short = sentences.slice(0, 2).join(" ");
    return {
      text: short,
      route: "demo",
      inferenceSource: null,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }
  const model = getHybridModel();
  const result = await model.generateContent(buildRetellPrompt(story.body, lang));
  const response = result.response;
  const inferenceSource = response.inferenceSource || null;
  return {
    text: response.text().trim(),
    route: inferenceSource === "ON_DEVICE" ? "on-device" : "cloud",
    inferenceSource,
    latencyMs: Math.round(performance.now() - startedAt),
  };
}

/** Split a raw model reply into { title, body, moral }. */
export function parseStoryResponse(text, params) {
  const clean = (text || "").trim();
  const lines = clean.split("\n").map((l) => l.trim());
  let title = `${params.character} dan ${params.theme}`;
  let rest = clean;
  const first = lines[0] || "";
  const m = first.match(/^(Judul|Title)\s*:\s*(.+)$/i);
  if (m) {
    title = m[2].trim();
    rest = lines.slice(1).join("\n").trim();
  }
  const bodyLines = rest.split("\n").filter(Boolean);
  let moral = "";
  let body = rest;
  if (bodyLines.length > 1) {
    const last = bodyLines[bodyLines.length - 1];
    if (/pesan moral|moral|pelajaran/i.test(last) || bodyLines.length >= 4) {
      moral = last.replace(/^(Pesan moral|Moral)\s*:\s*/i, "").trim();
      body = bodyLines.slice(0, -1).join("\n");
    }
  }
  return { title, body, moral };
}
