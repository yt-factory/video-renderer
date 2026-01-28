import { logger } from '../utils/logger';

export type MusicMood = 'upbeat' | 'dramatic' | 'chill' | 'none';

const MUSIC_LIBRARY: Record<MusicMood, string[]> = {
  upbeat: ['/music/upbeat-01.mp3', '/music/upbeat-02.mp3'],
  dramatic: ['/music/dramatic-01.mp3', '/music/dramatic-02.mp3'],
  chill: ['/music/chill-01.mp3', '/music/chill-02.mp3'],
  none: [],
};

export function selectBackgroundMusic(mood: MusicMood): string | null {
  const tracks = MUSIC_LIBRARY[mood];
  if (!tracks || tracks.length === 0) return null;

  const index = Math.floor(Math.random() * tracks.length);
  const selected = tracks[index];
  logger.info('Background music selected', { mood, track: selected });
  return selected;
}
