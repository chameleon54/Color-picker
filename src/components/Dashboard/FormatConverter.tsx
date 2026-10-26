import { useMemo, useState } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import clsx from "clsx";
import {
  formatHsl,
  formatHsv,
  formatRgb,
  hexToRgb,
  nearestTailwind,
  rgbToHex,
} from "../../lib/color";
import { EXPORT_LABELS, exportColors, type ExportFormat } from "../../lib/export";
import { useAppStore } from "../../store/useAppStore";

export default function FormatConverter() {
  const { history, showToast } = useAppStore();
  const [input, setInput] = useState("#3B82F6");
  const [format, setFormat] = useState<ExportFormat>("css");

  const rgb = hexToRgb(input);
  const rows = rgb
    ? [
        ["HEX", rgbToHex(rgb)],
        ["RGB", formatRgb(rgb)],
        ["HSL", formatHsl(rgb)],
        ["HSV", formatHsv(rgb)],
        ["Tailwind", nearestTailwind(rgb)],
      ]
    : [];

  const output = useMemo(() => exportColors(history, format), [history, format]);

  const copy = async (text: string) => {
    try {
      await writeText(text);
      showToast("Copied");
    } catch {
      showToast("Copy failed");
    }
  };

  return (
    <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto md:grid-cols-2">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-300">Converter</h2>
        <div className="flex items-center gap-2">
          <span
            className="h-9 w-9 shrink-0 rounded-md border border-neutral-700"
            style={{ background: rgb ? rgbToHex(rgb) : "transparent" }}
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="#RRGGBB"
            spellCheck={false}
            className={clsx(
              "w-full rounded-md border bg-neutral-900 px-3 py-1.5 font-mono text-sm outline-none focus:border-blue-500",
              rgb ? "border-neutral-700" : "border-red-500/60",
            )}
          />
        </div>
        <dl className="space-y-1 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-md bg-neutral-900/50 px-3 py-1.5">
              <dt className="text-neutral-500">{label}</dt>
              <dd>
                <button className="font-mono transition hover:text-blue-400" onClick={() => void copy(value)}>
                  {value}
                </button>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex min-h-0 flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-300">Export history</h2>
        <div className="flex gap-1.5">
          {(Object.keys(EXPORT_LABELS) as ExportFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={clsx(
                "rounded-md px-2.5 py-1 text-xs transition",
                f === format ? "bg-blue-600 text-white" : "bg-neutral-900 text-neutral-400 hover:text-neutral-100",
              )}
            >
              {EXPORT_LABELS[f]}
            </button>
          ))}
        </div>
        <textarea
          readOnly
          value={history.length ? output : "History is empty."}
          className="min-h-40 flex-1 resize-none rounded-md border border-neutral-800 bg-neutral-900 p-3 font-mono text-xs outline-none"
        />
        <button
          disabled={!history.length}
          onClick={() => void copy(output)}
          className="self-start rounded-md bg-neutral-800 px-3 py-1.5 text-sm transition hover:bg-neutral-700 disabled:opacity-40"
        >
          Copy export
        </button>
      </section>
    </div>
  );
}
