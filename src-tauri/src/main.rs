// Prevents an extra console window on Windows in release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod hotkey;
mod picker;
mod storage;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::get_pixel_color,
            commands::capture_screen_region,
            commands::save_settings,
            commands::update_hotkey_binding,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
