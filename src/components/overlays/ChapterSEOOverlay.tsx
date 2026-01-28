import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { ThemeConfig } from '../../templates';
import { validateKeywordConsistency } from '../../core/keyword-validator';
import { ensureContrast, adjustForContrast } from '../../utils/contrast-checker';
import { logger } from '../../utils/logger';

interface ChapterSEOOverlayProps {
  keyword: string;
  chapterTitle: string;
  chapterNumber?: number;
  theme: ThemeConfig;
  displayDurationFrames?: number;
  establishedTrends?: string[];
  seoTags?: string[];
  projectId?: string;
}

const HIGH_CONTRAST_BACKGROUND = 'rgba(0, 0, 0, 0.88)';
// Approximate the overlay background as near-black for contrast checks
const BACKGROUND_HEX_APPROX = '#1a1a1a';

/**
 * Build a high-contrast text style, dynamically adjusting stroke and glow
 * based on actual contrast between the theme primary color and the background.
 */
function buildHighContrastStyle(
  themePrimary: string
): { style: React.CSSProperties; useFallback: boolean } {
  const contrastResult = ensureContrast(themePrimary, BACKGROUND_HEX_APPROX, 'AAA');

  if (contrastResult.passes) {
    // Theme primary has sufficient contrast — use it with standard stroke
    return {
      useFallback: false,
      style: {
        color: '#FFFFFF',
        textShadow: `
          3px 3px 0 #000,
          -3px -3px 0 #000,
          3px -3px 0 #000,
          -3px 3px 0 #000,
          0 0 10px rgba(0,0,0,0.9),
          0 4px 8px rgba(0,0,0,0.8)
        `,
        WebkitTextStroke: '1px rgba(0,0,0,0.3)',
      },
    };
  }

  // Insufficient contrast — force high-contrast fallback with heavier stroke/glow
  logger.debug('Theme primary has low contrast, using enhanced fallback', {
    primary: themePrimary,
    ratio: contrastResult.ratio.toString(),
    required: contrastResult.required.toString(),
  });

  return {
    useFallback: true,
    style: {
      color: '#FFFFFF',
      textShadow: `
        4px 4px 0 #000,
        -4px -4px 0 #000,
        4px -4px 0 #000,
        -4px 4px 0 #000,
        0 0 20px rgba(0,0,0,1),
        0 0 40px rgba(0,0,0,0.8),
        0 6px 12px rgba(0,0,0,0.9)
      `,
      WebkitTextStroke: '2px #000000',
    },
  };
}

export const ChapterSEOOverlay: React.FC<ChapterSEOOverlayProps> = ({
  keyword,
  chapterTitle,
  chapterNumber,
  theme,
  displayDurationFrames,
  establishedTrends = [],
  seoTags = [],
  projectId,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const duration = displayDurationFrames ?? fps * 2.5;

  // Dynamic contrast-aware style
  const { style: highContrastStyle, useFallback } = React.useMemo(
    () => buildHighContrastStyle(theme.colors.primary),
    [theme.colors.primary]
  );

  // Compute a contrast-safe accent color for the chapter number and glow
  const safeAccentColor = React.useMemo(
    () => adjustForContrast(theme.colors.primary, BACKGROUND_HEX_APPROX, 7),
    [theme.colors.primary]
  );

  // Triple-index validation
  React.useEffect(() => {
    if (projectId && (establishedTrends.length > 0 || seoTags.length > 0)) {
      const validation = validateKeywordConsistency(keyword, establishedTrends, seoTags);
      if (!validation.valid) {
        logger.warn('Keyword consistency warning', {
          projectId,
          keyword,
          warning: validation.warning,
        });
      }
    }
  }, [keyword, establishedTrends, seoTags, projectId]);

  if (frame > duration) return null;

  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const exitStart = duration - fps * 0.5;
  const exitProgress =
    frame > exitStart
      ? interpolate(frame, [exitStart, duration], [1, 0], { extrapolateRight: 'clamp' })
      : 1;

  const combinedOpacity = enterProgress * exitProgress;

  const keywordScale = interpolate(enterProgress, [0, 1], [0.85, 1]);
  const keywordY = interpolate(enterProgress, [0, 1], [30, 0]);

  const titleOpacity = interpolate(frame, [fps * 0.3, fps * 0.8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleY = interpolate(frame, [fps * 0.3, fps * 0.8], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const lineWidth = interpolate(enterProgress, [0, 1], [0, 250]);

  // Glow intensity is boosted when fallback is active to compensate
  const glowSpread = useFallback ? 50 : 30;
  const glowOpacity = useFallback ? '90' : '60';

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        background: `linear-gradient(180deg,
          ${HIGH_CONTRAST_BACKGROUND} 0%,
          rgba(0,0,0,0.75) 50%,
          ${HIGH_CONTRAST_BACKGROUND} 100%)`,
        opacity: combinedOpacity,
      }}
    >
      {chapterNumber !== undefined && (
        <div
          style={{
            position: 'absolute',
            top: '18%',
            fontFamily: theme.fonts.body,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity: enterProgress,
            ...highContrastStyle,
            // Override color with contrast-safe accent for chapter label
            color: safeAccentColor,
          }}
        >
          CHAPTER {chapterNumber}
        </div>
      )}

      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: 88,
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 10,
          textAlign: 'center',
          transform: `scale(${keywordScale}) translateY(${keywordY}px)`,
          maxWidth: '85%',
          lineHeight: 1.1,
          ...highContrastStyle,
          filter: `drop-shadow(0 0 ${glowSpread}px ${safeAccentColor}${glowOpacity})`,
        }}
      >
        {keyword}
      </div>

      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 32,
          fontWeight: 500,
          marginTop: 28,
          textAlign: 'center',
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          maxWidth: '75%',
          ...highContrastStyle,
        }}
      >
        {chapterTitle}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '22%',
          width: lineWidth,
          height: 4,
          background: `linear-gradient(90deg,
            transparent 0%,
            ${safeAccentColor} 20%,
            ${safeAccentColor} 80%,
            transparent 100%)`,
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};

export function extractChapterKeywords(
  chapters: string,
  tags: string[]
): Array<{ timestamp: string; keyword: string; title: string }> {
  const lines = chapters.split('\n').filter(Boolean);

  return lines
    .map((line, index) => {
      const match = line.match(/^(\d{2}:\d{2})\s*-?\s*(.+)$/);
      if (!match) return null;

      const [, timestamp, title] = match;
      const keyword = tags[index] || title.split(' ')[0];

      return { timestamp, keyword: keyword.toUpperCase(), title };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}
