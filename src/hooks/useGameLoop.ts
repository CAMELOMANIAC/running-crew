import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef } from "react";
import { EMIT_EVENT, GlobalInputEventType } from "../types/globalTypes";
import { useFieldStore } from "../stores/fieldStore";

const formatKey = (keyCode: string) => {
  if (keyCode.startsWith("Key") && keyCode.length === 4) {
    return keyCode.substring(3).toLowerCase();
  }
  return keyCode.toLowerCase();
};

const useGameLoop = () => {
  const addScore = useFieldStore((state) => state.addScore);
  const activeRunsRef = useRef<Record<number, { key: string; remainingTime: number }[]>>({});
  const activeGlobalRunsRef = useRef<{ key: string; remainingTime: number }[]>([]);
  const oiiaTimeRef = useRef<number>(0);
  const previousTimeRef = useRef<number | null>(null);
  const syncDisplayScoreTimerRef = useRef(0);
  const updateScoreTimerRef = useRef(0);

  useEffect(() => {
    // 키 입력 이벤트 리스너
    const unlistenGlobalInputPromise = listen(EMIT_EVENT.GLOBAL_INPUT_SIGNAL, (event: GlobalInputEventType) => {
      const incomingKeyCode = event.payload.mouse_button || event.payload.key_code;
      const formattedKey = formatKey(incomingKeyCode);

      // 전역 입력 버퍼 업데이트 (각 입력마다 독립된 1초의 수명을 가짐)
      activeGlobalRunsRef.current.push({
        key: formattedKey,
        remainingTime: 1.0,
      });

      const store = useFieldStore.getState();
      const currentGlobalKeys = activeGlobalRunsRef.current.map((run) => run.key);

      // O, I, I, A 시퀀스 매칭 검사
      const isOiiaCombo = currentGlobalKeys.slice(-4).join(",") === "o,i,i,a";
      if (isOiiaCombo) {
        oiiaTimeRef.current = 6.0; // 4초 동안 이스터에그 지속
        activeGlobalRunsRef.current = []; // 즉시 버퍼 초기화
        useFieldStore.setState({
          globalInputBuffer: [],
          isOiiaActive: true,
        });
      } else {
        useFieldStore.setState({
          globalInputBuffer: currentGlobalKeys,
        });
      }

      const currentRunnerState = store.runnerState;

      // 입력된 키를 단축키로 사용하는 모든 러너 탐색
      // 입력된 키를 단축키로 사용하고 현재 달리고 있지 않은 러너 중 첫 번째 러너를 탐색
      const targetRunnerEntry = Object.entries(currentRunnerState).find(
        ([_, runnerData]) => runnerData.inputCode.includes(incomingKeyCode) && !runnerData.isRunning,
      );

      if (!targetRunnerEntry) {
        // 러너 매칭은 안 되었지만 버퍼 변경이 즉시 렌더링에 반영되도록 호출
        store.syncDisplayScore();
        return;
      }

      const [key, runnerData] = targetRunnerEntry;
      const runnerId = Number(key);

      if (!activeRunsRef.current[runnerId]) {
        activeRunsRef.current[runnerId] = [];
      }

      // 새 러닝 수명 객체 추가 (독립된 runDuration 수명을 가짐)
      activeRunsRef.current[runnerId].push({
        key: formattedKey,
        remainingTime: runnerData.runDuration,
      });

      // 실시간 상태 업데이트
      runnerData.isRunning = true;
      runnerData.lastPressedKey = formattedKey;
      runnerData.inputBuffer = activeRunsRef.current[runnerId].map((run) => run.key);

      // 즉시 동기화하여 키 입력을 즉각 반영
      useFieldStore.getState().syncDisplayScore();
    });

    // 메인 게임 루프
    previousTimeRef.current = performance.now();
    const intervalId = setInterval(() => {
      const time = performance.now();
      if (previousTimeRef.current !== null) {
        // 프레임 간 흐른 시간 계산 (초 단위)
        const deltaTime = (time - previousTimeRef.current) / 1000;

        // 1. 이스터에그 지속 시간 차감 및 상태 해제 처리
        if (oiiaTimeRef.current > 0) {
          oiiaTimeRef.current -= deltaTime;
          if (oiiaTimeRef.current <= 0) {
            oiiaTimeRef.current = 0;
            useFieldStore.setState({ isOiiaActive: false });
          }
        }

        // 2. 전역 입력 버퍼 실시간 수명 차감 및 소멸 처리 (이스터에그 진행 중이 아닐 때만 유효함)
        const globalRuns = activeGlobalRunsRef.current;
        if (globalRuns.length > 0) {
          globalRuns.forEach((run) => {
            run.remainingTime -= deltaTime;
          });
          const activeGlobalRuns = globalRuns.filter((run) => run.remainingTime > 0);
          activeGlobalRunsRef.current = activeGlobalRuns;

          const nextBuffer = activeGlobalRuns.map((run) => run.key);
          const currentStoreBuffer = useFieldStore.getState().globalInputBuffer;
          if (nextBuffer.join(",") !== currentStoreBuffer.join(",")) {
            useFieldStore.setState({ globalInputBuffer: nextBuffer });
          }
        } else {
          const currentStoreBuffer = useFieldStore.getState().globalInputBuffer;
          if (currentStoreBuffer.length > 0) {
            useFieldStore.setState({ globalInputBuffer: [] });
          }
        }

        const currentRunnerState = useFieldStore.getState().runnerState;
        const isOiiaActive = useFieldStore.getState().isOiiaActive;

        Object.keys(currentRunnerState).forEach((key) => {
          const index = Number(key);
          const runnerData = currentRunnerState[index];
          const runs = activeRunsRef.current[index] || [];

          if (isOiiaActive) {
            // Oiia Cat 재생 중: 모든 러너 강제 달리기 및 가속 점수 적용
            runnerData.isRunning = true;
            addScore(index, deltaTime * runnerData.scorePerSecondRun);
          } else if (runs.length > 0) {
            // 1. 현재 살아있는 러닝 큐의 남은 시간들 차감
            runs.forEach((run) => {
              run.remainingTime -= deltaTime;
            });

            // 2. 수명이 완료된 러닝 항목 제거 (FIFO 구조로 앞에서부터 자연스레 제거됨)
            const activeRuns = runs.filter((run) => run.remainingTime > 0);
            activeRunsRef.current[index] = activeRuns;

            // 3. 러너 달리기 상태 및 버퍼 업데이트
            runnerData.isRunning = activeRuns.length > 0;
            runnerData.inputBuffer = activeRuns.map((run) => run.key);

            // 개별 러너의 달릴 때 초당 점수(scorePerSecondRun) 적용
            addScore(index, deltaTime * runnerData.scorePerSecondRun);
          } else {
            // 달리는 중이 아니면 리셋 및 쉬는 점수 가산
            runnerData.isRunning = false;
            runnerData.inputBuffer = [];
            runnerData.lastPressedKey = null;

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
