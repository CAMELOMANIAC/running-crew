import { AnimatedSprite, Assets, Rectangle, Texture } from "pixi.js";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import walkImage from "./assets/Cat-1-Walk.png"; //https://luizmelo.itch.io/pet-cat-pack
import runImage from "./assets/Cat-1-Run.png"; //https://luizmelo.itch.io/pet-cat-pack
import { useTick } from "@pixi/react";
import { RunnerStateType } from "./types/globalTypes";

const FRAME_WIDTH = 50;
const FRAME_HEIGHT = 50;
const TOTAL_FRAMES = 8;

interface RunnerProps {
  number: number;
}
interface RunnerProps {
  number: number;
  runnerState: RunnerStateType;
}

const Runner = memo(({ number, runnerState }: RunnerProps) => {
  const [walkFrames, setWalkFrames] = useState<Texture[]>([]);
  const [runFrames, setRunFrames] = useState<Texture[]>([]);

  const spriteRef = useRef<AnimatedSprite | null>(null);
  const currentGraphicState = useRef<boolean>(false);

  useEffect(() => {
    async function loadAllTextures() {
      const walkBaseTexture = await Assets.load<Texture>(walkImage);
      walkBaseTexture.source.scaleMode = "nearest";
      const runBaseTexture = await Assets.load<Texture>(runImage);
      runBaseTexture.source.scaleMode = "nearest";

      const walk: Texture[] = [];
      const run: Texture[] = [];
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        walk.push(
          new Texture({
            source: walkBaseTexture.source,
            frame: new Rectangle(i * FRAME_WIDTH, 0, FRAME_WIDTH, FRAME_HEIGHT),
          }),
        );
        run.push(
          new Texture({
            source: runBaseTexture.source,
            frame: new Rectangle(i * FRAME_WIDTH, 0, FRAME_WIDTH, FRAME_HEIGHT),
          }),
        );
      }
      setWalkFrames(walk);
      setRunFrames(run);
    }
    loadAllTextures();
  }, []);

  useTick(() => {
    if (!spriteRef.current || walkFrames.length === 0 || runFrames.length === 0) return;

    const myIsRunning = runnerState[number]?.isRunning || false;

    if (myIsRunning !== currentGraphicState.current) {
      currentGraphicState.current = myIsRunning;

      spriteRef.current.textures = myIsRunning ? runFrames : walkFrames;
      spriteRef.current.play();
    }
  });

  const spriteRefCallback = useCallback((instance: AnimatedSprite | null) => {
    spriteRef.current = instance;
    if (instance) {
      instance.play();
    }
  }, []);

  const hasTextures = walkFrames.length > 0 && runFrames.length > 0;

  return (
    hasTextures && (
      <pixiContainer x={number * FRAME_WIDTH}>
        <pixiAnimatedSprite
          autoPlay={true}
          textures={walkFrames} // 초기 상태는 걷기로 시작
          animationSpeed={0.15}
          scale={1}
          ref={spriteRefCallback}
        />
      </pixiContainer>
    )
  );
});

export default Runner;
