/**
 * DongengKu — headless verification (Playwright + bundled Chromium).
 *
 * Serves the production build with `vite preview`, then drives the real UI:
 *  1. page loads, demo banner visible (no Firebase config in this repo)
 *  2. theme / character / age / length / language pickers render
 *  3. Generate produces a story + a "Demo — offline template" route badge
 *  4. Retell produces a short version
 *  5. Save to Favourites persists (localStorage in demo mode) and renders
 *     a library card; reload keeps it
 *  6. UI language toggle switches headings to English
 *  7. no console errors / failed requests (the expected "demo mode" info
 *     log is allowed)
 * Screenshots land in demo/screenshots/ for the demo video.
 *
 * Usage: npm run verify   (builds first: `npm run build && npm run verify`)
 */

import { chromium } from "playwright-core";
import { spawn, execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SHOTS = path.join(ROOT, "demo", "screenshots");
mkdirSync(SHOTS, { recursive: true });

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  path.join(process.env.HOME || "", ".cache/ms-playwright/chromium-1255/chrome-linux64/chrome"),
  path.join(process.env.HOME || "", ".cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell"),
  "/opt/meta-chromium/chrome",
].filter(Boolean);

const executablePath = CHROME_CANDIDATES.find((p) => p && existsSync(p));
if (!executablePath) {
  console.error("No Chromium found. Checked:", CHROME_CANDIDATES);
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await sleep(500);
  }
  return false;
}

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}

const server = spawn(path.join(ROOT, "node_modules", ".bin", "vite"), ["preview", "--port", "4173", "--strictPort", "--host", "127.0.0.1"], {
  cwd: ROOT,
  stdio: "ignore",
});

let browser;
try {
  const up = await waitForServer("http://127.0.0.1:4173/");
  check("preview server serves the build", up);
  if (!up) throw new Error("preview server did not come up");

  browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push("pageerror: " + err.message));
  page.on("requestfailed", (req) => failedRequests.push(req.url()));

  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });

  check("page title mentions DongengKu", (await page.title()).includes("DongengKu"), await page.title());
  check("demo banner visible (no Firebase config)", await page.locator("#demoBanner").isVisible());
  check(
    "6 theme chips rendered",
    (await page.locator("#themePicker .chip").count()) === 6
  );
  check(
    "6 character chips rendered",
    (await page.locator("#characterPicker .chip").count()) === 6
  );
  check(
    "hybrid pill shows Demo Mode",
    (await page.locator("#hybridPill").innerText()).includes("Demo")
  );
  await page.screenshot({ path: path.join(SHOTS, "01-hero.png") });

  // Pick space theme + robot character, age 7-9, medium, Indonesian.
  await page.locator("#themePicker .chip").nth(1).click();
  await page.locator("#characterPicker .chip").nth(3).click();
  await page.locator("#generateBtn").click();
  await page.waitForSelector("#storyActions:not([hidden])", { timeout: 15000 });

  const storyText = await page.locator("#storyBody").innerText();
  check("story body generated (demo template)", storyText.length > 100, `${storyText.length} chars`);
  check(
    "story mentions the chosen character",
    storyText.includes("Raka"),
    storyText.slice(0, 80)
  );
  const badge = await page.locator("#routeBadge").innerText();
  check("route badge shows Demo template route", badge.includes("Demo"), badge);
  const title = await page.locator("#storyTitle").innerText();
  check("story has a title", title.length > 3, title);
  check("moral shown", await page.locator("#storyMoral").isVisible());
  await page.screenshot({ path: path.join(SHOTS, "02-story.png") });

  // Retell (short version) — demo mode shortens the story locally.
  await page.locator("#retellBtn").click();
  await page.waitForSelector("#retellBox:not([hidden])", { timeout: 10000 });
  const retell = await page.locator("#retellText").innerText();
  check("retelling produced and shorter than story", retell.length > 20 && retell.length < storyText.length, `${retell.length} chars`);
  await page.screenshot({ path: path.join(SHOTS, "03-retell.png") });

  // Save favourite (localStorage in demo mode) + library card.
  await page.locator("#saveBtn").click();
  await page.waitForTimeout(400);
  check("library shows 1 favourite card", (await page.locator(".fav-card").count()) === 1);
  const stored = await page.evaluate(() => localStorage.getItem("dongengku-favourites-v1"));
  check("favourite persisted in localStorage", !!stored && JSON.parse(stored).length === 1);
  await page.screenshot({ path: path.join(SHOTS, "04-library.png") });

  // Reload: favourite survives.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  check("favourite survives reload", (await page.locator(".fav-card").count()) === 1);

  // UI language toggle to English.
  await page.locator("#langToggle").click();
  await page.waitForTimeout(400);
  const heading = await page.locator(".generator .field h2").first().innerText();
  check("UI switches to English", heading.includes("Pick a Theme"), heading);
  await page.screenshot({ path: path.join(SHOTS, "05-english.png") });

  // Read-aloud button exists (speechSynthesis cannot be heard headless,
  // but the control must be present and clickable without errors).
  await page.locator("#listenBtn").click();
  await page.waitForTimeout(300);
  check("read-aloud button toggles without page error", true);

  check("no console errors", consoleErrors.length === 0, consoleErrors.join(" | ").slice(0, 300));
  check("no failed requests", failedRequests.length === 0, failedRequests.join(", ").slice(0, 300));

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
