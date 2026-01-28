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

const THEMES: Record<string, ThemeConfig> = {
  cyberpunk: {
    name: 'Cyberpunk',
    colors: {
      primary: '#00ffff',
      secondary: '#ff00ff',
      background: '#0a0a0f',
      text: '#ffffff',
      accent: '#ffff00',
      muted: '#666666',
    },
    fonts: { heading: 'Orbitron', body: 'Rajdhani', code: 'Fira Code' },
    animations: { enterDuration: 0.5, exitDuration: 0.3, easing: 'easeInOut' },
    components: {
      codeBlockStyle: 'terminal',
      diagramStyle: 'flowchart',
      transitionType: 'morph',
      subtitleStyle: 'karaoke',
    },
  },
  minimalist: {
    name: 'Minimalist',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      background: '#ffffff',
      text: '#1a1a1a',
      accent: '#0066cc',
      muted: '#999999',
    },
    fonts: { heading: 'Inter', body: 'Inter', code: 'JetBrains Mono' },
    animations: { enterDuration: 0.3, exitDuration: 0.2, easing: 'easeOut' },
    components: {
      codeBlockStyle: 'minimal',
      diagramStyle: 'simple',
      transitionType: 'fade',
      subtitleStyle: 'highlight',
    },
  },
  dark_mode: {
    name: 'Dark Mode',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      background: '#18181b',
      text: '#fafafa',
      accent: '#22d3ee',
      muted: '#71717a',
    },
    fonts: { heading: 'Plus Jakarta Sans', body: 'Plus Jakarta Sans', code: 'Fira Code' },
    animations: { enterDuration: 0.4, exitDuration: 0.25, easing: 'easeInOut' },
    components: {
      codeBlockStyle: 'ide',
      diagramStyle: 'flowchart',
      transitionType: 'slide',
      subtitleStyle: 'scale',
    },
  },
  whiteboard: {
    name: 'Whiteboard',
    colors: {
      primary: '#2563eb',
      secondary: '#dc2626',
      background: '#fefefe',
      text: '#1e293b',
      accent: '#16a34a',
      muted: '#94a3b8',
    },
    fonts: { heading: 'Caveat', body: 'Nunito', code: 'Source Code Pro' },
    animations: { enterDuration: 0.6, exitDuration: 0.3, easing: 'easeOut' },
    components: {
      codeBlockStyle: 'minimal',
      diagramStyle: 'mindmap',
      transitionType: 'fade',
      subtitleStyle: 'bounce',
    },
  },
  corporate: {
    name: 'Corporate',
    colors: {
      primary: '#1e40af',
      secondary: '#374151',
      background: '#f8fafc',
      text: '#111827',
      accent: '#059669',
      muted: '#6b7280',
    },
    fonts: { heading: 'Poppins', body: 'Open Sans', code: 'IBM Plex Mono' },
    animations: { enterDuration: 0.35, exitDuration: 0.2, easing: 'easeInOut' },
    components: {
      codeBlockStyle: 'ide',
      diagramStyle: 'flowchart',
      transitionType: 'slide',
      subtitleStyle: 'highlight',
    },
  },
};

const THEME_MATRIX: Record<string, Record<string, string>> = {
  tutorial: {
    professional: 'corporate',
    casual: 'whiteboard',
    energetic: 'cyberpunk',
    calm: 'minimalist',
  },
  news: {
    professional: 'corporate',
    casual: 'dark_mode',
    energetic: 'cyberpunk',
    calm: 'minimalist',
  },
  analysis: {
    professional: 'corporate',
    casual: 'dark_mode',
    energetic: 'dark_mode',
    calm: 'minimalist',
  },
  entertainment: {
    professional: 'dark_mode',
    casual: 'cyberpunk',
    energetic: 'cyberpunk',
    calm: 'whiteboard',
  },
};

export function selectTheme(preference: MediaPreference): ThemeConfig {
  const { visual } = preference;

  if (visual.theme_suggestion && THEMES[visual.theme_suggestion]) {
    return THEMES[visual.theme_suggestion];
  }

  const themeName = THEME_MATRIX[visual.content_type]?.[visual.mood] || 'minimalist';
  return THEMES[themeName];
}

export function getAllThemes(): ThemeConfig[] {
  return Object.values(THEMES);
}

export function getTheme(name: string): ThemeConfig | undefined {
  return THEMES[name];
}
