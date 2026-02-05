// Variable Modal Component for Label Forge

import React from 'react';
import { Modal, Input, Button } from 'antd';

/**
 * Modal for adding custom variables
 */
const VariableModal = ({ 
    isOpen, 
    onClose, 
    varName,
    varValue,
    onVarNameChange,
    onVarValueChange,
    onAdd
}) => {
    return (
        <Modal
            open={isOpen}
            title="Add Custom Variable"
            onCancel={onClose}
            centered
            width={400}
            footer={
                <div className="d-flex justify-content-end gap-2">
                    <Button onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="primary" onClick={onAdd}>
                        Add Variable
                    </Button>
                </div>
            }
        >
            <div className="py-3">
                <div className="mb-3">
                    <label className="d-block mb-1 small text-muted fw-medium">
                        Variable Name
                    </label>
                    <Input
                        placeholder="e.g. batch_no"
                        value={varName}
                        onChange={(e) => onVarNameChange(e.target.value)}
                    />
                    <small className="text-muted">
                        Will be formatted as {'{variable_name}'}
                    </small>
                </div>
                <div>
                    <label className="d-block mb-1 small text-muted fw-medium">
                        Mock Value (for preview)
                    </label>
                    <Input
                        placeholder="e.g. B-99281"
                        value={varValue}
                        onChange={(e) => onVarValueChange(e.target.value)}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default VariableModal;
