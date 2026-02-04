import { z } from 'zod';

export const ScriptSegmentSchema = z.object({
  timestamp: z.string().regex(/^\d{2}:\d{2}$/),
  voiceover: z.string().min(1),
  visual_hint: z.enum([
    'code_block',
    'diagram',
    'text_animation',
    'b-roll',
    'screen_recording',
    'talking_head_placeholder',
  ]),
  estimated_duration_seconds: z.number().positive(),
  asset_url: z.string().url().optional(),
  emphasis_words: z.array(z.string()).optional(),
  emotional_trigger: z.enum(['anger', 'awe', 'curiosity', 'fomo', 'validation']).optional(),
});

export const VoicePersonaSchema = z.object({
  provider: z.enum(['elevenlabs', 'google_tts', 'azure']),
  voice_id: z.string(),
  style: z.enum(['narrative', 'energetic', 'calm', 'professional']),
  language: z.enum(['en', 'zh', 'ja', 'es', 'de']),
});

export const VisualPreferenceSchema = z.object({
  mood: z.enum(['professional', 'casual', 'energetic', 'calm']),
  content_type: z.enum(['tutorial', 'news', 'analysis', 'entertainment']),
  theme_suggestion: z
    .enum(['cyberpunk', 'minimalist', 'dark_mode', 'whiteboard', 'corporate'])
    .optional(),
});

export const MediaPreferenceSchema = z.object({
  visual: VisualPreferenceSchema,
  voice: VoicePersonaSchema.optional(),
});

export const EmotionalTriggerSchema = z.enum([
  'anger',
  'awe',
  'curiosity',
  'fomo',
  'validation',
]);

export const ShortsHookSchema = z.object({
  text: z.string().max(50),
  timestamp_start: z.string(),
  timestamp_end: z.string(),
  hook_type: z.enum(['counter_intuitive', 'number_shock', 'controversy', 'quick_tip']),
  emotional_trigger: EmotionalTriggerSchema,
  controversy_score: z.number().min(0).max(10),
  predicted_engagement: z.object({
    comments: z.enum(['low', 'medium', 'high']),
    shares: z.enum(['low', 'medium', 'high']),
    completion_rate: z.enum(['low', 'medium', 'high']),
  }),
  injected_cta: z.string().max(30).optional(),
});

export const ShortsExtractionSchema = z.object({
  hooks: z.array(ShortsHookSchema).min(1).max(5),
  vertical_crop_focus: z.enum(['center', 'left', 'right', 'speaker', 'dynamic']),
  recommended_music_mood: z.enum(['upbeat', 'dramatic', 'chill', 'none']).optional(),
  face_detection_hint: z.boolean().default(false),
});

// ============================================
// Monetization Schema (synced with orchestrator)
// ============================================

export const AdSuitabilityLevelSchema = z.enum([
  'full_monetization',      // Green: All ads allowed
  'limited_monetization',   // Yellow: Some ads limited
  'no_monetization',        // Red: No ads
  'manual_review',          // Under review
]);

export const MonetizationInfoSchema = z.object({
  /** Ad suitability score (0-100, higher = more ad-friendly) */
  ad_suitability_score: z.number().min(0).max(100),
  /** Ad suitability level determined by content analysis */
  ad_suitability_level: AdSuitabilityLevelSchema,
  /** Estimated CPM range [min, max] in USD */
  estimated_cpm_range: z.tuple([z.number().nonnegative(), z.number().nonnegative()]),
  /** Regions where monetization is safe */
  safe_regions: z.array(z.string()),
  /** Regions where content may be blocked/demonetized */
  blocked_regions: z.array(z.string()),
  /** Content flags that may affect monetization */
  content_flags: z.array(z.string()).optional(),
  /** Recommended ad categories for targeting */
  recommended_ad_categories: z.array(z.string()).optional(),
  /** Brand safety score (0-100) */
  brand_safety_score: z.number().min(0).max(100).optional(),
});

export const SEODataSchema = z.object({
  primary_language: z.enum(['en', 'zh']),
  tags: z.array(z.string()).max(30),
  chapters: z.string(),
  regional_seo: z
    .array(
      z.object({
        language: z.enum(['en', 'zh', 'es', 'ja', 'de']),
        titles: z.array(z.string()).length(5),
        description: z.string().max(5000),
        cultural_hooks: z.array(z.string()).max(3),
        contains_established_trend: z.boolean(),
      })
    )
    .min(2),
  faq_structured_data: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string().max(200),
        related_entities: z.array(z.string()).max(3),
      })
    )
    .max(5),
  entities: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(['tool', 'concept', 'person', 'company', 'technology']),
        description: z.string().max(100).optional(),
        wiki_link: z.string().url().optional(),
      })
    )
    .max(10),
  injected_trends: z.array(z.any()).optional(),
  trend_coverage_score: z.number().min(0).max(100),
});

export const ContentEngineSchema = z.object({
  script: z.array(ScriptSegmentSchema),
  seo: SEODataSchema,
  shorts: ShortsExtractionSchema,
  estimated_duration_seconds: z.number().positive(),
  media_preference: MediaPreferenceSchema,
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
    estimated_reading_time_minutes: z.number().positive(),
  }),
  content_engine: ContentEngineSchema,
  /** Monetization analysis from orchestrator (optional) */
  monetization: MonetizationInfoSchema.optional(),
  assets: z
    .object({
      audio_url: z.string().url().optional(),
      video_url: z.string().url().optional(),
      shorts_urls: z.array(z.string().url()).optional(),
      thumbnail_url: z.string().url().optional(),
    })
    .default({}),
  error: z.any().optional(),
  meta: z.any().default({}),
});

export type ProjectManifest = z.infer<typeof ProjectManifestSchema>;
export type ScriptSegment = z.infer<typeof ScriptSegmentSchema>;
export type ShortsHook = z.infer<typeof ShortsHookSchema>;
export type ShortsExtraction = z.infer<typeof ShortsExtractionSchema>;
export type MediaPreference = z.infer<typeof MediaPreferenceSchema>;
export type ContentEngine = z.infer<typeof ContentEngineSchema>;
export type EmotionalTrigger = z.infer<typeof EmotionalTriggerSchema>;
export type VoicePersona = z.infer<typeof VoicePersonaSchema>;
export type SEOData = z.infer<typeof SEODataSchema>;
export type MonetizationInfo = z.infer<typeof MonetizationInfoSchema>;
export type AdSuitabilityLevel = z.infer<typeof AdSuitabilityLevelSchema>;
