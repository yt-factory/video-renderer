import { join } from 'path';
import { writeFile } from 'fs/promises';
import { VoicePersona } from '../core/manifest-parser';
import { logger } from '../utils/logger';

interface SynthesizeOptions {
  outputDir: string;
  projectId: string;
  segmentIndex: number;
}

interface SynthesizeResult {
  audioPath: string;
  durationSeconds: number;
}

export class TTSClient {
  async synthesize(
    text: string,
    voice: VoicePersona,
    options: SynthesizeOptions
  ): Promise<SynthesizeResult> {
    const audioPath = join(
      options.outputDir,
      `${options.projectId}_segment_${String(options.segmentIndex).padStart(3, '0')}.mp3`
    );

    logger.info('Synthesizing audio segment', {
      projectId: options.projectId,
      segmentIndex: options.segmentIndex.toString(),
      provider: voice.provider,
      voiceId: voice.voice_id,
    });

    switch (voice.provider) {
      case 'elevenlabs':
        return this.synthesizeElevenLabs(text, voice, audioPath);
      case 'google_tts':
        return this.synthesizeGoogleTTS(text, voice, audioPath);
      case 'azure':
        return this.synthesizeAzure(text, voice, audioPath);
      default:
        throw new Error(`Unsupported TTS provider: ${voice.provider}`);
    }
  }

  private async synthesizeElevenLabs(
    text: string,
    voice: VoicePersona,
    outputPath: string
  ): Promise<SynthesizeResult> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      logger.warn('ELEVENLABS_API_KEY not set, using placeholder audio');
      return this.generatePlaceholder(text, outputPath);
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice.voice_id}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: voice.style === 'calm' ? 0.8 : 0.5,
          similarity_boost: 0.75,
          style: voice.style === 'energetic' ? 0.8 : 0.4,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('ElevenLabs API error', {
        status: response.status.toString(),
        error: errorText,
      });
      return this.generatePlaceholder(text, outputPath);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    await writeFile(outputPath, audioBuffer);

    const durationSeconds = await this.estimateAudioDuration(audioBuffer, text);

    logger.info('ElevenLabs synthesis complete', {
      outputPath,
      size: audioBuffer.length.toString(),
      duration: durationSeconds.toFixed(2),
    });

    return { audioPath: outputPath, durationSeconds };
  }

  private async synthesizeGoogleTTS(
    text: string,
    voice: VoicePersona,
    outputPath: string
  ): Promise<SynthesizeResult> {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      logger.warn('GOOGLE_APPLICATION_CREDENTIALS not set, using placeholder audio');
      return this.generatePlaceholder(text, outputPath);
    }

    try {
      const tts = await import('@google-cloud/text-to-speech');
      const client = new tts.TextToSpeechClient();

      const languageCodeMap: Record<string, string> = {
        en: 'en-US',
        zh: 'cmn-CN',
        ja: 'ja-JP',
        es: 'es-ES',
        de: 'de-DE',
      };

      const speakingRateMap: Record<string, number> = {
        narrative: 1.0,
        energetic: 1.15,
        calm: 0.9,
        professional: 1.0,
      };

      const [response] = await client.synthesizeSpeech({
        input: { text },
        voice: {
          languageCode: languageCodeMap[voice.language] || 'en-US',
          name: voice.voice_id,
          ssmlGender: 'NEUTRAL' as const,
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
          speakingRate: speakingRateMap[voice.style] || 1.0,
          pitch: 0,
          volumeGainDb: 0,
        },
      });

      if (!response.audioContent) {
        logger.error('Google TTS returned empty audio');
        return this.generatePlaceholder(text, outputPath);
      }

      const audioBuffer =
        typeof response.audioContent === 'string'
          ? Buffer.from(response.audioContent, 'base64')
          : Buffer.from(response.audioContent);

      await writeFile(outputPath, audioBuffer);

      const durationSeconds = await this.estimateAudioDuration(audioBuffer, text);

      logger.info('Google TTS synthesis complete', {
        outputPath,
        size: audioBuffer.length.toString(),
        duration: durationSeconds.toFixed(2),
      });

      return { audioPath: outputPath, durationSeconds };
    } catch (error) {
      logger.error('Google TTS synthesis failed', { error: String(error) });
      return this.generatePlaceholder(text, outputPath);
    }
  }

  private async synthesizeAzure(
    text: string,
    voice: VoicePersona,
    outputPath: string
  ): Promise<SynthesizeResult> {
    const subscriptionKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || 'eastus';

    if (!subscriptionKey) {
      logger.warn('AZURE_SPEECH_KEY not set, using placeholder audio');
      return this.generatePlaceholder(text, outputPath);
    }

    const languageMap: Record<string, string> = {
      en: 'en-US',
      zh: 'zh-CN',
      ja: 'ja-JP',
      es: 'es-ES',
      de: 'de-DE',
    };

    const lang = languageMap[voice.language] || 'en-US';

    const styleAttr = voice.style !== 'narrative' ? ` style="${voice.style}"` : '';
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
             xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}">
        <voice name="${voice.voice_id}">
          <mstts:express-as${styleAttr}>
            ${escapeXml(text)}
          </mstts:express-as>
        </voice>
      </speak>`.trim();

    const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      },
      body: ssml,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Azure TTS API error', {
        status: response.status.toString(),
        error: errorText,
      });
      return this.generatePlaceholder(text, outputPath);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    await writeFile(outputPath, audioBuffer);

    const durationSeconds = await this.estimateAudioDuration(audioBuffer, text);

    logger.info('Azure TTS synthesis complete', {
      outputPath,
      size: audioBuffer.length.toString(),
      duration: durationSeconds.toFixed(2),
    });

    return { audioPath: outputPath, durationSeconds };
  }

  private async generatePlaceholder(
    text: string,
    outputPath: string
  ): Promise<SynthesizeResult> {
    const wordCount = text.split(/\s+/).length;
    const durationSeconds = (wordCount / 150) * 60;

    await writeFile(outputPath, Buffer.alloc(0));

    return { audioPath: outputPath, durationSeconds };
  }

  /**
   * Estimate audio duration from buffer size or fall back to word count.
   * MP3 at ~128kbps: bytes / (128000/8) = seconds
   */
  private async estimateAudioDuration(
    audioBuffer: Buffer,
    text: string
  ): Promise<number> {
    if (audioBuffer.length > 0) {
      // Assume ~128kbps MP3
      const estimatedFromSize = audioBuffer.length / (128000 / 8);
      if (estimatedFromSize > 0.5) {
        return estimatedFromSize;
      }
    }
    // Fallback: word count estimate
    const wordCount = text.split(/\s+/).length;
    return (wordCount / 150) * 60;
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
