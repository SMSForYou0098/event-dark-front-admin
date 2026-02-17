import React, { useState, useRef, forwardRef, useImperativeHandle, useCallback, useEffect, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Drawer, Button, Space, Segmented, Radio, message } from 'antd';
import { UserOutlined, TeamOutlined, SettingOutlined, PrinterOutlined } from '@ant-design/icons';
import { usePrinter } from '../../../../Context/PrinterContext';
import AttendeeCard from './AttendeeCard';
import ActionButtons from './ActionButtons';
import './AttendeesPrint.css';
import PrinterConfigDrawer from 'views/events/label_printing/components/PrinterConfigDrawer';
import PrintSettingsDrawer from 'views/events/label_printing/components/PrintSettingsDrawer';
import { generateTSPLFromExcel, generateZPLFromExcel, generateCPCLFromExcel } from 'views/events/Bookings/pos/utils/printerCommands';

// LocalStorage helpers
const FIELD_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const ATTENDEES_PRINT_SIZE_KEY = 'attendees_print_size';
const ATTENDEES_PRINT_PRINTER_TYPE_KEY = 'attendees_print_printer_type';

const setWithExpiry = (key, value, ttlMs) => {
  const now = Date.now();
  localStorage.setItem(key, JSON.stringify({ value, expiry: now + ttlMs }));
};

const getWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;
  try {
    const item = JSON.parse(itemStr);
    if (!item.expiry || Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch (e) {
    localStorage.removeItem(key);
    return null;
  }
};

// Helper function to detect if device is mobile
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768;
};

// Dimension options (width × height in inches)
const DIMENSION_OPTIONS = [
  { label: '2" × 1"', value: '2x1', width: 2, height: 1 },
  { label: '2" × 2"', value: '2x2', width: 2, height: 2 },
  { label: '3" × 2"', value: '3x2', width: 3, height: 2 },
  { label: '4" × 3"', value: '4x3', width: 4, height: 3 },
  { label: '4" × 6"', value: '4x6', width: 4, height: 6 },
  { label: '5" × 4"', value: '5x4', width: 5, height: 4 },
  { label: '6" × 4"', value: '6x4', width: 6, height: 4 },
];

// Fields to exclude from dynamic extraction
const EXCLUDED_FIELDS = [
  'id', 'created_at', 'updated_at', 'deleted_at', 'pivot', 'photo',
  'booking_id', 'event_id', 'user_id', 'ticket_id', 'password',
  'remember_token', 'email_verified_at', 'otp', 'otp_expires_at',
  'fcm_token', 'device_token', 'api_token', 'role', 'role_id',
  'is_verified', 'is_active', 'status', 'permissions'
];

// Convert snake_case key to Title Case label
const toLabel = (key) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Extract available fields dynamically from data objects
const extractDynamicFields = (dataArray) => {
  if (!dataArray?.length) return [];
  const keySet = new Set();
  dataArray.forEach((item) => {
    if (item && typeof item === 'object') {
      Object.keys(item).forEach((key) => {
        if (
          !EXCLUDED_FIELDS.includes(key) &&
          item[key] !== null &&
          item[key] !== undefined &&
          typeof item[key] !== 'object'
        ) {
          keySet.add(key);
        }
      });
    }
  });
  return Array.from(keySet).map((key) => ({
    key,
    label: toLabel(key),
    defaultEnabled: false,
    defaultSize: key === 'name' ? 1.5 : 1.0,
  }));
};

const AttendeesPrint = forwardRef(({
  attendeesList,
  eventData,
  ticket,
  bookings,
  primaryColor = '#B51515'
}, ref) => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState('2x2');
  const [selectedFields, setSelectedFields] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const [printerType, setPrinterType] = useState('tspl');
  const [printDataSource, setPrintDataSource] = useState('attendee');
  const [showConfig, setShowConfig] = useState(false);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [fontFamily, setFontFamily] = useState('Arial, sans-serif');
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1.0);
  const [lineGapMultiplier, setLineGapMultiplier] = useState(1.0);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [marginMultiplier, setMarginMultiplier] = useState(1.0);
  const [fieldFontSizes, setFieldFontSizes] = useState({});
  const printRef = useRef(null);
  const modeInitializedRef = useRef(false);

  // Printer context
  const {
    connectionMode,
    setConnectionMode,
    isConnected,
    deviceName,
    status: printerStatus,
    connectUSB,
    connectBluetooth,
    disconnect,
    sendRawBytes,
  } = usePrinter();

  // Load saved settings from localStorage
  useEffect(() => {
    const size = getWithExpiry(ATTENDEES_PRINT_SIZE_KEY);
    const savedPrinterType = getWithExpiry(ATTENDEES_PRINT_PRINTER_TYPE_KEY);

    if (size) setSelectedDimension(size);
    if (savedPrinterType) setPrinterType(savedPrinterType);
  }, []);

  // Dynamically extract available fields based on selected data source
  const userData = useMemo(() => bookings?.user ? [bookings.user] : [], [bookings]);

  const availableFields = useMemo(() => {
    if (printDataSource === 'user') {
      return extractDynamicFields(userData);
    }
    return extractDynamicFields(attendeesList);
  }, [printDataSource, attendeesList, userData]);

  // The data to print based on selected source
  const printableData = useMemo(() => {
    return printDataSource === 'user' ? userData : attendeesList;
  }, [printDataSource, attendeesList, userData]);

  // Reset selected fields when data source changes (available fields change)
  useEffect(() => {
    setSelectedFields([]);
  }, [printDataSource]);

  // Get selected dimension
  const selectedDim = DIMENSION_OPTIONS.find(d => d.value === selectedDimension) || DIMENSION_OPTIONS[0];

  // Browser print handler
  const handleBrowserPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Attendees-${eventData?.name || 'Event'}`,
    onBeforeGetContent: () => {
      document.body.classList.add('printing-attendees');
    },
    onAfterPrint: () => {
      document.body.classList.remove('printing-attendees');
    },
    pageStyle: `
      @page {
        size: ${selectedDim.width}in ${selectedDim.height}in;
        margin: 0;
      }
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        body.printing-attendees * {
          visibility: hidden !important;
        }
        body.printing-attendees .attendees-print-body,
        body.printing-attendees .attendees-print-body * {
          visibility: visible !important;
          display: block !important;
          color: black !important;
          background: white !important;
        }
        .attendees-print-body {
          display: block !important;
          visibility: visible !important;
          position: relative !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
        }
        .attendee-badge {
          display: flex !important;
          visibility: visible !important;
          color: black !important;
          background: white !important;
          border: 3px solid black !important;
        }
        .badge-content,
        .badge-footer,
        .badge-row,
        .badge-label,
        .badge-value,
        .badge-footer-text {
          visibility: visible !important;
          display: block !important;
          color: black !important;
        }
      }
    `
  });



  // Handle printer type change
  const handlePrinterTypeChange = (type) => {
    setPrinterType(type);
    setWithExpiry(ATTENDEES_PRINT_PRINTER_TYPE_KEY, type, FIELD_TTL);
  };

  // Save & connect handler for PrinterConfigDrawer
  const handleSavePrintSettings = async () => {
    if (connectionMode === 'browser') {
      setShowConfig(false);
      return;
    }
    try {
      message.loading({ content: 'Connecting to printer...', key: 'connect' });
      let success = false;
      if (connectionMode === 'usb') {
        success = await connectUSB();
      } else {
        success = await connectBluetooth();
      }
      if (success) {
        message.success({ content: 'Printer connected!', key: 'connect', duration: 1 });
      } else {
        message.error({ content: 'Failed to connect to printer', key: 'connect' });
      }
    } catch (err) {
      message.error({ content: 'Connection error: ' + err.message, key: 'connect' });
    }
    setShowConfig(false);
  };

  // Generate print bytes for all items using shared printer command utilities
  const generatePrintBytes = useCallback(async () => {
    const fieldNames = selectedFields;
    // Use fontSizeMultiplier directly — controlled by PrintSettingsDrawer "Global Font Size" %
    const fSizeMultiplier = fontSizeMultiplier;
    const allBytes = [];

    for (const item of (printableData || [])) {
      let bytes;
      switch (printerType) {
        case 'zpl':
          bytes = await generateZPLFromExcel(item, fieldNames, selectedDimension, fSizeMultiplier, fieldFontSizes, lineGapMultiplier);
          break;
        case 'cpcl':
          bytes = await generateCPCLFromExcel(item, fieldNames, selectedDimension, fSizeMultiplier, fieldFontSizes, lineGapMultiplier);
          break;
        case 'tspl':
        default:
          bytes = await generateTSPLFromExcel(item, fieldNames, selectedDimension, fSizeMultiplier, fieldFontSizes, lineGapMultiplier, marginMultiplier);
          break;
      }
      allBytes.push(...bytes);
    }

    return new Uint8Array(allBytes);
  }, [printableData, selectedFields, selectedDimension, fontSizeMultiplier, printerType, fieldFontSizes, lineGapMultiplier, marginMultiplier]);

  // Connect and print to thermal printer
  const handleThermalPrint = useCallback(async () => {
    try {
      if (!isConnected) {
        message.loading({ content: 'Connecting to printer...', key: 'connect' });

        let success = false;
        if (connectionMode === 'usb') {
          success = await connectUSB();
        } else {
          success = await connectBluetooth();
        }

        if (!success) {
          message.error({ content: 'Failed to connect to printer', key: 'connect' });
          throw new Error('Failed to connect to printer');
        }

        message.success({ content: 'Printer connected!', key: 'connect', duration: 1 });
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setIsPrinting(true);
      message.loading({ content: 'Generating print data...', key: 'print' });

      const printerBytes = await generatePrintBytes();
      await sendRawBytes(printerBytes);

      message.success({ content: 'Print sent successfully!', key: 'print' });
    } catch (err) {
      console.error('Print error:', err);
      message.error({ content: 'Failed to print: ' + err.message, key: 'print' });
    } finally {
      setIsPrinting(false);
    }
  }, [isConnected, connectionMode, connectUSB, connectBluetooth, generatePrintBytes, sendRawBytes]);

  // Handle disconnect
  const handleDisconnect = async () => {
    await disconnect();
    message.info('Printer disconnected');
  };

  // Set connection mode on mount
  useEffect(() => {
    if (!modeInitializedRef.current) {
      if (isMobile) {
        setConnectionMode('ble');
      } else {
        // PC: Default to USB, but user can change to Bluetooth
        setConnectionMode('usb');
      }
      modeInitializedRef.current = true;
    } else if (isMobile) {
      // If device changes to mobile, switch to Bluetooth
      setConnectionMode('ble');
    }
  }, [isMobile, setConnectionMode]);

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show modal
  const showModal = () => {
    setIsModalOpen(true);
  };

  // Close modal
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // Handle browser print
  const handleBrowserPrintClick = () => {
    handleBrowserPrint();
  };

  // Handle thermal print
  const handleThermalPrintClick = () => {
    handleThermalPrint();
  };

  // Expose functions to parent
  useImperativeHandle(ref, () => ({
    handlePrintAllAttendees: showModal
  }));


  return (
    <>
      {/* Drawer - replaces Modal */}
      <Drawer
        title={
          <Space size="small" className="d-flex align-items-center">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle me-2"
              style={{
                width: '36px',
                height: '36px',
                background: `linear-gradient(135deg, ${primaryColor}, rgba(181, 21, 21, 0.7))`,
                boxShadow: `0 0 15px rgba(181, 21, 21, 0.4)`
              }}
            >
              <UserOutlined style={{ color: '#fff', fontSize: '18px' }} />
            </div>
            <span className="fs-5 fw-bold text-white">Attendees List - {eventData?.name || 'Event'}</span>
          </Space>
        }
        open={isModalOpen}
        onClose={handleCancel}
        placement={isMobile ? 'bottom' : 'right'}
        width={isMobile ? '95%' : 700}
        height={isMobile ? '85vh' : undefined}
        className={isMobile ? 'attendees-print-modal-mobile' : 'attendees-print-modal'}
        bodyStyle={{
          padding: isMobile ? '12px' : '16px',
          maxHeight: isMobile ? 'calc(100vh - 200px)' : 'calc(100vh - 300px)',
          overflowY: 'auto'
        }}
        headerStyle={{
          padding: isMobile ? '12px 16px' : '16px 24px'
        }}
        footerStyle={{
          padding: isMobile ? '12px' : '16px'
        }}
        footer={
          <Space direction="vertical" size="middle" className="w-100">
            <Space className="w-100" wrap>
              <Button
                icon={<PrinterOutlined />}
                onClick={() => setShowConfig(true)}
                size="small"
              >
                Printer Config
              </Button>
              <Button
                icon={<SettingOutlined />}
                onClick={() => setShowPrintSettings(true)}
                size="small"
              >
                Print Settings
              </Button>
            </Space>

            <ActionButtons
              onClose={handleCancel}
              onDisconnect={handleDisconnect}
              onBrowserPrint={handleBrowserPrintClick}
              onThermalPrint={handleThermalPrintClick}
              isConnected={isConnected}
              isPrinting={isPrinting}
              isMobile={isMobile}
            />
          </Space>
        }
      >
        {/* Modal body content */}
        <div>
          {/* Data Source Toggle */}
          <div className="mb-3">
            <Segmented
              block
              value={printDataSource}
              onChange={setPrintDataSource}
              options={[
                {
                  label: (
                    <Space size={4}>
                      <TeamOutlined />
                      <span>Attendee Data</span>
                    </Space>
                  ),
                  value: 'attendee',
                },
                {
                  label: (
                    <Space size={4}>
                      <UserOutlined />
                      <span>User Data</span>
                    </Space>
                  ),
                  value: 'user',
                },
              ]}
            />
          </div>

          {/* Label Size Selection */}
          <div
            className="mb-3 p-3 rounded"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="mb-2 fw-semibold small text-white d-flex align-items-center">
              <PrinterOutlined className="me-2" style={{ color: primaryColor }} />
              Label Size:
            </div>
            <Radio.Group
              value={selectedDimension}
              onChange={(e) => {
                setSelectedDimension(e.target.value);
                setWithExpiry(ATTENDEES_PRINT_SIZE_KEY, e.target.value, FIELD_TTL);
              }}
              buttonStyle="solid"
              size="small"
            >
              {DIMENSION_OPTIONS.map(opt => (
                <Radio.Button key={opt.value} value={opt.value}>
                  {opt.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>

          <div
            className="mb-4 p-3 rounded"
            style={{
              background: 'rgba(181, 21, 21, 0.15)',
              border: '1px solid rgba(181, 21, 21, 0.3)'
            }}
          >
            <div className="small text-white-50 mb-2 d-flex justify-content-between align-items-center">
              <span>Printing:</span>
              <span className="fw-bold text-white ms-2" style={{ fontSize: '14px' }}>
                {printDataSource === 'user' ? 'User Data' : 'Attendee Data'}
              </span>
            </div>
            <div className="small text-white-50 mb-2 d-flex justify-content-between align-items-center">
              <span>Total Items:</span>
              <span className="fw-bold text-white ms-2" style={{ fontSize: '16px' }}>
                {printableData?.length || 0}
              </span>
            </div>
            <div className="small text-white-50 mb-2 d-flex justify-content-between align-items-center">
              <span>Selected Fields:</span>
              <span className="fw-bold text-white ms-2" style={{ fontSize: '14px' }}>
                {selectedFields.length || 'None'}
              </span>
            </div>
            <div className="small text-white-50 d-flex justify-content-between align-items-center">
              <span>Ticket:</span>
              <span className="fw-semibold text-white ms-2">
                {ticket?.name || 'N/A'}
              </span>
            </div>
          </div>

          <div className="overflow-auto pe-1" style={{ maxHeight: isMobile ? '40vh' : '50vh' }}>
            {printableData?.map((item, index) => (
              <AttendeeCard
                key={index}
                attendee={item}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        </div>
      </Drawer>

      {/* Printer Configuration Drawer */}
      <PrinterConfigDrawer
        open={showConfig}
        onClose={() => setShowConfig(false)}
        connectionMode={connectionMode}
        setConnectionMode={setConnectionMode}
        printerType={printerType}
        setPrinterType={handlePrinterTypeChange}
        isConnected={isConnected}
        deviceName={deviceName}
        printerStatus={printerStatus}
        onSave={handleSavePrintSettings}
        onDisconnect={handleDisconnect}
        isMobile={isMobile}
      />

      {/* Print Settings Drawer */}
      <PrintSettingsDrawer
        open={showPrintSettings}
        onClose={() => setShowPrintSettings(false)}
        selectedFields={selectedFields}
        setSelectedFields={setSelectedFields}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        fontSizeMultiplier={fontSizeMultiplier}
        setFontSizeMultiplier={setFontSizeMultiplier}
        lineGapMultiplier={lineGapMultiplier}
        setLineGapMultiplier={setLineGapMultiplier}
        letterSpacing={letterSpacing}
        setLetterSpacing={setLetterSpacing}
        marginMultiplier={marginMultiplier}
        setMarginMultiplier={setMarginMultiplier}
        fieldFontSizes={fieldFontSizes}
        setFieldFontSizes={setFieldFontSizes}
        isMobile={isMobile}
        availableFields={availableFields}
        labelSize={selectedDimension}
      />

      {/* Print Content - Hidden from view, only used during print */}
      <div
        ref={printRef}
        className="attendees-print-body"
        style={{
          display: 'none',
          position: 'absolute',
          left: '-9999px'
        }}
      >
        {printableData?.map((item, index) => {
          // Get font sizes based on selection
          // fieldFontSizes stores direct pt values (e.g. {name: 20, email: 12})
          const getFontSize = (fieldKey) => {
            const NAME_FIELDS = ['firstName', 'name', 'surname'];
            // Use individual field pt size if set, otherwise use defaults
            const ptSize = fieldFontSizes[fieldKey]
              || (NAME_FIELDS.includes(fieldKey) ? 16 : 10);
            // Apply global multiplier, convert pt → CSS px (1pt = 1.333px)
            const effectivePt = Math.round(ptSize * fontSizeMultiplier);
            return `${Math.round(effectivePt * 1.333)}px`;
          };

          return (
            <div
              key={index}
              className="attendee-badge"
              style={{
                width: `${selectedDim.width}in`,
                height: `${selectedDim.height}in`,
                minWidth: `${selectedDim.width}in`,
                minHeight: `${selectedDim.height}in`,
                background: 'white',
                border: '3px solid black',
                padding: '10px',
                margin: '0 auto 10px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                fontFamily: fontFamily,
                color: 'black',
                letterSpacing: `${letterSpacing}px`,
                pageBreakAfter: index < printableData.length - 1 ? 'always' : 'auto',
                pageBreakInside: 'avoid'
              }}
            >
              {/* Content - Print selected fields */}
              <div className="badge-content" style={{ flex: 1 }}>
                {selectedFields.map((fieldKey) => {
                  const value = item?.[fieldKey];
                  if (value !== null && value !== undefined && value !== '') {
                    const fontSize = getFontSize(fieldKey);
                    const lineGap = `${Math.round(lineGapMultiplier * 16)}px`;
                    return (
                      <div
                        key={fieldKey}
                        className="badge-row"
                        style={{
                          marginBottom: lineGap,
                          display: 'block'
                        }}
                      >
                        <span
                          className="badge-value"
                          style={{
                            fontSize: fontSize,
                            fontWeight: fieldKey === 'name' ? 'bold' : 'normal',
                            display: 'block',
                            wordBreak: 'break-all',
                            textAlign: 'left'
                          }}
                        >
                          {String(value)}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
});

AttendeesPrint.displayName = 'AttendeesPrint';

export default AttendeesPrint;