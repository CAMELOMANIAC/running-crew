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
      inputCode: ["KeyP", "KeyD"],
      runDuration: 1.0,
      scorePerSecondRun: 10.0,
      scorePerSecondIdle: 0.1,
    },
    1: {
      inputCode: ["KeyO", "KeyB"],
      runDuration: 1.0,
      scorePerSecondRun: 10.0,
      scorePerSecondIdle: 0.1,
    },
    2: {
      inputCode: ["KeyP", "KeyB"],
      runDuration: 1.5,
      scorePerSecondRun: 12.0,
      scorePerSecondIdle: 0.1,
    },
    3: {
      inputCode: ["Left", "KeyB"],
      runDuration: 1.0,
      scorePerSecondRun: 10.0,
      scorePerSecondIdle: 0.1,
    },
  },

  emitRunnerState: () => {
    const currentRunnerState = get().runnerData;
    emit(EMIT_EVENT.UPDATE_RUNNER, currentRunnerState);
  },
}));
