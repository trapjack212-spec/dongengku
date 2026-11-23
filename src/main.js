/**
 * DongengKu — UI wiring.
 *
 * Single-page app, no framework. All AI calls go through src/ai.js
 * (Firebase AI Logic). Favourites go to Firestore when Firebase is
 * configured, otherwise to localStorage (demo mode).
 */

import { THEMES, CHARACTERS, AGE_BANDS, LENGTHS, themeName, characterName } from "./demoStories.js";
import { getStrings } from "./i18n.js";
import {
  generateStory,
  retellStory,
  probeOnDevice,
} from "./ai.js";
import {
  FIREBASE_CONFIGURED,
  saveStoryToFirestore,
  listStoriesFromFirestore,
  deleteStoryFromFirestore,
} from "./firebase.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const LOCAL_FAV_KEY = "dongengku-favourites-v1";

const state = {
  uiLang: "id",
  theme: "forest",
  character: "kiki",
  ageBand: "7-9",
  length: "medium",
  storyLang: "id",
  currentStory: null, // { title, body, moral, route, inferenceSource, latencyMs, ...params }
  favourites: [],
  speaking: false,
};

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

function t() {
  return getStrings(state.uiLang);
}

function applyI18n() {
  const s = t();
  document.documentElement.lang = state.uiLang === "id" ? "id" : "en";
  $$("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (typeof s[key] === "string") el.textContent = s[key];
  });
  $("#langToggle").textContent = s.langToggle;
  renderPickers();
  renderLibrary();
  if (state.currentStory) renderStory(state.currentStory);
  else $("#storyBody").textContent = s.emptyStory;
}

// ---------------------------------------------------------------------------
// Pickers
// ---------------------------------------------------------------------------

function chipButton({ label, icon, selected, onClick, title }) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip" + (selected ? " selected" : "");
  b.title = title || label;
  b.innerHTML = `<span class="chip-icon">${icon}</span><span>${label}</span>`;
  b.addEventListener("click", onClick);
  return b;
}

function renderPickers() {
  const s = t();
  const themeBox = $("#themePicker");
  themeBox.innerHTML = "";
  THEMES.forEach((th) => {
    themeBox.appendChild(
      chipButton({
        label: state.uiLang === "id" ? th.id_name : th.en_name,
        icon: th.icon,
        selected: state.theme === th.id,
        onClick: () => {
          state.theme = th.id;
          renderPickers();
        },
      })
    );
  });

  const charBox = $("#characterPicker");
  charBox.innerHTML = "";
  CHARACTERS.forEach((ch) => {
    charBox.appendChild(
      chipButton({
        label: state.uiLang === "id" ? ch.id_name : ch.en_name,
        icon: ch.icon,
        selected: state.character === ch.id,
        onClick: () => {
          state.character = ch.id;
          renderPickers();
        },
      })
    );
  });

  const ageBox = $("#agePicker");
  ageBox.innerHTML = "";
  AGE_BANDS.forEach((a) => {
    ageBox.appendChild(
      chipButton({
        label: state.uiLang === "id" ? a.id_name : a.en_name,
        icon: "🎂",
        selected: state.ageBand === a.id,
        onClick: () => {
          state.ageBand = a.id;
          renderPickers();
        },
      })
    );
  });

  const lenBox = $("#lengthPicker");
  lenBox.innerHTML = "";
  LENGTHS.forEach((l) => {
    lenBox.appendChild(
      chipButton({
        label: state.uiLang === "id" ? l.id_name : l.en_name,
        icon: l.id === "short" ? "🌱" : l.id === "medium" ? "🌿" : "🌳",
        selected: state.length === l.id,
        onClick: () => {
          state.length = l.id;
          renderPickers();
        },
      })
    );
  });

  const langBox = $("#storyLangPicker");
  langBox.innerHTML = "";
  [
    { id: "id", label: s.storyLangId, icon: "🇮🇩" },
    { id: "en", label: s.storyLangEn, icon: "🇬🇧" },
  ].forEach((l) => {
    langBox.appendChild(
      chipButton({
        label: l.label,
        icon: l.icon,
        selected: state.storyLang === l.id,
        onClick: () => {
          state.storyLang = l.id;
          renderPickers();
        },
      })
    );
  });
}

// ---------------------------------------------------------------------------
// Status / hybrid badge
// ---------------------------------------------------------------------------

function setStatus(text, kind = "") {
  const el = $("#statusLine");
  el.textContent = text;
  el.className = "status-line " + kind;
}

function routeLabel(route) {
  const s = t();
  if (route === "on-device") return s.routeOnDevice;
  if (route === "cloud") return s.routeCloud;
  if (route === "cloud-fallback") return s.routeCloudFallback;
  return s.routeDemo;
}

async function initStatus() {
  const s = t();
  const pill = $("#hybridPill");
  if (!FIREBASE_CONFIGURED) {
    pill.textContent = "🟡 " + (state.uiLang === "id" ? "Mode Demo" : "Demo Mode");
    pill.classList.add("pill-demo");
    $("#demoBanner").hidden = false;
    $("#demoBannerText").textContent = s.demoBanner;
    setStatus(s.demoBanner, "warn");
    return;
  }
  $("#demoBanner").hidden = true;
  pill.textContent = "🟢 " + s.aiReady;
  pill.classList.add("pill-live");
  const probe = await probeOnDevice();
  const probeText = {
    available: s.nanoAvailable,
    downloading: s.nanoDownloading,
    downloadable: s.nanoDownloadable,
    unavailable: s.nanoUnavailable,
    unsupported: s.nanoUnsupported,
  }[probe];
  setStatus(`${s.aiReady} • ${probeText}`, "ok");
}

// ---------------------------------------------------------------------------
// Story rendering + read-aloud
// ---------------------------------------------------------------------------

function wordCount(text) {
  return (text || "").split(/\s+/).filter(Boolean).length;
}

function renderStory(story) {
  const s = t();
  $("#storyTitle").textContent = story.title;
  $("#storyBody").textContent = story.body;
  const moralEl = $("#storyMoral");
  if (story.moral) {
    moralEl.hidden = false;
    $("#moralText").textContent = story.moral;
  } else {
    moralEl.hidden = true;
  }
  const words = wordCount(story.body);
  $("#storyMeta").textContent =
    `${themeName(story.theme, state.uiLang)} • ${characterName(story.character, state.uiLang)} • ` +
    `${s.words(words)} • ${s.readTime(Math.max(1, Math.round(words / 130)))}`;
  const badge = $("#routeBadge");
  badge.hidden = false;
  badge.textContent = `🤖 ${s.route}: ${routeLabel(story.route)} • ${s.latency(story.latencyMs)}` +
    (story.inferenceSource ? ` • ${story.inferenceSource}` : "");
  badge.className =
    "route-badge " +
    (story.route === "on-device" ? "route-device" : story.route === "demo" ? "route-demo" : "route-cloud");
  $("#storyActions").hidden = false;
  $("#retellBox").hidden = true;
  $("#retellText").textContent = "";
  setListenButton(false);
}

function setListenButton(speaking) {
  state.speaking = speaking;
  $("#listenBtn").textContent = speaking ? t().stopListen : t().listen;
}

function speak(text, lang) {
  if (!("speechSynthesis" in window)) {
    alert(state.uiLang === "id" ? "Browser ini tidak mendukung baca suara." : "This browser does not support read-aloud.");
    return;
  }
  window.speechSynthesis.cancel();
  const chunks = text.match(/[^.!?]+[.!?]+["']?\s*|[^.!?]+$/g) || [text];
  const targetLang = lang === "id" ? "id-ID" : "en-US";
  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(targetLang.slice(0, 2))) || null;
  let i = 0;
  setListenButton(true);
  const speakNext = () => {
    if (i >= chunks.length || !state.speaking) {
      setListenButton(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(chunks[i].trim());
    u.lang = targetLang;
    if (voice) u.voice = voice;
    u.rate = 0.95;
    i += 1;
    u.onend = speakNext;
    u.onerror = () => setListenButton(false);
    window.speechSynthesis.speak(u);
  };
  speakNext();
}

// ---------------------------------------------------------------------------
// Generate / retell
// ---------------------------------------------------------------------------

async function onGenerate() {
  const s = t();
  const btn = $("#generateBtn");
  btn.disabled = true;
  btn.textContent = s.generating;
  stopSpeaking();
  setStatus(s.warming, "");
  try {
    const params = {
      theme: state.theme,
      character: state.character,
      ageBand: state.ageBand,
      length: state.length,
      lang: state.storyLang,
    };
    const story = await generateStory(params, {
      onProgress: (p) => {
        const pct = Math.round(p * 100);
        setStatus(s.downloadProgress(pct), "");
        btn.textContent = `${s.downloadProgress(pct)}`;
      },
    });
    state.currentStory = { ...story, ...params };
    renderStory(state.currentStory);
    setStatus(
      `${s.route}: ${routeLabel(story.route)} • ${s.latency(story.latencyMs)}` +
        (story.inferenceSource ? ` • inferenceSource: ${story.inferenceSource}` : ""),
      story.route === "on-device" ? "ok" : ""
    );
  } catch (err) {
    console.error("[DongengKu] generate failed:", err);
    // Surface the underlying cause in the UI (not just the console). The
    // Firebase AI SDK reports every failed cloud call as code "fetch-error";
    // the real detail (HTTP status + server message, e.g. "[401 ...]" or
    // "[403 ...]") lives in err.message, so show that part, not just the code.
    const raw = err?.message || "";
    const bracket = raw.indexOf("[");
    const cause = (bracket >= 0 ? raw.slice(bracket) : raw).slice(0, 240);
    const detail = [err?.code, cause].filter(Boolean).join(": ");
    setStatus(`${s.errorGenerate} (${detail || "unknown"})`, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = s.generate;
  }
}

async function onRetell() {
  const s = t();
  if (!state.currentStory) return;
  const btn = $("#retellBtn");
  btn.disabled = true;
  btn.textContent = s.retelling;
  try {
    const res = await retellStory(state.currentStory, state.storyLang);
    $("#retellBox").hidden = false;
    $("#retellText").textContent = res.text;
    $("#retellMeta").textContent =
      `${s.route}: ${routeLabel(res.route)} • ${s.latency(res.latencyMs)}` +
      (res.inferenceSource ? ` • ${res.inferenceSource}` : "");
  } catch (err) {
    console.error("[DongengKu] retell failed:", err);
    setStatus(s.errorRetell, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = s.retell;
  }
}

function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  setListenButton(false);
}

// ---------------------------------------------------------------------------
// Favourites (Firestore when configured, localStorage in demo mode)
// ---------------------------------------------------------------------------

function loadLocalFavourites() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_FAV_KEY) || "[]");
  } catch {
    return [];
  }
}

function persistLocalFavourites() {
  localStorage.setItem(LOCAL_FAV_KEY, JSON.stringify(state.favourites));
}

async function refreshFavourites() {
  if (FIREBASE_CONFIGURED) {
    try {
      state.favourites = await listStoriesFromFirestore();
    } catch (err) {
      console.warn("[DongengKu] Firestore list failed, using local copy:", err);
      state.favourites = loadLocalFavourites();
    }
  } else {
    state.favourites = loadLocalFavourites();
  }
  renderLibrary();
}

async function onSaveFavourite() {
  const s = t();
  if (!state.currentStory) return;
  const story = { ...state.currentStory };
  delete story.latencyMs;
  try {
    if (FIREBASE_CONFIGURED) {
      const id = await saveStoryToFirestore(story);
      if (id) story.id = id;
    } else {
      story.id = "local-" + Date.now();
      story.savedAtLocal = new Date().toISOString();
    }
    state.favourites.unshift(story);
    if (!FIREBASE_CONFIGURED) persistLocalFavourites();
    renderLibrary();
    const btn = $("#saveBtn");
    btn.textContent = FIREBASE_CONFIGURED ? s.saved : s.savedLocal;
    setTimeout(() => {
      btn.textContent = s.saveFav;
    }, 2500);
  } catch (err) {
    console.error("[DongengKu] save failed:", err);
    setStatus(s.errorGenerate, "error");
  }
}

async function onDeleteFavourite(id) {
  if (!confirm(t().confirmDelete)) return;
  try {
    if (FIREBASE_CONFIGURED) await deleteStoryFromFirestore(id);
    state.favourites = state.favourites.filter((f) => f.id !== id);
    if (!FIREBASE_CONFIGURED) persistLocalFavourites();
    renderLibrary();
  } catch (err) {
    console.error("[DongengKu] delete failed:", err);
  }
}

function renderLibrary() {
  const s = t();
  const box = $("#libraryList");
  box.innerHTML = "";
  if (!state.favourites.length) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = s.libraryEmpty;
    box.appendChild(p);
    return;
  }
  state.favourites.forEach((fav) => {
    const card = document.createElement("article");
    card.className = "fav-card";
    const created =
      fav.createdAt && fav.createdAt.toDate
        ? fav.createdAt.toDate().toLocaleDateString()
        : fav.savedAtLocal
          ? new Date(fav.savedAtLocal).toLocaleDateString()
          : "";
    card.innerHTML =
      `<h3></h3><p class="muted small"></p><p class="fav-snippet"></p>` +
      `<div class="fav-actions"><button class="btn small open-btn"></button>` +
      `<button class="btn small ghost del-btn"></button></div>`;
    card.querySelector("h3").textContent = fav.title || "—";
    card.querySelector(".muted").textContent =
      `${themeName(fav.theme, state.uiLang)} • ${characterName(fav.character, state.uiLang)}${created ? " • " + created : ""}` +
      (fav.route ? ` • ${routeLabel(fav.route)}` : "");
    card.querySelector(".fav-snippet").textContent = (fav.body || "").slice(0, 140) + "…";
    card.querySelector(".open-btn").textContent = s.openLibrary;
    card.querySelector(".del-btn").textContent = s.delete;
    card.querySelector(".open-btn").addEventListener("click", () => {
      state.currentStory = fav;
      renderStory(fav);
      $("#storySection").scrollIntoView({ behavior: "smooth" });
    });
    card.querySelector(".del-btn").addEventListener("click", () => onDeleteFavourite(fav.id));
    box.appendChild(card);
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function bindEvents() {
  $("#generateBtn").addEventListener("click", onGenerate);
  $("#retellBtn").addEventListener("click", onRetell);
  $("#saveBtn").addEventListener("click", onSaveFavourite);
  $("#listenBtn").addEventListener("click", () => {
    if (!state.currentStory) return;
    if (state.speaking) {
      stopSpeaking();
    } else {
      const text = `${state.currentStory.title}. ${state.currentStory.body}` +
        (state.currentStory.moral ? ` ${state.currentStory.moral}` : "");
      speak(text, state.storyLang);
    }
  });
  $("#langToggle").addEventListener("click", () => {
    state.uiLang = state.uiLang === "id" ? "en" : "id";
    applyI18n();
    initStatus();
  });
  if ("speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
  }
}

applyI18n();
bindEvents();
initStatus();
refreshFavourites();
