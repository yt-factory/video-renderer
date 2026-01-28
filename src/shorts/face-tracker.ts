import { logger } from '../utils/logger';

export interface FaceDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

/**
 * Detect faces in a video frame.
 * Placeholder - implement with MediaPipe or face-api.js.
 */
export async function detectFaces(_imagePath: string): Promise<FaceDetection[]> {
  logger.warn('Face detection not yet implemented, returning empty');
  return [];
}

/**
 * Get the primary face position (highest confidence).
 */
export function getPrimaryFace(detections: FaceDetection[]): FaceDetection | null {
  if (detections.length === 0) return null;
  return detections.reduce((best, current) =>
    current.confidence > best.confidence ? current : best
  );
}

/**
 * Calculate face center point.
 */
export function getFaceCenter(face: FaceDetection): { x: number; y: number } {
  return {
    x: face.x + face.width / 2,
    y: face.y + face.height / 2,
  };
}
