import { Application } from "@pixi/react";
import { memo, RefObject } from "react";
import Runner from "./Runner";
import { useGameStore } from "./stores/gameStore";

interface FieldCanvasProps {
  parentRef: RefObject<HTMLDivElement | null>;
}

const FieldCanvas = ({ parentRef }: FieldCanvasProps) => {
  return (
    <Application resizeTo={parentRef} backgroundAlpha={0}>
      <CanvasContent />
    </Application>
  );
};

const CanvasContent = memo(() => {
  const rawRunnerState = useGameStore((state) => state.rawRunnerState);
  return (
    <>
      {Object.entries(rawRunnerState).map((_, i) => (
        <Runner number={i} key={i} runnerState={rawRunnerState} />
      ))}
    </>
  );
});

export default FieldCanvas;
