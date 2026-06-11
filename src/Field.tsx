import { CSSProperties, useEffect, useRef, useState } from "react";
import { Application, extend } from "@pixi/react";
import walkImage from "./assets/Cat-1-Walk.png"; //https://luizmelo.itch.io/pet-cat-pack
import runImage from "./assets/Cat-1-Run.png"; //https://luizmelo.itch.io/pet-cat-pack
import { Assets, Container, Graphics, Rectangle, Sprite, Texture, AnimatedSprite } from "pixi.js";
import { listen } from "@tauri-apps/api/event";
extend({
  Container,
  Graphics,
  Sprite,
  AnimatedSprite,
});

const FRAME_WIDTH = 50;
const FRAME_HEIGHT = 50;
const TOTAL_FRAMES = 8;

const Field = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [walkFrames, setWalkFrames] = useState<Texture[]>([]);
  const [runFrames, setRunFrames] = useState<Texture[]>([]);
  const [isWindowSetting, setIsWindowSetting] = useState(false);

  useEffect(() => {
    const unlistenInputSignalPromise = listen("global-input", (event) => {
      console.log(event);
      setIsRunning((prev) => !prev);
    });

    const unlistenSettingSignalPromise = listen<{ isWindowSetting: boolean }>("WindowSetting-signal", (event) => {
      setIsWindowSetting(event.payload.isWindowSetting);
    });

    return () => {
      unlistenInputSignalPromise.then((unlisten) => unlisten());
      unlistenSettingSignalPromise.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    async function loadAllTextures() {
      const walkBaseTexture = await Assets.load<Texture>(walkImage);
      walkBaseTexture.source.scaleMode = "nearest"; // 도트 감성 유지
      const runBaseTexture = await Assets.load<Texture>(runImage);
      runBaseTexture.source.scaleMode = "nearest";

      const walkFrames: Texture[] = [];
      const runFrames: Texture[] = [];
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        walkFrames.push(
          new Texture({
            source: walkBaseTexture.source,
            frame: new Rectangle(i * FRAME_WIDTH, 0, FRAME_WIDTH, FRAME_HEIGHT),
          }),
        );

        runFrames.push(
          new Texture({
            source: runBaseTexture.source,
            frame: new Rectangle(i * FRAME_WIDTH, 0, FRAME_WIDTH, FRAME_HEIGHT),
          }),
        );
      }
      setWalkFrames(walkFrames);
      setRunFrames(runFrames);
    }
    loadAllTextures();
  }, []);

  const spriteRefCallback = (instance: AnimatedSprite) => {
    if (instance) {
      instance.play();
    }
  };

  return (
    <main ref={parentRef} style={containerStyleObj}>
      <Application resizeTo={parentRef} backgroundAlpha={0}>
        <pixiContainer>
          {(isRunning ? runFrames : walkFrames).length > 0 && (
            <pixiAnimatedSprite
              autoPlay={true}
              textures={isRunning ? runFrames : walkFrames}
              animationSpeed={0.15}
              scale={1}
              ref={spriteRefCallback}
            />
          )}
        </pixiContainer>
      </Application>
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
