#!/usr/bin/env node

/**
 * pipeline.mjs - Unified render pipeline for YT-Factory
 *
 * Chains audio-processor.mjs and render.mjs into a single command.
 * No logic is duplicated - this script simply orchestrates the two
 * existing scripts as child processes.
 *
 * Usage:
 *   node pipeline.mjs <project-id> [--lang=en] [--skip-audio-processing] [--profile=preview]
 *   node pipeline.mjs <project-id> --all-langs
 *   node pipeline.mjs e8100583-a024-40b2-a228-d0c577fc27db --lang=zh --profile=production
 *
 * Examples:
 *   node pipeline.mjs e8100583-a024-40b2-a228-d0c577fc27db
 *   node pipeline.mjs e8100583-a024-40b2-a228-d0c577fc27db --lang=en --profile=draft
 *   node pipeline.mjs e8100583-a024-40b2-a228-d0c577fc27db --all-langs --profile=production
 *   node pipeline.mjs e8100583-a024-40b2-a228-d0c577fc27db --skip-audio-processing
 *   node pipeline.mjs ./path/to/project --lang=zh
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
  bold: "\x1b[1m",
};

function log(emoji, message, details = "") {
  const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
  console.log(
    `${colors.dim}[${timestamp}]${colors.reset} ${emoji} ${message}${details ? ` ${colors.dim}${details}${colors.reset}` : ""}`
  );
}

// =============================================================================
// CLI Argument Parsing
// =============================================================================

const SUPPORTED_LANGUAGES = ["en", "zh"];

function parseArgs() {
  const projectId = process.argv[2];

  const langArg = process.argv.find((arg) => arg.startsWith("--lang="));
  const lang = langArg ? langArg.replace("--lang=", "") : "en";

  const profileArg = process.argv.find((arg) => arg.startsWith("--profile="));
  const profile = profileArg
    ? profileArg.replace("--profile=", "")
    : process.env.RENDER_PROFILE || "preview";

  const skipAudioProcessing = process.argv.includes("--skip-audio-processing");
  const allLangs = process.argv.includes("--all-langs");

  return { projectId, lang, profile, skipAudioProcessing, allLangs };
}

// =============================================================================
// Path Resolution (same pattern as render.mjs)
// =============================================================================

function resolveProjectDir(projectId) {
  if (
    projectId.endsWith(".json") ||
    projectId.startsWith("./") ||
    projectId.startsWith("/")
  ) {
    return path.resolve(
      projectId.endsWith(".json") ? path.dirname(projectId) : projectId
    );
  }

  return path.join(__dirname, "../orchestrator/active_projects", projectId);
}

// =============================================================================
// Freshness Check
// =============================================================================

/**
 * Returns true when processed audio already exists and is newer than the
 * raw audio file, meaning audio processing can safely be skipped.
 */
function isProcessedAudioFresh(projectDir, lang) {
  const rawPath = path.join(projectDir, `audio/${lang}.mp3`);
  const processedPath = path.join(projectDir, `audio/${lang}.processed.mp3`);

  if (!fs.existsSync(processedPath)) {
    return false;
  }
  if (!fs.existsSync(rawPath)) {
    return false;
  }

  const rawStat = fs.statSync(rawPath);
  const processedStat = fs.statSync(processedPath);

  return processedStat.mtimeMs > rawStat.mtimeMs;
}

// =============================================================================
// Pipeline Runner (single language)
// =============================================================================

function runPipelineForLang(projectId, lang, profile, skipAudioProcessing) {
  const projectDir = resolveProjectDir(projectId);
  const rawAudioPath = path.join(projectDir, `audio/${lang}.mp3`);
  const langStart = Date.now();

  log("🌐", `Processing language: ${lang}`);

  // ---------------------------------------------------------------------------
  // Step 1: Audio Processing
  // ---------------------------------------------------------------------------

  const shouldSkipAudio =
    skipAudioProcessing || isProcessedAudioFresh(projectDir, lang);

  if (shouldSkipAudio) {
    const reason = skipAudioProcessing
      ? "--skip-audio-processing flag set"
      : "processed audio is newer than raw audio";
    log("⏭️", `Skipping audio processing (${reason})`);
  } else {
    if (!fs.existsSync(rawAudioPath)) {
      log(
        "⚠️",
        `Raw audio not found at ${rawAudioPath} - skipping audio processing`
      );
    } else {
      log("🎵", "Step 1: Audio Processing");
      const audioCmd = `node ${path.join(__dirname, "audio-processor.mjs")} ${projectId} --lang=${lang}`;
      try {
        execSync(audioCmd, { stdio: "inherit", cwd: __dirname });
      } catch (error) {
        console.error(
          `${colors.red}Audio processing failed for lang=${lang}: ${error.message}${colors.reset}`
        );
        process.exit(1);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Step 2: Video Rendering
  // ---------------------------------------------------------------------------

  log("🎬", "Step 2: Video Rendering");
  const renderCmd = `node ${path.join(__dirname, "render.mjs")} ${projectId} --lang=${lang}`;
  try {
    execSync(renderCmd, {
      stdio: "inherit",
      cwd: __dirname,
      env: { ...process.env, RENDER_PROFILE: profile },
    });
  } catch (error) {
    console.error(
      `${colors.red}Video rendering failed for lang=${lang}: ${error.message}${colors.reset}`
    );
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // Step 3: Timing summary for this language
  // ---------------------------------------------------------------------------

  const langElapsed = ((Date.now() - langStart) / 1000).toFixed(1);
  const processedAudioPath = path.join(
    projectDir,
    `audio/${lang}.processed.mp3`
  );
  const outputVideoDir =
    process.env.OUTPUT_DIR || path.join(projectDir, `output/${lang}`);

  return {
    lang,
    elapsedSeconds: langElapsed,
    audioOutput: fs.existsSync(processedAudioPath)
      ? processedAudioPath
      : rawAudioPath,
    videoOutputDir: outputVideoDir,
  };
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const { projectId, lang, profile, skipAudioProcessing, allLangs } =
    parseArgs();

  if (!projectId) {
    console.log(`
${colors.cyan}${colors.bold}YT-Factory Unified Render Pipeline${colors.reset}

Usage: node pipeline.mjs <project-id> [options]

Options:
  --lang=en|zh               Language (default: en)
  --all-langs                Process all supported languages (en, zh) sequentially
  --skip-audio-processing    Skip audio-processor.mjs step
  --profile=<name>           Render profile: draft, preview, production (default: preview)

Environment Variables:
  RENDER_PROFILE             Render profile override (same as --profile)
  OUTPUT_DIR                 Custom output directory

Examples:
  node pipeline.mjs e8100583-a024-40b2-a228-d0c577fc27db
  node pipeline.mjs e8100583-a024-40b2-a228-d0c577fc27db --lang=zh --profile=production
  node pipeline.mjs e8100583-a024-40b2-a228-d0c577fc27db --all-langs
  node pipeline.mjs e8100583-a024-40b2-a228-d0c577fc27db --skip-audio-processing
  node pipeline.mjs ./path/to/project --lang=zh
`);
    process.exit(1);
  }

  // Validate project directory exists
  const projectDir = resolveProjectDir(projectId);
  if (!fs.existsSync(projectDir)) {
    console.error(
      `${colors.red}Project directory not found: ${projectDir}${colors.reset}`
    );
    process.exit(1);
  }

  // Determine which languages to process
  const languages = allLangs ? SUPPORTED_LANGUAGES : [lang];

  // Validate language(s)
  for (const l of languages) {
    if (!SUPPORTED_LANGUAGES.includes(l)) {
      console.error(
        `${colors.red}Unsupported language: "${l}". Supported: ${SUPPORTED_LANGUAGES.join(", ")}${colors.reset}`
      );
      process.exit(1);
    }
  }

  const pipelineStart = Date.now();

  console.log(`
${colors.green}${colors.bold}================================================================${colors.reset}
${colors.cyan}${colors.bold}  YT-Factory Unified Render Pipeline${colors.reset}
${colors.green}${colors.bold}================================================================${colors.reset}
${colors.dim}  Project:    ${projectId}${colors.reset}
${colors.dim}  Languages:  ${languages.join(", ")}${colors.reset}
${colors.dim}  Profile:    ${profile}${colors.reset}
${colors.dim}  Audio:      ${skipAudioProcessing ? "SKIP" : "auto"}${colors.reset}
${colors.green}${colors.bold}================================================================${colors.reset}
`);

  // Run pipeline for each language
  const results = [];
  for (const currentLang of languages) {
    const result = runPipelineForLang(
      projectId,
      currentLang,
      profile,
      skipAudioProcessing
    );
    results.push(result);
  }

  // =============================================================================
  // Final Summary
  // =============================================================================

  const totalElapsed = ((Date.now() - pipelineStart) / 1000).toFixed(1);

  console.log(`
${colors.green}${colors.bold}================================================================${colors.reset}
${colors.cyan}${colors.bold}  Pipeline Complete${colors.reset}
${colors.dim}----------------------------------------------------------------${colors.reset}`);

  for (const r of results) {
    console.log(
      `${colors.dim}  [${r.lang}]${colors.reset} ${r.elapsedSeconds}s`
    );
    console.log(
      `${colors.dim}        Audio:  ${r.audioOutput}${colors.reset}`
    );
    console.log(
      `${colors.dim}        Video:  ${r.videoOutputDir}${colors.reset}`
    );
  }

  console.log(`${colors.dim}----------------------------------------------------------------${colors.reset}
${colors.bold}  Total time:  ${totalElapsed}s${colors.reset}
${colors.green}${colors.bold}================================================================${colors.reset}
`);
}

// Run
main().catch((error) => {
  console.error(
    `${colors.red}Fatal error: ${error.message}${colors.reset}`
  );
  console.error(error.stack);
  process.exit(1);
});
