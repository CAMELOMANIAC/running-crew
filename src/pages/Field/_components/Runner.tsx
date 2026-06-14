import { AnimatedSprite, Assets, Container, Rectangle, Texture } from "pixi.js";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useApplication, useTick } from "@pixi/react";
import { RunnerStateType } from "../../../types/globalTypes";
import SpeechBubble from "./SpeechBubble";

import cat1Walk from "../../../assets/cats/Cat-1-Walk.png";
import cat1Run from "../../../assets/cats/Cat-1-Run.png";
import cat2Walk from "../../../assets/cats/Cat-2-Walk.png";
import cat2Run from "../../../assets/cats/Cat-2-Run.png";
import cat3Walk from "../../../assets/cats/Cat-3-Walk.png";
import cat3Run from "../../../assets/cats/Cat-3-Run.png";
import cat4Walk from "../../../assets/cats/Cat-4-Walk.png";
import cat4Run from "../../../assets/cats/Cat-4-Run.png";
import cat5Walk from "../../../assets/cats/Cat-5-Walk.png";
import cat5Run from "../../../assets/cats/Cat-5-Run.png";
import cat6Walk from "../../../assets/cats/Cat-6-Walk.png";
import cat6Run from "../../../assets/cats/Cat-6-Run.png";

// 어떤 스프라이트 값을 받느냐에 따라 매핑할 이미지 주소 맵
const CAT_ASSETS: Record<string, { walk: string; run: string }> = {
  runner1: { walk: cat1Walk, run: cat1Run },
  runner2: { walk: cat2Walk, run: cat2Run },
  runner3: { walk: cat3Walk, run: cat3Run },
  runner4: { walk: cat4Walk, run: cat4Run },
  runner5: { walk: cat5Walk, run: cat5Run },
  runner6: { walk: cat6Walk, run: cat6Run },
  // 기본값(fallback) 처리용 고양이 설정
  default: { walk: cat1Walk, run: cat1Run },
};

const FRAME_WIDTH = 50;
const FRAME_HEIGHT = 50;
const TOTAL_FRAMES = 8;

export interface RunnerProps {
  number: number;
  runnerState: RunnerStateType;
}

const Runner = memo(({ number, runnerState }: RunnerProps) => {
  const [walkFrames, setWalkFrames] = useState<Texture[]>([]);
  const [runFrames, setRunFrames] = useState<Texture[]>([]);

  const containerRef = useRef<Container | null>(null);
  const currentGraphicState = useRef<boolean>(false);
  const { app } = useApplication();

  if (!app || !app.screen) return null;

  const bottomY = Math.round(app.screen.height - FRAME_HEIGHT);

  useEffect(() => {
    async function loadAllTextures() {
      const runnerSprite = runnerState[number]?.runnerSprite || "default";
      const walkBaseTexture = await Assets.load<Texture>(CAT_ASSETS[runnerSprite].walk);
      walkBaseTexture.source.scaleMode = "nearest";
      const runBaseTexture = await Assets.load<Texture>(CAT_ASSETS[runnerSprite].run);
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

      // 안전하게 AnimatedSprite만 골라서 업데이트합니다.
      containerRef.current.children.forEach((child) => {
        if (child instanceof AnimatedSprite) {
          child.textures = nextTextures;
          child.play();
        }
      });
    }
  });

  // 부모 컨테이너 전용 리프레시 콜백
  const containerRefCallback = useCallback((instance: Container | null) => {
    containerRef.current = instance;
    if (instance) {
      // 자식들 중 오직 'AnimatedSprite' 인스턴스인 것만 필터링해서 play() 호출
      instance.children.forEach((child) => {
        if (child instanceof AnimatedSprite) {
          child.play();
        }
      });
    }
  }, []);

  const hasTextures = walkFrames.length > 0 && runFrames.length > 0;

  return (
    hasTextures && (
      <pixiContainer x={number * FRAME_WIDTH} y={bottomY} ref={containerRefCallback}>
        {/* 상하좌우 외곽선용 */}
        <pixiAnimatedSprite textures={walkFrames} tint={0x000000} x={-2} y={0} animationSpeed={0.15} />
        <pixiAnimatedSprite textures={walkFrames} tint={0x000000} x={2} y={0} animationSpeed={0.15} />
        <pixiAnimatedSprite textures={walkFrames} tint={0x000000} x={0} y={-2} animationSpeed={0.15} />
        <pixiAnimatedSprite textures={walkFrames} tint={0x000000} x={0} y={2} animationSpeed={0.15} />

        <pixiAnimatedSprite textures={walkFrames} tint={0x000000} x={-1} y={-1} animationSpeed={0.15} />
        <pixiAnimatedSprite textures={walkFrames} tint={0x000000} x={1} y={1} animationSpeed={0.15} />
        <pixiAnimatedSprite textures={walkFrames} tint={0x000000} x={1} y={-1} animationSpeed={0.15} />
        <pixiAnimatedSprite textures={walkFrames} tint={0x000000} x={-1} y={1} animationSpeed={0.15} />

        {/* 정중앙 원본 캐릭터 */}
        <pixiAnimatedSprite textures={walkFrames} x={0} y={0} animationSpeed={0.15} />
        <SpeechBubble number={number} runnerState={runnerState} />
      </pixiContainer>
    )
  );
});

export default Runner;
