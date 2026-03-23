import React from "react";
import { interpolate, spring } from "remotion";
import type { ThemeConfig } from "../../themes/types";

export interface TextAnimationSegmentProps {
  voiceover: string;
  theme: ThemeConfig;
  localFrame: number;
  segmentDuration: number;
  fps: number;
  emphasisWords?: string[];
}

/**
 * TextAnimationSegment - Kinetic typography with emphasis word highlighting.
 *
 * Displays the full voiceover text centered. Words fade in progressively from
 * left to right. Emphasis words receive a special accent color and scale animation.
 */
export const TextAnimationSegment: React.FC<TextAnimationSegmentProps> = ({
  voiceover,
  theme,
  localFrame,
  segmentDuration,
  fps,
  emphasisWords = [],
}) => {
  const headingFont = theme.fonts.heading;
  const accentColor = theme.colors.accent;

  const words = voiceover.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  // Progressive fade-in: allocate 70% of segment for all words to appear
  const revealWindow = Math.max(1, segmentDuration * 0.7);
  const framesPerWord = wordCount > 0 ? revealWindow / wordCount : 1;

  // Overall container entrance
  const enterProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1000,
        opacity: enterProgress,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.3em",
        lineHeight: 1.6,
      }}
    >
      {words.map((word, i) => {
        const wordStartFrame = i * framesPerWord;

        // Individual word fade-in
        const wordOpacity = interpolate(
          localFrame,
          [wordStartFrame, wordStartFrame + fps * 0.3],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        // Check if this is an emphasis word
        const cleanWord = word.replace(/[.,!?;:"'()]/g, "").toLowerCase();
        const isEmphasis = emphasisWords.some(
          (ew) =>
            cleanWord.includes(ew.toLowerCase()) ||
            ew.toLowerCase().includes(cleanWord)
        );

        // Emphasis scale animation using spring
        const emphasisScale = isEmphasis
          ? spring({
              frame: Math.max(0, localFrame - wordStartFrame),
              fps,
              config: { damping: 10, stiffness: 150 },
            })
          : 0;

        const scale = isEmphasis ? 1 + emphasisScale * 0.2 : 1;

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: headingFont,
              fontSize: isEmphasis ? 38 : 32,
              fontWeight: isEmphasis ? 700 : 400,
              color: isEmphasis ? accentColor : theme.colors.text,
              opacity: wordOpacity,
              transform: `scale(${scale})`,
              textShadow: isEmphasis
                ? `0 0 20px ${accentColor}60`
                : "none",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
