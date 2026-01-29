import React from "react";
import { Composition } from "remotion";
import { MainVideo, MainVideoProps } from "./compositions/MainVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={MainVideo as any}
        durationInFrames={30 * 120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          manifest: null,
          renderMeta: null,
        } satisfies MainVideoProps}
      />
      <Composition
        id="ShortsVideo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={MainVideo as any}
        durationInFrames={30 * 60}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          manifest: null,
          renderMeta: null,
        } satisfies MainVideoProps}
      />
    </>
  );
};
