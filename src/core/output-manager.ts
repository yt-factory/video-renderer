import { mkdir } from 'fs/promises';
import { join } from 'path';
import { logger } from '../utils/logger';

export interface OutputPaths {
  mainVideo: string;
  audio: string;
  manifest: string;
  renderReport: string;
  shorts: (index: number) => string;
  thumbnail: string;
}

export function createOutputPaths(outputDir: string, projectId: string): OutputPaths {
  return {
    mainVideo: join(outputDir, `${projectId}_main.mp4`),
    audio: join(outputDir, `${projectId}_audio.mp3`),
    manifest: join(outputDir, 'manifest.json'),
    renderReport: join(outputDir, 'render_report.json'),
    shorts: (index: number) =>
      join(outputDir, `${projectId}_shorts_${String(index + 1).padStart(2, '0')}.mp4`),
    thumbnail: join(outputDir, `${projectId}_thumbnail.png`),
  };
}

export async function ensureOutputDir(outputDir: string): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  logger.info('Output directory ready', { outputDir });
}
