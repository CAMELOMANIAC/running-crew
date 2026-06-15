import { memo, useEffect, useRef } from "react";
import { Assets, Container } from "pixi.js";
import { GifSprite } from "pixi.js/gif";

interface GifPlayerProps {
  src: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  visible?: boolean;
}

export const GifPlayer = memo(({ src, x = 0, y = 0, width, height, visible = true }: GifPlayerProps) => {
  const containerRef = useRef<Container | null>(null);
  const gifSpriteRef = useRef<GifSprite | null>(null);

  useEffect(() => {
    let active = true;
    let gifInstance: GifSprite | null = null;

    Assets.load(src).then((source) => {
      if (!active) return;
      gifInstance = new GifSprite({ source });
      gifSpriteRef.current = gifInstance;

      if (width) gifInstance.width = width;
      if (height) gifInstance.height = height;

      if (containerRef.current) {
        containerRef.current.addChild(gifInstance);
        if (visible) {
          gifInstance.currentFrame = 0;
          gifInstance.play();
        } else {
          gifInstance.stop();
        }
      }
    });

    return () => {
      active = false;
      if (gifInstance) {
        gifInstance.stop();
        if (containerRef.current) {
          containerRef.current.removeChild(gifInstance);
        }
        gifInstance.destroy();
      }
    };
  }, [src, width, height]);

  useEffect(() => {
    if (gifSpriteRef.current) {
      gifSpriteRef.current.visible = visible;
      if (visible) {
        gifSpriteRef.current.currentFrame = 0;
        gifSpriteRef.current.play();
      } else {
        gifSpriteRef.current.stop();
      }
    }
  }, [visible]);

  return <pixiContainer ref={containerRef} x={x} y={y} visible={visible} />;
});
