import { interpolate } from 'remotion';
import { logger } from '../utils/logger';

export type MusicMood = 'upbeat' | 'dramatic' | 'chill' | 'none';
export type VisualMood = 'professional' | 'casual' | 'energetic' | 'calm';

const MUSIC_LIBRARY: Record<MusicMood, string[]> = {
  upbeat: ['/music/upbeat-01.mp3', '/music/upbeat-02.mp3'],
  dramatic: ['/music/dramatic-01.mp3', '/music/dramatic-02.mp3'],
  chill: ['/music/chill-01.mp3', '/music/chill-02.mp3'],
  none: [],
};

/**
 * Target BPM by visual mood — used to select matching tracks
 * and drive tempo-aware volume ducking.
 */
const MOOD_BPM: Record<VisualMood, number> = {
  energetic: 140,
  casual: 110,
  professional: 100,
  calm: 80,
};

/**
 * Side-chain compression parameters per mood.
 * - duckDepth: how much the music volume drops during voiceover (0–1, lower = more ducking)
 * - attackFrames: how quickly the duck ramps in
 * - releaseFrames: how quickly volume recovers after voiceover ends
 */
interface SidechainConfig {
  duckDepth: number;
  attackFrames: number;
  releaseFrames: number;
  baseVolume: number;
}

const MOOD_SIDECHAIN: Record<VisualMood, SidechainConfig> = {
  energetic: { duckDepth: 0.25, attackFrames: 3, releaseFrames: 8, baseVolume: 0.35 },
  casual: { duckDepth: 0.20, attackFrames: 4, releaseFrames: 10, baseVolume: 0.30 },
  professional: { duckDepth: 0.15, attackFrames: 5, releaseFrames: 12, baseVolume: 0.25 },
  calm: { duckDepth: 0.12, attackFrames: 6, releaseFrames: 15, baseVolume: 0.20 },
};

export function selectBackgroundMusic(mood: MusicMood): string | null {
  const tracks = MUSIC_LIBRARY[mood];
  if (!tracks || tracks.length === 0) return null;

  const index = Math.floor(Math.random() * tracks.length);
  const selected = tracks[index];
  logger.info('Background music selected', { mood, track: selected });
  return selected;
}

/**
 * Get the target BPM for a given visual mood.
 */
export function getTargetBPM(visualMood: VisualMood): number {
  return MOOD_BPM[visualMood];
}

/**
 * Get the sidechain compression config for a visual mood.
 */
export function getSidechainConfig(visualMood: VisualMood): SidechainConfig {
  return MOOD_SIDECHAIN[visualMood];
}

/**
 * Calculate the music volume at a given frame, applying side-chain
 * compression (ducking) when voiceover is active.
 *
 * @param frame - current frame number
 * @param fps - frames per second
 * @param voiceoverActive - whether voiceover audio is playing at this frame
 * @param voiceoverStartFrame - frame where the current voiceover segment started
 * @param voiceoverEndFrame - frame where the current voiceover segment ends
 * @param visualMood - the mood driving sidechain parameters
 * @returns volume multiplier (0–1)
 */
export function calculateMusicVolume(
  frame: number,
  fps: number,
  voiceoverActive: boolean,
  voiceoverStartFrame: number,
  voiceoverEndFrame: number,
  visualMood: VisualMood
): number {
  const config = MOOD_SIDECHAIN[visualMood];

  if (voiceoverActive) {
    // Attack: ramp down quickly when voiceover starts
    const framesSinceStart = frame - voiceoverStartFrame;
    const attackProgress = Math.min(1, framesSinceStart / config.attackFrames);
    const duckedVolume = config.baseVolume * config.duckDepth;
    return interpolate(attackProgress, [0, 1], [config.baseVolume, duckedVolume]);
  }

  // Release: ramp back up after voiceover ends
  const framesSinceEnd = frame - voiceoverEndFrame;
  if (framesSinceEnd >= 0 && framesSinceEnd < config.releaseFrames) {
    const releaseProgress = framesSinceEnd / config.releaseFrames;
    const duckedVolume = config.baseVolume * config.duckDepth;
    return interpolate(releaseProgress, [0, 1], [duckedVolume, config.baseVolume]);
  }

  return config.baseVolume;
}

/**
 * Calculate a playback rate adjustment to nudge the music tempo
 * closer to the target BPM. Assumes source tracks are ~120 BPM.
 *
 * The adjustment is clamped to ±15% to avoid audible pitch artifacts.
 */
export function calculatePlaybackRate(
  sourceBPM: number,
  visualMood: VisualMood
): number {
  const targetBPM = MOOD_BPM[visualMood];
  const ratio = targetBPM / sourceBPM;
  // Clamp to 0.85–1.15
  return Math.max(0.85, Math.min(1.15, ratio));
}
