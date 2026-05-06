use std::{sync::Mutex, thread, time::Duration};

use tauri::{Emitter, Manager, PhysicalPosition, Position, WebviewWindow, WindowEvent};
use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutState};

mod native;

#[derive(Default)]
struct TargetState {
    hwnd: Mutex<Option<isize>>,
}

#[derive(Clone, serde::Serialize)]
struct PaletteOpenedPayload {
    placement: &'static str,
    palette_x: i32,
    palette_y: i32,
    caret_x: i32,
    caret_y: i32,
    caret_height: i32,
}

#[tauri::command]
fn insert_symbol(app: tauri::AppHandle, text: String) -> Result<(), String> {
    let hwnd = app
        .state::<TargetState>()
        .hwnd
        .lock()
        .map_err(|_| "target state lock failed".to_string())?
        .take();

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit("palette-closing", ());
        let _ = window.hide();
    }

    native::insert_text(hwnd, &text)
}

#[tauri::command]
fn hide_palette(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit("palette-closing", ());
        window.hide().map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn show_e_family_palette(app: &tauri::AppHandle) {
    const PALETTE_WIDTH: i32 = 226;
    const PALETTE_HEIGHT: i32 = 40;
    const SHADOW_GUTTER: i32 = 12;
    const WINDOW_WIDTH: i32 = PALETTE_WIDTH + (SHADOW_GUTTER * 2);
    const SOURCE_CARET_TOP: i32 = 10;
    const SCREEN_MARGIN: i32 = 8;
    const CARET_GAP: i32 = 16;
    const BELOW_CARET_OFFSET: i32 = 22;

    let snapshot = native::capture_target_and_caret();

    if let Ok(mut hwnd) = app.state::<TargetState>().hwnd.lock() {
        *hwnd = snapshot.hwnd;
    }

    let Some(window) = app.get_webview_window("main") else {
        return;
    };

    let (screen_left, screen_right) =
        monitor_horizontal_bounds(&window, snapshot.x).unwrap_or((0, 1920));
    let palette_left = clamp_i32(
        snapshot.x.saturating_sub(PALETTE_WIDTH / 2),
        screen_left.saturating_add(SCREEN_MARGIN),
        screen_right
            .saturating_sub(SCREEN_MARGIN)
            .saturating_sub(PALETTE_WIDTH),
    );
    let placement_below = snapshot.y < PALETTE_HEIGHT + CARET_GAP + SHADOW_GUTTER + SCREEN_MARGIN;
    let palette_y = if placement_below {
        snapshot.y.saturating_add(BELOW_CARET_OFFSET)
    } else {
        snapshot
            .y
            .saturating_sub(PALETTE_HEIGHT + CARET_GAP)
            .max(SCREEN_MARGIN)
    };
    let x = clamp_i32(
        palette_left.saturating_sub(SHADOW_GUTTER),
        screen_left,
        screen_right.saturating_sub(WINDOW_WIDTH),
    );
    let y = if placement_below {
        snapshot.y.saturating_sub(SOURCE_CARET_TOP)
    } else {
        palette_y.saturating_sub(SHADOW_GUTTER)
    };
    let payload = PaletteOpenedPayload {
        placement: if placement_below { "below" } else { "above" },
        palette_x: palette_left.saturating_sub(x),
        palette_y: palette_y.saturating_sub(y),
        caret_x: snapshot.x.saturating_sub(x),
        caret_y: snapshot.y.saturating_sub(y),
        caret_height: snapshot.caret_height,
    };

    let _ = window.emit("palette-prepare", payload.clone());
    thread::sleep(Duration::from_millis(32));
    let _ = window.set_position(Position::Physical(PhysicalPosition::new(x, y)));
    let _ = window.show();
    let _ = window.set_focus();
    let _ = window.emit("palette-opened", payload);
}

fn clamp_i32(value: i32, min: i32, max: i32) -> i32 {
    value.max(min).min(max.max(min))
}

fn monitor_horizontal_bounds(window: &WebviewWindow, point_x: i32) -> Option<(i32, i32)> {
    let monitors = window.available_monitors().ok()?;
    let matching_monitor = monitors
        .iter()
        .find(|monitor| {
            let left = monitor.position().x;
            let right = left.saturating_add(monitor.size().width as i32);
            point_x >= left && point_x <= right
        })
        .or_else(|| monitors.first())?;

    let left = matching_monitor.position().x;
    let right = left.saturating_add(matching_monitor.size().width as i32);
    Some((left, right))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(TargetState::default())
        .setup(|app| {
            let app_handle = app.handle().clone();
            if let Some(window) = app.get_webview_window("main") {
                window.on_window_event(move |event| {
                    if matches!(event, WindowEvent::Focused(false)) {
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.emit("palette-closing", ());
                            let _ = window.hide();
                        }
                    }
                });
            }

            #[cfg(desktop)]
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_shortcuts(["ctrl+shift+e", "ctrl+shift+q"])?
                    .with_handler(|app, shortcut, event| {
                        if event.state == ShortcutState::Pressed
                            && shortcut.matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::KeyE)
                        {
                            show_e_family_palette(app);
                        } else if event.state == ShortcutState::Pressed
                            && shortcut.matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::KeyQ)
                        {
                            app.exit(0);
                        }
                    })
                    .build(),
            )?;

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![insert_symbol, hide_palette])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
