#!/usr/bin/env python3
"""
DongengKu — demo video builder (no video-generation tools used).

Builds demo/dongengku-demo.mp4 from:
  - real Playwright screenshots (demo/screenshots/*.png, 1280x720)
  - title/closing cards rendered with PIL
  - English narration via gTTS (one MP3 per scene)
  - ffmpeg: stills -> per-scene segments (caption burned in) -> concat

Also writes demo/subtitles.srt (English subtitles for the YouTube upload).

Usage:  .venv-tts/bin/python scripts/make-demo-video.py
Requires: gtts, pillow, ffmpeg + ffprobe on PATH.
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEMO = ROOT / "demo"
SHOTS = DEMO / "screenshots"
WORK = DEMO / ".video-work"
WORK.mkdir(parents=True, exist_ok=True)

SCENES = [
    {
        "image": None,  # title card
        "title": "DongengKu",
        "subtitle": "Bedtime stories, powered by hybrid AI",
        "tag": "#BuildHybridAI 2026",
        "narration": "Meet DongengKu — a bilingual story companion for kids, built for the Build Hybrid AI hackathon.",
        "caption": "DongengKu — bilingual stories for kids",
    },
    {
        "image": SHOTS / "01-hero.png",
        "narration": "Pick a theme, a character, an age, and a length. DongengKu writes a brand-new story in Indonesian or English, adapted to your child's reading level.",
        "caption": "Pick a theme, a character, an age — get a new story",
    },
    {
        "image": SHOTS / "02-story.png",
        "narration": "Here is a story about Raka, the little robot, and the star that lost its light. Look at the badge: it tells you exactly which AI served it — on-device Gemini Nano, or cloud Gemini — and how fast it was.",
        "caption": "The badge shows the AI route: on-device or cloud",
    },
    {
        "image": SHOTS / "03-retell.png",
        "narration": "Short retellings run on-device first. They are quick, private, and free. They never leave the device when Gemini Nano is ready. If the device is not ready, Firebase AI Logic falls back to the cloud automatically.",
        "caption": "Short retellings run on-device first — Gemini Nano",
    },
    {
        "image": SHOTS / "04-library.png",
        "narration": "Love a story? Save it to favourites. Stories are stored in Firestore under anonymous auth, so every child keeps their own library.",
        "caption": "Favourites saved to Firestore — anonymous auth",
    },
    {
        "image": SHOTS / "05-english.png",
        "narration": "The whole app is bilingual — Indonesian and English, for the story and the interface. And parents can listen along: every story can be read aloud.",
        "caption": "Bilingual UI — plus read-aloud",
    },
    {
        "image": None,  # closing card
        "title": "DongengKu",
        "subtitle": "On-device first. Cloud when needed.",
        "tag": "A story, always. Built with Firebase AI Logic.",
        "narration": "DongengKu — on-device first, cloud when needed. A story, always. Built with Firebase AI Logic.",
        "caption": "On-device first. Cloud when needed. A story, always.",
    },
]

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def run(cmd, **kw):
    print("+", " ".join(str(c) for c in cmd))
    subprocess.run(cmd, check=True, **kw)


def make_title_card(scene, out_path):
    from PIL import Image, ImageDraw, ImageFont

    W, H = 1280, 720
    img = Image.new("RGB", (W, H), (255, 138, 61))
    d = ImageDraw.Draw(img)
    # soft band
    d.rectangle([0, 250, W, 470], fill=(255, 207, 92))
    f_title = ImageFont.truetype(FONT_BOLD, 110)
    f_sub = ImageFont.truetype(FONT_BOLD, 40)
    f_tag = ImageFont.truetype(FONT, 30)

    def centered(y, text, font, color):
        bb = d.textbbox((0, 0), text, font=font)
        d.text(((W - (bb[2] - bb[0])) / 2, y), text, font=font, fill=color)

    centered(90, "📚", ImageFont.truetype(FONT, 90), (255, 255, 255))
    centered(270, scene["title"], f_title, (74, 44, 0))
    centered(400, scene["subtitle"], f_sub, (74, 44, 0))
    centered(620, scene["tag"], f_tag, (255, 255, 255))
    img.save(out_path)


def tts(text, out_path):
    from gtts import gTTS

    gTTS(text=text, lang="en").save(str(out_path))


def duration(path):
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        text=True,
    )
    return float(out.strip())


def srt_time(sec):
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    # 1. Title cards
    for i, scene in enumerate(SCENES):
        if scene["image"] is None:
            card = WORK / f"card-{i}.png"
            make_title_card(scene, card)
            scene["image"] = card

    # 2. Narration + durations
    manifest = []
    for i, scene in enumerate(SCENES):
        mp3 = WORK / f"narration-{i}.mp3"
        if not mp3.exists():
            tts(scene["narration"], mp3)
        dur = duration(mp3)
        scene_dur = round(dur + 0.9, 2)  # small breathing room
        manifest.append({"scene": i, "audio_s": round(dur, 2), "scene_s": scene_dur})
        print(f"scene {i}: narration {dur:.2f}s -> segment {scene_dur:.2f}s")
    (WORK / "manifest.json").write_text(json.dumps(manifest, indent=2))

    # 3. Per-scene segments (still + caption + narration)
    segments = []
    for i, scene in enumerate(SCENES):
        seg = WORK / f"seg-{i}.mp4"
        caption_file = WORK / f"caption-{i}.txt"
        caption_file.write_text(scene["caption"])
        dur = manifest[i]["scene_s"]
        vf = (
            "scale=1280:720:force_original_aspect_ratio=decrease,"
            "pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=#fff8e7,"
            "format=yuv420p,"
            f"drawtext=fontfile={FONT_BOLD}:textfile={caption_file}:"
            "fontsize=30:fontcolor=white:borderw=2:bordercolor=black:"
            "box=1:boxcolor=black@0.55:boxborderw=12:x=(w-text_w)/2:y=h-90"
        )
        run([
            "ffmpeg", "-y", "-v", "error",
            "-loop", "1", "-t", str(dur), "-i", str(scene["image"]),
            "-i", str(WORK / f"narration-{i}.mp3"),
            "-filter_complex", f"[0:v]{vf}[v]",
            "-map", "[v]", "-map", "1:a",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
            "-c:a", "aac", "-b:a", "128k",
            "-shortest", str(seg),
        ])
        segments.append(seg)

    # 4. Concat
    concat_list = WORK / "concat.txt"
    concat_list.write_text("".join(f"file '{s}'\n" for s in segments))
    out = DEMO / "dongengku-demo.mp4"
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0",
         "-i", str(concat_list), "-c", "copy", str(out)])

    total = sum(m["scene_s"] for m in manifest)
    print(f"\nWrote {out} ({total:.1f}s total)")

    # 5. Subtitles (SRT)
    lines, t = [], 0.0
    for i, scene in enumerate(SCENES):
        start, end = t, t + manifest[i]["audio_s"]
        lines.append(f"{i + 1}\n{srt_time(start)} --> {srt_time(end)}\n{scene['narration']}\n")
        t += manifest[i]["scene_s"]
    (DEMO / "subtitles.srt").write_text("\n".join(lines))
    print(f"Wrote {DEMO / 'subtitles.srt'}")
    print("Done. Preview:", out)


if __name__ == "__main__":
    sys.exit(main())
