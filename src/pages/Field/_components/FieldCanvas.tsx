import { Application } from "@pixi/react";
import { memo, RefObject } from "react";
import Runner from "./Runner";
import { useFieldStore } from "../../../stores/fieldStore";

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
  const runnerState = useFieldStore((state) => state.runnerState);
  return (
    <>
      {Object.entries(runnerState).map((_, i) => (
        <Runner number={i} key={i} runnerState={runnerState} />
      ))}
    </>
  );
});

export default FieldCanvas;
