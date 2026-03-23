import React from "react";
import { interpolate } from "remotion";
import type { ThemeConfig } from "../../themes/types";

export interface BRollSegmentProps {
  voiceover: string;
  theme: ThemeConfig;
  localFrame: number;
  segmentDuration: number;
  fps: number;
}

/**
 * BRollSegment - Ambient visual with animated gradient overlay.
 *
 * Full-screen gradient animation where colors shift slowly over time.
 * Voiceover text is shown as a subtle overlay at the bottom of the frame.
 */
export const BRollSegment: React.FC<BRollSegmentProps> = ({
  voiceover,
  theme,
  localFrame,
  segmentDuration,
  fps,
}) => {
  const segmentStyle = theme.segmentStyles["b-roll"] ?? {
    background: "#1a0a0a",
    border: "#3d1a1a",
    accentColor: "#f87171",
  };

  // Slow gradient rotation based on frame
  const gradientAngle = (localFrame / segmentDuration) * 360;

  // Second color shifts hue over time
  const hueShift = Math.sin(localFrame / (fps * 2)) * 30;

  // Text fade-in and out
  const textOpacity = interpolate(
    localFrame,
    [0, fps * 0.5, segmentDuration - fps * 0.5, segmentDuration],
    [0, 0.6, 0.6, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Subtle breathing for background
  const breathScale = 1 + Math.sin(localFrame / (fps * 1.5)) * 0.02;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated gradient background */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "-10%",
          width: "120%",
          height: "120%",
          background: `linear-gradient(${gradientAngle}deg,
            ${segmentStyle.background} 0%,
            ${segmentStyle.accentColor}15 35%,
            ${segmentStyle.border}30 65%,
            ${segmentStyle.background} 100%)`,
          transform: `scale(${breathScale})`,
        }}
      />

      {/* Secondary gradient layer for depth */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `radial-gradient(
            ellipse at ${50 + Math.sin(localFrame / (fps * 3)) * 20}% ${50 + Math.cos(localFrame / (fps * 2)) * 15}%,
            ${segmentStyle.accentColor}12 0%,
            transparent 60%
          )`,
          filter: `hue-rotate(${hueShift}deg)`,
        }}
      />

      {/* Voiceover text overlay at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          left: "8%",
          right: "8%",
          opacity: textOpacity,
        }}
      >
        <p
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 22,
            color: "rgba(255, 255, 255, 0.8)",
            lineHeight: 1.5,
            textAlign: "center",
            textShadow: "0 2px 8px rgba(0, 0, 0, 0.6)",
            margin: 0,
            padding: "16px 24px",
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: 12,
            backdropFilter: "blur(4px)",
          }}
        >
          {voiceover}
        </p>
      </div>
    </div>
  );
};
