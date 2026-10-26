// Prevents an extra console window on Windows in release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod hotkey;
mod picker;
mod storage;
mod tray;

use tauri::{Manager, WindowEvent};

fn main() {
    tauri::Builder::default()
        .manage(commands::PickerState::default())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .invoke_handler(tauri::generate_handler![
            commands::get_pixel_color,
            commands::capture_screen_region,
            commands::update_hotkey_binding,
            commands::activate_picker_overlay,
            commands::get_overlay_snapshot,
            commands::deactivate_picker_overlay,
        ])
        .setup(|app| {
            let handle = app.handle();
            hotkey::init(handle, &storage::saved_hotkey(handle));
            tray::init(handle)?;

            // Started by the OS at login: stay in the tray.
            if std::env::args().any(|a| a == "--minimized") {
                if let Some(w) = app.get_webview_window("main-dashboard") {
                    let _ = w.hide();
                }
            }
            Ok(())
        })
        // Closing the dashboard minimizes to the tray instead of quitting.
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main-dashboard" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
