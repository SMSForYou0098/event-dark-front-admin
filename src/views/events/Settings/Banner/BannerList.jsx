import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Space,
  Tooltip,
  message,
  Modal,
  Tag,
  Image,
  Card,
  Col,
  Row,
  Switch,
  Typography,
  Select,
  Badge,
  Radio,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UsbOutlined,
  LinkOutlined,
  DisconnectOutlined,
  CodeOutlined,
  ClearOutlined,
  SendOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import {
  useBanners,
  useDeleteBanner,
} from '../hooks/useBanners';
import Utils from 'utils';
import BannerForm from './BannerForm';
import DataTable from 'views/events/common/DataTable';
import { Bluetooth } from 'lucide-react';
import Title from 'antd/es/skeleton/Title';
import { PERMISSIONS } from 'constants/PermissionConstant';
import PermissionChecker from 'layouts/PermissionChecker';

const BannerList = () => {
  const [deleteModal, setDeleteModal] = useState({ visible: false, id: null });
  const [bannerModal, setBannerModal] = useState({
    visible: false,
    mode: 'create',
    id: null,
    data: null
  });

  // Fetch banners
  const { data: bannersData = [], isLoading, refetch, error } = useBanners();

  // Delete mutation
  const { mutate: deleteBanner, isPending: isDeleting } = useDeleteBanner({
    onSuccess: (res) => {
      message.success(res?.message || 'Banner deleted successfully');
      cancelDeleteModal();
      refetch();
    },
    onError: (error) => {
      message.error(Utils.getErrorMessage(error));
    },
  });

  // Handle delete modal
  const showDeleteModal = (id) => {
    setDeleteModal({ visible: true, id });
  };

  const cancelDeleteModal = () => {
    setDeleteModal({ visible: false, id: null });
  };

  const confirmDelete = () => {
    deleteBanner(deleteModal.id);
  };

  // Handle banner modal (create/edit)
  const showCreateModal = () => {
    setBannerModal({ visible: true, mode: 'create', id: null, data: null });
  };

  const showEditModal = (record) => {
    setBannerModal({
      visible: true,
      mode: 'edit',
      id: record.id,
      data: record
    });
  };

  const closeBannerModal = () => {
    setBannerModal({ visible: false, mode: 'create', id: null, data: null });
  };

  // Handle banner form success
  const handleBannerSuccess = () => {
    closeBannerModal();
    refetch();
  };

  // Table columns
  const columns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Image',
      dataIndex: 'images',
      key: 'images',
      width: 120,
      render: (image) => (
        <Image
          src={image}
          alt="Banner"
          width={80}
          height={50}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          preview={{
            mask: <EyeOutlined />,
          }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      searchable: true,
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type) => {
        const colorMap = {
          main: 'blue',
          organization: 'green',
          category: 'purple',
        };
        return (
          <Tag color={colorMap[type] || 'default'}>
            {type ? type.toUpperCase() : '-'}
          </Tag>
        );
      },
      filters: [
        { text: 'Main', value: 'main' },
        { text: 'Organization', value: 'organization' },
        { text: 'Category', value: 'category' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Category',
      dataIndex: ['category', 'title'],
      key: 'category',
      render: (categoryTitle) => categoryTitle || '-',
    },
    // {
    //   title: 'Event Key',
    //   dataIndex: 'event_key',
    //   key: 'event_key',
    //   searchable: true,
    //   render: (key) => key ? <Tag>{key}</Tag> : '-',
    // },
    // {
    //   title: 'Event ID',
    //   dataIndex: 'event_id',
    //   key: 'event_id',
    //   width: 100,
    //   render: (id) => id || '-',
    // },
    {
      title: 'Button Text',
      dataIndex: 'button_text',
      key: 'button_text',
      render: (text) => text ? <Tag color="blue">{text}</Tag> : '-',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          {text ? text.substring(0, 50) + (text.length > 50 ? '...' : '') : '-'}
        </Tooltip>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => showDeleteModal(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PermissionChecker permission={PERMISSIONS.VIEW_BANNERS}>
      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Banner"
        open={deleteModal.visible}
        onOk={confirmDelete}
        onCancel={cancelDeleteModal}
        okText="Yes, delete it!"
        cancelText="Cancel"
        confirmLoading={isDeleting}
        centered
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this banner? You won't be able to revert this!</p>
      </Modal>

      {/* Banner Form Modal */}

      <BannerForm
        mode={bannerModal.mode}
        id={bannerModal.id}
        bannerData={bannerModal.data}
        onSuccess={handleBannerSuccess}
        onCancel={closeBannerModal}
        visible={bannerModal.visible}
      />

      {/* DataTable */}
      <DataTable
        title="Banners Management"
        data={bannersData}
        columns={columns}
        loading={isLoading}
        error={error}
        showRefresh={true}
        onRefresh={refetch}
        showSearch={true}
        enableSearch={true}
        emptyText="No banners found"
        extraHeaderContent={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showCreateModal}
          >
            New Banner
          </Button>
        }
        tableProps={{
          rowKey: 'id',
          scroll: { x: 1400 },
        }}
      />
    </PermissionChecker>
  );
};
// const BannerList = () => {
//   const [mode, setMode] = useState('usb'); // 'usb' or 'ble'
//   const [status, setStatus] = useState('Disconnected');
//   const [isConnected, setIsConnected] = useState(false);

//   // Connection Objects
//   const [usbPort, setUsbPort] = useState(null);
//   const [usbWriter, setUsbWriter] = useState(null);
//   const [bleDevice, setBleDevice] = useState(null);
//   const [bleChar, setBleChar] = useState(null);

//   // UI State
//   const [inputData, setInputData] = useState('');
//   const [baudRate, setBaudRate] = useState(9600);
//   const [flowControl, setFlowControl] = useState(false);
//   const [logs, setLogs] = useState([]);
//   const logEndRef = useRef(null);

//   // --- Logging ---
//   const addLog = (type, msg) => {
//       const time = new Date().toLocaleTimeString([], { hour12: false });
//       setLogs(prev => [...prev, { id: Date.now(), time, type, msg }]);
//   };

//   useEffect(() => {
//       logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [logs]);

//   // --- USB Logic ---
//   const connectUSB = async () => {
//       if (!("serial" in navigator)) return addLog('error', 'Web Serial not supported in this browser.');

//       try {
//           addLog('info', 'Requesting USB Device...');
//           const port = await navigator.serial.requestPort();
//           await port.open({ baudRate: parseInt(baudRate), flowControl: flowControl ? 'hardware' : 'none' });

//           // Use a plain TextEncoder + writer so it works in all modern browsers.
//           // Some browsers (like Safari/Firefox) do not support TextEncoderStream.
//           const writer = port.writable.getWriter();

//           setUsbPort(port);
//           setUsbWriter(writer);
//           setIsConnected(true);
//           setStatus('USB Connected');
//           addLog('success', 'USB Connection Established');
//       } catch (err) {
//           addLog('error', `USB Error: ${err.message}`);
//       }
//   };

//   // --- BLE Logic ---
//   const connectBLE = async () => {
//       if (!navigator.bluetooth) return addLog('error', 'Web Bluetooth not supported.');

//       try {
//           addLog('info', 'Scanning for BLE Devices...');
//           // We request all devices to ensure we find it, but we list critical services to gain access to them
//           const device = await navigator.bluetooth.requestDevice({
//               acceptAllDevices: true,
//               optionalServices: [
//                   '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer
//                   'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Custom
//                   '00001101-0000-1000-8000-00805f9b34fb', // Serial
//                   'generic_access',
//                   'device_information' // Standard Info Service
//               ]
//           });

//           addLog('info', `Selected: ${device.name || 'Unknown Device'}`);
//           device.addEventListener('gattserverdisconnected', disconnect);

//           addLog('tx', 'Connecting to GATT Server...');
//           const server = await device.gatt.connect();
//           addLog('success', 'GATT Connected. Discovering Services...');

//           const services = await server.getPrimaryServices();

//           let foundChar = null;

//           // 1. Service Scan Loop
//           for (const service of services) {
//               const uuid = service.uuid;
//               const isPrinter = uuid.includes('18f0');
//               addLog('info', `Found Service: ${uuid.substring(0,8)}... ${isPrinter ? '(PRINTER)' : ''}`);

//               try {
//                   const chars = await service.getCharacteristics();
//                   for (const char of chars) {
//                       // Check properties
//                       const props = [];
//                       if(char.properties.write) props.push('WRITE');
//                       if(char.properties.writeWithoutResponse) props.push('WRITE_NO_RESP');
//                       if(char.properties.read) props.push('READ');

//                       // addLog('info', `  -> Char: ${char.uuid.substring(0,8)}... [${props.join(',')}]`);

//                       // Look for Write capability
//                       if (!foundChar && (char.properties.write || char.properties.writeWithoutResponse)) {
//                           foundChar = char;
//                           addLog('success', `  >>> Locked onto WRITE Characteristic: ${char.uuid.substring(0,8)}...`);
//                       }

//                       // 2. "Back Test": Try to Read Device Info (if readable)
//                       if (char.properties.read && (char.uuid.includes('2a29') || char.uuid.includes('2a00'))) {
//                           try {
//                               const value = await char.readValue();
//                               const decoder = new TextDecoder('utf-8');
//                               const info = decoder.decode(value);
//                               addLog('success', `  >>> VERIFIED DEVICE INFO: "${info}"`);
//                           } catch(e) { /* ignore read errors */ }
//                       }
//                   }
//               } catch(err) {
//                   addLog('warn', `  Cannot access chars in service ${uuid.substring(0,8)}`);
//               }
//           }

//           if (!foundChar) throw new Error('No writable characteristic found. Is this a printer?');

//           setBleDevice(device);
//           setBleChar(foundChar);
//           setIsConnected(true);
//           setStatus(`BLE: ${device.name}`);
//           addLog('success', 'READY TO PRINT');

//       } catch (err) {
//           addLog('error', `BLE Error: ${err.message}`);
//       }
//   };

//   // --- Disconnect ---
//   const disconnect = async () => {
//       try {
//           if (mode === 'usb') {
//               if (usbWriter) { await usbWriter.close(); setUsbWriter(null); }
//               if (usbPort) { await usbPort.close(); setUsbPort(null); }
//           } else {
//               if (bleDevice && bleDevice.gatt.connected) { bleDevice.gatt.disconnect(); }
//               setBleDevice(null);
//               setBleChar(null);
//           }
//           setIsConnected(false);
//           setStatus('Disconnected');
//           addLog('info', 'Disconnected');
//       } catch (err) {
//           addLog('error', `Disconnect Error: ${err.message}`);
//       }
//   };

//   // --- Sending Engine ---
//   const sendPayload = async (data, isText = true) => {
//       if (!isConnected) return addLog('error', 'Not Connected');

//       try {
//           addLog('tx', `Sending ${isText ? 'Text' : 'Binary'}...`);

//           if (mode === 'usb') {
//               // USB Send (encode to bytes before writing)
//               const encoder = new TextEncoder();
//               const encodedData = isText ? encoder.encode(data + "\n") : data;
//               await usbWriter.write(encodedData);
//           } else {
//               // BLE Send (Requires Chunking)
//               const encoder = new TextEncoder();
//               // If isText is true, data is string. If false, data is Uint8Array
//               const encodedData = isText ? encoder.encode(data + '\n') : data;

//               const CHUNK_SIZE = 100; // Safe for most BLE
//               for (let i = 0; i < encodedData.byteLength; i += CHUNK_SIZE) {
//                   const chunk = encodedData.slice(i, i + CHUNK_SIZE);
//                   await bleChar.writeValue(chunk);
//                   // Brief pause to prevent buffer overflow on printer
//                   await new Promise(r => setTimeout(r, 20)); 
//               }
//           }
//           addLog('success', 'Data Sent');
//       } catch (err) {
//           addLog('error', `Send Failed: ${err.message}`);
//       }
//   };

//   const sendHex = async () => {
//       if (!inputData) return;
//       try {
//           const cleanHex = inputData.replace(/\s+/g, '');
//           if (cleanHex.length % 2 !== 0) throw new Error("Invalid Hex");

//           const byteArray = new Uint8Array(cleanHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

//           if (mode === 'usb') {
//               // USB can write raw bytes directly
//               await usbWriter.write(byteArray);
//           } else {
//               // BLE handles raw bytes natively
//               await sendPayload(byteArray, false);
//           }
//           addLog('success', 'Hex Sent');
//       } catch (e) {
//           addLog('error', e.message);
//       }
//   };

//   // --- Test Templates ---
//   const testPrint = (lang) => {
//       let cmd = "";
//       if (lang === 'ESC') cmd = "\x1B\x40\x1B\x61\x01GYT TESTING\n\x1B\x61\x00- ESC/POS OK -\n\n\n";
//       if (lang === 'TSPL') cmd = "SIZE 48 mm,30 mm\r\nCLS\r\nTEXT 20,20,\"3\",0,1,1,\"GYT TSPL OK\"\r\nPRINT 1\r\n";
//       if (lang === 'ZPL') cmd = "^XA^FO20,20^ADN,36,20^FDGYT ZPL OK^FS^XZ";
//       if (lang === 'CPCL') cmd = "! 0 200 200 210 1\r\nTEXT 4 0 30 40 GYT CPCL OK\r\nFORM\r\nPRINT\r\n";
//       setInputData(cmd);
//       sendPayload(cmd, true);
//   };
//   const getLogColor = (type) => {
//     switch(type) {
//       case 'error': return 'red';
//       case 'success': return 'green';
//       case 'tx': return 'blue';
//       default: return 'default';
//     }
//   };
//   return (
//     <div className="min-vh-100 p-3" style={{ background: '#141414' }}>

//     {/* Header */}
//     <Card className="mb-4" style={{ background: '#1f1f1f', borderColor: '#303030' }}>
//       <Row justify="space-between" align="middle" gutter={[16, 16]}>
//         <Col>
//           <Space size="middle">
//             <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 48, height: 48, background: '#722ed1' }}>
//               <PrinterOutlined style={{ fontSize: 24, color: '#fff' }} />
//             </div>
//             <div>
//               <Title level={4} style={{ margin: 0, color: '#fff' }}>GYT Label Printer Testing</Title>
//               <Space size="small">
//                 <Badge status={isConnected ? 'success' : 'error'} />
//                 <Typography.Text type="secondary" style={{ fontSize: 12 }}>{status}</Typography.Text>
//               </Space>
//             </div>
//           </Space>
//         </Col>
//         <Col>
//           <Radio.Group 
//             value={mode} 
//             onChange={e => !isConnected && setMode(e.target.value)}
//             disabled={isConnected}
//             buttonStyle="solid"
//           >
//             <Radio.Button value="usb"><UsbOutlined className="me-2" />USB</Radio.Button>
//             <Radio.Button value="ble"><Bluetooth className="me-2" />BLE</Radio.Button>
//           </Radio.Group>
//         </Col>
//       </Row>
//     </Card>

//     <Row gutter={[16, 16]}>

//       {/* Left Column */}
//       <Col xs={24} lg={16}>
//         <Space direction="vertical" size="middle" className="w-100">

//           {/* Connection Panel */}
//           {!isConnected ? (
//             <Card style={{ background: '#1f1f1f', borderColor: '#303030' }}>
//               <div className="text-center">
//                 <Tag color={mode === 'usb' ? 'purple' : 'blue'} className="mb-3">
//                   {mode === 'usb' ? 'USB OTG Connection' : 'Bluetooth Low Energy'}
//                 </Tag>

//                 {mode === 'usb' && (
//                   <Space className="mb-3 d-flex justify-content-center">
//                     <Select
//                       value={baudRate} 
//                       onChange={setBaudRate}
//                       style={{ width: 140 }}
//                       options={[
//                         { value: '9600', label: '9600 Baud' },
//                         { value: '115200', label: '115200 Baud' }
//                       ]}
//                     />
//                     <Space>
//                       <Switch checked={flowControl} onChange={setFlowControl} size="small" />
//                       <Typography.Text type="secondary">Flow Control</Typography.Text>
//                     </Space>
//                   </Space>
//                 )}

//                 <Button 
//                   type="primary"
//                   size="large"
//                   block
//                   icon={mode === 'usb' ? <UsbOutlined /> : <Bluetooth />}
//                   onClick={mode === 'usb' ? connectUSB : connectBLE}
//                   style={{ 
//                     height: 56,
//                     background: mode === 'usb' ? '#722ed1' : '#1677ff'
//                   }}
//                 >
//                   {mode === 'usb' ? 'Connect via USB' : 'Scan BLE Devices'}
//                 </Button>

//                 <Typography.Text type="secondary" className="d-block mt-2" style={{ fontSize: 11 }}>
//                   {mode === 'usb' ? 'Connect printer via USB OTG cable.' : 'Note: Classic Bluetooth printers will NOT appear here.'}
//                 </Typography.Text>
//               </div>
//             </Card>
//           ) : (
//             <Card style={{ background: '#162312', borderColor: '#274916' }}>
//               <Row justify="space-between" align="middle">
//                 <Col>
//                   <Space>
//                     <LinkOutlined style={{ color: '#52c41a' }} />
//                     <Typography.Text style={{ color: '#52c41a' }} strong>System Online</Typography.Text>
//                   </Space>
//                 </Col>
//                 <Col>
//                   <Button danger icon={<DisconnectOutlined />} onClick={disconnect}>
//                     Disconnect
//                   </Button>
//                 </Col>
//               </Row>
//             </Card>
//           )}

//           {/* Quick Test Buttons */}
//           <Card 
//             title={<Typography.Text type="secondary"><CodeOutlined className="me-2" />Quick Test</Typography.Text>}
//             style={{ background: '#1f1f1f', borderColor: '#303030' }}
//             headStyle={{ borderColor: '#303030' }}
//           >
//             <Row gutter={[12, 12]}>
//               {['ESC/POS', 'TSPL', 'ZPL', 'CPCL'].map(type => (
//                 <Col xs={12} md={6} key={type}>
//                   <Button 
//                     block 
//                     disabled={!isConnected}
//                     onClick={() => testPrint(type)}
//                   >
//                     Test {type}
//                   </Button>
//                 </Col>
//               ))}
//             </Row>
//           </Card>

//           {/* Command Editor */}
//           <Card 
//             title={<Typography.Text type="secondary">Command Editor</Typography.Text>}
//             extra={<Button type="link" danger size="small" icon={<ClearOutlined />} onClick={() => setInputData('')}>Clear</Button>}
//             style={{ background: '#1f1f1f', borderColor: '#303030' }}
//             headStyle={{ borderColor: '#303030' }}
//             bodyStyle={{ padding: 0 }}
//           >
//             <TextArea
//               value={inputData}
//               onChange={e => setInputData(e.target.value)}
//               placeholder="Enter raw commands here..."
//               rows={10}
//               style={{ 
//                 background: '#141414', 
//                 borderRadius: 0,
//                 border: 'none',
//                 borderBottom: '1px solid #303030',
//                 fontFamily: 'monospace',
//                 resize: 'none'
//               }}
//             />
//             <div className="p-3">
//               <Row gutter={12}>
//                 <Col span={12}>
//                   <Button 
//                     block 
//                     size="large"
//                     disabled={!isConnected}
//                     icon={<SendOutlined />}
//                     onClick={sendPayload}
//                   >
//                     Send Text
//                   </Button>
//                 </Col>
//                 <Col span={12}>
//                   <Button 
//                     block 
//                     size="large"
//                     type="primary"
//                     danger
//                     disabled={!isConnected}
//                     icon={<SendOutlined />}
//                     onClick={sendHex}
//                   >
//                     Send HEX
//                   </Button>
//                 </Col>
//               </Row>
//             </div>
//           </Card>

//         </Space>
//       </Col>

//       {/* Right Column - Console */}
//       <Col xs={24} lg={8}>
//         <Card 
//           title={
//             <Space>
//               <CodeOutlined style={{ color: '#ff4d4f' }} />
//               <Typography.Text style={{ color: '#ff4d4f' }}>System Log</Typography.Text>
//             </Space>
//           }
//           style={{ background: '#1f1f1f', borderColor: '#303030', height: '100%' }}
//           headStyle={{ borderColor: '#303030', background: '#1a1a1a' }}
//           bodyStyle={{ 
//             height: 480, 
//             overflowY: 'auto', 
//             background: '#0d0d0d',
//             padding: 12
//           }}
//         >
//           {logs.length === 0 && (
//             <Typography.Text type="secondary" italic>System Ready...</Typography.Text>
//           )}
//           {logs.map(log => (
//             <div key={log.id} className="mb-2 ps-2" style={{ borderLeft: '2px solid #303030' }}>
//               <Typography.Text type="secondary" style={{ fontSize: 10 }} className="me-2">{log.time}</Typography.Text>
//               <Typography.Text style={{ color: getLogColor(log.type) === 'default' ? '#8c8c8c' : undefined }} type={getLogColor(log.type) !== 'default' ? undefined : 'secondary'}>
//                 <Tag color={getLogColor(log.type)} style={{ fontSize: 11 }}>{log.msg}</Tag>
//               </Typography.Text>
//             </div>
//           ))}
//           <div ref={logEndRef} />
//         </Card>
//       </Col>

//     </Row>
//   </div>
// );
// }

export default BannerList;