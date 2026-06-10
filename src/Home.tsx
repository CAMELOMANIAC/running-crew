import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
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

const Home = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [walkFrames, setWalkFrames] = useState<Texture[]>([]);
  const [runFrames, setRunFrames] = useState<Texture[]>([]);

  listen("global-input", (event) => {
    console.log(event);
    setIsRunning(true);
  });

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
    <div ref={parentRef} style={{ width: "100vw", height: "100vh" }}>
      <Application resizeTo={parentRef} backgroundAlpha={0}>
        <pixiContainer x={50} y={50}>
          <pixiAnimatedSprite
            autoPlay={true}
            textures={isRunning ? runFrames : walkFrames}
            animationSpeed={isRunning ? 0.15 : 0.3} // 재생 속도
            anchor={0.5}
            ref={spriteRefCallback}
          />
        </pixiContainer>
      </Application>
      <div style={styleObj} data-tauri-drag-region>
        hello
      </div>
    </div>
  );
};

export default Home;

const styleObj: CSSProperties = {
  backgroundColor: "black",
  width: "100%",
  height: "100%",
};
