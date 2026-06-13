import { CSSProperties } from "react";
import { useFieldStore } from "./stores/fieldStore";

const Score = () => {
  const displayScore = useFieldStore((state) => state.displayTotalScore);

  return <div style={scoreStyleObj}>{displayScore}</div>;
};


export default Score;

const scoreStyleObj: CSSProperties = {
  color: "white",
  position: "fixed",
  right: 0,
  top: 0,
};
