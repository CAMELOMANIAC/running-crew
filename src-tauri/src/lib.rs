use rdev::{listen, EventType};
use serde::Serialize;
use std::thread;
use tauri::{Emitter};

// 1. 프론트엔드로 보낼 공용 입력 데이터 구조체 (마우스 데이터 필드 추가)
#[derive(Clone, Serialize)]
struct InputPayload {
    device_type: String, // "keyboard" 또는 "mouse"
    event_type: String,  // "press", "release", "move", "wheel"
    key_code: String,    // 키보드 키 이름 (마우스일 땐 빈 값)
    mouse_button: String,// 마우스 버튼 종류 (왼쪽: "Left", 오른쪽: "Right" 등)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle().clone();

            thread::spawn(move || {
                if let Err(error) = listen(move |event| {
                    let mut payload = InputPayload {
                        device_type: "unknown".to_string(),
                        event_type: "unknown".to_string(),
                        key_code: "".to_string(),
                        mouse_button: "".to_string()
                    };

                    match event.event_type {
                        // ⌨️ 키보드 입력 케이스
                        EventType::KeyPress(key) => {
                            payload.device_type = "keyboard".to_string();
                            payload.event_type = "press".to_string();
                            payload.key_code = format!("{:?}", key);
                        }
                        // EventType::KeyRelease(key) => {
                        //     payload.device_type = "keyboard".to_string();
                        //     payload.event_type = "release".to_string();
                        //     payload.key_code = format!("{:?}", key);
                        // }

                        // 🖱️ 마우스 클릭 입력 케이스
                        EventType::ButtonPress(button) => {
                            payload.device_type = "mouse".to_string();
                            payload.event_type = "press".to_string();
                            payload.mouse_button = format!("{:?}", button);
                        }
                        // EventType::ButtonRelease(button) => {
                        //     payload.device_type = "mouse".to_string();
                        //     payload.event_type = "release".to_string();
                        //     payload.mouse_button = format!("{:?}", button);
                        // }
                        _ => return, // 마우스 휠 스크롤 등 나머지는 패스
                    }

                    // ⭐️ 중요: 이벤트 이름을 "global-input"으로 통일해서 프론트로 한 번에 쏩니다.
                    let _ = app_handle.emit("global-input", payload);
                }) {
                    println!("rdev 감시 오류: {:?}", error);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}