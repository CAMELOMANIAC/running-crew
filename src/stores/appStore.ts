import { create } from "zustand";
import { emit } from "@tauri-apps/api/event";
import { EMIT_EVENT, RunnerStatsType } from "../types/globalTypes";

//앱윈도우 전용 상태
interface AppState {
  score: number;
  setScore: (newScore: number) => void;

  runnerData: RunnerStatsType;
  emitRunnerState: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  score: 0,
  setScore: (newScore) => set({ score: newScore }),

  runnerData: {
    0: {
      runnerSprite: "runner1",
      inputCode: ["KeyP", "KeyO"],
      runDuration: 1.0,
      scorePerSecondRun: 10.0,
      scorePerSecondIdle: 0.02,
    },
    1: {
      runnerSprite: "runner2",
      inputCode: ["KeyO", "KeyI"],
      runDuration: 1.0,
      scorePerSecondRun: 10.0,
      scorePerSecondIdle: 0.02,
    },
    2: {
      runnerSprite: "runner3",
      inputCode: ["KeyP", "KeyI"],
      runDuration: 1.5,
      scorePerSecondRun: 12.0,
      scorePerSecondIdle: 0.02,
    },
    3: {
      runnerSprite: "runner4",
      inputCode: ["Left", "KeyA"],
      runDuration: 1.0,
      scorePerSecondRun: 10.0,
      scorePerSecondIdle: 0.02,
    },
  },

  emitRunnerState: () => {
    const currentRunnerState = get().runnerData;
    emit(EMIT_EVENT.UPDATE_RUNNER, currentRunnerState);
  },
}));
