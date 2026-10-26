import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Pipette } from "lucide-react";
import ScreenOverlay from "./components/Overlay/ScreenOverlay";
import ColorHistory from "./components/Dashboard/ColorHistory";
import FormatConverter from "./components/Dashboard/FormatConverter";
import SettingsPanel from "./components/Dashboard/SettingsPanel";
import type { ColorItem } from "./lib/color";

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

function Dashboard() {
  const [last, setLast] = useState<ColorItem | null>(null);

  useEffect(() => {
    const unlisten = listen<ColorItem>("color-picked", (e) => setLast(e.payload));
    return () => void unlisten.then((f) => f());
  }, []);

  return (
    <main className="flex h-full flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Color Picker</h1>
        <button
          className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium transition hover:bg-blue-500 active:scale-95"
          onClick={() => void invoke("activate_picker_overlay")}
        >
          <Pipette size={16} /> Pick color
        </button>
      </header>
      {last && (
        <div className="flex items-center gap-3 rounded-lg border border-neutral-800 p-3 text-sm">
          <span className="h-8 w-8 rounded border border-neutral-700" style={{ background: last.hex }} />
          <span className="font-mono">{last.hex}</span>
          <span className="font-mono text-neutral-400">{last.rgb}</span>
          <span className="font-mono text-neutral-400">{last.hsl}</span>
        </div>
      )}
      <ColorHistory />
      <FormatConverter />
      <SettingsPanel />
    </main>
  );
}

export default function App() {
  const label = isTauri() ? getCurrentWebviewWindow().label : "main-dashboard";
  return label === "picker-overlay" ? <ScreenOverlay /> : <Dashboard />;
}
