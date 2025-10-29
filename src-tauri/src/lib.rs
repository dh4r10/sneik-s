// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod bluetooth_manager;

use bluetooth_manager::{
    connect_bluetooth, disconnect_bluetooth, get_characteristics, init_bluetooth,
    is_bluetooth_connected, read_bluetooth, scan_bluetooth_devices, write_bluetooth,
    BluetoothConnection,
};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(BluetoothConnection::new())
        .invoke_handler(tauri::generate_handler![
            greet,
            init_bluetooth,
            scan_bluetooth_devices,
            connect_bluetooth,
            disconnect_bluetooth,
            is_bluetooth_connected,
            write_bluetooth,
            read_bluetooth,
            get_characteristics,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}