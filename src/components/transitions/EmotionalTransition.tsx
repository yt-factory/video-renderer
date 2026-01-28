import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  random,
} from 'remotion';
import { EmotionalTrigger } from '../../core/manifest-parser';

interface EmotionalTransitionProps {
  emotion: EmotionalTrigger;
  children: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  seed?: string;
}

const EMOTION_EFFECTS: Record<
  EmotionalTrigger,
  { name: string; description: string; psychology: string }
> = {
  anger: {
    name: 'Shake & Flash + Red Glitch',
    description: 'Shake + red flash + RGB separation',
    psychology: 'Triggers adrenaline, promotes comments',
  },
  fomo: {
    name: 'Urgent Pulse',
    description: 'Fast zoom + yellow pulse',
    psychology: 'Creates urgency, promotes action',
  },
  awe: {
    name: 'Slow Zoom & Glow',
    description: 'Slow zoom + soft glow',
    psychology: 'Evokes wonder, promotes sharing',
  },
  curiosity: {
    name: 'Blur Reveal',
    description: 'Blur to clear + slow fade-in',
    psychology: 'Maintains suspense, improves completion rate',
  },
  validation: {
    name: 'Bounce & Check',
    description: 'Bounce + green confirmation',
    psychology: 'Reinforces agreement, promotes likes',
  },
};

const RED_GLITCH_DURATION_FRAMES = 6;

interface GlitchConfig {
  offsetX: number;
  offsetY: number;
  opacity: number;
}

function generateGlitchConfig(frame: number, seed: string): GlitchConfig {
  const r1 = random(`${seed}-x-${frame}`);
  const r2 = random(`${seed}-y-${frame}`);
  const r3 = random(`${seed}-opacity-${frame}`);

  return {
    offsetX: (r1 - 0.5) * 20,
    offsetY: (r2 - 0.5) * 10,
    opacity: 0.1 + r3 * 0.15,
  };
}

const RedGlitchOverlay: React.FC<{
  frame: number;
  seed: string;
  intensity: number;
}> = ({ frame, seed, intensity }) => {
  if (frame >= RED_GLITCH_DURATION_FRAMES) return null;

  const config = generateGlitchConfig(frame, seed);

  return (
    <>
      <AbsoluteFill
        style={{
          background: `rgba(255, 0, 0, ${config.opacity * intensity})`,
          mixBlendMode: 'overlay',
          transform: `translate(${config.offsetX}px, ${config.offsetY}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `rgba(0, 55, 255, ${config.opacity * 0.5 * intensity})`,
          mixBlendMode: 'screen',
          transform: `translate(${-config.offsetX * 0.5}px, ${config.offsetY * 0.5}px)`,
        }}
      />
      {frame % 2 === 0 && (
        <AbsoluteFill
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 2px,
              rgba(0,0,0,${0.1 * intensity}) 2px,
              rgba(0,0,0,${0.1 * intensity}) 4px
            )`,
            opacity: 0.5,
          }}
        />
      )}
      {frame % 3 === 0 && (
        <div
          style={{
            position: 'absolute',
            top: `${30 + config.offsetX * 2}%`,
            left: 0,
            right: 0,
            height: 4,
            background: 'rgba(255, 0, 0, 0.5)',
            transform: `translateX(${config.offsetX * 2}px)`,
          }}
        />
      )}
    </>
  );
};

function getAngerStyle(
  frame: number,
  fps: number,
  intensity: number
): React.CSSProperties {
  const shakeIntensity = frame < RED_GLITCH_DURATION_FRAMES ? 5 : 2;
  const shakeX = Math.sin(frame * 2) * shakeIntensity * intensity;
  const shakeY = Math.cos(frame * 2.5) * (shakeIntensity * 0.5) * intensity;

  const scale = spring({
    frame: Math.max(0, frame - RED_GLITCH_DURATION_FRAMES),
    fps,
    config: { damping: 8, stiffness: 200 },
  });

  return {
    transform: `translate(${shakeX}px, ${shakeY}px) scale(${0.95 + scale * 0.05})`,
    filter:
      frame < RED_GLITCH_DURATION_FRAMES
        ? `contrast(${1.1 + intensity * 0.1}) saturate(${1.2 + intensity * 0.2})`
        : undefined,
  };
}

function getFomoStyle(
  frame: number,
  fps: number,
  intensity: number
): React.CSSProperties {
  const pulse = Math.sin(frame * 0.15) * 0.03 * intensity + 1;
  const enterScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 250 },
  });

  return {
    transform: `scale(${(0.9 + enterScale * 0.1) * pulse})`,
    filter: `saturate(${1 + intensity * 0.2})`,
  };
}

function getAweStyle(
  frame: number,
  fps: number,
  intensity: number
): React.CSSProperties {
  const slowScale = interpolate(frame, [0, fps * 2], [1.05 + intensity * 0.05, 1], {
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(frame, [0, fps * 1.2], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return {
    transform: `scale(${slowScale})`,
    opacity,
    filter: `blur(${interpolate(frame, [0, fps * 0.8], [3 * intensity, 0])}px)`,
  };
}

function getCuriosityStyle(
  frame: number,
  fps: number,
  intensity: number
): React.CSSProperties {
  const blur = interpolate(frame, [0, fps * 1.5], [8 * intensity, 0], {
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(frame, [0, fps], [20 * intensity, 0], {
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(frame, [0, fps * 0.5], [0.5, 1], {
    extrapolateRight: 'clamp',
  });

  return {
    filter: `blur(${blur}px)`,
    transform: `translateY(${translateY}px)`,
    opacity,
  };
}

function getValidationStyle(
  frame: number,
  fps: number,
  intensity: number
): React.CSSProperties {
  const bounce = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 150, mass: 0.8 },
  });

  const satisfactionScale = interpolate(bounce, [0, 0.5, 1], [0.8, 1.05, 1]);

  return {
    transform: `scale(${satisfactionScale})`,
    filter: `brightness(${1 + bounce * 0.1 * intensity})`,
  };
}

export const EmotionalTransition: React.FC<EmotionalTransitionProps> = ({
  emotion,
  children,
  intensity = 'medium',
  seed = 'default',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intensityMultiplier = { low: 0.5, medium: 1, high: 1.5 }[intensity];

  const getTransitionStyle = (): React.CSSProperties => {
    switch (emotion) {
      case 'anger':
        return getAngerStyle(frame, fps, intensityMultiplier);
      case 'fomo':
        return getFomoStyle(frame, fps, intensityMultiplier);
      case 'awe':
        return getAweStyle(frame, fps, intensityMultiplier);
      case 'curiosity':
        return getCuriosityStyle(frame, fps, intensityMultiplier);
      case 'validation':
        return getValidationStyle(frame, fps, intensityMultiplier);
      default:
        return {};
    }
  };

  const getOverlayStyle = (): React.CSSProperties | null => {
    switch (emotion) {
      case 'fomo': {
        const pulseSize = Math.sin(frame * 0.3) * 5 + 10;
        return {
          boxShadow: `inset 0 0 ${pulseSize * intensityMultiplier}px rgba(245, 158, 11, 0.3)`,
        };
      }
      case 'awe': {
        const glowOpacity = interpolate(frame, [0, fps], [0.2, 0], {
          extrapolateRight: 'clamp',
        });
        return {
          background: `radial-gradient(circle, rgba(139, 92, 246, ${glowOpacity * intensityMultiplier}) 0%, transparent 70%)`,
        };
      }
      default:
        return null;
    }
  };

  const overlayStyle = getOverlayStyle();

  return (
    <AbsoluteFill>
      <div style={{ width: '100%', height: '100%', ...getTransitionStyle() }}>{children}</div>

      {emotion === 'anger' && (
        <RedGlitchOverlay frame={frame} seed={seed} intensity={intensityMultiplier} />
      )}

      {overlayStyle && <AbsoluteFill style={{ ...overlayStyle, pointerEvents: 'none' }} />}
    </AbsoluteFill>
  );
};

export function getEmotionSoundEffect(emotion: EmotionalTrigger): string | null {
  const soundEffects: Record<EmotionalTrigger, string> = {
    anger: '/sounds/dramatic-hit.mp3',
    fomo: '/sounds/ticking-clock.mp3',
    awe: '/sounds/magical-shimmer.mp3',
    curiosity: '/sounds/suspense-rise.mp3',
    validation: '/sounds/success-chime.mp3',
  };
  return soundEffects[emotion] || null;
}

export function getRecommendedGlitchDuration(emotion: EmotionalTrigger): number {
  const durations: Record<EmotionalTrigger, number> = {
    anger: 8,
    fomo: 6,
    awe: 4,
    curiosity: 5,
    validation: 3,
  };
  return durations[emotion];
}
