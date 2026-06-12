import { CSSProperties, useEffect } from "react";
import { useGameStore } from "./stores/score";

const Score = () => {
  const syncDisplay = useGameStore((state) => state.syncDisplay);
  const displayScore = useGameStore((state) => state.displaytotalScore);

  useEffect(() => {
    // 1초(1000ms)마다 내부 점수를 UI 상태로 넘겨서 렌더링을 트리거합니다.
    const interval = setInterval(() => {
      syncDisplay();
    }, 200); // 💡 취향에 따라 200ms(초당 5회) 정도로 조절해도 무방합니다.

    return () => clearInterval(interval);
  }, [syncDisplay]);

  return <div style={scoreStyleObj}>{displayScore}</div>;
};

export default Score;

const scoreStyleObj: CSSProperties = {
  color: "white",
};
