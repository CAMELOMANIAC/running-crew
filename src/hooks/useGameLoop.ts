import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef } from "react";
import { EMIT_EVENT, GlobalInputEventType } from "../types/globalTypes";
import { useFieldStore } from "../stores/fieldStore";

const useGameLoop = () => {
  const addScore = useFieldStore((state) => state.addScore);
  const runRemainingTimesRef = useRef<Record<number, number>>({});
  const previousTimeRef = useRef<number | null>(null);
  const syncDisplayScoreTimerRef = useRef(0);
  const updateScoreTimerRef = useRef(0);

  useEffect(() => {
    // 키 입력 이벤트 리스너
    const unlistenGlobalInputPromise = listen(EMIT_EVENT.GLOBAL_INPUT_SIGNAL, (event: GlobalInputEventType) => {
      const incomingKeyCode = event.payload.mouse_button || event.payload.key_code;
      const currentRunnerState = useFieldStore.getState().runnerState;

      // 단축키가 일치하고 "동시에 현재 달리고 있지 않은" 첫 번째 런너를 검색
      const targetRunnerEntry = Object.entries(currentRunnerState).find(
        ([_, runnerData]) => runnerData.inputCode.includes(incomingKeyCode) && !runnerData.isRunning,
      );

      // 만약 같은 단축키를 쓰는 모든 런너가 이미 달리는 중이라면 핸들러 종료
      if (!targetRunnerEntry) return;

      const targetRunner = Number(targetRunnerEntry[0]);
      const runnerData = currentRunnerState[targetRunner]; // 최신 데이터 보장

      // 달리기 시작 설정 및 개별 runDuration 적용
      runnerData.isRunning = true;
      runRemainingTimesRef.current[targetRunner] = runnerData.runDuration;
    });

    // 메인 게임 루프
    previousTimeRef.current = performance.now();
    const intervalId = setInterval(() => {
      const time = performance.now();
      if (previousTimeRef.current !== null) {
        // 프레임 간 흐른 시간 계산 (초 단위)
        const deltaTime = (time - previousTimeRef.current) / 1000;
        const currentRunnerState = useFieldStore.getState().runnerState;

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
            // 개별 러너의 쉴 때 초당 점수(scorePerSecondIdle) 적용
            addScore(index, deltaTime * runnerData.scorePerSecondIdle);
          }
        });

        // 흐른 시간을 누적
        syncDisplayScoreTimerRef.current += deltaTime;
        updateScoreTimerRef.current += deltaTime;

        // 0.1초(100ms)가 쌓일 때마다 딱 한 번씩만 점수를 갱신
        if (syncDisplayScoreTimerRef.current >= 0.1) {
          useFieldStore.getState().syncDisplayScore();
          syncDisplayScoreTimerRef.current = 0; // 타이머 초기화
        }
        // 0.2초마다 app윈도우로 점수 동기화
        if (updateScoreTimerRef.current >= 0.2) {
          useFieldStore.getState().emitScore();
          updateScoreTimerRef.current = 0; // 타이머 초기화
        }
      }

      previousTimeRef.current = time;
    }, 16); // 약 60fps로 실행

    return () => {
      unlistenGlobalInputPromise.then((unlisten) => unlisten());
      clearInterval(intervalId);
    };
  }, []);
};

export default useGameLoop;
