import { exec } from 'child_process';
import { platform } from 'os';
import { logger } from '../utils/logger';

export type RenderProfileName = 'draft' | 'preview' | 'production' | 'shorts_only' | '4k';

export interface RenderProfile {
  name: RenderProfileName;
  resolution: { width: number; height: number };
  fps: number;
  crf: number;
  codec: 'h264' | 'h265';
  pixelFormat: 'yuv420p' | 'yuv444p';
  skipShorts: boolean;
  skipThumbnail: boolean;
  skipAudioSync: boolean;
  concurrency: number;
  autoPreview: boolean;
}

export const RENDER_PROFILES: Record<RenderProfileName, RenderProfile> = {
  draft: {
    name: 'draft',
    resolution: { width: 854, height: 480 },
    fps: 15,
    crf: 35,
    codec: 'h264',
    pixelFormat: 'yuv420p',
    skipShorts: true,
    skipThumbnail: true,
    skipAudioSync: true,
    concurrency: 8,
    autoPreview: true,
  },
  preview: {
    name: 'preview',
    resolution: { width: 1280, height: 720 },
    fps: 24,
    crf: 28,
    codec: 'h264',
    pixelFormat: 'yuv420p',
    skipShorts: false,
    skipThumbnail: true,
    skipAudioSync: false,
    concurrency: 6,
    autoPreview: false,
  },
  production: {
    name: 'production',
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    crf: 18,
    codec: 'h264',
    pixelFormat: 'yuv420p',
    skipShorts: false,
    skipThumbnail: false,
    skipAudioSync: false,
    concurrency: 4,
    autoPreview: false,
  },
  shorts_only: {
    name: 'shorts_only',
    resolution: { width: 1080, height: 1920 },
    fps: 30,
    crf: 20,
    codec: 'h264',
    pixelFormat: 'yuv420p',
    skipShorts: false,
    skipThumbnail: true,
    skipAudioSync: false,
    concurrency: 4,
    autoPreview: false,
  },
  '4k': {
    name: '4k',
    resolution: { width: 3840, height: 2160 },
    fps: 30,
    crf: 15,
    codec: 'h265',
    pixelFormat: 'yuv444p',
    skipShorts: false,
    skipThumbnail: false,
    skipAudioSync: false,
    concurrency: 2,
    autoPreview: false,
  },
};

export function selectRenderProfile(
  explicit?: RenderProfileName,
  env?: string
): RenderProfile {
  if (explicit) {
    return RENDER_PROFILES[explicit];
  }

  switch (env || process.env.RENDER_ENV) {
    case 'development':
      return RENDER_PROFILES.draft;
    case 'staging':
      return RENDER_PROFILES.preview;
    case 'production':
      return RENDER_PROFILES.production;
    default:
      return RENDER_PROFILES.preview;
  }
}

export async function autoOpenPreview(videoPath: string): Promise<void> {
  const currentPlatform = platform();

  let command: string;
  switch (currentPlatform) {
    case 'darwin':
      command = `open "${videoPath}"`;
      break;
    case 'win32':
      command = `start "" "${videoPath}"`;
      break;
    default:
      command = `xdg-open "${videoPath}"`;
  }

  return new Promise((resolve) => {
    exec(command, (error) => {
      if (error) {
        logger.warn('Could not auto-open preview', { error: error.message });
      } else {
        logger.info('Preview opened', { path: videoPath });
      }
      resolve();
    });
  });
}

export function estimateRenderTime(
  durationSeconds: number,
  profile: RenderProfile
): number {
  const baseMultiplier: Record<RenderProfileName, number> = {
    draft: 0.3,
    preview: 0.8,
    production: 2.0,
    shorts_only: 1.5,
    '4k': 5.0,
  };

  return durationSeconds * baseMultiplier[profile.name];
}

export function getProfileSummary(profile: RenderProfile): string {
  return `${profile.name} (${profile.resolution.width}x${profile.resolution.height}@${profile.fps}fps, CRF ${profile.crf})`;
}
