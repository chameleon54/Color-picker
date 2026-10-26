import { TAILWIND_PALETTE } from "./tailwindPalette";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface ColorItem {
  id: string;
  hex: string;
  rgb: string;
  hsl: string;
  tailwindMatch?: string;
  timestamp: number;
}

export type CopyFormat = "hex" | "rgb" | "hsl" | "tailwind";

const byte = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();

export const rgbToHex = ({ r, g, b }: Rgb): string => `#${byte(r)}${byte(g)}${byte(b)}`;

export const formatRgb = ({ r, g, b }: Rgb): string => `rgb(${r}, ${g}, ${b})`;

/** Parses #RGB or #RRGGBB (the leading # is optional). */
export function hexToRgb(hex: string): Rgb | null {
  let h = hex.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(h)) h = [...h].map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function hue({ r, g, b }: Rgb): { h: number; max: number; min: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, max, min };
}

export function formatHsl(rgb: Rgb): string {
  const { h, max, min } = hue(rgb);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export function formatHsv(rgb: Rgb): string {
  const { h, max, min } = hue(rgb);
  const s = max === 0 ? 0 : (max - min) / max;
  return `hsv(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(max * 100)}%)`;
}

/** Nearest Tailwind v3 palette class suffix (e.g. "blue-500") by RGB distance. */
export function nearestTailwind(rgb: Rgb): string {
  let best = "";
  let bestDist = Infinity;
  for (const [name, hex] of Object.entries(TAILWIND_PALETTE)) {
    const c = hexToRgb(hex);
    if (!c) continue;
    const dist = (c.r - rgb.r) ** 2 + (c.g - rgb.g) ** 2 + (c.b - rgb.b) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = name;
    }
  }
  return best;
}

/** Reads the RGB value at image coordinates, or null when out of bounds. */
export function pixelAt(image: ImageData, x: number, y: number): Rgb | null {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return null;
  const i = (y * image.width + x) * 4;
  const d = image.data;
  return { r: d[i], g: d[i + 1], b: d[i + 2] };
}

export function toColorItem(rgb: Rgb): ColorItem {
  return {
    id: crypto.randomUUID(),
    hex: rgbToHex(rgb),
    rgb: formatRgb(rgb),
    hsl: formatHsl(rgb),
    tailwindMatch: nearestTailwind(rgb),
    timestamp: Date.now(),
  };
}

/** The string to put on the clipboard for the user's preferred format. */
export function formatForCopy(item: ColorItem, format: CopyFormat): string {
  switch (format) {
    case "rgb":
      return item.rgb;
    case "hsl":
      return item.hsl;
    case "tailwind":
      return item.tailwindMatch ?? item.hex;
    default:
      return item.hex;
  }
}
