import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Alert,
  Statistic,
  Row,
  Col,
  Switch,
  Tag,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  LineChartOutlined,
  WifiOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useBluetoothConnection } from '../hooks/useBluetoothConnection.ts';

const { Title, Text } = Typography;

interface DataPoint {
  time: number;
  value: number;
}

const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, selectedDevice, readData, checkConnection } =
    useBluetoothConnection();

  const [isRecording, setIsRecording] = useState(false);
  const [emgData, setEmgData] = useState<DataPoint[]>([]);
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [samplingRate, setSamplingRate] = useState<number>(0);
  const [isChecking, setIsChecking] = useState(true);

  // Cambiar NodeJS.Timeout por number (funciona en navegador)
  const intervalRef = useRef<number | null>(null);
  const sampleCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());
  const timeRef = useRef<number>(0);

  // Configuración
  const maxDataPoints = 500; // Mostrar últimos 500 puntos (~2.5 segundos a 200Hz)
  const readInterval = 5; // Leer cada 5ms para capturar ~200Hz

  // Verificar conexión al montar
  useEffect(() => {
    const verifyConnection = async () => {
      setIsChecking(true);
      await checkConnection();
      setIsChecking(false);
    };
    verifyConnection();
  }, [checkConnection]);

  // Calcular frecuencia de muestreo
  useEffect(() => {
    const calculateRate = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTimeRef.current) / 1000; // segundos

      if (elapsed >= 1.0) {
        const rate = Math.round(sampleCountRef.current / elapsed);
        setSamplingRate(rate);
        sampleCountRef.current = 0;
        lastTimeRef.current = now;
      }
    }, 1000);

    return () => clearInterval(calculateRate);
  }, []);

  // Leer datos del sensor
  const readSensorData = useCallback(async () => {
    if (!isConnected) return;

    try {
      const data = await readData();

      if (data && data.length > 0) {
        // Convertir el byte recibido a número (0-255) y escalar a 0-4095
        const rawValue = data.charCodeAt(0);
        const value = Math.round((rawValue * 4095) / 255);

        setCurrentValue(value);
        sampleCountRef.current++;

        if (isRecording) {
          const newPoint: DataPoint = {
            time: timeRef.current,
            value: value,
          };

          setEmgData((prev) => {
            const updated = [...prev, newPoint];
            // Mantener solo los últimos maxDataPoints
            if (updated.length > maxDataPoints) {
              return updated.slice(updated.length - maxDataPoints);
            }
            return updated;
          });

          timeRef.current++;
        }
      }
    } catch (error) {
      console.error('Error al leer datos:', error);
    }
  }, [isConnected, isRecording, readData]);

  // Iniciar/Detener lectura continua
  useEffect(() => {
    if (isConnected && isRecording) {
      intervalRef.current = window.setInterval(readSensorData, readInterval);
    } else {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isConnected, isRecording, readSensorData]);

  const handleStartStop = () => {
    if (!isRecording) {
      // Iniciar grabación
      setEmgData([]);
      timeRef.current = 0;
      sampleCountRef.current = 0;
      lastTimeRef.current = Date.now();
    }
    setIsRecording(!isRecording);
  };

  const handleClearData = () => {
    setEmgData([]);
    timeRef.current = 0;
  };

  // Mostrar pantalla de error si no hay conexión
  if (isChecking) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <WifiOutlined style={{ fontSize: 64, color: '#1890ff' }} spin />
        <Title level={3} style={{ marginTop: 24 }}>
          Verificando conexión Bluetooth...
        </Title>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
        <Alert
          message='Sin conexión Bluetooth'
          description={
            <Space direction='vertical' style={{ width: '100%' }}>
              <Text>
                No hay ningún dispositivo ESP32 conectado. Para visualizar datos
                EMG en tiempo real, primero debes conectar tu sensor.
              </Text>
              <Button
                type='primary'
                icon={<WifiOutlined />}
                onClick={() => navigate('/devices')}
                size='large'
                block
              >
                Ir a Dispositivos
              </Button>
            </Space>
          }
          type='error'
          icon={<WarningOutlined />}
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Title level={2}>
        <LineChartOutlined /> Visualización EMG en Tiempo Real
      </Title>

      {/* Información del dispositivo */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align='middle'>
          <Col flex='auto'>
            <Space>
              <Tag color='success'>Conectado</Tag>
              <Text strong>{selectedDevice?.name || 'Sensor EMG'}</Text>
            </Space>
          </Col>
          <Col>
            <Space size='large'>
              <Statistic
                title='Frecuencia de Muestreo'
                value={samplingRate}
                suffix='Hz'
                valueStyle={{
                  color: samplingRate > 150 ? '#3f8600' : '#faad14',
                }}
              />
              <Statistic
                title='Valor Actual'
                value={currentValue}
                suffix='/ 255'
              />
              <Statistic title='Puntos en Gráfica' value={emgData.length} />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Controles */}
      <Card style={{ marginBottom: 16 }}>
        <Space size='large'>
          <Button
            type={isRecording ? 'default' : 'primary'}
            danger={isRecording}
            icon={
              isRecording ? <PauseCircleOutlined /> : <PlayCircleOutlined />
            }
            onClick={handleStartStop}
            size='large'
          >
            {isRecording ? 'Detener' : 'Iniciar'} Captura
          </Button>

          <Button
            onClick={handleClearData}
            disabled={isRecording || emgData.length === 0}
          >
            Limpiar Gráfica
          </Button>

          <Space>
            <Switch checked={isRecording} onChange={handleStartStop} />
            <Text type='secondary'>
              {isRecording ? 'Capturando...' : 'Pausado'}
            </Text>
          </Space>
        </Space>
      </Card>

      {/* Gráfica */}
      <Card title='Señal EMG Cruda (Raw)'>
        <ResponsiveContainer width='100%' height={400}>
          <LineChart
            data={emgData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis
              dataKey='time'
              label={{
                value: 'Muestras',
                position: 'insideBottom',
                offset: -5,
              }}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              label={{
                value: 'Amplitud (0-4095)',
                angle: -90,
                position: 'insideLeft',
              }}
              domain={[0, 4095]}
            />
            <Tooltip
              formatter={(value: number) => [`${value}`, 'Amplitud']}
              labelFormatter={(label: number) => `Muestra: ${label}`}
            />
            <Line
              type='monotone'
              dataKey='value'
              stroke='#1890ff'
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {emgData.length === 0 && !isRecording && (
          <div
            style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}
          >
            <LineChartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>
              Presiona "Iniciar Captura" para ver la señal EMG en tiempo real
            </div>
          </div>
        )}
      </Card>

      {/* Información adicional */}
      {isRecording && (
        <Card style={{ marginTop: 16 }}>
          <Alert
            message='Captura en progreso'
            description={`Mostrando los últimos ${maxDataPoints} puntos de datos. La gráfica se actualiza en tiempo real.`}
            type='info'
            showIcon
          />
        </Card>
      )}
    </div>
  );
};

export default TestPage;
