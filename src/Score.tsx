import { CSSProperties } from "react";
import { useGameStore } from "./stores/gameStore";

const Score = () => {
  const displayScore = useGameStore((state) => state.displayTotalScore);

  return <div style={scoreStyleObj}>{displayScore}</div>;
};


export default Score;

const scoreStyleObj: CSSProperties = {
  color: "white",
  position: "fixed",
  right: 0,
  top: 0,
};
