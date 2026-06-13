import { ChangeEvent, CSSProperties, useEffect } from "react";
import "./App.css";
import { emit } from "@tauri-apps/api/event";
import { useAppStore } from "./stores/appStore";
import { EMIT_EVENT } from "./types/globalTypes";
//앱 윈도우 진입점
function App() {
  useEffect(() => {
    //준비되면 저장된 러너정보를 필드 윈도우로 전송
    const emitFirstRunnerStats = async () => {
      await emit(EMIT_EVENT.UPDATE_RUNNER, useAppStore.getState().runnerData);
    };
    emitFirstRunnerStats();
    return () => {};
  }, []);

  const sendMessageToOtherWindow = async (e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    // 첫 번째 인자: 커스텀 이벤트 이름
    // 두 번째 인자: 전달하고 싶은 데이터 (오브젝트, 문자열, 불리언 등 모두 가능)
    await emit(EMIT_EVENT.UPDATE_WINDOW_SETTING, {
      isWindowSetting: e.target.checked,
    });
  };

  return (
    <main style={mainStyleObj} data-tauri-drag-region>
      <p style={disableDragStyle}>isSetting</p>
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

const disableDragStyle: CSSProperties = {
  WebkitUserSelect: "none", // 사파리, 크롬, 구형 엣지 대응
  MozUserSelect: "none", // 파이어폭스 대응
  userSelect: "none", // 표준 속성 (대부분의 최신 브라우저)
};
