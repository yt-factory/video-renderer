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
const ACCENT_COLOR = "#00d9ff";
const BG_COLOR = "#0a0a0f";

// Visual hint icon mapping
const VISUAL_HINT_ICONS: Record<string, string> = {
  code_block: "\u2318", // command key symbol
  diagram: "\u25C6", // diamond
  text_animation: "\u2726", // 4-pointed star
  "b-roll": "\u25CE", // bullseye
  screen_recording: "\u25A3", // square with fill
  talking_head_placeholder: "\u263A", // smiley
};

const VISUAL_HINT_COLORS: Record<string, string> = {
  code_block: "#a78bfa",
  diagram: "#34d399",
  text_animation: "#fbbf24",
  "b-roll": "#f87171",
  screen_recording: "#60a5fa",
  talking_head_placeholder: "#fb923c",
};

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
  const fallbackSeo =
    regionalSeo.find((r) => r.language === "en") || regionalSeo[0];
  const title =
    langSeo?.titles?.[0] ||
    fallbackSeo?.titles?.[0] ||
    manifest.seo?.title ||
    (lang === "zh" ? "\u6781\u5BA2\u7985" : "Geek Zen");

  const segments = manifest.content_engine?.script || [];
  const tags = manifest.content_engine?.seo?.tags || [];

  return (
    <AbsoluteFill style={{ backgroundColor: BG_COLOR }}>
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
        backgroundColor: BG_COLOR,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", opacity: breathing }}>
        <h1 style={{ color: ACCENT_COLOR, fontSize: 72, margin: 0 }}>
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
    const proportion = seg.estimated_duration_seconds / totalDuration;
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
}> = ({ title, lang, segments, tags, contentDuration }) => {
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
        backgroundColor: BG_COLOR,
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

      {/* Visual hint background effect */}
      {currentSegment && (
        <VisualHintBackground
          visualHint={currentSegment.visual_hint}
          frame={frame}
          segmentFrame={currentTiming ? frame - currentTiming.from : 0}
        />
      )}

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
            color: ACCENT_COLOR,
            fontSize: 36,
            fontWeight: 600,
            margin: 0,
            textShadow: "0 0 20px rgba(0, 217, 255, 0.3)",
            letterSpacing: "0.05em",
          }}
        >
          {lang === "zh" ? "\u6781\u5BA2\u7985" : "Geek Zen"}
        </h1>

        {/* Segment counter */}
        {segments.length > 0 && currentSegIdx >= 0 && (
          <div
            style={{
              color: "#555",
              fontSize: 16,
              fontFamily: "JetBrains Mono, Consolas, monospace",
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
            color: "#555",
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
          />
        ) : segments.length === 0 ? (
          <div style={{ color: "#444", fontSize: 24 }}>
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
                  color: "#666",
                  fontSize: 12,
                  padding: "3px 10px",
                  border: "1px solid #333",
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
              backgroundColor: ACCENT_COLOR,
              borderRadius: 2,
              boxShadow: `0 0 8px rgba(0, 217, 255, 0.3)`,
            }}
          />
        </div>

        {/* Timestamp */}
        {currentSegment && (
          <div
            style={{
              textAlign: "right",
              marginTop: 8,
              color: "#444",
              fontSize: 14,
              fontFamily: "JetBrains Mono, Consolas, monospace",
            }}
          >
            {currentSegment.timestamp}
          </div>
        )}
      </div>

      {/* Audio visualizer */}
      <AudioVisualizer frame={frame} />
    </AbsoluteFill>
  );
};

// Segment renderer - displays content based on visual_hint
const SegmentRenderer: React.FC<{
  segment: Segment;
  segmentIndex: number;
  localFrame: number;
  segmentDuration: number;
  fps: number;
}> = ({ segment, segmentIndex, localFrame, segmentDuration, fps }) => {
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

  const hintColor =
    VISUAL_HINT_COLORS[segment.visual_hint] || ACCENT_COLOR;
  const hintIcon =
    VISUAL_HINT_ICONS[segment.visual_hint] || "\u2726";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1200,
        opacity: enterProgress * exitOpacity,
        transform: `translateY(${interpolate(enterProgress, [0, 1], [20, 0])}px)`,
      }}
    >
      {/* Visual hint badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <span
          style={{
            color: hintColor,
            fontSize: 20,
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${hintColor}40`,
            borderRadius: 8,
            backgroundColor: `${hintColor}10`,
          }}
        >
          {hintIcon}
        </span>
        <span
          style={{
            color: hintColor,
            fontSize: 14,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 600,
          }}
        >
          {segment.visual_hint.replace(/[-_]/g, " ")}
        </span>

        {/* Emotional trigger indicator */}
        {segment.emotional_trigger && (
          <span
            style={{
              color: "#888",
              fontSize: 12,
              padding: "2px 8px",
              border: "1px solid #444",
              borderRadius: 10,
              marginLeft: "auto",
            }}
          >
            {segment.emotional_trigger}
          </span>
        )}
      </div>

      {/* Voiceover text - the main content */}
      <VoiceoverDisplay
        text={segment.voiceover}
        emphasisWords={segment.emphasis_words}
        localFrame={localFrame}
        segmentDuration={segmentDuration}
        fps={fps}
        accentColor={hintColor}
      />

      {/* Timestamp */}
      <div
        style={{
          marginTop: 30,
          color: "#333",
          fontSize: 16,
          fontFamily: "JetBrains Mono, Consolas, monospace",
        }}
      >
        [{segment.timestamp}]{" "}
        <span style={{ color: "#444" }}>
          ~{segment.estimated_duration_seconds}s
        </span>
      </div>
    </div>
  );
};

// Voiceover text display with word-level animation
const VoiceoverDisplay: React.FC<{
  text: string;
  emphasisWords?: string[];
  localFrame: number;
  segmentDuration: number;
  fps: number;
  accentColor: string;
}> = ({ text, emphasisWords, localFrame, segmentDuration, fps, accentColor }) => {
  const words = text.split(/\s+/);
  const wordsPerFrame = words.length / segmentDuration;
  const currentWordIdx = Math.min(
    Math.floor(localFrame * wordsPerFrame),
    words.length - 1
  );

  return (
    <div
      style={{
        fontSize: 32,
        lineHeight: 1.6,
        color: "#ccc",
        maxWidth: 1000,
      }}
    >
      {words.map((word, i) => {
        const isActive = i === currentWordIdx;
        const isPast = i < currentWordIdx;
        const isEmphasis = emphasisWords?.some(
          (ew) => word.toLowerCase().includes(ew.toLowerCase())
        );

        let color = "#555"; // future word
        if (isPast) color = "#999";
        if (isActive) color = "#fff";
        if (isEmphasis && (isActive || isPast)) color = accentColor;

        return (
          <span
            key={i}
            style={{
              color,
              fontWeight: isEmphasis ? 700 : isActive ? 600 : 400,
              fontSize: isActive ? 34 : 32,
              transition: "color 0.1s ease",
              textShadow: isActive
                ? `0 0 20px ${accentColor}40`
                : "none",
            }}
          >
            {word}{" "}
          </span>
        );
      })}
    </div>
  );
};

// Visual hint background effects
const VisualHintBackground: React.FC<{
  visualHint: string;
  frame: number;
  segmentFrame: number;
}> = ({ visualHint, frame, segmentFrame }) => {
  const hintColor = VISUAL_HINT_COLORS[visualHint] || ACCENT_COLOR;

  // Subtle animated background based on visual hint type
  switch (visualHint) {
    case "code_block":
      return (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 30px,
              rgba(167, 139, 250, 0.015) 30px,
              rgba(167, 139, 250, 0.015) 31px
            )`,
            opacity: 0.5 + Math.sin(frame / 60) * 0.1,
          }}
        />
      );

    case "diagram":
      return (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at ${50 + Math.sin(frame / 120) * 10}% ${50 + Math.cos(frame / 100) * 10}%, ${hintColor}06 0%, transparent 50%)`,
          }}
        />
      );

    case "b-roll":
      return (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(${frame * 0.2}deg, rgba(248, 113, 113, 0.02) 0%, transparent 50%, rgba(248, 113, 113, 0.01) 100%)`,
          }}
        />
      );

    default:
      return null;
  }
};

// Subtle audio visualizer
const AudioVisualizer: React.FC<{ frame: number }> = ({ frame }) => {
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
          backgroundColor: ACCENT_COLOR,
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
