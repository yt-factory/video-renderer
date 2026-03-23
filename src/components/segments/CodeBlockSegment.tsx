import React from "react";
import { interpolate, spring } from "remotion";
import type { ThemeConfig } from "../../themes/types";

export interface CodeBlockSegmentProps {
  voiceover: string;
  theme: ThemeConfig;
  localFrame: number;
  segmentDuration: number;
  fps: number;
}

/**
 * CodeBlockSegment - Terminal/IDE-like code display.
 *
 * Renders a "terminal window" with a title bar (three dots) and dark background.
 * Voiceover text appears line-by-line with a typing animation driven by frame interpolation.
 */
export const CodeBlockSegment: React.FC<CodeBlockSegmentProps> = ({
  voiceover,
  theme,
  localFrame,
  segmentDuration,
  fps,
}) => {
  const segmentStyle = theme.segmentStyles["code_block"] ?? {
    background: "#1e1e2e",
    border: "#3b3b4f",
    accentColor: "#a78bfa",
  };

  const codeFont = theme.fonts.code;

  // Split voiceover into lines (by sentence or newlines)
  const lines = voiceover
    .split(/(?<=[.!?])\s+|\n/)
    .filter((line) => line.trim().length > 0);

  // Calculate how many frames per line for staggered reveal
  const revealWindow = Math.max(1, segmentDuration * 0.75);
  const framesPerLine = lines.length > 0 ? revealWindow / lines.length : 1;

  // Entrance spring for the whole terminal
  const enterProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  // Cursor blink cycle (30 frames on, 30 frames off)
  const cursorVisible = Math.floor(localFrame / 20) % 2 === 0;

  // Determine which line the cursor is on
  const currentLineIndex = Math.min(
    Math.floor(localFrame / framesPerLine),
    lines.length - 1
  );

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1000,
        opacity: enterProgress,
        transform: `translateY(${interpolate(enterProgress, [0, 1], [20, 0])}px)`,
      }}
    >
      {/* Terminal window */}
      <div
        style={{
          background: segmentStyle.background,
          border: `1px solid ${segmentStyle.border}`,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 1px ${segmentStyle.border}`,
        }}
      >
        {/* Title bar with three dots */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            background: "rgba(0, 0, 0, 0.3)",
            borderBottom: `1px solid ${segmentStyle.border}`,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ff5f56",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ffbd2e",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#27c93f",
            }}
          />
          <span
            style={{
              marginLeft: 12,
              color: "rgba(255, 255, 255, 0.35)",
              fontSize: 13,
              fontFamily: codeFont,
            }}
          >
            terminal
          </span>
        </div>

        {/* Code content area */}
        <div
          style={{
            padding: "20px 24px",
            fontFamily: codeFont,
            fontSize: 20,
            lineHeight: 1.8,
            minHeight: 200,
          }}
        >
          {lines.map((line, i) => {
            const lineStartFrame = i * framesPerLine;
            const lineEndFrame = lineStartFrame + framesPerLine;

            // Line is not yet revealed
            if (localFrame < lineStartFrame) {
              return null;
            }

            // Calculate how much of this line to show (typing effect)
            const lineProgress = interpolate(
              localFrame,
              [lineStartFrame, lineEndFrame],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            const charsToShow = Math.ceil(line.length * lineProgress);
            const visibleText = line.substring(0, charsToShow);
            const isCurrentLine = i === currentLineIndex;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                }}
              >
                {/* Line number */}
                <span
                  style={{
                    color: "rgba(255, 255, 255, 0.2)",
                    fontSize: 14,
                    minWidth: 28,
                    textAlign: "right",
                    userSelect: "none",
                  }}
                >
                  {i + 1}
                </span>

                {/* Line content */}
                <span
                  style={{
                    color:
                      lineProgress >= 1
                        ? "rgba(255, 255, 255, 0.75)"
                        : segmentStyle.accentColor,
                  }}
                >
                  {visibleText}
                  {/* Blinking cursor on current line */}
                  {isCurrentLine && lineProgress < 1 && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: "1.1em",
                        background: cursorVisible
                          ? segmentStyle.accentColor
                          : "transparent",
                        marginLeft: 2,
                        verticalAlign: "text-bottom",
                      }}
                    />
                  )}
                </span>
              </div>
            );
          })}

          {/* Cursor at the end when all lines are revealed */}
          {localFrame >= revealWindow && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span
                style={{
                  color: "rgba(255, 255, 255, 0.2)",
                  fontSize: 14,
                  minWidth: 28,
                  textAlign: "right",
                }}
              >
                {lines.length + 1}
              </span>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: "1.1em",
                  background: cursorVisible
                    ? segmentStyle.accentColor
                    : "transparent",
                  verticalAlign: "text-bottom",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
