import sharp from 'sharp';
import { ThemeConfig } from '../templates';
import { logger } from '../utils/logger';
import { captureHighEnergyFrame } from './auto-capture';
import { getHighContrastTextColor } from '../utils/contrast-checker';

interface ThumbnailOptions {
  title: string;
  theme: ThemeConfig;
  outputPath: string;
  keywords: string[];
  videoPath: string;
}

const THUMBNAIL_WIDTH = 1280;
const THUMBNAIL_HEIGHT = 720;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wrap text into lines that fit within maxWidth characters.
 */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export class ThumbnailGenerator {
  async generate(options: ThumbnailOptions): Promise<string> {
    logger.info('Generating thumbnail', {
      title: options.title,
      outputPath: options.outputPath,
      keywords: options.keywords.join(', '),
    });

    const { theme } = options;

    // Try to capture a background frame from the video
    let backgroundBuffer: Buffer | null = null;
    try {
      const framePath = options.outputPath.replace('.png', '_frame.png');
      await captureHighEnergyFrame(options.videoPath, framePath);
      const fs = await import('fs/promises');
      const stat = await fs.stat(framePath).catch(() => null);
      if (stat && stat.size > 0) {
        backgroundBuffer = await sharp(framePath)
          .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, { fit: 'cover' })
          .toBuffer();
        // Clean up temp frame
        await fs.unlink(framePath).catch(() => {});
      }
    } catch {
      logger.debug('No video frame available, using solid background');
    }

    // Create base image
    let base: sharp.Sharp;
    if (backgroundBuffer) {
      // Darken the video frame for text readability
      base = sharp(backgroundBuffer).composite([
        {
          input: Buffer.from(
            `<svg width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}">
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" />
            </svg>`
          ),
          blend: 'over',
        },
      ]);
    } else {
      // Generate gradient background
      const gradientSvg = `
        <svg width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${theme.colors.background}" />
              <stop offset="100%" stop-color="${theme.colors.primary}" stop-opacity="0.3" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg)" />
        </svg>`;
      base = sharp(Buffer.from(gradientSvg));
    }

    // Build text overlays as SVG
    const textColor = backgroundBuffer
      ? '#FFFFFF'
      : getHighContrastTextColor(theme.colors.background);

    const titleLines = wrapText(options.title, 28);
    const titleFontSize = titleLines.length > 2 ? 52 : 64;
    const titleStartY = titleLines.length > 2 ? 200 : 240;

    const titleTextElements = titleLines
      .map((line, i) => {
        const y = titleStartY + i * (titleFontSize + 12);
        return `<text x="640" y="${y}" text-anchor="middle"
          font-family="${theme.fonts.heading}, Arial, sans-serif"
          font-size="${titleFontSize}" font-weight="900" fill="${textColor}"
          stroke="black" stroke-width="3" paint-order="stroke">
          ${escapeXml(line)}
        </text>`;
      })
      .join('\n');

    // Keyword badges
    const keywordElements = options.keywords
      .slice(0, 3)
      .map((kw, i) => {
        const badgeWidth = kw.length * 16 + 32;
        const x = 640 - ((options.keywords.length * 140) / 2) + i * 140;
        const y = 520;
        return `
          <rect x="${x - badgeWidth / 2}" y="${y}" width="${badgeWidth}" height="40" rx="20"
            fill="${theme.colors.primary}" opacity="0.9" />
          <text x="${x}" y="${y + 27}" text-anchor="middle"
            font-family="${theme.fonts.body}, Arial, sans-serif"
            font-size="18" font-weight="600" fill="${getHighContrastTextColor(theme.colors.primary)}">
            ${escapeXml(kw)}
          </text>`;
      })
      .join('\n');

    // Bottom accent bar
    const accentBar = `
      <rect x="0" y="${THUMBNAIL_HEIGHT - 8}" width="${THUMBNAIL_WIDTH}" height="8"
        fill="${theme.colors.primary}" />`;

    const overlaySvg = `
      <svg width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}">
        ${titleTextElements}
        ${keywordElements}
        ${accentBar}
      </svg>`;

    const result = await base
      .composite([
        {
          input: Buffer.from(overlaySvg),
          blend: 'over',
        },
      ])
      .png({ quality: 95, compressionLevel: 6 })
      .toFile(options.outputPath);

    logger.info('Thumbnail generated', {
      outputPath: options.outputPath,
      size: result.size.toString(),
      width: result.width.toString(),
      height: result.height.toString(),
    });

    return options.outputPath;
  }
}
