import { ThemeConfig } from "./types";

// ---------------------------------------------------------------------------
// Theme definitions
// ---------------------------------------------------------------------------

const cyberpunk: ThemeConfig = {
  name: "cyberpunk",
  colors: {
    primary: "#00ffff",
    secondary: "#ff00ff",
    background: "#0a0a0f",
    text: "#ffffff",
    accent: "#ffff00",
    muted: "#666666",
  },
  fonts: {
    heading: "Orbitron",
    body: "Rajdhani",
    code: "Fira Code",
  },
  segmentStyles: {
    code_block: {
      background: "rgba(0, 255, 255, 0.05)",
      border: "1px solid rgba(0, 255, 255, 0.6)",
      accentColor: "#00ffff",
    },
    diagram: {
      background: "rgba(255, 0, 255, 0.05)",
      border: "1px solid rgba(255, 0, 255, 0.4)",
      accentColor: "#ff00ff",
    },
    text_animation: {
      background: "rgba(255, 255, 0, 0.04)",
      border: "1px solid rgba(255, 255, 0, 0.3)",
      accentColor: "#ffff00",
    },
    "b-roll": {
      background: "rgba(0, 255, 255, 0.03)",
      border: "1px solid rgba(0, 255, 255, 0.2)",
      accentColor: "#00ffff",
    },
    screen_recording: {
      background: "rgba(0, 255, 255, 0.06)",
      border: "1px solid rgba(0, 255, 255, 0.5)",
      accentColor: "#00ffff",
    },
    talking_head_placeholder: {
      background: "rgba(255, 0, 255, 0.04)",
      border: "1px solid rgba(255, 0, 255, 0.3)",
      accentColor: "#ff00ff",
    },
  },
};

const minimalist: ThemeConfig = {
  name: "minimalist",
  colors: {
    primary: "#111111",
    secondary: "#666666",
    background: "#fafafa",
    text: "#1a1a1a",
    accent: "#0066cc",
    muted: "#999999",
  },
  fonts: {
    heading: "Inter",
    body: "Inter",
    code: "JetBrains Mono",
  },
  segmentStyles: {
    code_block: {
      background: "#f5f5f5",
      border: "1px solid #e0e0e0",
      accentColor: "#0066cc",
    },
    diagram: {
      background: "#f9f9f9",
      border: "1px solid #e0e0e0",
      accentColor: "#111111",
    },
    text_animation: {
      background: "#ffffff",
      border: "1px solid #e8e8e8",
      accentColor: "#0066cc",
    },
    "b-roll": {
      background: "#fafafa",
      border: "1px solid #e0e0e0",
      accentColor: "#666666",
    },
    screen_recording: {
      background: "#f5f5f5",
      border: "1px solid #d8d8d8",
      accentColor: "#111111",
    },
    talking_head_placeholder: {
      background: "#f9f9f9",
      border: "1px solid #e0e0e0",
      accentColor: "#666666",
    },
  },
};

const darkMode: ThemeConfig = {
  name: "dark_mode",
  colors: {
    primary: "#6366f1",
    secondary: "#8b5cf6",
    background: "#18181b",
    text: "#fafafa",
    accent: "#22d3ee",
    muted: "#71717a",
  },
  fonts: {
    heading: "Plus Jakarta Sans",
    body: "Plus Jakarta Sans",
    code: "Fira Code",
  },
  segmentStyles: {
    code_block: {
      background: "rgba(99, 102, 241, 0.08)",
      border: "1px solid rgba(99, 102, 241, 0.3)",
      accentColor: "#6366f1",
    },
    diagram: {
      background: "rgba(139, 92, 246, 0.06)",
      border: "1px solid rgba(139, 92, 246, 0.25)",
      accentColor: "#8b5cf6",
    },
    text_animation: {
      background: "rgba(34, 211, 238, 0.05)",
      border: "1px solid rgba(34, 211, 238, 0.2)",
      accentColor: "#22d3ee",
    },
    "b-roll": {
      background: "rgba(99, 102, 241, 0.04)",
      border: "1px solid rgba(99, 102, 241, 0.15)",
      accentColor: "#6366f1",
    },
    screen_recording: {
      background: "rgba(99, 102, 241, 0.07)",
      border: "1px solid rgba(99, 102, 241, 0.25)",
      accentColor: "#22d3ee",
    },
    talking_head_placeholder: {
      background: "rgba(139, 92, 246, 0.05)",
      border: "1px solid rgba(139, 92, 246, 0.2)",
      accentColor: "#8b5cf6",
    },
  },
};

const whiteboard: ThemeConfig = {
  name: "whiteboard",
  colors: {
    primary: "#2563eb",
    secondary: "#dc2626",
    background: "#fefefe",
    text: "#1e293b",
    accent: "#16a34a",
    muted: "#94a3b8",
  },
  fonts: {
    heading: "Caveat",
    body: "Nunito",
    code: "Source Code Pro",
  },
  segmentStyles: {
    code_block: {
      background: "#fff8f0",
      border: "2px dashed #2563eb",
      accentColor: "#2563eb",
    },
    diagram: {
      background: "#f0fdf4",
      border: "2px dashed #16a34a",
      accentColor: "#16a34a",
    },
    text_animation: {
      background: "#fefefe",
      border: "2px dashed #dc2626",
      accentColor: "#dc2626",
    },
    "b-roll": {
      background: "#fefce8",
      border: "2px dashed #94a3b8",
      accentColor: "#94a3b8",
    },
    screen_recording: {
      background: "#f0f9ff",
      border: "2px dashed #2563eb",
      accentColor: "#2563eb",
    },
    talking_head_placeholder: {
      background: "#fdf2f8",
      border: "2px dashed #dc2626",
      accentColor: "#dc2626",
    },
  },
};

const corporate: ThemeConfig = {
  name: "corporate",
  colors: {
    primary: "#1e40af",
    secondary: "#374151",
    background: "#f8fafc",
    text: "#111827",
    accent: "#059669",
    muted: "#6b7280",
  },
  fonts: {
    heading: "Poppins",
    body: "Open Sans",
    code: "IBM Plex Mono",
  },
  segmentStyles: {
    code_block: {
      background: "#f1f5f9",
      border: "1px solid #cbd5e1",
      accentColor: "#1e40af",
    },
    diagram: {
      background: "#f8fafc",
      border: "1px solid #cbd5e1",
      accentColor: "#059669",
    },
    text_animation: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      accentColor: "#1e40af",
    },
    "b-roll": {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      accentColor: "#374151",
    },
    screen_recording: {
      background: "#f1f5f9",
      border: "1px solid #cbd5e1",
      accentColor: "#1e40af",
    },
    talking_head_placeholder: {
      background: "#f8fafc",
      border: "1px solid #d1d5db",
      accentColor: "#374151",
    },
  },
};

// ---------------------------------------------------------------------------
// Theme registry
// ---------------------------------------------------------------------------

const THEMES: Readonly<Record<string, ThemeConfig>> = {
  cyberpunk,
  minimalist,
  dark_mode: darkMode,
  whiteboard,
  corporate,
};

// ---------------------------------------------------------------------------
// Mood + contentType selection matrix
// ---------------------------------------------------------------------------

const THEME_MATRIX: Readonly<Record<string, Readonly<Record<string, string>>>> =
  {
    tutorial: {
      professional: "corporate",
      casual: "whiteboard",
      energetic: "cyberpunk",
      calm: "minimalist",
    },
    news: {
      professional: "corporate",
      casual: "dark_mode",
      energetic: "corporate",
      calm: "dark_mode",
    },
    analysis: {
      professional: "corporate",
      casual: "dark_mode",
      energetic: "dark_mode",
      calm: "corporate",
    },
    entertainment: {
      professional: "cyberpunk",
      casual: "cyberpunk",
      energetic: "cyberpunk",
      calm: "cyberpunk",
    },
  };

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Select a theme based on mood, contentType, and an optional explicit
 * theme name.
 *
 * Priority:
 *  1. If `themeSuggestion` is a valid theme name, use it directly.
 *  2. Otherwise, consult the mood+contentType matrix.
 *  3. Fall back to `minimalist` when no match is found.
 */
export function selectTheme(
  mood: string,
  contentType: string,
  themeSuggestion?: string
): ThemeConfig {
  // Explicit suggestion takes precedence
  if (themeSuggestion !== undefined && THEMES[themeSuggestion] !== undefined) {
    return THEMES[themeSuggestion];
  }

  // Matrix lookup
  const themeName =
    THEME_MATRIX[contentType]?.[mood] ?? THEME_MATRIX[mood]?.[contentType];

  if (themeName !== undefined && THEMES[themeName] !== undefined) {
    return THEMES[themeName];
  }

  // Default fallback
  return THEMES.minimalist;
}

/**
 * Retrieve a single theme by its registered name.
 * Returns `undefined` when the name is not recognised.
 */
export function getTheme(name: string): ThemeConfig | undefined {
  return THEMES[name];
}

/**
 * Return the list of all registered theme names.
 */
export function getAllThemeNames(): string[] {
  return Object.keys(THEMES);
}

export type { ThemeConfig, SegmentStyle } from "./types";
