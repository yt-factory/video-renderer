#!/usr/bin/env node

/**
 * audio-processor.mjs - Audio post-processing for YT-Factory
 *
 * Normalizes loudness to -14 LUFS (YouTube standard), trims silence,
 * and validates quality. Runs before render.mjs.
 *
 * Usage:
 *   node audio-processor.mjs <project-id> [--lang=en] [--music=ambient]
 *   node audio-processor.mjs e8100583-a024-40b2-a228-d0c577fc27db --lang=en
 *   node audio-processor.mjs ./path/to/project --lang=zh
 */

import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// ANSI colors for console output (same pattern as render.mjs)
// =============================================================================

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
// Audio Validation (same pattern as render.mjs)
// =============================================================================

/**
 * Validate audio file before processing.
 * Checks: file existence, size, codec, duration, sample rate.
 */
function validateAudioFile(audioPath) {
  const result = {
    valid: false,
    error: null,
    duration: 0,
    codec: null,
    sampleRate: null,
    bitrate: null,
  };

  if (!fs.existsSync(audioPath)) {
    result.error = "Audio file does not exist";
    return result;
  }

  const stats = fs.statSync(audioPath);
  if (stats.size === 0) {
    result.error = "Audio file is empty (0 bytes)";
    return result;
  }

  if (stats.size < 1024) {
    result.error = `Audio file too small (${stats.size} bytes) - likely corrupted`;
    return result;
  }

  try {
    const ffprobeResult = execSync(
      `ffprobe -v error -select_streams a:0 -show_entries format=duration -show_entries stream=codec_name,sample_rate,bit_rate -of json "${audioPath}"`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );
    const probeData = JSON.parse(ffprobeResult);

    result.duration = parseFloat(probeData.format?.duration);

    if (isNaN(result.duration) || result.duration <= 0) {
      result.error = "Could not determine audio duration - file may be corrupted";
      return result;
    }

    if (result.duration < 5) {
      result.error = `Audio too short (${result.duration.toFixed(1)}s) - minimum 5 seconds required`;
      return result;
    }

    if (result.duration > 7200) {
      result.error = `Audio too long (${(result.duration / 60).toFixed(1)} min) - maximum 2 hours`;
      return result;
    }

    const stream = probeData.streams?.[0];
    if (stream) {
      result.codec = stream.codec_name || "unknown";
      result.sampleRate = parseInt(stream.sample_rate) || null;
      result.bitrate = stream.bit_rate ? Math.round(parseInt(stream.bit_rate) / 1000) : null;

      const supportedCodecs = ["mp3", "aac", "opus", "vorbis", "flac", "pcm_s16le", "pcm_f32le"];
      if (!supportedCodecs.includes(result.codec)) {
        result.error = `Unsupported audio codec: ${result.codec}. Supported: ${supportedCodecs.join(", ")}`;
        return result;
      }
    } else {
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

// =============================================================================
// Loudness Analysis
// =============================================================================

/**
 * Extract loudnorm result fields from a parsed JSON object.
 * Returns null if any required field is missing or not a finite number.
 */
function extractLoudnormResult(data) {
  const REQUIRED_KEYS = [
    "input_i", "input_tp", "input_lra", "input_thresh", "target_offset",
    "output_i", "output_tp", "output_lra", "output_thresh",
  ];

  const result = { error: null };
  for (const key of REQUIRED_KEYS) {
    const val = parseFloat(data[key]);
    if (!isFinite(val)) return null;
    result[key] = val;
  }
  return result;
}

/**
 * Try to parse loudnorm JSON from ffmpeg output text.
 *
 * Strategy 1: regex for the last JSON object containing "input_i".
 * Strategy 2: line-by-line scan for key=value or "key" : "value" pairs.
 *
 * Returns the parsed result object or null on failure.
 */
function parseLoudnormOutput(text) {
  if (!text) return null;

  // --- Strategy 1: Find the last JSON block that contains "input_i" ---
  // Collect all top-level {...} matches, pick the one with "input_i"
  const jsonBlocks = [];
  const blockRegex = /\{[^{}]*\}/gs;
  let m;
  while ((m = blockRegex.exec(text)) !== null) {
    if (m[0].includes("input_i")) {
      jsonBlocks.push(m[0]);
    }
  }

  // Try the last matching block first (most likely the real output)
  for (let i = jsonBlocks.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(jsonBlocks[i]);
      const result = extractLoudnormResult(parsed);
      if (result) return result;
    } catch {
      // Malformed JSON, try next candidate
    }
  }

  // --- Strategy 2: Line-by-line key:value / key=value scan ---
  const kvMap = {};
  const lines = text.split("\n");
  for (const line of lines) {
    // Match patterns like:  "input_i" : "-24.2"  or  input_i=-24.2
    const jsonKv = line.match(/"?(input_i|input_tp|input_lra|input_thresh|target_offset|output_i|output_tp|output_lra|output_thresh)"?\s*[:=]\s*"?(-?[\d.]+)"?/);
    if (jsonKv) {
      kvMap[jsonKv[1]] = jsonKv[2];
    }
  }

  if (Object.keys(kvMap).length >= 5) {
    const result = extractLoudnormResult(kvMap);
    if (result) return result;
  }

  return null;
}

/**
 * Analyze loudness using ffmpeg loudnorm filter (first pass).
 * Returns integrated loudness, true peak, loudness range, and threshold.
 */
function analyzeLoudness(audioPath) {
  try {
    const output = execSync(
      `ffmpeg -i "${audioPath}" -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null /dev/null 2>&1`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], maxBuffer: 10 * 1024 * 1024 }
    );

    const result = parseLoudnormOutput(output);
    if (result) return result;

    return {
      error: "Could not parse loudnorm JSON from ffmpeg output. "
        + "Expected a JSON block with 'input_i' key. "
        + "Raw output tail: " + (output || "").slice(-300),
    };
  } catch (error) {
    // ffmpeg writes to stderr, so execSync may throw even on success.
    // Try to parse stdout/stderr from the error object.
    const combinedOutput = (error.stdout || "") + (error.stderr || "");
    const result = parseLoudnormOutput(combinedOutput);
    if (result) return result;

    return {
      error: `Loudness analysis failed: ${error.message}. `
        + "Could not find loudnorm JSON in ffmpeg output. "
        + "Ensure ffmpeg is installed and the audio file is valid.",
    };
  }
}

// =============================================================================
// Two-Pass Loudness Normalization
// =============================================================================

/**
 * Normalize audio to -14 LUFS using two-pass loudnorm.
 * Pass 1: Analyze (already done via analyzeLoudness).
 * Pass 2: Apply measured values for precise normalization.
 */
function normalizeLoudness(inputPath, outputPath, analysisData) {
  try {
    const { input_i, input_tp, input_lra, input_thresh, target_offset } = analysisData;

    const af = [
      `loudnorm=I=-14:TP=-1:LRA=11`,
      `measured_I=${input_i}`,
      `measured_TP=${input_tp}`,
      `measured_LRA=${input_lra}`,
      `measured_thresh=${input_thresh}`,
      `offset=${target_offset}`,
      `linear=true`,
      `print_format=summary`,
    ].join(":");

    execSync(
      `ffmpeg -y -i "${inputPath}" -af "${af}" -ar 44100 "${outputPath}"`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], maxBuffer: 10 * 1024 * 1024 }
    );

    return { error: null };
  } catch (error) {
    return { error: `Loudness normalization failed: ${error.message}` };
  }
}

// =============================================================================
// Silence Trimming
// =============================================================================

/**
 * Trim leading and trailing silence from audio.
 * Uses the forward-reverse-forward silenceremove trick.
 */
function trimSilence(inputPath, outputPath) {
  try {
    const af = [
      "silenceremove=start_periods=1:start_silence=0.3:start_threshold=-50dB",
      "areverse",
      "silenceremove=start_periods=1:start_silence=0.3:start_threshold=-50dB",
      "areverse",
    ].join(",");

    execSync(
      `ffmpeg -y -i "${inputPath}" -af "${af}" "${outputPath}"`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], maxBuffer: 10 * 1024 * 1024 }
    );

    return { error: null };
  } catch (error) {
    return { error: `Silence trimming failed: ${error.message}` };
  }
}

// =============================================================================
// Main Processing Pipeline
// =============================================================================

async function main() {
  const projectId = process.argv[2];

  // Parse --lang argument
  const langArg = process.argv.find((arg) => arg.startsWith("--lang="));
  const lang = langArg ? langArg.replace("--lang=", "") : "en";

  // Parse --music argument (reserved for future use)
  const musicArg = process.argv.find((arg) => arg.startsWith("--music="));
  const music = musicArg ? musicArg.replace("--music=", "") : null;

  // Validate language
  const SUPPORTED_LANGUAGES = ["en", "zh"];
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    console.error(
      `${colors.red}Unsupported language: "${lang}". Supported: ${SUPPORTED_LANGUAGES.join(", ")}${colors.reset}`
    );
    process.exit(1);
  }

  if (!projectId) {
    console.log(`
${colors.cyan}YT-Factory Audio Processor${colors.reset}

Usage: node audio-processor.mjs <project-id> [--lang=en|zh] [--music=ambient]

Examples:
  node audio-processor.mjs e8100583-a024-40b2-a228-d0c577fc27db
  node audio-processor.mjs e8100583-a024-40b2-a228-d0c577fc27db --lang=en
  node audio-processor.mjs e8100583-a024-40b2-a228-d0c577fc27db --lang=zh
  node audio-processor.mjs ./path/to/project --lang=zh

Options:
  --lang=en|zh       Language for audio processing (default: en)
  --music=ambient    Background music track (reserved for future use)
`);
    process.exit(1);
  }

  // ===========================================================================
  // Step 1: Determine Paths (same pattern as render.mjs)
  // ===========================================================================

  let projectDir;

  if (projectId.endsWith(".json") || projectId.startsWith("./") || projectId.startsWith("/")) {
    projectDir = path.resolve(projectId.endsWith(".json") ? path.dirname(projectId) : projectId);
  } else {
    projectDir = path.join(
      __dirname,
      "../orchestrator/active_projects",
      projectId
    );
  }

  if (!fs.existsSync(projectDir)) {
    console.error(`${colors.red}Project directory not found: ${projectDir}${colors.reset}`);
    process.exit(1);
  }

  const audioDir = path.join(projectDir, "audio");
  const inputAudioPath = path.join(audioDir, `${lang}.mp3`);
  const normalizedTempPath = path.join(audioDir, `${lang}.normalized.tmp.mp3`);
  const processedAudioPath = path.join(audioDir, `${lang}.processed.mp3`);
  const qualityReportPath = path.join(audioDir, `${lang}.quality.json`);

  log("🎵", "YT-Factory Audio Processor");
  log("📂", "Project directory:", projectDir);
  log("🌐", `Language: ${lang}`);
  if (music) {
    log("🎶", `Music track: ${music} (not yet implemented)`);
  }

  // ===========================================================================
  // Step 2: Validate Input Audio
  // ===========================================================================

  log("🔍", "Validating input audio...");
  const validation = validateAudioFile(inputAudioPath);

  if (!validation.valid) {
    console.error(`${colors.red}Audio validation failed: ${validation.error}${colors.reset}`);
    console.log("");
    console.log(`${colors.yellow}Expected audio file at: ${inputAudioPath}${colors.reset}`);
    process.exit(1);
  }

  log("✓", "Audio validation passed");
  log("   ", `Duration: ${validation.duration.toFixed(1)}s (${(validation.duration / 60).toFixed(1)} min)`);
  log("   ", `Format: ${validation.codec}, ${validation.sampleRate}Hz, ${validation.bitrate}kbps`);

  const beforeDuration = validation.duration;

  // ===========================================================================
  // Step 3: Analyze Loudness (Pass 1)
  // ===========================================================================

  log("📊", "Analyzing loudness (pass 1)...");
  const analysis = analyzeLoudness(inputAudioPath);

  if (analysis.error) {
    console.error(`${colors.red}Loudness analysis failed: ${analysis.error}${colors.reset}`);
    process.exit(1);
  }

  log("✓", "Loudness analysis complete");
  log("   ", `Integrated loudness: ${analysis.input_i.toFixed(1)} LUFS`);
  log("   ", `True peak: ${analysis.input_tp.toFixed(1)} dBTP`);
  log("   ", `Loudness range: ${analysis.input_lra.toFixed(1)} LU`);

  // ===========================================================================
  // Step 4: Normalize to -14 LUFS (Pass 2)
  // ===========================================================================

  log("🔧", "Normalizing loudness to -14 LUFS (pass 2)...");
  const normResult = normalizeLoudness(inputAudioPath, normalizedTempPath, analysis);

  if (normResult.error) {
    console.error(`${colors.red}${normResult.error}${colors.reset}`);
    // Clean up temp file on failure
    if (fs.existsSync(normalizedTempPath)) {
      fs.unlinkSync(normalizedTempPath);
    }
    process.exit(1);
  }

  log("✓", "Loudness normalization complete");

  // ===========================================================================
  // Step 5: Trim Leading/Trailing Silence
  // ===========================================================================

  log("✂️", "Trimming leading/trailing silence...");
  const trimResult = trimSilence(normalizedTempPath, processedAudioPath);

  // Clean up temp normalized file regardless of trim result
  if (fs.existsSync(normalizedTempPath)) {
    fs.unlinkSync(normalizedTempPath);
  }

  if (trimResult.error) {
    console.error(`${colors.red}${trimResult.error}${colors.reset}`);
    process.exit(1);
  }

  log("✓", "Silence trimming complete");

  // ===========================================================================
  // Step 6: Quality Checks on Processed File
  // ===========================================================================

  log("🔍", "Running quality checks on processed audio...");

  const processedValidation = validateAudioFile(processedAudioPath);
  if (!processedValidation.valid) {
    console.error(`${colors.red}Processed audio validation failed: ${processedValidation.error}${colors.reset}`);
    process.exit(1);
  }

  const afterDuration = processedValidation.duration;
  const trimmedSeconds = beforeDuration - afterDuration;

  log("   ", `Processed duration: ${afterDuration.toFixed(1)}s (trimmed ${trimmedSeconds.toFixed(1)}s)`);

  // Re-analyze loudness on the processed file
  const postAnalysis = analyzeLoudness(processedAudioPath);

  let afterLufs = null;
  let afterTruePeak = null;
  let afterLra = null;
  let clippingDetected = false;
  let lowVolumeWarning = false;

  if (!postAnalysis.error) {
    afterLufs = postAnalysis.input_i;
    afterTruePeak = postAnalysis.input_tp;
    afterLra = postAnalysis.input_lra;

    log("   ", `Processed loudness: ${afterLufs.toFixed(1)} LUFS (target: -14.0)`);
    log("   ", `Processed true peak: ${afterTruePeak.toFixed(1)} dBTP`);

    // Check for clipping (true peak > -0.5 dBTP)
    clippingDetected = afterTruePeak > -0.5;
    if (clippingDetected) {
      log("⚠️", `Clipping detected! True peak ${afterTruePeak.toFixed(1)} dBTP exceeds -0.5 dBTP`);
    }

    // Check loudness is near -14 LUFS (within 1 LUFS tolerance)
    lowVolumeWarning = afterLufs < -15;
    if (lowVolumeWarning) {
      log("⚠️", `Loudness ${afterLufs.toFixed(1)} LUFS is below -15 LUFS target range`);
    }

    // Check loudness is within acceptable range
    if (afterLufs >= -15 && afterLufs <= -13) {
      log("✓", "Loudness within target range (-15 to -13 LUFS)");
    }
  } else {
    log("⚠️", "Post-processing loudness analysis failed - skipping quality verification");
  }

  // Duration sanity check
  const durationValid = afterDuration >= 5 && afterDuration <= 7200;
  if (!durationValid) {
    log("⚠️", `Processed duration ${afterDuration.toFixed(1)}s outside valid range (5s - 7200s)`);
  }

  // ===========================================================================
  // Step 7: Write Quality Report
  // ===========================================================================

  const qualityReport = {
    source: `${lang}.mp3`,
    output: `${lang}.processed.mp3`,
    processedAt: new Date().toISOString(),
    processing: {
      loudness_normalization: {
        before_lufs: analysis.input_i,
        after_lufs: afterLufs,
        target_lufs: -14,
      },
      silence_trimmed: {
        before_duration: parseFloat(beforeDuration.toFixed(3)),
        after_duration: parseFloat(afterDuration.toFixed(3)),
        trimmed_seconds: parseFloat(trimmedSeconds.toFixed(3)),
      },
      background_music: {
        applied: false,
        track: music || null,
      },
      true_peak: afterTruePeak,
      loudness_range: afterLra,
    },
    quality_checks: {
      clipping_detected: clippingDetected,
      low_volume_warning: lowVolumeWarning,
      duration_valid: durationValid,
    },
  };

  fs.writeFileSync(qualityReportPath, JSON.stringify(qualityReport, null, 2));
  log("📊", `Quality report saved: ${qualityReportPath}`);

  // ===========================================================================
  // Step 8: Summary
  // ===========================================================================

  console.log(`
${colors.green}════════════════════════════════════════════════════════════════${colors.reset}
${colors.cyan}✅ Audio Processing Complete${colors.reset}
${colors.dim}────────────────────────────────────────────────────────────────${colors.reset}
   Language:      ${lang}
   Input:         ${inputAudioPath}
   Output:        ${processedAudioPath}
   Loudness:      ${analysis.input_i.toFixed(1)} -> ${afterLufs !== null ? afterLufs.toFixed(1) : "N/A"} LUFS (target: -14)
   True Peak:     ${analysis.input_tp.toFixed(1)} -> ${afterTruePeak !== null ? afterTruePeak.toFixed(1) : "N/A"} dBTP
   Duration:      ${beforeDuration.toFixed(1)}s -> ${afterDuration.toFixed(1)}s (trimmed ${trimmedSeconds.toFixed(1)}s)
   Clipping:      ${clippingDetected ? `${colors.yellow}YES${colors.reset}` : `${colors.green}No${colors.reset}`}
   Quality:       ${qualityReportPath}
${colors.green}════════════════════════════════════════════════════════════════${colors.reset}
`);
}

// Run
main().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});
