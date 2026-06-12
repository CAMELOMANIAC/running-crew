import { CSSProperties, useEffect, useRef, useState } from "react";
import { extend } from "@pixi/react";
import { Container, Graphics, Sprite, AnimatedSprite } from "pixi.js";
import { listen } from "@tauri-apps/api/event";
import FieldCanvas from "./FieldCanvas";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import Score from "./Score";

extend({
  Container,
  Graphics,
  Sprite,
  AnimatedSprite,
});

const appWindow = getCurrentWebviewWindow(); //클릭 관통

const Field = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isWindowSetting, setIsWindowSetting] = useState(false); //필드 화면 설정

  useEffect(() => {
    const unlistenSettingSignalPromise = listen<{ isWindowSetting: boolean }>("WindowSetting-signal", (event) => {
      setIsWindowSetting(event.payload.isWindowSetting);
    });

    return () => {
      unlistenSettingSignalPromise.then((unlisten) => unlisten());
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
