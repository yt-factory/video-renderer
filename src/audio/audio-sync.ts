import { useState, useEffect } from 'react';
import { delayRender, continueRender } from 'remotion';
import { getAudioDurationInSeconds } from '@remotion/media-utils';
import { ScriptSegment, ContentEngine, EmotionalTrigger, ShortsHook } from '../core/manifest-parser';
import { logger } from '../utils/logger';
import {
  CONTENT_TYPE_PACING,
  VISUAL_HINT_PACING,
  EMOTIONAL_PACING,
  PER_VIDEO_RANDOMIZATION,
  COMPLETION_RATE_ADJUSTMENTS,
  createSeededRandom,
  getRandomizedPacing,
  getVideoLevelMultiplier,
  getTimelinePosition,
  getPositionPacingMultiplier,
  getControversyPacingAdjustment,
  isPatternInterruptPoint,
  TimelinePosition,
} from '../core/retention-config';

// Chapter transition gets extra breathing room
const CHAPTER_TRANSITION_GAP = 1.0;

// ============================================
// Types
// ============================================

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
  /** Retention metadata for debugging/analytics */
  retentionMeta?: {
    timelinePosition: TimelinePosition;
    positionMultiplier: number;
    completionRateAdjustment: number;
    videoLevelMultiplier: number;
    isPatternInterrupt: boolean;
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
  /** Extended retention stats */
  retentionStats?: {
    openingZoneGapAvg: number;
    middleZoneGapAvg: number;
    endingZoneGapAvg: number;
    patternInterruptCount: number;
    videoLevelMultiplier: number;
    completionRateDistribution: Record<string, number>;
  };
}

interface PacingContext {
  contentType: string;
  chapters: string;
  projectId: string;
  fps: number;
  estimatedTotalDuration: number;
  hooks: ShortsHook[];
  videoLevelMultiplier: number;
  random: () => number;
}

// ============================================
// Hook Timestamp Mapping
// ============================================

/**
 * Map hooks to segments based on timestamp overlap
 */
function mapHooksToSegments(
  segments: ScriptSegment[],
  hooks: ShortsHook[]
): Map<number, ShortsHook | undefined> {
  const segmentHookMap = new Map<number, ShortsHook | undefined>();

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const segmentTime = parseTimestamp(segment.timestamp);

    // Find matching hook for this segment
    const matchingHook = hooks.find(hook => {
      const hookStart = parseTimestamp(hook.timestamp_start);
      const hookEnd = parseTimestamp(hook.timestamp_end);
      return segmentTime >= hookStart && segmentTime < hookEnd;
    });

    segmentHookMap.set(i, matchingHook);
  }

  return segmentHookMap;
}

/**
 * Parse timestamp string to seconds
 */
function parseTimestamp(timestamp: string): number {
  const match = timestamp.match(/^(\d{2}):(\d{2})$/);
  if (!match) return 0;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

// ============================================
// Pacing Calculation with Retention Optimization
// ============================================

function calculateRetentionOptimizedPacing(
  segment: ScriptSegment,
  segmentIndex: number,
  nextSegment: ScriptSegment | null,
  currentTimeSeconds: number,
  context: PacingContext,
  hook?: ShortsHook
): { afterGapFrames: number; reason: string; retentionMeta: AudioSegmentTiming['retentionMeta'] } {
  const {
    contentType,
    chapters,
    fps,
    estimatedTotalDuration,
    videoLevelMultiplier,
    random,
  } = context;

  // Get base pacing config for content type
  const basePacing = CONTENT_TYPE_PACING[contentType] || CONTENT_TYPE_PACING.tutorial;
  let gapSeconds = getRandomizedPacing(basePacing, random);
  let reason = `Base gap for ${contentType}`;

  // Chapter transition override
  const isChapterEndFlag = isChapterEnd(
    segment.timestamp,
    nextSegment?.timestamp || null,
    chapters
  );

  if (isChapterEndFlag) {
    gapSeconds = CHAPTER_TRANSITION_GAP;
    reason = 'Chapter transition';
  }

  // Visual hint modifier with variance
  const visualPacing = VISUAL_HINT_PACING[segment.visual_hint];
  if (visualPacing) {
    const visualGap = getRandomizedPacing(visualPacing, random);
    gapSeconds += visualGap;
    reason += ` + ${segment.visual_hint} modifier`;
  }

  // Emotional trigger adjustment
  if (segment.emotional_trigger) {
    const emotionPacing = EMOTIONAL_PACING[segment.emotional_trigger];
    if (emotionPacing) {
      const emotionGap = getRandomizedPacing(emotionPacing, random);
      gapSeconds = Math.max(gapSeconds, emotionGap);
      reason += ` + post-${segment.emotional_trigger}`;
    }
  }

  // Shorten if upcoming segment has high-emotion content
  if (
    nextSegment?.emotional_trigger === 'fomo' ||
    nextSegment?.emotional_trigger === 'anger'
  ) {
    gapSeconds = Math.min(gapSeconds, 0.25);
    reason = `Shortened for upcoming ${nextSegment.emotional_trigger}`;
  }

  // ============================================
  // Retention Optimization Adjustments
  // ============================================

  // 1. Timeline position multiplier (opening/middle/ending)
  const timelinePosition = getTimelinePosition(currentTimeSeconds, estimatedTotalDuration);
  const positionMultiplier = getPositionPacingMultiplier(timelinePosition);
  gapSeconds *= positionMultiplier;
  reason += ` | position: ${timelinePosition} (${positionMultiplier.toFixed(2)}x)`;

  // 2. Completion rate adjustment from hook prediction
  let completionRateAdjustment = 1.0;
  if (hook?.predicted_engagement?.completion_rate) {
    completionRateAdjustment = COMPLETION_RATE_ADJUSTMENTS[hook.predicted_engagement.completion_rate] || 1.0;
    gapSeconds *= completionRateAdjustment;
    reason += ` | completion: ${hook.predicted_engagement.completion_rate} (${completionRateAdjustment.toFixed(2)}x)`;
  }

  // 3. Controversy score adjustment
  if (hook?.controversy_score !== undefined && hook.controversy_score > 3) {
    const controversyAdjustment = getControversyPacingAdjustment(hook.controversy_score);
    gapSeconds *= controversyAdjustment;
    reason += ` | controversy: ${hook.controversy_score} (${controversyAdjustment.toFixed(2)}x)`;
  }

  // 4. Video-level multiplier for unique rhythm
  if (PER_VIDEO_RANDOMIZATION.enabled) {
    gapSeconds *= videoLevelMultiplier;
    reason += ` | video-level: ${videoLevelMultiplier.toFixed(2)}x`;
  }

  // 5. Pattern interrupt check
  const isPatternInterrupt = isPatternInterruptPoint(currentTimeSeconds);
  if (isPatternInterrupt) {
    // Shorter gap at pattern interrupt points to re-engage
    gapSeconds *= 0.7;
    reason += ' | pattern-interrupt';
  }

  // Ensure minimum gap
  gapSeconds = Math.max(0.1, gapSeconds);

  return {
    afterGapFrames: Math.ceil(gapSeconds * fps),
    reason,
    retentionMeta: {
      timelinePosition,
      positionMultiplier,
      completionRateAdjustment,
      videoLevelMultiplier,
      isPatternInterrupt,
    },
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

// ============================================
// Main Timeline Calculation
// ============================================

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
  const hooks = contentEngine.shorts.hooks;

  // Create seeded random for consistent per-video randomization
  const random = PER_VIDEO_RANDOMIZATION.enabled
    ? createSeededRandom(projectId)
    : () => 0.5;

  const videoLevelMultiplier = PER_VIDEO_RANDOMIZATION.enabled
    ? getVideoLevelMultiplier(random)
    : 1.0;

  // Map hooks to segments
  const segmentHookMap = mapHooksToSegments(
    audioSegments.map(s => s.segment),
    hooks
  );

  // Stats tracking
  const zoneGaps: Record<TimelinePosition, number[]> = {
    opening: [],
    middle: [],
    ending: [],
  };
  const completionRateCounts: Record<string, number> = { low: 0, medium: 0, high: 0, unknown: 0 };
  let patternInterruptCount = 0;

  logger.info('Calculating retention-optimized audio timeline', {
    projectId,
    segmentCount: audioSegments.length.toString(),
    contentType,
    fps: fps.toString(),
    videoLevelMultiplier: videoLevelMultiplier.toFixed(2),
    hooksCount: hooks.length.toString(),
  });

  // Estimate total duration for position calculation
  const estimatedTotalDuration = contentEngine.estimated_duration_seconds;

  const context: PacingContext = {
    contentType,
    chapters,
    projectId,
    fps,
    estimatedTotalDuration,
    hooks,
    videoLevelMultiplier,
    random,
  };

  let currentTimeSeconds = 0;

  for (let i = 0; i < audioSegments.length; i++) {
    const { path, segment } = audioSegments[i];
    const nextSegment = audioSegments[i + 1]?.segment || null;
    const hook = segmentHookMap.get(i);

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

    const pacingResult = calculateRetentionOptimizedPacing(
      segment,
      i,
      nextSegment,
      currentTimeSeconds,
      context,
      hook
    );

    const audioFrames = Math.ceil(audioDurationSeconds * fps);
    const totalSegmentFrames = audioFrames + pacingResult.afterGapFrames;
    const gapSeconds = pacingResult.afterGapFrames / fps;

    totalGapSeconds += gapSeconds;

    // Track stats
    if (pacingResult.retentionMeta) {
      zoneGaps[pacingResult.retentionMeta.timelinePosition].push(gapSeconds);
      if (pacingResult.retentionMeta.isPatternInterrupt) {
        patternInterruptCount++;
      }
    }

    // Track completion rate distribution
    if (hook?.predicted_engagement?.completion_rate) {
      completionRateCounts[hook.predicted_engagement.completion_rate]++;
    } else {
      completionRateCounts.unknown++;
    }

    timings.push({
      segmentIndex: i,
      startFrame: currentFrame,
      endFrame: currentFrame + totalSegmentFrames,
      durationFrames: totalSegmentFrames,
      durationSeconds: totalSegmentFrames / fps,
      audioPath: path,
      voiceover: segment.voiceover,
      pacingGap: {
        afterGapFrames: pacingResult.afterGapFrames,
        reason: pacingResult.reason,
      },
      retentionMeta: pacingResult.retentionMeta,
    });

    currentFrame += totalSegmentFrames;
    currentTimeSeconds += audioDurationSeconds + gapSeconds;
  }

  // Calculate zone averages
  const calcAvg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const timeline: AudioTimeline = {
    segments: timings,
    totalFrames: currentFrame,
    totalDurationSeconds: currentFrame / fps,
    pacingStats: {
      totalGapSeconds,
      averageGapSeconds: totalGapSeconds / timings.length,
      contentType,
    },
    retentionStats: {
      openingZoneGapAvg: calcAvg(zoneGaps.opening),
      middleZoneGapAvg: calcAvg(zoneGaps.middle),
      endingZoneGapAvg: calcAvg(zoneGaps.ending),
      patternInterruptCount,
      videoLevelMultiplier,
      completionRateDistribution: completionRateCounts,
    },
  };

  logger.info('Retention-optimized audio timeline calculated', {
    projectId,
    totalFrames: timeline.totalFrames.toString(),
    totalDuration: `${timeline.totalDurationSeconds.toFixed(2)}s`,
    totalGapTime: `${totalGapSeconds.toFixed(2)}s`,
    openingAvgGap: `${timeline.retentionStats!.openingZoneGapAvg.toFixed(2)}s`,
    middleAvgGap: `${timeline.retentionStats!.middleZoneGapAvg.toFixed(2)}s`,
    endingAvgGap: `${timeline.retentionStats!.endingZoneGapAvg.toFixed(2)}s`,
    patternInterrupts: patternInterruptCount.toString(),
    videoMultiplier: videoLevelMultiplier.toFixed(2),
  });

  return timeline;
}

// ============================================
// React Hook for Audio Timeline
// ============================================

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

// ============================================
// Utility Functions
// ============================================

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

/**
 * Get the current timeline position based on frame
 */
export function getTimelinePositionAtFrame(
  timeline: AudioTimeline,
  frame: number
): TimelinePosition {
  const currentSeconds = frame / 30; // Approximate, actual FPS may vary
  return getTimelinePosition(currentSeconds, timeline.totalDurationSeconds);
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use calculateAudioDrivenTimeline instead
 */
export function calculatePacingGap(
  segment: ScriptSegment,
  nextSegment: ScriptSegment | null,
  contentType: string,
  isChapterEndFlag: boolean,
  fps: number
): { afterGapFrames: number; reason: string } {
  // Create a minimal context for legacy calls
  const random = () => 0.5;
  const basePacing = CONTENT_TYPE_PACING[contentType] || CONTENT_TYPE_PACING.tutorial;
  let gapSeconds = basePacing.base;
  let reason = `Base gap for ${contentType}`;

  if (isChapterEndFlag) {
    gapSeconds = CHAPTER_TRANSITION_GAP;
    reason = 'Chapter transition';
  }

  const visualPacing = VISUAL_HINT_PACING[segment.visual_hint];
  if (visualPacing) {
    gapSeconds += visualPacing.base;
    reason += ` + ${segment.visual_hint} modifier`;
  }

  if (segment.emotional_trigger) {
    const emotionPacing = EMOTIONAL_PACING[segment.emotional_trigger];
    if (emotionPacing) {
      gapSeconds = Math.max(gapSeconds, emotionPacing.base);
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
