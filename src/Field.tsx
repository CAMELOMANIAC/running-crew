import { CSSProperties, useEffect, useRef, useState } from "react";
import { extend } from "@pixi/react";
import { Container, Graphics, Sprite, AnimatedSprite } from "pixi.js";
import { listen } from "@tauri-apps/api/event";
import FieldCanvas from "./FieldCanvas";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import Score from "./Score";
import { useGameStore } from "./stores/gameStore";
import useGameLoop from "./hooks/useGameLoop";

extend({
  Container,
  Graphics,
  Sprite,
  AnimatedSprite,
});

const appWindow = getCurrentWebviewWindow(); //클릭 관통

//필드 윈도우 진입점
const Field = () => {
  useGameLoop();
  const parentRef = useRef<HTMLDivElement>(null);
  const [isWindowSetting, setIsWindowSetting] = useState(false); //필드 화면 설정

  useEffect(() => {
    const unlistenSettingSignalPromise = listen<{ isWindowSetting: boolean }>("WindowSetting-signal", (event) => {
      setIsWindowSetting(event.payload.isWindowSetting);
    });
    // 메인 창(App.tsx)에서 업그레이드 등 설정 변경 시 서브 창의 스토어로 동기화
    const unlistenConfigPromise = listen("update-runner-config", (event: any) => {
      const { rawRunnerState, scores } = event.payload;
      const updatePayload: any = {};
      if (rawRunnerState) updatePayload.rawRunnerState = rawRunnerState;
      if (scores) updatePayload.scores = scores;
      useGameStore.setState(updatePayload);
    });

    return () => {
      unlistenSettingSignalPromise.then((unlisten) => unlisten());
      unlistenConfigPromise.then((unlisten) => unlisten());
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
