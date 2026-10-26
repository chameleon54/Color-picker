//! Tauri IPC commands exposed to the React frontend.

use crate::picker::{self, ColorPayload};
use crate::storage::SettingsPayload;

// Screen capture is blocking, so run it off the async runtime's worker threads.

#[tauri::command]
pub async fn get_pixel_color(x: i32, y: i32) -> Result<ColorPayload, String> {
    tauri::async_runtime::spawn_blocking(move || picker::sample_pixel(x, y))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn capture_screen_region(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<Vec<u8>, String> {
    tauri::async_runtime::spawn_blocking(move || picker::capture_region(x, y, width, height))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn save_settings(_settings: SettingsPayload) -> Result<(), String> {
    Err("not implemented".into())
}

#[tauri::command]
pub async fn update_hotkey_binding(_hotkey: String) -> Result<(), String> {
    Err("not implemented".into())
}
