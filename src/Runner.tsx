import { AnimatedSprite, Assets, Container, Rectangle, Texture } from "pixi.js";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import walkImage from "./assets/cats/Cat-1-Walk.png"; //https://luizmelo.itch.io/pet-cat-pack
import runImage from "./assets/cats/Cat-1-Run.png"; //https://luizmelo.itch.io/pet-cat-pack
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

  const containerRef = useRef<Container | null>(null);
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
    if (!containerRef.current) return;

    const myIsRunning = runnerState[number]?.isRunning || false;

    if (myIsRunning !== currentGraphicState.current) {
      currentGraphicState.current = myIsRunning;
      const nextTextures = myIsRunning ? runFrames : walkFrames;

      // 부모 컨테이너 내부의 모든 자식(스프라이트 5개)을 돌며 텍스처 교체 및 재생
      containerRef.current.children.forEach((child) => {
        const sprite = child as AnimatedSprite;
        sprite.textures = nextTextures;
        sprite.play();
      });
    }
  });

  // 부모 컨테이너 전용 리프레시 콜백
  const containerRefCallback = useCallback((instance: Container | null) => {
    containerRef.current = instance;
    if (instance) {
      instance.children.forEach((child) => (child as AnimatedSprite).play());
    }
  }, []);

  const hasTextures = walkFrames.length > 0 && runFrames.length > 0;

  return (
    hasTextures && (
      <pixiContainer x={number * FRAME_WIDTH} ref={containerRefCallback}>
        {/* 상하좌우 외곽선용 (Ref 없음) */}
        <pixiAnimatedSprite textures={walkFrames} tint={0x000000} x={-1} y={0} animationSpeed={0.15} />
        <pixiAnimatedSprite textures={walkFrames} tint={0x000000} x={1} y={0} animationSpeed={0.15} />
        <pixiAnimatedSprite textures={walkFrames} tint={0x000000} x={0} y={-1} animationSpeed={0.15} />
        <pixiAnimatedSprite textures={walkFrames} tint={0x000000} x={0} y={1} animationSpeed={0.15} />

        {/* 정중앙 원본 캐릭터 (Ref 없음) */}
        <pixiAnimatedSprite textures={walkFrames} x={0} y={0} animationSpeed={0.15} />
      </pixiContainer>
    )
  );
});

export default Runner;
