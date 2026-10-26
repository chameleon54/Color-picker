//! Global shortcut registration (default: Alt+Shift+C).

use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

use crate::commands;

pub const DEFAULT_HOTKEY: &str = "Alt+Shift+C";

/// The currently registered hotkey, kept so a failed rebind can be rolled back.
pub struct HotkeyState(pub Mutex<String>);

fn register(app: &AppHandle, hotkey: &str) -> Result<(), String> {
    app.global_shortcut()
        .on_shortcut(hotkey, |app, _shortcut, event| {
            // Fire once per key press, not again on release.
            if event.state != ShortcutState::Pressed {
                return;
            }
            let _ = app.emit("shortcut-triggered", ());
            let app = app.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = commands::activate_overlay(&app).await {
                    eprintln!("failed to open picker overlay: {e}");
                }
            });
        })
        .map_err(|e| format!("cannot register \"{hotkey}\": {e}"))
}

/// Registers the startup hotkey, falling back to the default if it is invalid.
pub fn init(app: &AppHandle, hotkey: &str) {
    let active = match register(app, hotkey) {
        Ok(()) => hotkey,
        Err(e) => {
            eprintln!("{e}; falling back to {DEFAULT_HOTKEY}");
            if let Err(e) = register(app, DEFAULT_HOTKEY) {
                eprintln!("{e}");
            }
            DEFAULT_HOTKEY
        }
    };
    app.manage(HotkeyState(Mutex::new(active.to_string())));
}

/// Swaps the global hotkey; on failure the previous one stays active.
pub fn rebind(app: &AppHandle, hotkey: &str) -> Result<(), String> {
    let state = app.state::<HotkeyState>();
    let mut current = state.0.lock().map_err(|e| e.to_string())?;
    if *current == hotkey {
        return Ok(());
    }
    let shortcuts = app.global_shortcut();
    shortcuts.unregister_all().map_err(|e| e.to_string())?;
    match register(app, hotkey) {
        Ok(()) => {
            *current = hotkey.to_string();
            Ok(())
        }
        Err(e) => {
            let _ = register(app, &current);
            Err(e)
        }
    }
}
