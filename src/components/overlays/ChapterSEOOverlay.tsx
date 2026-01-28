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

const HIGH_CONTRAST_TEXT_STYLE: React.CSSProperties = {
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
};

const HIGH_CONTRAST_BACKGROUND = 'rgba(0, 0, 0, 0.88)';

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
            color: theme.colors.primary,
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity: enterProgress,
            ...HIGH_CONTRAST_TEXT_STYLE,
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
          ...HIGH_CONTRAST_TEXT_STYLE,
          filter: `drop-shadow(0 0 30px ${theme.colors.primary}60)`,
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
          ...HIGH_CONTRAST_TEXT_STYLE,
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
            ${theme.colors.primary} 20%,
            ${theme.colors.primary} 80%,
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
