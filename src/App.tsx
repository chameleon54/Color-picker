import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import ScreenOverlay from "./components/Overlay/ScreenOverlay";
import ColorHistory from "./components/Dashboard/ColorHistory";
import FormatConverter from "./components/Dashboard/FormatConverter";
import SettingsPanel from "./components/Dashboard/SettingsPanel";

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export default function App() {
  const label = isTauri() ? getCurrentWebviewWindow().label : "main-dashboard";

  if (label === "picker-overlay") return <ScreenOverlay />;

  return (
    <main className="flex h-full flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Color Picker</h1>
      <ColorHistory />
      <FormatConverter />
      <SettingsPanel />
    </main>
  );
}
