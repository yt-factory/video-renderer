import React from "react";
import type { ThemeConfig } from "../../themes/types";
import { CodeBlockSegment } from "./CodeBlockSegment";
import { DiagramSegment } from "./DiagramSegment";
import { TextAnimationSegment } from "./TextAnimationSegment";
import { BRollSegment } from "./BRollSegment";
import { ScreenRecordingSegment } from "./ScreenRecordingSegment";
import { TalkingHeadSegment } from "./TalkingHeadSegment";

/**
 * Shared props interface for all segment components.
 */
export interface SegmentComponentProps {
  voiceover: string;
  theme: ThemeConfig;
  localFrame: number;
  segmentDuration: number;
  fps: number;
  emphasisWords?: string[];
}

/**
 * Mapping from visual_hint strings to segment components.
 */
const SEGMENT_COMPONENT_MAP: Record<string, React.FC<SegmentComponentProps>> = {
  code_block: CodeBlockSegment,
  diagram: DiagramSegment,
  text_animation: TextAnimationSegment,
  "b-roll": BRollSegment,
  b_roll: BRollSegment,
  screen_recording: ScreenRecordingSegment,
  talking_head_placeholder: TalkingHeadSegment,
  talking_head: TalkingHeadSegment,
};

/**
 * Resolve a visual_hint string to the corresponding segment component.
 * Falls back to TextAnimationSegment for unknown hint values.
 */
export function resolveSegmentComponent(
  visualHint: string
): React.FC<SegmentComponentProps> {
  const normalized = visualHint.toLowerCase().trim();
  return SEGMENT_COMPONENT_MAP[normalized] ?? TextAnimationSegment;
}

export { CodeBlockSegment } from "./CodeBlockSegment";
export { DiagramSegment } from "./DiagramSegment";
export { TextAnimationSegment } from "./TextAnimationSegment";
export { BRollSegment } from "./BRollSegment";
export { ScreenRecordingSegment } from "./ScreenRecordingSegment";
export { TalkingHeadSegment } from "./TalkingHeadSegment";

export type { CodeBlockSegmentProps } from "./CodeBlockSegment";
export type { DiagramSegmentProps } from "./DiagramSegment";
export type { TextAnimationSegmentProps } from "./TextAnimationSegment";
export type { BRollSegmentProps } from "./BRollSegment";
export type { ScreenRecordingSegmentProps } from "./ScreenRecordingSegment";
export type { TalkingHeadSegmentProps } from "./TalkingHeadSegment";
