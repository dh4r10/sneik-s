// hooks/useBluetoothConnection.ts

import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface BluetoothDevice {
  id: string;
  name: string;
  address: string;
  rssi?: number;
}

export interface UseBluetoothConnectionReturn {
  devices: BluetoothDevice[];
  selectedDevice: BluetoothDevice | null;
  isConnected: boolean;
  isConnecting: boolean;
  isScanning: boolean;
  isInitialized: boolean;
  error: string | null;
  connectionInfo: string;
  characteristics: string[];
  initBluetooth: () => Promise<void>;
  scanDevices: (timeoutSecs?: number) => Promise<void>;
  connectDevice: (device: BluetoothDevice) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  writeData: (data: string, charUuid?: string) => Promise<number>;
  readData: (charUuid?: string) => Promise<string>;
  checkConnection: () => Promise<boolean>;
  getCharacteristics: () => Promise<void>;
  clearError: () => void;
}

export const useBluetoothConnection = (): UseBluetoothConnectionReturn => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<string>('');
  const [characteristics, setCharacteristics] = useState<string[]>([]);

  // Inicializar Bluetooth al montar
  useEffect(() => {
    initBluetooth();
  }, []);

  const initBluetooth = useCallback(async () => {
    try {
      const result = await invoke<string>('init_bluetooth');
      setIsInitialized(true);
      console.log(result);
    } catch (err) {
      setError(`Error al inicializar Bluetooth: ${err}`);
      setIsInitialized(false);
    }
  }, []);

  const scanDevices = useCallback(
    async (timeoutSecs: number = 5) => {
      if (!isInitialized) {
        setError('Bluetooth no inicializado');
        return;
      }

      setIsScanning(true);
      setError(null);

      try {
        const foundDevices = await invoke<BluetoothDevice[]>(
          'scan_bluetooth_devices',
          {
            timeoutSecs,
          }
        );
        setDevices(foundDevices);

        if (foundDevices.length === 0) {
          setError('No se encontraron dispositivos Bluetooth');
        }
      } catch (err) {
        setError(`Error al escanear dispositivos: ${err}`);
        setDevices([]);
      } finally {
        setIsScanning(false);
      }
    },
    [isInitialized]
  );

  const connectDevice = useCallback(async (device: BluetoothDevice) => {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await invoke<string>('connect_bluetooth', {
        deviceId: device.id,
      });

      setSelectedDevice(device);
      setIsConnected(true);
      setConnectionInfo(result);

      // Obtener características después de conectar
      await getCharacteristics();
    } catch (err) {
      setError(`Error al conectar: ${err}`);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectDevice = useCallback(async () => {
    try {
      await invoke<string>('disconnect_bluetooth');
      setIsConnected(false);
      setSelectedDevice(null);
      setConnectionInfo('');
      setCharacteristics([]);

      // MEJORA: Re-escanear automáticamente después de desconectar
      // Esto asegura que la caché de dispositivos se actualice
      console.log('🔄 Actualizando lista de dispositivos...');
      setTimeout(() => {
        scanDevices(5);
      }, 1500); // Esperar 1.5s para que el ESP32 reinicie advertising
    } catch (err) {
      setError(`Error al desconectar: ${err}`);
    }
  }, [scanDevices]);

  const writeData = useCallback(
    async (data: string, charUuid?: string): Promise<number> => {
      try {
        const bytesWritten = await invoke<number>('write_bluetooth', {
          data,
          charUuid: charUuid || null,
        });
        return bytesWritten;
      } catch (err) {
        setError(`Error al escribir datos: ${err}`);
        throw err;
      }
    },
    []
  );

  const readData = useCallback(async (charUuid?: string): Promise<string> => {
    try {
      const data = await invoke<string>('read_bluetooth', {
        charUuid: charUuid || null,
      });
      return data;
    } catch (err) {
      setError(`Error al leer datos: ${err}`);
      throw err;
    }
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const connected = await invoke<boolean>('is_bluetooth_connected');
      setIsConnected(connected);
      return connected;
    } catch (err) {
      setError(`Error al verificar conexión: ${err}`);
      return false;
    }
  }, []);

  const getCharacteristics = useCallback(async () => {
    try {
      const chars = await invoke<string[]>('get_characteristics');
      setCharacteristics(chars);
    } catch (err) {
      setError(`Error al obtener características: ${err}`);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    devices,
    selectedDevice,
    isConnected,
    isConnecting,
    isScanning,
    isInitialized,
    error,
    connectionInfo,
    characteristics,
    initBluetooth,
    scanDevices,
    connectDevice,
    disconnectDevice,
    writeData,
    readData,
    checkConnection,
    getCharacteristics,
    clearError,
  };
};
