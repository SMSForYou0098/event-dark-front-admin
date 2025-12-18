import React, { useRef, useState, useCallback } from "react";
import {
    Button,
    Card,
    Col,
    Form,
    Row,
    Table,
    Upload,
    message,
    Checkbox,
    Drawer,
    Space,
    Tag,
    Radio,
    Modal,
} from "antd";
import * as XLSX from "xlsx";
import { PrinterIcon, UploadCloudIcon, SettingsIcon, CheckCircle } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { usePrinter } from "Context/PrinterContext";
import { useSelector, useDispatch } from "react-redux";
import {
    selectConnectionMode,
    selectPrinterType,
    setPrinterConfig,
} from "store/slices/printerSlice";
import { generateTSPLFromExcel, generateZPLFromExcel, generateCPCLFromExcel } from "../Bookings/pos/utils/printerCommands";
import printLoader from "assets/event/stock/print_loader.gif";
import Loader from "utils/Loader";

/**
 * AVAILABLE FIELDS (Excel headers must match these keys)
 */
const AVAILABLE_FIELDS = [
    { label: "First Name", value: "firstName" },
    { label: "Surname", value: "surname" },
    { label: "Mobile Number", value: "mobile" },
    { label: "Designation", value: "designation" },
    { label: "Company name", value: "company" },
    { label: "Stall Number", value: "stall" },
];

/**
 * LABEL SIZE OPTIONS
 */
const LABEL_SIZES = [
    { label: "2 inch × 2 inch", value: "2x2" },
    { label: "2 inch × 1 inch", value: "2x1" },
    { label: "3 inch × 2 inch", value: "3x2" },
];

const LabelPrinting = () => {
    const dispatch = useDispatch();
    const printRef = useRef(null);

    // Redux state
    const savedConnectionMode = useSelector(selectConnectionMode);
    const savedPrinterType = useSelector(selectPrinterType);

    // Printer context
    const {
        connectionMode,
        setConnectionMode,
        isConnected,
        connectUSB,
        connectBluetooth,
        disconnect,
        sendRawBytes,
        deviceName,
        status: printerStatus,
    } = usePrinter();

    // Local state
    const [excelData, setExcelData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [selectedFields, setSelectedFields] = useState(["firstName", "mobile"]);
    const [isPrinting, setIsPrinting] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [printerType, setPrinterType] = useState(savedPrinterType);
    const [labelSize, setLabelSize] = useState("2x2");

    /**
     * Parse Excel
     */
    const handleExcelUpload = (file) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const workbook = XLSX.read(e.target.result, { type: "binary" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            const formatted = raw.map((row, index) => ({
                key: index,
                firstName: row["First Name"] || "",
                surname: row["Surname"] || "",
                mobile: row["Mobile number"] || "",
                designation: row["Designation"] || "",
                company: row["Company name"] || "",
                stall: row["Stall Number"] || "",
            }));

            setExcelData(formatted);
            setSelectedRows([]);
            message.success("Excel file loaded successfully");
        };

        reader.readAsBinaryString(file);
        return false;
    };

    /**
     * Browser Print Handler
     */
    const handleBrowserPrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Labels-${new Date().toISOString().split("T")[0]}`,
        pageStyle: `
      @page {
        size: 80mm auto;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .label-item {
          page-break-after: always;
          page-break-inside: avoid;
        }
      }
    `,
    });

    /**
     * Thermal Print Handler
     */
    const handleThermalPrint = useCallback(async () => {
        try {
            if (!selectedRows.length) {
                message.warning("Select at least one row");
                return;
            }

            if (!selectedFields.length) {
                message.warning("Select at least one field to print");
                return;
            }

            // Ensure connection
            if (!isConnected) {
                message.loading({ content: "Connecting to printer...", key: "connect" });
                try {
                    if (connectionMode === "usb") {
                        await connectUSB();
                    } else {
                        await connectBluetooth();
                    }
                    message.success({ content: "Printer connected!", key: "connect" });
                    await new Promise((r) => setTimeout(r, 500));
                } catch (err) {
                    message.error({ content: err.message || "Failed to connect", key: "connect" });
                    return;
                }
            }

            setIsPrinting(true);
            message.loading({ content: "Printing labels...", key: "print" });

            // Print each selected row
            for (const row of selectedRows) {
                let printerBytes;

                // Generate commands based on printer type
                switch (printerType) {
                    case 'zpl':
                        printerBytes = await generateZPLFromExcel(row, selectedFields, labelSize);
                        break;
                    case 'cpcl':
                        printerBytes = await generateCPCLFromExcel(row, selectedFields, labelSize);
                        break;
                    case 'tspl':
                    default:
                        printerBytes = await generateTSPLFromExcel(row, selectedFields, labelSize);
                        break;
                }

                await sendRawBytes(printerBytes);
                await new Promise((r) => setTimeout(r, 300)); // Small delay between prints
            }

            message.success({ content: `Printed ${selectedRows.length} label(s)`, key: "print" });
        } catch (err) {
            console.error("Print error:", err);
            message.error({ content: err.message || "Print failed", key: "print" });
        } finally {
            setIsPrinting(false);
        }
    }, [selectedRows, selectedFields, labelSize, isConnected, connectionMode, connectUSB, connectBluetooth, sendRawBytes]);

    /**
     * Main Print Handler
     */
    const handlePrint = useCallback(async () => {
        if (!selectedRows.length) {
            message.warning("Select at least one row to print");
            return;
        }

        if (!selectedFields.length) {
            message.warning("Select at least one field to print");
            return;
        }

        if (connectionMode === "browser") {
            handleBrowserPrint();
        } else {
            await handleThermalPrint();
        }
    }, [connectionMode, selectedRows, selectedFields, handleBrowserPrint, handleThermalPrint]);

    /**
     * Save Printer Settings
     */
    const handleSavePrintSettings = useCallback(async () => {
        dispatch(
            setPrinterConfig({
                connectionMode,
                printerType,
                autoPrint: false,
            })
        );

        if (connectionMode === "browser") {
            message.success("Printer settings saved successfully!");
            setShowConfig(false);
            return;
        }

        // Connect to thermal printer
        if (!isConnected) {
            message.loading({ content: "Connecting to printer...", key: "connect" });
            try {
                let success = false;
                if (connectionMode === "usb") {
                    success = await connectUSB();
                } else {
                    success = await connectBluetooth();
                }

                if (success) {
                    message.success({ content: "Printer connected & settings saved!", key: "connect" });
                } else {
                    message.warning({ content: "Settings saved but printer connection failed", key: "connect" });
                }
            } catch (err) {
                message.error({ content: `Settings saved but connection failed: ${err.message}`, key: "connect" });
            }
        } else {
            message.success("Printer settings saved successfully!");
        }

        setShowConfig(false);
    }, [dispatch, connectionMode, printerType, isConnected, connectUSB, connectBluetooth]);

    const handleDisconnect = async () => {
        await disconnect();
        message.info("Printer disconnected");
    };

    /**
     * TABLE COLUMNS
     */
    const columns = [
        { title: "First Name", dataIndex: "firstName" },
        { title: "Surname", dataIndex: "surname" },
        { title: "Mobile", dataIndex: "mobile" },
        { title: "Designation", dataIndex: "designation" },
        { title: "Company", dataIndex: "company" },
        { title: "Stall No.", dataIndex: "stall", align: "center" },
    ];

    return (
        <>
            {/* Loading Modal */}
            <Modal open={isPrinting} footer={null} closable={false} centered width={300} className="transparent-modal">
                <Loader width={160} imgUrl={printLoader} />
            </Modal>

            {/* Printer Config Drawer */}
            <Drawer
                title={
                    <Space>
                        <SettingsIcon size={16} />
                        <span>Printer Configuration</span>
                        {isConnected && <Tag color="success" icon={<CheckCircle />}>Connected</Tag>}
                    </Space>
                }
                placement="right"
                open={showConfig}
                onClose={() => setShowConfig(false)}
                width={500}
                footer={
                    <Button className="w-100" type="primary" onClick={handleSavePrintSettings}>
                        Save Settings
                    </Button>
                }
            >
                <Card title="Connection Mode" className="mb-3">
                    <Radio.Group value={connectionMode} onChange={(e) => setConnectionMode(e.target.value)} className="w-100">
                        <Space direction="vertical" className="w-100">
                            <Radio value="browser">Browser Print (Default)</Radio>
                            <Radio value="usb">USB Thermal Printer</Radio>
                            <Radio value="bluetooth">Bluetooth Thermal Printer</Radio>
                        </Space>
                    </Radio.Group>
                </Card>

                {connectionMode !== "browser" && (
                    <Card title="Printer Type" className="mb-3">
                        <Radio.Group value={printerType} onChange={(e) => setPrinterType(e.target.value)} className="w-100">
                            <Space direction="vertical" className="w-100">
                                <Radio value="tspl">TSPL (TSC Label Printers)</Radio>
                                <Radio value="zpl">ZPL (Zebra Printers)</Radio>
                                <Radio value="cpcl">CPCL (Citizen/Intermec)</Radio>
                            </Space>
                        </Radio.Group>
                    </Card>
                )}

                {isConnected && (
                    <Card title="Connection Status">
                        <Space direction="vertical" className="w-100">
                            <div>
                                <strong>Device:</strong> {deviceName || "Unknown"}
                            </div>
                            <div>
                                <strong>Status:</strong> {printerStatus}
                            </div>
                            <Button danger onClick={handleDisconnect} className="w-100">
                                Disconnect
                            </Button>
                        </Space>
                    </Card>
                )}
            </Drawer>

            {/* Main Content */}
            <div>
                <Card
                    title="Label Printing (Excel)"
                    extra={
                        <Button className="btn btn-secondary d-inline-flex align-items-center gap-2" icon={<SettingsIcon size={16} />} onClick={() => setShowConfig(true)}>
                            Printer Settings
                        </Button>
                    }
                >
                    <Form layout="vertical">
                        <Row gutter={16}>
                            <Col md={12}>
                                <Form.Item label="Upload Excel File">
                                    <Upload beforeUpload={handleExcelUpload} accept=".xlsx,.xls" showUploadList={false}>
                                        <Button className="btn btn-secondary d-inline-flex align-items-center gap-2" icon={<UploadCloudIcon size={16} />}>Upload Excel</Button>
                                    </Upload>
                                </Form.Item>
                            </Col>

                            <Col md={12}>
                                <Form.Item label="Fields to Print">
                                    <Checkbox.Group options={AVAILABLE_FIELDS} value={selectedFields} onChange={setSelectedFields} />
                                </Form.Item>
                            </Col>

                            <Col md={12}>
                                <Form.Item label="Label Size">
                                    <Radio.Group value={labelSize} onChange={(e) => setLabelSize(e.target.value)}>
                                        <Space direction="vertical">
                                            {LABEL_SIZES.map((size) => (
                                                <Radio key={size.value} value={size.value}>
                                                    {size.label}
                                                </Radio>
                                            ))}
                                        </Space>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row justify="end">
                            <Button type="primary" className="btn btn-secondary d-inline-flex align-items-center gap-2" icon={<PrinterIcon size={16} />} disabled={!selectedRows.length} onClick={handlePrint}>
                                Print Labels ({selectedRows.length})
                            </Button>
                        </Row>
                    </Form>
                </Card>

                <Card title="Preview" className="mt-3">
                    <Table
                        rowSelection={{
                            onChange: (_, rows) => setSelectedRows(rows),
                        }}
                        columns={columns}
                        dataSource={excelData}
                        pagination={{ pageSize: 10 }}
                        locale={{
                            emptyText: "Upload an Excel file to preview data",
                        }}
                    />
                </Card>

                {/* Hidden Print Content for Browser Print */}
                <div style={{ display: "none" }}>
                    <div ref={printRef}>
                        {selectedRows.map((row, index) => (
                            <div key={index} className="label-item" style={{ padding: "20px", border: "1px solid #000", marginBottom: "10px" }}>
                                {selectedFields.map((field) => {
                                    const fieldLabel = AVAILABLE_FIELDS.find((f) => f.value === field)?.label;
                                    return row[field] ? (
                                        <div key={field} style={{ marginBottom: "10px", fontSize: "14px" }}>
                                            <strong>{fieldLabel}:</strong> {row[field]}
                                        </div>
                                    ) : null;
                                })}
                                {row.mobile && (
                                    <div style={{ marginTop: "15px", textAlign: "center" }}>
                                        <div style={{ fontSize: "12px", marginBottom: "5px" }}>QR Code: {row.mobile}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default LabelPrinting;

