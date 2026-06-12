import { CSSProperties, useEffect, useRef, useState } from "react";
import { extend } from "@pixi/react";
import { Container, Graphics, Sprite, AnimatedSprite } from "pixi.js";
import { listen } from "@tauri-apps/api/event";
import FieldCanvas from "./FieldCanvas";
extend({
  Container,
  Graphics,
  Sprite,
  AnimatedSprite,
});

const Field = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isWindowSetting, setIsWindowSetting] = useState(false);

  useEffect(() => {
    const unlistenSettingSignalPromise = listen<{ isWindowSetting: boolean }>("WindowSetting-signal", (event) => {
      setIsWindowSetting(event.payload.isWindowSetting);
    });

    return () => {
      unlistenSettingSignalPromise.then((unlisten) => unlisten());
    };
  }, []);

  return (
    <main ref={parentRef} style={containerStyleObj}>
      <FieldCanvas parentRef={parentRef} />
      {isWindowSetting && (
        <div style={settingFrameStyleObj} data-tauri-drag-region data-tauri-drag-resize-region>
          <div style={movingIconStyleObj}>✥</div>
        </div>
      )}
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
