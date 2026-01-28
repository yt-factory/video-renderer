# video-renderer

Remotion-based video production pipeline that converts JSON manifests into professional YouTube videos with automatic Shorts extraction, smart subtitles, and SEO-optimized overlays.

Part of the **yt-factory** ecosystem — receives `manifest.json` from the orchestrator and outputs render-ready video assets.

## Features

- **Schema-driven rendering** — 100% driven by `manifest.json`, zero manual intervention
- **5 render profiles** — draft (480p/15fps), preview (720p/24fps), production (1080p/30fps), shorts_only (9:16), 4K (2160p/30fps)
- **Audio-driven timeline** — TTS synthesis with content-aware pacing gaps (tutorial: 0.5s, news: 0.3s, chapter transitions: 1.0s)
- **5 themes** — Cyberpunk, Minimalist, Dark Mode, Whiteboard, Corporate — auto-selected by mood + content type
- **Smart subtitles** — Word-level highlighting with dynamic scaling (keyword 1.12x, number 1.18x, emphasis 1.2x)
- **Emotional transitions** — 5 trigger types (anger, awe, curiosity, FOMO, validation) with Red Glitch effect
- **Shorts extraction** — 9:16 crop with YouTube safe zone protection (top 10%, bottom 22%, right 18%) and gravity alignment
- **SEO overlays** — High-contrast chapter keyframes (WCAG 7:1+) with triple-index keyword validation
- **5-level asset fallback** — Provided asset → AI generated → Lottie → keyword cloud → gradient background
- **Docker isolation** — Remotion + FFmpeg + Puppeteer in a containerized environment

## Quick Start

```bash
npm install

# Development — Remotion Studio
npm run dev

# Draft render (480p, fast iteration)
npm run render:draft

# Production render (1080p)
npm run render:prod

# 4K render
npm run render:4k
```

## Usage

```bash
npx ts-node src/index.ts <manifest.json> <output-dir> [options]

# Options:
#   --profile=<name>     draft | preview | production | shorts_only | 4k
#   --debug-safe-zone    Show safe zone overlay in Shorts
#   --auto-preview       Auto-open video after rendering
```

## Output

| File | Description |
|------|-------------|
| `{id}_main.mp4` | Main video (16:9) |
| `{id}_shorts_01.mp4` | Shorts clips (9:16, safe zone compliant) |
| `{id}_thumbnail.png` | Thumbnail (1280x720, high contrast) |
| `{id}_audio.mp3` | Audio track |
| `manifest.json` | Updated manifest with asset URLs |
| `render_report.json` | Render stats including pacing metrics |

## Project Structure

```
src/
├── compositions/       # Remotion compositions (Main, Shorts, Thumbnail)
├── templates/          # 5 theme configs with auto-selection matrix
├── components/
│   ├── segments/       # Visual hint components (code, diagram, etc.)
│   ├── overlays/       # CTA, Chapter SEO, Smart Subtitle, Safe Zone
│   ├── transitions/    # Emotional transitions + Glitch effects
│   └── common/         # Shared components
├── audio/              # TTS client, audio-driven timeline, background music
├── shorts/             # Extractor, face tracker, vertical crop, safe zone
├── thumbnail/          # Generator, auto-capture
├── core/               # Manifest parser, render profiles, asset fallback
└── utils/              # Logger, contrast checker, timing, colors
```

## Docker

```bash
npm run docker:build
npm run docker:render
```

## Tech Stack

- **Remotion 4.x** — Programmatic video rendering
- **React 18 + TypeScript** — Video component development
- **Zod** — Manifest schema validation
- **FFmpeg** — Shorts extraction and format conversion
- **Sharp** — Thumbnail generation

## Integration

Receives `manifest.json` (status: `rendering`) from the orchestrator, renders all assets, and returns updated manifest (status: `uploading`) with populated `assets` URLs.
