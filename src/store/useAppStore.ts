import { create } from "zustand";
import { load, type Store } from "@tauri-apps/plugin-store";
import type { ColorItem, CopyFormat } from "../lib/color";

export const MAX_HISTORY = 50;

export interface Settings {
  hotkey: string;
  autoCopy: boolean;
  copyFormat: CopyFormat;
}

const DEFAULT_SETTINGS: Settings = {
  hotkey: "Ctrl+Alt+X",
  autoCopy: true,
  copyFormat: "hex",
};

interface AppState {
  history: ColorItem[];
  settings: Settings;
  loaded: boolean;
  toast: string | null;
  init: () => Promise<void>;
  addColor: (item: ColorItem) => void;
  removeColor: (id: string) => void;
  clearHistory: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  showToast: (message: string) => void;
}

let store: Store | null = null;
let toastTimer: ReturnType<typeof setTimeout> | undefined;

const persist = (key: string, value: unknown) =>
  store?.set(key, value).catch((e) => console.error(`failed to save ${key}`, e));

export const useAppStore = create<AppState>((set, get) => ({
  history: [],
  settings: DEFAULT_SETTINGS,
  loaded: false,
  toast: null,

  init: async () => {
    if (get().loaded) return;
    store = await load("color-picker.json", { autoSave: true });
    const history = (await store.get<ColorItem[]>("history")) ?? [];
    const saved = await store.get<Partial<Settings>>("settings");
    set({ history, settings: { ...DEFAULT_SETTINGS, ...saved }, loaded: true });
  },

  addColor: (item) => {
    const history = [item, ...get().history.filter((c) => c.hex !== item.hex)].slice(0, MAX_HISTORY);
    set({ history });
    persist("history", history);
  },

  removeColor: (id) => {
    const history = get().history.filter((c) => c.id !== id);
    set({ history });
    persist("history", history);
  },

  clearHistory: () => {
    set({ history: [] });
    persist("history", []);
  },

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    persist("settings", settings);
  },

  showToast: (message) => {
    clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), 1800);
  },
}));
