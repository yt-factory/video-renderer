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

// Manifest type (from orchestrator)
export interface Manifest {
  project_id?: string;
  seo?: {
    title: string;
    description: string;
    chapters?: string;
    tags?: string[];
  };
  script?: {
    segments: Segment[];
  };
  content_engine?: {
    script: Segment[];
    seo: {
      title?: string;
      description?: string;
      chapters?: string;
      tags?: string[];
    };
  };
  voice?: {
    provider: string;
    name: string;
  };
}

export interface Segment {
  id?: string;
  timestamp?: string;
  voiceover: string;
  visual_hint?: string;
  startTime?: number;
  endTime?: number;
  estimated_duration_seconds?: number;
  emotion?: string;
  emotional_trigger?: string;
  emphasis_words?: string[];
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
  const segments = manifest.content_engine?.script || manifest.script?.segments || [];
  const title = manifest.content_engine?.seo?.title || manifest.seo?.title || "Untitled Video";

  // Title entrance animation
  const titleOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, fps * 0.5], [30, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      {/* Video title */}
      <h1
        style={{
          color: "#fff",
          fontSize: 56,
          fontWeight: 700,
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          textShadow: "0 4px 20px rgba(0,217,255,0.3)",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          maxWidth: "80%",
        }}
      >
        {title}
      </h1>

      {/* Segment count indicator */}
      {segments.length > 0 && (
        <div
          style={{
            marginTop: 40,
            color: "#666",
            fontSize: 18,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {segments.length} segments ready to render
        </div>
      )}

      {/* Animated accent line */}
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          width: interpolate(frame, [fps * 0.3, fps], [0, 300], {
            extrapolateRight: "clamp",
          }),
          height: 3,
          background: "linear-gradient(90deg, transparent, #00d9ff, transparent)",
          borderRadius: 2,
        }}
      />
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
