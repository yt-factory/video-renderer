import React from "react";
import { interpolate, spring } from "remotion";
import type { ThemeConfig } from "../../themes/types";

export interface TalkingHeadSegmentProps {
  voiceover: string;
  theme: ThemeConfig;
  localFrame: number;
  segmentDuration: number;
  fps: number;
}

/**
 * TalkingHeadSegment - Avatar/silhouette placeholder with audio waveform.
 *
 * Renders a circular avatar placeholder (silhouette) with animated audio
 * waveform bars below (sine waves based on frame). Voiceover text appears
 * as a caption underneath.
 */
export const TalkingHeadSegment: React.FC<TalkingHeadSegmentProps> = ({
  voiceover,
  theme,
  localFrame,
  segmentDuration,
  fps,
}) => {
  const segmentStyle = theme.segmentStyles["talking_head_placeholder"] ?? {
    background: "#1a1008",
    border: "#3d2a10",
    accentColor: "#fb923c",
  };

  // Entrance animation
  const enterProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  // Caption text fade-in (slightly delayed)
  const captionOpacity = interpolate(
    localFrame,
    [fps * 0.3, fps * 0.6],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Waveform bars configuration
  const barCount = 24;

  // Avatar glow pulse
  const glowIntensity = 8 + Math.sin(localFrame / (fps * 0.5)) * 4;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 800,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
        opacity: enterProgress,
      }}
    >
      {/* Avatar circle */}
      <div
        style={{
          position: "relative",
          width: 140,
          height: 140,
        }}
      >
        {/* Glow ring */}
        <div
          style={{
            position: "absolute",
            top: -4,
            left: -4,
            width: 148,
            height: 148,
            borderRadius: "50%",
            border: `2px solid ${segmentStyle.accentColor}60`,
            boxShadow: `0 0 ${glowIntensity}px ${segmentStyle.accentColor}40`,
          }}
        />

        {/* Avatar background */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${segmentStyle.background}, ${segmentStyle.border})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Silhouette (head + shoulders shape via nested divs) */}
          <div style={{ position: "relative", width: 80, height: 100 }}>
            {/* Head */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: segmentStyle.accentColor + "30",
                margin: "0 auto",
              }}
            />
            {/* Shoulders */}
            <div
              style={{
                width: 80,
                height: 48,
                borderRadius: "50% 50% 0 0",
                background: segmentStyle.accentColor + "20",
                marginTop: 8,
              }}
            />
          </div>
        </div>
      </div>

      {/* Audio waveform bars */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          height: 48,
        }}
      >
        {Array.from({ length: barCount }, (_, i) => {
          const phase = (i / barCount) * Math.PI * 4;
          const waveHeight =
            8 +
            Math.sin(localFrame / 6 + phase) * 12 +
            Math.sin(localFrame / 10 + phase * 0.7) * 6;
          const barOpacity = 0.4 + Math.sin(localFrame / 8 + phase) * 0.3;

          return (
            <div
              key={i}
              style={{
                width: 4,
                height: Math.max(4, waveHeight),
                borderRadius: 2,
                background: segmentStyle.accentColor,
                opacity: barOpacity,
              }}
            />
          );
        })}
      </div>

      {/* Caption text */}
      <div
        style={{
          opacity: captionOpacity,
          maxWidth: 700,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 24,
            color: "rgba(255, 255, 255, 0.85)",
            lineHeight: 1.5,
            margin: 0,
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
          }}
        >
          {voiceover}
        </p>
      </div>
    </div>
  );
};
