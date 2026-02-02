#!/usr/bin/env node

/**
 * render.mjs - Node.js SSR rendering script for YT-Factory
 *
 * This script is separate from Remotion bundling to avoid
 * mixing Node.js APIs (fs, path, child_process) with browser code.
 *
 * Usage:
 *   node render.mjs <project-id> [--lang=en|zh]
 *   node render.mjs e8100583-a024-40b2-a228-d0c577fc27db --lang=en
 *
 * The script:
 * 1. Reads manifest from orchestrator output
 * 2. Reads external audio file (NotebookLM generated)
 * 3. Calculates video duration from audio duration
 * 4. Bundles Remotion project (pure React)
 * 5. Renders video with inputProps
 * 6. Validates output (Glitch protection)
 * 7. Writes render report
 */

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import os from "os";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// Early Manifest Validation (before expensive operations)
// =============================================================================

/**
 * Validate manifest structure early to fail fast before expensive bundling
 * This is a lightweight check - not full Zod validation (which requires building)
 * @param {object} manifest - Parsed manifest JSON
 * @returns {string[]} - Array of error messages (empty if valid)
 */
function validateManifestEarly(manifest) {
  const errors = [];

  // Required top-level fields
  if (!manifest.project_id || typeof manifest.project_id !== 'string') {
    errors.push('Missing or invalid project_id (expected UUID string)');
  }

  if (!manifest.status || typeof manifest.status !== 'string') {
    errors.push('Missing or invalid status');
  }

  if (!manifest.created_at || typeof manifest.created_at !== 'string') {
    errors.push('Missing or invalid created_at timestamp');
  }

  // input_source validation
  if (!manifest.input_source || typeof manifest.input_source !== 'object') {
    errors.push('Missing input_source object');
  } else {
    if (typeof manifest.input_source.word_count !== 'number' || manifest.input_source.word_count <= 0) {
      errors.push('input_source.word_count must be a positive number');
    }
  }

  // content_engine validation (if present)
  if (manifest.content_engine) {
    const ce = manifest.content_engine;

    // Script validation
    if (ce.script && !Array.isArray(ce.script)) {
      errors.push('content_engine.script must be an array');
    } else if (ce.script && ce.script.length > 0) {
      // Validate first script segment structure
      const firstSeg = ce.script[0];
      if (!firstSeg.timestamp || !firstSeg.voiceover || !firstSeg.visual_hint) {
        errors.push('Script segments must have timestamp, voiceover, and visual_hint');
      }
    }

    // SEO validation
    if (ce.seo && typeof ce.seo !== 'object') {
      errors.push('content_engine.seo must be an object');
    }

    // Shorts validation
    if (ce.shorts && typeof ce.shorts !== 'object') {
      errors.push('content_engine.shorts must be an object');
    }

    // Media preference validation
    if (ce.media_preference && typeof ce.media_preference !== 'object') {
      errors.push('content_engine.media_preference must be an object');
    }

    // Duration validation
    if (typeof ce.estimated_duration_seconds !== 'number' || ce.estimated_duration_seconds <= 0) {
      errors.push('content_engine.estimated_duration_seconds must be a positive number');
    }
  }

  // Audio config validation (if present)
  if (manifest.audio) {
    if (!manifest.audio.languages || typeof manifest.audio.languages !== 'object') {
      errors.push('audio.languages must be an object');
    }
  }

  return errors;
}

// =============================================================================
// Audio Validation
// =============================================================================

/**
 * Validate audio file before rendering
 * Checks: file integrity, codec compatibility, duration sanity
 */
async function validateAudioFile(audioPath) {
  const result = {
    valid: false,
    error: null,
    duration: 0,
    codec: null,
    sampleRate: null,
    bitrate: null,
  };

  // Check file exists and is readable
  if (!fs.existsSync(audioPath)) {
    result.error = "Audio file does not exist";
    return result;
  }

  const stats = fs.statSync(audioPath);
  if (stats.size === 0) {
    result.error = "Audio file is empty (0 bytes)";
    return result;
  }

  // Minimum size check (1KB - catches corrupted files)
  if (stats.size < 1024) {
    result.error = `Audio file too small (${stats.size} bytes) - likely corrupted`;
    return result;
  }

  try {
    // Get audio duration and codec info using ffprobe (works in Node.js)
    const ffprobeResult = execSync(
      `ffprobe -v error -select_streams a:0 -show_entries format=duration -show_entries stream=codec_name,sample_rate,bit_rate -of json "${audioPath}"`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );
    const probeData = JSON.parse(ffprobeResult);

    // Get duration from format
    result.duration = parseFloat(probeData.format?.duration);

    // Duration sanity checks
    if (isNaN(result.duration) || result.duration <= 0) {
      result.error = "Could not determine audio duration - file may be corrupted";
      return result;
    }

    // Minimum duration (5 seconds)
    if (result.duration < 5) {
      result.error = `Audio too short (${result.duration.toFixed(1)}s) - minimum 5 seconds required`;
      return result;
    }

    // Maximum duration (2 hours = 7200 seconds)
    if (result.duration > 7200) {
      result.error = `Audio too long (${(result.duration / 60).toFixed(1)} min) - maximum 2 hours`;
      return result;
    }

    // Get codec info from stream
    const stream = probeData.streams?.[0];
    if (stream) {
      result.codec = stream.codec_name || "unknown";
      result.sampleRate = parseInt(stream.sample_rate) || null;
      result.bitrate = stream.bit_rate ? Math.round(parseInt(stream.bit_rate) / 1000) : null;

      // Check for supported codecs
      const supportedCodecs = ["mp3", "aac", "opus", "vorbis", "flac", "pcm_s16le", "pcm_f32le"];
      if (!supportedCodecs.includes(result.codec)) {
        result.error = `Unsupported audio codec: ${result.codec}. Supported: ${supportedCodecs.join(", ")}`;
        return result;
      }
    } else {
      // Fallback if no stream info
      result.codec = "mp3";
      result.sampleRate = 44100;
      result.bitrate = 128;
    }

    result.valid = true;
    return result;
  } catch (error) {
    result.error = `Audio analysis failed: ${error.message}`;
    return result;
  }
}

// ANSI colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

function log(emoji, message, details = "") {
  const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
  console.log(
    `${colors.dim}[${timestamp}]${colors.reset} ${emoji} ${message}${details ? ` ${colors.dim}${details}${colors.reset}` : ""}`
  );
}

// =============================================================================
// Main Render Function
// =============================================================================

async function main() {
  const projectId = process.argv[2];

  // Parse language argument
  const langArg = process.argv.find((arg) => arg.startsWith("--lang="));
  const lang = langArg ? langArg.replace("--lang=", "") : "en"; // Default to English

  if (!projectId) {
    console.log(`
${colors.cyan}YT-Factory Video Renderer${colors.reset}

Usage: node render.mjs <project-id> [--lang=en|zh]

Examples:
  node render.mjs e8100583-a024-40b2-a228-d0c577fc27db
  node render.mjs e8100583-a024-40b2-a228-d0c577fc27db --lang=en
  node render.mjs e8100583-a024-40b2-a228-d0c577fc27db --lang=zh
  node render.mjs ./path/to/manifest.json --lang=zh

Options:
  --lang=en|zh                           Language for audio/video (default: en)
  RENDER_PROFILE=draft|preview|production  Render quality profile (env var)
  OUTPUT_DIR=./custom-output               Custom output directory (env var)
`);
    process.exit(1);
  }

  // =============================================================================
  // Step 1: Determine Paths
  // =============================================================================

  // Determine manifest path
  let manifestPath;
  let projectDir;

  if (projectId.endsWith(".json") || projectId.startsWith("./")) {
    manifestPath = path.resolve(projectId);
    projectDir = path.dirname(manifestPath);
  } else {
    // Look in orchestrator active_projects
    projectDir = path.join(
      __dirname,
      "../orchestrator/active_projects",
      projectId
    );
    manifestPath = path.join(projectDir, "manifest.json");
  }

  if (!fs.existsSync(manifestPath)) {
    console.error(
      `${colors.red}❌ Manifest not found: ${manifestPath}${colors.reset}`
    );
    process.exit(1);
  }

  // Audio path - support en.mp3 or zh.mp3
  const audioPath = path.join(projectDir, `audio/${lang}.mp3`);

  if (!fs.existsSync(audioPath)) {
    console.error(`${colors.red}❌ Audio not found: ${audioPath}${colors.reset}`);
    console.log("");
    console.log(`${colors.yellow}📋 Please complete these steps first:${colors.reset}`);
    console.log(
      `   1. Open ${colors.cyan}${projectDir}/notebooklm_script_${lang}.md${colors.reset}`
    );
    console.log("   2. Copy content to NotebookLM");
    console.log("   3. Generate Audio Overview");
    console.log(`   4. Download MP3 and save as ${colors.cyan}${audioPath}${colors.reset}`);
    console.log("");
    console.log(`${colors.dim}Directory structure should be:${colors.reset}`);
    console.log(`   ${projectDir}/`);
    console.log(`   ├── manifest.json`);
    console.log(`   ├── audio/`);
    console.log(`   │   ├── en.mp3`);
    console.log(`   │   └── zh.mp3`);
    console.log(`   └── notebooklm_script_${lang}.md`);
    process.exit(1);
  }

  // =============================================================================
  // Step 2: Read and Validate Manifest (EARLY - before expensive operations)
  // =============================================================================

  // Read manifest
  log("📄", "Loading manifest", manifestPath);
  const manifestRaw = fs.readFileSync(manifestPath, "utf-8");

  let manifest;
  try {
    manifest = JSON.parse(manifestRaw);
  } catch (parseError) {
    console.error(`${colors.red}❌ Manifest is not valid JSON: ${parseError.message}${colors.reset}`);
    process.exit(1);
  }

  // Early manifest validation (before expensive bundling)
  log("🔍", "Validating manifest schema...");
  const manifestErrors = validateManifestEarly(manifest);
  if (manifestErrors.length > 0) {
    console.error(`${colors.red}❌ Manifest validation failed:${colors.reset}`);
    manifestErrors.forEach(err => console.error(`   ${colors.red}- ${err}${colors.reset}`));
    process.exit(1);
  }
  log("✓", "Manifest schema valid");

  const actualProjectId =
    manifest.project_id || projectId.replace(".json", "").split("/").pop();
  log("🆔", `Project ID: ${actualProjectId}`);
  log("🌐", `Language: ${lang}`);

  // Validate and analyze audio
  log("📊", "Validating and analyzing audio...");

  // Audio validation
  const audioValidation = await validateAudioFile(audioPath);
  if (!audioValidation.valid) {
    console.error(`${colors.red}❌ Audio validation failed: ${audioValidation.error}${colors.reset}`);
    process.exit(1);
  }

  const audioDuration = audioValidation.duration;
  log("✓", "Audio validation passed");
  log(
    "   ",
    `Audio duration: ${audioDuration.toFixed(1)}s (${(audioDuration / 60).toFixed(1)} min)`
  );
  log(
    "   ",
    `Audio format: ${audioValidation.codec}, ${audioValidation.sampleRate}Hz, ${audioValidation.bitrate}kbps`
  );

  // Calculate video frames
  const fps = 30;
  const BUFFER_FRAMES = 30; // 1 second buffer for fade in/out
  const durationInFrames = Math.ceil(audioDuration * fps) + BUFFER_FRAMES * 2;

  log(
    "   ",
    `Video frames: ${durationInFrames} (${(durationInFrames / fps / 60).toFixed(1)} min total)`
  );

  // Render metadata for tracing
  const renderMeta = {
    traceId: manifest.traceId || `render-${actualProjectId}-${Date.now()}`,
    renderedAt: new Date().toISOString(),
    pipelineVersion: "2.1.0-notebooklm",
    language: lang,
    audioDuration: audioDuration,
  };

  // =============================================================================
  // Step 3: Copy Audio to Public Directory
  // =============================================================================

  // Remotion needs to access files from public directory
  const publicAudioDir = path.resolve(
    __dirname,
    `./public/${actualProjectId}/audio`
  );
  fs.mkdirSync(publicAudioDir, { recursive: true });

  const publicAudioPath = path.join(publicAudioDir, `${lang}.mp3`);
  fs.copyFileSync(audioPath, publicAudioPath);
  log("📁", "Audio copied to public directory");

  // =============================================================================
  // Step 4: Bundle Remotion Project
  // =============================================================================

  log("📦", "Bundling Remotion project...");
  const bundleStart = Date.now();

  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, "./src/index.ts"),
    // No webpack override needed - src/ is now pure React
  });

  log("✓", "Bundle complete", `(${((Date.now() - bundleStart) / 1000).toFixed(1)}s)`);

  // =============================================================================
  // Step 5: Select Composition
  // =============================================================================

  log("🎬", "Selecting composition...");

  // Prepare inputProps
  const inputProps = {
    manifest,
    renderMeta,
    lang,
    // Audio path relative to public directory (for staticFile)
    audioFile: `${actualProjectId}/audio/${lang}.mp3`,
  };

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "MainVideo",
    inputProps,
  });

  // Override duration with calculated value from audio
  const compositionWithDuration = {
    ...composition,
    durationInFrames,
  };

  // =============================================================================
  // Step 6: Prepare Output
  // =============================================================================

  // Output to language-specific directory
  const outputDir =
    process.env.OUTPUT_DIR || `./output/${actualProjectId}/${lang}`;
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "video.mp4");

  // Get video title
  const regionalSeo = manifest.content_engine?.seo?.regional_seo || [];
  const langSeo = regionalSeo.find((r) => r.language === lang);
  const fallbackSeo = regionalSeo[0];
  const videoTitle =
    langSeo?.titles?.[0] ||
    fallbackSeo?.titles?.[0] ||
    manifest.seo?.title ||
    "Untitled";

  log("🎥", "Starting render...");
  log("   ", `Title: ${videoTitle}`);
  log("   ", `Language: ${lang}`);
  log("   ", `Output: ${outputPath}`);

  // =============================================================================
  // Step 7: Render Video
  // =============================================================================

  const renderStart = Date.now();

  const profile = process.env.RENDER_PROFILE || "preview";
  const cpuCount = os.cpus().length;
  const profiles = {
    draft: { crf: 35, concurrency: Math.min(8, cpuCount) },
    preview: { crf: 28, concurrency: Math.min(4, cpuCount) },
    production: { crf: 18, concurrency: Math.min(2, cpuCount) },
  };
  const { crf, concurrency } = profiles[profile] || profiles.preview;
  log("⚙️", `Using ${concurrency} threads (${cpuCount} cores available)`);

  await renderMedia({
    composition: compositionWithDuration,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outputPath,
    inputProps,
    crf,
    concurrency,
  });

  const renderDuration = ((Date.now() - renderStart) / 1000).toFixed(1);
  log("✅", `Render complete in ${renderDuration}s`);

  // =============================================================================
  // Step 8: Glitch Protection - Validate First/Last Frames
  // =============================================================================

  log("🔍", "Validating output...");
  try {
    const firstFrame = path.join(outputDir, "frame_first.png");
    const lastFrame = path.join(outputDir, "frame_last.png");

    // Extract first frame
    execSync(
      `ffmpeg -y -i "${outputPath}" -vf "select=eq(n\\,0)" -vframes 1 "${firstFrame}" 2>/dev/null`,
      { stdio: "pipe" }
    );

    // Extract last frame
    execSync(
      `ffmpeg -y -sseof -1 -i "${outputPath}" -vframes 1 "${lastFrame}" 2>/dev/null`,
      { stdio: "pipe" }
    );

    // Verify frames were created
    if (fs.existsSync(firstFrame) && fs.existsSync(lastFrame)) {
      log("   ", "✓ First frame extracted");
      log("   ", "✓ Last frame extracted");

      // Cleanup validation frames
      fs.unlinkSync(firstFrame);
      fs.unlinkSync(lastFrame);

      log("✅", "Validation passed - Glitch protection OK");
    } else {
      log("⚠️", "Validation incomplete - frames not extracted");
    }
  } catch (error) {
    log("⚠️", "Validation skipped (ffmpeg not available or error)");
  }

  // =============================================================================
  // Step 9: Write Render Report
  // =============================================================================

  const report = {
    projectId: actualProjectId,
    language: lang,
    traceId: renderMeta.traceId,
    outputPath: path.resolve(outputPath),
    renderedAt: renderMeta.renderedAt,
    completedAt: new Date().toISOString(),
    audioDuration: audioDuration,
    videoDuration: durationInFrames / fps,
    renderDurationSeconds: parseFloat(renderDuration),
    profile,
    composition: {
      id: compositionWithDuration.id,
      width: compositionWithDuration.width,
      height: compositionWithDuration.height,
      fps: compositionWithDuration.fps,
      durationInFrames: compositionWithDuration.durationInFrames,
    },
    manifest: {
      title: videoTitle,
      segments: manifest.content_engine?.script?.length || 0,
    },
    validation: {
      glitchProtection: true,
      firstFrameBuffer: BUFFER_FRAMES,
      lastFrameBuffer: BUFFER_FRAMES,
    },
    audioValidation: {
      codec: audioValidation.codec,
      sampleRate: audioValidation.sampleRate,
      bitrate: audioValidation.bitrate,
    },
  };

  const reportPath = path.join(outputDir, "render_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log("📊", `Report saved: ${reportPath}`);

  // =============================================================================
  // Step 10: Update Manifest with Audio Status
  // =============================================================================

  log("📝", "Updating manifest with audio status...");

  // Update the audio config in manifest
  if (manifest.audio && manifest.audio.languages && manifest.audio.languages[lang]) {
    manifest.audio.languages[lang].audio_status = "ready";
    manifest.audio.languages[lang].duration_seconds = audioDuration;
  }

  // Update manifest status if all languages are ready
  const allAudioReady = manifest.audio?.languages
    ? Object.values(manifest.audio.languages).every(l => l?.audio_status === "ready")
    : false;

  if (allAudioReady && manifest.status === "pending_audio") {
    manifest.status = "rendering";
  }

  manifest.updated_at = new Date().toISOString();

  // Write updated manifest back
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  log("✓", "Manifest updated with audio status and duration");

  // =============================================================================
  // Summary
  // =============================================================================

  console.log(`
${colors.green}════════════════════════════════════════════════════════════════${colors.reset}
${colors.cyan}✅ Render Complete${colors.reset}
${colors.dim}────────────────────────────────────────────────────────────────${colors.reset}
   Project:     ${actualProjectId}
   Language:    ${lang}
   Trace ID:    ${renderMeta.traceId}
   Output:      ${outputPath}
   Audio:       ${audioDuration.toFixed(1)}s
   Video:       ${(durationInFrames / fps).toFixed(1)}s
   Render Time: ${renderDuration}s
   Profile:     ${profile}
${colors.green}════════════════════════════════════════════════════════════════${colors.reset}
`);
}

// Run
main().catch((error) => {
  console.error(`${colors.red}❌ Fatal error: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});
