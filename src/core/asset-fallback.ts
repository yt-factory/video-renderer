import React from 'react';
import { logger } from '../utils/logger';
import { ThemeConfig } from '../templates';

export type FallbackLevel =
  | 'provided_asset'
  | 'ai_generated'
  | 'lottie_animation'
  | 'keyword_cloud'
  | 'gradient_background';

export interface AssetResolution {
  type: FallbackLevel;
  url?: string;
  props?: Record<string, unknown>;
}

const LOTTIE_LIBRARY: Record<string, string> = {
  code_block: '/lottie/coding-animation.json',
  diagram: '/lottie/flowchart-animation.json',
  loading: '/lottie/loading-dots.json',
  success: '/lottie/checkmark.json',
  data: '/lottie/data-visualization.json',
  default: '/lottie/abstract-shapes.json',
};

/**
 * Resolve an asset through the 5-level fallback chain.
 */
export async function resolveAsset(
  visualHint: string,
  providedUrl?: string,
  keywords?: string[],
  projectId?: string
): Promise<AssetResolution> {
  // Level 1: Provided asset
  if (providedUrl) {
    const isValid = await validateAssetUrl(providedUrl);
    if (isValid) {
      logger.info('Asset resolved: provided', { projectId, url: providedUrl });
      return { type: 'provided_asset', url: providedUrl };
    }
    logger.warn('Provided asset invalid, trying fallback', { projectId, url: providedUrl });
  }

  // Level 2: AI generated
  if (process.env.ENABLE_AI_IMAGE_GENERATION === 'true' && keywords?.length) {
    try {
      const aiImageUrl = await generateAIImage(keywords.join(' '), visualHint);
      if (aiImageUrl) {
        logger.info('Asset resolved: AI generated', { projectId });
        return { type: 'ai_generated', url: aiImageUrl };
      }
    } catch (error) {
      logger.warn('AI image generation failed', { projectId });
    }
  }

  // Level 3: Lottie animation
  const lottieFile = LOTTIE_LIBRARY[visualHint] || LOTTIE_LIBRARY.default;
  if (await fileExists(lottieFile)) {
    logger.info('Asset resolved: Lottie animation', { projectId, visualHint });
    return { type: 'lottie_animation', props: { src: lottieFile } };
  }

  // Level 4: Keyword cloud
  if (keywords?.length) {
    logger.info('Asset resolved: keyword cloud', { projectId });
    return { type: 'keyword_cloud', props: { keywords } };
  }

  // Level 5: Gradient background (final fallback)
  logger.info('Asset resolved: gradient background', { projectId });
  return { type: 'gradient_background', props: { visualHint } };
}

async function validateAssetUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

async function generateAIImage(_prompt: string, _style: string): Promise<string | null> {
  // Placeholder for AI image generation (DALL-E, etc.)
  return null;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const fs = await import('fs/promises');
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
