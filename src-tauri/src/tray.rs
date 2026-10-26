//! System tray icon and menu.

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

use crate::commands;

const DASHBOARD: &str = "main-dashboard";

pub fn show_dashboard(app: &AppHandle) {
    if let Some(w) = app.get_webview_window(DASHBOARD) {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

pub fn init(app: &AppHandle) -> tauri::Result<()> {
    let pick = MenuItem::with_id(app, "pick", "Pick Color", true, None::<&str>)?;
    let open = MenuItem::with_id(app, "open", "Open Palette Dashboard", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&pick, &open, &settings, &quit])?;

    let mut tray = TrayIconBuilder::new()
        .tooltip("Color Picker")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "pick" => {
                let app = app.clone();
                tauri::async_runtime::spawn(async move {
                    if let Err(e) = commands::activate_overlay(&app).await {
                        eprintln!("failed to open picker overlay: {e}");
                    }
                });
            }
            "open" => show_dashboard(app),
            "settings" => {
                show_dashboard(app);
                let _ = app.emit_to(DASHBOARD, "navigate", "settings");
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_dashboard(tray.app_handle());
            }
        });

    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;
    Ok(())
}
