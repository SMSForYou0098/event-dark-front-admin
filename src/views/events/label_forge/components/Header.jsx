// Header Component for Label Forge

import React from 'react';
import { Button, Select, Tooltip } from 'antd';
import {
    UndoOutlined,
    RedoOutlined,
    CodeOutlined,
    SaveOutlined,
    UploadOutlined,
    ReloadOutlined,
    LayoutOutlined
} from '@ant-design/icons';
import { Printer, PenTool, Eye } from 'lucide-react';
import { PRINTER_LANGUAGES } from '../constants';

/**
 * Header component with tabs and toolbar
 */
const Header = ({
    activeTab,
    setActiveTab,
    printerLang,
    setPrinterLang,
    historyIndex,
    historyLength,
    undo,
    redo,
    handleReset,
    handleLoadDemo,
    handleExportTemplate,
    onImportClick,
    handleGenerateCode
}) => {
    return (
        <header className="bg-white border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
            {/* Left side - Logo & Tabs */}
            <div className="d-flex align-items-center gap-4">
                {/* Logo */}
                <div className="d-flex align-items-center gap-2">
                    <div 
                        className="d-flex align-items-center justify-content-center rounded"
                        style={{ 
                            width: 40, 
                            height: 40, 
                            backgroundColor: '#1890ff' 
                        }}
                    >
                        <Printer size={22} color="white" />
                    </div>
                    <div>
                        <h5 className="mb-0 fw-bold" style={{ fontSize: 16 }}>
                            LabelForge
                        </h5>
                        <small className="text-muted" style={{ fontSize: 11 }}>
                            Thermal Printer Design Suite
                        </small>
                    </div>
                </div>

                {/* Tabs */}
                <div 
                    className="d-flex rounded p-1"
                    style={{ backgroundColor: '#f5f5f5' }}
                >
                    <Button
                        type={activeTab === 'editor' ? 'primary' : 'text'}
                        size="small"
                        icon={<PenTool size={14} />}
                        onClick={() => setActiveTab('editor')}
                        style={{ 
                            boxShadow: activeTab === 'editor' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        Editor
                    </Button>
                    <Button
                        type={activeTab === 'preview' ? 'primary' : 'text'}
                        size="small"
                        icon={<Eye size={14} />}
                        onClick={() => setActiveTab('preview')}
                        style={{ 
                            boxShadow: activeTab === 'preview' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        Preview
                    </Button>
                </div>
            </div>

            {/* Right side - Actions */}
            <div className="d-flex align-items-center gap-3">
                {/* File Operations */}
                <div 
                    className="d-flex align-items-center gap-1 rounded p-1"
                    style={{ backgroundColor: '#f5f5f5' }}
                >
                    <Tooltip title="Reset Canvas">
                        <Button
                            type="text"
                            size="small"
                            icon={<ReloadOutlined />}
                            onClick={handleReset}
                            danger
                        />
                    </Tooltip>
                    <div 
                        style={{ 
                            width: 1, 
                            height: 20, 
                            backgroundColor: '#d9d9d9', 
                            margin: '0 4px' 
                        }} 
                    />
                    <Tooltip title="Load Demo Template">
                        <Button
                            type="text"
                            size="small"
                            icon={<LayoutOutlined />}
                            onClick={handleLoadDemo}
                        />
                    </Tooltip>
                    <Tooltip title="Export Template">
                        <Button
                            type="text"
                            size="small"
                            icon={<SaveOutlined />}
                            onClick={handleExportTemplate}
                            style={{ color: '#52c41a' }}
                        />
                    </Tooltip>
                    <Tooltip title="Import Template">
                        <Button
                            type="text"
                            size="small"
                            icon={<UploadOutlined />}
                            onClick={onImportClick}
                            style={{ color: '#fa8c16' }}
                        />
                    </Tooltip>
                </div>

                {/* Undo/Redo */}
                <div 
                    className="d-flex align-items-center gap-1 rounded p-1"
                    style={{ backgroundColor: '#f5f5f5' }}
                >
                    <Tooltip title="Undo (Ctrl+Z)">
                        <Button
                            type="text"
                            size="small"
                            icon={<UndoOutlined />}
                            onClick={undo}
                            disabled={historyIndex <= 0}
                        />
                    </Tooltip>
                    <Tooltip title="Redo (Ctrl+Y)">
                        <Button
                            type="text"
                            size="small"
                            icon={<RedoOutlined />}
                            onClick={redo}
                            disabled={historyIndex >= historyLength - 1}
                        />
                    </Tooltip>
                </div>

                {/* Printer Language */}
                <div 
                    className="d-flex align-items-center gap-2 rounded p-1 px-2"
                    style={{ backgroundColor: '#f5f5f5' }}
                >
                    <span className="small fw-semibold text-muted">
                        Language:
                    </span>
                    <Select
                        size="small"
                        value={printerLang}
                        onChange={setPrinterLang}
                        style={{ width: 160 }}
                        options={PRINTER_LANGUAGES}
                    />
                </div>

                {/* Generate Code Button */}
                <Button
                    type="primary"
                    icon={<CodeOutlined />}
                    onClick={handleGenerateCode}
                    style={{ 
                        backgroundColor: '#1f2937',
                        borderColor: '#1f2937'
                    }}
                >
                    Generate Code
                </Button>
            </div>
        </header>
    );
};

export default Header;
