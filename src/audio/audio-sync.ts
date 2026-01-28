import { useState, useEffect } from 'react';
import { delayRender, continueRender } from 'remotion';
import { getAudioDurationInSeconds } from '@remotion/media-utils';
import { ScriptSegment, ContentEngine, EmotionalTrigger } from '../core/manifest-parser';
import { logger } from '../utils/logger';

// Pacing gap configuration by content type
const CONTENT_TYPE_GAPS: Record<string, number> = {
  tutorial: 0.5,
  news: 0.3,
  analysis: 0.6,
  entertainment: 0.25,
};

const CHAPTER_TRANSITION_GAP = 1.0;

const POST_EMOTION_GAPS: Record<EmotionalTrigger, number> = {
  anger: 0.4,
  awe: 0.8,
  curiosity: 0.3,
  fomo: 0.2,
  validation: 0.5,
};

const VISUAL_HINT_GAP_MODIFIERS: Record<string, number> = {
  code_block: 0.3,
  diagram: 0.4,
  text_animation: 0.2,
  b_roll: 0.1,
  screen_recording: 0.2,
  talking_head_placeholder: 0.2,
};

export interface AudioSegmentTiming {
  segmentIndex: number;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  durationSeconds: number;
  audioPath: string;
  voiceover: string;
  pacingGap: {
    afterGapFrames: number;
    reason: string;
  };
}

export interface AudioTimeline {
  segments: AudioSegmentTiming[];
  totalFrames: number;
  totalDurationSeconds: number;
  pacingStats: {
    totalGapSeconds: number;
    averageGapSeconds: number;
    contentType: string;
  };
}

function calculatePacingGap(
  segment: ScriptSegment,
  nextSegment: ScriptSegment | null,
  contentType: string,
  isChapterEndFlag: boolean,
  fps: number
): { afterGapFrames: number; reason: string } {
  let gapSeconds = CONTENT_TYPE_GAPS[contentType] || 0.3;
  let reason = `Base gap for ${contentType}`;

  if (isChapterEndFlag) {
    gapSeconds = CHAPTER_TRANSITION_GAP;
    reason = 'Chapter transition';
  }

  const visualModifier = VISUAL_HINT_GAP_MODIFIERS[segment.visual_hint] || 0;
  gapSeconds += visualModifier;
  if (visualModifier > 0) {
    reason += ` + ${segment.visual_hint} modifier`;
  }

  if (segment.emotional_trigger) {
    const emotionGap = POST_EMOTION_GAPS[segment.emotional_trigger];
    if (emotionGap) {
      gapSeconds = Math.max(gapSeconds, emotionGap);
      reason += ` + post-${segment.emotional_trigger}`;
    }
  }

  if (
    nextSegment?.emotional_trigger === 'fomo' ||
    nextSegment?.emotional_trigger === 'anger'
  ) {
    gapSeconds = Math.min(gapSeconds, 0.25);
    reason = `Shortened for upcoming ${nextSegment.emotional_trigger}`;
  }

  return {
    afterGapFrames: Math.ceil(gapSeconds * fps),
    reason,
  };
}

function isChapterEnd(
  currentTimestamp: string,
  nextTimestamp: string | null,
  chapters: string
): boolean {
  if (!nextTimestamp) return true;

  const chapterStarts = chapters
    .split('\n')
    .map((line) => line.match(/^(\d{2}:\d{2})/)?.[1])
    .filter(Boolean);

  return chapterStarts.includes(nextTimestamp);
}

export async function calculateAudioDrivenTimeline(
  audioSegments: Array<{ path: string; segment: ScriptSegment }>,
  fps: number,
  projectId: string,
  contentEngine: ContentEngine
): Promise<AudioTimeline> {
  const timings: AudioSegmentTiming[] = [];
  let currentFrame = 0;
  let totalGapSeconds = 0;

  const contentType = contentEngine.media_preference.visual.content_type;
  const chapters = contentEngine.seo.chapters;

  logger.info('Calculating audio-driven timeline with pacing', {
    projectId,
    segmentCount: audioSegments.length.toString(),
    contentType,
    fps: fps.toString(),
  });

  for (let i = 0; i < audioSegments.length; i++) {
    const { path, segment } = audioSegments[i];
    const nextSegment = audioSegments[i + 1]?.segment || null;

    let audioDurationSeconds: number;
    try {
      audioDurationSeconds = await getAudioDurationInSeconds(path);
    } catch {
      logger.warn('Could not get audio duration, using estimate', {
        projectId,
        segmentIndex: i.toString(),
      });
      audioDurationSeconds = segment.estimated_duration_seconds;
    }

    const isChapterEndFlag = isChapterEnd(
      segment.timestamp,
      nextSegment?.timestamp || null,
      chapters
    );

    const pacingGap = calculatePacingGap(
      segment,
      nextSegment,
      contentType,
      isChapterEndFlag,
      fps
    );

    const audioFrames = Math.ceil(audioDurationSeconds * fps);
    const totalSegmentFrames = audioFrames + pacingGap.afterGapFrames;

    totalGapSeconds += pacingGap.afterGapFrames / fps;

    timings.push({
      segmentIndex: i,
      startFrame: currentFrame,
      endFrame: currentFrame + totalSegmentFrames,
      durationFrames: totalSegmentFrames,
      durationSeconds: totalSegmentFrames / fps,
      audioPath: path,
      voiceover: segment.voiceover,
      pacingGap: {
        afterGapFrames: pacingGap.afterGapFrames,
        reason: pacingGap.reason,
      },
    });

    currentFrame += totalSegmentFrames;
  }

  const timeline: AudioTimeline = {
    segments: timings,
    totalFrames: currentFrame,
    totalDurationSeconds: currentFrame / fps,
    pacingStats: {
      totalGapSeconds,
      averageGapSeconds: totalGapSeconds / timings.length,
      contentType,
    },
  };

  logger.info('Audio timeline with pacing calculated', {
    projectId,
    totalFrames: timeline.totalFrames.toString(),
    totalDuration: `${timeline.totalDurationSeconds.toFixed(2)}s`,
    totalGapTime: `${totalGapSeconds.toFixed(2)}s`,
  });

  return timeline;
}

export function useAudioTimeline(
  audioSegments: Array<{ path: string; segment: ScriptSegment }>,
  fps: number,
  projectId: string,
  contentEngine: ContentEngine
): AudioTimeline | null {
  const [timeline, setTimeline] = useState<AudioTimeline | null>(null);
  const [handle] = useState(() => delayRender('Loading audio timeline with pacing'));

  useEffect(() => {
    calculateAudioDrivenTimeline(audioSegments, fps, projectId, contentEngine)
      .then((result) => {
        setTimeline(result);
        continueRender(handle);
      })
      .catch((error) => {
        logger.error('Failed to calculate audio timeline', { projectId, error: String(error) });
        continueRender(handle);
      });
  }, [audioSegments, fps, projectId, contentEngine, handle]);

  return timeline;
}

export function isInPacingGap(segment: AudioSegmentTiming, frame: number): boolean {
  if (segment.pacingGap.afterGapFrames === 0) return false;
  const gapStartFrame = segment.endFrame - segment.pacingGap.afterGapFrames;
  return frame >= gapStartFrame && frame < segment.endFrame;
}

export function getSegmentAtFrame(
  timeline: AudioTimeline,
  frame: number
): AudioSegmentTiming | null {
  return timeline.segments.find((seg) => frame >= seg.startFrame && frame < seg.endFrame) || null;
}

export function getSegmentProgress(segment: AudioSegmentTiming, frame: number): number {
  const relativeFrame = frame - segment.startFrame;
  return Math.min(1, Math.max(0, relativeFrame / segment.durationFrames));
}
