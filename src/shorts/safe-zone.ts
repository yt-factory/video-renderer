import React from 'react';
import { AbsoluteFill } from 'remotion';

export interface SafeZone {
  top: number;    // percentage
  bottom: number;
  left: number;
  right: number;
}

export const YOUTUBE_SHORTS_SAFE_ZONE: SafeZone = {
  top: 10,
  bottom: 22,
  left: 5,
  right: 18,
};

export const TIKTOK_SAFE_ZONE: SafeZone = {
  top: 12,
  bottom: 20,
  left: 5,
  right: 15,
};

// Gravity Alignment

export type GravityDirection = 'up' | 'down' | 'left' | 'right' | 'center';

export interface GravityAlignment {
  direction: GravityDirection;
  offsetX: number;
  offsetY: number;
  breathingRoom: number;
}

export function calculateGravityAlignment(
  position: 'top' | 'bottom' | 'center',
  _safeZone: SafeZone = YOUTUBE_SHORTS_SAFE_ZONE
): GravityAlignment {
  switch (position) {
    case 'top':
      return { direction: 'down', offsetX: 0, offsetY: 20, breathingRoom: 15 };
    case 'bottom':
      return { direction: 'up', offsetX: 0, offsetY: -30, breathingRoom: 20 };
    case 'center':
      return { direction: 'left', offsetX: -20, offsetY: 0, breathingRoom: 10 };
    default:
      return { direction: 'center', offsetX: 0, offsetY: 0, breathingRoom: 0 };
  }
}

export function getSafeRenderArea(
  width: number,
  height: number,
  position: 'top' | 'bottom' | 'center',
  safeZone: SafeZone = YOUTUBE_SHORTS_SAFE_ZONE
): {
  x: number;
  y: number;
  width: number;
  height: number;
  gravity: GravityAlignment;
} {
  const gravity = calculateGravityAlignment(position, safeZone);

  const safeX = Math.ceil(width * (safeZone.left / 100)) + gravity.breathingRoom;
  const safeY = Math.ceil(height * (safeZone.top / 100)) + gravity.breathingRoom;
  const safeWidth =
    Math.floor(width * (1 - safeZone.left / 100 - safeZone.right / 100)) -
    gravity.breathingRoom * 2;
  const safeHeight =
    Math.floor(height * (1 - safeZone.top / 100 - safeZone.bottom / 100)) -
    gravity.breathingRoom * 2;

  return {
    x: safeX + gravity.offsetX,
    y: safeY + gravity.offsetY,
    width: safeWidth,
    height: safeHeight,
    gravity,
  };
}

export function isInSafeZone(
  elementRect: { x: number; y: number; width: number; height: number },
  containerSize: { width: number; height: number },
  safeZone: SafeZone = YOUTUBE_SHORTS_SAFE_ZONE
): boolean {
  const safe = getSafeRenderArea(containerSize.width, containerSize.height, 'center', safeZone);

  return (
    elementRect.x >= safe.x &&
    elementRect.y >= safe.y &&
    elementRect.x + elementRect.width <= safe.x + safe.width &&
    elementRect.y + elementRect.height <= safe.y + safe.height
  );
}

export function adjustToSafeZone(
  elementRect: { x: number; y: number; width: number; height: number },
  containerSize: { width: number; height: number },
  safeZone: SafeZone = YOUTUBE_SHORTS_SAFE_ZONE
): { x: number; y: number } {
  const safe = getSafeRenderArea(containerSize.width, containerSize.height, 'center', safeZone);

  let newX = elementRect.x;
  let newY = elementRect.y;

  if (newX < safe.x) newX = safe.x;
  if (newX + elementRect.width > safe.x + safe.width) {
    newX = safe.x + safe.width - elementRect.width;
  }
  if (newY < safe.y) newY = safe.y;
  if (newY + elementRect.height > safe.y + safe.height) {
    newY = safe.y + safe.height - elementRect.height;
  }

  return { x: newX, y: newY };
}

export const SafeZoneContainer: React.FC<{
  children: React.ReactNode;
  position: 'top' | 'bottom' | 'center';
  safeZone?: SafeZone;
  debug?: boolean;
}> = ({ children, position, safeZone = YOUTUBE_SHORTS_SAFE_ZONE, debug = false }) => {
  const gravity = calculateGravityAlignment(position, safeZone);

  const getPositionStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      left: `${safeZone.left}%`,
      right: `${safeZone.right}%`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: gravity.breathingRoom,
    };

    switch (position) {
      case 'top':
        return {
          ...base,
          top: `${safeZone.top}%`,
          paddingTop: gravity.breathingRoom + Math.abs(gravity.offsetY),
          alignItems: 'flex-start',
        };
      case 'bottom':
        return {
          ...base,
          bottom: `${safeZone.bottom}%`,
          paddingBottom: gravity.breathingRoom + Math.abs(gravity.offsetY),
          alignItems: 'flex-end',
        };
      case 'center':
      default:
        return {
          ...base,
          top: `${safeZone.top}%`,
          bottom: `${safeZone.bottom}%`,
          transform: `translateX(${gravity.offsetX}px)`,
        };
    }
  };

  return React.createElement(
    'div',
    { style: getPositionStyle() },
    children,
    debug &&
      React.createElement(
        'div',
        {
          style: {
            position: 'absolute',
            bottom: 5,
            right: 5,
            fontSize: 10,
            color: '#00ff00',
            background: 'rgba(0,0,0,0.7)',
            padding: '2px 6px',
            borderRadius: 3,
          },
        },
        `Gravity: ${gravity.direction} | Of: (${gravity.offsetX}, ${gravity.offsetY})`
      )
  );
};

export const SafeZoneOverlay: React.FC<{
  safeZone?: SafeZone;
  showLabels?: boolean;
  showGravityGuides?: boolean;
}> = ({
  safeZone = YOUTUBE_SHORTS_SAFE_ZONE,
  showLabels = true,
  showGravityGuides = true,
}) => {
  const topGravity = calculateGravityAlignment('top', safeZone);
  const bottomGravity = calculateGravityAlignment('bottom', safeZone);
  const centerGravity = calculateGravityAlignment('center', safeZone);

  return React.createElement(
    AbsoluteFill,
    { style: { pointerEvents: 'none' as const, zIndex: 9999 } },
    // Top unsafe zone
    React.createElement(
      'div',
      {
        style: {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          height: `${safeZone.top}%`,
          background: 'rgba(255, 0, 0, 0.25)',
          borderBottom: '2px dashed #ff0000',
        },
      },
      showLabels &&
        React.createElement(
          'span',
          { style: { color: '#ff0000', fontSize: 12, padding: 4 } },
          `TOP UNSAFE (${safeZone.top}%) - Status Bar`
        )
    ),
    // Bottom unsafe zone
    React.createElement(
      'div',
      {
        style: {
          position: 'absolute' as const,
          bottom: 0,
          left: 0,
          right: 0,
          height: `${safeZone.bottom}%`,
          background: 'rgba(255, 0, 0, 0.25)',
          borderTop: '2px dashed #ff0000',
        },
      },
      showLabels &&
        React.createElement(
          'span',
          {
            style: {
              color: '#ff0000',
              fontSize: 12,
              padding: 4,
              position: 'absolute' as const,
              top: 4,
            },
          },
          `BOTTOM UNSAFE (${safeZone.bottom}%) - Description, Music, Progress`
        )
    ),
    // Right unsafe zone
    React.createElement(
      'div',
      {
        style: {
          position: 'absolute' as const,
          top: `${safeZone.top}%`,
          right: 0,
          bottom: `${safeZone.bottom}%`,
          width: `${safeZone.right}%`,
          background: 'rgba(255, 0, 0, 0.25)',
          borderLeft: '2px dashed #ff0000',
        },
      },
      showLabels &&
        React.createElement(
          'span',
          {
            style: {
              color: '#ff0000',
              fontSize: 12,
              padding: 4,
              writingMode: 'vertical-rl' as const,
            },
          },
          'RIGHT UNSAFE - Like, Comment, Share'
        )
    ),
    // Safe zone border
    React.createElement(
      'div',
      {
        style: {
          position: 'absolute' as const,
          top: `${safeZone.top}%`,
          left: `${safeZone.left}%`,
          right: `${safeZone.right}%`,
          bottom: `${safeZone.bottom}%`,
          border: '2px solid #00ff00',
        },
      },
      showLabels &&
        React.createElement(
          'span',
          { style: { color: '#00ff00', fontSize: 14, padding: 8, fontWeight: 'bold' } },
          'SAFE ZONE'
        )
    ),
    // Gravity guides
    showGravityGuides &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          'div',
          {
            style: {
              position: 'absolute' as const,
              top: `${safeZone.top + 2}%`,
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#00ffff',
              fontSize: 16,
            },
          },
          `↓ Gravity (${topGravity.offsetY}px)`
        ),
        React.createElement(
          'div',
          {
            style: {
              position: 'absolute' as const,
              bottom: `${safeZone.bottom + 2}%`,
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#00ffff',
              fontSize: 16,
            },
          },
          `↑ Gravity (${bottomGravity.offsetY}px)`
        ),
        React.createElement(
          'div',
          {
            style: {
              position: 'absolute' as const,
              top: '50%',
              right: `${safeZone.right + 2}%`,
              transform: 'translateY(-50%)',
              color: '#00ffff',
              fontSize: 16,
            },
          },
          `← Gravity (${centerGravity.offsetX}px)`
        )
      )
  );
};
