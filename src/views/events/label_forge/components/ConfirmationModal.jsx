// Confirmation Modal Component for Label Forge

import React from 'react';
import { Modal, Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

/**
 * Confirmation modal for destructive actions
 */
const ConfirmationModal = ({ 
    isOpen, 
    title, 
    message, 
    onConfirm, 
    onCancel 
}) => {
    return (
        <Modal
            open={isOpen}
            title={null}
            footer={null}
            onCancel={onCancel}
            centered
            width={400}
            className="confirmation-modal"
        >
            <div className="d-flex align-items-start p-2">
                <div 
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{ 
                        backgroundColor: '#e6f7ff', 
                        width: 48, 
                        height: 48,
                        flexShrink: 0
                    }}
                >
                    <ExclamationCircleOutlined 
                        style={{ fontSize: 24, color: '#1890ff' }} 
                    />
                </div>
                <div>
                    <h5 className="mb-2 fw-semibold">{title}</h5>
                    <p className="text-muted mb-0" style={{ fontSize: 14 }}>
                        {message}
                    </p>
                </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <Button onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="primary" onClick={onConfirm}>
                    Confirm
                </Button>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
