// src-tauri/src/bluetooth_manager.rs

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use btleplug::api::{
    Central, Manager as _, Peripheral as _, ScanFilter,
    WriteType, Characteristic, CharPropFlags,
};
use btleplug::platform::{Adapter, Manager, Peripheral};
use tauri::State;
use std::time::Duration;
use tokio::time::sleep;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BluetoothDevice {
    pub id: String,
    pub name: String,
    pub address: String,
    pub rssi: Option<i16>,
}

pub struct BluetoothConnection {
    adapter: Mutex<Option<Adapter>>,
    peripheral: Mutex<Option<Peripheral>>,
    characteristics: Mutex<Vec<Characteristic>>,
}

impl BluetoothConnection {
    pub fn new() -> Self {
        Self {
            adapter: Mutex::new(None),
            peripheral: Mutex::new(None),
            characteristics: Mutex::new(Vec::new()),
        }
    }
}

#[tauri::command]
pub async fn init_bluetooth(connection: State<'_, BluetoothConnection>) -> Result<String, String> {
    let manager = Manager::new()
        .await
        .map_err(|e| format!("Error al inicializar Bluetooth: {}", e))?;

    let adapters = manager
        .adapters()
        .await
        .map_err(|e| format!("Error al obtener adaptadores: {}", e))?;

    let adapter = adapters
        .into_iter()
        .next()
        .ok_or("No se encontró adaptador Bluetooth")?;

    let mut adapter_guard = connection
        .adapter
        .lock()
        .map_err(|e| format!("Error al obtener lock: {}", e))?;

    *adapter_guard = Some(adapter);

    Ok("Bluetooth inicializado correctamente".to_string())
}

#[tauri::command]
pub async fn scan_bluetooth_devices(
    connection: State<'_, BluetoothConnection>,
    timeout_secs: u64,
) -> Result<Vec<BluetoothDevice>, String> {
    // Clonar el adapter para usarlo fuera del lock
    let adapter = {
        let adapter_guard = connection
            .adapter
            .lock()
            .map_err(|e| format!("Error al obtener lock: {}", e))?;

        adapter_guard
            .as_ref()
            .ok_or("Bluetooth no inicializado. Llama a init_bluetooth primero")?
            .clone()
    }; // El lock se libera aquí

    // MEJORA: Detener cualquier escaneo previo
    let _ = adapter.stop_scan().await;
    
    // Pequeña pausa para limpiar
    sleep(Duration::from_millis(100)).await;

    // Ahora podemos hacer operaciones async sin mantener el lock
    adapter
        .start_scan(ScanFilter::default())
        .await
        .map_err(|e| format!("Error al iniciar escaneo: {}", e))?;

    sleep(Duration::from_secs(timeout_secs)).await;

    adapter
        .stop_scan()
        .await
        .map_err(|e| format!("Error al detener escaneo: {}", e))?;

    let peripherals = adapter
        .peripherals()
        .await
        .map_err(|e| format!("Error al obtener dispositivos: {}", e))?;

    let mut devices = Vec::new();

    for peripheral in peripherals {
        let properties = peripheral
            .properties()
            .await
            .map_err(|e| format!("Error al obtener propiedades: {}", e))?;

        if let Some(props) = properties {
            let local_name = props.local_name.unwrap_or_else(|| "Desconocido".to_string());
            
            if local_name.to_lowercase().contains("esp32") || 
               local_name.to_lowercase().contains("esp") ||
               local_name.to_lowercase().contains("myo") ||
               (!local_name.is_empty() && local_name != "Desconocido") {
                
                devices.push(BluetoothDevice {
                    id: peripheral.id().to_string(),
                    name: local_name,
                    address: peripheral.address().to_string(),
                    rssi: props.rssi,
                });
            }
        }
    }

    Ok(devices)
}

#[tauri::command]
pub async fn connect_bluetooth(
    device_id: String,
    connection: State<'_, BluetoothConnection>,
) -> Result<String, String> {
    // Clonar el adapter para usarlo fuera del lock
    let adapter = {
        let adapter_guard = connection
            .adapter
            .lock()
            .map_err(|e| format!("Error al obtener lock: {}", e))?;

        adapter_guard
            .as_ref()
            .ok_or("Bluetooth no inicializado")?
            .clone()
    }; // El lock se libera aquí

    // MEJORA: Hacer un escaneo rápido antes de buscar el dispositivo
    let _ = adapter.start_scan(ScanFilter::default()).await;
    sleep(Duration::from_millis(500)).await;
    let _ = adapter.stop_scan().await;

    let peripherals = adapter
        .peripherals()
        .await
        .map_err(|e| format!("Error al obtener dispositivos: {}", e))?;

    let peripheral = peripherals
        .into_iter()
        .find(|p| p.id().to_string() == device_id)
        .ok_or("Dispositivo no encontrado")?;

    let is_connected = peripheral
        .is_connected()
        .await
        .map_err(|e| format!("Error al verificar conexión: {}", e))?;

    if !is_connected {
        peripheral
            .connect()
            .await
            .map_err(|e| format!("Error al conectar: {}", e))?;
    }

    peripheral
        .discover_services()
        .await
        .map_err(|e| format!("Error al descubrir servicios: {}", e))?;

    // Convertir BTreeSet a Vec
    let characteristics: Vec<Characteristic> = peripheral.characteristics().into_iter().collect();
    
    let props = peripheral
        .properties()
        .await
        .map_err(|e| format!("Error al obtener propiedades: {}", e))?;

    let device_name = props
        .and_then(|p| p.local_name)
        .unwrap_or_else(|| "Desconocido".to_string());

    // Guardar el peripheral y características después de todas las operaciones async
    {
        let mut peripheral_guard = connection
            .peripheral
            .lock()
            .map_err(|e| format!("Error al obtener lock: {}", e))?;

        let mut chars_guard = connection
            .characteristics
            .lock()
            .map_err(|e| format!("Error al obtener lock: {}", e))?;

        *peripheral_guard = Some(peripheral);
        *chars_guard = characteristics;
    }

    Ok(format!("Conectado exitosamente a {}", device_name))
}

#[tauri::command]
pub async fn disconnect_bluetooth(
    connection: State<'_, BluetoothConnection>,
) -> Result<String, String> {
    // Clonar el peripheral para usarlo fuera del lock
    let peripheral = {
        let peripheral_guard = connection
            .peripheral
            .lock()
            .map_err(|e| format!("Error al obtener lock: {}", e))?;

        peripheral_guard.as_ref().cloned()
    }; // El lock se libera aquí

    if let Some(p) = peripheral {
        p.disconnect()
            .await
            .map_err(|e| format!("Error al desconectar: {}", e))?;
        
        // MEJORA: Dar tiempo al dispositivo para que reinicie advertising
        sleep(Duration::from_millis(1000)).await;
    }

    // Limpiar después de desconectar
    {
        let mut peripheral_guard = connection
            .peripheral
            .lock()
            .map_err(|e| format!("Error al obtener lock: {}", e))?;

        let mut chars_guard = connection
            .characteristics
            .lock()
            .map_err(|e| format!("Error al obtener lock: {}", e))?;

        *peripheral_guard = None;
        chars_guard.clear();
    }

    Ok("Desconectado exitosamente".to_string())
}

#[tauri::command]
pub async fn is_bluetooth_connected(
    connection: State<'_, BluetoothConnection>,
) -> Result<bool, String> {
    // Clonar el peripheral para usarlo fuera del lock
    let peripheral = {
        let peripheral_guard = connection
            .peripheral
            .lock()
            .map_err(|e| format!("Error al obtener lock: {}", e))?;

        peripheral_guard.as_ref().cloned()
    }; // El lock se libera aquí

    if let Some(p) = peripheral {
        let connected = p
            .is_connected()
            .await
            .map_err(|e| format!("Error al verificar conexión: {}", e))?;
        Ok(connected)
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub async fn write_bluetooth(
    data: String,
    char_uuid: Option<String>,
    connection: State<'_, BluetoothConnection>,
) -> Result<usize, String> {
    // Obtener peripheral y característica clonados
    let (peripheral, characteristic) = {
        let peripheral_guard = connection
            .peripheral
            .lock()
            .map_err(|e| format!("Error al obtener lock: {}", e))?;

        let peripheral = peripheral_guard
            .as_ref()
            .ok_or("No hay conexión activa")?
            .clone();

        let chars_guard = connection
            .characteristics
            .lock()
            .map_err(|e| format!("Error al obtener lock: {}", e))?;

        let characteristic = if let Some(uuid_str) = char_uuid {
            let uuid = Uuid::parse_str(&uuid_str)
                .map_err(|e| format!("UUID inválido: {}", e))?;
            
            chars_guard
                .iter()
                .find(|c| c.uuid == uuid)
                .ok_or("Característica no encontrada")?
                .clone()
        } else {
            // Usar CharPropFlags correctamente con contains
            chars_guard
                .iter()
                .find(|c| {
                    c.properties.contains(CharPropFlags::WRITE) || 
                    c.properties.contains(CharPropFlags::WRITE_WITHOUT_RESPONSE)
                })
                .ok_or("No se encontró característica de escritura")?
                .clone()
        };

        (peripheral, characteristic)
    }; // Los locks se liberan aquí

    let bytes = data.as_bytes();
    
    peripheral
        .write(
            &characteristic,
            bytes,
            WriteType::WithoutResponse,
        )
        .await
        .map_err(|e| format!("Error al escribir datos: {}", e))?;

    Ok(bytes.len())
}

#[tauri::command]
pub async fn read_bluetooth(
    char_uuid: Option<String>,
    connection: State<'_, BluetoothConnection>,
) -> Result<String, String> {
    // Obtener peripheral y característica clonados
    let (peripheral, characteristic) = {
        let peripheral_guard = connection
            .peripheral
            .lock()
            .map_err(|e| format!("Error al obtener lock: {}", e))?;

        let peripheral = peripheral_guard
            .as_ref()
            .ok_or("No hay conexión activa")?
            .clone();

        let chars_guard = connection
            .characteristics
            .lock()
            .map_err(|e| format!("Error al obtener lock: {}", e))?;

        let characteristic = if let Some(uuid_str) = char_uuid {
            let uuid = Uuid::parse_str(&uuid_str)
                .map_err(|e| format!("UUID inválido: {}", e))?;
            
            chars_guard
                .iter()
                .find(|c| c.uuid == uuid)
                .ok_or("Característica no encontrada")?
                .clone()
        } else {
            // Usar CharPropFlags correctamente con contains
            chars_guard
                .iter()
                .find(|c| {
                    c.properties.contains(CharPropFlags::READ) || 
                    c.properties.contains(CharPropFlags::NOTIFY)
                })
                .ok_or("No se encontró característica de lectura")?
                .clone()
        };

        (peripheral, characteristic)
    }; // Los locks se liberan aquí

    let data = peripheral
        .read(&characteristic)
        .await
        .map_err(|e| format!("Error al leer datos: {}", e))?;

    let text = String::from_utf8_lossy(&data).to_string();
    Ok(text)
}

#[tauri::command]
pub async fn get_characteristics(
    connection: State<'_, BluetoothConnection>,
) -> Result<Vec<String>, String> {
    let chars_guard = connection
        .characteristics
        .lock()
        .map_err(|e| format!("Error al obtener lock: {}", e))?;

    let char_info: Vec<String> = chars_guard
        .iter()
        .map(|c| {
            // Usar CharPropFlags correctamente con contains
            let properties = vec![
                if c.properties.contains(CharPropFlags::READ) { "READ" } else { "" },
                if c.properties.contains(CharPropFlags::WRITE) { "WRITE" } else { "" },
                if c.properties.contains(CharPropFlags::NOTIFY) { "NOTIFY" } else { "" },
                if c.properties.contains(CharPropFlags::INDICATE) { "INDICATE" } else { "" },
            ]
            .into_iter()
            .filter(|s| !s.is_empty())
            .collect::<Vec<_>>()
            .join(", ");

            format!("UUID: {} | Properties: {}", c.uuid, properties)
        })
        .collect();

    Ok(char_info)
}