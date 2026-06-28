import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "../stores/appStore";
import { EMIT_EVENT } from "../types/globalTypes";

export const GlobalScoreListener = () => {
  useEffect(() => {
    const unlistenPromise = listen<number>(EMIT_EVENT.UPDATE_SCORE, (event) => {
      useAppStore.getState().setScore(event.payload);
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  return null;
};
