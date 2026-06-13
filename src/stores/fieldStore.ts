import { create } from "zustand";
import { EMIT_EVENT, RunnerStateType, RunnerStatsType } from "../types/globalTypes";
import { emit } from "@tauri-apps/api/event";

interface FieldState {
  // 실제 백엔드/논리 영역에서 초고속으로 수정할 원본 데이터
  scores: Record<number, number>;
  runnerState: RunnerStateType;
  // UI 컴포넌트가 바라보고 리렌더링할 화면 표시용 데이터
  displayScores: Record<number, number>;
  displayTotalScore: number;

  /**
   * 받아온 러너 상태 데이터를 이용해 러너 상태로 초기화하는 함수
   */
  initRunnerState: (runnerState: RunnerStatsType) => void;
  /**
   * 논리 영역에서 호출할 점수 가산 함수
   */
  addScore: (runnerId: number, amount: number) => void;
  /**
   * 논리 영역에서 계산한 총점을 UI 컴포넌트에 동기화하는 함수
   */
  syncDisplayScore: () => void;
  /**
   * 논리 영역에서 계산한 총점을 app 윈도우로 전송하는 함수
   */
  emitScore: () => void;
}

export const useFieldStore = create<FieldState>((set, get) => ({
  scores: {},
  runnerState: {},
  displayScores: {},
  displayTotalScore: 0,

  addScore: (runnerId, amount) => {
    set((state) => {
      const currentScore = state.scores[runnerId] ?? 0;
      return {
        scores: {
          ...state.scores,
          [runnerId]: currentScore + amount, // 안전한 불변성 업데이트
        },
      };
    });
  },

  initRunnerState: (runnerStats) => {
    set(() => {
      const transformedState = Object.entries(runnerStats).reduce((acc, [key, stats]) => {
        const runnerId = Number(key);

        acc[runnerId] = {
          ...stats,
          isRunning: false,
          lastPressedKey: null,
          inputBuffer: [],
        };

        return acc;
      }, {} as RunnerStateType); // 최종 결과물은 완성형 맵 객체

      return { runnerState: transformedState };
    });
  },

  syncDisplayScore: () => {
    const currentScores = get().scores;

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

    // runnerState 내의 값이 매 루프나 입력에 따라 변경되므로, react가 리렌더링하도록 얕은 복사본을 설정합니다.
    const currentRunnerState = get().runnerState;
    const nextRunnerState: RunnerStateType = {};
    Object.entries(currentRunnerState).forEach(([key, state]) => {
      const id = Number(key);
      nextRunnerState[id] = { ...state };
    });

    set({
      displayTotalScore: finalTotalScore,
      displayScores: finalDisplayScores,
      runnerState: nextRunnerState,
    });
  },

  emitScore: () => {
    const displayTotalScore = get().displayTotalScore;
    emit(EMIT_EVENT.UPDATE_SCORE, displayTotalScore);
  },
}));
