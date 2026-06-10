import { CSSProperties, useEffect, useRef, useState } from "react";
import { Application, extend } from "@pixi/react";
import spriteImage from "./assets/Cat-1-Walk.png"; //https://luizmelo.itch.io/pet-cat-pack
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

listen("global-input", (event) => {
  console.log(event);
});

const Home = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [catFrames, setCatFrames] = useState<Texture[]>([]);

  useEffect(() => {
    async function loadCatTextures() {
      const baseTexture = await Assets.load<Texture>(spriteImage);
      baseTexture.source.scaleMode = "nearest"; // 도트 감성 유지

      const frames: Texture[] = [];
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        frames.push(
          new Texture({
            source: baseTexture.source,
            frame: new Rectangle(i * FRAME_WIDTH, 0, FRAME_WIDTH, FRAME_HEIGHT),
          }),
        );
      }
      setCatFrames(frames);
    }
    loadCatTextures();
  }, []);

  const spriteRefCallback = (instance: AnimatedSprite) => {
    if (instance) {
      instance.play();
    }
  };

  if (catFrames.length === 0) return null;
  return (
    <div ref={parentRef} style={{ width: "100vw", height: "100vh" }}>
      <Application resizeTo={parentRef} backgroundAlpha={0}>
        <pixiContainer x={50} y={50}>
          <pixiAnimatedSprite
            autoPlay={true}
            textures={catFrames}
            animationSpeed={0.15} // 재생 속도
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
