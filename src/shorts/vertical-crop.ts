import { logger } from '../utils/logger';

export type CropFocus = 'center' | 'left' | 'right' | 'speaker' | 'dynamic';

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate the 9:16 crop region from a 16:9 source.
 */
export function calculateVerticalCrop(
  sourceWidth: number,
  sourceHeight: number,
  focus: CropFocus,
  facePosition?: { x: number; y: number }
): CropRegion {
  const targetAspect = 9 / 16;
  const cropWidth = Math.round(sourceHeight * targetAspect);
  const cropHeight = sourceHeight;

  let x: number;

  switch (focus) {
    case 'left':
      x = 0;
      break;
    case 'right':
      x = sourceWidth - cropWidth;
      break;
    case 'speaker':
    case 'dynamic':
      if (facePosition) {
        x = Math.max(0, Math.min(facePosition.x - cropWidth / 2, sourceWidth - cropWidth));
      } else {
        x = Math.round((sourceWidth - cropWidth) / 2);
      }
      break;
    case 'center':
    default:
      x = Math.round((sourceWidth - cropWidth) / 2);
      break;
  }

  logger.debug('Vertical crop calculated', {
    sourceWidth: sourceWidth.toString(),
    sourceHeight: sourceHeight.toString(),
    focus,
    cropX: x.toString(),
    cropWidth: cropWidth.toString(),
  });

  return { x, y: 0, width: cropWidth, height: cropHeight };
}
