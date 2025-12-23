import React from "react";
import { Card, Tabs, Modal, Button, Space, Tag, Badge, Tooltip } from "antd";
import {
    SettingsIcon,
    Upload,
    Layers,
    Printer,
    CheckCircle,
    Zap
} from "lucide-react";
import printLoader from "assets/event/stock/print_loader.gif";
import Loader from "utils/Loader";

// Child Components
import {
    UploadTab,
    BatchesTab,
    PrintTab,
    InstantPrintTab,
    PrinterConfigDrawer,
    PrintSettingsDrawer,
    EditLabelModal,
    PrintPreview,
    useLabelPrintingState,
    AVAILABLE_FIELDS,
} from "./components";

/**
 * Label Printing Module
 * Manages label upload, batch management, and printing
 */
const LabelPrinting = () => {
    const {
        // Refs
        printRef,

        // Context
        isMobile,

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
        isUploading,
        isUpdatingLabel,

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
        labelSize,
        setLabelSize,
        fontSizeMultiplier,
        setFontSizeMultiplier,
        lineGapMultiplier,
        setLineGapMultiplier,
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
        handleSavePrintSettings,
        handleDisconnect,
        handleViewBatch,
        handleSaveToExistingBatch,
        handleSaveToNewBatch,
        isSaving,
        UserData,
    } = useLabelPrintingState();

    // Table columns for preview (using API field names)
    const previewColumns = [
        { title: "First Name", dataIndex: "name" },
        { title: "Surname", dataIndex: "surname" },
        { title: "Mobile", dataIndex: "number" },
        { title: "Designation", dataIndex: "designation" },
        { title: "Company", dataIndex: "company_name" },
        { title: "Stall", dataIndex: "stall_number", align: "center" },
    ];

    // Tab items with icons and badges
    const tabItems = [
        {
            key: "upload",
            label: (
                <Space>
                    <Upload size={16} />
                    <span>Upload New</span>
                    {pendingLabels.length > 0 && (
                        <Badge
                            count={pendingLabels.length}
                            size="small"
                            style={{ marginLeft: 4 }}
                        />
                    )}
                </Space>
            ),
            children: (
                <UploadTab
                    excelData={excelData}
                    pendingLabels={pendingLabels}
                    batchName={batchName}
                    setBatchName={setBatchName}
                    sanitizeBatchName={sanitizeBatchName}
                    handleExcelUpload={handleExcelUpload}
                    handleUploadToServer={handleUploadToServer}
                    isUploading={isUploading}
                    columns={previewColumns}
                    fontFamily={fontFamily}
                />
            ),
        },
        {
            key: "batches",
            label: (
                <Space>
                    <Layers size={16} />
                    <span>Saved Batches</span>
                    {batchGroups.length > 0 && (
                        <Badge
                            count={batchGroups.length}
                            size="small"
                            style={{ marginLeft: 4 }}
                        />
                    )}
                </Space>
            ),
            children: (
                <BatchesTab
                    batchGroups={batchGroups}
                    isLoading={isLoadingLabels}
                    onRefresh={refetchLabels}
                    onViewBatch={handleViewBatch}
                    onDeleteBatch={handleDeleteBatch}
                    onAddLabel={handleSaveToExistingBatch}
                    isSaving={isSaving}
                    userId={UserData?.id}
                />
            ),
        },
        {
            key: "print",
            label: (
                <Space>
                    <Printer size={16} />
                    <span>Print Labels</span>
                    {selectedRows.length > 0 && (
                        <Badge
                            count={selectedRows.length}
                            size="small"
                            style={{ marginLeft: 4, backgroundColor: '#52c41a' }}
                        />
                    )}
                </Space>
            ),
            children: (
                <PrintTab
                    batchGroups={batchGroups}
                    selectedBatchId={selectedBatchId}
                    setSelectedBatchId={setSelectedBatchId}
                    selectedBatchLabels={selectedBatchLabels}
                    selectedRows={selectedRows}
                    setSelectedRows={setSelectedRows}
                    labelSize={labelSize}
                    setLabelSize={setLabelSize}
                    isPrinting={isPrinting}
                    onPrint={handlePrint}
                    onOpenSettings={() => setShowPrintSettings(true)}
                    onEditLabel={handleEditLabel}
                    onDeleteLabel={handleDeleteLabel}
                    fontFamily={fontFamily}
                    isConnected={isConnected}
                    connectionMode={connectionMode}
                    isLoadingBatches={isLoadingLabels}
                />
            ),
        },
        {
            key: "instant",
            label: (
                <Space>
                    <Zap size={16} />
                    <span>Instant Print</span>
                </Space>
            ),
            children: (
                <InstantPrintTab
                    labelSize={labelSize}
                    setLabelSize={setLabelSize}
                    isPrinting={isPrinting}
                    onInstantPrint={(data) => {
                        // Handle instant printing with standard fields
                        handlePrint(data);
                    }}
                    onOpenSettings={() => setShowPrintSettings(true)}
                    fontFamily={fontFamily}
                    isConnected={isConnected}
                    connectionMode={connectionMode}
                    selectedFields={selectedFields}
                    fieldFontSizes={fieldFontSizes}
                    setFieldFontSizes={setFieldFontSizes}
                    batchGroups={batchGroups}
                    onSaveToExistingBatch={handleSaveToExistingBatch}
                    onSaveToNewBatch={handleSaveToNewBatch}
                    isSaving={isSaving}
                    isLoadingBatches={isLoadingLabels}
                    userId={UserData?.id}
                />
            ),
        },
    ];

    return (
        <>
            {/* Loading Modal during printing */}
            <Modal
                open={isPrinting}
                footer={null}
                closable={false}
                centered
                width={280}
                styles={{ body: { padding: '40px 20px' } }}
            >
                <div className="text-center">
                    <Loader width={120} imgUrl={printLoader} />
                    <p className="mt-3 mb-0" style={{ fontSize: 16, fontWeight: 500 }}>
                        Printing {selectedRows.length} label(s)...
                    </p>
                </div>
            </Modal>

            {/* Edit Label Modal */}
            <EditLabelModal
                open={editModalVisible}
                onCancel={handleCancelEdit}
                onOk={handleUpdateLabel}
                form={editForm}
                isLoading={isUpdatingLabel}
            />

            {/* Printer Configuration Drawer */}
            <PrinterConfigDrawer
                open={showConfig}
                onClose={() => setShowConfig(false)}
                connectionMode={connectionMode}
                setConnectionMode={setConnectionMode}
                printerType={printerType}
                setPrinterType={setPrinterType}
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
                fieldFontSizes={fieldFontSizes}
                setFieldFontSizes={setFieldFontSizes}
                isMobile={isMobile}
            />

            {/* Main Content */}
            <Card
                title={
                    <div className="d-flex align-items-center gap-2">
                        <Printer size={20} />
                        <span>Label Printing</span>
                    </div>
                }
                extra={
                    <Space>
                        {isConnected && (
                            <Tag color="success" icon={<CheckCircle size={12} />}>
                                Printer Connected
                            </Tag>
                        )}
                        <Tooltip title="Printer Setup">
                            <Button
                                icon={<Printer size={16} />}
                                onClick={() => setShowConfig(true)}
                            />
                        </Tooltip>
                    </Space>
                }
                styles={{
                    body: { padding: isMobile ? 12 : 24 },
                    header: { padding: isMobile ? '12px 16px' : undefined }
                }}
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    size={isMobile ? "small" : "middle"}
                    tabBarStyle={{ marginBottom: isMobile ? 16 : 24 }}
                />
            </Card>

            {/* Hidden Print Preview for Browser Print */}
            <PrintPreview
                ref={printRef}
                selectedRows={selectedRows}
                selectedFields={selectedFields}
                fontFamily={fontFamily}
                fontSizeMultiplier={fontSizeMultiplier}
                fieldFontSizes={fieldFontSizes}
                lineGapMultiplier={lineGapMultiplier}
            />
        </>
    );
};

export default LabelPrinting;
