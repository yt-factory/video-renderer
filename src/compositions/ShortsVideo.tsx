/**
 * ShortsVideo - A thin wrapper around MainVideo layout adapted for 9:16 (Shorts).
 *
 * Key differences from MainVideo:
 * - Larger fonts (viewers hold phone closer)
 * - Title and brand bar repositioned for vertical
 * - Progress bar wider (full width minus safe zones)
 * - Safe zone awareness (YouTube Shorts UI overlays)
 *   top 10%, bottom 22%, right 18%
 *
 * Reuses the same theme system, segment components, and calculateSegmentFrames
 * logic from MainVideo.
 */
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
import type { MainVideoProps, Segment, Manifest } from "./MainVideo";

// Safe zone percentages for YouTube Shorts
const SAFE_ZONE = {
  top: 10, // status bar + search
  bottom: 22, // description, username, music, progress
  right: 18, // like, comment, share buttons
  left: 5, // left edge
} as const;

const BUFFER_FRAMES = 30;

const FALLBACK_ACCENT = "#00d9ff";
const FALLBACK_BG = "#0a0a0f";

/**
 * Calculate frame ranges for each segment proportionally.
 * Duplicated from MainVideo to keep this file self-contained.
 */
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
    const proportion =
      totalDuration > 0
        ? seg.estimated_duration_seconds / totalDuration
        : 1 / segments.length;
    const segFrames =
      i === segments.length - 1
        ? totalFrames - currentFrame
        : Math.round(totalFrames * proportion);

    result.push({ from: currentFrame, duration: Math.max(1, segFrames) });
    currentFrame += segFrames;
  }

  return result;
}

export const ShortsVideo: React.FC<MainVideoProps> = ({
  manifest,
  renderMeta,
  lang = "en",
  audioFile,
}) => {
  const { durationInFrames } = useVideoConfig();

  if (!manifest) {
    return <ShortsPreviewPlaceholder />;
  }

  const contentDuration = Math.max(1, durationInFrames - BUFFER_FRAMES * 2);

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
      {/* Audio layer */}
      {audioFile && (
        <Sequence from={BUFFER_FRAMES}>
          <Audio src={staticFile(audioFile)} volume={1} />
        </Sequence>
      )}

      {/* Fade in */}
      <Sequence from={0} durationInFrames={BUFFER_FRAMES}>
        <FadeIn />
      </Sequence>

      {/* Main content adapted for vertical */}
      <Sequence from={BUFFER_FRAMES} durationInFrames={contentDuration}>
        <ShortsContent
          title={title}
          lang={lang}
          segments={segments}
          tags={tags}
          contentDuration={contentDuration}
          theme={theme}
        />
      </Sequence>

      {/* Fade out */}
      <Sequence
        from={BUFFER_FRAMES + contentDuration}
        durationInFrames={BUFFER_FRAMES}
      >
        <FadeOut />
      </Sequence>

      {/* Render metadata */}
      {renderMeta && (
        <div
          style={{
            position: "absolute",
            bottom: `${SAFE_ZONE.bottom + 1}%`,
            left: `${SAFE_ZONE.left}%`,
            fontSize: 9,
            color: "rgba(255,255,255,0.1)",
            fontFamily: "monospace",
          }}
        >
          {renderMeta.traceId}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Shorts-adapted content renderer
// ---------------------------------------------------------------------------

const ShortsContent: React.FC<{
  title: string;
  lang: string;
  segments: Segment[];
  tags: string[];
  contentDuration: number;
  theme: ThemeConfig;
}> = ({ title, lang, segments, tags, contentDuration, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, fps * 0.8], [0, 1], {
    extrapolateRight: "clamp",
  });

  const segmentFrames = calculateSegmentFrames(segments, contentDuration);

  const currentSegIdx = segmentFrames.findIndex(
    (sf) => frame >= sf.from && frame < sf.from + sf.duration
  );
  const currentSegment = currentSegIdx >= 0 ? segments[currentSegIdx] : null;
  const currentTiming =
    currentSegIdx >= 0 ? segmentFrames[currentSegIdx] : null;

  const progress = frame / contentDuration;

  // Safe zone padding (pixels at 1080x1920)
  const padLeft = `${SAFE_ZONE.left + 2}%`;
  const padRight = `${SAFE_ZONE.right + 2}%`;

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
          background: `radial-gradient(ellipse at 50% 20%, ${theme.colors.primary}0A 0%, transparent 50%),
                       radial-gradient(ellipse at 50% 80%, ${theme.colors.secondary}08 0%, transparent 40%)`,
        }}
      />

      {/* Top brand bar - inside safe zone */}
      <div
        style={{
          position: "absolute",
          top: `${SAFE_ZONE.top + 2}%`,
          left: padLeft,
          right: padRight,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: titleOpacity,
        }}
      >
        <h1
          style={{
            color: theme.colors.primary,
            fontSize: 44, // Larger for vertical
            fontWeight: 600,
            margin: 0,
            fontFamily: `${theme.fonts.heading}, system-ui, sans-serif`,
            textShadow: `0 0 20px ${theme.colors.primary}4D`,
            letterSpacing: "0.05em",
          }}
        >
          {lang === "zh" ? "\u6781\u5BA2\u7985" : "Geek Zen"}
        </h1>

        {segments.length > 0 && currentSegIdx >= 0 && (
          <div
            style={{
              color: theme.colors.muted,
              fontSize: 18,
              fontFamily: `${theme.fonts.code}, JetBrains Mono, Consolas, monospace`,
            }}
          >
            {currentSegIdx + 1}/{segments.length}
          </div>
        )}
      </div>

      {/* Episode title - below brand bar */}
      <div
        style={{
          position: "absolute",
          top: `${SAFE_ZONE.top + 8}%`,
          left: padLeft,
          right: padRight,
          opacity: titleOpacity * 0.7,
        }}
      >
        <p
          style={{
            color: theme.colors.muted,
            fontSize: 24, // Larger for vertical
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {title.length > 50 ? title.substring(0, 50) + "..." : title}
        </p>
      </div>

      {/* Center: segment content - vertically centered in safe area */}
      <div
        style={{
          position: "absolute",
          top: `${SAFE_ZONE.top + 15}%`,
          left: padLeft,
          right: padRight,
          bottom: `${SAFE_ZONE.bottom + 6}%`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {currentSegment && currentTiming ? (
          <ShortsSegmentRenderer
            segment={currentSegment}
            segmentIndex={currentSegIdx}
            localFrame={frame - currentTiming.from}
            segmentDuration={currentTiming.duration}
            fps={fps}
            theme={theme}
          />
        ) : segments.length === 0 ? (
          <div
            style={{
              color: theme.colors.muted,
              fontSize: 28,
              textAlign: "center",
            }}
          >
            {lang === "zh"
              ? "\u7B49\u5F85\u5185\u5BB9..."
              : "Awaiting content..."}
          </div>
        ) : null}
      </div>

      {/* Bottom: progress bar + tags - above unsafe bottom zone */}
      <div
        style={{
          position: "absolute",
          bottom: `${SAFE_ZONE.bottom + 2}%`,
          left: padLeft,
          right: padRight,
        }}
      >
        {/* Tags */}
        {tags.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              flexWrap: "wrap",
              justifyContent: "center",
              opacity: 0.4,
            }}
          >
            {tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                style={{
                  color: theme.colors.muted,
                  fontSize: 14,
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

        {/* Progress bar - full safe-zone width */}
        <div
          style={{
            height: 4,
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
              boxShadow: `0 0 10px ${theme.colors.primary}4D`,
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
              fontSize: 16,
              fontFamily: `${theme.fonts.code}, JetBrains Mono, Consolas, monospace`,
            }}
          >
            {currentSegment.timestamp}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Shorts segment renderer with scaled-up fonts
// ---------------------------------------------------------------------------

const ShortsSegmentRenderer: React.FC<{
  segment: Segment;
  segmentIndex: number;
  localFrame: number;
  segmentDuration: number;
  fps: number;
  theme: ThemeConfig;
}> = ({ segment, localFrame, segmentDuration, fps, theme }) => {
  const enterProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const exitStart = segmentDuration - Math.round(fps * 0.5);
  const exitOpacity =
    localFrame > exitStart
      ? interpolate(localFrame, [exitStart, segmentDuration], [1, 0], {
          extrapolateRight: "clamp",
        })
      : 1;

  const SegmentComponent = resolveSegmentComponent(segment.visual_hint);

  return (
    <div
      style={{
        width: "100%",
        opacity: enterProgress * exitOpacity,
        transform: `translateY(${interpolate(enterProgress, [0, 1], [20, 0])}px) scale(1.15)`,
        transformOrigin: "center center",
      }}
    >
      <SegmentComponent
        voiceover={segment.voiceover}
        theme={theme}
        localFrame={localFrame}
        segmentDuration={segmentDuration}
        fps={fps}
        emphasisWords={segment.emphasis_words}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Preview placeholder for Shorts in Remotion Studio
// ---------------------------------------------------------------------------

const ShortsPreviewPlaceholder: React.FC = () => {
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
        <h1 style={{ color: FALLBACK_ACCENT, fontSize: 64, margin: 0 }}>
          {"\u6781\u5BA2\u7985"}
        </h1>
        <p style={{ color: "#666", fontSize: 24, marginTop: 20 }}>
          Shorts (9:16)
        </p>
        <p style={{ color: "#444", fontSize: 14, marginTop: 40 }}>
          Waiting for manifest...
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Fade helpers
// ---------------------------------------------------------------------------

const FadeIn: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, BUFFER_FRAMES], [1, 0], {
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ backgroundColor: "#000", opacity }} />;
};

const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, BUFFER_FRAMES], [0, 1], {
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ backgroundColor: "#000", opacity }} />;
};
