import { Application, useApplication } from "@pixi/react";
import { memo, RefObject } from "react";
import Runner from "./Runner";
import { useFieldStore } from "../../../stores/fieldStore";
import { GifPlayer } from "./GifPlayer";
import oiiaCatGif from "../../../assets/meme/oiia_cat.gif";

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
  const isOiiaActive = useFieldStore((state) => state.isOiiaActive);
  const { app } = useApplication();

  const size = 150;
  const x = app ? app.screen.width / 2 - size / 2 : 0;
  const y = app ? app.screen.height / 2 - size / 2 : 0;

  return (
    <>
      {app && <GifPlayer src={oiiaCatGif} x={x} y={y} width={size} height={size} visible={isOiiaActive} />}
      {Object.entries(runnerState).map((_, i) => (
        <Runner number={i} key={i} runnerState={runnerState} />
      ))}
    </>
  );
});

export default FieldCanvas;
