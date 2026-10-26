import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import clsx from "clsx";
import type { CopyFormat } from "../../lib/color";
import { useAppStore } from "../../store/useAppStore";

const FORMATS: { value: CopyFormat; label: string }[] = [
  { value: "hex", label: "HEX (#3B82F6)" },
  { value: "rgb", label: "RGB (rgb(59, 130, 246))" },
  { value: "hsl", label: "HSL (hsl(217, 91%, 60%))" },
  { value: "tailwind", label: "Tailwind class (blue-500)" },
];

/** Turns a keydown into a shortcut string such as "Ctrl+Alt+X", or null if incomplete. */
function shortcutFromEvent(e: KeyboardEvent): string | null {
  if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return null;
  const mods = [e.ctrlKey && "Ctrl", e.altKey && "Alt", e.shiftKey && "Shift", e.metaKey && "Super"].filter(Boolean);
  if (mods.length === 0) return null;
  const key = e.code.replace(/^Key/, "").replace(/^Digit/, "");
  return [...mods, key].join("+");
}

function HotkeyField() {
  const { settings, updateSettings } = useAppStore();
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recording) return;
    const onKey = async (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === "Escape") return setRecording(false);
      const combo = shortcutFromEvent(e);
      if (!combo) return;
      setRecording(false);
      try {
        await invoke("update_hotkey_binding", { hotkey: combo });
        updateSettings({ hotkey: combo });
        setError(null);
      } catch (err) {
        setError(String(err));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [recording, updateSettings]);

  return (
    <div className="space-y-1.5">
      <span>
        Global hotkey
        <span className="block text-xs text-neutral-500">Click, then press a combination with Ctrl, Alt, Shift or Win.</span>
      </span>
      <button
        onClick={() => {
          setError(null);
          setRecording(true);
        }}
        className={clsx(
          "w-full rounded-md border bg-neutral-900 px-3 py-1.5 text-left font-mono outline-none transition",
          recording ? "border-blue-500 text-blue-400" : "border-neutral-700 hover:border-neutral-600",
        )}
      >
        {recording ? "Press keys... (Esc to cancel)" : settings.hotkey}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function AutostartToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    isEnabled().then(setOn).catch(() => undefined);
  }, []);

  const toggle = async (next: boolean) => {
    try {
      await (next ? enable() : disable());
      setOn(next);
    } catch (err) {
      console.error("autostart change failed", err);
    }
  };

  return (
    <label className="flex items-center justify-between gap-4">
      <span>
        Launch at system startup
        <span className="block text-xs text-neutral-500">Starts minimized in the tray.</span>
      </span>
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => void toggle(e.target.checked)}
        className="h-4 w-4 accent-blue-500"
      />
    </label>
  );
}

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

      <HotkeyField />
      <AutostartToggle />
    </div>
  );
}
