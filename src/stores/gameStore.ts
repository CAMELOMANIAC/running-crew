import { emit } from "@tauri-apps/api/event";
import { create } from "zustand";
import { runnerStateType } from "../types/globalTypes";

interface GameState {
  // 실제 백엔드/논리 영역에서 초고속으로 수정할 원본 데이터
  scores: Record<number, number>;
  rawRunnerState: runnerStateType;
  // UI 컴포넌트가 바라보고 리렌더링할 화면 표시용 데이터
  displayScores: Record<number, number>;
  displayTotalScore: number;

  // 논리 엔진이 호출할 점수 가산 함수
  addScore: (runnerId: number, amount: number) => void;
  // 타이머가 초당 1회 호출할 UI 동기화 함수
  syncDisplay: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  scores: {},
  rawRunnerState: {
    0: {
      isRunning: false,
      inputCode: ["KeyP", "KeyD"],
      runDuration: 1.0,
      scorePerSecondRun: 10.0,
      scorePerSecondIdle: 0.1,
    },
    1: {
      isRunning: false,
      inputCode: ["KeyO", "KeyB"],
      runDuration: 1.0,
      scorePerSecondRun: 10.0,
      scorePerSecondIdle: 0.1,
    },
    2: {
      isRunning: false,
      inputCode: ["KeyP", "KeyB"],
      runDuration: 1.5,
      scorePerSecondRun: 12.0,
      scorePerSecondIdle: 0.1,
    }, // 예시: 능력치가 더 높은 러너
    3: {
      isRunning: false,
      inputCode: ["Left", "KeyB"],
      runDuration: 1.0,
      scorePerSecondRun: 10.0,
      scorePerSecondIdle: 0.1,
    }, // 예시: 쉬는 점수가 더 높은 러너
  },
  displayScores: {},
  displayTotalScore: 0,

  addScore: (runnerId, amount) => {
    const currentScores = get().scores;

    // 만약 해당 runnerId가 처음 등장했다면 기본값 0으로 초기화
    if (currentScores[runnerId] === undefined) {
      currentScores[runnerId] = 0;
    }

    // 원본 데이터 수정 (주의: Zustand의 얕은 비교 덕분에 이 시점엔 리렌더링되지 않음)
    currentScores[runnerId] += amount;
  },

  syncDisplay: () => {
    const currentScores = get().scores;
    // [추가] useRef 대신 스토어 내부에 저장된 실시간 러너 정보 가져오기
    const currentRunnerState = get().rawRunnerState;

    // 1. 총점 계산 (정수 전환법)
    const totalInt = Object.values(currentScores).reduce((sum, score) => {
      return sum + Math.round(score * 100);
    }, 0);
    const finalTotalScore = totalInt / 100;

    // 2. 개별 점수 소수점 보정
    const finalDisplayScores: Record<number, number> = {};
    Object.entries(currentScores).forEach(([key, score]) => {
      const id = Number(key);
      finalDisplayScores[id] = Math.round(score * 100) / 100;
    });

    // 3. 동기화할 최종 패키지 데이터 구성
    const syncPayload = {
      displayTotalScore: finalTotalScore,
      displayScores: finalDisplayScores,
      // [핵심] 현재 러너들의 상태(isRunning, runDuration 등)도 깊은 복사로 포함
      runnerState: JSON.parse(JSON.stringify(currentRunnerState)),
    };

    // 4. 메인/서브 창 Zustand 업데이트 (로컬 상태 갱신 및 컴포넌트 리렌더링 트리거)
    set({
      displayTotalScore: finalTotalScore,
      displayScores: finalDisplayScores,
      rawRunnerState: { ...currentRunnerState },
    });

    // 5. 서브 창으로 점수 + 러너 정보 통째로 전송
    emit("sync-game-scores", syncPayload);
  },
}));
