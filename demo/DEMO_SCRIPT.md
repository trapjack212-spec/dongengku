# DongengKu — Demo video plan (≤ 3 min, English narration)

Target: ~60 seconds (actual build: 60.6 s). Built from real Playwright screenshots of the working app
(`demo/screenshots/`) + English TTS narration (gTTS) + ffmpeg. No AI video
generation used. Upload the finished `dongengku-demo.mp4` to YouTube (public).

## Storyboard

| # | Visual | Duration | Narration (English) |
|---|---|---|---|
| 0 | Title card (orange): "DongengKu — Bedtime stories, powered by hybrid AI" + "#BuildHybridAI 2026" | ~6 s | "Meet DongengKu — a bilingual story companion for kids, built for the Build Hybrid AI hackathon." |
| 1 | Screenshot `01-hero.png` (picker UI) | ~12 s | "Pick a theme, a character, an age, and a length. DongengKu writes a brand-new story in Indonesian or English — adapted to your child's reading level." |
| 2 | Screenshot `02-story.png` (generated story + route badge) | ~15 s | "Here is a story about Raka, the little robot, and the star that lost its light. Look at the badge: it tells you exactly which AI served it — on-device Gemini Nano, or cloud Gemini — and how fast it was." |
| 3 | Screenshot `03-retell.png` (short retelling) | ~13 s | "Short retellings run on-device first. They are quick, private, and free — they never leave the device when Gemini Nano is ready. If the device is not ready, Firebase AI Logic falls back to the cloud automatically." |
| 4 | Screenshot `04-library.png` (favourites) | ~11 s | "Love a story? Save it to favourites. Stories are stored in Firestore under anonymous auth, so every child keeps their own library." |
| 5 | Screenshot `05-english.png` (English UI) | ~11 s | "The whole app is bilingual — Indonesian and English, for the story and the interface. And parents can listen along: every story can be read aloud." |
| 6 | Title card (closing): "DongengKu — On-device first. Cloud when needed. A story, always." + repo note | ~7 s | "DongengKu — on-device first, cloud when needed. A story, always. Built with Firebase AI Logic." |

Total ≈ 61 s (under the 3-minute Devpost limit).

## Production notes

- Screenshots: `npm run verify` regenerates them (1280×720).
- Narration: Piper offline neural TTS (`en_US-lessac-medium`), one WAV per scene
  converted to MP3; durations measured with ffprobe and used as the scene
  lengths; SRT subtitles generated from the same script
  (`demo/subtitles.srt`). (gTTS was tried first but Google Translate TTS
  returns HTTP 429 for this sandbox's egress IP; edge-tts is blocked by the
  egress proxy's TLS — Piper runs fully offline once the voice is downloaded.)
- Assembly: `scripts/make-demo-video.sh` (ffmpeg `zoompan` stills + concat +
  burned-in caption line per scene + narration audio).
- If re-recording with a real Firebase project: re-run `npm run verify` after
  connecting Firebase so the route badge shows a live "On-device" or "Cloud"
  route instead of "Demo — template offline", and update scene 2's narration.

## Files

- `demo/dongengku-demo.mp4` — finished video
- `demo/subtitles.srt` — English subtitles (also upload to YouTube)
- `demo/screenshots/*.png` — source stills
