import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { ThemeConfig } from '../../templates';

export interface WordSegment {
  word: string;
  startTime: number;
  endTime: number;
  emphasis?: boolean;
  type?: 'normal' | 'keyword' | 'number' | 'action';
}

interface SmartSubtitleProps {
  words: WordSegment[];
  theme: ThemeConfig;
  style?: 'karaoke' | 'highlight' | 'bounce' | 'scale';
  position?: 'bottom' | 'center' | 'top';
  emphasisScale?: number;
  emphasisUseAccent?: boolean;
}

const WORD_TYPE_SCALE: Record<NonNullable<WordSegment['type']>, number> = {
  normal: 1.0,
  keyword: 1.12,
  number: 1.18,
  action: 1.08,
};

const EMPHASIS_SCALE_MULTIPLIER = 1.2;
const ACTIVE_SCALE_BOOST = 1.08;

function calculateWordScale(word: WordSegment, isActive: boolean): number {
  let scale = WORD_TYPE_SCALE[word.type || 'normal'];
  if (word.emphasis) scale *= EMPHASIS_SCALE_MULTIPLIER;
  if (isActive) scale *= ACTIVE_SCALE_BOOST;
  return scale;
}

export const SmartSubtitle: React.FC<SmartSubtitleProps> = ({
  words,
  theme,
  style = 'scale',
  position = 'bottom',
  emphasisScale = 1.2,
  emphasisUseAccent = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const getPositionStyle = (): React.CSSProperties => {
    switch (position) {
      case 'bottom':
        return { bottom: '24%' };
      case 'top':
        return { top: '12%' };
      case 'center':
      default:
        return { top: '45%' };
    }
  };

  const getWordColor = (word: WordSegment, isActive: boolean, isPast: boolean): string => {
    if (isActive) {
      return word.emphasis && emphasisUseAccent ? theme.colors.accent : theme.colors.primary;
    }
    if (isPast) return 'rgba(255,255,255,0.75)';
    return 'rgba(255,255,255,0.4)';
  };

  const getWordTypeStyle = (word: WordSegment, isActive: boolean): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {};
    switch (word.type) {
      case 'keyword':
        baseStyle.fontWeight = 700;
        if (isActive) {
          baseStyle.textDecoration = 'underline';
          baseStyle.textDecorationColor = theme.colors.primary;
          baseStyle.textUnderlineOffset = '4px';
        }
        break;
      case 'number':
        baseStyle.fontFamily = 'JetBrains Mono, monospace';
        baseStyle.letterSpacing = '0.05em';
        break;
      case 'action':
        baseStyle.fontStyle = 'italic';
        break;
    }
    return baseStyle;
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: '8%',
        right: '20%',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.25em',
        lineHeight: 1.5,
        ...getPositionStyle(),
      }}
    >
      {words.map((word, index) => {
        const isActive = currentTime >= word.startTime && currentTime <= word.endTime;
        const isPast = currentTime > word.endTime;

        const wordProgress = isActive
          ? interpolate(currentTime, [word.startTime, word.endTime], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          : isPast
            ? 1
            : 0;

        const scale = calculateWordScale(word, isActive);

        const getAnimationStyle = (): React.CSSProperties => {
          switch (style) {
            case 'karaoke':
              return {
                background: isActive
                  ? `linear-gradient(90deg, currentColor ${wordProgress * 100}%, rgba(255,255,255,0.3) ${wordProgress * 100}%)`
                  : undefined,
                WebkitBackgroundClip: isActive ? 'text' : undefined,
                WebkitTextFillColor: isActive ? 'transparent' : undefined,
                transform: `scale(${isActive ? scale : 1})`,
              };
            case 'bounce': {
              const bounceY = isActive ? -Math.sin(wordProgress * Math.PI) * 8 : 0;
              return {
                transform: `scale(${isActive ? scale : 1}) translateY(${bounceY}px)`,
              };
            }
            case 'scale':
            case 'highlight':
            default:
              if (isActive && word.emphasis) {
                const emphasisSpring = spring({
                  frame: frame - word.startTime * fps,
                  fps,
                  config: { damping: 12, stiffness: 150 },
                });
                return {
                  transform: `scale(${1 + (emphasisScale - 1) * emphasisSpring})`,
                };
              }
              return {
                transform: `scale(${isActive ? scale : 1})`,
              };
          }
        };

        return (
          <span
            key={index}
            style={{
              fontFamily: theme.fonts.body,
              fontSize: word.emphasis ? 38 : 32,
              fontWeight: word.emphasis ? 700 : 500,
              color: getWordColor(word, isActive, isPast),
              textShadow: isActive
                ? `0 0 25px ${theme.colors.primary}90, 2px 2px 4px rgba(0,0,0,0.9)`
                : '2px 2px 4px rgba(0,0,0,0.7)',
              display: 'inline-block',
              transition: 'color 0.12s ease-out, transform 0.1s ease-out',
              ...getWordTypeStyle(word, isActive),
              ...getAnimationStyle(),
            }}
          >
            {word.word}
          </span>
        );
      })}
    </div>
  );
};

export function generateWordTimeline(
  voiceover: string,
  startTime: number,
  duration: number,
  emphasisWords?: string[],
  keywordList?: string[]
): WordSegment[] {
  const words = voiceover.split(/\s+/).filter(Boolean);
  const avgWordDuration = duration / words.length;

  let currentTime = startTime;

  return words.map((word) => {
    const cleanWord = word.replace(/[.,!?;:"']/g, '').toLowerCase();

    const isEmphasis = emphasisWords?.some((ew) => cleanWord.includes(ew.toLowerCase()));

    let type: WordSegment['type'] = 'normal';
    if (/^\d+/.test(cleanWord) || /[$%€¥]/.test(word)) {
      type = 'number';
    } else if (keywordList?.some((k) => cleanWord.includes(k.toLowerCase()))) {
      type = 'keyword';
    } else if (/^(click|tap|swipe|scroll|buy|subscribe|follow)$/i.test(cleanWord)) {
      type = 'action';
    }

    const segment: WordSegment = {
      word,
      startTime: currentTime,
      endTime: currentTime + avgWordDuration,
      emphasis: isEmphasis,
      type,
    };

    currentTime += avgWordDuration;
    return segment;
  });
}
