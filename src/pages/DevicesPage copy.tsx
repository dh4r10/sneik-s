import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Alert,
  Spin,
  Divider,
  Tag,
  List,
  Empty,
  Progress,
  Collapse,
  message,
} from 'antd';
import {
  DisconnectOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  SignalFilled,
  InfoCircleOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useBluetoothConnection } from '../hooks/useBluetoothConnection.ts';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBluetooth } from '@fortawesome/free-brands-svg-icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const DevicesPage: React.FC = () => {
  const {
    devices,
    selectedDevice,
    isConnected,
    isConnecting,
    isScanning,
    isInitialized,
    error,
    connectionInfo,
    characteristics,
    scanDevices,
    connectDevice,
    disconnectDevice,
    checkConnection,
    clearError,
  } = useBluetoothConnection();

  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Verificar conexión y escanear dispositivos al montar el componente
  useEffect(() => {
    const initializePage = async () => {
      if (isInitialized) {
        // Primero verificar si hay una conexión activa
        console.log('🔍 Verificando estado de conexión...');
        const connected = await checkConnection();

        if (connected) {
          message.success('Conexión activa detectada');
        } else {
          console.log('No hay conexión activa');
        }

        // Luego escanear dispositivos disponibles
        scanDevices(5);
      }
    };

    initializePage();
  }, [isInitialized]);

  const handleScan = () => {
    if (!isInitialized) {
      message.error('Bluetooth no inicializado. Recarga la aplicación.');
      return;
    }
    scanDevices(5);
  };

  const handleCheckConnection = async () => {
    setIsCheckingConnection(true);
    try {
      const connected = await checkConnection();
      if (connected) {
        message.success('Conexión activa y estable');
      } else {
        message.warning('No hay conexión activa');
      }
    } catch (err) {
      message.error('Error al verificar conexión');
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const getSignalStrength = (
    rssi?: number
  ): { percent: number; color: string; text: string } => {
    if (!rssi) return { percent: 0, color: '#d9d9d9', text: 'Desconocido' };

    // RSSI típicamente va de -100 (débil) a -30 (fuerte)
    const normalized = Math.max(0, Math.min(100, ((rssi + 100) / 70) * 100));

    if (normalized > 70)
      return { percent: normalized, color: '#52c41a', text: 'Excelente' };
    if (normalized > 40)
      return { percent: normalized, color: '#faad14', text: 'Buena' };
    return { percent: normalized, color: '#ff4d4f', text: 'Débil' };
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>
        <FontAwesomeIcon icon={faBluetooth} /> Gestión de Dispositivos ESP32
        (Bluetooth)
      </Title>
      <Paragraph type='secondary'>
        Conecta tu ESP32 mediante Bluetooth Low Energy (BLE)
      </Paragraph>

      {!isInitialized && (
        <Alert
          message='Inicializando Bluetooth'
          description='Espera mientras se inicializa el adaptador Bluetooth...'
          type='info'
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {error && (
        <Alert
          message='Error'
          description={error}
          type='error'
          closable
          onClose={clearError}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Estado de conexión */}
      <Card style={{ marginBottom: 16 }}>
        <Space direction='vertical' style={{ width: '100%' }} size='large'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <Text strong>Estado de conexión:</Text>
              <div style={{ marginTop: 8 }}>
                {isConnected ? (
                  <Tag
                    icon={<CheckCircleOutlined />}
                    color='success'
                    style={{ fontSize: 14, padding: '4px 12px' }}
                  >
                    Conectado
                  </Tag>
                ) : (
                  <Tag
                    icon={<CloseCircleOutlined />}
                    color='default'
                    style={{ fontSize: 14, padding: '4px 12px' }}
                  >
                    Desconectado
                  </Tag>
                )}
              </div>
            </div>

            <Space>
              {/* Botón de verificar conexión */}
              <Button
                icon={<ApiOutlined />}
                onClick={handleCheckConnection}
                loading={isCheckingConnection}
                disabled={isConnecting}
              >
                Verificar Conexión
              </Button>

              {isConnected && selectedDevice && (
                <Button
                  danger
                  icon={<DisconnectOutlined />}
                  onClick={disconnectDevice}
                  size='large'
                >
                  Desconectar
                </Button>
              )}
            </Space>
          </div>

          {connectionInfo && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Alert
                message={connectionInfo}
                type='info'
                showIcon
                icon={<CheckCircleOutlined />}
              />
            </>
          )}
        </Space>
      </Card>

      {/* Lista de dispositivos disponibles */}
      <Card
        title={
          <Space>
            <FontAwesomeIcon icon={faBluetooth} />
            <span>Dispositivos Bluetooth Disponibles</span>
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={handleScan}
            loading={isScanning}
            disabled={isConnecting || !isInitialized}
          >
            {isScanning ? 'Escaneando...' : 'Escanear'}
          </Button>
        }
      >
        {isScanning ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size='large' tip='Buscando dispositivos Bluetooth...' />
            <div style={{ marginTop: 16 }}>
              <Text type='secondary'>
                Asegúrate de que tu ESP32 esté en modo visible
              </Text>
            </div>
          </div>
        ) : devices.length === 0 ? (
          <Empty
            description={
              <Space direction='vertical'>
                <Text>No se encontraron dispositivos Bluetooth</Text>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  • Asegúrate de que el Bluetooth esté activado
                </Text>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  • Verifica que tu ESP32 esté encendido y visible
                </Text>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  • Acerca el dispositivo a tu computadora
                </Text>
              </Space>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type='primary'
              icon={<ReloadOutlined />}
              onClick={handleScan}
              disabled={!isInitialized}
            >
              Escanear Nuevamente
            </Button>
          </Empty>
        ) : (
          <List
            dataSource={devices}
            renderItem={(device) => {
              const isCurrentDevice = selectedDevice?.id === device.id;
              const isDeviceConnected = isConnected && isCurrentDevice;
              const signal = getSignalStrength(device.rssi);

              return (
                <List.Item
                  actions={[
                    isDeviceConnected ? (
                      <Button
                        danger
                        icon={<DisconnectOutlined />}
                        onClick={disconnectDevice}
                      >
                        Desconectar
                      </Button>
                    ) : (
                      <Button
                        type='primary'
                        icon={
                          isConnecting ? (
                            <SyncOutlined spin />
                          ) : (
                            <FontAwesomeIcon icon={faBluetooth} />
                          )
                        }
                        onClick={() => connectDevice(device)}
                        disabled={isConnected || isConnecting}
                        loading={isConnecting && isCurrentDevice}
                      >
                        Conectar
                      </Button>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <FontAwesomeIcon
                        icon={faBluetooth}
                        style={{
                          fontSize: 28,
                          color: isDeviceConnected ? '#52c41a' : '#1890ff',
                        }}
                      />
                    }
                    title={
                      <Space>
                        <Text strong>{device.name}</Text>
                        {isDeviceConnected && (
                          <Tag color='success'>Conectado</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space
                        direction='vertical'
                        size={4}
                        style={{ width: '100%' }}
                      >
                        <Text type='secondary' style={{ fontSize: 12 }}>
                          ID: {device.id}
                        </Text>
                        <Text type='secondary' style={{ fontSize: 12 }}>
                          Dirección: {device.address}
                        </Text>
                        {device.rssi && (
                          <div style={{ marginTop: 4 }}>
                            <Space>
                              <SignalFilled style={{ color: signal.color }} />
                              <Text type='secondary' style={{ fontSize: 12 }}>
                                Señal: {signal.text} ({device.rssi} dBm)
                              </Text>
                            </Space>
                            <Progress
                              percent={signal.percent}
                              strokeColor={signal.color}
                              size='small'
                              showInfo={false}
                              style={{ marginTop: 4, maxWidth: 200 }}
                            />
                          </div>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>

      {/* Información del dispositivo conectado */}
      {isConnected && selectedDevice && (
        <Card
          title={
            <Space>
              <InfoCircleOutlined />
              <span>Información del Dispositivo</span>
            </Space>
          }
          style={{ marginTop: 16 }}
        >
          <Space direction='vertical' style={{ width: '100%' }} size='middle'>
            <div>
              <Text strong>Dispositivo:</Text> {selectedDevice.name}
            </div>
            <div>
              <Text strong>ID:</Text> {selectedDevice.id}
            </div>
            <div>
              <Text strong>Dirección Bluetooth:</Text> {selectedDevice.address}
            </div>
            {selectedDevice.rssi && (
              <div>
                <Text strong>Potencia de señal:</Text> {selectedDevice.rssi} dBm
              </div>
            )}

            <Divider />

            {characteristics.length > 0 && (
              <Collapse defaultActiveKey={['1']}>
                <Panel
                  header={`Características BLE (${characteristics.length})`}
                  key='1'
                >
                  <List
                    size='small'
                    dataSource={characteristics}
                    renderItem={(char) => (
                      <List.Item>
                        <Text code style={{ fontSize: 11 }}>
                          {char}
                        </Text>
                      </List.Item>
                    )}
                  />
                </Panel>
              </Collapse>
            )}

            <Alert
              message='Dispositivo listo para comunicación'
              description='Puedes enviar y recibir datos mediante las características BLE'
              type='success'
              showIcon
            />
          </Space>
        </Card>
      )}
    </div>
  );
};

export default DevicesPage;
