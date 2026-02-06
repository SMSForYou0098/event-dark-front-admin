// Label Forge - Main Component
// Thermal Printer Label Design Suite

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { message } from 'antd';
import {
    Header,
    Sidebar,
    Canvas,
    PropertiesPanel,
    ContextMenu,
    ConfirmationModal,
    CodeModal,
    VariableModal,
    ZPLPrintButton
} from './components';
import { useLabelForge } from './useLabelForge';
import { usePrinter } from '../../../Context/PrinterContext';
import { generatePrinterCode } from './codeGenerators';
import { captureAndGeneratePrintCommands } from './bitmapPrinter';

import './styles.css';

/**
 * LabelForge - Thermal Printer Label Designer
 * 
 * Features:
 * - Drag and drop label element placement
 * - Text, Barcode, QR Code, and Box elements
 * - Variable placeholders for dynamic content
 * - Multiple printer language support (TSPL, ZPL, ESC/POS)
 * - Undo/Redo support
 * - Template import/export
 * - Real-time preview
 */
const LabelForge = () => {
    const {
        // State
        labelSize,
        setLabelSize,
        elements,
        selectedIds,
        setSelectedIds,
        printerLang,
        setPrinterLang,
        showGrid,
        setShowGrid,
        snapEnabled,
        setSnapEnabled,
        activeTab,
        setActiveTab,
        gridSize,
        setGridSize,
        activeSidebarTab,
        setActiveSidebarTab,
        isVarModalOpen,
        setIsVarModalOpen,
        newVarName,
        setNewVarName,
        newVarValue,
        setNewVarValue,
        generatedCode,
        showCodeModal,
        setShowCodeModal,
        showComments,
        setShowComments,
        contextMenu,
        setContextMenu,
        confirmationState,
        setConfirmationState,
        viewTransform,
        setViewTransform,
        isPanning,
        setIsPanning,
        marquee,
        setMarquee,

        // Refs
        panStart,
        fileInputRef,
        elementDimensions,
        containerRef,
        mainRef,

        // Computed
        primarySelection,
        allVariables,
        historyIndex,
        historyLength,

        // Actions
        undo,
        redo,
        handleReset,
        handleLoadDemo,
        handleExportTemplate,
        handleImportTemplate,
        handleAddCustomVar,
        handleMeasure,
        handleSelect,
        handleMoveLayer,
        handleDuplicate,
        addElement,
        updateElement,
        handleInteractionEnd,
        deleteElement,
        handleAlign,
        centerView,
        handleGenerateCode,
        copyCodeToClipboard,
    } = useLabelForge();

    // Printer context for direct printing
    const { isConnected, sendData, connectUSB, connectBluetooth, status, deviceName } = usePrinter();

    // Ref for preview canvas (used for bitmap capture)
    const previewRef = useRef(null);
    const [isPrinting, setIsPrinting] = useState(false);

    // Handle direct print to thermal printer (bypasses browser print dialog)
    // Uses bitmap mode - captures the hidden clean print canvas as an image
    const handlePrint = useCallback(async () => {
        if (!isConnected) {
            message.warning('Printer not connected. Please connect a printer first.');
            return;
        }

        if (!previewRef.current) {
            message.error('Print canvas not available. Please try again.');
            return;
        }

        setIsPrinting(true);
        try {
            // Capture hidden clean print canvas as bitmap and generate printer commands
            const printData = await captureAndGeneratePrintCommands(
                previewRef.current,
                printerLang,
                labelSize,
                1 // copies
            );
            
            // Send to printer
            await sendData(printData);
            message.success('Label printed successfully!');
        } catch (err) {
            console.error('Print error:', err);
            message.error(`Print failed: ${err.message}`);
        } finally {
            setIsPrinting(false);
        }
    }, [isConnected, printerLang, labelSize, sendData]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

            // Undo/Redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
                return;
            }

            // Delete
            if (selectedIds.length > 0 && activeTab === 'editor') {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    deleteElement();
                }

                // Arrow key movement
                if (e.key.startsWith('Arrow')) {
                    e.preventDefault();
                    const step = e.shiftKey ? 5 : 0.5;
                    selectedIds.forEach(id => {
                        const el = elements.find(ele => ele.id === id);
                        if (el) {
                            let nx = el.x, ny = el.y;
                            if (e.key === 'ArrowUp') ny -= step;
                            if (e.key === 'ArrowDown') ny += step;
                            if (e.key === 'ArrowLeft') nx -= step;
                            if (e.key === 'ArrowRight') nx += step;
                            updateElement(id, { x: nx, y: ny });
                        }
                    });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, elements, deleteElement, undo, redo, activeTab, updateElement]);

    // Close context menu on click
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [setContextMenu]);

    return (
        <div className="label-forge-container d-flex flex-column vh-100 bg-light overflow-hidden">
            {/* Hidden file input for import */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportTemplate}
                className="d-none"
                accept=".json"
            />

            {/* Header */}
            <Header
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                printerLang={printerLang}
                setPrinterLang={setPrinterLang}
                historyIndex={historyIndex}
                historyLength={historyLength}
                undo={undo}
                redo={redo}
                handleReset={handleReset}
                handleLoadDemo={handleLoadDemo}
                handleExportTemplate={handleExportTemplate}
                onImportClick={() => fileInputRef.current?.click()}
                handleGenerateCode={handleGenerateCode}
                // Printer props
                handlePrint={handlePrint}
                isPrinting={isPrinting}
                isConnected={isConnected}
                connectUSB={connectUSB}
                connectBluetooth={connectBluetooth}
                printerStatus={status}
                deviceName={deviceName}
            />

            {/* Main Content */}
            <div className="d-flex flex-fill overflow-hidden position-relative">
                {/* Left Sidebar */}
                <Sidebar
                    activeSidebarTab={activeSidebarTab}
                    setActiveSidebarTab={setActiveSidebarTab}
                    labelSize={labelSize}
                    setLabelSize={setLabelSize}
                    activeTab={activeTab}
                    addElement={addElement}
                    allVariables={allVariables}
                    onOpenVarModal={() => setIsVarModalOpen(true)}
                    elements={elements}
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    onMoveLayer={handleMoveLayer}
                />

                {/* Canvas */}
                <Canvas
                    activeTab={activeTab}
                    labelSize={labelSize}
                    elements={elements}
                    selectedIds={selectedIds}
                    viewTransform={viewTransform}
                    setViewTransform={setViewTransform}
                    isPanning={isPanning}
                    setIsPanning={setIsPanning}
                    marquee={marquee}
                    setMarquee={setMarquee}
                    panStart={panStart}
                    containerRef={containerRef}
                    mainRef={mainRef}
                    elementDimensions={elementDimensions}
                    showGrid={showGrid}
                    setShowGrid={setShowGrid}
                    snapEnabled={snapEnabled}
                    setSnapEnabled={setSnapEnabled}
                    gridSize={gridSize}
                    setGridSize={setGridSize}
                    handleSelect={handleSelect}
                    updateElement={updateElement}
                    handleInteractionEnd={handleInteractionEnd}
                    handleMeasure={handleMeasure}
                    setSelectedIds={setSelectedIds}
                    setContextMenu={setContextMenu}
                    handleAlign={handleAlign}
                    centerView={centerView}
                    allVariables={allVariables}
                    previewRef={previewRef}
                />

                {/* Right Properties Panel */}
                {activeTab === 'editor' && (
                    <PropertiesPanel
                        primarySelection={primarySelection}
                        selectedIds={selectedIds}
                        onUpdate={updateElement}
                        onInteractionEnd={handleInteractionEnd}
                        onDelete={deleteElement}
                    />
                )}
            </div>

            {/* Context Menu */}
            <ContextMenu
                contextMenu={contextMenu}
                onDuplicate={handleDuplicate}
                onMoveLayer={handleMoveLayer}
                onDelete={deleteElement}
                onAddElement={addElement}
                onCenterView={centerView}
                onClose={() => setContextMenu(null)}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmationState.isOpen}
                title={confirmationState.title}
                message={confirmationState.message}
                onConfirm={confirmationState.onConfirm}
                onCancel={() => setConfirmationState({ 
                    ...confirmationState, 
                    isOpen: false 
                })}
            />

            {/* Code Modal */}
            <CodeModal
                isOpen={showCodeModal}
                onClose={() => setShowCodeModal(false)}
                code={generatedCode}
                printerLang={printerLang}
                showComments={showComments}
                onShowCommentsChange={setShowComments}
                onCopy={copyCodeToClipboard}
            />

            {/* Variable Modal */}
            <VariableModal
                isOpen={isVarModalOpen}
                onClose={() => setIsVarModalOpen(false)}
                varName={newVarName}
                varValue={newVarValue}
                onVarNameChange={setNewVarName}
                onVarValueChange={setNewVarValue}
                onAdd={handleAddCustomVar}
            />
            <ZPLPrintButton />
        </div>
    );
};

export default LabelForge;
