import { useCallback, useEffect, useRef, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import MagnifierLoupe from "./MagnifierLoupe";
import { pixelAt, toColorItem } from "../../lib/color";

interface Cursor {
  clientX: number;
  clientY: number;
  x: number;
  y: number;
}

/** Snapshot wire format: u32 LE width, u32 LE height, then RGBA bytes. */
async function loadSnapshot(): Promise<ImageData> {
  const buf = await invoke<ArrayBuffer>("get_overlay_snapshot");
  const [width, height] = new Uint32Array(buf.slice(0, 8));
  return new ImageData(new Uint8ClampedArray(buf, 8), width, height);
}

export default function ScreenOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<ImageData | null>(null);
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const frame = useRef(0);

  const close = useCallback(async () => {
    cancelAnimationFrame(frame.current);
    setImage(null);
    setCursor(null);
    await invoke("deactivate_picker_overlay");
  }, []);

  // Load the frozen screen when the backend activates the overlay.
  useEffect(() => {
    const unlisten = listen("overlay-activate", async () => {
      const img = await loadSnapshot();
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d")?.putImageData(img, 0, 0);
      setImage(img);
      // Show only after the first paint so no stale frame flashes.
      requestAnimationFrame(async () => {
        const win = getCurrentWindow();
        await win.show();
        await win.setFocus();
      });
    });
    return () => void unlisten.then((f) => f());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") void close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const toCursor = (e: React.MouseEvent): Cursor | null => {
    if (!image) return null;
    const scale = image.width / window.innerWidth;
    return {
      clientX: e.clientX,
      clientY: e.clientY,
      x: Math.floor(e.clientX * scale),
      y: Math.floor(e.clientY * scale),
    };
  };

  const onMove = (e: React.MouseEvent) => {
    const next = toCursor(e);
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setCursor(next));
  };

  const onClick = async (e: React.MouseEvent) => {
    const c = toCursor(e);
    const rgb = image && c ? pixelAt(image, c.x, c.y) : null;
    if (!rgb) return;
    await emit("color-picked", toColorItem(rgb));
    await close();
  };

  return (
    <div
      className="fixed inset-0 cursor-crosshair select-none overflow-hidden bg-black"
      onMouseMove={onMove}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        void close();
      }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      {image && cursor && <MagnifierLoupe image={image} {...cursor} />}
    </div>
  );
}
