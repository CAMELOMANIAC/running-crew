import { ChangeEvent, CSSProperties } from "react";
import "./App.css";
import { emit } from "@tauri-apps/api/event";
import { useAppStore } from "../../stores/appStore";
import { EMIT_EVENT } from "../../types/globalTypes";
import { Link } from "react-router";
//앱 윈도우 진입점
function App() {

  const sendMessageToOtherWindow = async (e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    // 첫 번째 인자: 커스텀 이벤트 이름
    // 두 번째 인자: 전달하고 싶은 데이터 (오브젝트, 문자열, 불리언 등 모두 가능)
    await emit(EMIT_EVENT.UPDATE_WINDOW_SETTING, {
      isWindowSetting: e.target.checked,
    });
  };

  const startGame = async () => {
    await emit(EMIT_EVENT.UPDATE_RUNNER, useAppStore.getState().runnerData);
  };

  return (
    <main style={mainStyleObj} data-tauri-drag-region>
      <div>
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          <label>
            isSetting
            <input type="checkbox" onChange={(e) => sendMessageToOtherWindow(e)}></input>
          </label>
        </div>
        <p style={disableDragStyle}>score: {useAppStore((state) => state.score)}</p>
        <button style={buttonStyle} onClick={startGame}>
          시작
        </button>
        <Link to="/upgrade/1">업그레이드</Link>
      </div>
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

const buttonStyle: CSSProperties = {
  backgroundColor: "#4CAF50",
  border: "none",
  color: "white",
  padding: "10px 20px",
  textAlign: "center",
  textDecoration: "none",
  display: "inline-block",
  fontSize: "16px",
  margin: "4px 2px",
  cursor: "pointer",
  borderRadius: "8px",
  fontWeight: "bold",
};
