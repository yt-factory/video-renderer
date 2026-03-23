export interface SegmentStyle {
  background: string;
  border: string;
  accentColor: string;
}

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
  segmentStyles: Record<string, SegmentStyle>;
}
