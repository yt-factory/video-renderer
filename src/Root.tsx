import React from "react";
import { Composition } from "remotion";
import { MainVideo, MainVideoProps } from "./compositions/MainVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Main Video - 16:9 Landscape (YouTube) */}
      <Composition
        id="MainVideo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={MainVideo as any}
        durationInFrames={30 * 60 * 15} // Default 15 minutes, will be overridden by render.mjs
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          manifest: null,
          renderMeta: null,
          lang: "en",
          audioFile: "",
        } satisfies MainVideoProps}
      />

      {/* Shorts Video - 9:16 Portrait (YouTube Shorts, TikTok, Reels) */}
      <Composition
        id="ShortsVideo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={MainVideo as any}
        durationInFrames={30 * 60} // Default 60 seconds
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          manifest: null,
          renderMeta: null,
          lang: "en",
          audioFile: "",
        } satisfies MainVideoProps}
      />
    </>
  );
};
