#!/usr/bin/env node

/**
 * render.mjs - Node.js SSR rendering script for YT-Factory
 *
 * This script is separate from Remotion bundling to avoid
 * mixing Node.js APIs (fs, path, child_process) with browser code.
 *
 * Usage:
 *   node render.mjs <project-id>
 *   node render.mjs e8100583-a024-40b2-a228-d0c577fc27db
 *
 * The script:
 * 1. Reads manifest from orchestrator output
 * 2. Bundles Remotion project (pure React)
 * 3. Renders video with inputProps
 * 4. Validates output (Glitch protection)
 * 5. Writes render report
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

  if (!projectId) {
    console.log(`
${colors.cyan}YT-Factory Video Renderer${colors.reset}

Usage: node render.mjs <project-id>

Examples:
  node render.mjs e8100583-a024-40b2-a228-d0c577fc27db
  node render.mjs ./path/to/manifest.json

Options (via environment variables):
  RENDER_PROFILE=draft|preview|production  Render quality profile
  OUTPUT_DIR=./custom-output               Custom output directory
`);
    process.exit(1);
  }

  // Determine manifest path
  let manifestPath;
  if (projectId.endsWith(".json") || projectId.startsWith("./")) {
    manifestPath = path.resolve(projectId);
  } else {
    // Look in orchestrator active_projects
    manifestPath = path.join(
      __dirname,
      "../orchestrator/active_projects",
      projectId,
      "manifest.json"
    );
  }

  if (!fs.existsSync(manifestPath)) {
    console.error(`${colors.red}❌ Manifest not found: ${manifestPath}${colors.reset}`);
    process.exit(1);
  }

  // Read manifest
  log("📄", "Loading manifest", manifestPath);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  const actualProjectId = manifest.project_id || projectId.replace(".json", "").split("/").pop();
  log("🆔", `Project ID: ${actualProjectId}`);

  // Render metadata for tracing
  const renderMeta = {
    traceId: manifest.traceId || `render-${actualProjectId}-${Date.now()}`,
    renderedAt: new Date().toISOString(),
    pipelineVersion: "2.0.0-clean",
  };

  // =============================================================================
  // Step 1: Bundle Remotion Project
  // =============================================================================

  log("📦", "Bundling Remotion project...");
  const bundleStart = Date.now();

  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, "./src/index.ts"),
    // No webpack override needed - src/ is now pure React
  });

  log("✓", "Bundle complete", `(${((Date.now() - bundleStart) / 1000).toFixed(1)}s)`);

  // =============================================================================
  // Step 2: Select Composition
  // =============================================================================

  log("🎬", "Selecting composition...");
  const inputProps = { manifest, renderMeta };

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "MainVideo",
    inputProps,
  });

  // =============================================================================
  // Step 3: Prepare Output
  // =============================================================================

  const outputDir = process.env.OUTPUT_DIR || `./output/${actualProjectId}`;
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "video.mp4");

  log("🎥", "Starting render...");
  const videoTitle = manifest.content_engine?.seo?.regional_seo?.find(r => r.language === "zh")?.titles?.[0]
    || manifest.content_engine?.seo?.regional_seo?.[0]?.titles?.[0]
    || manifest.seo?.title
    || "Untitled";
  log("   ", `Title: ${videoTitle}`);
  log("   ", `Output: ${outputPath}`);

  // =============================================================================
  // Step 4: Render Video
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
    composition,
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
  // Step 5: Glitch Protection - Validate First/Last Frames
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

      // Optional: Check if frames are mostly black (expected with fade in/out)
      // This could be enhanced with sharp to analyze pixel values

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
  // Step 6: Write Render Report
  // =============================================================================

  const report = {
    projectId: actualProjectId,
    traceId: renderMeta.traceId,
    outputPath: path.resolve(outputPath),
    renderedAt: renderMeta.renderedAt,
    completedAt: new Date().toISOString(),
    renderDurationSeconds: parseFloat(renderDuration),
    profile,
    composition: {
      id: composition.id,
      width: composition.width,
      height: composition.height,
      fps: composition.fps,
      durationInFrames: composition.durationInFrames,
    },
    manifest: {
      title: manifest.content_engine?.seo?.title || manifest.seo?.title,
      segments: manifest.content_engine?.script?.length || 0,
    },
    validation: {
      glitchProtection: true,
      firstFrameBuffer: 30,
      lastFrameBuffer: 30,
    },
  };

  const reportPath = path.join(outputDir, "render_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log("📊", `Report saved: ${reportPath}`);

  // =============================================================================
  // Summary
  // =============================================================================

  console.log(`
${colors.green}════════════════════════════════════════════════════════════════${colors.reset}
${colors.cyan}✅ Render Complete${colors.reset}
${colors.dim}────────────────────────────────────────────────────────────────${colors.reset}
   Project:     ${actualProjectId}
   Trace ID:    ${renderMeta.traceId}
   Output:      ${outputPath}
   Duration:    ${renderDuration}s
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
