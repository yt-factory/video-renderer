import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { ProjectManifestSchema, ProjectManifest } from './core/manifest-parser';
import { selectTheme } from './templates';
import {
  selectRenderProfile,
  RenderProfileName,
  estimateRenderTime,
  autoOpenPreview,
  getProfileSummary,
} from './core/render-profile';
import { TTSClient } from './audio/tts-client';
import { calculateAudioDrivenTimeline } from './audio/audio-sync';
import { ShortsExtractor } from './shorts/extractor';
import { ThumbnailGenerator } from './thumbnail/generator';
import { logger } from './utils/logger';

interface RenderOptions {
  manifestPath: string;
  outputDir: string;
  profile?: RenderProfileName;
  debugSafeZone?: boolean;
  autoPreview?: boolean;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Usage: npx ts-node src/index.ts <manifest.json> <output-dir> [options]

Options:
  --profile=<name>     Render profile: draft, preview, production, shorts_only, 4k
  --debug-safe-zone    Show safe zone overlay in Shorts
  --auto-preview       Auto open video after rendering (default for draft)

Examples:
  npx ts-node src/index.ts ./manifest.json ./output --profile=draft
  npx ts-node src/index.ts ./manifest.json ./output --profile=production
    `);
    process.exit(1);
  }

  const options: RenderOptions = {
    manifestPath: args[0],
    outputDir: args[1],
    profile: args.find((a) => a.startsWith('--profile='))?.split('=')[1] as
      | RenderProfileName
      | undefined,
    debugSafeZone: args.includes('--debug-safe-zone'),
    autoPreview: args.includes('--auto-preview'),
  };

  await render(options);
}

async function render(options: RenderOptions): Promise<void> {
  const {
    manifestPath,
    outputDir,
    profile: explicitProfile,
    debugSafeZone,
    autoPreview: explicitAutoPreview,
  } = options;

  const startTime = Date.now();

  // Step 1: Parse manifest
  logger.info('Loading manifest', { manifestPath });
  const manifestContent = await readFile(manifestPath, 'utf-8');
  const manifest = ProjectManifestSchema.parse(JSON.parse(manifestContent));

  if (!manifest.content_engine) {
    throw new Error('Manifest missing content_engine');
  }

  const { project_id } = manifest;
  const { script, seo, shorts, media_preference, estimated_duration_seconds } =
    manifest.content_engine;

  // Step 2: Select render profile
  const renderProfile = selectRenderProfile(explicitProfile);
  const estimatedTime = estimateRenderTime(estimated_duration_seconds, renderProfile);

  logger.info('Render configuration', {
    projectId: project_id,
    profile: getProfileSummary(renderProfile),
    segments: script.length.toString(),
    shortsHooks: shorts.hooks.length.toString(),
  });

  await mkdir(outputDir, { recursive: true });

  // Step 3: Synthesize audio
  logger.info('Synthesizing audio', { projectId: project_id });
  const ttsClient = new TTSClient();
  const audioSegments: Array<{ path: string; segment: (typeof script)[0] }> = [];

  const voice = media_preference.voice || {
    provider: 'google_tts' as const,
    voice_id: 'en-US-Neural2-D',
    style: 'narrative' as const,
    language: seo.primary_language,
  };

  for (let i = 0; i < script.length; i++) {
    const segment = script[i];
    const result = await ttsClient.synthesize(segment.voiceover, voice, {
      outputDir,
      projectId: project_id,
      segmentIndex: i,
    });
    audioSegments.push({ path: result.audioPath, segment });
  }

  // Merge audio
  const mergedAudioPath = join(outputDir, `${project_id}_audio.mp3`);
  await mergeAudioFiles(
    audioSegments.map((s) => s.path),
    mergedAudioPath
  );

  // Step 4: Calculate audio-driven timeline
  let audioTimeline;
  if (!renderProfile.skipAudioSync) {
    logger.info('Calculating audio timeline with pacing', { projectId: project_id });
    audioTimeline = await calculateAudioDrivenTimeline(
      audioSegments,
      renderProfile.fps,
      project_id,
      manifest.content_engine
    );

    logger.info('Pacing stats', {
      projectId: project_id,
      totalGapTime: `${audioTimeline.pacingStats.totalGapSeconds.toFixed(2)}s`,
      averageGap: `${audioTimeline.pacingStats.averageGapSeconds.toFixed(2)}s`,
    });
  }

  // Step 5: Render main video
  logger.info('Rendering main video', { projectId: project_id });

  const bundleLocation = await bundle({
    entryPoint: join(__dirname, 'compositions/index.tsx'),
    webpackOverride: (config) => config,
  });

  const theme = selectTheme(media_preference);

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'MainVideo',
    inputProps: {
      script,
      audioPath: mergedAudioPath,
      audioTimeline,
      chapters: seo.chapters,
      seoTags: seo.tags,
      theme,
    },
  });

  const mainVideoPath = join(outputDir, `${project_id}_main.mp4`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: renderProfile.codec,
    outputLocation: mainVideoPath,
    inputProps: {
      script,
      audioPath: mergedAudioPath,
      audioTimeline,
      chapters: seo.chapters,
      seoTags: seo.tags,
      theme,
    },
    crf: renderProfile.crf,
    pixelFormat: renderProfile.pixelFormat,
    concurrency: renderProfile.concurrency,
  });

  logger.info('Main video rendered', {
    projectId: project_id,
    path: mainVideoPath,
  });

  // Step 6: Extract Shorts
  let shortsOutputs: Array<{ hookIndex: number; outputPath: string }> = [];

  if (!renderProfile.skipShorts) {
    logger.info('Extracting Shorts', { projectId: project_id });

    const shortsExtractor = new ShortsExtractor();
    shortsOutputs = await shortsExtractor.extractAll(shorts, {
      mainVideoPath,
      outputDir,
      projectId: project_id,
      theme,
      debugSafeZone: debugSafeZone || false,
    });

    logger.info('Shorts extracted', {
      projectId: project_id,
      count: shortsOutputs.length.toString(),
    });
  }

  // Step 7: Generate thumbnail
  let thumbnailPath: string | undefined;

  if (!renderProfile.skipThumbnail) {
    logger.info('Generating thumbnail', { projectId: project_id });

    const thumbnailGenerator = new ThumbnailGenerator();
    thumbnailPath = await thumbnailGenerator.generate({
      title: seo.regional_seo[0].titles[0],
      theme,
      outputPath: join(outputDir, `${project_id}_thumbnail.png`),
      keywords: seo.tags.slice(0, 3),
      videoPath: mainVideoPath,
    });
  }

  // Step 8: Write updated manifest and report
  const endTime = Date.now();
  const renderTimeSeconds = (endTime - startTime) / 1000;

  const updatedManifest: ProjectManifest = {
    ...manifest,
    status: 'uploading',
    assets: {
      audio_url: mergedAudioPath,
      video_url: mainVideoPath,
      shorts_urls: shortsOutputs.map((s) => s.outputPath),
      thumbnail_url: thumbnailPath,
    },
    updated_at: new Date().toISOString(),
  };

  await writeFile(join(outputDir, 'manifest.json'), JSON.stringify(updatedManifest, null, 2));

  const renderReport = {
    project_id,
    render_profile: renderProfile.name,
    resolution: renderProfile.resolution,
    fps: renderProfile.fps,
    render_time_seconds: renderTimeSeconds,
    estimated_time_seconds: estimatedTime,
    efficiency: (estimatedTime / renderTimeSeconds).toFixed(2),
    pacing_stats: audioTimeline?.pacingStats,
    outputs: {
      main_video: mainVideoPath,
      shorts: shortsOutputs.length,
      thumbnail: thumbnailPath ? true : false,
    },
    audio_segments: script.length,
    total_duration_seconds:
      audioTimeline?.totalDurationSeconds || estimated_duration_seconds,
  };

  await writeFile(join(outputDir, 'render_report.json'), JSON.stringify(renderReport, null, 2));

  logger.info('Rendering complete', {
    projectId: project_id,
    renderTime: `${renderTimeSeconds.toFixed(1)}s`,
    mainVideo: mainVideoPath,
    shorts: shortsOutputs.length.toString(),
  });

  // Step 9: Auto preview
  const shouldAutoPreview = explicitAutoPreview || renderProfile.autoPreview;
  if (shouldAutoPreview) {
    await autoOpenPreview(mainVideoPath);
  }
}

async function mergeAudioFiles(files: string[], outputPath: string): Promise<void> {
  const { execSync } = await import('child_process');

  const listContent = files.map((f) => `file '${f}'`).join('\n');
  const listPath = outputPath.replace('.mp3', '_list.txt');

  await writeFile(listPath, listContent);

  try {
    execSync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`, {
      stdio: 'pipe',
    });
  } catch {
    logger.warn('FFmpeg merge failed, concatenating raw files');
    // Fallback: simple concatenation
    const buffers = await Promise.all(
      files.map(async (f) => {
        try {
          const { readFile: rf } = await import('fs/promises');
          return await rf(f);
        } catch {
          return Buffer.alloc(0);
        }
      })
    );
    await writeFile(outputPath, Buffer.concat(buffers));
  }
}

main().catch((error) => {
  logger.error('Fatal error', { error: error.message });
  process.exit(1);
});
