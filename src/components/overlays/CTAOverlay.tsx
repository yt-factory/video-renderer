import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from 'remotion';
import { ShortsHook, EmotionalTrigger } from '../../core/manifest-parser';
import { ThemeConfig } from '../../templates';
import {
  YOUTUBE_SHORTS_SAFE_ZONE,
  calculateGravityAlignment,
} from '../../shorts/safe-zone';

interface CTAOverlayProps {
  hook: ShortsHook;
  theme: ThemeConfig;
  position?: 'top' | 'bottom' | 'center';
  respectSafeZone?: boolean;
}

const EMOTION_STYLES: Record<
  EmotionalTrigger,
  {
    color: string;
    gradient: string;
    icon: string;
    animation: 'shake' | 'glow' | 'pulse' | 'bounce' | 'pop';
  }
> = {
  anger: {
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    icon: '\uD83D\uDD25',
    animation: 'shake',
  },
  awe: {
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    icon: '\u2728',
    animation: 'glow',
  },
  curiosity: {
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    icon: '\uD83E\uDD14',
    animation: 'pulse',
  },
  fomo: {
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    icon: '\u26A1',
    animation: 'bounce',
  },
  validation: {
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    icon: '\u2705',
    animation: 'pop',
  },
};

export const CTAOverlay: React.FC<CTAOverlayProps> = ({
  hook,
  theme,
  position = 'bottom',
  respectSafeZone = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const emotionStyle = EMOTION_STYLES[hook.emotional_trigger];
  const gravity = calculateGravityAlignment(position);

  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const getEmotionAnimation = (): React.CSSProperties => {
    switch (emotionStyle.animation) {
      case 'shake': {
        const shake = Math.sin(frame * 2) * 3;
        return { transform: `translateX(${shake}px)` };
      }
      case 'glow': {
        const glowSize = 20 + Math.sin(frame / 5) * 10;
        return { boxShadow: `0 0 ${glowSize}px ${emotionStyle.color}80` };
      }
      case 'bounce': {
        const bounceY = Math.sin(frame / 8) * 5;
        return { transform: `translateY(${bounceY}px)` };
      }
      case 'pulse': {
        const pulse = 1 + Math.sin(frame / 10) * 0.05;
        return { transform: `scale(${pulse})` };
      }
      case 'pop':
      default:
        return {};
    }
  };

  const getPositionInSafeZone = (): React.CSSProperties => {
    const safeZone = YOUTUBE_SHORTS_SAFE_ZONE;
    switch (position) {
      case 'top':
        return {
          top: `${safeZone.top}%`,
          paddingTop: gravity.breathingRoom + Math.abs(gravity.offsetY),
        };
      case 'center':
        return {
          top: `${safeZone.top + (100 - safeZone.top - safeZone.bottom) / 2}%`,
          transform: `translateY(-50%) translateX(${gravity.offsetX}px)`,
        };
      case 'bottom':
      default:
        return {
          bottom: `${safeZone.bottom}%`,
          paddingBottom: gravity.breathingRoom + Math.abs(gravity.offsetY),
        };
    }
  };

  const Content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: '24px 40px',
        background: emotionStyle.gradient,
        borderRadius: 20,
        opacity: enterProgress,
        transform: `scale(${0.8 + enterProgress * 0.2})`,
        ...getEmotionAnimation(),
        maxWidth: respectSafeZone
          ? `${100 - YOUTUBE_SHORTS_SAFE_ZONE.left - YOUTUBE_SHORTS_SAFE_ZONE.right - 10}%`
          : '90%',
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: 32,
          fontWeight: 700,
          color: '#ffffff',
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          maxWidth: 400,
        }}
      >
        {hook.text}
      </div>

      {hook.injected_cta && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 30,
            fontFamily: theme.fonts.body,
            fontSize: 20,
            fontWeight: 600,
            color: '#ffffff',
          }}
        >
          <span>{emotionStyle.icon}</span>
          <span>{hook.injected_cta}</span>
        </div>
      )}
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: respectSafeZone ? 'stretch' : 'center',
        pointerEvents: 'none',
        ...(respectSafeZone
          ? {
              left: `${YOUTUBE_SHORTS_SAFE_ZONE.left}%`,
              right: `${YOUTUBE_SHORTS_SAFE_ZONE.right}%`,
              ...getPositionInSafeZone(),
            }
          : {}),
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems:
            position === 'top'
              ? 'flex-start'
              : position === 'bottom'
                ? 'flex-end'
                : 'center',
          width: '100%',
          height: respectSafeZone ? 'auto' : '100%',
        }}
      >
        {Content}
      </div>
    </AbsoluteFill>
  );
};
