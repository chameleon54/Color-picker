import { useEffect, useRef } from "react";
import { formatRgb, pixelAt, rgbToHex } from "../../lib/color";

export const GRID = 15;
const CELL = 11;
const SIZE = GRID * CELL;
const OFFSET = 24;
const TOOLTIP_HEIGHT = 52;

interface Props {
  image: ImageData;
  /** Cursor position in snapshot pixels. */
  x: number;
  y: number;
  /** Cursor position in viewport CSS pixels. */
  clientX: number;
  clientY: number;
}

export default function MagnifierLoupe({ image, x, y, clientX, clientY }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const half = Math.floor(GRID / 2);

    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const c = pixelAt(image, x - half + gx, y - half + gy);
        ctx.fillStyle = c ? `rgb(${c.r}, ${c.g}, ${c.b})` : "#111";
        ctx.fillRect(gx * CELL, gy * CELL, CELL, CELL);
      }
    }

    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= GRID; i++) {
      ctx.moveTo(i * CELL + 0.5, 0);
      ctx.lineTo(i * CELL + 0.5, SIZE);
      ctx.moveTo(0, i * CELL + 0.5);
      ctx.lineTo(SIZE, i * CELL + 0.5);
    }
    ctx.stroke();

    // Highlight the sampled pixel at the centre cell (7, 7).
    const c0 = half * CELL;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeRect(c0 + 0.5, c0 + 0.5, CELL - 1, CELL - 1);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(c0 + 0.5, c0 + 0.5, CELL - 1, CELL - 1);
  }, [image, x, y]);

  const center = pixelAt(image, x, y);

  // Flip to the other side of the cursor near the viewport edges.
  const left = clientX + OFFSET + SIZE > window.innerWidth ? clientX - OFFSET - SIZE : clientX + OFFSET;
  const top =
    clientY + OFFSET + SIZE + TOOLTIP_HEIGHT > window.innerHeight
      ? clientY - OFFSET - SIZE - TOOLTIP_HEIGHT
      : clientY + OFFSET;

  return (
    <div
      className="pointer-events-none fixed overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-2xl"
      style={{ left, top, width: SIZE }}
    >
      <canvas ref={canvasRef} width={SIZE} height={SIZE} className="block" />
      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-100">
        <span
          className="h-7 w-7 shrink-0 rounded border border-neutral-600"
          style={{ background: center ? rgbToHex(center) : "transparent" }}
        />
        <div className="font-mono leading-tight">
          <div>{center ? rgbToHex(center) : "-"}</div>
          <div className="text-neutral-400">{center ? formatRgb(center) : ""}</div>
        </div>
      </div>
    </div>
  );
}
