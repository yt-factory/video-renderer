/**
 * Blend two hex colors by a ratio (0 = color1, 1 = color2).
 */
export function blendColors(color1: string, color2: string, ratio: number): string {
  const c1 = hexToRgbArray(color1);
  const c2 = hexToRgbArray(color2);
  if (!c1 || !c2) return color1;

  const r = Math.round(c1[0] + (c2[0] - c1[0]) * ratio);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * ratio);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * ratio);

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgbArray(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null;
}

/**
 * Lighten a color by a percentage (0-100).
 */
export function lighten(hex: string, percent: number): string {
  return blendColors(hex, '#FFFFFF', percent / 100);
}

/**
 * Darken a color by a percentage (0-100).
 */
export function darken(hex: string, percent: number): string {
  return blendColors(hex, '#000000', percent / 100);
}
