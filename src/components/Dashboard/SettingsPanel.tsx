import type { CopyFormat } from "../../lib/color";
import { useAppStore } from "../../store/useAppStore";

const FORMATS: { value: CopyFormat; label: string }[] = [
  { value: "hex", label: "HEX (#3B82F6)" },
  { value: "rgb", label: "RGB (rgb(59, 130, 246))" },
  { value: "hsl", label: "HSL (hsl(217, 91%, 60%))" },
  { value: "tailwind", label: "Tailwind class (blue-500)" },
];

export default function SettingsPanel() {
  const { settings, updateSettings } = useAppStore();

  return (
    <div className="max-w-md space-y-5 text-sm">
      <label className="flex items-center justify-between gap-4">
        <span>
          Auto-copy on pick
          <span className="block text-xs text-neutral-500">Copy the color as soon as you click.</span>
        </span>
        <input
          type="checkbox"
          checked={settings.autoCopy}
          onChange={(e) => updateSettings({ autoCopy: e.target.checked })}
          className="h-4 w-4 accent-blue-500"
        />
      </label>

      <label className="block space-y-1.5">
        <span>Copy format</span>
        <select
          value={settings.copyFormat}
          onChange={(e) => updateSettings({ copyFormat: e.target.value as CopyFormat })}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 outline-none focus:border-blue-500"
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5">
        <span>
          Global hotkey
          <span className="block text-xs text-neutral-500">Saved now; takes effect once hotkeys are wired up.</span>
        </span>
        <input
          value={settings.hotkey}
          onChange={(e) => updateSettings({ hotkey: e.target.value })}
          spellCheck={false}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 font-mono outline-none focus:border-blue-500"
        />
      </label>
    </div>
  );
}
