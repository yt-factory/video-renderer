import React from "react";
import { interpolate, spring } from "remotion";
import type { ThemeConfig } from "../../themes/types";

export interface ScreenRecordingSegmentProps {
  voiceover: string;
  theme: ThemeConfig;
  localFrame: number;
  segmentDuration: number;
  fps: number;
}

/**
 * Split voiceover text into bullet points by sentence.
 */
function toBulletPoints(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * ScreenRecordingSegment - Monitor/screen frame with content inside.
 *
 * Renders a monitor bezel (rounded rectangle border) with the voiceover
 * text formatted as bullet points inside. Includes a blinking cursor animation.
 */
export const ScreenRecordingSegment: React.FC<ScreenRecordingSegmentProps> = ({
  voiceover,
  theme,
  localFrame,
  segmentDuration,
  fps,
}) => {
  const segmentStyle = theme.segmentStyles["screen_recording"] ?? {
    background: "#0d0d1a",
    border: "#2a2a4a",
    accentColor: "#60a5fa",
  };

  const codeFont = theme.fonts.code;
  const bullets = toBulletPoints(voiceover);

  // Entrance animation
  const enterProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  // Cursor blink
  const cursorOn = Math.floor(localFrame / 18) % 2 === 0;

  // Staggered bullet reveal
  const revealWindow = Math.max(1, segmentDuration * 0.65);
  const framesPerBullet =
    bullets.length > 0 ? revealWindow / bullets.length : 1;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 900,
        opacity: enterProgress,
        transform: `scale(${interpolate(enterProgress, [0, 1], [0.95, 1])})`,
      }}
    >
      {/* Monitor bezel */}
      <div
        style={{
          background: segmentStyle.background,
          border: `3px solid ${segmentStyle.border}`,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: `0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 ${segmentStyle.border}`,
        }}
      >
        {/* Top bar (browser-like) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            background: "rgba(0, 0, 0, 0.4)",
            borderBottom: `1px solid ${segmentStyle.border}`,
          }}
        >
          {/* Window control dots */}
          <div style={{ display: "flex", gap: 6 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#ff5f56",
              }}
            />
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#ffbd2e",
              }}
            />
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#27c93f",
              }}
            />
          </div>

          {/* Address bar */}
          <div
            style={{
              flex: 1,
              marginLeft: 8,
              padding: "4px 12px",
              background: "rgba(255, 255, 255, 0.06)",
              borderRadius: 6,
              fontSize: 12,
              fontFamily: codeFont,
              color: "rgba(255, 255, 255, 0.3)",
            }}
          >
            screen-recording://session
          </div>
        </div>

        {/* Screen content area */}
        <div
          style={{
            padding: "28px 32px",
            minHeight: 240,
            fontFamily: codeFont,
            fontSize: 18,
            lineHeight: 2.0,
          }}
        >
          {bullets.map((bullet, i) => {
            const bulletStartFrame = i * framesPerBullet;
            const bulletOpacity = interpolate(
              localFrame,
              [bulletStartFrame, bulletStartFrame + fps * 0.25],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            const bulletSlide = interpolate(
              localFrame,
              [bulletStartFrame, bulletStartFrame + fps * 0.25],
              [12, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            if (bulletOpacity <= 0) return null;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  opacity: bulletOpacity,
                  transform: `translateX(${bulletSlide}px)`,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    color: segmentStyle.accentColor,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {"\u2022"}
                </span>
                <span
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                  }}
                >
                  {bullet}
                </span>
              </div>
            );
          })}

          {/* Blinking cursor */}
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                color: segmentStyle.accentColor,
                fontSize: 14,
                opacity: 0.5,
              }}
            >
              {">"}
            </span>
            <div
              style={{
                width: 8,
                height: 18,
                background: cursorOn
                  ? segmentStyle.accentColor
                  : "transparent",
                borderRadius: 1,
              }}
            />
          </div>
        </div>
      </div>

      {/* Monitor stand */}
      <div
        style={{
          width: 80,
          height: 20,
          margin: "0 auto",
          background: `linear-gradient(180deg, ${segmentStyle.border}, ${segmentStyle.border}80)`,
          borderRadius: "0 0 4px 4px",
        }}
      />
      <div
        style={{
          width: 140,
          height: 6,
          margin: "0 auto",
          background: segmentStyle.border,
          borderRadius: "0 0 6px 6px",
          opacity: 0.6,
        }}
      />
    </div>
  );
};
