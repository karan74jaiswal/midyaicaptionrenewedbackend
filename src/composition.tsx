// import useStore from "@/pages/editor/store/use-store";
import { SequenceItem } from "./sequence-item";
import { ITransition, ITrackItemsMap } from "@designcombo/types";
import { useEffect, useState } from "react";
import { merge } from "lodash";
import { groupTrackItems } from "./utils/track-items";
import { TransitionSeries } from "@remotion/transitions";
import { populateTransitionIds } from "./utils/scene";
import { TransitionSequenceItem } from "./transition-sequence-item";
import { Transitions } from "./transitions";
import React from "react";

const Composition: React.FC<{ data: any }> = ({ data }) => {
  const [editableTextId, setEditableTextId] = useState<string | null>(null);

  const {
    trackItemIds,
    trackItemsMap,
    fps,
    trackItemDetailsMap,
    size,
    transitionsMap,
  } = data;
  console.log(data);
  const mergedTrackItemsDeatilsMap = merge(trackItemsMap, trackItemDetailsMap);

  const groupedItems = groupTrackItems({
    trackItemIds,
    transitionsMap,
    trackItemsMap: mergedTrackItemsDeatilsMap,
  });

  const handleTextChange = (id: string, newContent: string) => {
    console.warn("handleTextChange", id, newContent);
  };

  return (
    <>
      {groupedItems.map((group, index) => {
        if (group.length === 1) {
          const item = mergedTrackItemsDeatilsMap[group[0]];
          return SequenceItem[item.type](item, {
            fps,
            handleTextChange,
            editableTextId,
          });
        }
        const firstTrackItem = mergedTrackItemsDeatilsMap[group[0]];
        const from = (firstTrackItem.display.from / 1000) * fps;
        return (
          <TransitionSeries from={from} key={index}>
            {populateTransitionIds(group).map((id, index) => {
              if (index % 2 === 0) {
                const item = mergedTrackItemsDeatilsMap[id];
                const containTransition: any = Object.values(
                  transitionsMap
                ).find((t: any) => t.toId === id && true);
                return TransitionSequenceItem[item.type](item, {
                  fps,
                  handleTextChange,
                  containTransition,
                });
              } else {
                const transition: ITransition = transitionsMap[id];
                const durationInFrames =
                  ((transition.duration / 1000) * fps) / 2;
                return Transitions[transition.kind]({
                  durationInFrames,
                  ...size,
                  id: id,
                  direction: transition.direction,
                });
              }
            })}
          </TransitionSeries>
        );
      })}
    </>
  );
};

export default Composition;
