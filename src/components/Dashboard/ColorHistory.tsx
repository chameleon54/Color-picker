import { Copy, Trash2 } from "lucide-react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { formatForCopy, type ColorItem } from "../../lib/color";
import { MAX_HISTORY, useAppStore } from "../../store/useAppStore";

function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function ColorHistory() {
  const { history, settings, removeColor, clearHistory, showToast } = useAppStore();

  const copy = async (item: ColorItem) => {
    const text = formatForCopy(item, settings.copyFormat);
    try {
      await writeText(text);
      showToast(`Copied ${text}`);
    } catch {
      showToast("Copy failed");
    }
  };

  if (history.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-800 p-8 text-center text-sm text-neutral-500">
        No colors yet. Press <span className="font-medium text-neutral-300">Pick color</span> to sample one.
      </p>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>
          {history.length} / {MAX_HISTORY}
        </span>
        <button className="transition hover:text-red-400" onClick={clearHistory}>
          Clear all
        </button>
      </div>
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {history.map((c) => (
          <li
            key={c.id}
            className="group flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-2 transition hover:border-neutral-700"
          >
            <button
              className="h-10 w-10 shrink-0 rounded-md border border-neutral-700 transition active:scale-90"
              style={{ background: c.hex }}
              title="Copy"
              onClick={() => void copy(c)}
            />
            <div className="min-w-0 flex-1 text-sm">
              <div className="font-mono">{c.hex}</div>
              <div className="truncate font-mono text-xs text-neutral-400">
                {c.rgb} · {c.hsl}
                {c.tailwindMatch ? ` · ${c.tailwindMatch}` : ""}
              </div>
            </div>
            <span className="text-xs text-neutral-500">{timeAgo(c.timestamp)}</span>
            <button
              className="rounded p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
              title="Copy"
              onClick={() => void copy(c)}
            >
              <Copy size={14} />
            </button>
            <button
              className="rounded p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-red-400"
              title="Remove"
              onClick={() => removeColor(c.id)}
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
