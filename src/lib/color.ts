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

const byte = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();

export const rgbToHex = ({ r, g, b }: Rgb): string => `#${byte(r)}${byte(g)}${byte(b)}`;

export const formatRgb = ({ r, g, b }: Rgb): string => `rgb(${r}, ${g}, ${b})`;

export function formatHsl({ r, g, b }: Rgb): string {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
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
    timestamp: Date.now(),
  };
}
