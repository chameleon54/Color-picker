import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { History, Pipette, Settings, SlidersHorizontal, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import ScreenOverlay from "./components/Overlay/ScreenOverlay";
import ColorHistory from "./components/Dashboard/ColorHistory";
import FormatConverter from "./components/Dashboard/FormatConverter";
import SettingsPanel from "./components/Dashboard/SettingsPanel";
import { formatForCopy, type ColorItem } from "./lib/color";
import { useAppStore } from "./store/useAppStore";

type Tab = "history" | "converter" | "settings";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "history", label: "History", icon: History },
  { id: "converter", label: "Converter / Export", icon: SlidersHorizontal },
  { id: "settings", label: "Settings", icon: Settings },
];

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

function Dashboard() {
  const [tab, setTab] = useState<Tab>("history");
  const { loaded, toast, init } = useAppStore();

  useEffect(() => {
    void init();
  }, [init]);

  // The overlay announces picks; this window owns history and clipboard.
  useEffect(() => {
    if (!loaded) return;
    const unlisten = listen<ColorItem>("color-picked", async (e) => {
      const { addColor, settings, showToast } = useAppStore.getState();
      addColor(e.payload);
      if (!settings.autoCopy) return;
      const text = formatForCopy(e.payload, settings.copyFormat);
      try {
        await writeText(text);
        showToast(`Copied ${text}`);
      } catch {
        showToast("Copy failed");
      }
    });
    return () => void unlisten.then((f) => f());
  }, [loaded]);

  return (
    <main className="relative flex h-full flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Color Picker</h1>
        <button
          className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium transition hover:bg-blue-500 active:scale-95"
          onClick={() => void invoke("activate_picker_overlay")}
        >
          <Pipette size={16} /> Pick color
        </button>
      </header>

      <nav className="flex gap-1 border-b border-neutral-800">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition",
              tab === id
                ? "border-blue-500 text-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-300",
            )}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col">
        {tab === "history" && <ColorHistory />}
        {tab === "converter" && <FormatConverter />}
        {tab === "settings" && <SettingsPanel />}
      </div>

      {toast && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-neutral-700 bg-neutral-800 px-4 py-1.5 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}

export default function App() {
  const label = isTauri() ? getCurrentWebviewWindow().label : "main-dashboard";
  return label === "picker-overlay" ? <ScreenOverlay /> : <Dashboard />;
}
