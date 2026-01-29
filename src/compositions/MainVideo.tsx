import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
} from "remotion";

// Render metadata for tracing
export interface RenderMeta {
  traceId: string;
  renderedAt: string;
  pipelineVersion: string;
}

// Segment from orchestrator manifest
export interface Segment {
  timestamp: string;                    // "00:00" format
  voiceover: string;                    // Actual content text
  visual_hint: string;                  // "text_animation" | "b-roll" | "diagram" etc
  estimated_duration_seconds: number;   // Duration in seconds
  emotional_trigger?: string;
  emphasis_words?: string[];
}

// Regional SEO data
export interface RegionalSEO {
  language: string;
  titles: string[];
  description: string;
}

// Manifest type (from orchestrator)
export interface Manifest {
  project_id?: string;
  content_engine?: {
    script: Segment[];
    seo: {
      primary_language: string;
      regional_seo: RegionalSEO[];
      chapters?: string;
      tags?: string[];
    };
    estimated_duration_seconds?: number;
  };
  // Legacy fallback fields
  seo?: {
    title?: string;
  };
}

export interface MainVideoProps {
  manifest: Manifest | null;
  renderMeta: RenderMeta | null;
}

const BUFFER_FRAMES = 30; // 1 second buffer for fade in/out

export const MainVideo: React.FC<MainVideoProps> = ({ manifest, renderMeta }) => {
  const { durationInFrames } = useVideoConfig();

  // Studio preview mode - no manifest provided
  if (!manifest) {
    return <PreviewPlaceholder />;
  }

  const contentDuration = durationInFrames - BUFFER_FRAMES * 2;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0f" }}>
      {/* Opening fade in */}
      <Sequence from={0} durationInFrames={BUFFER_FRAMES}>
        <FadeIn />
      </Sequence>

      {/* Main content */}
      <Sequence from={BUFFER_FRAMES} durationInFrames={contentDuration}>
        <MainContent manifest={manifest} />
      </Sequence>

      {/* Closing fade out */}
      <Sequence
        from={BUFFER_FRAMES + contentDuration}
        durationInFrames={BUFFER_FRAMES}
      >
        <FadeOut />
      </Sequence>

      {/* Render metadata watermark (only in production renders) */}
      {renderMeta && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            fontSize: 10,
            color: "rgba(255,255,255,0.2)",
            fontFamily: "monospace",
          }}
        >
          {renderMeta.traceId}
        </div>
      )}
    </AbsoluteFill>
  );
};

// Preview placeholder for Remotion Studio
const PreviewPlaceholder: React.FC = () => {
  const frame = useCurrentFrame();
  // Breathing animation
  const breathing = Math.sin(frame / 30) * 0.1 + 0.9;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0f",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", opacity: breathing }}>
        <h1 style={{ color: "#00d9ff", fontSize: 72, margin: 0 }}>极客禅</h1>
        <p style={{ color: "#666", fontSize: 28, marginTop: 20 }}>
          YT-Factory Video Renderer
        </p>
        <p style={{ color: "#444", fontSize: 16, marginTop: 40 }}>
          Waiting for manifest...
        </p>
        <div
          style={{
            marginTop: 60,
            display: "flex",
            gap: 20,
            justifyContent: "center",
          }}
        >
          <StatusBadge label="Remotion" status="ready" />
          <StatusBadge label="Manifest" status="waiting" />
          <StatusBadge label="Audio" status="waiting" />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Status badge component
const StatusBadge: React.FC<{
  label: string;
  status: "ready" | "waiting" | "error";
}> = ({ label, status }) => {
  const colors = {
    ready: "#00ff88",
    waiting: "#ffaa00",
    error: "#ff4444",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        background: "rgba(255,255,255,0.05)",
        borderRadius: 20,
        border: `1px solid ${colors[status]}40`,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: colors[status],
        }}
      />
      <span style={{ color: "#888", fontSize: 14 }}>{label}</span>
    </div>
  );
};

// Main content renderer
const MainContent: React.FC<{ manifest: Manifest }> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Get segments from manifest
  const segments = manifest.content_engine?.script || [];

  // Get title - prefer Chinese, fallback to English, then default
  const regionalSeo = manifest.content_engine?.seo?.regional_seo || [];
  const zhSeo = regionalSeo.find(r => r.language === "zh");
  const enSeo = regionalSeo.find(r => r.language === "en");
  const title = zhSeo?.titles?.[0] || enSeo?.titles?.[0] || manifest.seo?.title || "极客禅公案";

  // Calculate segment frame ranges based on estimated_duration_seconds
  let accumulatedFrames = 0;
  const segmentRanges = segments.map((seg) => {
    const startFrame = accumulatedFrames;
    const durationFrames = (seg.estimated_duration_seconds || 5) * fps;
    accumulatedFrames += durationFrames;
    return {
      segment: seg,
      startFrame,
      endFrame: startFrame + durationFrames,
      durationFrames,
    };
  });

  // Find current segment based on frame
  const currentSegmentData = segmentRanges.find(
    ({ startFrame, endFrame }) => frame >= startFrame && frame < endFrame
  );

  const currentSegment = currentSegmentData?.segment;
  const segmentProgress = currentSegmentData
    ? (frame - currentSegmentData.startFrame) / currentSegmentData.durationFrames
    : 0;

  // Text fade in/out animation
  const textOpacity = interpolate(
    segmentProgress,
    [0, 0.08, 0.92, 1],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Title entrance animation (first 1 second)
  const titleOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0f",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top title bar */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOpacity,
        }}
      >
        <h1
          style={{
            color: "#00d9ff",
            fontSize: 36,
            fontWeight: 600,
            margin: 0,
            textShadow: "0 2px 10px rgba(0,217,255,0.3)",
          }}
        >
          {title.length > 40 ? title.substring(0, 40) + "..." : title}
        </h1>
      </div>

      {/* Current segment voiceover text */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          padding: "0 100px",
        }}
      >
        <p
          style={{
            color: "#ffffff",
            fontSize: 44,
            fontWeight: 500,
            textAlign: "center",
            lineHeight: 1.6,
            opacity: textOpacity,
            maxWidth: "85%",
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          {currentSegment?.voiceover || ""}
        </p>
      </div>

      {/* Bottom info bar */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 30,
        }}
      >
        <span style={{ color: "#666", fontSize: 16 }}>
          {currentSegment?.timestamp || "00:00"}
        </span>
        <span
          style={{
            color: "#00d9ff",
            fontSize: 14,
            padding: "4px 12px",
            background: "rgba(0,217,255,0.1)",
            borderRadius: 4,
          }}
        >
          {currentSegment?.visual_hint || "loading"}
        </span>
        <span style={{ color: "#444", fontSize: 14 }}>
          {segmentRanges.findIndex(s => s.segment === currentSegment) + 1} / {segments.length}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(frame / (accumulatedFrames || 1)) * 100}%`,
            background: "linear-gradient(90deg, #00d9ff, #00ffaa)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Fade in overlay
const FadeIn: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, BUFFER_FRAMES], [1, 0], {
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ backgroundColor: "#000", opacity }} />;
};

// Fade out overlay
const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, BUFFER_FRAMES], [0, 1], {
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ backgroundColor: "#000", opacity }} />;
};
