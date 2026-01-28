import React from 'react';
import { AbsoluteFill, Audio, useVideoConfig } from 'remotion';
import { ShortsHook } from '../core/manifest-parser';
import { ThemeConfig } from '../templates';
import { CTAOverlay } from '../components/overlays/CTAOverlay';
import { SafeZoneOverlay } from '../shorts/safe-zone';

export interface ShortsVideoProps {
  hook: ShortsHook;
  audioPath: string;
  theme: ThemeConfig;
  debugSafeZone?: boolean;
}

export const ShortsVideo: React.FC<ShortsVideoProps> = ({
  hook,
  audioPath,
  theme,
  debugSafeZone = false,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.background }}>
      <Audio src={audioPath} />

      {/* Main content area */}
      <AbsoluteFill
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 48,
            fontWeight: 700,
            color: theme.colors.text,
            textAlign: 'center',
            padding: '0 10%',
          }}
        >
          {hook.text}
        </div>
      </AbsoluteFill>

      {/* CTA overlay */}
      <CTAOverlay hook={hook} theme={theme} position="bottom" respectSafeZone />

      {/* Debug safe zone overlay */}
      {debugSafeZone && <SafeZoneOverlay />}
    </AbsoluteFill>
  );
};
