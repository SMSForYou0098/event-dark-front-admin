import React, { useState, useEffect } from 'react';
import { Tabs, Button, Input, Select, Upload, Row, Col, Typography, message } from 'antd';
import { EditOutlined, FontSizeOutlined, UploadOutlined, PictureOutlined, DeleteOutlined } from '@ant-design/icons';
import { MediaGalleryPickerModal } from 'components/shared-components/MediaGalleryPicker';

const { Text } = Typography;
const { Option } = Select;

// Signature font options – PDF built-in fonts only
export const SIGNATURE_FONTS = [
  { name: 'Helvetica', style: 'Helvetica' },
  { name: 'Times Roman', style: 'Times-Roman' },
  { name: 'Times Italic', style: 'Times-Italic' },
  { name: 'Courier', style: 'Courier' },
  { name: 'Helvetica Oblique', style: 'Helvetica-Oblique' },
];

/** Browser-friendly style for signature preview (Times-Italic and Helvetica-Oblique need fontStyle) */
function getBrowserFontStyle(font) {
  if (!font?.style) return { fontFamily: 'Helvetica' };
  if (font.style === 'Times-Italic') {
    return { fontFamily: 'Times New Roman, serif', fontStyle: 'italic' };
  }
  if (font.style === 'Helvetica-Oblique') {
    return { fontFamily: 'Helvetica, sans-serif', fontStyle: 'oblique' };
  }
  return { fontFamily: font.style };
}

function getPreviewFontStyle(selectedFont) {
  return { ...getBrowserFontStyle(selectedFont), fontSize: '32px', color: '#000' };
}

/**
 * SignatureInput - Reusable signature input component
 * Supports three modes: Draw, Type, Upload
 */
const SignatureInput = ({
    signatureType = 'type',
    onSignatureTypeChange,
    selectedFont = SIGNATURE_FONTS[0],
    onFontChange,
    typedSignature = '',
    onTypedSignatureChange,
    uploadedSignature = null,
    onUploadedSignatureChange,
    signaturePreview = null,
    onSignaturePreviewChange,
    canvasRef,
    onClearCanvas,
}) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

    const handleMediaSelect = (url) => {
        if (url) {
            if (onSignaturePreviewChange) onSignaturePreviewChange(url);
            if (onUploadedSignatureChange) onUploadedSignatureChange(url);
            setMediaPickerOpen(false);
        }
    };

    // Load existing signature on canvas when editing
    useEffect(() => {
        if (signatureType === 'draw' && signaturePreview && canvasRef?.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };

            img.src = signaturePreview;
        }
    }, [signatureType, signaturePreview, canvasRef]);

    // Drawing handlers
    const startDrawing = (e) => {
        const canvas = canvasRef?.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef?.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearCanvas = () => {
        const canvas = canvasRef?.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (onClearCanvas) onClearCanvas();
    };

    // Upload handlers
    const handleImageUpload = () => {
        // File is already handled in beforeUpload
    };

    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('Only image files allowed!');
            return false;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must be smaller than 2MB!');
            return false;
        }
        const validFormats = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validFormats.includes(file.type)) {
            message.error('Only JPG/PNG allowed!');
            return false;
        }
        // Store the actual file object for FormData
        if (onUploadedSignatureChange) {
            onUploadedSignatureChange(file);
        }
        // Create preview URL
        if (onSignaturePreviewChange) {
            onSignaturePreviewChange(URL.createObjectURL(file));
        }
        return false; // Prevent auto upload
    };

    return (
        <>

            <Tabs activeKey={signatureType} onChange={onSignatureTypeChange}>
                {/* Draw Signature Tab */}
                <Tabs.TabPane tab={<><EditOutlined /> Draw </>} key="draw">
                    <div className="text-center">
                        <div className="d-inline-block">
                            <canvas
                                ref={canvasRef}
                                width={600}
                                height={200}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                className="border border-2 rounded"
                                style={{
                                    cursor: 'crosshair',
                                    touchAction: 'none',
                                    maxWidth: '100%',
                                    background: 'white'
                                }}
                            />
                        </div>
                        <div className="mt-3">
                            <Button onClick={clearCanvas} danger>Clear Signature</Button>
                        </div>
                        <Text type="secondary" className="d-block mt-2">
                            Draw your signature using mouse/touchpad
                        </Text>
                    </div>
                </Tabs.TabPane>

                {/* Type Signature Tab */}
                <Tabs.TabPane tab={<><FontSizeOutlined /> Type</>} key="type">
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <div className="mb-3">
                                <label className="d-block mb-2">Select Font Style</label>
                                <Select
                                    value={selectedFont.name}
                                    onChange={(val) => {
                                        const font = SIGNATURE_FONTS.find(f => f.name === val);
                                        if (onFontChange) onFontChange(font);
                                    }}
                                    className="w-100"
                                >
                                    {SIGNATURE_FONTS.map(font => (
                                        <Option key={font.name} value={font.name}>
                                            <span style={{ ...getBrowserFontStyle(font), fontSize: '20px' }}>
                                                {font.name}
                                            </span>
                                        </Option>
                                    ))}
                                </Select>
                            </div>
                        </Col>
                        <Col xs={24} md={12}>
                            <div className="mb-3">
                                <label className="d-block mb-2">Type Your Signature</label>
                                <Input
                                    value={typedSignature}
                                    onChange={(e) => {
                                        if (onTypedSignatureChange) {
                                            onTypedSignatureChange(e.target.value);
                                        }
                                    }}
                                    placeholder="Enter your name"
                                    maxLength={50}
                                />
                            </div>
                        </Col>
                        <Col xs={24}>
                            <div className="border border-2 rounded p-4 text-center" style={{ background: 'white' }}>
                                <Text type="secondary" className="d-block mb-3 text-black">Signature Preview:</Text>
                                {typedSignature ? (
                                    <div style={getPreviewFontStyle(selectedFont)}>
                                        {typedSignature}
                                    </div>
                                ) : (
                                    <Text type="secondary">Type your name above to preview</Text>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Tabs.TabPane>

                {/* Upload Signature Tab */}
                <Tabs.TabPane tab={<><UploadOutlined /> Select</>} key="upload">
                    <div className="text-center">
                        {!signaturePreview ? (
                            <div
                                onClick={() => setMediaPickerOpen(true)}
                                className="d-inline-flex flex-column align-items-center justify-content-center p-4 border rounded"
                                style={{ cursor: 'pointer', minWidth: '300px', minHeight: '150px', borderStyle: 'dashed', background: 'white' }}
                            >
                                <PictureOutlined style={{ fontSize: '32px', marginBottom: '16px', color: '#1890ff' }} />
                                <Text strong style={{ fontSize: '16px' }}>Select Signature Image</Text>
                                <Text type="secondary" className="mt-2">Click to browse gallery</Text>
                            </div>
                        ) : (
                            <div className="text-center position-relative d-inline-block">
                                <div className="border border-2 rounded p-4 bg-white">
                                    <Text strong className="d-block mb-3 text-start">Selected Signature:</Text>
                                    <img
                                        src={signaturePreview}
                                        alt="Signature"
                                        className="img-fluid"
                                        style={{ maxHeight: '150px', maxWidth: '100%' }}
                                    />
                                </div>
                                <div className="mt-3">
                                    <Button
                                        icon={<PictureOutlined />}
                                        onClick={() => setMediaPickerOpen(true)}
                                        className="me-2"
                                    >
                                        Change Image
                                    </Button>
                                    <Button
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => {
                                            if (onSignaturePreviewChange) onSignaturePreviewChange(null);
                                            if (onUploadedSignatureChange) onUploadedSignatureChange(null);
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Tabs.TabPane>
            </Tabs>

            {/* Media Picker Modal */}
            <MediaGalleryPickerModal
                open={mediaPickerOpen}
                onCancel={() => setMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
                multiple={false}
                title="Select Signature"
                dimensionValidation={{ width: 600, height: 200, strict: false }}
            />
        </>
    );
};

export default SignatureInput;
