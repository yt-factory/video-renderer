import React from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
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
  language?: string;
  audioDuration?: number;
}

// Segment from orchestrator manifest
export interface Segment {
  timestamp: string; // "00:00" format
  voiceover: string; // Actual content text
  visual_hint: string; // "text_animation" | "b-roll" | "diagram" etc
  estimated_duration_seconds: number; // Duration in seconds
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
  lang?: "en" | "zh";
  audioFile?: string; // Path relative to public directory
}

const BUFFER_FRAMES = 30; // 1 second buffer for fade in/out

export const MainVideo: React.FC<MainVideoProps> = ({
  manifest,
  renderMeta,
  lang = "en",
  audioFile,
}) => {
  const { durationInFrames } = useVideoConfig();

  // Studio preview mode - no manifest provided
  if (!manifest) {
    return <PreviewPlaceholder />;
  }

  const contentDuration = durationInFrames - BUFFER_FRAMES * 2;

  // Get title for the specified language
  const regionalSeo = manifest.content_engine?.seo?.regional_seo || [];
  const langSeo = regionalSeo.find((r) => r.language === lang);
  const fallbackSeo = regionalSeo.find((r) => r.language === "en") || regionalSeo[0];
  const title =
    langSeo?.titles?.[0] ||
    fallbackSeo?.titles?.[0] ||
    manifest.seo?.title ||
    (lang === "zh" ? "极客禅" : "Geek Zen");

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0f" }}>
      {/* Audio layer - plays during content (after buffer) */}
      {audioFile && (
        <Sequence from={BUFFER_FRAMES}>
          <Audio src={staticFile(audioFile)} volume={1} />
        </Sequence>
      )}

      {/* Opening fade in */}
      <Sequence from={0} durationInFrames={BUFFER_FRAMES}>
        <FadeIn />
      </Sequence>

      {/* Main content */}
      <Sequence from={BUFFER_FRAMES} durationInFrames={contentDuration}>
        <MainContent title={title} lang={lang} />
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

// Main content renderer - zen-themed for NotebookLM audio
const MainContent: React.FC<{ title: string; lang: string }> = ({
  title,
  lang,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Breathing animation for ambient feel
  const breathing = Math.sin(frame / 60) * 0.05 + 0.95;

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
      {/* Ambient background gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at 50% 30%, rgba(0, 217, 255, 0.03) 0%, transparent 50%),
                       radial-gradient(ellipse at 80% 80%, rgba(0, 255, 136, 0.02) 0%, transparent 40%)`,
        }}
      />

      {/* Top brand bar */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOpacity * breathing,
        }}
      >
        <h1
          style={{
            color: "#00d9ff",
            fontSize: 48,
            fontWeight: 600,
            margin: 0,
            textShadow: "0 0 30px rgba(0, 217, 255, 0.3)",
            letterSpacing: "0.05em",
          }}
        >
          {lang === "zh" ? "极客禅" : "Geek Zen"}
        </h1>
        <p
          style={{
            color: "#666",
            fontSize: 24,
            marginTop: 16,
            maxWidth: "70%",
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.4,
          }}
        >
          {title.length > 60 ? title.substring(0, 60) + "..." : title}
        </p>
      </div>

      {/* Center: Zen progress bar animation */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "70%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <ZenProgressBar frame={frame} fps={fps} totalFrames={durationInFrames} />
      </div>

      {/* Bottom branding */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#333",
            fontSize: 16,
            fontStyle: "italic",
          }}
        >
          {lang === "zh"
            ? "当你忘了进度条，加载就完成了"
            : "When you forget the progress bar, loading completes"}
        </p>
      </div>

      {/* Audio visualizer hint (subtle) */}
      <AudioVisualizer frame={frame} />
    </AbsoluteFill>
  );
};

// Zen Progress Bar - the signature visual element
const ZenProgressBar: React.FC<{
  frame: number;
  fps: number;
  totalFrames: number;
}> = ({ frame, fps, totalFrames }) => {
  // Progress crawls slowly toward 99% over the video duration
  // Never quite reaches 100% - that's the zen koan
  const maxProgress = 0.99;
  const progress = interpolate(
    frame,
    [0, totalFrames * 0.8], // Reach 99% at 80% of video
    [0, maxProgress],
    { extrapolateRight: "clamp" }
  );

  // When progress is high, add subtle jitter (frustration/anticipation)
  const isStuck = progress >= 0.97;
  const jitter = isStuck ? Math.sin(frame * 0.5) * 3 : 0;

  // Color shifts as progress increases
  const progressColor = isStuck ? "#ff6b6b" : "#00d9ff";
  const glowIntensity = isStuck ? 0.5 : 0.3;

  return (
    <div
      style={{
        width: "100%",
        transform: `translateX(${jitter}px)`,
      }}
    >
      {/* Progress bar track */}
      <div
        style={{
          height: 8,
          backgroundColor: "#1a1a2e",
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        {/* Progress bar fill */}
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            backgroundColor: progressColor,
            borderRadius: 4,
            boxShadow: `0 0 15px rgba(${isStuck ? "255, 107, 107" : "0, 217, 255"}, ${glowIntensity})`,
            transition: "background-color 0.3s ease",
          }}
        />
      </div>

      {/* Percentage display */}
      <div
        style={{
          textAlign: "right",
          marginTop: 12,
          color: isStuck ? "#ff6b6b" : "#444",
          fontSize: 18,
          fontFamily: "JetBrains Mono, Consolas, monospace",
          fontWeight: 500,
        }}
      >
        {Math.floor(progress * 100)}%{isStuck && " ..."}
      </div>

      {/* Zen message when stuck */}
      {isStuck && (
        <div
          style={{
            textAlign: "center",
            marginTop: 40,
            color: "#555",
            fontSize: 14,
            opacity: Math.sin(frame / 30) * 0.3 + 0.7,
          }}
        >
          {frame % (fps * 4) < fps * 2
            ? "Almost there..."
            : "Just a moment..."}
        </div>
      )}
    </div>
  );
};

// Subtle audio visualizer (ambient bars)
const AudioVisualizer: React.FC<{ frame: number }> = ({ frame }) => {
  const barCount = 5;
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Each bar has a different phase for organic movement
    const phase = (i / barCount) * Math.PI * 2;
    const height = 20 + Math.sin(frame / 15 + phase) * 15;
    const opacity = 0.15 + Math.sin(frame / 20 + phase) * 0.1;

    return (
      <div
        key={i}
        style={{
          width: 3,
          height: height,
          backgroundColor: "#00d9ff",
          borderRadius: 2,
          opacity: opacity,
        }}
      />
    );
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 120,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 6,
        alignItems: "flex-end",
        height: 50,
      }}
    >
      {bars}
    </div>
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
