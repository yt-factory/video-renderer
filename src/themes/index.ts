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
    primary: "#a78bfa",
    secondary: "#818cf8",
    background: "#1a1a2e",
    text: "#e2e8f0",
    accent: "#38bdf8",
    muted: "#64748b",
  },
  fonts: {
    heading: "Inter",
    body: "Inter",
    code: "JetBrains Mono",
  },
  segmentStyles: {
    code_block: {
      background: "rgba(167, 139, 250, 0.08)",
      border: "1px solid rgba(167, 139, 250, 0.3)",
      accentColor: "#a78bfa",
    },
    diagram: {
      background: "rgba(56, 189, 248, 0.06)",
      border: "1px solid rgba(56, 189, 248, 0.25)",
      accentColor: "#38bdf8",
    },
    text_animation: {
      background: "rgba(167, 139, 250, 0.05)",
      border: "1px solid rgba(167, 139, 250, 0.2)",
      accentColor: "#a78bfa",
    },
    "b-roll": {
      background: "rgba(129, 140, 248, 0.04)",
      border: "1px solid rgba(100, 116, 139, 0.2)",
      accentColor: "#818cf8",
    },
    screen_recording: {
      background: "rgba(167, 139, 250, 0.07)",
      border: "1px solid rgba(167, 139, 250, 0.25)",
      accentColor: "#a78bfa",
    },
    talking_head_placeholder: {
      background: "rgba(100, 116, 139, 0.06)",
      border: "1px solid rgba(100, 116, 139, 0.2)",
      accentColor: "#64748b",
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
    primary: "#3b82f6",
    secondary: "#64748b",
    background: "#0f172a",
    text: "#f1f5f9",
    accent: "#10b981",
    muted: "#94a3b8",
  },
  fonts: {
    heading: "Poppins",
    body: "Open Sans",
    code: "IBM Plex Mono",
  },
  segmentStyles: {
    code_block: {
      background: "rgba(59, 130, 246, 0.08)",
      border: "1px solid rgba(59, 130, 246, 0.3)",
      accentColor: "#3b82f6",
    },
    diagram: {
      background: "rgba(16, 185, 129, 0.06)",
      border: "1px solid rgba(16, 185, 129, 0.25)",
      accentColor: "#10b981",
    },
    text_animation: {
      background: "rgba(59, 130, 246, 0.05)",
      border: "1px solid rgba(59, 130, 246, 0.2)",
      accentColor: "#3b82f6",
    },
    "b-roll": {
      background: "rgba(59, 130, 246, 0.04)",
      border: "1px solid rgba(100, 116, 139, 0.2)",
      accentColor: "#64748b",
    },
    screen_recording: {
      background: "rgba(59, 130, 246, 0.07)",
      border: "1px solid rgba(59, 130, 246, 0.25)",
      accentColor: "#3b82f6",
    },
    talking_head_placeholder: {
      background: "rgba(100, 116, 139, 0.06)",
      border: "1px solid rgba(100, 116, 139, 0.2)",
      accentColor: "#94a3b8",
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
