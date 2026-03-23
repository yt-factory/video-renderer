import React from "react";
import { interpolate, spring } from "remotion";
import type { ThemeConfig } from "../../themes/types";

export interface DiagramSegmentProps {
  voiceover: string;
  theme: ThemeConfig;
  localFrame: number;
  segmentDuration: number;
  fps: number;
}

/**
 * Extract key concepts from voiceover text.
 * Takes the first word of each sentence as a "node" label, capped at 5.
 */
function extractNodes(voiceover: string): string[] {
  const sentences = voiceover
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const nodes = sentences
    .map((sentence) => {
      const firstWord = sentence.split(/\s+/)[0];
      return firstWord ? firstWord.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "") : "";
    })
    .filter((w) => w.length > 0)
    .slice(0, 5);

  // Ensure at least 3 nodes by padding with generic labels
  while (nodes.length < 3) {
    nodes.push(`Node ${nodes.length + 1}`);
  }

  return nodes;
}

/**
 * Compute positions for nodes arranged in a circle.
 */
function getNodePositions(
  count: number,
  centerX: number,
  centerY: number,
  radius: number
): Array<{ x: number; y: number }> {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });
}

/**
 * DiagramSegment - Animated node-edge visualization.
 *
 * Extracts key words from voiceover text and renders them as connected circular nodes.
 * Nodes appear one by one with spring animation, and lines draw in with interpolate.
 */
export const DiagramSegment: React.FC<DiagramSegmentProps> = ({
  voiceover,
  theme,
  localFrame,
  segmentDuration,
  fps,
}) => {
  const segmentStyle = theme.segmentStyles["diagram"] ?? {
    background: "#0d1f17",
    border: "#1a3d2e",
    accentColor: "#34d399",
  };

  const nodes = extractNodes(voiceover);
  const nodeCount = nodes.length;

  // Layout constants
  const containerWidth = 700;
  const containerHeight = 500;
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const radius = 170;

  const positions = getNodePositions(nodeCount, centerX, centerY, radius);

  // Stagger: each node appears at an offset
  const framesPerNode = Math.max(1, (segmentDuration * 0.6) / nodeCount);

  // Overall entrance
  const enterProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 18, stiffness: 60 },
  });

  return (
    <div
      style={{
        width: containerWidth,
        height: containerHeight,
        position: "relative",
        opacity: enterProgress,
        transform: `scale(${interpolate(enterProgress, [0, 1], [0.9, 1])})`,
      }}
    >
      {/* Draw edges (lines between consecutive nodes) */}
      <svg
        width={containerWidth}
        height={containerHeight}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {positions.map((pos, i) => {
          if (i === 0) return null;
          const prev = positions[i - 1];

          // Line draws in after both connected nodes have started appearing
          const lineStartFrame = i * framesPerNode;
          const lineEndFrame = lineStartFrame + framesPerNode;
          const lineProgress = interpolate(
            localFrame,
            [lineStartFrame, lineEndFrame],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          if (lineProgress <= 0) return null;

          // Calculate the point along the line based on progress
          const endX = prev.x + (pos.x - prev.x) * lineProgress;
          const endY = prev.y + (pos.y - prev.y) * lineProgress;

          return (
            <line
              key={`edge-${i}`}
              x1={prev.x}
              y1={prev.y}
              x2={endX}
              y2={endY}
              stroke={segmentStyle.accentColor}
              strokeWidth={2}
              strokeOpacity={0.5}
            />
          );
        })}

        {/* Close the loop: last node to first node */}
        {nodeCount > 2 && (() => {
          const last = positions[nodeCount - 1];
          const first = positions[0];
          const lineStartFrame = (nodeCount - 1) * framesPerNode;
          const lineEndFrame = lineStartFrame + framesPerNode;
          const lineProgress = interpolate(
            localFrame,
            [lineStartFrame, lineEndFrame],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          if (lineProgress <= 0) return null;

          const endX = last.x + (first.x - last.x) * lineProgress;
          const endY = last.y + (first.y - last.y) * lineProgress;

          return (
            <line
              key="edge-close"
              x1={last.x}
              y1={last.y}
              x2={endX}
              y2={endY}
              stroke={segmentStyle.accentColor}
              strokeWidth={2}
              strokeOpacity={0.3}
            />
          );
        })()}
      </svg>

      {/* Draw nodes */}
      {positions.map((pos, i) => {
        const nodeAppearFrame = i * framesPerNode;
        const nodeSpring = spring({
          frame: Math.max(0, localFrame - nodeAppearFrame),
          fps,
          config: { damping: 12, stiffness: 120 },
        });

        if (nodeSpring <= 0.01) return null;

        const nodeRadius = 42;

        return (
          <div
            key={`node-${i}`}
            style={{
              position: "absolute",
              left: pos.x - nodeRadius,
              top: pos.y - nodeRadius,
              width: nodeRadius * 2,
              height: nodeRadius * 2,
              borderRadius: "50%",
              background: segmentStyle.background,
              border: `2px solid ${segmentStyle.accentColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${nodeSpring})`,
              opacity: nodeSpring,
              boxShadow: `0 0 20px ${segmentStyle.accentColor}30`,
            }}
          >
            <span
              style={{
                color: segmentStyle.accentColor,
                fontSize: 14,
                fontFamily: theme.fonts.body,
                fontWeight: 600,
                textAlign: "center",
                maxWidth: nodeRadius * 1.6,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {nodes[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
};
