import { useState, useRef, useCallback } from "react";
import { Form, message } from "antd";
import * as XLSX from "xlsx";
import { useReactToPrint } from "react-to-print";
import { usePrinter } from "Context/PrinterContext";
import { useMyContext } from "Context/MyContextProvider";
import { useSelector, useDispatch } from "react-redux";
import {
    selectPrinterType,
    setPrinterConfig,
} from "store/slices/printerSlice";
import {
    useLabelPrints,
    useLabelPrintsByBatch,
    useBulkStoreLabelPrints,
    useAddToBatch,
    useUpdateLabelPrint,
    useDeleteLabelPrint,
    useDeleteBatch,
    useBulkUpdateLabelStatus,
} from "../useLabelPrinting";
import {
    generateTSPLFromExcel,
    generateZPLFromExcel,
    generateCPCLFromExcel,
} from "../../Bookings/pos/utils/printerCommands";
import { AVAILABLE_FIELDS, FONT_FAMILIES } from "./constants";

/**
 * Custom hook for label printing state management
 */
export const useLabelPrintingState = () => {
    const dispatch = useDispatch();
    const printRef = useRef(null);
    const [editForm] = Form.useForm();

    // Redux state
    const savedPrinterType = useSelector(selectPrinterType);

    // Context
    const { isMobile, UserData } = useMyContext();

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

    // Printer type state
    const [printerType, setPrinterType] = useState(savedPrinterType || "tspl");

    // UI State
    const [activeTab, setActiveTab] = useState("upload");
    const [excelData, setExcelData] = useState([]);
    const [pendingLabels, setPendingLabels] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [selectedFields, setSelectedFields] = useState(
        AVAILABLE_FIELDS.filter(f => f.defaultEnabled).map(f => f.key)
    );
    const [isPrinting, setIsPrinting] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [showPrintSettings, setShowPrintSettings] = useState(false);
    const [showCodePreview, setShowCodePreview] = useState(false);
    const [labelSize, setLabelSize] = useState("2x2");
    const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1.0);
    const [lineGapMultiplier, setLineGapMultiplier] = useState(1.0);
    const [letterSpacing, setLetterSpacing] = useState(0);
    const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0]?.value || "Arial, sans-serif");
    const [fieldFontSizes, setFieldFontSizes] = useState(() => {
        const sizes = {};
        AVAILABLE_FIELDS.forEach(field => {
            sizes[field.key] = field.defaultSize || 10;  // direct pt sizes (e.g. 16 for name, 10 for others)
        });
        return sizes;
    });
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [batchName, setBatchName] = useState("");
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingLabel, setEditingLabel] = useState(null);

    // API Hooks
    const { data: batchGroups = [], isLoading: isLoadingLabels, refetch: refetchLabels } = useLabelPrints();
    const { data: selectedBatchLabels = [] } = useLabelPrintsByBatch(selectedBatchId, {
        enabled: !!selectedBatchId,
    });

    const bulkStoreMutation = useBulkStoreLabelPrints();
    const addToBatchMutation = useAddToBatch();
    const updateLabelMutation = useUpdateLabelPrint();
    const deleteLabelMutation = useDeleteLabelPrint();
    const deleteBatchMutation = useDeleteBatch();
    const bulkUpdateStatusMutation = useBulkUpdateLabelStatus();

    // Browser print handler
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

    // Handlers
    const sanitizeBatchName = useCallback((name) => {
        return name.replace(/[^a-zA-Z0-9-]/g, "").substring(0, 50);
    }, []);

    const handleExcelUpload = useCallback((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workbook = XLSX.read(e.target.result, { type: "binary" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });

                if (raw.length === 0) {
                    message.error("Excel file is empty");
                    return;
                }

                // Validation: Check for required columns
                const requiredColumns = ["First Name", "Surname", "Mobile number", "Designation", "Company name", "Stall Number"];
                const firstRow = raw[0];
                const missingColumns = requiredColumns.filter(col => !Object.keys(firstRow).some(key => key.trim() === col));

                if (missingColumns.length > 0) {
                    message.error(`Excel is not in proper format. Missing columns: ${missingColumns.join(", ")}`);
                    return;
                }

                // Map Excel columns to API field names
                const formatted = raw.map((row, index) => ({
                    key: index,
                    name: row["First Name"] || row["Name"] || "",
                    surname: row["Surname"] || "",
                    number: row["Mobile number"] || row["Mobile"] || row["Number"] || "",
                    designation: row["Designation"] || "",
                    company_name: row["Company name"] || row["Company"] || "",
                    stall_number: row["Stall Number"] || row["Stall"] || "",
                }));

                setExcelData(formatted);
                setPendingLabels(formatted);
                setSelectedRows([]);
                message.success(`Loaded ${formatted.length} labels from Excel`);
            } catch (error) {
                console.error("Excel parse error:", error);
                message.error("Failed to parse Excel file");
            }
        };
        reader.readAsBinaryString(file);
    }, []);

    const downloadSampleExcel = useCallback(() => {
        const headers = ["First Name", "Surname", "Mobile number", "Designation", "Company name", "Stall Number"];
        const data = [
            {
                "First Name": "John",
                "Surname": "Doe",
                "Mobile number": "1234567890",
                "Designation": "Manager",
                "Company name": "Acme Corp",
                "Stall Number": "A1"
            },
            {
                "First Name": "Jane",
                "Surname": "Smith",
                "Mobile number": "0987654321",
                "Designation": "Director",
                "Company name": "Beta Inc",
                "Stall Number": "B2"
            }
        ];

        const ws = XLSX.utils.json_to_sheet(data, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Labels");
        XLSX.writeFile(wb, "Sample_Label_Upload.xlsx");
    }, []);

    const handleUploadToServer = useCallback(async () => {
        if (!batchName.trim()) {
            message.warning("Please enter a batch name");
            return;
        }
        if (pendingLabels.length === 0) {
            message.warning("No labels to upload");
            return;
        }

        try {
            // Map to API field names - batch_name is at top level, not in each label
            const labels = pendingLabels.map(label => ({
                name: label.name,
                surname: label.surname,
                number: label.number,
                designation: label.designation,
                company_name: label.company_name,
                stall_number: label.stall_number,
            }));

            const payload = {
                user_id: UserData?.id,
                batch_name: batchName.trim(),
                labels,
            };

            // Debug: Log payload to verify structure
            // console.log('Uploading labels with payload:', JSON.stringify(payload, null, 2));

            await bulkStoreMutation.mutateAsync(payload);

            message.success(`Uploaded ${labels.length} labels as batch "${batchName}"`);
            setPendingLabels([]);
            setBatchName("");
            setExcelData([]);
            setActiveTab("batches");
            refetchLabels();
        } catch (error) {
            console.error("Upload error:", error);
            message.error(error.message || "Failed to upload labels");
        }
    }, [batchName, pendingLabels, bulkStoreMutation, refetchLabels, UserData?.id]);

    const handleDeleteBatch = useCallback(async (batchId) => {
        try {
            await deleteBatchMutation.mutateAsync(batchId);
            message.success("Batch deleted successfully");
            if (selectedBatchId === batchId) {
                setSelectedBatchId(null);
                setSelectedRows([]);
            }
            refetchLabels();
        } catch (error) {
            message.error(error.message || "Failed to delete batch");
        }
    }, [deleteBatchMutation, selectedBatchId, refetchLabels]);

    const handleDeleteLabel = useCallback(async (labelId) => {
        try {
            await deleteLabelMutation.mutateAsync(labelId);
            message.success("Label deleted successfully");
            refetchLabels();
            if (selectedBatchId) {
                // Refetch batch labels
                refetchLabels();
            }
        } catch (error) {
            message.error(error.message || "Failed to delete label");
        }
    }, [deleteLabelMutation, selectedBatchId, refetchLabels]);

    const handleEditLabel = useCallback((label) => {
        setEditingLabel(label);
        // Use API field names
        editForm.setFieldsValue({
            name: label.name,
            surname: label.surname,
            number: label.number,
            designation: label.designation,
            company_name: label.company_name,
            stall_number: label.stall_number,
        });
        setEditModalVisible(true);
    }, [editForm]);

    const handleUpdateLabel = useCallback(async () => {
        try {
            const values = await editForm.validateFields();
            if (!editingLabel?.id) return;

            await updateLabelMutation.mutateAsync({
                id: editingLabel.id,
                data: values,
            });

            message.success("Label updated successfully");
            setEditModalVisible(false);
            setEditingLabel(null);
            editForm.resetFields();
            refetchLabels();
        } catch (error) {
            if (error.errorFields) return; // Form validation error
            message.error(error.message || "Failed to update label");
        }
    }, [editingLabel, editForm, updateLabelMutation, refetchLabels]);

    const handleCancelEdit = useCallback(() => {
        setEditModalVisible(false);
        setEditingLabel(null);
        editForm.resetFields();
    }, [editForm]);

    const handleViewBatch = useCallback((batchId) => {
        setSelectedBatchId(batchId);
        setActiveTab("print");
    }, []);

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

                switch (printerType) {
                    case 'zpl':
                        printerBytes = await generateZPLFromExcel(
                            row,
                            selectedFields,
                            labelSize,
                            fontSizeMultiplier,
                            fieldFontSizes,
                            lineGapMultiplier
                        );
                        break;
                    case 'cpcl':
                        printerBytes = await generateCPCLFromExcel(
                            row,
                            selectedFields,
                            labelSize,
                            fontSizeMultiplier,
                            fieldFontSizes,
                            lineGapMultiplier
                        );
                        break;
                    case 'tspl':
                    default:
                        printerBytes = await generateTSPLFromExcel(
                            row,
                            selectedFields,
                            labelSize,
                            fontSizeMultiplier,
                            fieldFontSizes,
                            lineGapMultiplier
                        );
                        break;
                }

                await sendRawBytes(printerBytes);
                await new Promise((r) => setTimeout(r, 300));
            }

            message.success({ content: `Printed ${selectedRows.length} label(s)`, key: "print" });
        } catch (err) {
            console.error("Print error:", err);
            message.error({ content: err.message || "Print failed", key: "print" });
        } finally {
            setIsPrinting(false);
        }
    }, [
        selectedRows,
        selectedFields,
        labelSize,
        isConnected,
        connectionMode,
        connectUSB,
        connectBluetooth,
        sendRawBytes,
        printerType,
        fontSizeMultiplier,
        fieldFontSizes,
        lineGapMultiplier,
        // bulkUpdateStatusMutation,
        // UserData?.id,
    ]);

    const handlePrint = useCallback(async (instantPrintData = null) => {
        // If instant print data is provided, use it instead of selectedRows
        const rowsToPrint = instantPrintData?.labels || selectedRows;
        const fontsToUse = instantPrintData?.fieldFontSizes || fieldFontSizes;

        if (!rowsToPrint.length) {
            message.warning("Select at least one row to print");
            return;
        }

        if (!selectedFields.length) {
            message.warning("Select at least one field to print");
            return;
        }

        // Skip status update for instant print (no IDs)
        if (!instantPrintData?.isInstantPrint) {
            // Mark labels as printed immediately when print button is clicked
            const labelIds = rowsToPrint
                .map(row => row.id)
                .filter(Boolean);

            if (labelIds.length > 0) {
                bulkUpdateStatusMutation.mutateAsync({
                    user_id: UserData?.id,
                    ids: labelIds,
                }).catch(err => {
                    console.error("Failed to update label status:", err);
                });
            }
        }

        if (connectionMode === "browser") {
            // For instant print, temporarily set selected rows for PrintPreview
            if (instantPrintData?.isInstantPrint) {
                setSelectedRows(rowsToPrint);
                // Wait for state update before printing
                setTimeout(() => {
                    handleBrowserPrint();
                }, 100);
            } else {
                handleBrowserPrint();
                if (!instantPrintData?.isInstantPrint) {
                    setSelectedRows([]);
                }
            }
        } else {
            // Thermal printing
            try {
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

                for (const row of rowsToPrint) {
                    let printerBytes;

                    switch (printerType) {
                        case 'zpl':
                            printerBytes = await generateZPLFromExcel(
                                row,
                                selectedFields,
                                labelSize,
                                fontSizeMultiplier,
                                fontsToUse,
                                lineGapMultiplier
                            );
                            break;
                        case 'cpcl':
                            printerBytes = await generateCPCLFromExcel(
                                row,
                                selectedFields,
                                labelSize,
                                fontSizeMultiplier,
                                fontsToUse,
                                lineGapMultiplier
                            );
                            break;
                        case 'tspl':
                        default:
                            printerBytes = await generateTSPLFromExcel(
                                row,
                                selectedFields,
                                labelSize,
                                fontSizeMultiplier,
                                fontsToUse,
                                lineGapMultiplier
                            );
                            break;
                    }

                    await sendRawBytes(printerBytes);
                    await new Promise((r) => setTimeout(r, 300));
                }

                message.success({ content: `Printed ${rowsToPrint.length} label(s)`, key: "print" });
            } catch (err) {
                console.error("Print error:", err);
                message.error({ content: err.message || "Print failed", key: "print" });
            } finally {
                setIsPrinting(false);
                if (!instantPrintData?.isInstantPrint) {
                    setSelectedRows([]);
                }
            }
        }
    }, [connectionMode, selectedRows, selectedFields, handleBrowserPrint, fieldFontSizes, bulkUpdateStatusMutation, UserData?.id, isConnected, connectUSB, connectBluetooth, sendRawBytes, printerType, labelSize, fontSizeMultiplier, lineGapMultiplier, setSelectedRows]);

    /**
     * Handle printing with custom code (from code preview modal)
     * @param {Uint8Array|Uint8Array[]} codeBytes - The printer command bytes
     * @param {number} labelCount - Number of labels
     * @param {boolean} isMultiple - Whether codeBytes is an array of multiple labels
     */
    const handlePrintCustomCode = useCallback(async (codeBytes, labelCount = 1, isMultiple = false) => {
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
        message.loading({ content: "Printing...", key: "print" });

        try {
            if (isMultiple && Array.isArray(codeBytes)) {
                // Print multiple labels
                for (const bytes of codeBytes) {
                    await sendRawBytes(bytes);
                    await new Promise((r) => setTimeout(r, 300));
                }
            } else {
                // Print single label
                await sendRawBytes(codeBytes);
            }
            message.success({ content: `Printed ${labelCount} label(s)`, key: "print" });
            setShowCodePreview(false);
        } catch (err) {
            console.error("Print error:", err);
            message.error({ content: err.message || "Print failed", key: "print" });
        } finally {
            setIsPrinting(false);
        }
    }, [isConnected, connectionMode, connectUSB, connectBluetooth, sendRawBytes]);

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

    const handleDisconnect = useCallback(async () => {
        await disconnect();
        message.info("Printer disconnected");
    }, [disconnect]);

    // Handle save label to existing batch
    const handleSaveToExistingBatch = useCallback(async (payload) => {
        await addToBatchMutation.mutateAsync(payload);
        refetchLabels();
    }, [addToBatchMutation, refetchLabels]);

    // Handle save label to new batch
    const handleSaveToNewBatch = useCallback(async (payload) => {
        await bulkStoreMutation.mutateAsync(payload);
        refetchLabels();
    }, [bulkStoreMutation, refetchLabels]);

    return {
        // Refs
        printRef,

        // Context
        isMobile,
        UserData,

        // Printer
        connectionMode,
        setConnectionMode,
        isConnected,
        deviceName,
        printerStatus,
        printerType,
        setPrinterType,

        // API State
        isLoadingLabels,
        batchGroups,
        selectedBatchLabels,
        refetchLabels,
        isUploading: bulkStoreMutation.isPending,
        isUpdatingLabel: updateLabelMutation.isPending,
        isSaving: addToBatchMutation.isPending || bulkStoreMutation.isPending,

        // UI State
        activeTab,
        setActiveTab,
        excelData,
        pendingLabels,
        selectedRows,
        setSelectedRows,
        selectedFields,
        setSelectedFields,
        isPrinting,
        showConfig,
        setShowConfig,
        showPrintSettings,
        setShowPrintSettings,
        showCodePreview,
        setShowCodePreview,
        labelSize,
        setLabelSize,
        fontSizeMultiplier,
        setFontSizeMultiplier,
        lineGapMultiplier,
        setLineGapMultiplier,
        letterSpacing,
        setLetterSpacing,
        fontFamily,
        setFontFamily,
        fieldFontSizes,
        setFieldFontSizes,
        selectedBatchId,
        setSelectedBatchId,
        batchName,
        setBatchName,
        editModalVisible,
        editForm,

        // Handlers
        sanitizeBatchName,
        handleExcelUpload,
        handleUploadToServer,
        handleDeleteBatch,
        handleDeleteLabel,
        handleEditLabel,
        handleUpdateLabel,
        handleCancelEdit,
        handlePrint,
        handlePrintCustomCode,
        handleSavePrintSettings,
        handleDisconnect,
        handleViewBatch,
        handleSaveToExistingBatch,
        handleSaveToNewBatch,
        downloadSampleExcel,
    };
};
