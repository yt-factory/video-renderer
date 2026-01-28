/**
 * Parse MM:SS timestamp to seconds.
 */
export function timestampToSeconds(timestamp: string): number {
  const [minutes, seconds] = timestamp.split(':').map(Number);
  return minutes * 60 + seconds;
}

/**
 * Convert seconds to MM:SS timestamp.
 */
export function secondsToTimestamp(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Convert seconds to frame number.
 */
export function secondsToFrames(seconds: number, fps: number): number {
  return Math.ceil(seconds * fps);
}

/**
 * Convert frame number to seconds.
 */
export function framesToSeconds(frames: number, fps: number): number {
  return frames / fps;
}
