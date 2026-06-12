import { Application } from "@pixi/react";
import { memo, RefObject, useEffect, useRef } from "react";
import Runner from "./Runner";
import { listen } from "@tauri-apps/api/event";
import { useGameStore } from "./stores/score";

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
  const addScore = useGameStore((state) => state.addScore);
  const gameStateRef = useRef<GameState>({
    0: { isRunning: false, inputCode: ["KeyA", "KeyD"] },
    1: { isRunning: false, inputCode: ["Left", "KeyB"] },
  });

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
      //달릴때
      timersRef.current[targetRunner] = setTimeout(() => {
        gameStateRef.current[targetRunner].isRunning = false;
        addScore(targetRunner, 10);
      }, 1000);
    });

    //달리지 않을때
    const idleScoreTimer = setInterval(() => {
      const targetRunnerEntry = Object.entries(gameStateRef.current);
      targetRunnerEntry.forEach((_, index) => {
        if (gameStateRef.current[index].isRunning === false) {
          addScore(index, 1);
        }
      });
    }, 1000);

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
      Object.values(timersRef.current).forEach(clearTimeout);
      clearInterval(idleScoreTimer);
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
