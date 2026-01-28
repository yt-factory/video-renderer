/**
 * Calculate relative luminance per WCAG spec.
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function calculateContrastRatio(foreground: string, background: string): number {
  const l1 = getRelativeLuminance(foreground);
  const l2 = getRelativeLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function ensureContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): {
  passes: boolean;
  ratio: number;
  required: number;
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
      : `Increase contrast. Current: ${ratio.toFixed(2)}:1, Required: ${required}:1`,
  };
}

export function getHighContrastTextColor(background: string): string {
  const luminance = getRelativeLuminance(background);
  return luminance > 0.179 ? '#000000' : '#FFFFFF';
}

export function adjustForContrast(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): string {
  const currentRatio = calculateContrastRatio(foreground, background);

  if (currentRatio >= targetRatio) {
    return foreground;
  }

  const bgLuminance = getRelativeLuminance(background);
  return bgLuminance > 0.5 ? '#000000' : '#FFFFFF';
}
