import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef } from "react";
import { GlobalInputEventType } from "../types/globalTypes";
import { useGameStore } from "../stores/gameStore";

const useGameLoop = () => {
  const addScore = useGameStore((state) => state.addScore);
  const runRemainingTimesRef = useRef<Record<number, number>>({});
  const previousTimeRef = useRef<number | null>(null);
  const syncTimerRef = useRef(0);

  useEffect(() => {
    // 1. 키 입력 이벤트 리스너
    const unlistenPromise = listen("global-input", (event: GlobalInputEventType) => {
      const incomingKeyCode = event.payload.mouse_button || event.payload.key_code;

      // [수정] 상단의 변수 대신, 키가 눌린 '그 순간'의 최신 스토어 상태를 가져옵니다.
      const currentRunnerState = useGameStore.getState().rawRunnerState;

      const targetRunnerEntry = Object.entries(currentRunnerState).find(([_, runnerData]) =>
        runnerData.inputCode.includes(incomingKeyCode),
      );

      if (!targetRunnerEntry) return;
      const targetRunner = Number(targetRunnerEntry[0]);
      const runnerData = currentRunnerState[targetRunner]; // 최신 데이터 보장

      // 연타 차단: 이미 달리는 중이라면 무시
      if (runnerData.isRunning) return;

      // 달리기 시작 설정 및 개별 runDuration 적용
      runnerData.isRunning = true;
      runRemainingTimesRef.current[targetRunner] = runnerData.runDuration;
    });

    // 2. 메인 게임 루프 (setInterval을 사용하여 창이 포커스를 잃어도 계속 실행되도록 함)
    previousTimeRef.current = performance.now();
    const intervalId = setInterval(() => {
      const time = performance.now();
      if (previousTimeRef.current !== null) {
        // 프레임 간 흐른 시간 계산 (초 단위)
        const deltaTime = (time - previousTimeRef.current) / 1000;
        const currentRunnerState = useGameStore.getState().rawRunnerState;

        Object.keys(currentRunnerState).forEach((key) => {
          const index = Number(key);
          const runnerData = currentRunnerState[index];

          if (runnerData.isRunning) {
            // 남은 시간 차감
            runRemainingTimesRef.current[index] -= deltaTime;

            // [변경] 개별 러너의 달릴 때 초당 점수(scorePerSecondRun) 적용
            addScore(index, deltaTime * runnerData.scorePerSecondRun);

            // 시간이 다 되면 달리기 종료
            if (runRemainingTimesRef.current[index] <= 0) {
              runnerData.isRunning = false;
              runRemainingTimesRef.current[index] = 0;
            }
          } else {
            // [변경] 개별 러너의 쉴 때 초당 점수(scorePerSecondIdle) 적용
            addScore(index, deltaTime * runnerData.scorePerSecondIdle);
          }
        });

        // 흐른 시간을 누적
        syncTimerRef.current += deltaTime;

        // 0.1초(100ms)가 쌓일 때마다 딱 한 번씩만 화면을 갱신하고 서브 창으로 전송
        if (syncTimerRef.current >= 0.1) {
          useGameStore.getState().syncDisplay();
          syncTimerRef.current = 0; // 타이머 초기화
        }
      }

      previousTimeRef.current = time;
    }, 16); // 약 60fps로 실행

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
      clearInterval(intervalId);
    };
  }, []);
};

export default useGameLoop;
