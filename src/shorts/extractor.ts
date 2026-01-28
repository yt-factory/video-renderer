import ffmpeg from 'fluent-ffmpeg';
import { join } from 'path';
import { ShortsExtraction } from '../core/manifest-parser';
import { ThemeConfig } from '../templates';
import { logger } from '../utils/logger';
import { timestampToSeconds } from '../utils/timing';
import { calculateVerticalCrop } from './vertical-crop';
import { detectFaces, getPrimaryFace, getFaceCenter } from './face-tracker';

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

interface VideoInfo {
  width: number;
  height: number;
  duration: number;
}

function getVideoInfo(videoPath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      if (!videoStream) return reject(new Error('No video stream found'));
      resolve({
        width: videoStream.width || 1920,
        height: videoStream.height || 1080,
        duration: metadata.format.duration || 0,
      });
    });
  });
}

function extractFrame(videoPath: string, timeSeconds: number, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(timeSeconds)
      .frames(1)
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

function runFFmpeg(
  inputPath: string,
  outputPath: string,
  startSeconds: number,
  endSeconds: number,
  cropFilter: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput(startSeconds)
      .duration(endSeconds - startSeconds)
      .videoFilter(cropFilter)
      .outputOptions(['-c:v', 'libx264', '-crf', '20', '-preset', 'fast', '-c:a', 'aac', '-b:a', '128k'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

export class ShortsExtractor {
  async extractAll(
    shorts: ShortsExtraction,
    options: ExtractOptions
  ): Promise<ShortsOutput[]> {
    const outputs: ShortsOutput[] = [];

    let videoInfo: VideoInfo;
    try {
      videoInfo = await getVideoInfo(options.mainVideoPath);
    } catch (error) {
      logger.error('Failed to probe video', { error: String(error) });
      return outputs;
    }

    logger.info('Source video info', {
      width: videoInfo.width.toString(),
      height: videoInfo.height.toString(),
      duration: videoInfo.duration.toString(),
    });

    for (let i = 0; i < shorts.hooks.length; i++) {
      const hook = shorts.hooks[i];
      const outputPath = join(
        options.outputDir,
        `${options.projectId}_shorts_${String(i + 1).padStart(2, '0')}.mp4`
      );

      logger.info('Extracting Shorts clip', {
        projectId: options.projectId,
        hookIndex: i.toString(),
        hookType: hook.hook_type,
        start: hook.timestamp_start,
        end: hook.timestamp_end,
      });

      const startSeconds = timestampToSeconds(hook.timestamp_start);
      const endSeconds = timestampToSeconds(hook.timestamp_end);

      // Determine face position for crop if face detection is hinted
      let facePosition: { x: number; y: number } | undefined;

      if (shorts.face_detection_hint) {
        try {
          const midTime = (startSeconds + endSeconds) / 2;
          const framePath = join(
            options.outputDir,
            `${options.projectId}_face_probe_${i}.png`
          );
          await extractFrame(options.mainVideoPath, midTime, framePath);

          const faces = await detectFaces(framePath);
          const primary = getPrimaryFace(faces);
          if (primary) {
            facePosition = getFaceCenter(primary);
            logger.info('Face detected for crop', {
              hookIndex: i.toString(),
              x: facePosition.x.toString(),
              y: facePosition.y.toString(),
            });
          }
        } catch (error) {
          logger.warn('Face detection failed, using default crop', {
            hookIndex: i.toString(),
            error: String(error),
          });
        }
      }

      // Calculate vertical crop region
      const cropRegion = calculateVerticalCrop(
        videoInfo.width,
        videoInfo.height,
        shorts.vertical_crop_focus,
        facePosition
      );

      // Build FFmpeg filter: crop then scale to 1080x1920
      const cropFilter = [
        `crop=${cropRegion.width}:${cropRegion.height}:${cropRegion.x}:${cropRegion.y}`,
        'scale=1080:1920:flags=lanczos',
      ].join(',');

      try {
        await runFFmpeg(
          options.mainVideoPath,
          outputPath,
          startSeconds,
          endSeconds,
          cropFilter
        );

        logger.info('Shorts clip extracted', {
          hookIndex: i.toString(),
          outputPath,
          cropFilter,
        });

        outputs.push({ hookIndex: i, outputPath });
      } catch (error) {
        logger.error('Failed to extract Shorts clip', {
          hookIndex: i.toString(),
          error: String(error),
        });
      }
    }

    return outputs;
  }
}
