import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import { join, dirname } from 'path';
import { mkdir, readdir, unlink, stat } from 'fs/promises';
import { logger } from '../utils/logger';

const SAMPLE_COUNT = 10;
const FRAME_DIR_SUFFIX = '_frames';

/**
 * Automatically capture the highest-energy frame from a video for thumbnail use.
 * "Energy" is measured by pixel standard deviation — high contrast/motion frames score higher.
 */
export async function captureHighEnergyFrame(
  videoPath: string,
  outputPath: string
): Promise<string> {
  logger.info('Auto-capturing high-energy frame', { videoPath, outputPath });

  // Get video duration
  const duration = await getVideoDuration(videoPath);
  if (duration <= 0) {
    logger.warn('Cannot determine video duration, skipping auto-capture');
    return outputPath;
  }

  // Create temp directory for frame samples
  const framesDir = join(dirname(outputPath), `${FRAME_DIR_SUFFIX}_${Date.now()}`);
  await mkdir(framesDir, { recursive: true });

  try {
    // Extract frames at evenly spaced intervals (skip first/last 10%)
    const startTime = duration * 0.1;
    const endTime = duration * 0.9;
    const interval = (endTime - startTime) / SAMPLE_COUNT;

    const framePaths: string[] = [];

    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const time = startTime + i * interval;
      const framePath = join(framesDir, `frame_${String(i).padStart(3, '0')}.png`);

      await extractSingleFrame(videoPath, time, framePath);

      const fileStat = await stat(framePath).catch(() => null);
      if (fileStat && fileStat.size > 0) {
        framePaths.push(framePath);
      }
    }

    if (framePaths.length === 0) {
      logger.warn('No frames extracted, skipping auto-capture');
      return outputPath;
    }

    // Score each frame by pixel "energy" (standard deviation)
    let bestPath = framePaths[0];
    let bestScore = 0;

    for (const framePath of framePaths) {
      const score = await calculateFrameEnergy(framePath);
      if (score > bestScore) {
        bestScore = score;
        bestPath = framePath;
      }
    }

    logger.info('Best frame selected', {
      bestPath,
      score: bestScore.toFixed(2),
      framesAnalyzed: framePaths.length.toString(),
    });

    // Copy best frame to output
    await sharp(bestPath)
      .resize(1280, 720, { fit: 'cover' })
      .png()
      .toFile(outputPath);

    return outputPath;
  } finally {
    // Clean up temp frames
    try {
      const files = await readdir(framesDir);
      await Promise.all(files.map((f) => unlink(join(framesDir, f))));
      const { rmdir } = await import('fs/promises');
      await rmdir(framesDir);
    } catch {
      // Ignore cleanup errors
    }
  }
}

function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

function extractSingleFrame(
  videoPath: string,
  timeSeconds: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(timeSeconds)
      .frames(1)
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Calculate frame "energy" using pixel statistics from sharp.
 * Higher standard deviation = more contrast/detail = better thumbnail.
 */
async function calculateFrameEnergy(framePath: string): Promise<number> {
  const { channels } = await sharp(framePath).stats();

  // Average the standard deviation across all channels
  const avgStdDev =
    channels.reduce((sum, ch) => sum + ch.stdev, 0) / channels.length;

  return avgStdDev;
}
