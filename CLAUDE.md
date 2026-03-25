# CLAUDE.md - YT-Factory Video Renderer
## Production-Ready Ultimate Final Version (2026) - Complete + All Optimizations

---

## Recent Changes (March 2026)

### Theme System + Visual Segment Components (Phase 3)

| File | Purpose |
|------|---------|
| `src/themes/types.ts` | ThemeConfig + SegmentStyle interfaces |
| `src/themes/index.ts` | 5 themes (cyberpunk, minimalist, dark_mode, whiteboard, corporate) + selectTheme() |
| `src/components/segments/CodeBlockSegment.tsx` | Terminal window with typing animation |
| `src/components/segments/DiagramSegment.tsx` | Animated node-edge graph |
| `src/components/segments/TextAnimationSegment.tsx` | Kinetic typography with emphasis words |
| `src/components/segments/BRollSegment.tsx` | Ambient gradient with caption overlay |
| `src/components/segments/ScreenRecordingSegment.tsx` | Monitor bezel with bullet points |
| `src/components/segments/TalkingHeadSegment.tsx` | Avatar silhouette with audio waveform |
| `src/components/segments/index.ts` | resolveSegmentComponent() barrel export |
| `src/compositions/ShortsVideo.tsx` | Dedicated 9:16 Shorts composition with safe zone margins |

### Audio Processing Pipeline (Phase 4)

| File | Purpose |
|------|---------|
| `audio-processor.mjs` | Two-pass loudness normalization (-14 LUFS), silence trimming, quality report |
| `pipeline.mjs` | Unified command: audio processing + video rendering in one step |

### Key Integration Points

- `MainVideo.tsx` selects theme from `manifest.content_engine.media_preference` via `selectTheme(mood, contentType)`
- `SegmentRenderer` uses `resolveSegmentComponent(visual_hint)` to pick the right visual for each segment
- All segment components receive `theme: ThemeConfig` and apply theme colors/fonts
- `render.mjs` prefers `audio/{lang}.processed.mp3` over raw audio, falls back gracefully
- `pipeline.mjs` chains `audio-processor.mjs` + `render.mjs`, skips processing if already done

### NotebookLM Workflow (Primary)

For NotebookLM Cinematic video content, use `prepare-upload.mjs` instead of the custom render pipeline. NotebookLM's native Cinematic video generation produces superior visuals for podcast-style content.

```bash
node prepare-upload.mjs <project-id> <video-file> [--lang=zh]  # Pair video with SEO metadata
```

Output: `video.mp4` + `upload-metadata.json` + `upload-metadata.txt` in output dir.

### Custom Render CLI Commands (Alternative)

For non-NotebookLM content or custom branding needs:

```bash
node pipeline.mjs <project-id> --lang=en                # Full pipeline
node pipeline.mjs <project-id> --all-langs               # Both en and zh
node pipeline.mjs <project-id> --profile=production       # High quality
node audio-processor.mjs <project-id> --lang=en           # Audio only
node render.mjs <project-id> --lang=en                    # Render only
```

---

## 🎯 Role Definition

你是一名资深的 **React Video Engineer & Motion Graphics Specialist**。
你正在构建 `yt-factory/video-renderer` —— 一个将 JSON 脚本转化为高质量视频的"渲染工厂"。

这不仅仅是视频渲染，而是构建一个能够根据内容自适应视觉风格、自动裁剪 Shorts、并注入品牌一致性的**智能媒体生产系统**。

**核心原则：**
- **Schema 驱动**：100% 依赖 `manifest.json`，零人工干预
- **视觉多样性**：根据 `media_preference` 自动切换模板，避免审美疲劳
- **Shorts 优先**：9:16 裁剪 + 人脸追踪 + Safe Zone 保护 + 重力对齐 + CTA 渲染 = 变现加速
- **品牌一致性**：统一的动画语言和过渡效果
- **音画同步**：Audio-Driven Timeline + Pacing Gap 呼吸间隙 = 完美节奏
- **SEO 视觉化**：高对比度关键帧 + 三重索引一致性 = Vision AI 友好
- **情绪冲击**：Red Glitch 等视觉效果触发病毒传播
- **渲染效率**：多级渲染质量 + 一键预览 = 开发迭代快 10 倍

---

## 🏗️ Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│              YT-Factory Video Renderer (2026 Ultimate Final)           │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │                     INPUT: manifest.json                     │    │
│   │  (from orchestrator: script, seo, shorts, media_preference) │    │
│   │  + established_trends (用于三重索引验证)                      │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│                              ▼                                        │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │  RENDER PROFILE SELECTION                                    │    │
│   │  draft (480p/15fps) → preview (720p/24fps) → prod (1080p/30) │    │
│   │  shorts_only (9:16 direct) → 4k (2160p/30fps)               │    │
│   │  + Auto Preview in draft mode (一键预览)                     │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│                              ▼                                        │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │  AUDIO-DRIVEN TIMELINE + PACING GAP                          │    │
│   │  getAudioDuration() → 动态计算每个 Sequence 的精确帧数        │    │
│   │  + Content-aware gaps (tutorial: 0.5s, news: 0.3s)          │    │
│   │  + Chapter transition gaps (1.0s)                            │    │
│   │  + Post-emotion breathing room                               │    │
│   │  确保音画 100% 同步 + 专业节奏感                              │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│                              ▼                                        │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │                    RENDERING PIPELINE                        │    │
│   │                                                              │    │
│   │  1. Template Selection (mood + content_type → theme)        │    │
│   │  2. Audio Synthesis (voice_persona → TTS)                   │    │
│   │  3. Asset Resolution (5-level Fallback Chain)               │    │
│   │  4. Visual Composition                                       │    │
│   │     • Chapter SEO Overlay (高对比度 + 三重索引验证)          │    │
│   │     • Smart Subtitle (词级高亮 + Dynamic Scaling)            │    │
│   │     • Emotional Transitions + Red Glitch Effects            │    │
│   │  5. Main Video Render (Remotion → 16:9 MP4)                 │    │
│   │  6. Shorts Extraction                                        │    │
│   │     • Safe Zone Protection (避开 UI 遮挡)                    │    │
│   │     • Gravity Alignment (重力对齐，自动偏移)                 │    │
│   │     • Face Tracking + Smart Crop                             │    │
│   │     • CTA Overlay (仅在安全区内，含呼吸空间)                  │    │
│   │  7. Thumbnail Generation (SEO keywords + brand style)       │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│                              ▼                                        │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │                     OUTPUT ASSETS                            │    │
│   │  • main_video.mp4 (16:9, 1080p/4K, professional pacing)     │    │
│   │  • shorts_01.mp4, shorts_02.mp4, ... (9:16, Safe Zone ✓)    │    │
│   │  • thumbnail.png (1280x720, 高对比度)                        │    │
│   │  • audio.mp3 (backup)                                        │    │
│   │  • render_report.json (成本、时长、质量报告)                  │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │  Docker Isolation: Remotion + FFmpeg + Puppeteer            │    │
│   │  (防止库冲突，保证渲染稳定性)                                  │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js 20+ | Remotion 要求 |
| Framework | Remotion 4.x | 编程式视频渲染 |
| UI | React 18 + TypeScript | 视频组件开发 |
| Styling | Tailwind CSS | 快速样式迭代 |
| Animation | Framer Motion + Remotion Spring | 流畅动画 |
| Audio | ElevenLabs SDK / Google TTS | 语音合成 |
| Image | Sharp + Canvas | 缩略图生成 |
| Video Processing | FFmpeg | Shorts 裁剪 + 格式转换 |
| Face Detection | MediaPipe / face-api.js | Shorts 人脸追踪 |
| Lottie | @remotion/lottie | 动态资产降级 |
| Container | Docker | 隔离渲染环境 |

---

## 📂 Project Structure

```
video-renderer/
├── src/
│   ├── compositions/
│   │   ├── MainVideo.tsx           # 主视频合成入口
│   │   ├── ShortsVideo.tsx         # Shorts 合成入口
│   │   └── Thumbnail.tsx           # 缩略图合成
│   ├── templates/
│   │   ├── themes/
│   │   │   ├── cyberpunk/          # 赛博朋克主题
│   │   │   ├── minimalist/         # 极简主题
│   │   │   ├── dark-mode/          # 暗黑主题
│   │   │   ├── whiteboard/         # 白板教学主题
│   │   │   └── corporate/          # 商务主题
│   │   └── index.ts                # 主题注册与选择
│   ├── components/
│   │   ├── segments/
│   │   │   ├── CodeBlock.tsx       # 代码展示组件
│   │   │   ├── Diagram.tsx         # 流程图/架构图
│   │   │   ├── TextAnimation.tsx   # 文字动画
│   │   │   ├── BRoll.tsx           # B-Roll 素材
│   │   │   ├── ScreenRecording.tsx # 屏幕录制占位
│   │   │   └── FallbackVisual.tsx  # 资产降级组件
│   │   ├── overlays/
│   │   │   ├── CTAOverlay.tsx      # Shorts CTA (Safe Zone + Gravity)
│   │   │   ├── ProgressBar.tsx     # 进度条
│   │   │   ├── ChapterTitle.tsx    # 章节标题
│   │   │   ├── ChapterSEOOverlay.tsx # 高对比度 SEO 关键帧
│   │   │   ├── SmartSubtitle.tsx   # 词级高亮 + Dynamic Scaling
│   │   │   ├── SafeZoneOverlay.tsx # 安全区调试覆盖
│   │   │   └── Watermark.tsx       # 水印/品牌标识
│   │   ├── transitions/
│   │   │   ├── EmotionalTransition.tsx # 情绪驱动转场
│   │   │   ├── GlitchEffect.tsx    # Red Glitch 效果 (NEW)
│   │   │   ├── FadeTransition.tsx
│   │   │   ├── SlideTransition.tsx
│   │   │   └── ZoomTransition.tsx
│   │   └── common/
│   │       ├── AnimatedText.tsx
│   │       ├── GradientBackground.tsx
│   │       ├── KeywordCloud.tsx    # 关键词云动画
│   │       └── ParticleEffect.tsx
│   ├── audio/
│   │   ├── tts-client.ts           # TTS 客户端
│   │   ├── audio-sync.ts           # 音频驱动时间线 + Pacing Gap
│   │   └── background-music.ts     # 背景音乐管理
│   ├── shorts/
│   │   ├── extractor.ts            # Shorts 片段提取
│   │   ├── face-tracker.ts         # 人脸追踪裁剪
│   │   ├── vertical-crop.ts        # 9:16 智能裁剪
│   │   ├── safe-zone.ts            # 安全区 + Gravity Alignment
│   │   └── cta-renderer.ts         # CTA 文字渲染
│   ├── thumbnail/
│   │   ├── generator.ts            # 缩略图生成逻辑
│   │   ├── auto-capture.ts         # 自动抓取高能帧
│   │   └── templates/              # 缩略图模板
│   ├── core/
│   │   ├── manifest-parser.ts      # manifest.json 解析
│   │   ├── render-profile.ts       # 渲染质量配置 + Auto Preview
│   │   ├── render-queue.ts         # 渲染队列管理
│   │   ├── asset-manager.ts        # 资产下载与缓存
│   │   ├── asset-fallback.ts       # 资产降级链
│   │   ├── keyword-validator.ts    # 三重索引验证 (NEW)
│   │   └── output-manager.ts       # 输出文件管理
│   ├── utils/
│   │   ├── logger.ts               # 结构化日志
│   │   ├── timing.ts               # 时间戳转换工具
│   │   ├── contrast-checker.ts     # 对比度验证 (NEW)
│   │   └── color-palette.ts        # 颜色工具
│   ├── index.ts                    # CLI 入口
│   └── remotion.config.ts          # Remotion 配置
├── public/
│   ├── fonts/                      # 字体文件
│   ├── music/                      # 背景音乐库
│   ├── lottie/                     # Lottie 动画库
│   └── assets/                     # 静态资源
├── docker/
│   └── Dockerfile                  # 渲染环境镜像
├── .env
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

---

## 📋 Manifest Schema (Input Contract)

**video-renderer 必须能够解析 orchestrator 输出的完整 manifest.json：**

```typescript
// src/core/manifest-parser.ts

import { z } from 'zod';

// ============================================
// 从 orchestrator 导入的 Schema (保持同步)
// ============================================

export const ScriptSegmentSchema = z.object({
  timestamp: z.string().regex(/^\d{2}:\d{2}$/),
  voiceover: z.string().min(1),
  visual_hint: z.enum([
    'code_block', 
    'diagram', 
    'text_animation', 
    'b_roll', 
    'screen_recording',
    'talking_head_placeholder'
  ]),
  estimated_duration_seconds: z.number().positive(),
  // 可选的资产 URL
  asset_url: z.string().url().optional(),
  // 强调词标记
  emphasis_words: z.array(z.string()).optional(),
  // 情绪触发器
  emotional_trigger: z.enum(['anger', 'awe', 'curiosity', 'fomo', 'validation']).optional()
});

export const VoicePersonaSchema = z.object({
  provider: z.enum(['elevenlabs', 'google_tts', 'azure']),
  voice_id: z.string(),
  style: z.enum(['narrative', 'energetic', 'calm', 'professional']),
  language: z.enum(['en', 'zh', 'ja', 'es', 'de'])
});

export const VisualPreferenceSchema = z.object({
  mood: z.enum(['professional', 'casual', 'energetic', 'calm']),
  content_type: z.enum(['tutorial', 'news', 'analysis', 'entertainment']),
  theme_suggestion: z.enum([
    'cyberpunk', 
    'minimalist', 
    'dark_mode', 
    'whiteboard',
    'corporate'
  ]).optional()
});

export const MediaPreferenceSchema = z.object({
  visual: VisualPreferenceSchema,
  voice: VoicePersonaSchema.optional()
});

export const EmotionalTriggerSchema = z.enum([
  'anger', 'awe', 'curiosity', 'fomo', 'validation'
]);

export const ShortsHookSchema = z.object({
  text: z.string().max(50),
  timestamp_start: z.string(),
  timestamp_end: z.string(),
  hook_type: z.enum([
    'counter_intuitive',
    'number_shock',
    'controversy',
    'quick_tip'
  ]),
  emotional_trigger: EmotionalTriggerSchema,
  controversy_score: z.number().min(0).max(10),
  predicted_engagement: z.object({
    comments: z.enum(['low', 'medium', 'high']),
    shares: z.enum(['low', 'medium', 'high']),
    completion_rate: z.enum(['low', 'medium', 'high'])
  }),
  injected_cta: z.string().max(30).optional()
});

export const ShortsExtractionSchema = z.object({
  hooks: z.array(ShortsHookSchema).min(1).max(5),
  vertical_crop_focus: z.enum(['center', 'left', 'right', 'speaker', 'dynamic']),
  recommended_music_mood: z.enum(['upbeat', 'dramatic', 'chill', 'none']).optional(),
  face_detection_hint: z.boolean().default(false)
});

export const SEODataSchema = z.object({
  primary_language: z.enum(['en', 'zh']),
  tags: z.array(z.string()).max(30),
  chapters: z.string(),
  regional_seo: z.array(z.object({
    language: z.enum(['en', 'zh', 'es', 'ja', 'de']),
    titles: z.array(z.string()).length(5),
    description: z.string().max(5000),
    cultural_hooks: z.array(z.string()).max(3),
    contains_established_trend: z.boolean()
  })).min(2),
  faq_structured_data: z.array(z.object({
    question: z.string(),
    answer: z.string().max(200),
    related_entities: z.array(z.string()).max(3)
  })).max(5),
  entities: z.array(z.object({
    name: z.string(),
    type: z.enum(['tool', 'concept', 'person', 'company', 'technology']),
    description: z.string().max(100).optional(),
    wiki_link: z.string().url().optional()
  })).max(10),
  injected_trends: z.array(z.any()).optional(),
  trend_coverage_score: z.number().min(0).max(100)
});

export const ContentEngineSchema = z.object({
  script: z.array(ScriptSegmentSchema),
  seo: SEODataSchema,
  shorts: ShortsExtractionSchema,
  estimated_duration_seconds: z.number().positive(),
  media_preference: MediaPreferenceSchema
});

export const ProjectManifestSchema = z.object({
  project_id: z.string().uuid(),
  status: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  input_source: z.object({
    local_path: z.string(),
    raw_content: z.string(),
    detected_language: z.enum(['en', 'zh']).optional(),
    word_count: z.number().positive(),
    estimated_reading_time_minutes: z.number().positive()
  }),
  content_engine: ContentEngineSchema,
  assets: z.object({
    audio_url: z.string().url().optional(),
    video_url: z.string().url().optional(),
    shorts_urls: z.array(z.string().url()).optional(),
    thumbnail_url: z.string().url().optional()
  }).default({}),
  error: z.any().optional(),
  meta: z.any().default({})
});

export type ProjectManifest = z.infer<typeof ProjectManifestSchema>;
export type ScriptSegment = z.infer<typeof ScriptSegmentSchema>;
export type ShortsHook = z.infer<typeof ShortsHookSchema>;
export type MediaPreference = z.infer<typeof MediaPreferenceSchema>;
export type ContentEngine = z.infer<typeof ContentEngineSchema>;
export type EmotionalTrigger = z.infer<typeof EmotionalTriggerSchema>;
```

---

## 🎯 Implementation Tasks

### Task 1: Project Initialization

```bash
# 创建 Remotion 项目
npx create-video@latest video-renderer --template blank-ts

cd video-renderer

# 安装核心依赖
npm install zod uuid dotenv
npm install @remotion/player @remotion/cli @remotion/renderer @remotion/lottie
npm install framer-motion @react-spring/web
npm install sharp canvas
npm install fluent-ffmpeg @types/fluent-ffmpeg
npm install elevenlabs-node @google-cloud/text-to-speech

# 安装开发依赖
npm install -D typescript @types/node @types/react tailwindcss

# 创建目录结构
mkdir -p src/{compositions,templates/themes,components/{segments,overlays,transitions,common},audio,shorts,thumbnail,core,utils}
mkdir -p public/{fonts,music,assets,lottie}
mkdir -p docker
```

**package.json scripts (含一键预览)：**
```json
{
  "scripts": {
    "dev": "remotion studio",
    "preview": "npm run render:draft && npm run open:preview",
    "open:preview": "open ./output/*_main.mp4 || xdg-open ./output/*_main.mp4",
    "render:draft": "ts-node src/index.ts ./test-manifest.json ./output --profile=draft --auto-preview",
    "render:preview": "ts-node src/index.ts ./test-manifest.json ./output --profile=preview",
    "render:prod": "ts-node src/index.ts ./test-manifest.json ./output --profile=production",
    "render:4k": "ts-node src/index.ts ./test-manifest.json ./output --profile=4k",
    "build": "tsc",
    "docker:build": "docker build -t video-renderer ./docker",
    "docker:render": "docker run -v $(pwd):/workspace video-renderer"
  }
}
```

**remotion.config.ts:**
```typescript
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
Config.setChromiumOpenGlRenderer('angle');

// 启用音频时长检测
Config.setDelayRenderTimeoutInMilliseconds(60000);
```

---

### Task 2: Render Profile System with Auto Preview (src/core/render-profile.ts)

**渲染质量分级系统 + 一键预览：**

```typescript
// src/core/render-profile.ts

import { exec } from 'child_process';
import { platform } from 'os';
import { logger } from '../utils/logger';

export type RenderProfileName = 'draft' | 'preview' | 'production' | 'shorts_only' | '4k';

export interface RenderProfile {
  name: RenderProfileName;
  resolution: { width: number; height: number };
  fps: number;
  crf: number;           // 质量参数 (越低质量越高，18-28)
  codec: 'h264' | 'h265';
  pixelFormat: 'yuv420p' | 'yuv444p';
  skipShorts: boolean;
  skipThumbnail: boolean;
  skipAudioSync: boolean; // draft 模式跳过精确同步
  concurrency: number;    // 并行渲染数
  autoPreview: boolean;   // 自动打开预览
}

export const RENDER_PROFILES: Record<RenderProfileName, RenderProfile> = {
  draft: {
    name: 'draft',
    resolution: { width: 854, height: 480 },   // 480p
    fps: 15,
    crf: 35,
    codec: 'h264',
    pixelFormat: 'yuv420p',
    skipShorts: true,
    skipThumbnail: true,
    skipAudioSync: true,  // 使用 estimated_duration
    concurrency: 8,
    autoPreview: true     // draft 默认自动预览
  },
  
  preview: {
    name: 'preview',
    resolution: { width: 1280, height: 720 },  // 720p
    fps: 24,
    crf: 28,
    codec: 'h264',
    pixelFormat: 'yuv420p',
    skipShorts: false,
    skipThumbnail: true,
    skipAudioSync: false,
    concurrency: 6,
    autoPreview: false
  },
  
  production: {
    name: 'production',
    resolution: { width: 1920, height: 1080 }, // 1080p
    fps: 30,
    crf: 18,
    codec: 'h264',
    pixelFormat: 'yuv420p',
    skipShorts: false,
    skipThumbnail: false,
    skipAudioSync: false,
    concurrency: 4,
    autoPreview: false
  },
  
  shorts_only: {
    name: 'shorts_only',
    resolution: { width: 1080, height: 1920 }, // 直接 9:16
    fps: 30,
    crf: 20,
    codec: 'h264',
    pixelFormat: 'yuv420p',
    skipShorts: false,    // 这是主要输出
    skipThumbnail: true,
    skipAudioSync: false,
    concurrency: 4,
    autoPreview: false
  },
  
  '4k': {
    name: '4k',
    resolution: { width: 3840, height: 2160 }, // 4K
    fps: 30,
    crf: 15,
    codec: 'h265',
    pixelFormat: 'yuv444p',
    skipShorts: false,
    skipThumbnail: false,
    skipAudioSync: false,
    concurrency: 2,
    autoPreview: false
  }
};

/**
 * 根据环境自动选择配置
 */
export function selectRenderProfile(
  explicit?: RenderProfileName,
  env?: string
): RenderProfile {
  if (explicit) {
    return RENDER_PROFILES[explicit];
  }
  
  // 根据环境变量自动选择
  switch (env || process.env.RENDER_ENV) {
    case 'development':
      return RENDER_PROFILES.draft;
    case 'staging':
      return RENDER_PROFILES.preview;
    case 'production':
      return RENDER_PROFILES.production;
    default:
      return RENDER_PROFILES.preview;
  }
}

/**
 * 自动打开视频预览
 */
export async function autoOpenPreview(videoPath: string): Promise<void> {
  const currentPlatform = platform();
  
  let command: string;
  switch (currentPlatform) {
    case 'darwin':  // macOS
      command = `open "${videoPath}"`;
      break;
    case 'win32':   // Windows
      command = `start "" "${videoPath}"`;
      break;
    default:        // Linux
      command = `xdg-open "${videoPath}"`;
  }
  
  return new Promise((resolve) => {
    exec(command, (error) => {
      if (error) {
        logger.warn('Could not auto-open preview', { error: error.message });
      } else {
        logger.info('Preview opened', { path: videoPath });
      }
      resolve();
    });
  });
}

/**
 * 估算渲染时间
 */
export function estimateRenderTime(
  durationSeconds: number,
  profile: RenderProfile
): number {
  // 基于经验的估算公式
  const baseMultiplier = {
    draft: 0.3,
    preview: 0.8,
    production: 2.0,
    shorts_only: 1.5,
    '4k': 5.0
  };
  
  return durationSeconds * baseMultiplier[profile.name];
}

/**
 * 获取配置概要 (用于日志)
 */
export function getProfileSummary(profile: RenderProfile): string {
  return `${profile.name} (${profile.resolution.width}x${profile.resolution.height}@${profile.fps}fps, CRF ${profile.crf})`;
}
```

---

### Task 3: Asset Fallback Chain (src/core/asset-fallback.ts)

**5 级资产降级策略 — 确保渲染永不中断：**

```typescript
// src/core/asset-fallback.ts

import { Lottie } from '@remotion/lottie';
import { logger } from '../utils/logger';

export type FallbackLevel = 
  | 'provided_asset'
  | 'ai_generated'
  | 'lottie_animation'
  | 'keyword_cloud'
  | 'gradient_background';

export interface AssetResolution {
  type: FallbackLevel;
  url?: string;
  component?: React.ComponentType<any>;
  props?: Record<string, any>;
}

// Lottie 动画库 (按视觉类型分类)
const LOTTIE_LIBRARY: Record<string, string> = {
  code_block: '/lottie/coding-animation.json',
  diagram: '/lottie/flowchart-animation.json',
  loading: '/lottie/loading-dots.json',
  success: '/lottie/checkmark.json',
  data: '/lottie/data-visualization.json',
  default: '/lottie/abstract-shapes.json'
};

/**
 * 资产解析器 - 5 级降级
 */
export async function resolveAsset(
  visualHint: string,
  providedUrl?: string,
  keywords?: string[],
  projectId?: string
): Promise<AssetResolution> {
  
  // Level 1: 使用提供的资产
  if (providedUrl) {
    const isValid = await validateAssetUrl(providedUrl);
    if (isValid) {
      logger.info('Asset resolved: provided', { projectId, url: providedUrl });
      return { type: 'provided_asset', url: providedUrl };
    }
    logger.warn('Provided asset invalid, trying fallback', { projectId, url: providedUrl });
  }
  
  // Level 2: AI 生成 (如果配置了)
  if (process.env.ENABLE_AI_IMAGE_GENERATION === 'true' && keywords?.length) {
    try {
      const aiImageUrl = await generateAIImage(keywords.join(' '), visualHint);
      if (aiImageUrl) {
        logger.info('Asset resolved: AI generated', { projectId, keywords });
        return { type: 'ai_generated', url: aiImageUrl };
      }
    } catch (error) {
      logger.warn('AI image generation failed', { projectId, error });
    }
  }
  
  // Level 3: Lottie 动画
  const lottieFile = LOTTIE_LIBRARY[visualHint] || LOTTIE_LIBRARY.default;
  if (await fileExists(lottieFile)) {
    logger.info('Asset resolved: Lottie animation', { projectId, visualHint });
    return {
      type: 'lottie_animation',
      props: { src: lottieFile }
    };
  }
  
  // Level 4: 关键词云动画
  if (keywords?.length) {
    logger.info('Asset resolved: keyword cloud', { projectId, keywords });
    return {
      type: 'keyword_cloud',
      props: { keywords }
    };
  }
  
  // Level 5: 渐变背景 (最后保底)
  logger.info('Asset resolved: gradient background', { projectId });
  return {
    type: 'gradient_background',
    props: { visualHint }
  };
}

/**
 * 资产降级组件
 */
export const FallbackVisual: React.FC<{
  resolution: AssetResolution;
  theme: ThemeConfig;
}> = ({ resolution, theme }) => {
  switch (resolution.type) {
    case 'provided_asset':
    case 'ai_generated':
      return (
        <Img
          src={resolution.url!}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      );
    
    case 'lottie_animation':
      return (
        <Lottie
          src={resolution.props!.src}
          style={{ width: '60%', height: '60%' }}
        />
      );
    
    case 'keyword_cloud':
      return (
        <KeywordCloud
          keywords={resolution.props!.keywords}
          theme={theme}
        />
      );
    
    case 'gradient_background':
    default:
      return (
        <GradientBackground
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={{ width: '100%', height: '100%' }}
        />
      );
  }
};

// Helper functions
async function validateAssetUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

async function generateAIImage(prompt: string, style: string): Promise<string | null> {
  // 调用 DALL-E 或其他 AI 图像生成 API
  // 实际实现取决于你使用的服务
  return null;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await import('fs/promises').then(fs => fs.access(path));
    return true;
  } catch {
    return false;
  }
}
```

---

### Task 4: Audio-Driven Timeline with Pacing Gap (src/audio/audio-sync.ts)

**音频驱动时间线 + 呼吸间隙 — 专业节奏控制：**

```typescript
// src/audio/audio-sync.ts

import { delayRender, continueRender, getAudioDurationInSeconds } from 'remotion';
import { ScriptSegment, ContentEngine, EmotionalTrigger } from '../core/manifest-parser';
import { logger } from '../utils/logger';

// ============================================
// Pacing Gap 配置 (呼吸间隙)
// ============================================

/**
 * 内容类型 → 基础间隙秒数
 * 不同类型的内容需要不同的节奏
 */
const CONTENT_TYPE_GAPS: Record<string, number> = {
  tutorial: 0.5,      // 教程：需要消化时间
  news: 0.3,          // 新闻：节奏紧凑
  analysis: 0.6,      // 分析：需要思考
  entertainment: 0.25 // 娱乐：快节奏
};

/**
 * 章节切换间隙 (更长)
 */
const CHAPTER_TRANSITION_GAP = 1.0;

/**
 * 情绪高潮后的"喘息"时间
 */
const POST_EMOTION_GAPS: Record<EmotionalTrigger, number> = {
  anger: 0.4,      // 愤怒后短暂停顿
  awe: 0.8,        // 惊叹后需要沉浸
  curiosity: 0.3,  // 保持悬念
  fomo: 0.2,       // FOMO 保持紧迫
  validation: 0.5  // 认同后消化
};

/**
 * 视觉提示类型 → 间隙调整
 */
const VISUAL_HINT_GAP_MODIFIERS: Record<string, number> = {
  code_block: 0.3,      // 代码需要阅读时间
  diagram: 0.4,         // 图表需要理解
  text_animation: 0.2,  // 文字动画自带节奏
  b_roll: 0.1,          // B-Roll 快速过渡
  screen_recording: 0.2,
  talking_head_placeholder: 0.2
};

// ============================================
// Audio Timeline 类型定义
// ============================================

export interface AudioSegmentTiming {
  segmentIndex: number;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  durationSeconds: number;
  audioPath: string;
  voiceover: string;
  pacingGap: {
    afterGapFrames: number;
    reason: string;
  };
}

export interface AudioTimeline {
  segments: AudioSegmentTiming[];
  totalFrames: number;
  totalDurationSeconds: number;
  pacingStats: {
    totalGapSeconds: number;
    averageGapSeconds: number;
    contentType: string;
  };
}

/**
 * 计算单个段落的 Pacing Gap
 */
function calculatePacingGap(
  segment: ScriptSegment,
  nextSegment: ScriptSegment | null,
  contentType: string,
  isChapterEnd: boolean,
  fps: number
): { afterGapFrames: number; reason: string } {
  let gapSeconds = CONTENT_TYPE_GAPS[contentType] || 0.3;
  let reason = `Base gap for ${contentType}`;
  
  // 章节切换：更长间隙
  if (isChapterEnd) {
    gapSeconds = CHAPTER_TRANSITION_GAP;
    reason = 'Chapter transition';
  }
  
  // 视觉类型调整
  const visualModifier = VISUAL_HINT_GAP_MODIFIERS[segment.visual_hint] || 0;
  gapSeconds += visualModifier;
  if (visualModifier > 0) {
    reason += ` + ${segment.visual_hint} modifier`;
  }
  
  // 情绪调整
  if (segment.emotional_trigger) {
    const emotionGap = POST_EMOTION_GAPS[segment.emotional_trigger];
    if (emotionGap) {
      gapSeconds = Math.max(gapSeconds, emotionGap);
      reason += ` + post-${segment.emotional_trigger}`;
    }
  }
  
  // 如果下一段是高情绪内容，缩短间隙以保持张力
  if (nextSegment?.emotional_trigger === 'fomo' || nextSegment?.emotional_trigger === 'anger') {
    gapSeconds = Math.min(gapSeconds, 0.25);
    reason = `Shortened for upcoming ${nextSegment.emotional_trigger}`;
  }
  
  return {
    afterGapFrames: Math.ceil(gapSeconds * fps),
    reason
  };
}

/**
 * 检测是否为章节结束
 */
function isChapterEnd(
  currentTimestamp: string,
  nextTimestamp: string | null,
  chapters: string
): boolean {
  if (!nextTimestamp) return true;
  
  // 解析章节时间戳
  const chapterStarts = chapters
    .split('\n')
    .map(line => line.match(/^(\d{2}:\d{2})/)?.[1])
    .filter(Boolean);
  
  // 如果下一段是新章节开始，当前段就是章节结束
  return chapterStarts.includes(nextTimestamp);
}

/**
 * 计算完整的音频驱动时间线 (含 Pacing Gap)
 */
export async function calculateAudioDrivenTimeline(
  audioSegments: Array<{ path: string; segment: ScriptSegment }>,
  fps: number,
  projectId: string,
  contentEngine: ContentEngine
): Promise<AudioTimeline> {
  const timings: AudioSegmentTiming[] = [];
  let currentFrame = 0;
  let totalGapSeconds = 0;
  
  const contentType = contentEngine.media_preference.visual.content_type;
  const chapters = contentEngine.seo.chapters;
  
  logger.info('Calculating audio-driven timeline with pacing', {
    projectId,
    segmentCount: audioSegments.length,
    contentType,
    fps
  });
  
  for (let i = 0; i < audioSegments.length; i++) {
    const { path, segment } = audioSegments[i];
    const nextSegment = audioSegments[i + 1]?.segment || null;
    
    // 获取实际音频时长
    let audioDurationSeconds: number;
    try {
      audioDurationSeconds = await getAudioDurationInSeconds(path);
    } catch (error) {
      logger.warn('Could not get audio duration, using estimate', {
        projectId,
        segmentIndex: i
      });
      audioDurationSeconds = segment.estimated_duration_seconds;
    }
    
    // 计算 Pacing Gap
    const isChapterEndFlag = isChapterEnd(
      segment.timestamp,
      nextSegment?.timestamp || null,
      chapters
    );
    
    const pacingGap = calculatePacingGap(
      segment,
  nextSegment,
      contentType,
      isChapterEndFlag,
      fps
    );
    
    // 总帧数 = 音频帧 + 间隙帧
    const audioFrames = Math.ceil(audioDurationSeconds * fps);
    const totalSegmentFrames = audioFrames + pacingGap.afterGapFrames;
    
    totalGapSeconds += pacingGap.afterGapFrames / fps;
    
    timings.push({
      segmentIndex: i,
      startFrame: currentFrame,
      endFrame: currentFrame + totalSegmentFrames,
      durationFrames: totalSegmentFrames,
      durationSeconds: totSegmentFrames / fps,
      audioPath: path,
      voiceover: segment.voiceover,
      pacingGap: {
        afterGapFrames: pacingGap.afterGapFrames,
        reason: pacingGap.reason
      }
    });
    
    logger.debug('Segment timing calculated', {
      projectId,
      segmentIndex: i,
      audioFrames,
      pacingGap: pacingGap.afterGapFrames,
      reason: pacingGap.reason
    });
    
    currentFrame += totalSegmentFrames;
  }
  
  const timeline: AudioTimeline = {
    segments: timings,
    totalFrames: currentFrame,
    totalDurationSeconds: currentFrame / fps,
    pacingStats: {
      totalGapSeconds,
      averageGapSeconds: totalGapSeconds / timings.length,
      contentType
    }
  };
  
  logger.info('Audio timeline with pacing calculated', {
    projectId,
    totalFrames: timeline.totalFrames,
    totalDuration: `${timeline.totalDurationSeconds.toFixed(2)}s`,
    totalGapTime: `${totalGapSeconds.toFixed(2)}s`,
    averageGap: `${timeline.pacingStats.averageGapSeconds.toFixed(2)}s`
  });
  
  return timeline;
}

/**
 * React Hook: 在组件中使用音频驱动时间线
 */
export function useAudioTimeline(
  audioSegments: Array<{ path: string; segment: ScriptSegment }>,
  fps: number,
  projectId: string,
  contentEngine: ContentEngine
): AudioTimeline | null {
  const [timeline, setTimeline] = useState<AudioTimeline | null>(null);
  const [handle] = useState(() => delayRender('Loading audio timeline with pacing'));
  
  useEffect(() => {
    calculateAudioDrivenTimeline(audioSegments, fps,  contentEngine)
      .then((result) => {
        setTimeline(result);
        continueRender(handle);
      })
      .catch((error) => {
        logger.error('Failed to calculate audio timeline', { projectId, error });
        continueRender(handle);
      });
  }, [audioSegments, fps, projectId, contentEngine, handle]);
  
  return timeline;
}

/**
 * 判断当前帧是否在呼吸间隙中
 */
export function isInPacingGap(
  segment: AudioSegmentTiming,
  frame: number
): boolean {
  if (segment.pacingGpFrames === 0) return false;
  
  const gapStartFrame = segment.endFrame - segment.pacingGap.afterGapFrames;
  return frame >= gapStartFrame && frame < segment.endFrame;
}

/**
 * 根据当前帧获取对应的音频段
 */
export function getSegmentAtFrame(
  timeline: AudioTimeline,
  frame: number
): AudioSegmentTiming | null {
  return timeline.segments.find(
    seg => frame >= seg.startFrame && frame < seg.endFrame
  ) || null;
}

/**
 * 获取当前帧在段内的进度 (0-1)
 */
export function getSegmentProgress(
  segment: AudioSegmentTiming,
  frame: number
): number {
  const relativeFrame = frame - segment.startFrame;
  return Math.min(1, Math.max(0, relativeFrame / segment.durationFrames));
}
```

---

### Task 5: Shorts Safe Zone with Gravity Alignment (src/shorts/safe-zone.ts)

**安全区保护 + 重力对齐 — 完美视觉平衡：**

```typescript
// src/shorts/safe-zone.ts

import React from 'react';
import { AbsoluteFill } from 'remotion';

export interface SafeZone {
  top: number;    / 百分比
  bottom: number;
  left: number;
  right: number;
}

/**
 * 2026 YouTube Shorts 安全区定义
 * 基于最新的 UI 布局
 */
export const YOUTUBE_SHORTS_SAFE_ZONE: SafeZone = {
  top: 10,      // 状态栏 + 搜索按钮
  bottom: 22,   // 描述、用户名、音乐信息、进度条
  left: 5,      // 左边缘
  right: 18     // 点赞、评论、分享、更多按钮
};

/**
 * TikTok 安全区 (如果需要多平台)
 */
export const TIKTOK_SAFE_ZONE: SafeZone = {
  top: 12,
  bottom: 
  right: 15
};

// ============================================
// Gravity Alignment (重力对齐)
// ============================================

export type GravityDirection = 'up' | 'down' | 'left' | 'right' | 'center';

export interface GravityAlignment {
  direction: GravityDirection;
  offsetX: number;
  offsetY: number;
  breathingRoom: number;  // 额外"呼吸空间"
}

/**
 * 根据位置计算重力对齐
 * 元素会自动"远离"危险区边缘
 */
export function calculateGravityAlignment(
  position: 'top' | 'bottom' | 'center',
  safeZone: SafeZone = YOUTUBE_SHORTS_SAFE_ZONE
): GravityAlignment {
  switch (position) {
    case 'top':
      // 顶部元素向下偏移，远离状态栏
      return {
        direction: 'down',
        offsetX: 0,
        offsetY: 20,  // 额外向下 20px
        breathingRoom: 15
      };
    
    case 'bottom':
      // 底部元素向上偏移，远离描述区
      return {
        direction: 'up',
        offsetX: 0,
        offsetY: -30,  // 额外向 (底部遮挡更严重)
        breathingRoom: 20
      };
    
    case 'center':
      // 居中元素轻微向左偏移，远离右侧按钮
      return {
        direction: 'left',
        offsetX: -20,  // 轻微向左
        offsetY: 0,
        breathingRoom: 10
      };
    
    default:
      return {
        direction: 'center',
        offsetX: 0,
        offsetY: 0,
        breathingRoom: 0
      };
  }
}

/**
 * 计算安全渲染区域的像素值 (考虑重力对齐)
 */
export function getea(
  width: number,   // 1080
  height: number,  // 1920
  position: 'top' | 'bottom' | 'center',
  safeZone: SafeZone = YOUTUBE_SHORTS_SAFE_ZONE
): {
  x: number;
  y: number;
  width: number;
  height: number;
  gravity: GravityAlignment;
} {
  const gravity = calculateGravityAlignment(position, safeZone);
  
  const safeX = Math.ceil(width * (safeZone.left / 100)) + gravity.breathingRoom;
  const safeY = Math.ceil(height * (safeZone.top / 100)) + gravity.breathingRoom;
  const safeWidth = Math.floor(
    width * (1 - safeZone.left / 100 - safeZone.right / 100)
  ) - gravity.breathingRoom * 2;
  const safeHeight = Math.floor(
    height * (1 - safeZone.top / 100 - safeZone.bottom / 100)
  ) - gravity.breathingRoom * 2;
  
  return {
    x: safeX + gravity.offsetX,
    y: safeY + gravity.offsetY,
    width: safeWidth,
    height: safeHeight,
    gravity
  };
}

/**
 * 检查元素是否在安全区内
 */
export function isInSafeZone(
  elementRect: { x: number; y: number; width: number; height: number },
 inerSize: { width: number; height: number },
  safeZone: SafeZone = YOUTUBE_SHORTS_SAFE_ZONE
): boolean {
  const safe = getSafeRenderArea(containerSize.width, containerSize.height, 'center', safeZone);
  
  return (
    elementRect.x >= safe.x &&
    elementRect.y >= safe.y &&
    elementRect.x + elementRect.width <= safe.x + safe.width &&
    elementRect.y + elementRect.height <= safe.y + safe.height
  );
}

/**
 * 调整元素位置到安全区内
 */
export function adjustToSafeZone(
  elementRect: { x:r; y: number; width: number; height: number },
  containerSize: { width: number; height: number },
  safeZone: SafeZone = YOUTUBE_SHORTS_SAFE_ZONE
): { x: number; y: number } {
  const safe = getSafeRenderArea(containerSize.width, containerSize.height, 'center', safeZone);
  
  let newX = elementRect.x;
  let newY = elementRect.y;
  
  // 左边界
  if (newX < safe.x) {
    newX = safe.x;
  }
  // 右边界
  if (newX + elementRect.width > safe.x + safe.width) {
    newX = safe.x + safe.width - elementRect  // 上边界
  if (newY < safe.y) {
    newY = safe.y;
  }
  // 下边界
  if (newY + elementRect.height > safe.y + safe.height) {
    newY = safe.y + safe.height - elementRect.height;
  }
  
  return { x: newX, y: newY };
}

/**
 * Safe Zone 容器组件 (含重力对齐)
 */
export const SafeZoneContainer: React.FC<{
  children: React.ReactNode;
  position: 'top' | 'bottom' | 'center';
  safeZone?: SafeZone;
  debug?: boolean;
}> = ({
  children,
  position,
  safeZone = YOUTUBE_SHORTS_SAFE_ZONE,
  deb=> {
  const gravity = calculateGravityAlignment(position, safeZone);
  
  // 计算位置样式
  const getPositionStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      left: `${safeZone.left}%`,
      right: `${safeZone.right}%`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: gravity.breathingRoom
    };
    
    switch (position) {
      case 'top':
        return {
          ...base,
          tope.top}%`,
          paddingTop: gravity.breathingRoom + Math.abs(gravity.offsetY),
          alignItems: 'flex-start'
        };
      
      case 'bottom':
        return {
          ...base,
          bottom: `${safeZone.bottom}%`,
          paddingBottom: gravity.breathingRoom + Math.abs(gravity.offsetY),
          alignItems: 'flex-end'
        };
      
      case 'center':
      default:
        return {
          ...base,
          top: `${safeZone.top}%`,
          bottom: `${safeZone.bottom}%`,
          transform: `translateX(${gravity.offsetX}px)`
        };
    }
  };
  
  return (
    <div style={getPositionStyle()}>
      {children}
      
      {/* 调试模式显示重力信息 */}
      {debug && (
        <div style={{
          position: 'absolute',
          bottom: 5,
          right: 5,
          fontSize: 10,
          color: '#00ff00',
          background: 'rgba(0,0,0,0.7)',
          padding: '2px 6px',
          borderRadius: 3
        }}>
          Gravity: {gravity.direction} | Of: ({gravity.offsetX}, {gravity.offsetY})
        </div>
      )}
    </div>
  );
};

/**
 * 安全区调试覆盖层
 */
export const SafeZoneOverlay: React.FC<{
  safeZone?: SafeZone;
  showLabels?: boolean;
  showGravityGuides?: boolean;
}> = ({ 
  safeZone = YOUTUBE_SHORTS_SAFE_ZONE,
  showLabels = true,
  showGravityGuides = true
}) => {
  const topGravity = calculateGravityAlignment('top', safeZone);
  const bottomGravity = calculateGravityAlignment('bottom', safeZone);
  const centerGravity = calculateGravityAlignment('center', safeZone);
  
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 9999 }}>
      {/* 顶部危险区 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: `${safeZone.top}%`,
        background: 'rgba(255, 0, 0, 0.25)',
        borderBottom: '2px dashed #ff0000'
      }}>
        {showLabels && (
          <span style={{ color: '#ff0000', fontSize: 12, padding: 4 }}>
            ⚠️ TOP UNSAFE }%) - Status Bar
          </span>
        )}
      </div>
      
      {/* 底部危险区 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${safeZone.bottom}%`,
        background: 'rgba(255, 0, 0, 0.25)',
        borderTop: '2px dashed #ff0000'
      }}>
        {showLabels && (
          <span style={{ 
            color: '#ff0000', 
            fontSize: 12, 
            padding: 4,
            position: 'absolute',
           
          }}>
            ⚠️ BOTTOM UNSAFE ({safeZone.bottom}%) - Description, Music, Progress
          </span>
        )}
      </div>
      
      {/* 右侧危险区 */}
      <div style={{
        position: 'absolute',
        top: `${safeZone.top}%`,
        right: 0,
        bottom: `${safeZone.bottom}%`,
        width: `${safeZone.right}%`,
        background: 'rgba(255, 0, 0, 0.25)',
        borderLeft: '2px dashed #ff0000'
      }}>
        {showLabels && (
          <span style={{ 
         0000', 
            fontSize: 12, 
            padding: 4,
            writingMode: 'vertical-rl'
          }}>
            ⚠️ RIGHT UNSAFE - Like, Comment, Share
          </span>
        )}
      </div>
      
      {/* 安全区边框 (绿色) */}
      <div style={{
        position: 'absolute',
        top: `${safeZone.top}%`,
        left: `${safeZone.left}%`,
        right: `${safeZone.right}%`,
        bottom: `${safeZone.bottom}%`,
        border: '2px solid #00ff00'
      }}>
        {showLabe && (
          <span style={{ 
            color: '#00ff00', 
            fontSize: 14, 
            padding: 8,
            fontWeight: 'bold'
          }}>
            ✓ SAFE ZONE
          </span>
        )}
      </div>
      
      {/* 重力方向指示器 */}
      {showGravityGuides && (
        <>
          {/* Top gravity arrow */}
          <div style={{
            position: 'absolute',
            top: `${safeZone.top + 2}%`,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#00ffff',
            fontSize: 16
          }}>
            ↓ Gravity ({topGravity.offsetY}px)
          </div>
          
          {/* Bottom gravity arrow */}
          <div style={{
            position: 'absolute',
            bottom: `${safeZone.bottom + 2}%`,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#00ffff',
            fontSize: 16
          }}>
            ↑ Gravity ({bottomGravity.offsetY}px)
          </div>
          
      {/* Center gravity arrow */}
          <div style={{
            position: 'absolute',
            top: '50%',
            right: `${safeZone.right + 2}%`,
            transform: 'translateY(-50%)',
            color: '#00ffff',
            fontSize: 16
          }}>
            ← Gravity ({centerGravity.offsetX}px)
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
```

---

### Task 6: Emotional Transitions with Glitch Effect (src/components/transitions/EmotionalTransition.tsx)

**情ç Red Glitch 效果：**

```typescript
// src/components/transitions/EmotionalTransition.tsx

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, random } from 'remotion';
import { EmotionalTrigger } from '../../core/manifest-parser';

interface EmotionalTransitionProps {
  emotion: EmotionalTrigger;
  children: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  seed?: string;  // 用于一致的随机效果
}

/**
 * 情绪 → 转场效果映å EMOTION_EFFECTS: Record<EmotionalTrigger, {
  name: string;
  description: string;
  psychology: string;
}> = {
  anger: {
    name: 'Shake & Flash + Red Glitch',
    description: '震动 + 红色闪烁 + RGB 分离',
    psychology: '激发肾上腺素，促进评论'
  },
  fomo: {
    name: 'Urgent Pulse',
    description: '快速缩放 + 黄色脉冲',
    psychology: '制造紧迫感，促进行动'
  },
  awe: {
    name: 'Slow Zoom & Glow',
    description: '缓慢缩放 + 柔和光晕',
    psych惊叹感，促进分享'
  },
  curiosity: {
    name: 'Blur Reveal',
    description: '模糊到清晰 + 缓慢淡入',
    psychology: '保持悬念，提高完播率'
  },
  validation: {
    name: 'Bounce & Check',
    description: '弹跳 + 绿色确认',
    psychology: '强化认同感，促进点赞'
  }
};

// ============================================
// Red Glitch 效果 (anger 情绪专用)
// ============================================

const RED_GLITCH_DURATION_FRAMES = 6;

interface Glitconfig {
  offsetX: number;
  offsetY: number;
  opacity: number;
}

function generateGlitchConfig(frame: number, seed: string): GlitchConfig {
  const r1 = random(`${seed}-x-${frame}`);
  const r2 = random(`${seed}-y-${frame}`);
  const r3 = random(`${seed}-opacity-${frame}`);
  
  return {
    offsetX: (r1 - 0.5) * 20,
    offsetY: (r2 - 0.5) * 10,
    opacity: 0.1 + r3 * 0.15
  };
}

const RedGlitchOverlay: React.FC<{
  frame: number;
  seed: string;
  intensity: number;
}> = ({ frame, seed, intensity }) => {
  if (frame >= RED_GLITCH_DURATION_FRAMES) return null;
  
  const config = generateGlitchConfig(frame, seed);
  
  return (
    <>
      {/* 主红色覆盖 */}
      <AbsoluteFill
        style={{
          background: `rgba(255, 0, 0, ${config.opacity * intensity})`,
          mixBlendMode: 'overlay',
          transform: `translate(${config.offsetX}px, ${config.offsetY}px)`,
        }}
      />
      
      {/* RGB 分离效果 */}
      <AbsoluteFill
        style={{
          background: `rgba(0,55, 255, ${config.opacity * 0.5 * intensity})`,
          mixBlendMode: 'screen',
          transform: `translate(${-config.offsetX * 0.5}px, ${config.offsetY * 0.5}px)`,
        }}
      />
      
      {/* 扫描线 */}
      {frame % 2 === 0 && (
        <AbsoluteFill
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 2px,
              rgba(0,0,0,${0.1 * intensity}) 2px,
              rgba(0,0,0,${0.1 * inte) 4px
            )`,
            opacity: 0.5
          }}
        />
      )}
      
      {/* 水平撕裂 */}
      {frame % 3 === 0 && (
        <div
          style={{
            position: 'absolute',
            top: `${30 + config.offsetX * 2}%`,
            left: 0,
            right: 0,
            height: 4,
            background: 'rgba(255, 0, 0, 0.5)',
            transform: `translateX(${config.offsetX * 2}px)`
          }}
        />
      )}
    </>
  );
};

export const EmotionalTransitio.FC<EmotionalTransitionProps> = ({
  emotion,
  children,
  intensity = 'medium',
  seed = 'default'
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const intensityMultiplier = { low: 0.5, medium: 1, high: 1.5 }[intensity];
  
  const getTransitionStyle = (): React.CSSProperties => {
    switch (emotion) {
      case 'anger':
        return getAngerStyle(frame, fps, intensityMultiplier);
      case 'fomo':
        return getFomoStyle(frame, fps, intensityMultiplier);
      case 'awe':
        return getAweStyle(frame, fps, intensityMultiplier);
      case 'curiosity':
        return getCuriosityStyle(frame, fps, intensityMultiplier);
      case 'validation':
        return getValidationStyle(frame, fps, intensityMultiplier);
      default:
        return {};
    }
  };
  
  const getOverlayStyle = (): React.CSSProperties | null => {
    switch (emotion) {
      case 'fomo':
        const pulseSize = Math.sin(frame * 0.3) * 5 + 10;
        return {
          boxShadow: `inset 0 0 ${pulseSize * intensityMultiplier}px rgba(245, 158, 11, 0.3)`
        };
      case 'awe':
        const glowOpacity = interpolate(frame, [0, fps], [0.2, 0], { extrapolateRight: 'clamp' });
        return {
          background: `radial-gradient(circle, rgba(139, 92, 246, ${glowOpacity * intensityMultiplier}) 0%, transparent 70%)`
        };
      default:
        return null;
    }
  };
  
  const overlayStyle = getOverlayStyle();
  
  return (
    <AbsoluteFill>
      <div style={{ 
        width: '100%', 
        height: '100%', 
        ...getTransitionStyle() 
      }}>
        {children}
      </div>
      
      {/* Red Glitch 效果 (仅 anger) */}
      {emotion === 'anger' && (
        <RedGlitchOverlay 
          frame={frame} 
          seed={seed} 
          intensity={intensityMultiplier} 
        />
      )}
      
      {overlayStyle && (
        <AbsoluteFill style={{ 
          ...overlayStyle,
          pointerEvents: 'none' 
        }} />
      )}
    </AbsoluteFill>
  );
};

// ======================================
// 各情绪的具体动画实现
// ============================================

function getAngerStyle(frame: number, fps: number, intensity: number): React.CSSProperties {
  const shakeIntensity = frame < RED_GLITCH_DURATION_FRAMES ? 5 : 2;
  const shakeX = Math.sin(frame * 2) * shakeIntensity * intensity;
  const shakeY = Math.cos(frame * 2.5) * (shakeIntensity * 0.5) * intensity;
  
  const scale = spring({
    frame: Math.max(0, frame - RED_GLITCH_DURATION_FRAMES),
fps,
    config: { damping: 8, stiffness: 200 }
  });
  
  return {
    transform: `translate(${shakeX}px, ${shakeY}px) scale(${0.95 + scale * 0.05})`,
    filter: frame < RED_GLITCH_DURATION_FRAMES 
      ? `contrast(${1.1 + intensity * 0.1}) saturate(${1.2 + intensity * 0.2})`
      : undefined
  };
}

function getFomoStyle(frame: number, fps: number, intensity: number): React.CSSProperties {
  const pulse = Math.sin(frame * 0.15) * 0.03 * intensity + 1;
  const enterScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 250 }
  });
  
  return {
    transform: `scale(${(0.9 + enterScale * 0.1) * pulse})`,
    filter: `saturate(${1 + intensity * 0.2})`
  };
}

function getAweStyle(frame: number, fps: number, intensity: number): React.CSSProperties {
  const slowScale = interpolate(
    frame,
    [0, fps * 2],
    [1.05 + intensity * 0.05, 1],
    { extrapolateRight: 'clamp' }
  );
  
  const opacity = interpolate(
    frame,
    [0, fps * 1.2],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );
  
  return {
    transform: `scale(${slowScale})`,
    opacity,
    filter: `blur(${interpolate(frame, [0, fps * 0.8], [3 * intensity, 0])}px)`
  };
}

function getCuriosityStyle(frame: number, fps: number, intensity: number): React.CSSProperties {
  const blur = interpolate(
    frame,
    [0, fps * 1.5],
    [8 * intensity, 0],
    { extrapolateRight: 'clamp' }
  );
  
  const translateY = interpolate(
    frame,
    [0, fps],
    [20 * intensity, 0],
    { extrapolateRight: 'clamp' }
  );
  
  const opacity = interpolate(
    frame,
    [0, fps * 0.5],
    [0.5, 1],
    { extrapolateRight: 'clamp' }
  );
  
  return {
    filter: `blur(${blur}px)`,
    transform: `translateY(${translateY}px)`,
    opacity
  };
}

function getValidationStyle(frame: number, fps: number, intensity: number): React.CSSProperties {
  const bounce = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 150, mass: 0.8 }
  });
  
  const satisfactionScale = interpolate(bounce, [0, 0.5, 1], [0.8, 1.05, 1]);
  
  return {
    transform: `scale(${satisfactionScale})`,
    filter: `brightness(${1 + bounce * 0.1 * intensity})`
  };
}

/**
 * 获取情绪对应的背景音效建议
 */
export function getEmotionSoundEffect(emotion: EmotionalTrigger): string | null {
  const soundEffects: Record<EmotionalTrigger, string> = {
    anger: '/sounds/dramatic-hit.mp3',
    fomo: '/sounds/ticking-clock.mp3',
    awe: '/sounds/magical-shimmer.mp3',
    curiosity: '/sounds/suspense-rise.mp3',
    validation: '/sounds/success-c  };
  
  return soundEffects[emotion] || null;
}

/**
 * 获取情绪对应的 Glitch 时长推荐
 */
export function getRecommendedGlitchDuration(emotion: EmotionalTrigger): number {
  const durations: Record<EmotionalTrigger, number> = {
    anger: 8,       // 最长，最有冲击力
    fomo: 6,
    awe: 4,
    curiosity: 5,
    validation: 3   // 最短，不打扰满足感
  };
  return durations[emotion];
}
```

---

### Task 7: Chapter SEO Overlay with High Contrast (src/components/overlays/Chaptelay.tsx)

**高对比度关键帧 — Google Vision AI 优化：**

```typescript
// src/components/overlays/ChapterSEOOverlay.tsx

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { ThemeConfig } from '../../templates';
import { validateKeywordConsistency } from '../../core/keyword-validator';
import { logger } from '../../utils/logger';

interface ChapterSEOOverlayProps {
  keyword: string;
  chapterTitle: string;
  chapterNumnumber;
  theme: ThemeConfig;
  displayDurationFrames?: number;
  establishedTrends?: string[];  // 用于三重索引验证
  seoTags?: string[];            // 用于三重索引验证
  projectId?: string;
}

// ============================================
// 高对比度样式 (Vision AI 友好)
// WCAG 对比度 7:1+
// ============================================

const HIGH_CONTRAST_TEXT_STYLE: React.CSSProperties = {
  color: '#FFFFFF',
  textShadow: `
    3px 3px 0 #000,
    -3px -3px 0 #000,
    3p 0 #000,
    -3px 3px 0 #000,
    0 0 10px rgba(0,0,0,0.9),
    0 4px 8px rgba(0,0,0,0.8)
  `,
  WebkitTextStroke: '1px rgba(0,0,0,0.3)'
};

const HIGH_CONTRAST_BACKGROUND = 'rgba(0, 0, 0, 0.88)';

export const ChapterSEOOverlay: React.FC<ChapterSEOOverlayProps> = ({
  keyword,
  chapterTitle,
  chapterNumber,
  theme,
  displayDurationFrames,
  establishedTrends = [],
  seoTags = [],
  projectId
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const duration = displayDurationFrames ?? fps * 2.5; // 2.5 秒确保足够识别时间
  
  // 三重索引验证
  React.useEffect(() => {
    if (projectId && (establishedTrends.length > 0 || seoTags.length > 0)) {
      const validation = validateKeywordConsistency(keyword, establishedTrends, seoTags);
      if (!validation.valid) {
        logger.warn('Keyword consistency warning', {
          projectId,
          keyword,
          warning: validation.warning
        });
      }
    }
  }, [keyword, establishedTrends, seoTags, p
  if (frame > duration) return null;
  
  // 入场动画
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 }
  });
  
  // 退场动画 (最后 0.5 秒)
  const exitStart = duration - fps * 0.5;
  const exitProgress = frame > exitStart
    ? interpolate(frame, [exitStart, duration], [1, 0], { extrapolateRight: 'clamp' })
    : 1;
  
  const combinedOpacity = enterProgress * exitProgress;
  
  // 关键词动画
  const keywordScale = interpolate(enterProgress, [0, 1], [0.85, 1]);
  const keywordY = interpolate(enterProgress, [0, 1], [30, 0]);
  
  // 标题动画 (稍微延迟)
  const titleOpacity = interpolate(frame, [fps * 0.3, fps * 0.8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const titleY = interpolate(frame, [fps * 0.3, fps * 0.8], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  // 装饰线动画
  const lineWidth = interpolate(enterProgress, [0, 1], [0, 250]);
  
  return (
    <Abso     style={{
        justifyContent: 'center',
        alignItems: 'center',
        background: `linear-gradient(180deg, 
          ${HIGH_CONTRAST_BACKGROUND} 0%, 
          rgba(0,0,0,0.75) 50%, 
          ${HIGH_CONTRAST_BACKGROUND} 100%)`,
        opacity: combinedOpacity
      }}
    >
      {/* 章节编号 */}
      {chapterNumber !== undefined && (
        <div
          style={{
            position: 'absolute',
            top: '18%',
            fontFamily: theme.fonts.body,
            fontSiz           fontWeight: 600,
            color: theme.colors.primary,
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity: enterProgress,
            ...HIGH_CONTRAST_TEXT_STYLE
          }}
        >
          CHAPTER {chapterNumber}
        </div>
      )}
      
      {/* SEO 关键词 (最大最醒目) */}
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: 88,
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 10,
          textAlign: 'center',
          transform: `scale(${keywordScale}) translateY(${keywordY}px)`,
          maxWidth: '85%',
          lineHeight: 1.1,
          ...HIGH_CONTRAST_TEXT_STYLE,
          // 额外的发光效果增强可见性
          filter: `drop-shadow(0 0 30px ${theme.colors.primary}60)`
        }}
      >
        {keyword}
      </div>
      
      {/* 章节标题 */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 32,
          fontWeight: 500,
          marginTop: 28,
          textAlign: 'center',
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          maxWidth: '75%',
          ...HIGH_CONTRAST_TEXT_STYLE
        }}
      >
        {chapterTitle}
      </div>
      
      {/* 装饰线 (品牌色) */}
      <div
        style={{
          position: 'absolute',
          bottom: '22%',
          width: lineWidth,
          height: 4,
          background: `linear-gradient(90deg,  transparent 0%,
            ${theme.colors.primary} 20%,
            ${theme.colors.primary} 80%,
            transparent 100%)`,
          borderRadius: 2
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * 从 SEO 数据中提取章节关键词
 */
export function extractChapterKeywords(
  chapters: string,
  tags: string[]
): Array<{ timestamp: string; keyword: string; title: string }> {
  const lines = chapters.split('\n').filter(Boolean);
  
  return lines.map((line, index) => {
    const match = atch(/^(\d{2}:\d{2})\s*-?\s*(.+)$/);
    if (!match) return null;
    
    const [, timestamp, title] = match;
    const keyword = tags[index] || title.split(' ')[0];
    
    return { timestamp, keyword: keyword.toUpperCase(), title };
  }).filter(Boolean) as Array<{ timestamp: string; keyword: string; title: string }>;
}
```

---

### Task 8: Keyword Validator (src/core/keyword-validator.ts)

**三重索引一致性验证：**

```typescript
// src/core/keyword-validator.ts

import { logger } from '../utiogger';

interface ValidationResult {
  valid: boolean;
  inTrends: boolean;
  inTags: boolean;
  warning?: string;
  suggestions?: string[];
}

/**
 * 验证关键词在三重索引中的一致性
 * 三重索引: 标题 (Title) + 标签 (Tags) + 视觉 (Visual)
 */
export function validateKeywordConsistency(
  chapterKeyword: string,
  establishedTrends: string[],
  seoTags: string[]
): ValidationResult {
  const keywordLower = chapterKeyword.toLowerCase().trim();
  
  // 检查是否在 established trendinTrends = establishedTrends.some(trend => {
    const trendLower = trend.toLowerCase();
    return trendLower.includes(keywordLower) || 
           keywordLower.includes(trendLower) ||
           calculateSimilarity(keywordLower, trendLower) > 0.7;
  });
  
  // 检查是否在 SEO tags 中
  const inTags = seoTags.some(tag => {
    const tagLower = tag.toLowerCase();
    return tagLower.includes(keywordLower) || 
           keywordLower.includes(tagLower) ||
           calculateSimilarity(keywordLower, ta7;
  });
  
  // 生成结果
  if (inTrends && inTags) {
    return { valid: true, inTrends, inTags };
  }
  
  if (!inTrends && !inTags) {
    const allKeywords = [...establishedTrends, ...seoTags];
    const suggestions = findSimilarKeywords(keywordLower, allKeywords, 3);
    
    return {
      valid: false,
      inTrends,
      inTags,
      warning: `Keyword "${chapterKeyword}" not found in trends or tags. Consider using: ${suggestions.join(', ')}`,
      suggestions
    };
  }
  
  // 部分匹配
  return {
    valid: true,
    inTrends,
    inTags,
    warning: inTrends 
      ? `Keyword "${chapterKeyword}" found in trends but not in tags`
      : `Keyword "${chapterKeyword}" found in tags but not in trends`
  };
}

/**
 * 计算两个字符串的相似度 (Jaccard 系数)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const w Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * 找出最相似的关键词
 */
function findSimilarKeywords(
  target: string,
  candidates: string[],
  limit: number
): string[] {
  return candidates
    .map(candidate => ({
      keyword: candidate,
      similarity: calculateSimilarity(target, candidate.toLowerCase())
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(item => item.keyword);
}

/**
 * 批量验证所有章节关键词
 t function validateAllChapterKeywords(
  chapters: Array<{ keyword: string; title: string }>,
  establishedTrends: string[],
  seoTags: string[],
  projectId: string
): { allValid: boolean; results: ValidationResult[] } {
  const results: ValidationResult[] = [];
  let allValid = true;
  
  for (const chapter of chapters) {
    const result = validateKeywordConsistency(chapter.keyword, establishedTrends, seoTags);
    results.push(result);
    
    if (!result.valid) {
      allValid = false;
      logger.warn('Chapter keyword validation failed', {
        projectId,
        keyword: chapter.keyword,
        warning: result.warning
      });
    }
  }
  
  return { allValid, results };
}
```

---

### Task 9: Smart Subtitle with Dynamic Scaling (src/components/overlays/SmartSubtitle.tsx)

**词级高亮 + 动态缩放：**

```typescript
// src/components/overlays/SmartSubtitle.tsx

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { ThemeConfig from '../../templates';

export interface WordSegment {
  word: string;
  startTime: number;      // 秒
  endTime: number;        // 秒
  emphasis?: boolean;     // 是否强调
  type?: 'normal' | 'keyword' | 'number' | 'action';
}

interface SmartSubtitleProps {
  words: WordSegment[];
  theme: ThemeConfig;
  style?: 'karaoke' | 'highlight' | 'bounce' | 'scale';
  position?: 'bottom' | 'center' | 'top';
  /** 强调词的缩放比例 (默认 1.2) */
  emphasisScale?: number;
  /** 强调词使用 accenemphasisUseAccent?: boolean;
}

// ============================================
// Dynamic Word Scaling 配置
// ============================================

const WORD_TYPE_SCALE: Record<NonNullable<WordSegment['type']>, number> = {
  normal: 1.0,
  keyword: 1.12,
  number: 1.18,
  action: 1.08
};

const EMPHASIS_SCALE_MULTIPLIER = 1.2;
const ACTIVE_SCALE_BOOST = 1.08;

export const SmartSubtitle: React.FC<SmartSubtitleProps> = ({
  words,
  theme,
  style = 'scale',
  position = 'bottom',
  emphasisScal1.2,
  emphasisUseAccent = true
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  
  // 安全区感知定位
  const getPositionStyle = (): React.CSSProperties => {
    switch (position) {
      case 'bottom':
        return { bottom: '24%' };  // 避开 YouTube 描述区
      case 'top':
        return { top: '12%' };
      case 'center':
      default:
        return { top: '45%' };
    }
  };
  
  // 计算单词的动态缩放
  const crdScale = (word: WordSegment, isActive: boolean): number => {
    let scale = WORD_TYPE_SCALE[word.type || 'normal'];
    
    if (word.emphasis) {
      scale *= EMPHASIS_SCALE_MULTIPLIER;
    }
    
    if (isActive) {
      scale *= ACTIVE_SCALE_BOOST;
    }
    
    return scale;
  };
  
  // 获取单词颜色
  const getWordColor = (word: WordSegment, isActive: boolean, isPast: boolean): string => {
    if (isActive) {
      // 强调词使用 accent 颜色
      return word.emphasis && emphasisUseAcce.colors.accent : theme.colors.primary;
    }
    if (isPast) return 'rgba(255,255,255,0.75)';
    return 'rgba(255,255,255,0.4)';
  };
  
  // 类型特定样式
  const getWordTypeStyle = (word: WordSegment, isActive: boolean): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {};
    
    switch (word.type) {
      case 'keyword':
        baseStyle.fontWeight = 700;
        if (isActive) {
          baseStyle.textDecoration = 'underline';
          baseStyle.textDecorationColor = theme.ry;
          baseStyle.textUnderlineOffset = '4px';
        }
        break;
      case 'number':
        baseStyle.fontFamily = 'JetBrains Mono, monospace';
        baseStyle.letterSpacing = '0.05em';
        break;
      case 'action':
        baseStyle.fontStyle = 'italic';
        break;
    }
    
    return baseStyle;
  };
  
  return (
    <div
      style={{
        position: 'absolute',
        left: '8%',
        right: '20%',  // 避开右侧按钮
        display: 'flex',
        flexWrap: 'wrajustifyContent: 'center',
        alignItems: 'center',
        gap: '0.25em',
        lineHeight: 1.5,
        ...getPositionStyle()
      }}
    >
      {words.map((word, index) => {
        const isActive = currentTime >= word.startTime && currentTime <= word.endTime;
        const isPast = currentTime > word.endTime;
        
        // 动画进度
        const wordProgress = isActive
          ? interpolate(
              currentTime,
              [word.startTime, word.endTime],
              [0, 1]        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            )
          : isPast ? 1 : 0;
        
        // 动态缩放
        const scale = calculateWordScale(word, isActive);
        
        // 根据样式获取动画
        const getAnimationStyle = (): React.CSSProperties => {
          switch (style) {
            case 'karaoke':
              return {
                background: isActive
                  ? `linear-gradient(90deg, currentColor ${wordProgress * 100}%, rgba(255,253) ${wordProgress * 100}%)`
                  : undefined,
                WebkitBackgroundClip: isActive ? 'text' : undefined,
                WebkitTextFillColor: isActive ? 'transparent' : undefined,
                transform: `scale(${isActive ? scale : 1})`
              };
            
            case 'bounce':
              const bounceY = isActive ? -Math.sin(wordProgress * Math.PI) * 8 : 0;
              return {
                transform: `scale(${isActive ? scale : 1}) translateY(${bounceY}px)`
              };
            
            case 'scale':
            case 'highlight':
            default:
              // 使用 spring 动画
              if (isActive && word.emphasis) {
                const emphasisSpring = spring({
                  frame: frame - word.startTime * fps,
                  fps,
                  config: { damping: 12, stiffness: 150 }
                });
                return {
                  transform: `scale(${1 + (emphasisScale - 1) * emphasisSpring})`
         ;
              }
              return {
                transform: `scale(${isActive ? scale : 1})`
              };
          }
        };
        
        return (
          <span
            key={index}
            style={{
              fontFamily: theme.fonts.body,
              fontSize: word.emphasis ? 38 : 32,
              fontWeight: word.emphasis ? 700 : 500,
              color: getWordColor(word, isActive, isPast),
              textShadow: isActive 
                ? `0 0 25px ${theme.colors.primary}90, 2px 2px 4px rgba(0,0,0,0.9)`
                : '2px 2px 4px rgba(0,0,0,0.7)',
              display: 'inline-block',
              transition: 'color 0.12s ease-out, transform 0.1s ease-out',
              ...getWordTypeStyle(word, isActive),
              ...getAnimationStyle()
            }}
          >
            {word.word}
          </span>
        );
      })}
    </div>
  );
};

/**
 * 从 voiceover 文本生成词级时间轴
 * (简化版，实际应使用 Whisper 等工具获取精确
 */
export function generateWordTimeline(
  voiceover: string,
  startTime: number,
  duration: number,
  emphasisWords?: string[],
  keywordList?: string[]
): WordSegment[] {
  const words = voiceover.split(/\s+/).filter(Boolean);
  const avgWordDuration = duration / words.length;
  
  let currentTime = startTime;
  
  return words.map(word => {
    const cleanWord = word.replace(/[.,!?;:"']/g, '').toLowerCase();
    
    // 确定强调
    const isEmphasis = emphasisWords?.some(
      ew => cleanWord.inw.toLowerCase())
    );
    
    // 确定类型
    let type: WordSegment['type'] = 'normal';
    if (/^\d+/.test(cleanWord) || /\$|%|€|¥/.test(word)) {
      type = 'number';
    } else if (keywordList?.some(k => cleanWord.includes(k.toLowerCase()))) {
      type = 'keyword';
    } else if (/^(click|tap|swipe|scroll|buy|subscribe|follow)$/i.test(cleanWord)) {
      type = 'action';
    }
    
    const segment: WordSegment = {
      word,
      startTime: currentTime,
      endTime: currentTime + avgWo
      emphasis: isEmphasis,
      type
    };
    
    currentTime += avgWordDuration;
    return segment;
  });
}
```

---

### Task 10: CTA Overlay with Safe Zone + Gravity (src/components/overlays/CTAOverlay.tsx)

**安全区感知 + 重力对齐的 CTA：**

```typescript
// src/components/overlays/CTAOverlay.tsx

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { ShortsHook, EmotionalTrigger } from '../../core/manifest-parimport { ThemeConfig } from '../../templates';
import { SafeZoneContainer, YOUTUBE_SHORTS_SAFE_ZONE, calculateGravityAlignment } from '../../shorts/safe-zone';

interface CTAOverlayProps {
  hook: ShortsHook;
  theme: ThemeConfig;
  position?: 'top' | 'bottom' | 'center';
  respectSafeZone?: boolean;
}

// 情绪对应的视觉样式
const EMOTION_STYLES: Record<EmotionalTrigger, {
  color: string;
  gradient: string;
  icon: string;
  animation: 'shake' | 'glow' | 'pulse' | 'bounce' | 'pop';
}> = {
  anger{
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    icon: '🔥',
    animation: 'shake'
  },
  awe: {
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    icon: '✨',
    animation: 'glow'
  },
  curiosity: {
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    icon: '🤔',
    animation: 'pulse'
  },
  fomo: {
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, 6 100%)',
    icon: '⚡',
    animation: 'bounce'
  },
  validation: {
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    icon: '✅',
    animation: 'pop'
  }
};

export const CTAOverlay: React.FC<CTAOverlayProps> = ({
  hook,
  theme,
  position = 'bottom',
  respectSafeZone = true
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const emotionStyle = EMOTION_STYLES[hook.emotional_trigger];
  const gravity = calculateGravityAlign(position);
  
  // 入场动画
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 }
  });
  
  // 情绪特定动画
  const getEmotionAnimation = (): React.CSSProperties => {
    switch (emotionStyle.animation) {
      case 'shake':
        const shake = Math.sin(frame * 2) * 3;
        return { transform: `translateX(${shake}px)` };
      
      case 'glow':
        const glowSize = 20 + Math.sin(frame / 5) * 10;
        return { boxShadow: `0 0 ${glowSize}px otionStyle.color}80` };
      
      case 'bounce':
        const bounceY = Math.sin(frame / 8) * 5;
        return { transform: `translateY(${bounceY}px)` };
      
      case 'pulse':
        const pulse = 1 + Math.sin(frame / 10) * 0.05;
        return { transform: `scale(${pulse})` };
      
      case 'pop':
      default:
        return {};
    }
  };
  
  // 计算安全位置
  const getPositionInSafeZone = (): React.CSSProperties => {
    const safeZone = YOUTUBE_SHORTS_SAFE_ZONE;
    
    switch (      case 'top':
        return { 
          top: `${safeZone.top}%`,
          paddingTop: gravity.breathingRoom + Math.abs(gravity.offsetY)
        };
      case 'center':
        return { 
          top: `${safeZone.top + (100 - safeZone.top - safeZone.bottom) / 2}%`,
          transform: `translateY(-50%) translateX(${gravity.offsetX}px)`
        };
      case 'bottom':
      default:
        return { 
          bottom: `${safeZone.bottom}%`,
          paddingBottom: gravity.breathingRoom + Math.abs(gravity.offsetY)
        };
    }
  };
  
  const Content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: '24px 40px',
        background: emotionStyle.gradient,
        borderRadius: 20,
        opacity: enterProgress,
        transform: `scale(${0.8 + enterProgress * 0.2})`,
        ...getEmotionAnimation(),
        // 确保不超出安全区宽度
        maxWidth: respectSafeZone 
          ? `${100 - YOE_SHORTS_SAFE_ZONE.left - YOUTUBE_SHORTS_SAFE_ZONE.right - 10}%` 
          : '90%'
      }}
    >
      {/* Hook 文字 */}
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: 32,
          fontWeight: 700,
          color: '#ffffff',
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          maxWidth: 400
        }}
      >
        {hook.text}
      </div>
      
      {/* CTA (如果有) */}
      {hook.injected_cta && (
        <d   style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 30,
            fontFamily: theme.fonts.body,
            fontSize: 20,
            fontWeight: 600,
            color: '#ffffff'
          }}
        >
          <span>{emotionStyle.icon}</span>
          <span>{hook.injected_cta}</span>
        </div>
      )}
    </div>
  );
  
  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: respectSafeZone ? 'stretch' : 'center',
        pointerEvents: 'none',
        ...(respectSafeZone ? {
          left: `${YOUTUBE_SHORTS_SAFE_ZONE.left}%`,
          right: `${YOUTUBE_SHORTS_SAFE_ZONE.right}%`,
          ...getPositionInSafeZone()
        } : {})
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: position === 'top' ? 'flex-start' : position === 'bottom' ? 'flex-end' : 'center',
        width: '100%',
        height: respectSafeZone ? 'auto' : '100%'
      }}>
        {Content}
      </div>
    </AbsoluteFill>
  );
};
```

---

### Task 11: Theme System (src/templates/index.ts)

**主题选择与配置：**

```typescript
// src/templates/index.ts

import { MediaPreference } from '../core/manifest-parser';

export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
    muted: string;
  };
  fonts: {
    heading: string;
    body: string;
    code: string;
  };
  animations: {
    enterDuration: number;
    exitDuration: number;
    easing: string;
  };
  components: {
    codeBlockStyle: 'terminal' | 'ide' | 'minimal';
    diagramStyle: 'flowchart' | 'mindmap' | 'simple';
    transitionType: 'fade' | 'slide' | 'zoom' | 'morph';
    subtitleStyle: 'karaoke' | 'highlight' | 'bounce' | 'scale';
  };
}

// 主题定义
const THEMES: Recor, ThemeConfig> = {
  cyberpunk: {
    name: 'Cyberpunk',
    colors: {
      primary: '#00ffff',
      secondary: '#ff00ff',
      background: '#0a0a0f',
      text: '#ffffff',
      accent: '#ffff00',
      muted: '#666666'
    },
    fonts: {
      heading: 'Orbitron',
      body: 'Rajdhani',
      code: 'Fira Code'
    },
    animations: {
      enterDuration: 0.5,
      exitDuration: 0.3,
      easing: 'easeInOut'
    },
    components: {
      codeBlockStyle: 'terminal',
      diagramStyle: 'flowchart',
      transitionType: 'morph',
      subtitleStyle: 'karaoke'
    }
  },
  
  minimalist: {
    name: 'Minimalist',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      background: '#ffffff',
      text: '#1a1a1a',
      accent: '#0066cc',
      muted: '#999999'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      code: 'JetBrains Mono'
    },
    animations: {
      enterDuration: 0.3,
      exitDuration: 0.2,
      easing: 'easeOut'
    },
    components: {
      codeBlockStyle: 'minimal',
      diagramStyle: 'simple',
      transitionType: 'fade',
      subtitleStyle: 'highlight'
    }
  },
  
  dark_mode: {
    name: 'Dark Mode',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      background: '#18181b',
      text: '#fafafa',
      accent: '#22d3ee',
      muted: '#71717a'
    },
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Plus Jakarta Sans',
      code: 'Fira Code'
    },
    animations: {
      enterDuration: 0.4,
      exitDuration: 0.25,
      easing: 'easeInOut'
    },
    components: {
      codeBlockStyle: 'ide',
      diagramStyle: 'flowchart',
      transitionType: 'slide',
      subtitleStyle: 'scale'
    }
  },
  
  whiteboard: {
    name: 'Whiteboard',
    colors: {
      primary: '#2563eb',
      secondary: '#dc2626',
      background: '#fefefe',
      text: '#1e293b',
      accent: '#16a34a',
      muted: '#94a3b8'
    },
    fonts: {
      heading: 'Caveat',
      body: 'Nunito',
      code: 'Source Code Pro'
    },
    animations: {
      enterDuration: 0.6,
      exitDuration: 0.3,
      easing: 'easeOut'
    },
    components: {
      codeBlockStyle: 'minimal',
      diagramStyle: 'mindmap',
      transitionType: 'fade',
      subtitleStyle: 'bounce'
    }
  },
  
  corporate: {
    name: 'Corporate',
    colors: {
      primary: '#1e40af',
      secondary: '#374151',
      background: '#f8fafc',
      text: '#111827',
      accent: '#059669',
      muted: '#6b7280'
    },
    fonts: {
      heading: 'Poppins',
      body: 'Open Sans',
      code: 'IBM Plex Mono'
    },
    animations: {
      enterDuration: 0.35,
      exitDuration: 0.2,
      easing: 'easeInOut'
    },
    components: {
      codeBlockStyle: 'ide',
      diagramStyle: 'flowchart',
      transitionType: 'slide',
      subtitleStyle: 'highlight'
    }
  }
};

// Mood + ContentType → Theme 映射矩阵
const THEME_MATRIX: Record<string, Record<string, string>> = {
  tutorial: {
    professional: 'corporate',
    casual: 'whiteboard',
    energetiunk',
    calm: 'minimalist'
  },
  news: {
    professional: 'corporate',
    casual: 'dark_mode',
    energetic: 'cyberpunk',
    calm: 'minimalist'
  },
  analysis: {
    professional: 'corporate',
    casual: 'dark_mode',
    energetic: 'dark_mode',
    calm: 'minimalist'
  },
  entertainment: {
    professional: 'dark_mode',
    casual: 'cyberpunk',
    energetic: 'cyberpunk',
    calm: 'whiteboard'
  }
};

/**
 * 根据 media_preference 选择最佳主题
 */
export function selectTheme(preference: MediaPreference): ThemeConfig {
  const { visual } = preference;
  
  // 如果有明确建议，优先使用
  if (visual.theme_suggestion && THEMES[visual.theme_suggestion]) {
    return THEMES[visual.theme_suggestion];
  }
  
  // 否则根据 mood + content_type 推断
  const themeName = THEME_MATRIX[visual.content_type]?.[visual.mood] || 'minimalist';
  return THEMES[themeName];
}

export function getAllThemes(): ThemeConfig[] {
  return Object.values(THEMES);
}

export function getTheme(name: string): eConfig | undefined {
  return THEMES[name];
}
```

---

### Task 12: Contrast Checker Utility (src/utils/contrast-checker.ts)

**对比度检查工具 — 确保 WCAG 合规：**

```typescript
// src/utils/contrast-checker.ts

/**
 * 计算相对亮度
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    const sRGB = c / 255;
    return sRG.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Hex 转 RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

/**
 * 计算对比度
 * https://www.w3.org/WAI/GL/t_ratio
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const l1 = getRelativeLuminance(foreground);
  const l2 = getRelativeLuminance(background);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 检查是否满足 WCAG 对比度要求
 */
export function ensureContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): {
  passes: boolean;
  ratio: num required: number;
  recommendation?: string;
} {
  const ratio = calculateContrastRatio(foreground, background);
  const required = level === 'AAA' ? 7 : 4.5;
  const passes = ratio >= required;
  
  return {
    passes,
    ratio: Math.round(ratio * 100) / 100,
    required,
    recommendation: passes
      ? undefined
      : `Increase contrast. Current: ${ratio.toFixed(2)}:1, Required: ${required}:1`
  };
}

/**
 * 获取高对比度文字颜色
 */
export function getHighContrastTextColor(background: sg): string {
  const luminance = getRelativeLuminance(background);
  return luminance > 0.179 ? '#000000' : '#FFFFFF';
}

/**
 * 调整颜色以满足对比度要求
 */
export function adjustForContrast(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): string {
  const bgLuminance = getRelativeLuminance(background);
  const currentRatio = calculateContrastRatio(foreground, background);
  
  if (currentRatio >= targetRatio) {
    return foreground;
  }
  
  return bgLuminance > 0.5000' : '#FFFFFF';
}
```

---

### Task 13: CLI Entry Point (src/index.ts)

**完整的渲染入口：**

```typescript
// src/index.ts

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { ProjectManifestSchema, ProjectManifest } from './core/manifest-parser';
import { selectTheme } from './templates';
import { selectRenderProfile, RenderProfileName, estimateRenderTime, autoOpenPreview } from './core/render-profile';
import { TTSClient } from './audio/tts-client';
import { calculateAudioDrivenTimeline } from './audio/audio-sync';
import { ShortsExtractor } from './shorts/extractor';
import { ThumbnailGenerator } from './thumbnail/generator';
import { logger } from './utils/logger';

interface RenderOptions {
  manifestPath: string;
  outputDir: string;
  profile?: RenderProfileName;
  debugSafeZone?: boolean;
  autoPreview?: boolean;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
Usage: npx ts-node src/index.ts <manifest.json> <output-dir> [options]

Options:
  --profile=<name>     Render profile: draft, preview, production, shorts_only, 4k
  --debug-safe-zone    Show safe zone overlay in Shorts
  --auto-preview       Auto open video after rendering (default for draft)

Examples:
  npx ts-node src/index.ts ./manifest.json ./output --profile=draft
  npx ts-node src/index.ts ./manifest.json ./output --profile=production
    `);
    process.exit(1);
  }
  
  const options: RenderOptions = {
    manifestPath: args[0],
    outputDir: args[1],
    profile: args.find(a => a.startsWith('--profile='))?.split('=')[1] as RenderProfileName,
    debugSafeZone: args.includes('--debug-safe-zone'),
    autoPreview: args.includes('--auto-preview')
  };
  
  await render(options);
}

async function render(options: RenderOptions): Promise<void> {
  const { manifestPath, outputDir, profile: explicitProfile, debugSafeZone, autoPreview: explicitAutoPreview } = options;
  
  const startTime = Date.now();
  
  // ============================================
  // Step 1: 解析 Manifest
  // ============================================
  logger.info('Loading manifest', { manifestPath });
  
  const manifestContent = await readFile(manifestPath, 'utf-8');
  const manifest = ProjectManifestSchema.parse(JSON.parse(manifestContent));
  
  if (!manifest.content_engine) {
    throw new Error('Manifest missing content_engine');
  
  const { project_id } = manifest;
  const { script, seo, shorts, media_preference, estimated_duration_seconds } = manifest.content_engine;
  
  // ============================================
  // Step 2: 选择渲染配置
  // ============================================
  const renderProfile = selectRenderProfile(explicitProfile);
  const estimatedTime = estimateRenderTime(estimated_duration_seconds, renderProfile);
  
  logger.info('Render configuration', {
    projectId: project_id,
    profile: rendme,
    resolution: `${renderProfile.resolution.width}x${renderProfile.resolution.height}`,
    fps: renderProfile.fps,
    estimatedRenderTime: `${estimatedTime.toFixed(1)}s`,
    segments: script.length,
    shortsHooks: shorts.hooks.length
  });
  
  // 创建输出目录
  await mkdir(outputDir, { recursive: true });
  
  // ============================================
  // Step 3: 合成音频
  // ============================================
  logger.info('Synthesizing audio', { projectId: project_id   
  const ttsClient = new TTSClient();
  const audioSegments: Array<{ path: string; segment: typeof script[0] }> = [];
  
  for (let i = 0; i < script.length; i++) {
    const segment = script[i];
    const voice = media_preference.voice || {
      provider: 'google_tts',
      voice_id: 'en-US-Neural2-D',
      style: 'narrative',
      language: seo.primary_language
    };
    
    const result = await ttsClient.synthesize(
      segment.voiceover,
      voice,
      { outputDir, projectId: project_id, segmentIndex: i }
    );
    
    audioSegments.push({ path: result.audioPath, segment });
  }
  
  // 合并音频
  const mergedAudioPath = join(outputDir, `${project_id}_audio.mp3`);
  await mergeAudioFiles(audioSegments.map(s => s.path), mergedAudioPath);
  
  // ============================================
  // Step 4: 计算音频驱动时间线 (含 Pacing Gap)
  // ============================================
  let audioTimeline;
  if (!renderProfile.skipAudioSync) {
    logger.info('Calculating audieline with pacing', { projectId: project_id });
    audioTimeline = await calculateAudioDrivenTimeline(
      audioSegments,
      renderProfile.fps,
      project_id,
      manifest.content_engine
    );
    
    logger.info('Pacing stats', {
      projectId: project_id,
      totalGapTime: `${audioTimeline.pacingStats.totalGapSeconds.toFixed(2)}s`,
      averageGap: `${audioTimeline.pacingStats.averageGapSeconds.toFixed(2)}s`
    });
  }
  
  // ============================================
  // Step 5: æ¸»视频
  // ============================================
  logger.info('Rendering main video', { projectId: project_id });
  
  const bundleLocation = await bundle({
    entryPoint: join(__dirname, 'compositions/index.ts'),
    webpackOverride: (config) => config
  });
  
  const theme = selectTheme(media_preference);
  
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'MainVideo',
    inputProps: {
      script,
      mediaPreference: media_preference,
      audioPatgedAudioPath,
      audioTimeline,
      chapters: seo.chapters,
      seoTags: seo.tags,
      theme
    }
  });
  
  const mainVideoPath = join(outputDir, `${project_id}_main.mp4`);
  
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: renderProfile.codec,
    outputLocation: mainVideoPath,
    inputProps: {
      script,
      mediaPreference: media_preference,
      audioPath: mergedAudioPath,
      audioTimeline,
      chapters: seo.chapters,
      seoTags: seo.tags,
      theme
    },
    crf: renderProfile.crf,
    pixelFormat: renderProfile.pixelFormat,
    concurrency: renderProfile.concurrency
  });
  
  logger.info('Main video rendered', {
    projectId: project_id,
    path: mainVideoPath,
    duration: audioTimeline?.totalDurationSeconds || estimated_duration_seconds
  });
  
  // ============================================
  // Step 6: 提取 Shorts (如果不跳过)
  // ============================================
  let shortsOutputs: Array<{ hookIndex: number; oung }> = [];
  
  if (!renderProfile.skipShorts) {
    logger.info('Extracting Shorts with Safe Zone + Gravity', { projectId: project_id });
    
    const shortsExtractor = new ShortsExtractor();
    
    shortsOutputs = await shortsExtractor.extractAll(shorts, {
      mainVideoPath,
      outputDir,
      projectId: project_id,
      theme,
      debugSafeZone: debugSafeZone || false
    });
    
    logger.info('Shorts extracted', {
      projectId: project_id,
      count: shortsOutputs.length
    });
  }
  
  // ============================================
  // Step 7: 生成缩略图 (如果不跳过)
  // ============================================
  let thumbnailPath: string | undefined;
  
  if (!renderProfile.skipThumbnail) {
    logger.info('Generating thumbnail', { projectId: project_id });
    
    const thumbnailGenerator = new ThumbnailGenerator();
    thumbnailPath = await thumbnailGenerator.generate({
      title: seo.regional_seo[0].titles[0],
      theme,
      outputPath: join(outputDir, `oject_id}_thumbnail.png`),
      keywords: seo.tags.slice(0, 3),
      videoPath: mainVideoPath
    });
    
    logger.info('Thumbnail generated', { projectId: project_id, path: thumbnailPath });
  }
  
  // ============================================
  // Step 8: 更新 Manifest 并生成报告
  // ============================================
  const endTime = Date.now();
  const renderTimeSeconds = (endTime - startTime) / 1000;
  
  const updatedManifest: ProjectManifest = {
    ...manifest,
    status
    assets: {
      audio_url: mergedAudioPath,
      video_url: mainVideoPath,
      shorts_urls: shortsOutputs.map(s => s.outputPath),
      thumbnail_url: thumbnailPath
    },
    updated_at: new Date().toISOString()
  };
  
  await writeFile(
    join(outputDir, 'manifest.json'),
    JSON.stringify(updatedManifest, null, 2)
  );
  
  // 渲染报告
  const renderReport = {
    project_id,
    render_profile: renderProfile.name,
    resolution: renderProfile.resolution,
    fps: renderProfile.fps,
    ime_seconds: renderTimeSeconds,
    estimated_time_seconds: estimatedTime,
    efficiency: (estimatedTime / renderTimeSeconds).toFixed(2),
    pacing_stats: audioTimeline?.pacingStats,
    outputs: {
      main_video: mainVideoPath,
      shorts: shortsOutputs.length,
      thumbnail: thumbnailPath ? true : false
    },
    audio_segments: script.length,
    total_duration_seconds: audioTimeline?.totalDurationSeconds || estimated_duration_seconds
  };
  
  await writeFile(
    join(outputDir, 'render_report.json'),
    JSON.stringify(renderReport, null, 2)
  );
  
  logger.info('Rendering complete', {
    projectId: project_id,
    renderTime: `${renderTimeSeconds.toFixed(1)}s`,
    mainVideo: mainVideoPath,
    shorts: shortsOutputs.length,
    thumbnail: thumbnailPath
  });
  
  // ============================================
  // Step 9: 自动打开预览 (如果启用)
  // ============================================
  const shouldAutoPreview = explicitAutoPreview || renderProfile.autoPreview;
  if (shoutoPreview) {
    await autoOpenPreview(mainVideoPath);
  }
}

async function mergeAudioFiles(files: string[], outputPath: string): Promise<void> {
  const { execSync } = await import('child_process');
  
  const listContent = files.map(f => `file '${f}'`).join('\n');
  const listPath = outputPath.replace('.mp3', '_list.txt');
  
  await writeFile(listPath, listContent);
  
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`,
    { stdio: 'pipe' }
  );
}

main().catch((error) => {
  logger.error('Fatal error', { error: error.message });
  process.exit(1);
});
```

---

## 🐳 Docker Configuration

```dockerfile
# docker/Dockerfile

FROM node:20-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    ffmpeg \
    chromium \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    fonts-liberation \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libasound2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 设置环境变量
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV REMOTION_CHROME_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建
RUN npm run build

# 入口
ENTRYPOINT ["node", "dist/index.js"]
```

---

## ✅ Definition of Done (Ultimate Final)

### Core Rendering
- [ ] 能够解析 orchestrator 输出的 man
- [ ] 根据 media_preference 自动选择主题
- [ ] 所有 visual_hint 类型都有对应组件
- [ ] 5 级资产降级链确保渲染永不中断
- [ ] Audio-Driven Timeline + Pacing Gap 确保专业节奏

### Render Profiles
- [ ] draft 模式 < 30 秒完成 5 分钟视频
- [ ] preview 模式质量可接受
- [ ] production 模式输出专业品质
- [ ] 4k 模式支持高端输出
- [ ] Auto Preview 在 draft 模式自动打开

### Shorts
- [ ] 正确提取 hooks 指定的时间片段
- [ ] Safe Zone 保护 (top: 10%, bottom: 22%, right: 18%)
- [ ] Gravity Alignment 视觉平衡
- [ ] face_detection_hint 触发人脸追踪
- [ ] CTA 渲染在安全区内，含呼吸空间

### Visual Enhancements
- [ ] Chapter SEO Overlay 高对比度 (WCAG 7:1+)
- [ ] 三重索引验证通过
- [ ] Smart Subtitle 词级高亮 + Dynamic Scaling (1.2x)
- [ ] Emotional Transitions + Red Glitch 效果

### Pacing & Rhythm
- [ ] Content-aware gaps (tutorial: 0.5s, news: 0.3s)
- [ ] Chapter transition gaps (1.0s)
- [ ] Potion breathing room
- [ ] 节奏感专业，不赶不拖

### Output
- [ ] main_video.mp4 (16:9, 专业节奏)
- [ ] shorts_*.mp4 (9:16, Safe Zone + Gravity compliant)
- [ ] thumbnail.png (高对比度)
- [ ] manifest.json (更新后)
- [ ] render_report.json (含 pacing_stats)

---

## 🔗 Integration with Orchestrator

**通信协议：**
```
orchestrator                          video-renderer
     │                                      │
     │  1. manifest.json (status: rendering)│
     │ â────────────────────────────────>│
     │                                      │
     │                                      │ 2. 选择 RenderProfile
     │                                      │ 3. 计算 AudioTimeline + PacingGap
     │                                      │ 4. 渲染视频 + Shorts (Safe Zone + Gravity)
     │                                      │ 5. 生成高对比度缩略图
     │                          │
     │  6. manifest.json (status: uploading)│
     │ <────────────────────────────────────│
     │    + assets.video_url                │
     │    + assets.shorts_urls              │
     │    + assets.thumbnail_url            │
     │    + render_report.json              │
     │                                      │
```

---

## 🎯 最终检查清单 (发布前)

### 节奏专业化
-  Pacing Gap 平均 0.3-0.5 秒？
- [ ] 章节切换间隙 1 秒？
- [ ] 无"赶"的感觉？

### Shorts 转化率
- [ ] CTA 未被 UI 遮挡？
- [ ] Gravity Alignment 生效？
- [ ] 启用 --debug-safe-zone 验证？
- [ ] 情绪 Glitch 效果触发？

### SEO 视觉化
- [ ] 章节关键词对比度 ≥ 7:1？
- [ ] 关键词与 established_trends 一致？
- [ ] Smart Subtitle 强调词使用 accent 颜色？

### 开发效率
- [ ] draft 渲染 < 30 秒？
- [ ] 自动预览工作正常？
- [ ] render_report 包含 pacingStats？

---

## 🎙️ NotebookLM Audio Support (Jan 2026)

### Overview

Video-renderer now supports **audio-driven video rendering** with NotebookLM-generated audio files. The system dynamically calculates video duration based on the audio file's length, enabling perfect audio-visual synchronization.

### Architecture

```
orchestrator                              video-renderer
     │                                          │
     │  1. Generate scripts (EN/ZH)             │
     │  2. Set status: pending_audio            │
     │                                          │
     │  [User creates audio via NotebookLM]     │
     │                                          │
     │  3. Heartbeat detects audio files        │
     │  4. Validate audio (ffprobe)             │
     │  5. Update manifest: audio_status=ready  │
     │  6. Set status: rendering                │
     │                                          │
     │  manifest.json + audio files             │
     │ ──────────────────────────────────────> │
     │                                          │
     │                                          │ 7. Read audio duration
     │                                          │ 8. Calculate durationInFrames
     │                                          │ 9. Render with Remotion
     │                                          │
     │  render_report.json + video.mp4          │
     │ <────────────────────────────────────── │
```

### CLI Usage

```bash
# Render with language-specific audio
node render.mjs --manifest=/path/to/manifest.json --lang=en

# With render profile
node render.mjs --manifest=/path/to/manifest.json --lang=zh --profile=production

# Available options
--manifest   Path to manifest.json (required)
--lang       Language code: en | zh (required for audio-driven render)
--profile    Render quality: draft | preview | production (default: preview)
--output     Output directory (default: ./output/{projectId}/{lang}/)
```

### Audio File Structure

```
active_projects/{projectId}/
├── manifest.json
└── audio/
    ├── en/
    │   └── audio.mp3    # English NotebookLM audio
    └── zh/
        └── audio.mp3    # Chinese NotebookLM audio
```

### Audio Validation (ffprobe)

Video-renderer validates audio files using `ffprobe` (Node.js compatible, not browser-only Remotion APIs):

```javascript
// Audio validation extracts:
{
  duration: 30.040816,      // seconds
  codec: "mp3",             // codec_name
  sampleRate: 44100,        // Hz
  bitrate: 64               // kbps
}

// Validation checks:
// - Duration: 5-600 seconds (sanity check)
// - Codec: mp3, aac, opus, wav, flac (supported formats)
// - Sample rate: 22050-96000 Hz
```

### Duration Calculation

```javascript
// Video duration = audio duration + buffer frames
const audioDuration = validateAudioFile(audioPath).duration;  // e.g., 30.04s
const fps = 30;
const bufferFrames = 60;  // 2 seconds buffer (fade in/out)

const durationInFrames = Math.ceil(audioDuration * fps) + bufferFrames;
// Example: ceil(30.04 * 30) + 60 = 902 + 60 = 962 frames
```

### Manifest Audio Schema

```json
{
  "audio": {
    "source": "notebooklm",
    "languages": {
      "en": {
        "audio_status": "ready",
        "duration_seconds": 30.040816,
        "audio_path": "audio/en/audio.mp3"
      },
      "zh": {
        "audio_status": "ready",
        "duration_seconds": 45.035102,
        "audio_path": "audio/zh/audio.mp3"
      }
    }
  }
}
```

### Render Report Output

```json
{
  "projectId": "cc13c849-962a-430a-aa9c-a28055a82dd5",
  "language": "en",
  "audioDuration": 30.040816,
  "videoDuration": 32.066666,
  "composition": {
    "durationInFrames": 962,
    "fps": 30
  },
  "audioValidation": {
    "codec": "mp3",
    "sampleRate": 44100,
    "bitrate": 64
  }
}
```

### Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `Audio file not found` | Missing audio file | Check audio path in manifest |
| `Audio duration invalid` | ffprobe parse failure | Verify audio file integrity |
| `Duration out of range` | < 5s or > 600s | Re-generate audio with proper length |
| `Unsupported codec` | Non-standard format | Convert to mp3/aac/opus |

### Integration Notes

1. **ffprobe Required**: Ensure `ffprobe` (part of FFmpeg) is installed on the system
2. **Audio-First Duration**: Video duration is ALWAYS derived from audio, never hardcoded
3. **Buffer Frames**: 60 frames (2s) added for fade transitions
4. **Glitch Protection**: First/last 30 frames protected from transitions

