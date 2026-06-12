import { ChangeEvent, CSSProperties, useEffect } from "react";
import "./App.css";
import { emit, listen } from "@tauri-apps/api/event";
import { useGameStore } from "./stores/gameStore";

//앱 윈도우 진입점
function App() {
  useEffect(() => {
    // 서브 창(Field.tsx)에서 전송해주는 실시간 점수/상태를 메인 창의 스토어에 동기화
    const unlistenSyncPromise = listen("sync-game-scores", (event: any) => {
      const { displayTotalScore, displayScores, runnerState } = event.payload;
      useGameStore.setState({
        displayTotalScore,
        displayScores,
        rawRunnerState: runnerState,
      });
    });

    return () => {
      unlistenSyncPromise.then((unlisten) => unlisten());
    };
  }, []);

  const sendMessageToOtherWindow = async (e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    // 첫 번째 인자: 커스텀 이벤트 이름
    // 두 번째 인자: 전달하고 싶은 데이터 (오브젝트, 문자열, 불리언 등 모두 가능)
    await emit("WindowSetting-signal", {
      isWindowSetting: e.target.checked,
    });
  };

  return (
    <main style={mainStyleObj} data-tauri-drag-region>
      <p style={{ pointerEvents: "none" }}>isSetting</p>
      <input type="checkbox" onChange={(e) => sendMessageToOtherWindow(e)}></input>
    </main>
  );
}

export default App;

const mainStyleObj: CSSProperties = {
  width: "100vw",
  height: "100vh",
  backgroundColor: "black",
  color: "white",
};
