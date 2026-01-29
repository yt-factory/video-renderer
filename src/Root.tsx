import React from "react";
import { Composition } from "remotion";
import { MainVideo, MainVideoProps } from "./compositions/MainVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={MainVideo}
        durationInFrames={30 * 120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          manifest: null,
          renderMeta: null,
        } as MainVideoProps}
      />
      <Composition
        id="ShortsVideo"
        component={MainVideo}
        durationInFrames={30 * 60}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          manifest: null,
          renderMeta: null,
        } as MainVideoProps}
      />
    </>
  );
};
