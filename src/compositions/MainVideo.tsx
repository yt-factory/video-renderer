import React from 'react';
import { AbsoluteFill, Audio, Sequence, useVideoConfig } from 'remotion';
import { ScriptSegment } from '../core/manifest-parser';
import { ThemeConfig } from '../templates';
import { AudioTimeline } from '../audio/audio-sync';
import { EmotionalTransition } from '../components/transitions/EmotionalTransition';
import { ChapterSEOOverlay, extractChapterKeywords } from '../components/overlays/ChapterSEOOverlay';
import { SmartSubtitle, generateWordTimeline } from '../components/overlays/SmartSubtitle';

export interface MainVideoProps {
  script: ScriptSegment[];
  audioPath: string;
  audioTimeline?: AudioTimeline;
  chapters: string;
  seoTags: string[];
  theme: ThemeConfig;
}

export const MainVideo: React.FC<MainVideoProps> = ({
  script,
  audioPath,
  audioTimeline,
  chapters,
  seoTags,
  theme,
}) => {
  const { fps } = useVideoConfig();

  const chapterKeywords = extractChapterKeywords(chapters, seoTags);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.background }}>
      {/* Audio track */}
      <Audio src={audioPath} />

      {/* Render each script segment */}
      {script.map((segment, index) => {
        const timing = audioTimeline?.segments[index];
        const startFrame = timing?.startFrame ?? Math.round(index * fps * segment.estimated_duration_seconds);
        const durationFrames = timing?.durationFrames ?? Math.round(segment.estimated_duration_seconds * fps);

        // Find matching chapter keyword
        const chapterKeyword = chapterKeywords.find((ck) => ck.timestamp === segment.timestamp);

        return (
          <Sequence key={index} from={startFrame} durationInFrames={durationFrames}>
            {/* Emotional transition wrapper */}
            {segment.emotional_trigger ? (
              <EmotionalTransition emotion={segment.emotional_trigger} seed={`seg-${index}`}>
                <SegmentContent segment={segment} theme={theme} />
              </EmotionalTransition>
            ) : (
              <SegmentContent segment={segment} theme={theme} />
            )}

            {/* Chapter SEO overlay at chapter starts */}
            {chapterKeyword && (
              <ChapterSEOOverlay
                keyword={chapterKeyword.keyword}
                chapterTitle={chapterKeyword.title}
                chapterNumber={chapterKeywords.indexOf(chapterKeyword) + 1}
                theme={theme}
                seoTags={seoTags}
              />
            )}

            {/* Smart subtitles */}
            <SmartSubtitle
              words={generateWordTimeline(
                segment.voiceover,
                0,
                segment.estimated_duration_seconds,
                segment.emphasis_words,
                seoTags.slice(0, 5)
              )}
              theme={theme}
              style={theme.components.subtitleStyle}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const SegmentContent: React.FC<{ segment: ScriptSegment; theme: ThemeConfig }> = ({
  segment,
  theme,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.background,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Placeholder visual based on hint */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 24,
          color: theme.colors.text,
          textAlign: 'center',
          padding: 40,
        }}
      >
        {segment.visual_hint === 'text_animation' && segment.voiceover}
        {segment.visual_hint === 'code_block' && (
          <pre
            style={{
              fontFamily: theme.fonts.code,
              background: theme.colors.background,
              padding: 20,
              borderRadius: 8,
            }}
          >
            {segment.voiceover}
          </pre>
        )}
      </div>
    </AbsoluteFill>
  );
};
