#[derive(Clone, Copy)]
pub struct NativeSnapshot {
    pub hwnd: Option<isize>,
    pub x: i32,
    pub y: i32,
    pub caret_height: i32,
}

#[cfg(windows)]
mod platform {
    use std::{mem::size_of, ptr::null_mut, thread, time::Duration};

    use windows_sys::Win32::{
        Foundation::{HWND, POINT},
        Graphics::Gdi::ClientToScreen,
        UI::{
            Input::KeyboardAndMouse::{
                SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP,
                KEYEVENTF_UNICODE,
            },
            WindowsAndMessaging::{
                GetForegroundWindow, GetGUIThreadInfo, GetWindowThreadProcessId,
                SetForegroundWindow, GUITHREADINFO,
            },
        },
    };

    use super::NativeSnapshot;

    pub fn capture_target_and_caret() -> NativeSnapshot {
        unsafe {
            let foreground = GetForegroundWindow();

            if foreground.is_null() {
                return fallback_snapshot(None);
            }

            let thread_id = GetWindowThreadProcessId(foreground, null_mut());
            let mut info: GUITHREADINFO = std::mem::zeroed();
            info.cbSize = size_of::<GUITHREADINFO>() as u32;

            if thread_id == 0 || GetGUIThreadInfo(thread_id, &mut info) == 0 {
                return fallback_snapshot(Some(foreground as isize));
            }

            let caret_window = if info.hwndCaret.is_null() {
                foreground
            } else {
                info.hwndCaret
            };

            let mut point = POINT {
                x: info.rcCaret.left,
                y: info.rcCaret.top,
            };

            if ClientToScreen(caret_window, &mut point) == 0 {
                return fallback_snapshot(Some(foreground as isize));
            }

            NativeSnapshot {
                hwnd: Some(foreground as isize),
                x: point.x,
                y: point.y,
                caret_height: (info.rcCaret.bottom - info.rcCaret.top).max(2),
            }
        }
    }

    pub fn insert_text(hwnd: Option<isize>, text: &str) -> Result<(), String> {
        unsafe {
            if let Some(hwnd) = hwnd {
                SetForegroundWindow(hwnd as HWND);
                thread::sleep(Duration::from_millis(80));
            }

            for unit in text.encode_utf16() {
                send_utf16_unit(unit)?;
            }
        }

        Ok(())
    }

    unsafe fn send_utf16_unit(unit: u16) -> Result<(), String> {
        let inputs = [
            keyboard_input(unit, KEYEVENTF_UNICODE),
            keyboard_input(unit, KEYEVENTF_UNICODE | KEYEVENTF_KEYUP),
        ];

        let sent = SendInput(
            inputs.len() as u32,
            inputs.as_ptr(),
            size_of::<INPUT>() as i32,
        );

        if sent != inputs.len() as u32 {
            return Err(format!("SendInput sent {sent} of {} events", inputs.len()));
        }

        Ok(())
    }

    fn keyboard_input(scan: u16, flags: u32) -> INPUT {
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: 0,
                    wScan: scan,
                    dwFlags: flags,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        }
    }

    fn fallback_snapshot(hwnd: Option<isize>) -> NativeSnapshot {
        NativeSnapshot {
            hwnd,
            x: 360,
            y: 360,
            caret_height: 30,
        }
    }
}

#[cfg(not(windows))]
mod platform {
    use super::NativeSnapshot;

    pub fn capture_target_and_caret() -> NativeSnapshot {
        NativeSnapshot {
            hwnd: None,
            x: 360,
            y: 360,
            caret_height: 30,
        }
    }

    pub fn insert_text(_hwnd: Option<isize>, text: &str) -> Result<(), String> {
        println!("Would insert symbol: {text}");
        Ok(())
    }
}

pub use platform::{capture_target_and_caret, insert_text};
