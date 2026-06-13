import { CSSProperties, useEffect, useRef, useState } from "react";
import { extend } from "@pixi/react";
import { Container, Graphics, Sprite, Text, AnimatedSprite } from "pixi.js";
import { listen } from "@tauri-apps/api/event";
import FieldCanvas from "./_components/FieldCanvas";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import Score from "../../Score";
import useGameLoop from "../../hooks/useGameLoop";
import { EMIT_EVENT, RunnerStatsType } from "../../types/globalTypes";
import { useFieldStore } from "../../stores/fieldStore";

extend({
  Container,
  Graphics,
  Sprite,
  Text,
  AnimatedSprite,
});

const appWindow = getCurrentWebviewWindow(); //클릭 관통

//필드 윈도우 진입점
const Field = () => {
  useGameLoop();
  const parentRef = useRef<HTMLDivElement>(null);
  const [isWindowSetting, setIsWindowSetting] = useState(false); //필드 화면 설정

  useEffect(() => {
    const unlistenWindowSettingPromise = listen<{ isWindowSetting: boolean }>(
      EMIT_EVENT.UPDATE_WINDOW_SETTING,
      (event) => {
        setIsWindowSetting(event.payload.isWindowSetting);
      },
    );
    // App에서 변경한 러너 정보를 적용
    const unlistenUpdateRunnerPromise = listen(EMIT_EVENT.UPDATE_RUNNER, (event: { payload: RunnerStatsType }) => {
      useFieldStore.getState().initRunnerState(event.payload);
    });

    return () => {
      unlistenWindowSettingPromise.then((unlisten) => unlisten());
      unlistenUpdateRunnerPromise.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    appWindow.setIgnoreCursorEvents(!isWindowSetting);
  }, [isWindowSetting]);

  return (
    <main ref={parentRef} style={containerStyleObj}>
      <FieldCanvas parentRef={parentRef} />
      {isWindowSetting && (
        <div style={settingFrameStyleObj} data-tauri-drag-region data-tauri-drag-resize-region>
          <div style={movingIconStyleObj}>✥</div>
        </div>
      )}
      <Score />
    </main>
  );
};

export default Field;

const settingFrameStyleObj: CSSProperties = {
  width: "100vw",
  height: "100vh",
  position: "fixed",
  display: "flex",
  alignItems: "center",
  justifyItems: "center",
  cursor: "move",
  border: "5px solid black",
};

const movingIconStyleObj: CSSProperties = {
  height: "100%",
  position: "relative",
  backgroundColor: "black",
  color: "white",
  pointerEvents: "none",
};

const containerStyleObj: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  width: "100vw",
  height: "100vh",
};
