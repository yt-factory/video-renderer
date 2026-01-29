import React from "react";
import { useCurrentFrame } from "remotion";

interface BreathingTextProps {
  children: React.ReactNode;
  /** Oscillation intensity 0-1 (default 0.1) */
  intensity?: number;
  /** Frames per breathing cycle (default 60) */
  speed?: number;
  /** Additional styles */
  style?: React.CSSProperties;
}

/**
 * BreathingText - Adds a subtle breathing animation to text/elements
 *
 * Creates a calming, organic feel by gently oscillating opacity and scale.
 * Perfect for placeholder text, loading states, or ambient UI elements.
 *
 * @example
 * <BreathingText intensity={0.15} speed={45}>
 *   Loading...
 * </BreathingText>
 */
export const BreathingText: React.FC<BreathingTextProps> = ({
  children,
  intensity = 0.1,
  speed = 60,
  style = {},
}) => {
  const frame = useCurrentFrame();

  // Smooth sine wave oscillation
  const breathing = Math.sin((frame / speed) * Math.PI * 2);

  // Opacity oscillates around 0.9 (never fully invisible)
  const opacity = 0.9 + breathing * intensity;

  // Subtle scale oscillation for depth effect
  const scale = 1 + breathing * 0.02;

  return (
    <div
      style={{
        ...style,
        opacity,
        transform: `scale(${scale})`,
        transition: "transform 0.1s ease-out",
      }}
    >
      {children}
    </div>
  );
};

/**
 * EmotionBreathingText - Breathing with emotion-based speed
 *
 * Different emotional states affect the breathing rhythm:
 * - calm: slow, relaxed breathing (80 frames/cycle)
 * - curious: slightly faster, anticipatory (50 frames/cycle)
 * - excited: rapid, energetic (30 frames/cycle)
 * - urgent: very fast, tension-building (20 frames/cycle)
 */
export const EmotionBreathingText: React.FC<
  BreathingTextProps & {
    emotion?: "calm" | "curious" | "excited" | "urgent";
  }
> = ({ children, emotion = "calm", intensity, style }) => {
  const emotionSpeeds: Record<string, number> = {
    calm: 80,
    curious: 50,
    excited: 30,
    urgent: 20,
  };

  const emotionIntensities: Record<string, number> = {
    calm: 0.08,
    curious: 0.12,
    excited: 0.18,
    urgent: 0.25,
  };

  return (
    <BreathingText
      speed={emotionSpeeds[emotion]}
      intensity={intensity ?? emotionIntensities[emotion]}
      style={style}
    >
      {children}
    </BreathingText>
  );
};
