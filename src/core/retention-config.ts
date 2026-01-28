/**
 * Retention Optimization & Pacing Differentiation Configuration
 *
 * This module provides configuration for:
 * 1. Content-type specific pacing with variance
 * 2. Per-video randomization for unique rhythm
 * 3. Retention optimization strategies (opening, mid, end)
 */

// ============================================
// Pacing Differentiation Configuration
// ============================================

export interface PacingConfig {
  base: number;      // Base gap in seconds
  variance: number;  // Variance range (+/-)
}

/**
 * Content-type specific pacing gaps
 * - tutorial: Longer gaps for comprehension
 * - news: Shorter gaps for urgency
 * - analysis: Longest gaps for thinking
 * - entertainment: Fastest pace
 */
export const CONTENT_TYPE_PACING: Record<string, PacingConfig> = {
  tutorial: { base: 0.5, variance: 0.1 },
  news: { base: 0.3, variance: 0.05 },
  analysis: { base: 0.6, variance: 0.15 },
  entertainment: { base: 0.25, variance: 0.08 },
};

/**
 * Per-video randomization configuration
 * Creates unique rhythm for each video to avoid monotony
 */
export const PER_VIDEO_RANDOMIZATION = {
  enabled: true,
  /** Seed source for consistent randomization within a video */
  seedFrom: 'video_id' as const,
  /** Variance multiplier range [min, max] */
  varianceRange: [0.8, 1.2] as [number, number],
};

/**
 * Visual hint gap modifiers with variance
 * Applied on top of content-type base
 */
export const VISUAL_HINT_PACING: Record<string, PacingConfig> = {
  code_block: { base: 0.3, variance: 0.08 },
  diagram: { base: 0.4, variance: 0.1 },
  text_animation: { base: 0.2, variance: 0.05 },
  b_roll: { base: 0.1, variance: 0.03 },
  screen_recording: { base: 0.2, variance: 0.05 },
  talking_head_placeholder: { base: 0.2, variance: 0.05 },
};

/**
 * Emotional trigger gap adjustments with variance
 */
export const EMOTIONAL_PACING: Record<string, PacingConfig> = {
  anger: { base: 0.4, variance: 0.1 },
  awe: { base: 0.8, variance: 0.15 },
  curiosity: { base: 0.3, variance: 0.08 },
  fomo: { base: 0.2, variance: 0.05 },
  validation: { base: 0.5, variance: 0.1 },
};

// ============================================
// Retention Optimization Configuration
// ============================================

/**
 * Opening hook optimization
 * Critical for early retention (first 30 seconds)
 */
export const OPENING_HOOK_CONFIG = {
  /** Maximum intro/branding duration before content (seconds) */
  maxIntroDuration: 5,
  /** Deadline for main hook delivery (seconds) */
  hookDeadline: 30,
  /** Pattern interrupt timestamps to re-engage viewers (seconds) */
  patternInterruptAt: [15, 45, 90] as number[],
  /** Pacing multiplier for opening (faster pace = more engagement) */
  openingPaceMultiplier: 0.85,
  /** Duration of the "opening zone" in seconds */
  openingZoneDuration: 30,
};

/**
 * Mid-retention optimization
 * Maintains engagement through the middle of the video
 */
export const MID_RETENTION_CONFIG = {
  /** Interval for micro-hooks/teases (seconds) */
  microHooksInterval: 120,
  /** Maximum interval between visual changes (seconds) */
  visualChangeInterval: 30,
  /** Target B-roll ratio (0-1) */
  bRollRatio: 0.3,
  /** Re-engagement boost after X seconds of monotony */
  monotonyThreshold: 45,
  /** Pacing multiplier for mid-section */
  midPaceMultiplier: 1.0,
};

/**
 * End optimization
 * Maximizes completion rate and drives action
 */
export const END_OPTIMIZATION_CONFIG = {
  /** Whether to preview next video */
  previewNextVideo: true,
  /** Duration of end screen (seconds) */
  endScreenDuration: 20,
  /** CTA timing relative to video end (negative = before end) */
  ctaTiming: -30,
  /** Pacing multiplier for ending (slightly faster to drive urgency) */
  endingPaceMultiplier: 0.9,
  /** Duration of the "ending zone" before video end (seconds) */
  endingZoneDuration: 30,
};

// ============================================
// Retention-Based Pacing Adjustments
// ============================================

/**
 * Pacing adjustments based on predicted completion rate
 * Low completion = faster pace to maintain engagement
 * High completion = normal pace, content is already engaging
 */
export const COMPLETION_RATE_ADJUSTMENTS: Record<string, number> = {
  low: 0.85,     // 15% faster pacing for low-engagement content
  medium: 1.0,   // Normal pacing
  high: 1.05,    // Slightly slower, content is engaging
};

/**
 * Controversy score adjustments (0-10 scale)
 * Higher controversy = slightly longer post-statement gaps
 */
export function getControversyPacingAdjustment(score: number): number {
  // 0-3: no adjustment, 4-7: small increase, 8-10: significant increase
  if (score <= 3) return 1.0;
  if (score <= 7) return 1.0 + (score - 3) * 0.03; // +0.03 to +0.12
  return 1.12 + (score - 7) * 0.04; // +0.16 to +0.24
}

// ============================================
// Seeded Random Number Generator
// ============================================

/**
 * Simple seeded pseudo-random number generator
 * Provides consistent randomization based on seed
 */
export function createSeededRandom(seed: string): () => number {
  // Convert string to numeric seed using hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Mulberry32 PRNG
  let state = hash >>> 0;

  return () => {
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Get randomized pacing value with variance
 */
export function getRandomizedPacing(
  config: PacingConfig,
  random: () => number
): number {
  const variance = (random() * 2 - 1) * config.variance; // -variance to +variance
  return Math.max(0.1, config.base + variance);
}

/**
 * Get video-level pacing multiplier
 * Applies consistent randomization across entire video
 */
export function getVideoLevelMultiplier(random: () => number): number {
  const [min, max] = PER_VIDEO_RANDOMIZATION.varianceRange;
  return min + random() * (max - min);
}

// ============================================
// Timeline Position Helpers
// ============================================

export type TimelinePosition = 'opening' | 'middle' | 'ending';

/**
 * Determine position in video timeline
 */
export function getTimelinePosition(
  currentSeconds: number,
  totalSeconds: number
): TimelinePosition {
  if (currentSeconds <= OPENING_HOOK_CONFIG.openingZoneDuration) {
    return 'opening';
  }

  if (currentSeconds >= totalSeconds - END_OPTIMIZATION_CONFIG.endingZoneDuration) {
    return 'ending';
  }

  return 'middle';
}

/**
 * Get pacing multiplier based on timeline position
 */
export function getPositionPacingMultiplier(position: TimelinePosition): number {
  switch (position) {
    case 'opening':
      return OPENING_HOOK_CONFIG.openingPaceMultiplier;
    case 'ending':
      return END_OPTIMIZATION_CONFIG.endingPaceMultiplier;
    case 'middle':
    default:
      return MID_RETENTION_CONFIG.midPaceMultiplier;
  }
}

/**
 * Check if current position is at a pattern interrupt point
 */
export function isPatternInterruptPoint(
  currentSeconds: number,
  tolerance: number = 2
): boolean {
  return OPENING_HOOK_CONFIG.patternInterruptAt.some(
    point => Math.abs(currentSeconds - point) <= tolerance
  );
}

/**
 * Check if micro-hook should be inserted
 */
export function shouldInsertMicroHook(
  currentSeconds: number,
  lastMicroHookSeconds: number
): boolean {
  return (currentSeconds - lastMicroHookSeconds) >= MID_RETENTION_CONFIG.microHooksInterval;
}

// ============================================
// Configuration Export for External Use
// ============================================

export const RETENTION_CONFIG = {
  pacing: {
    contentType: CONTENT_TYPE_PACING,
    visualHint: VISUAL_HINT_PACING,
    emotional: EMOTIONAL_PACING,
    perVideoRandomization: PER_VIDEO_RANDOMIZATION,
  },
  retention: {
    opening: OPENING_HOOK_CONFIG,
    mid: MID_RETENTION_CONFIG,
    end: END_OPTIMIZATION_CONFIG,
    completionRateAdjustments: COMPLETION_RATE_ADJUSTMENTS,
  },
} as const;

export type RetentionConfig = typeof RETENTION_CONFIG;
