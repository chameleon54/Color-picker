import type { ColorItem } from "./color";

export type ExportFormat = "css" | "tailwind" | "json";

export const EXPORT_LABELS: Record<ExportFormat, string> = {
  css: "CSS Variables",
  tailwind: "Tailwind Config",
  json: "JSON",
};

export function exportColors(colors: ColorItem[], format: ExportFormat): string {
  switch (format) {
    case "css":
      return `:root {\n${colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join("\n")}\n}\n`;
    case "tailwind":
      return (
        "theme: {\n  extend: {\n    colors: {\n" +
        colors.map((c, i) => `      "picked-${i + 1}": "${c.hex}",`).join("\n") +
        "\n    },\n  },\n},\n"
      );
    case "json":
      return JSON.stringify(
        colors.map(({ hex, rgb, hsl, tailwindMatch }) => ({ hex, rgb, hsl, tailwind: tailwindMatch })),
        null,
        2,
      );
  }
}
