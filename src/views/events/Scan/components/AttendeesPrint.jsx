import React, { useState, useRef, forwardRef, useImperativeHandle, useCallback, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Modal, Space, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { usePrinter } from '../../../../Context/PrinterContext';
import AttendeeCard from './AttendeeCard';
import PrintOptionsSection from './PrintOptionsSection';
import FontStyleSelector, { FONT_STYLE_OPTIONS } from './FontStyleSelector';
import ActionButtons from './ActionButtons';
import './AttendeesPrint.css';
import ConnectionModeSelector from 'views/events/Bookings/pos/components/ConnectionModeSelector';
import PrinterTypeSelector from 'views/events/Bookings/pos/components/PrinterTypeSelector';

// LocalStorage helpers
const FIELD_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const ATTENDEES_PRINT_FIELDS_KEY = 'attendees_print_fields';
const ATTENDEES_PRINT_OPTIONS_KEY = 'attendees_print_options';
const ATTENDEES_PRINT_SIZE_KEY = 'attendees_print_size';
const ATTENDEES_PRINT_FONT_KEY = 'attendees_print_font';
const ATTENDEES_PRINT_FONT_STYLE_KEY = 'attendees_print_font_style';
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

// Dimension options (width x height in inches)
// Compatible with Atpos HQ450L (4" / 108mm max width, 203 DPI)
const DIMENSION_OPTIONS = [
  { label: '2" × 3"', value: '2x3', width: 2, height: 3 }, // 51mm × 76mm
  { label: '1" × 2"', value: '1x2', width: 1, height: 2 }, // 25mm × 51mm
  { label: '2" × 2"', value: '2x2', width: 2, height: 2 }, // 51mm × 51mm
  // { label: '1" × 3"', value: '1x3', width: 1, height: 3 }, // 25mm × 76mm
  { label: '3" × 2"', value: '3x2', width: 3, height: 2 }, // 76mm × 51mm
  // { label: '4" × 2"', value: '4x2', width: 4, height: 2 }, // 102mm × 51mm (max width)
];

// Default field configuration
const defaultFields = [
  { id: 'name', field_name: 'Name', lable: 'Name', label: 'Name', fixed: 1, order: 0 },
  { id: 'email', field_name: 'Email', lable: 'Email', label: 'Email', fixed: 1, order: 1 },
  { id: 'mo', field_name: 'Mo', lable: 'Mobile', label: 'Mobile', fixed: 1, order: 2 },
];

const AttendeesPrint = forwardRef(({
  attendeesList,
  eventData,
  ticket,
  bookings,
  primaryColor = '#B51515'
}, ref) => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState('2x3');
  const [uniformFontSize, setUniformFontSize] = useState('medium');
  const [selectedFontStyle, setSelectedFontStyle] = useState('sans');
  const [selectedFields, setSelectedFields] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const [printerType, setPrinterType] = useState('tspl');
  const printRef = useRef(null);
  const modeInitializedRef = useRef(false);

  // Printer context
  const {
    connectionMode,
    setConnectionMode,
    isConnected,
    connectUSB,
    connectBluetooth,
    disconnect,
    sendRawBytes,
  } = usePrinter();

  // Load saved settings from localStorage
  useEffect(() => {
    const size = getWithExpiry(ATTENDEES_PRINT_SIZE_KEY);
    const font = getWithExpiry(ATTENDEES_PRINT_FONT_KEY);
    const fontStyle = getWithExpiry(ATTENDEES_PRINT_FONT_STYLE_KEY);
    const savedPrinterType = getWithExpiry(ATTENDEES_PRINT_PRINTER_TYPE_KEY);

    if (size) setSelectedDimension(size);
    if (font) setUniformFontSize(font);
    if (fontStyle) setSelectedFontStyle(fontStyle);
    if (savedPrinterType) setPrinterType(savedPrinterType);
  }, []);

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



  // Handle size change
  const handleSizeChange = (size) => {
    setSelectedDimension(size);
    setWithExpiry(ATTENDEES_PRINT_SIZE_KEY, size, FIELD_TTL);
  };

  // Handle font size change
  const handleFontSizeChange = (size) => {
    setUniformFontSize(size);
    setWithExpiry(ATTENDEES_PRINT_FONT_KEY, size, FIELD_TTL);
  };

  // Handle font style change
  const handleFontStyleChange = (style) => {
    setSelectedFontStyle(style);
    setWithExpiry(ATTENDEES_PRINT_FONT_STYLE_KEY, style, FIELD_TTL);
  };

  // Handle printer type change
  const handlePrinterTypeChange = (type) => {
    setPrinterType(type);
    setWithExpiry(ATTENDEES_PRINT_PRINTER_TYPE_KEY, type, FIELD_TTL);
  };

  // Generate TSPL (TSC Printer Language) commands for Atpos HQ450L label printer
  // Printer specs: 4" (108mm) width, 203 DPI, USB+Bluetooth
  const generateTSPLCommands = useCallback(async () => {
    // Get font number based on field, uniform font size, and selected font style
    const getFontNumber = (fieldName) => {
      const isName = fieldName === 'Name';
      const fontStyle = FONT_STYLE_OPTIONS.find(f => f.value === selectedFontStyle) || FONT_STYLE_OPTIONS[0];

      // Base font numbers from font style
      let baseNameFont = fontStyle.fontNum.name;
      let baseOtherFont = fontStyle.fontNum.other;

      // Adjust based on uniform font size
      if (isName) {
        switch (uniformFontSize) {
          case 'small':
            return String(Math.max(2, parseInt(baseNameFont) - 1));
          case 'large':
            return String(Math.min(5, parseInt(baseNameFont) + 1));
          default:
            return baseNameFont;
        }
      } else {
        switch (uniformFontSize) {
          case 'small':
            return String(Math.max(2, parseInt(baseOtherFont) - 1));
          case 'large':
            return String(Math.min(4, parseInt(baseOtherFont) + 1));
          default:
            return baseOtherFont;
        }
      }
    };

    const commands = [];

    // Printer specifications
    const PRINTER_WIDTH_MM = 108; // 4 inch = 108mm (max width)
    const DPI = 203; // Printer resolution
    const DOTS_PER_MM = DPI / 25.4; // ~7.992 dots per mm

    // Convert selected dimension to mm (1 inch = 25.4 mm)
    let widthMm = Math.round(selectedDim.width * 25.4);
    let heightMm = Math.round(selectedDim.height * 25.4);

    // Ensure width doesn't exceed printer max width
    if (widthMm > PRINTER_WIDTH_MM) {
      widthMm = PRINTER_WIDTH_MM;
    }

    // Minimum label dimensions
    const minWidthMm = 25; // ~1 inch minimum
    const minHeightMm = 25; // ~1 inch minimum
    if (widthMm < minWidthMm) widthMm = minWidthMm;
    if (heightMm < minHeightMm) heightMm = minHeightMm;

    // Sort fields by order
    // const sortedFields = [...customFieldsData].sort((a, b) => a.order - b.order);
    // Use selectedFields directly as they are already ordered
    const fieldsToPrint = selectedFields;

    // Print each attendee as a separate label
    attendeesList?.forEach((attendee, index) => {
      // Set label size (width, height in mm)
      commands.push(`SIZE ${widthMm} mm,${heightMm} mm\r\n`);

      // Set gap between labels (2mm)
      commands.push('GAP 2 mm,0 mm\r\n');

      // Set print direction (0 = normal)
      commands.push('DIRECTION 0\r\n');

      // Clear buffer
      commands.push('CLS\r\n');

      // Helper function to split long text into multiple lines
      const splitTextIntoLines = (text, maxCharsPerLine) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
          if ((currentLine + word).length <= maxCharsPerLine) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            if (currentLine) lines.push(currentLine);
            // If single word is longer than maxChars, split it
            if (word.length > maxCharsPerLine) {
              for (let i = 0; i < word.length; i += maxCharsPerLine) {
                lines.push(word.substring(i, i + maxCharsPerLine));
              }
              currentLine = '';
            } else {
              currentLine = word;
            }
          }
        });
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      // First, calculate total content height to center it
      let totalContentHeight = 0;
      const lineHeight = Math.round(6 * DOTS_PER_MM); // 6mm line spacing between fields
      const fieldSpacings = [];

      fieldsToPrint.forEach((field) => {
        if (attendee?.[field.field_name]) {
          const value = String(attendee[field.field_name]);
          const isName = field.field_name === 'Name';

          // Calculate max characters per line
          let maxCharsPerLine = 25;
          if (isName) {
            maxCharsPerLine = Math.floor((widthMm / 25.4) * 10);
          } else {
            maxCharsPerLine = Math.floor((widthMm / 25.4) * 15);
          }

          // Split long text into multiple lines
          const lines = value.length > maxCharsPerLine ? splitTextIntoLines(value, maxCharsPerLine) : [value];

          // Calculate height for this field
          lines.forEach((line, lineIndex) => {
            if (lineIndex < lines.length - 1) {
              // Spacing between wrapped lines
              totalContentHeight += Math.round((isName ? 7 : 5) * DOTS_PER_MM);
            } else {
              // Spacing after the field
              totalContentHeight += isName ? Math.round(8 * DOTS_PER_MM) : lineHeight;
            }
          });

          fieldSpacings.push({ lines, isName });
        }
      });

      // Calculate starting Y position to center content vertically
      const labelHeightDots = Math.round(heightMm * DOTS_PER_MM);
      const startY = Math.max(
        Math.round(3 * DOTS_PER_MM), // Minimum 3mm from top
        Math.round((labelHeightDots - totalContentHeight) / 2) // Center vertically
      );

      // Calculate positions in dots - reduced margins
      const startX = Math.round(3 * DOTS_PER_MM); // 3mm from left margin
      let currentY = startY;

      // Print fields in order
      fieldsToPrint.forEach((field, fieldIndex) => {
        if (attendee?.[field.field_name]) {
          const value = String(attendee[field.field_name]).replace(/"/g, '\\"');
          const fontNum = getFontNumber(field.field_name);
          const isName = field.field_name === 'Name';

          // Calculate max characters per line
          let maxCharsPerLine = 25;
          if (isName) {
            maxCharsPerLine = Math.floor((widthMm / 25.4) * 10);
          } else {
            maxCharsPerLine = Math.floor((widthMm / 25.4) * 15);
          }

          // Split long text into multiple lines
          const lines = value.length > maxCharsPerLine ? splitTextIntoLines(value, maxCharsPerLine) : [value];

          // Print each line
          lines.forEach((line, lineIndex) => {
            const escapedLine = line.replace(/"/g, '\\"');
            commands.push(`TEXT ${startX},${currentY},"${fontNum}",0,1,1,"${escapedLine}"\r\n`);

            // Add spacing after each line
            if (lineIndex < lines.length - 1) {
              // Spacing between wrapped lines
              currentY += Math.round((isName ? 7 : 5) * DOTS_PER_MM);
            } else {
              // Spacing after the field
              currentY += isName ? Math.round(8 * DOTS_PER_MM) : lineHeight;
            }
          });
        }
      });

      // Print the label (PRINT quantity, copies)
      commands.push('PRINT 1,1\r\n');
    });

    // Convert TSPL commands to string, then to bytes
    const tsplString = commands.join('');
    const encoder = new TextEncoder();
    return encoder.encode(tsplString);
  }, [attendeesList, selectedDim, selectedFields, uniformFontSize, selectedFontStyle]);

  // Generate ZPL (Zebra Programming Language) commands
  const generateZPLCommands = useCallback(async () => {
    const commands = [];

    // Printer specifications
    const DPI = 203;
    const DOTS_PER_MM = DPI / 25.4;

    // Convert selected dimension to dots
    const widthDots = Math.round(selectedDim.width * DPI);
    const heightDots = Math.round(selectedDim.height * DPI);

    // Get font size based on uniform font size setting
    const getFontSize = (isName) => {
      if (isName) {
        switch (uniformFontSize) {
          case 'small': return 30;
          case 'large': return 50;
          default: return 40;
        }
      } else {
        switch (uniformFontSize) {
          case 'small': return 20;
          case 'large': return 30;
          default: return 25;
        }
      }
    };

    // Print each attendee as a separate label
    attendeesList?.forEach((attendee) => {
      commands.push('^XA\n'); // Start format
      commands.push('^LH0,0\n'); // Set label home position

      const startX = Math.round(3 * DOTS_PER_MM);
      let currentY = Math.round(3 * DOTS_PER_MM);
      const lineHeight = Math.round(6 * DOTS_PER_MM);

      // Print fields in order
      selectedFields.forEach((field) => {
        if (attendee?.[field.field_name]) {
          const value = String(attendee[field.field_name]).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
          const isName = field.field_name === 'Name';
          const fontSize = getFontSize(isName);

          // ^FO = Field Origin, ^A0N = Font 0 Normal, ^FD = Field Data, ^FS = Field Separator
          commands.push(`^FO${startX},${currentY}^A0N,${fontSize},${fontSize}^FD${value}^FS\n`);
          currentY += isName ? Math.round(8 * DOTS_PER_MM) : lineHeight;
        }
      });

      commands.push('^XZ\n'); // End format
    });

    const zplString = commands.join('');
    return new TextEncoder().encode(zplString);
  }, [attendeesList, selectedDim, selectedFields, uniformFontSize]);

  // Generate CPCL (Comtec Printer Control Language) commands
  const generateCPCLCommands = useCallback(async () => {
    const commands = [];

    // Printer specifications
    const DPI = 203;
    const DOTS_PER_MM = DPI / 25.4;

    // Convert selected dimension to dots
    const widthDots = Math.round(selectedDim.width * DPI);
    const heightDots = Math.round(selectedDim.height * DPI);

    // Get font number based on uniform font size setting
    const getFontNum = (isName) => {
      if (isName) {
        switch (uniformFontSize) {
          case 'small': return '4';
          case 'large': return '7';
          default: return '5';
        }
      } else {
        switch (uniformFontSize) {
          case 'small': return '2';
          case 'large': return '4';
          default: return '3';
        }
      }
    };

    // Print each attendee as a separate label
    attendeesList?.forEach((attendee) => {
      // CPCL format start - label height in dots
      commands.push(`! 0 200 200 ${heightDots} 1\n`);
      commands.push(`PAGE-WIDTH ${widthDots}\n`);
      commands.push('LEFT\n');
      commands.push('\n');

      const startX = Math.round(3 * DOTS_PER_MM);
      let currentY = Math.round(3 * DOTS_PER_MM);
      const lineHeight = Math.round(6 * DOTS_PER_MM);

      // Print fields in order
      selectedFields.forEach((field) => {
        if (attendee?.[field.field_name]) {
          const value = String(attendee[field.field_name]);
          const isName = field.field_name === 'Name';
          const fontNum = getFontNum(isName);

          // TEXT font size x y text
          commands.push(`TEXT ${fontNum} 0 ${startX} ${currentY} ${value}\n`);
          currentY += isName ? Math.round(8 * DOTS_PER_MM) : lineHeight;
        }
      });

      commands.push('PRINT\n');
      commands.push('\n');
    });

    const cpclString = commands.join('');
    return new TextEncoder().encode(cpclString);
  }, [attendeesList, selectedDim, selectedFields, uniformFontSize]);

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

      // Generate commands based on selected printer type
      let printerBytes;
      switch (printerType) {
        case 'zpl':
          printerBytes = await generateZPLCommands();
          break;
        case 'cpcl':
          printerBytes = await generateCPCLCommands();
          break;
        case 'tspl':
        default:
          printerBytes = await generateTSPLCommands();
          break;
      }

      await sendRawBytes(printerBytes);

      message.success({ content: 'Print sent successfully!', key: 'print' });
    } catch (err) {
      console.error('Print error:', err);
      message.error({ content: 'Failed to print: ' + err.message, key: 'print' });
    } finally {
      setIsPrinting(false);
    }
  }, [isConnected, connectionMode, connectUSB, connectBluetooth, printerType, generateTSPLCommands, generateZPLCommands, generateCPCLCommands, sendRawBytes]);

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
      {/* Modal - No custom styling, uses default Ant Design styles */}
      <Modal
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
        onCancel={handleCancel}
        width={isMobile ? '95%' : 700}
        centered={!isMobile}
        className={isMobile ? 'attendees-print-modal-mobile' : 'attendees-print-modal'}
        styles={{
          body: {
            padding: isMobile ? '12px' : '16px',
            maxHeight: isMobile ? 'calc(100vh - 200px)' : 'calc(100vh - 300px)',
            overflowY: 'auto'
          },
          header: {
            padding: isMobile ? '12px 16px' : '16px 24px'
          },
          footer: {
            padding: isMobile ? '12px' : '16px'
          }
        }}
        footer={
          <Space direction="vertical" size="middle" className="w-100">
            <PrinterTypeSelector
              printerType={printerType}
              setPrinterType={handlePrinterTypeChange}
              isConnected={isConnected}
              printerOptions={[
                {
                  value: 'tspl',
                  title: 'TSPL',
                  description: 'TSC label printers (Atpos, TSC)'
                },
                {
                  value: 'zpl',
                  title: 'ZPL',
                  description: 'Zebra label printers (ZD, ZT, ZM series)'
                },
                {
                  value: 'cpcl',
                  title: 'CPCL',
                  description: 'Citizen, Intermec label printers'
                }
              ]}
            />

            <PrintOptionsSection
              selectedDimension={selectedDimension}
              onSizeChange={handleSizeChange}
              uniformFontSize={uniformFontSize}
              onFontSizeChange={handleFontSizeChange}
              customFieldsData={defaultFields}
              setSelectedFields={setSelectedFields}
              eventId={eventData?._id || 'default_event'}
              DIMENSION_OPTIONS={DIMENSION_OPTIONS}
              primaryColor={primaryColor}
            />

            <FontStyleSelector
              selectedFontStyle={selectedFontStyle}
              onFontStyleChange={handleFontStyleChange}
              uniformFontSize={uniformFontSize}
              primaryColor={primaryColor}
            />

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
          {/* Connection Mode Selector for PC */}
          <ConnectionModeSelector
            connectionMode={connectionMode}
            setConnectionMode={setConnectionMode}
            isMobile={isMobile}
            isConnected={isConnected}
          />

          <div
            className="mb-4 p-3 rounded"
            style={{
              background: 'rgba(181, 21, 21, 0.15)',
              border: '1px solid rgba(181, 21, 21, 0.3)'
            }}
          >
            <div className="small text-white-50 mb-2 d-flex justify-content-between align-items-center">
              <span>Total Attendees:</span>
              <span className="fw-bold text-white ms-2" style={{ fontSize: '16px' }}>
                {attendeesList?.length || 0}
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
            {attendeesList?.map((attendee, index) => (
              <AttendeeCard
                key={index}
                attendee={attendee}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        </div>
      </Modal>

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
        {attendeesList?.map((attendee, index) => {
          // Get font sizes based on selection
          const getFontSize = (fieldName) => {
            // const isName = fieldName === 'Name';
            // if (isName) {
            //   switch(uniformFontSize) {
            //     case 'small': return '14px';
            //     case 'large': return '20px';
            //     default: return '18px';
            //   }
            // } 
            // else {
            switch (uniformFontSize) {
              case 'small': return '10px';
              case 'large': return '16px';
              default: return '12px';
            }
            // }
          };

          // Sort fields by order
          // const sortedFields = [...customFieldsData].sort((a, b) => a.order - b.order);

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
                fontFamily: selectedFontStyle === 'mono' ? "'Courier New', monospace" :
                  selectedFontStyle === 'serif' ? "'Times New Roman', serif" :
                    "Arial, sans-serif",
                color: 'black',
                pageBreakAfter: index < attendeesList.length - 1 ? 'always' : 'auto',
                pageBreakInside: 'avoid'
              }}
            >
              {/* Content - Print fields in order */}
              <div className="badge-content" style={{ flex: 1 }}>
                {selectedFields.map((field) => {
                  if (attendee?.[field.field_name]) {
                    const fontSize = getFontSize(field.field_name);
                    return (
                      <div
                        key={field.id}
                        className="badge-row"
                        style={{
                          marginBottom: '6px',
                          display: 'block'
                        }}
                      >
                        <span
                          className="badge-value"
                          style={{
                            fontSize: fontSize,
                            display: 'block',
                            wordBreak: 'break-all',
                            textAlign: 'left'
                          }}
                        >
                          {String(attendee[field.field_name])}
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