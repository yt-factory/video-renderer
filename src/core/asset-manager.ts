import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { logger } from '../utils/logger';

const CACHE_DIR = join(process.cwd(), '.asset-cache');

export class AssetManager {
  private cache = new Map<string, string>();

  async initialize(): Promise<void> {
    await mkdir(CACHE_DIR, { recursive: true });
    logger.info('Asset manager initialized', { cacheDir: CACHE_DIR });
  }

  async downloadAsset(url: string, projectId: string): Promise<string> {
    if (this.cache.has(url)) {
      logger.debug('Asset cache hit', { url });
      return this.cache.get(url)!;
    }

    const filename = `${projectId}_${Buffer.from(url).toString('base64url').slice(0, 32)}`;
    const localPath = join(CACHE_DIR, filename);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const buffer = Buffer.from(await response.arrayBuffer());
      await writeFile(localPath, buffer);

      this.cache.set(url, localPath);
      logger.info('Asset downloaded', { url, localPath });
      return localPath;
    } catch (error) {
      logger.error('Asset download failed', { url, error: String(error) });
      throw error;
    }
  }

  getCachedPath(url: string): string | undefined {
    return this.cache.get(url);
  }
}
