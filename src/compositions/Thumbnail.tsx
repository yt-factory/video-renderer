import React from 'react';
import { AbsoluteFill } from 'remotion';
import { ThemeConfig } from '../templates';

export interface ThumbnailProps {
  title: string;
  keywords: string[];
  theme: ThemeConfig;
}

export const Thumbnail: React.FC<ThumbnailProps> = ({ title, keywords, theme }) => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.primary}30 100%)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: 72,
          fontWeight: 900,
          color: theme.colors.text,
          textAlign: 'center',
          textShadow: '3px 3px 0 rgba(0,0,0,0.3)',
          maxWidth: '90%',
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 30,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {keywords.map((kw, i) => (
          <span
            key={i}
            style={{
              fontFamily: theme.fonts.body,
              fontSize: 24,
              fontWeight: 600,
              color: theme.colors.primary,
              background: `${theme.colors.primary}20`,
              padding: '6px 16px',
              borderRadius: 20,
            }}
          >
            {kw}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
