export interface GlobalInputEventType {
  payload: { event_type: string; key_code: string; mouse_button: string };
}

export interface runnerStateType {
  [runnerNumber: number]: {
    isRunning: boolean;
    inputCode: string[];
    runDuration: number; // 개별 달리기 지속 시간
    scorePerSecondRun: number; // 개별 달릴 때 초당 점수
    scorePerSecondIdle: number; // 개별 쉴 때 초당 점수
  };
}
