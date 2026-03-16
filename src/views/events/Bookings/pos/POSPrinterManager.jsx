import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  Button,
  Radio,
  Space,
  Typography,
  Select,
  Switch,
  Divider,
  Tag,
  Alert,
  List,
} from 'antd';
import {
  UsbOutlined,
  DisconnectOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { Bluetooth } from 'lucide-react';

const { Text } = Typography;

const LOG_LIMIT = 30;

const POSPrinterManager = forwardRef((_, ref) => {
  const [mode, setMode] = useState('usb'); // usb | ble
  const [baudRate, setBaudRate] = useState('9600');
  const [flowControl, setFlowControl] = useState(false);

  const [usbPort, setUsbPort] = useState(null);
  const [usbWriter, setUsbWriter] = useState(null);
  const [bleDevice, setBleDevice] = useState(null);
  const [bleChar, setBleChar] = useState(null);

  const [status, setStatus] = useState('Disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingJob, setPendingJob] = useState(null);
  const [logs, setLogs] = useState([]);

  const jobRef = useRef(null);
  jobRef.current = pendingJob;

  const addLog = useCallback((type, message) => {
    setLogs(prev => {
      const entry = {
        id: Date.now() + Math.random(),
        type,
        message,
      };
      const next = [...prev, entry];
      return next.length > LOG_LIMIT ? next.slice(next.length - LOG_LIMIT) : next;
    });
  }, []);

  const resetState = useCallback(() => {
    setUsbPort(null);
    setUsbWriter(null);
    setBleDevice(null);
    setBleChar(null);
    setIsConnected(false);
    setStatus('Disconnected');
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (usbWriter) {
        await usbWriter.close();
      }
      if (usbPort) {
        await usbPort.close();
      }
      if (bleDevice?.gatt?.connected) {
        bleDevice.gatt.disconnect();
      }
      addLog('info', 'Disconnected');
    } catch (error) {
      addLog('error', `Disconnect failed: ${error.message}`);
    } finally {
      resetState();
    }
  }, [usbWriter, usbPort, bleDevice, addLog, resetState]);

  useEffect(() => () => {
    disconnect();
  }, [disconnect]);

  const connectUSB = useCallback(async () => {
    if (!('serial' in navigator)) {
      addLog('error', 'Web Serial API is not supported in this browser.');
      return;
    }
    try {
      setIsConnecting(true);
      addLog('info', 'Requesting USB device...');
      const port = await navigator.serial.requestPort();
      await port.open({
        baudRate: parseInt(baudRate, 10),
        flowControl: flowControl ? 'hardware' : 'none',
      });

      const writer = port.writable.getWriter();
      setUsbPort(port);
      setUsbWriter(writer);
      setIsConnected(true);
      setStatus('USB Connected');
      addLog('success', 'USB connected');
    } catch (error) {
      addLog('error', `USB error: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  }, [baudRate, flowControl, addLog]);

  const connectBLE = useCallback(async () => {
    if (!navigator.bluetooth) {
      addLog('error', 'Web Bluetooth is not supported in this browser.');
      return;
    }
    try {
      setIsConnecting(true);
      addLog('info', 'Scanning for BLE printers...');
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '00001101-0000-1000-8000-00805f9b34fb',
          'device_information',
        ],
      });
      addLog('info', `Selected device: ${device.name || 'Unknown'}`);
      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();

      let writableCharacteristic = null;
      for (const service of services) {
        const chars = await service.getCharacteristics();
        const found = chars.find(char => char.properties.write || char.properties.writeWithoutResponse);
        if (found) {
          writableCharacteristic = found;
          break;
        }
      }
      if (!writableCharacteristic) {
        throw new Error('No writable characteristic found.');
      }
      device.addEventListener('gattserverdisconnected', disconnect);

      setBleDevice(device);
      setBleChar(writableCharacteristic);
      setIsConnected(true);
      setStatus(`BLE: ${device.name || 'Printer'}`);
      addLog('success', 'BLE connected');
    } catch (error) {
      addLog('error', `BLE error: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  }, [addLog, disconnect]);

  const sendPayload = useCallback(async payload => {
    if (!payload) {
      addLog('warn', 'No payload to send');
      return;
    }
    try {
      addLog('tx', `Sending ${payload.length} chars`);
      if (mode === 'usb') {
        if (!usbWriter) {
          throw new Error('USB writer is not ready.');
        }
        const encoder = new TextEncoder();
        await usbWriter.write(encoder.encode(payload));
      } else {
        if (!bleChar) {
          throw new Error('BLE characteristic is not ready.');
        }
        const encoder = new TextEncoder();
        const encoded = encoder.encode(payload);
        const CHUNK = 100;
        for (let i = 0; i < encoded.byteLength; i += CHUNK) {
          const chunk = encoded.slice(i, i + CHUNK);
          await bleChar.writeValue(chunk);
          await new Promise(res => setTimeout(res, 20));
        }
      }
      addLog('success', 'Payload sent to printer');
    } catch (error) {
      addLog('error', `Send failed: ${error.message}`);
      throw error;
    }
  }, [mode, usbWriter, bleChar, addLog]);

  // Helper function to check actual connection state
  const checkConnection = useCallback(() => {
    if (mode === 'usb') {
      return !!(usbWriter && usbPort);
    } else {
      return !!(bleChar && bleDevice?.gatt?.connected);
    }
  }, [mode, usbWriter, usbPort, bleChar, bleDevice]);

  const flushPendingJob = useCallback(async () => {
    if (!pendingJob) return;
    // Check actual connection state
    const actuallyConnected = checkConnection();
    
    if (!actuallyConnected) return;
    
    try {
      await sendPayload(pendingJob.payload);
      pendingJob.resolve();
      setPendingJob(null);
      setIsModalOpen(false);
    } catch (error) {
      pendingJob.reject(error);
      setPendingJob(null);
    }
  }, [pendingJob, sendPayload, checkConnection]);

  // Sync isConnected state with actual connection
  useEffect(() => {
    const actuallyConnected = checkConnection();
    if (actuallyConnected !== isConnected) {
      setIsConnected(actuallyConnected);
      if (actuallyConnected) {
        setStatus(mode === 'usb' ? 'USB Connected' : `BLE: ${bleDevice?.name || 'Printer'}`);
      } else {
        setStatus('Disconnected');
      }
    }
  }, [mode, usbWriter, usbPort, bleChar, bleDevice, isConnected, checkConnection]);

  useEffect(() => {
    flushPendingJob();
  }, [flushPendingJob]);

  const queuePrint = useCallback(
    payload =>
      new Promise((resolve, reject) => {
        // Check actual connection state directly (inline to avoid closure issues)
        const actuallyConnected = (mode === 'usb' && usbWriter && usbPort) || 
                                   (mode === 'ble' && bleChar && bleDevice?.gatt?.connected);
        
        if (actuallyConnected) {
          // Connection exists, print directly
          sendPayload(payload)
            .then(() => {
              resolve();
            })
            .catch((error) => {
              addLog('error', `Print failed: ${error.message}`);
              reject(error);
            });
          return;
        }
        // No connection, queue the job and show modal
        setPendingJob({ payload, resolve, reject });
        setIsModalOpen(true);
      }),
    [sendPayload, mode, usbWriter, usbPort, bleChar, bleDevice, addLog],
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    if (!isConnected && jobRef.current) {
      jobRef.current.reject(new Error('Printer connection cancelled'));
      setPendingJob(null);
    }
  }, [isConnected]);

  useImperativeHandle(ref, () => ({
    print: queuePrint,
    isConnected: checkConnection(),
    mode,
    disconnect,
    checkConnection,
  }));

  const connectionNotice = useMemo(() => {
    if (isConnected) {
      return (
        <Alert
          message="Printer is ready"
          description={status}
          type="success"
          showIcon
        />
      );
    }
    return (
      <Alert
        message="Printer not connected"
        description="Connect via USB or Bluetooth to continue."
        type="warning"
        showIcon
      />
    );
  }, [isConnected, status]);

  return (
    <Modal
      title="Thermal Printer"
      open={isModalOpen}
      onCancel={closeModal}
      footer={null}
      destroyOnClose={false}
      width={520}
    >
      <Space direction="vertical" size="large" className="w-100">
        {connectionNotice}

        <div>
          <Text strong>Connection Mode</Text>
          <Radio.Group
            className="d-block mt-2"
            value={mode}
            onChange={e => setMode(e.target.value)}
            disabled={isConnected}
            buttonStyle="solid"
          >
            <Radio.Button value="usb">
              <UsbOutlined className="me-2" />
              USB
            </Radio.Button>
            <Radio.Button value="ble">
              <Bluetooth className="me-2" />
              Bluetooth
            </Radio.Button>
          </Radio.Group>
        </div>

        {mode === 'usb' && (
          <Space direction="vertical" size="middle" className="w-100">
            <Select
              value={baudRate}
              onChange={value => setBaudRate(value)}
              options={[
                { value: '9600', label: '9600 baud' },
                { value: '115200', label: '115200 baud' },
              ]}
              style={{ width: 180 }}
              disabled={isConnected}
            />
            <Space>
              <Switch
                checked={flowControl}
                onChange={setFlowControl}
                disabled={isConnected}
              />
              <Text type="secondary">Hardware flow control</Text>
            </Space>
          </Space>
        )}

        <Space size="large">
          <Button
            type="primary"
            icon={mode === 'usb' ? <UsbOutlined /> : <Bluetooth/>}
            loading={isConnecting}
            onClick={mode === 'usb' ? connectUSB : connectBLE}
            disabled={isConnected}
          >
            {mode === 'usb' ? 'Connect USB' : 'Scan BLE'}
          </Button>

          {isConnected && (
            <Button
              danger
              icon={<DisconnectOutlined />}
              onClick={disconnect}
            >
              Disconnect
            </Button>
          )}
        </Space>

        <Divider />

        <div>
          <Space align="center" size="small" className="mb-2">
            <LinkOutlined />
            <Text strong>Activity</Text>
          </Space>
          <List
            size="small"
            bordered
            dataSource={logs}
            locale={{ emptyText: 'No activity yet' }}
            renderItem={item => (
              <List.Item>
                <Tag
                  color={
                    item.type === 'error'
                      ? 'red'
                      : item.type === 'success'
                      ? 'green'
                      : item.type === 'tx'
                      ? 'blue'
                      : 'default'
                  }
                  className="me-2"
                >
                  {item.type}
                </Tag>
                <Text>{item.message}</Text>
              </List.Item>
            )}
            style={{ maxHeight: 220, overflowY: 'auto' }}
          />
        </div>
      </Space>
    </Modal>
  );
});

POSPrinterManager.displayName = 'POSPrinterManager';

export default POSPrinterManager;

