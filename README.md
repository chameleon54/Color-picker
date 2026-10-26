# Color Picker

A lightweight, cross-platform desktop color picker built with **Tauri v2**, **Rust**, **React**, **TypeScript** and **Tailwind CSS**. Sample any color on your screen with a global hotkey, magnify pixels for precision, convert between formats, and keep a history of picked colors.

> **Status:** all planned features are implemented. Testing and polishing are ongoing, and no release builds have been published yet.

## Features

- Global hotkey (default `Ctrl + Alt + X`) to start picking from any app
- 15×15 magnifier loupe with live HEX / RGB preview
- Multi-monitor and DPI-aware sampling
- Conversions: HEX, RGB, HSL/HSV and nearest Tailwind CSS color
- Auto-copy to clipboard
- Persistent history (up to 50 colors) with export to CSS variables, Tailwind config or JSON
- System tray with "Pick Color", "Open Palette Dashboard", "Settings" and "Quit"

## Progress

- [x] Step 1 – Project scaffold (Tauri v2 + React + TypeScript + Tailwind, plugins configured)
- [x] Step 2 – Backend pixel sampling (`picker.rs`, `get_pixel_color`, `capture_screen_region`)
- [x] Step 3 – Overlay window and magnifier loupe
- [x] Step 4 – Dashboard, history, export and settings
- [x] Step 5 – Event wiring, system tray, hotkey, launch at startup

## Tech stack

| Layer    | Tools |
| -------- | ----- |
| Backend  | Tauri v2, Rust, `xcap`, `image`, `tauri-plugin-global-shortcut`, `tauri-plugin-clipboard-manager`, `tauri-plugin-store`, `tauri-plugin-autostart` |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v3, Zustand, lucide-react |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) (stable)
- Platform requirements from the [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/):
  - **Windows:** Microsoft C++ Build Tools ("Desktop development with C++") and WebView2
  - **macOS:** Xcode Command Line Tools
  - **Linux:** WebKitGTK and related system libraries

## Getting started

```bash
npm install
npm run tauri dev
```

Build a release bundle:

```bash
npm run tauri build
```

Run the Rust tests (the live screen test needs a display):

```bash
cd src-tauri
cargo test
cargo test -- --ignored   # captures from the real screen
```

## Project structure

```
src/                    React frontend
  components/Dashboard/   History, converter, settings
  components/Overlay/     Screen overlay and magnifier loupe
  lib/                    Color conversion, Tailwind matching, export formats
  store/                  Zustand store (history and settings, persisted)
src-tauri/              Rust backend
  src/picker.rs           Screen capture and pixel sampling
  src/hotkey.rs           Global shortcut registration and rebinding
  src/tray.rs             System tray icon and menu
  src/storage.rs          Reads the saved hotkey at startup
  src/commands.rs         IPC commands and overlay activation
ai-docs/                Product, requirements and architecture docs
```

## Documentation

Design and requirements live in [ai-docs/](ai-docs/): `blueprint.md`, `prd.md`, `requirements.md` and `system-prompt.md`.

## License

No license has been chosen yet. Add a `LICENSE` file before publishing if you want others to be able to use the code.
