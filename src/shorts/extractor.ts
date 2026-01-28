import { ShortsExtraction, ShortsHook } from '../core/manifest-parser';
import { ThemeConfig } from '../templates';
import { logger } from '../utils/logger';

interface ExtractOptions {
  mainVideoPath: string;
  outputDir: string;
  projectId: string;
  theme: ThemeConfig;
  debugSafeZone: boolean;
}

interface ShortsOutput {
  hookIndex: number;
  outputPath: string;
}

export class ShortsExtractor {
  async extractAll(
    shorts: ShortsExtraction,
    options: ExtractOptions
  ): Promise<ShortsOutput[]> {
    const outputs: ShortsOutput[] = [];

    for (let i = 0; i < shorts.hooks.length; i++) {
      const hook = shorts.hooks[i];
      const outputPath = `${options.outputDir}/${options.projectId}_shorts_${String(i + 1).padStart(2, '0')}.mp4`;

      logger.info('Extracting Shorts clip', {
        projectId: options.projectId,
        hookIndex: i.toString(),
        hookType: hook.hook_type,
        start: hook.timestamp_start,
        end: hook.timestamp_end,
      });

      // TODO: Implement FFmpeg-based extraction with:
      // - Smart crop (vertical_crop_focus)
      // - Face tracking (face_detection_hint)
      // - Safe zone overlay (debugSafeZone)
      // - CTA rendering

      outputs.push({ hookIndex: i, outputPath });
    }

    return outputs;
  }
}
