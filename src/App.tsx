import { ChangeEvent, CSSProperties } from "react";
import "./App.css";
import { emit } from "@tauri-apps/api/event";

function App() {
  const sendMessageToOtherWindow = async (e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    // 첫 번째 인자: 커스텀 이벤트 이름
    // 두 번째 인자: 전달하고 싶은 데이터 (오브젝트, 문자열, 불리언 등 모두 가능)
    await emit("WindowSetting-signal", {
      isWindowSetting: e.target.checked,
    });
  };
  return (
    <main style={mainStyleObj} data-tauri-drag-region>
      <p>isSetting</p>
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
