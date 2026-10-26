//! Reads persisted settings. The frontend owns writes (tauri-plugin-store, shared file).

use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

use crate::hotkey::DEFAULT_HOTKEY;

pub const STORE_FILE: &str = "color-picker.json";

/// The hotkey saved by the settings panel, or the default.
pub fn saved_hotkey(app: &AppHandle) -> String {
    app.store(STORE_FILE)
        .ok()
        .and_then(|store| store.get("settings"))
        .and_then(|v| v.get("hotkey")?.as_str().map(str::to_owned))
        .unwrap_or_else(|| DEFAULT_HOTKEY.to_string())
}
