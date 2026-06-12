import { Application } from "@pixi/react";
import { memo, RefObject, useEffect, useRef } from "react";
import Runner from "./Runner";
import { listen } from "@tauri-apps/api/event";

interface FieldCanvasProps {
  parentRef: RefObject<HTMLDivElement | null>;
}

const FieldCanvas = ({ parentRef }: FieldCanvasProps) => {
  return (
    <Application resizeTo={parentRef} backgroundAlpha={0}>
      <CanvasContent />
    </Application>
  );
};

interface GameState {
  [runnerNumber: number]: {
    isRunning: boolean;
    inputCode: string[];
  };
}

interface GlobalInputEventType {
  payload: { event_type: string; key_code: string; mouse_button: string };
}

const CanvasContent = memo(() => {
  // 개별 러너들의 상태를 관리하는 고성능 논리 저장소
  const gameStateRef = useRef<GameState>({
    0: { isRunning: false, inputCode: ["KeyA", "KeyD"] },
    1: { isRunning: false, inputCode: ["Left", "KeyB"] },
  });

  // 타이머 객체들도 러너별로 관리하여 서로 간섭하지 않게 합니다.
  const timersRef = useRef<{ [key: number]: number }>({});

  useEffect(() => {
    const unlistenPromise = listen("global-input", (event: GlobalInputEventType) => {
      const incomingKeyCode = event.payload.mouse_button || event.payload.key_code;
      const targetRunnerEntry = Object.entries(gameStateRef.current).find(([_, runnerData]) =>
        runnerData.inputCode.includes(incomingKeyCode),
      );

      if (!targetRunnerEntry) return;

      const targetRunner = Number(targetRunnerEntry[0]);
      if (gameStateRef.current[targetRunner].isRunning) {
        return;
      }
      if (gameStateRef.current[targetRunner] === undefined) return;

      gameStateRef.current[targetRunner].isRunning = true;

      clearTimeout(timersRef.current[targetRunner]);
      timersRef.current[targetRunner] = setTimeout(() => {
        gameStateRef.current[targetRunner].isRunning = false;
      }, 1000);
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
      // 컴포넌트 언마운트 시 모든 타이머 정리
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <>
      {Array.from({ length: 2 }, (_, i) => (
        // 전체 상태(gameStateRef)와 본인의 고유 번호(number)를 함께 전달
        <Runner number={i} key={i} gameStateRef={gameStateRef} />
      ))}
    </>
  );
});

export default FieldCanvas;
