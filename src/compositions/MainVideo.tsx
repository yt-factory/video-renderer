import React from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
  spring,
} from "remotion";
import { selectTheme } from "../themes";
import type { ThemeConfig } from "../themes/types";
import { resolveSegmentComponent } from "../components/segments";

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
    media_preference?: {
      visual?: {
        mood?: string;
        content_type?: string;
        theme_suggestion?: string;
      };
    };
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

/**
 * Detect if text is likely English based on ASCII letter ratio.
 * Used to suppress English voiceover text when rendering non-English videos.
 */
function isLikelyEnglish(text: string): boolean {
  if (text.length === 0) return false;
  const asciiChars = text.replace(/[^a-zA-Z]/g, "").length;
  return asciiChars / text.length > 0.7;
}

// Fallback colors used when no theme is provided (e.g. preview placeholder)
const FALLBACK_ACCENT = "#00d9ff";
const FALLBACK_BG = "#0a0a0f";

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

  const contentDuration = Math.max(1, durationInFrames - BUFFER_FRAMES * 2);

  // Get title for the specified language
  const regionalSeo = manifest.content_engine?.seo?.regional_seo || [];
  const langSeo = regionalSeo.find((r) => r.language === lang);
  const fallbackSeo =
    regionalSeo.find((r) => r.language === "en") || regionalSeo[0];
  const title =
    langSeo?.titles?.[0] ||
    fallbackSeo?.titles?.[0] ||
    manifest.seo?.title ||
    (lang === "zh" ? "\u6781\u5BA2\u7985" : "Geek Zen");

  const segments = manifest.content_engine?.script || [];
  const tags = manifest.content_engine?.seo?.tags || [];

  const mediaPreference = manifest.content_engine?.media_preference;
  const theme = selectTheme(
    mediaPreference?.visual?.mood || "professional",
    mediaPreference?.visual?.content_type || "tutorial",
    mediaPreference?.visual?.theme_suggestion
  );

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.background }}>
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

      {/* Main content with segment rendering */}
      <Sequence from={BUFFER_FRAMES} durationInFrames={contentDuration}>
        <MainContent
          title={title}
          lang={lang}
          segments={segments}
          tags={tags}
          contentDuration={contentDuration}
          theme={theme}
        />
      </Sequence>

      {/* Closing fade out */}
      <Sequence
        from={BUFFER_FRAMES + contentDuration}
        durationInFrames={BUFFER_FRAMES}
      >
        <FadeOut />
      </Sequence>

      {/* Render metadata watermark */}
      {renderMeta && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            fontSize: 10,
            color: "rgba(255,255,255,0.15)",
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
  const breathing = Math.sin(frame / 30) * 0.1 + 0.9;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: FALLBACK_BG,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", opacity: breathing }}>
        <h1 style={{ color: FALLBACK_ACCENT, fontSize: 72, margin: 0 }}>
          {"\u6781\u5BA2\u7985"}
        </h1>
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

// Calculate frame ranges for each segment proportionally
function calculateSegmentFrames(
  segments: Segment[],
  totalFrames: number
): Array<{ from: number; duration: number }> {
  if (segments.length === 0) return [];

  const totalDuration = segments.reduce(
    (sum, s) => sum + s.estimated_duration_seconds,
    0
  );
  if (totalDuration === 0) return [];

  const result: Array<{ from: number; duration: number }> = [];
  let currentFrame = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const proportion = totalDuration > 0 ? seg.estimated_duration_seconds / totalDuration : 1 / segments.length;
    const segFrames =
      i === segments.length - 1
        ? totalFrames - currentFrame // Last segment gets remaining frames
        : Math.round(totalFrames * proportion);

    result.push({ from: currentFrame, duration: Math.max(1, segFrames) });
    currentFrame += segFrames;
  }

  return result;
}

// Main content renderer with segment-based rendering
const MainContent: React.FC<{
  title: string;
  lang: string;
  segments: Segment[];
  tags: string[];
  contentDuration: number;
  theme: ThemeConfig;
}> = ({ title, lang, segments, tags, contentDuration, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title entrance animation
  const titleOpacity = interpolate(frame, [0, fps * 0.8], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Calculate segment timing
  const segmentFrames = calculateSegmentFrames(segments, contentDuration);

  // Find current segment index
  const currentSegIdx = segmentFrames.findIndex(
    (sf) => frame >= sf.from && frame < sf.from + sf.duration
  );
  const currentSegment = currentSegIdx >= 0 ? segments[currentSegIdx] : null;
  const currentTiming =
    currentSegIdx >= 0 ? segmentFrames[currentSegIdx] : null;

  // Overall progress
  const progress = frame / contentDuration;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.background,
        fontFamily: `${theme.fonts.body}, system-ui, -apple-system, sans-serif`,
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
          background: `radial-gradient(ellipse at 50% 30%, ${theme.colors.primary}08 0%, transparent 50%),
                       radial-gradient(ellipse at 80% 80%, ${theme.colors.secondary}06 0%, transparent 40%)`,
        }}
      />

      {/* Top brand bar */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 80,
          right: 80,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: titleOpacity,
        }}
      >
        <h1
          style={{
            color: theme.colors.primary,
            fontSize: 36,
            fontWeight: 600,
            margin: 0,
            fontFamily: `${theme.fonts.heading}, system-ui, sans-serif`,
            textShadow: `0 0 20px ${theme.colors.primary}4D`,
            letterSpacing: "0.05em",
          }}
        >
          {lang === "zh" ? "\u6781\u5BA2\u7985" : "Geek Zen"}
        </h1>

        {/* Segment counter */}
        {segments.length > 0 && currentSegIdx >= 0 && (
          <div
            style={{
              color: theme.colors.muted,
              fontSize: 16,
              fontFamily: `${theme.fonts.code}, JetBrains Mono, Consolas, monospace`,
            }}
          >
            {currentSegIdx + 1}/{segments.length}
          </div>
        )}
      </div>

      {/* Episode title */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 80,
          right: 80,
          opacity: titleOpacity * 0.7,
        }}
      >
        <p
          style={{
            color: theme.colors.muted,
            fontSize: 20,
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {title.length > 80 ? title.substring(0, 80) + "..." : title}
        </p>
      </div>

      {/* Center: Current segment content */}
      <div
        style={{
          position: "absolute",
          top: "22%",
          left: 80,
          right: 80,
          bottom: "22%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {currentSegment && currentTiming ? (
          <SegmentRenderer
            segment={currentSegment}
            segmentIndex={currentSegIdx}
            localFrame={frame - currentTiming.from}
            segmentDuration={currentTiming.duration}
            fps={fps}
            theme={theme}
            lang={lang}
          />
        ) : segments.length === 0 ? (
          <div style={{ color: theme.colors.muted, fontSize: 24 }}>
            {lang === "zh" ? "\u7B49\u5F85\u5185\u5BB9..." : "Awaiting content..."}
          </div>
        ) : null}
      </div>

      {/* Bottom: Progress bar + tags */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 80,
          right: 80,
        }}
      >
        {/* Tags */}
        {tags.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 20,
              flexWrap: "wrap",
              justifyContent: "center",
              opacity: 0.4,
            }}
          >
            {tags.slice(0, 5).map((tag, i) => (
              <span
                key={i}
                style={{
                  color: theme.colors.muted,
                  fontSize: 12,
                  padding: "3px 10px",
                  border: `1px solid ${theme.colors.muted}40`,
                  borderRadius: 12,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div
          style={{
            height: 3,
            backgroundColor: "#1a1a2e",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              backgroundColor: theme.colors.primary,
              borderRadius: 2,
              boxShadow: `0 0 8px ${theme.colors.primary}4D`,
            }}
          />
        </div>

        {/* Timestamp */}
        {currentSegment && (
          <div
            style={{
              textAlign: "right",
              marginTop: 8,
              color: theme.colors.muted,
              fontSize: 14,
              fontFamily: `${theme.fonts.code}, JetBrains Mono, Consolas, monospace`,
            }}
          >
            {currentSegment.timestamp}
          </div>
        )}
      </div>

      {/* Audio visualizer */}
      <AudioVisualizer frame={frame} accentColor={theme.colors.primary} />
    </AbsoluteFill>
  );
};

// Segment renderer - displays content based on visual_hint using resolved component
const SegmentRenderer: React.FC<{
  segment: Segment;
  segmentIndex: number;
  localFrame: number;
  segmentDuration: number;
  fps: number;
  theme: ThemeConfig;
  lang: string;
}> = ({ segment, localFrame, segmentDuration, fps, theme, lang }) => {
  // Entrance animation
  const enterProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  // Exit animation (last 0.5s of segment)
  const exitStart = segmentDuration - Math.round(fps * 0.5);
  const exitOpacity =
    localFrame > exitStart
      ? interpolate(localFrame, [exitStart, segmentDuration], [1, 0], {
          extrapolateRight: "clamp",
        })
      : 1;

  const SegmentComponent = resolveSegmentComponent(segment.visual_hint);

  // Suppress English voiceover text when rendering non-English videos
  const displayVoiceover =
    lang !== "en" && isLikelyEnglish(segment.voiceover)
      ? ""
      : segment.voiceover;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1200,
        opacity: enterProgress * exitOpacity,
        transform: `translateY(${interpolate(enterProgress, [0, 1], [20, 0])}px)`,
      }}
    >
      <SegmentComponent
        voiceover={displayVoiceover}
        theme={theme}
        localFrame={localFrame}
        segmentDuration={segmentDuration}
        fps={fps}
        emphasisWords={segment.emphasis_words}
      />
    </div>
  );
};

// Subtle audio visualizer
const AudioVisualizer: React.FC<{ frame: number; accentColor: string }> = ({
  frame,
  accentColor,
}) => {
  const barCount = 5;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const phase = (i / barCount) * Math.PI * 2;
    const height = 20 + Math.sin(frame / 15 + phase) * 15;
    const opacity = 0.12 + Math.sin(frame / 20 + phase) * 0.08;

    return (
      <div
        key={i}
        style={{
          width: 3,
          height: height,
          backgroundColor: accentColor,
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
        bottom: 100,
        left: 80,
        display: "flex",
        gap: 5,
        alignItems: "flex-end",
        height: 40,
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
