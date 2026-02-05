// Code Modal Component for Label Forge

import React from 'react';
import { Modal, Button, Switch, Space, Typography } from 'antd';
import { CopyOutlined, CodeOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * Modal to display generated printer code
 */
const CodeModal = ({ 
    isOpen, 
    onClose, 
    code, 
    printerLang,
    showComments,
    onShowCommentsChange,
    onCopy
}) => {
    return (
        <Modal
            open={isOpen}
            title={
                <Space>
                    <CodeOutlined />
                    <span>Generated {printerLang} Code</span>
                </Space>
            }
            onCancel={onClose}
            width={700}
            centered
            footer={
                <div className="d-flex justify-content-between align-items-center">
                    <Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Show Comments:
                        </Text>
                        <Switch 
                            size="small"
                            checked={showComments}
                            onChange={onShowCommentsChange}
                        />
                    </Space>
                    <Space>
                        <Button onClick={onClose}>
                            Close
                        </Button>
                        <Button 
                            type="primary" 
                            icon={<CopyOutlined />}
                            onClick={onCopy}
                        >
                            Copy to Clipboard
                        </Button>
                    </Space>
                </div>
            }
        >
            <div 
                style={{ 
                    backgroundColor: '#1e1e1e', 
                    borderRadius: 8,
                    maxHeight: '60vh',
                    overflow: 'auto'
                }}
            >
                <pre 
                    style={{ 
                        color: '#4ade80', 
                        fontFamily: 'monospace',
                        fontSize: 13,
                        padding: 20,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                    }}
                >
                    {code}
                </pre>
            </div>
        </Modal>
    );
};

export default CodeModal;
