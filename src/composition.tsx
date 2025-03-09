// import useStore from "@/pages/editor/store/use-store";
import { SequenceItem } from "./sequence-item";
import { ITransition, ITrackItemsMap } from "@designcombo/types";
import { dispatch, filter, subject } from "@designcombo/events";
import {
  EDIT_OBJECT,
  EDIT_TEMPLATE_ITEM,
  ENTER_EDIT_MODE,
} from "@designcombo/state";
import { useEffect, useState } from "react";
import { merge } from "lodash";
import { calculateTextHeight } from "./utils/text";
import { groupTrackItems } from "./utils/track-items";
// import { TransitionSeries } from "@remotion/transitions";
// import { populateTransitionIds } from "./utils/scene";
// import { TransitionSequenceItem } from "./transition-sequence-item";
// import { Transitions } from "./transitions";
import React from "react";

const Composition: React.FC<{ data: any }> = ({ data }) => {
  const [editableTextId, setEditableTextId] = useState<string | null>(null);

  const {
    trackItemIds,
    trackItemsMap,
    fps,
    trackItemDetailsMap,
    // sceneMoveableRef,
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

  const handleTextChange = (id: string, _: string) => {
    const elRef = document.querySelector(`.id-${id}`) as HTMLDivElement;
    const textDiv = elRef.firstElementChild?.firstElementChild
      ?.firstElementChild as HTMLDivElement;

    const {
      fontFamily,
      fontSize,
      fontWeight,
      letterSpacing,
      lineHeight,
      textShadow,
      webkitTextStroke,
    } = textDiv.style;
    const { width } = elRef.style;
    if (!elRef.innerText) return;
    const newHeight = calculateTextHeight({
      family: fontFamily,
      fontSize,
      fontWeight,
      letterSpacing,
      lineHeight,
      text: elRef.innerText!,
      textShadow: textShadow,
      webkitTextStroke,
      width,
      id: id,
    });
    elRef.style.height = `${newHeight}px`;
    // sceneMoveableRef?.current?.moveable.updateRect();
    // sceneMoveableRef?.current?.moveable.forceUpdate();
  };

  const onTextBlur = (id: string, _: string) => {
    const elRef = document.querySelector(`.id-${id}`) as HTMLDivElement;
    const textDiv = elRef.firstElementChild?.firstElementChild
      ?.firstElementChild as HTMLDivElement;
    const {
      fontFamily,
      fontSize,
      fontWeight,
      letterSpacing,
      lineHeight,
      textShadow,
      webkitTextStroke,
    } = textDiv.style;
    const { width } = elRef.style;
    if (!elRef.innerText) return;
    const newHeight = calculateTextHeight({
      family: fontFamily,
      fontSize,
      fontWeight,
      letterSpacing,
      lineHeight,
      text: elRef.innerText!,
      textShadow: textShadow,
      webkitTextStroke,
      width,
      id: id,
    });
    dispatch(EDIT_OBJECT, {
      payload: {
        [id]: {
          details: {
            height: newHeight,
          },
        },
      },
    });
  };

  //   handle track and track item events - updates
  useEffect(() => {
    const stateEvents = subject.pipe(
      filter(({ key }) => key.startsWith(ENTER_EDIT_MODE))
    );

    const subscription = stateEvents.subscribe((obj) => {
      if (obj.key === ENTER_EDIT_MODE) {
        if (editableTextId) {
          // get element by  data-text-id={id}
          const element = document.querySelector(
            `[data-text-id="${editableTextId}"]`
          );
          if (trackItemIds.includes(editableTextId)) {
            dispatch(EDIT_OBJECT, {
              payload: {
                [editableTextId]: {
                  details: {
                    text: element?.innerHTML || "",
                  },
                },
              },
            });
          } else {
            dispatch(EDIT_TEMPLATE_ITEM, {
              payload: {
                [editableTextId]: {
                  details: {
                    text: element?.textContent || "",
                  },
                },
              },
            });
          }
        }
        setEditableTextId(obj.value?.payload.id);
      }
    });
    return () => subscription.unsubscribe();
  }, [editableTextId]);

  return (
    <>
      {groupedItems.map((group) => {
        if (group.length === 1) {
          const item = mergedTrackItemsDeatilsMap[group[0].id];
          return SequenceItem[item.type](item, {
            fps,
            handleTextChange,
            onTextBlur,
            editableTextId,
          });
        }
        return null;
      })}
    </>
  );
};

export default Composition;
