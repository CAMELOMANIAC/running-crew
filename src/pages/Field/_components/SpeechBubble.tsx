import { Assets, Container, Rectangle, TextStyle, Texture } from "pixi.js";
import speechBubble from "../../../assets/SpeechBubble1.png";
import { useEffect, useRef, useState } from "react";
import { RunnerProps } from "./Runner";
import { useTick } from "@pixi/react";

const SPRITE_WIDTH = 32;
const SPRITE_HEIGHT = 32;
// 애니메이션 설정 값 (원하는 속도에 맞춰 커스텀 가능)
const ANIMATION_SPEED = 0.2; // 값이 클수록 애니메이션이 빨라집니다 (0.1 ~ 0.3 추천)
const START_Y = 20; // 시작 위치 오프셋 (위쪽 방향 -15px에서 시작)
const TARGET_Y = 0; // 최종 목적지 오프셋 (캐릭터 머리 위 위치로 조정)

const SpeechBubble = ({ number, runnerState }: RunnerProps) => {
  const [croppedTexture, setCroppedTexture] = useState<Texture | null>(null);
  const containerRef = useRef<Container | null>(null);

  // 애니메이션 진행 상태를 보관할 내부 Ref
  const animationProgress = useRef<number>(0); // 0(숨김) ~ 1(완전 등장)

  useEffect(() => {
    Assets.load(speechBubble).then((originalTexture) => {
      if (!originalTexture) return;
      const textureSource = originalTexture.source;
      const frame = new Rectangle(0, 0, SPRITE_WIDTH, SPRITE_HEIGHT);
      const newTexture = new Texture({ source: textureSource, frame });
      setCroppedTexture(newTexture);
    });

    return () => {
      if (croppedTexture) croppedTexture.destroy();
    };
  }, []);

  // PixiJS 메인 루프에서 매 프레임 애니메이션 계산
  useTick((ticker) => {
    if (!containerRef.current) return;

    // 환경에 따라 ticker.deltaTime이 있으면 곱해주고, 없으면 기본값 1을 사용합니다.
    const delta = ticker?.deltaTime ?? 1;
    const isRunning = runnerState[number]?.isRunning || false;

    // 1. 목표 타겟 설정 (달리면 1로 증가, 멈추면 0으로 감소)
    const targetProgress = isRunning ? 1 : 0;

    // 2. 선형 보간(Linear Interpolation)을 이용해 현재 progress 값을 타겟 값으로 부드럽게 이동
    if (animationProgress.current !== targetProgress) {
      if (isRunning) {
        animationProgress.current += ANIMATION_SPEED * delta;
        if (animationProgress.current > 1) animationProgress.current = 1;
      } else {
        animationProgress.current -= ANIMATION_SPEED * delta;
        if (animationProgress.current < 0) animationProgress.current = 0;
      }
    }

    const t = animationProgress.current;

    // 3. 최적화: 완전히 사라진 상태(t === 0)일 때는 렌더링을 완전히 끕니다.
    if (t === 0) {
      containerRef.current.visible = false;
      return;
    } else {
      containerRef.current.visible = true;
    }

    // 4. 애니메이션 공식 대입
    // 알파(투명도): 0에서 1로 선형 증가
    containerRef.current.alpha = t;

    // Y 위치: START_Y(-15)에서 시작해서 TARGET_Y(-40)로 부드럽게 도달
    // (캐릭터 머리 위에 띄우기 위해 타겟 Y 좌표를 음수 수치로 조절해 주는 것이 좋습니다)
    containerRef.current.y = START_Y + (TARGET_Y - START_Y) * t;
  });

  if (!croppedTexture) return null;

  const inputCodeString = runnerState[number]?.inputCode[0].replace("Key", "") || "";

  return (
    // 초기 상태는 보이지 않도록 alpha=0, visible=false 처리
    <pixiContainer x={SPRITE_WIDTH} y={START_Y} alpha={0} visible={false} ref={containerRef}>
      {/* 외곽선 스프라이트 4개 */}
      <pixiSprite texture={croppedTexture} tint={0x000000} x={-2} y={0} anchor={0.5} />
      <pixiSprite texture={croppedTexture} tint={0x000000} x={2} y={0} anchor={0.5} />
      <pixiSprite texture={croppedTexture} tint={0x000000} x={0} y={-2} anchor={0.5} />
      <pixiSprite texture={croppedTexture} tint={0x000000} x={0} y={2} anchor={0.5} />

      {/* 정중앙 원본 말풍선 */}
      <pixiSprite texture={croppedTexture} x={0} y={0} anchor={0.5} />
      <pixiText text={inputCodeString} anchor={0.5} x={0} y={-5} style={bubbleTextStyle} />
    </pixiContainer>
  );
};
export default SpeechBubble;

const bubbleTextStyle = new TextStyle({
  fontFamily: "Arial", // 사용할 폰트 (커스텀 폰트명 가능)
  fontSize: 8, // 글자 크기
  fill: "#000000", // 글자 색상 (흰색)
  align: "center", // 텍스트 정렬
  fontWeight: "bold", // 글꼴 두께
});
