# Video Renderer

Remotion-based video production pipeline that converts JSON manifests into professional YouTube videos with automatic Shorts extraction, smart subtitles, and SEO-optimized overlays.

Part of the **yt-factory** ecosystem — receives `manifest.json` from the orchestrator and outputs render-ready video assets.

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                      Video Renderer Pipeline                        │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   manifest.json ──> Manifest Parser ──> Render Profile Selection   │
│                              │                                      │
│                              ▼                                      │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │              Audio-Driven Timeline                        │     │
│   │  TTS Synthesis ──> Pacing Gaps ──> Duration Calculation  │     │
│   │  (tutorial: 0.5s gap | news: 0.3s | chapter: 1.0s)       │     │
│   └──────────────────────────────────────────────────────────┘     │
│                              │                                      │
│                              ▼                                      │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │              Theme Selection Matrix                       │     │
│   │  mood + content_type → cyberpunk | minimalist | dark_mode│     │
│   │                      → whiteboard | corporate             │     │
│   └──────────────────────────────────────────────────────────┘     │
│                              │                                      │
│                              ▼                                      │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │              Remotion Rendering                           │     │
│   │  Main Video (16:9) + Shorts (9:16) + Thumbnail           │     │
│   │  • Smart Subtitles (word-level highlight)                │     │
│   │  • Emotional Transitions + Red Glitch                    │     │
│   │  • Safe Zone Protection + Gravity Alignment              │     │
│   │  • SEO Overlays (WCAG 7:1+ contrast)                     │     │
│   └──────────────────────────────────────────────────────────┘     │
│                              │                                      │
│                              ▼                                      │
│   Output: main.mp4 + shorts_*.mp4 + thumbnail.png                  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

## Features

- **Schema-driven rendering** — 100% driven by `manifest.json`, zero manual intervention
- **5 render profiles** — draft (480p/15fps), preview (720p/24fps), production (1080p/30fps), shorts_only (9:16), 4K (2160p/30fps)
- **Audio-driven timeline** — TTS synthesis with content-aware pacing gaps
- **5 themes** — Cyberpunk, Minimalist, Dark Mode, Whiteboard, Corporate — auto-selected by mood + content type
- **Smart subtitles** — Word-level highlighting with dynamic scaling (keyword 1.12x, number 1.18x)
- **Emotional transitions** — 5 trigger types with Red Glitch effect
- **Shorts extraction** — 9:16 crop with YouTube safe zone protection and gravity alignment
- **SEO overlays** — High-contrast chapter keyframes (WCAG 7:1+)
- **5-level asset fallback** — Provided asset → AI generated → Lottie → keyword cloud → gradient

## Quick Start

```bash
# Install dependencies
cd video-renderer
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

## Usage Examples

### Example 1: Draft Render (Quick Testing)

```bash
# Create a test manifest
cat > test-manifest.json << 'EOF'
{
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "rendering",
  "created_at": "2026-02-02T04:50:00.000Z",
  "updated_at": "2026-02-02T04:50:00.000Z",
  "input_source": {
    "local_path": "./test.md",
    "raw_content": "# Test Article",
    "word_count": 500,
    "estimated_reading_time_minutes": 3
  },
  "content_engine": {
    "script": [
      {
        "timestamp": "00:00",
        "voiceover": "Welcome to today's tutorial on Rust programming.",
        "visual_hint": "text_animation",
        "estimated_duration_seconds": 5
      },
      {
        "timestamp": "00:05",
        "voiceover": "Let's look at the ownership model that makes Rust unique.",
        "visual_hint": "code_block",
        "estimated_duration_seconds": 8
      }
    ],
    "seo": {
      "primary_language": "en",
      "tags": ["rust", "programming", "tutorial"],
      "chapters": "00:00 - Introduction\n00:05 - Ownership Model",
      "regional_seo": [],
      "faq_structured_data": [],
      "entities": [],
      "trend_coverage_score": 85
    },
    "shorts": {
      "hooks": [
        {
          "text": "This ONE concept changed everything",
          "timestamp_start": "00:05",
          "timestamp_end": "00:13",
          "hook_type": "counter_intuitive",
          "emotional_trigger": "curiosity",
          "controversy_score": 3,
          "predicted_engagement": {
            "comments": "medium",
            "shares": "high",
            "completion_rate": "high"
          },
          "injected_cta": "想知道结果吗？"
        }
      ],
      "vertical_crop_focus": "center",
      "recommended_music_mood": "chill",
      "face_detection_hint": false
    },
    "estimated_duration_seconds": 13,
    "media_preference": {
      "visual": {
        "mood": "professional",
        "content_type": "tutorial",
        "theme_suggestion": "dark_mode"
      }
    }
  }
}
EOF

# Run draft render (fast, 480p)
node render.mjs --manifest=./test-manifest.json --profile=draft

# Output will be in ./output/{project_id}/
```

**Expected Output:**
```
[INFO] Loading manifest: ./test-manifest.json
[INFO] Selected profile: draft (854x480 @ 15fps)
[INFO] Theme: dark_mode
[INFO] Synthesizing audio for 2 segments...
[INFO] Audio duration: 13.5s
[INFO] Rendering main video...
[INFO] Extracting 1 Shorts clip...
[INFO] ✅ Render complete!

Output files:
  • 550e8400_main.mp4 (3.2 MB)
  • 550e8400_shorts_01.mp4 (1.1 MB)
  • render_report.json
```

### Example 2: Production Render with Audio

```bash
# Use NotebookLM-generated audio
node render.mjs \
  --manifest=./active_projects/PROJECT_ID/manifest.json \
  --lang=en \
  --profile=production

# The renderer will:
# 1. Read audio from active_projects/PROJECT_ID/audio/en.mp3
# 2. Calculate video duration from audio length
# 3. Render in 1080p @ 30fps
```

### Example 3: Render Shorts Only

```bash
# Direct 9:16 rendering for Shorts
node render.mjs \
  --manifest=./test-manifest.json \
  --profile=shorts_only

# Output: 1080x1920 vertical video with safe zone compliance
```

### Example 4: Preview in Remotion Studio

```bash
# Start Remotion Studio for live preview
npm run dev

# Open http://localhost:3000 in browser
# Edit compositions in real-time
# Test different themes and layouts
```

### Example 5: 4K Render for Premium Content

```bash
# 4K render (2160p, h265)
node render.mjs \
  --manifest=./test-manifest.json \
  --profile=4k

# ⚠️ This takes longer - estimated 5x real-time
```

### Example 6: Debug Safe Zone

```bash
# Render with safe zone overlay visible
node render.mjs \
  --manifest=./test-manifest.json \
  --profile=preview \
  --debug-safe-zone

# Shows red overlays for:
# - Top 10% (status bar)
# - Bottom 22% (description, music, progress)
# - Right 18% (like, comment, share buttons)
```

### Example 7: Docker Render (Isolated Environment)

```bash
# Build Docker image
npm run docker:build

# Run render in container
docker run -v $(pwd)/output:/app/output \
  -v $(pwd)/test-manifest.json:/app/manifest.json \
  video-renderer \
  --manifest=/app/manifest.json \
  --profile=production
```

## Render Profiles

| Profile | Resolution | FPS | CRF | Use Case |
|---------|------------|-----|-----|----------|
| `draft` | 854x480 | 15 | 35 | Quick testing, ~30s for 5min video |
| `preview` | 1280x720 | 24 | 28 | Review quality, skips thumbnail |
| `production` | 1920x1080 | 30 | 18 | YouTube upload ready |
| `shorts_only` | 1080x1920 | 30 | 20 | Direct vertical render |
| `4k` | 3840x2160 | 30 | 15 | Premium content (h265) |

## Theme System

Themes are auto-selected based on `media_preference`:

| Content Type | Professional | Casual | Energetic | Calm |
|--------------|--------------|--------|-----------|------|
| Tutorial | corporate | whiteboard | cyberpunk | minimalist |
| News | corporate | dark_mode | cyberpunk | minimalist |
| Analysis | corporate | dark_mode | dark_mode | minimalist |
| Entertainment | dark_mode | cyberpunk | cyberpunk | whiteboard |

**Override theme in manifest:**
```json
{
  "media_preference": {
    "visual": {
      "mood": "professional",
      "content_type": "tutorial",
      "theme_suggestion": "cyberpunk"  // Explicit override
    }
  }
}
```

## Shorts Safe Zone

YouTube Shorts has specific UI overlay zones that must be avoided:

```
┌─────────────────────────────────┐
│ ⚠️ TOP 10% - Status Bar         │
├─────────────────────────────────┤
│                                 │
│       ✅ SAFE ZONE             │ ⚠️ RIGHT 18%
│         (Content)               │ Like
│                                 │ Comment
│                                 │ Share
│                                 │ More
├─────────────────────────────────┤
│ ⚠️ BOTTOM 22% - Description     │
│    Username, Music, Progress    │
└─────────────────────────────────┘
```

**Gravity Alignment** automatically adjusts content positioning:
- Top content → shifts down
- Bottom content → shifts up
- Center content → shifts left (away from buttons)

## Output Files

| File | Description |
|------|-------------|
| `{id}_main.mp4` | Main video (16:9) |
| `{id}_shorts_01.mp4` | Shorts clips (9:16, safe zone compliant) |
| `{id}_thumbnail.png` | Thumbnail (1280x720, high contrast) |
| `{id}_audio.mp3` | Audio track (backup) |
| `manifest.json` | Updated manifest with asset URLs |
| `render_report.json` | Render stats including pacing metrics |

## Project Structure

```
video-renderer/
├── src/
│   ├── compositions/       # Remotion compositions (Main, Shorts, Thumbnail)
│   ├── templates/          # 5 theme configs with auto-selection matrix
│   ├── components/
│   │   ├── segments/       # Visual hint components (code, diagram, etc.)
│   │   ├── overlays/       # CTA, Chapter SEO, Smart Subtitle, Safe Zone
│   │   ├── transitions/    # Emotional transitions + Glitch effects
│   │   └── common/         # Shared components
│   ├── audio/              # TTS client, audio-driven timeline
│   ├── shorts/             # Extractor, face tracker, vertical crop
│   ├── thumbnail/          # Generator, auto-capture
│   ├── core/               # Manifest parser, render profiles, asset fallback
│   └── utils/              # Logger, contrast checker, timing
├── public/
│   ├── fonts/              # Web fonts
│   ├── music/              # Background music library
│   └── lottie/             # Fallback animations
├── render.mjs              # CLI entry point
├── remotion.config.ts      # Remotion configuration
└── docker/
    └── Dockerfile          # Isolated render environment
```

## Configuration

### Environment Variables

```bash
# .env file
# ===========================================
# Mock Mode
# ===========================================
MOCK_MODE=true

# ===========================================
# Render Environment
# ===========================================
RENDER_ENV=development    # development | staging | production

# ===========================================
# Logging
# ===========================================
LOG_LEVEL=info

# ===========================================
# TTS Providers (at least one for production)
# ===========================================
ELEVENLABS_API_KEY=your_elevenlabs_api_key
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
# AZURE_SPEECH_KEY=your_azure_speech_key

# ===========================================
# AI Image Generation (optional)
# ===========================================
ENABLE_AI_IMAGE_GENERATION=false
# OPENAI_API_KEY=your_openai_api_key

# ===========================================
# Chrome/Puppeteer (for Remotion)
# ===========================================
# PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# REMOTION_CHROME_EXECUTABLE_PATH=/usr/bin/chromium

# ===========================================
# Output
# ===========================================
OUTPUT_DIR=./output
TEMP_DIR=./temp

# ===========================================
# Render Quality Defaults
# ===========================================
DEFAULT_RENDER_PROFILE=preview
AUTO_PREVIEW=true
```

## Troubleshooting

### "FFmpeg not found"
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Verify
ffmpeg -version
```

### "Chromium/Puppeteer issues"
```bash
# Set explicit Chrome path
export PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
export REMOTION_CHROME_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

### "Audio file not found"
```bash
# Check audio path in manifest
cat manifest.json | jq '.audio.languages.en.audio_path'

# Verify file exists
ls -la active_projects/PROJECT_ID/audio/
```

### "Render timeout"
```bash
# Increase timeout in remotion.config.ts
Config.setDelayRenderTimeoutInMilliseconds(120000);  // 2 minutes
```

### "Out of memory"
```bash
# Reduce concurrency
node render.mjs --manifest=./manifest.json --profile=production --concurrency=2

# Or use Docker with memory limits
docker run --memory=8g video-renderer ...
```

## NotebookLM Audio Support

The renderer supports **audio-driven video rendering** with NotebookLM-generated audio:

```bash
# 1. Orchestrator generates scripts
cat active_projects/PROJECT_ID/notebooklm_script_en.md

# 2. User creates audio via NotebookLM
# 3. Downloads to: active_projects/PROJECT_ID/audio/en.mp3

# 4. Render with language-specific audio
node render.mjs --manifest=./manifest.json --lang=en --profile=production
```

**Audio Validation:**
- Duration: 5-600 seconds
- Codecs: mp3, aac, opus, wav, flac
- Sample rate: 22050-96000 Hz

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Remotion 4.x |
| Runtime | Node.js 20+ |
| UI | React 18 + TypeScript |
| Animation | Framer Motion + Remotion Spring |
| Styling | Tailwind CSS |
| Video | FFmpeg |
| Image | Sharp + Canvas |
| Container | Docker |

## Integration

Receives `manifest.json` (status: `rendering`) from the orchestrator, renders all assets, and returns updated manifest (status: `uploading`) with populated `assets` URLs.

```
orchestrator                         video-renderer
     │                                     │
     │ manifest.json (status: rendering)   │
     │ ─────────────────────────────────> │
     │                                     │ render
     │ manifest.json (status: uploading)   │
     │ <───────────────────────────────── │
     │  + assets.video_url                 │
     │  + assets.shorts_urls               │
     │  + assets.thumbnail_url             │
```

## Recent Updates (Feb 2026)

- **Early Manifest Validation**: Fail fast before expensive bundling
- **Restored manifest-parser.ts**: Fixed missing file after git issue
- **Integration Test Fix**: Use Bun instead of ts-node for ESM compatibility

---

*Part of the [YT-Factory](../docs/SETUP.md) YouTube automation ecosystem*
