export const EMIT_EVENT = {
  UPDATE_RUNNER: "updateRunner",
  UPDATE_SCORE: "updateScore",
  UPDATE_WINDOW_SETTING: "updateWindowSetting",
  GLOBAL_INPUT_SIGNAL: "globalInputSignal",
} as const;

export interface GlobalInputEventType {
  payload: { event_type: string; key_code: string; mouse_button: string };
}

export interface RunnerStats {
  inputCode: string[];
  runDuration: number;
  scorePerSecondRun: number;
  scorePerSecondIdle: number;
}

export interface RunnerState extends RunnerStats {
  isRunning: boolean;
}

/**
 * 러너 능력치 정보
 */
export type RunnerStatsType = Record<number, RunnerStats>;
/**
 * 러너 능력치 정보 + 렌더링 상태
 */
export type RunnerStateType = Record<number, RunnerState>;
