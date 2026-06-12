import { create } from "zustand";

interface GameState {
  // 실제 백엔드/논리 영역에서 초고속으로 수정할 원본 데이터
  scores: Record<number, number>;
  // UI 컴포넌트가 바라보고 리렌더링할 화면 표시용 데이터
  displayScores: Record<number, number>;
  displaytotalScore: number;

  // 논리 엔진이 호출할 점수 가산 함수
  addScore: (runnerId: number, amount: number) => void;
  // 타이머가 초당 1회 호출할 UI 동기화 함수
  syncDisplay: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  scores: { 0: 0, 1: 0 },
  displayScores: { 0: 0, 1: 0 },
  displaytotalScore: 0,

  addScore: (runnerId, amount) => {
    // 내부 원본 데이터만 직접 수정 (리렌더링 유발하지 않음)
    get().scores[runnerId] += amount;
  },

  //렌더링용 상태 계산
  syncDisplay: () => {
    const currentScores = get().scores;

    let totalScore = 0;
    for (const property in currentScores) {
      totalScore += currentScores[property];
    }

    set({
      displaytotalScore: totalScore,
      displayScores: { ...currentScores },
    });
  },
}));
