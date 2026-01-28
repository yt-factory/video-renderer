import { ShortsHook } from '../core/manifest-parser';
import { ThemeConfig } from '../templates';
import { logger } from '../utils/logger';

export interface CTARenderConfig {
  hook: ShortsHook;
  theme: ThemeConfig;
  width: number;
  height: number;
  position: 'top' | 'bottom' | 'center';
}

/**
 * Generate CTA overlay data for FFmpeg composition.
 * The actual visual rendering is done by CTAOverlay.tsx in Remotion.
 */
export function generateCTAConfig(config: CTARenderConfig): {
  text: string;
  cta: string | undefined;
  x: number;
  y: number;
  fontSize: number;
} {
  const { hook, width, height, position } = config;

  const fontSize = 32;
  let y: number;

  switch (position) {
    case 'top':
      y = Math.round(height * 0.12);
      break;
    case 'center':
      y = Math.round(height * 0.45);
      break;
    case 'bottom':
    default:
      y = Math.round(height * 0.72);
      break;
  }

  logger.debug('CTA config generated', {
    text: hook.text,
    position,
    y: y.toString(),
  });

  return {
    text: hook.text,
    cta: hook.injected_cta,
    x: Math.round(width * 0.05),
    y,
    fontSize,
  };
}
