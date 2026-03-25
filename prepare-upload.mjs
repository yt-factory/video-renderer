#!/usr/bin/env node

/**
 * prepare-upload.mjs - Prepare a NotebookLM video for YouTube upload
 *
 * Takes a NotebookLM-generated video file and pairs it with SEO metadata
 * from the orchestrator manifest. Outputs a ready-to-upload package.
 *
 * Usage:
 *   node prepare-upload.mjs <project-id> <video-file> [--lang=zh]
 *
 * Examples:
 *   node prepare-upload.mjs cc13c849 ~/Downloads/notebooklm_video.mp4
 *   node prepare-upload.mjs cc13c849 ~/Downloads/video.mp4 --lang=zh
 *
 * Output:
 *   output/{project-id}/{lang}/
 *   ├── video.mp4              (copied from input)
 *   ├── upload-metadata.json   (title, description, tags for YouTube)
 *   └── upload-metadata.txt    (human-readable copy-paste format)
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function main() {
  const projectId = process.argv[2];
  const videoFile = process.argv[3];
  const langArg = process.argv.find((a) => a.startsWith("--lang="));
  const lang = langArg ? langArg.replace("--lang=", "") : "zh";

  if (!projectId || !videoFile) {
    console.log(`
${colors.cyan}YT-Factory Upload Preparer${colors.reset}

Pairs a NotebookLM video with orchestrator SEO metadata for YouTube upload.

Usage: node prepare-upload.mjs <project-id> <video-file> [--lang=zh]

Examples:
  node prepare-upload.mjs cc13c849 ~/Downloads/notebooklm_video.mp4
  node prepare-upload.mjs cc13c849 ~/Downloads/video.mp4 --lang=en
`);
    process.exit(1);
  }

  // Resolve paths
  let manifestPath;
  if (projectId.includes("/")) {
    manifestPath = path.resolve(projectId, "manifest.json");
  } else {
    // Find manifest - try full ID first, then prefix match
    const projectsDir = path.join(__dirname, "../orchestrator/active_projects");
    const dirs = fs.readdirSync(projectsDir);
    const match = dirs.find((d) => d === projectId || d.startsWith(projectId));
    if (!match) {
      console.error(`${colors.red}Project not found: ${projectId}${colors.reset}`);
      process.exit(1);
    }
    manifestPath = path.join(projectsDir, match, "manifest.json");
  }

  const resolvedVideoFile = path.resolve(videoFile);

  // Validate inputs
  if (!fs.existsSync(manifestPath)) {
    console.error(`${colors.red}Manifest not found: ${manifestPath}${colors.reset}`);
    process.exit(1);
  }
  if (!fs.existsSync(resolvedVideoFile)) {
    console.error(`${colors.red}Video file not found: ${resolvedVideoFile}${colors.reset}`);
    process.exit(1);
  }

  log("📄", "Loading manifest", manifestPath);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const actualProjectId = manifest.project_id || path.basename(path.dirname(manifestPath));

  // Extract SEO metadata
  const regionalSeo = manifest.content_engine?.seo?.regional_seo || [];
  const langSeo = regionalSeo.find((r) => r.language === lang);
  const fallbackSeo = regionalSeo.find((r) => r.language === "en") || regionalSeo[0];

  const title = langSeo?.titles?.[0] || fallbackSeo?.titles?.[0] || "Untitled";
  const description = langSeo?.description || fallbackSeo?.description || "";
  const tags = manifest.content_engine?.seo?.tags || [];
  const chapters = manifest.content_engine?.seo?.chapters || "";
  const faq = manifest.content_engine?.seo?.faq_structured_data || [];

  // Build YouTube description
  const descriptionParts = [description];

  if (chapters) {
    descriptionParts.push("", "Chapters:", chapters);
  }

  if (faq.length > 0) {
    descriptionParts.push("", "FAQ:");
    for (const item of faq) {
      descriptionParts.push(`Q: ${item.question}`, `A: ${item.answer}`, "");
    }
  }

  if (tags.length > 0) {
    descriptionParts.push(
      "",
      tags.slice(0, 10).map((t) => `#${t.replace(/\s+/g, "")}`).join(" ")
    );
  }

  const fullDescription = descriptionParts.join("\n");

  // Prepare output directory
  const outputDir = path.join(__dirname, `output/${actualProjectId}/${lang}`);
  fs.mkdirSync(outputDir, { recursive: true });

  // Copy video
  const outputVideoPath = path.join(outputDir, "video.mp4");
  log("📋", "Copying video to output directory");
  fs.copyFileSync(resolvedVideoFile, outputVideoPath);

  // Write structured metadata (for mcp-gateway upload)
  const uploadMetadata = {
    project_id: actualProjectId,
    language: lang,
    title,
    description: fullDescription,
    tags,
    privacy: "private",
    video_path: outputVideoPath,
    source: "notebooklm_cinematic",
  };

  const metadataPath = path.join(outputDir, "upload-metadata.json");
  fs.writeFileSync(metadataPath, JSON.stringify(uploadMetadata, null, 2));

  // Write human-readable copy-paste format
  const txtPath = path.join(outputDir, "upload-metadata.txt");
  const txtContent = `=== YOUTUBE UPLOAD METADATA ===

TITLE:
${title}

DESCRIPTION:
${fullDescription}

TAGS (comma-separated):
${tags.join(", ")}

PRIVACY: private (change to public when ready)
`;
  fs.writeFileSync(txtPath, txtContent);

  // Summary
  const videoSize = fs.statSync(outputVideoPath).size;

  console.log(`
${colors.green}════════════════════════════════════════════════════════════════${colors.reset}
${colors.cyan}Ready for YouTube Upload${colors.reset}
${colors.dim}────────────────────────────────────────────────────────────────${colors.reset}
   Project:     ${actualProjectId}
   Language:    ${lang}
   Title:       ${title.substring(0, 60)}${title.length > 60 ? "..." : ""}
   Video:       ${(videoSize / 1024 / 1024).toFixed(1)} MB
   Tags:        ${tags.length}

   ${colors.cyan}Files:${colors.reset}
   ${outputVideoPath}
   ${metadataPath}
   ${txtPath}

   ${colors.yellow}Next steps:${colors.reset}
   1. Review: open ${outputVideoPath}
   2. Upload to YouTube Studio manually, OR
   3. Use mcp-gateway: publish_video(video_path, title, description, tags)
${colors.green}════════════════════════════════════════════════════════════════${colors.reset}
`);
}

main().catch((error) => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});
