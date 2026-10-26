//! Tauri IPC commands exposed to the React frontend.

use std::sync::Mutex;

use tauri::{ipc::Response, AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, State};

use crate::picker::{self, ColorPayload, Snapshot};
use crate::storage::SettingsPayload;

const OVERLAY: &str = "picker-overlay";
const DASHBOARD: &str = "main-dashboard";

/// Overlay session state shared between commands.
#[derive(Default)]
pub struct PickerState {
    snapshot: Mutex<Option<Snapshot>>,
    dashboard_was_visible: Mutex<bool>,
}

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

/// Freezes the monitor under the cursor, positions the overlay over it and
/// tells the overlay to load the snapshot. The overlay shows itself once it
/// has painted, so a stale frame is never visible.
#[tauri::command]
pub async fn activate_picker_overlay(
    app: AppHandle,
    state: State<'_, PickerState>,
) -> Result<(), String> {
    let overlay = app.get_webview_window(OVERLAY).ok_or("overlay window missing")?;
    let cursor = app.cursor_position().map_err(|e| e.to_string())?;
    let (cx, cy) = (cursor.x as i32, cursor.y as i32);

    // Hide the dashboard first so it is not part of the snapshot.
    if let Some(dashboard) = app.get_webview_window(DASHBOARD) {
        *state.dashboard_was_visible.lock().map_err(|e| e.to_string())? =
            dashboard.is_visible().unwrap_or(false);
        dashboard.hide().map_err(|e| e.to_string())?;
    }

    let snapshot = tauri::async_runtime::spawn_blocking(move || picker::capture_monitor_at(cx, cy))
        .await
        .map_err(|e| e.to_string())??;

    if let Some(monitor) = app
        .monitor_from_point(cursor.x, cursor.y)
        .map_err(|e| e.to_string())?
    {
        overlay
            .set_position(PhysicalPosition::new(monitor.position().x, monitor.position().y))
            .map_err(|e| e.to_string())?;
        overlay
            .set_size(PhysicalSize::new(monitor.size().width, monitor.size().height))
            .map_err(|e| e.to_string())?;
    }

    *state.snapshot.lock().map_err(|e| e.to_string())? = Some(snapshot);
    overlay.emit("overlay-activate", ()).map_err(|e| e.to_string())
}

/// Returns the snapshot as 8 header bytes (width, height; u32 LE) followed by RGBA.
#[tauri::command]
pub fn get_overlay_snapshot(state: State<'_, PickerState>) -> Result<Response, String> {
    let guard = state.snapshot.lock().map_err(|e| e.to_string())?;
    let snap = guard.as_ref().ok_or("no active snapshot")?;
    let mut out = Vec::with_capacity(8 + snap.rgba.len());
    out.extend_from_slice(&snap.width.to_le_bytes());
    out.extend_from_slice(&snap.height.to_le_bytes());
    out.extend_from_slice(&snap.rgba);
    Ok(Response::new(out))
}

/// Hides the overlay, drops the snapshot and restores the dashboard if it was open.
#[tauri::command]
pub fn deactivate_picker_overlay(
    app: AppHandle,
    state: State<'_, PickerState>,
) -> Result<(), String> {
    if let Some(overlay) = app.get_webview_window(OVERLAY) {
        overlay.hide().map_err(|e| e.to_string())?;
    }
    *state.snapshot.lock().map_err(|e| e.to_string())? = None;
    if *state.dashboard_was_visible.lock().map_err(|e| e.to_string())? {
        if let Some(dashboard) = app.get_webview_window(DASHBOARD) {
            dashboard.show().map_err(|e| e.to_string())?;
            dashboard.set_focus().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn save_settings(_settings: SettingsPayload) -> Result<(), String> {
    Err("not implemented".into())
}

#[tauri::command]
pub async fn update_hotkey_binding(_hotkey: String) -> Result<(), String> {
    Err("not implemented".into())
}
