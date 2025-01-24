import React, { useEffect, useState } from "react";
import { Composition, Sequence, registerRoot } from "remotion";

import CoreComposition from "./composition";

import { CalculateMetadataFunction } from "remotion";
// import { data2 } from "./data";

const calculateMetadata: CalculateMetadataFunction<any> = ({
  props,
  defaultProps,
  abortSignal,
}) => {
  console.log("props- " + Object.entries(props.data));
  console.log("default props- " + defaultProps);
  return {
    // Change the metadata
    durationInFrames: props.data.durationInFrames,
    width: props.data.size.width,
    height: props.data.size.height,
    // or transform some props
    props: props,
    // or add per-composition default codec
    defaultCodec: "h264",
  };
};
const Root: React.FC<{ data?: any }> = ({ data }) => {
  // Use passed data or fallback to sample data
  const finalData = data || {
    id: "sample-video",
    fps: 30,
    tracks: [
      {
        id: "main-video-track",
        items: ["main-video-item"],
      },
    ],
    size: {
      width: 1080,
      height: 1920,
    },
    trackItemsMap: {
      "main-video-item": {
        type: "video",
        display: {
          from: 0,
          to: 14770, // Dynamic duration from input
        },
        details: {
          src: "https://dwq6jrynran28.cloudfront.net/uploads/d83c23f6-b0a7-45b6-80f7-1f6ca12434cd-output.mp4",
          width: 1080,
          height: 1920,
          volume: 100,
        },
      },
    },
    duration: 35810.667,
  };

  const totalDurationFrames = Math.ceil(
    (finalData.duration / 1000) * finalData.fps
  );

  return (
    <Composition
      id="CoreComposition"
      component={CoreComposition}
      durationInFrames={totalDurationFrames}
      fps={finalData.fps}
      width={finalData.size.width}
      height={finalData.size.height}
      defaultProps={{
        data: finalData,
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};

registerRoot(Root);

export default Root;
