import { registerRoot, Composition } from 'remotion';
import React from 'react';
import { MainVideo } from './MainVideo';
import { ShortsVideo } from './ShortsVideo';
import { Thumbnail } from './Thumbnail';

const defaultTheme = {
  name: 'Default',
  colors: {
    primary: '#000000',
    secondary: '#666666',
    background: '#ffffff',
    text: '#1a1a1a',
    accent: '#0066cc',
    muted: '#999999',
  },
  fonts: { heading: 'Inter', body: 'Inter', code: 'monospace' },
  animations: { enterDuration: 0.3, exitDuration: 0.2, easing: 'easeOut' },
  components: {
    codeBlockStyle: 'minimal' as const,
    diagramStyle: 'simple' as const,
    transitionType: 'fade' as const,
    subtitleStyle: 'highlight' as const,
  },
};

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={MainVideo as any}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          script: [],
          audioPath: '',
          chapters: '',
          seoTags: [],
          theme: defaultTheme,
        }}
      />
      <Composition
        id="ShortsVideo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={ShortsVideo as any}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          hook: {
            text: '',
            timestamp_start: '00:00',
            timestamp_end: '00:15',
            hook_type: 'quick_tip',
            emotional_trigger: 'curiosity',
            controversy_score: 0,
            predicted_engagement: {
              comments: 'medium',
              shares: 'medium',
              completion_rate: 'medium',
            },
          },
          audioPath: '',
          theme: defaultTheme,
        }}
      />
      <Composition
        id="Thumbnail"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={Thumbnail as any}
        durationInFrames={1}
        fps={1}
        width={1280}
        height={720}
        defaultProps={{
          title: '',
          keywords: [],
          theme: defaultTheme,
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
