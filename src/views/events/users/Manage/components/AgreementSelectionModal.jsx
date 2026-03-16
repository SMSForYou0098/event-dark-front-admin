import React from 'react';
import { Modal, Button, Select, Typography, Popconfirm } from 'antd';
import AgreementPdfViewer from 'components/shared-components/AgreementPdfViewer';
import DOMPurify from 'dompurify';

/**
 * Agreement Selection Modal Component
 * Used for selecting and previewing agreement before assignment
 */
const AgreementSelectionModal = ({
    open,
    onClose,
    onAssign,
    agreementOptions,
    selectedAgreementId,
    onAgreementChange,
    selectedAgreement,
    processedContent,
    isLoading = false,
}) => {
    return (
        <Modal
            open={open}
            title="Select Agreement - Create Organizer"
            onCancel={onClose}
            width={1000}
            footer={[
                <Button className='mr-2' key="cancel" onClick={onClose}>
                    Cancel
                </Button>,
                <Popconfirm
                    key="approve"
                    title="Assign Agreement"
                    description="Are you sure you want to assign this agreement to this user?"
                    onConfirm={onAssign}
                    okText="Yes"
                    cancelText="No"
                    placement="bottomRight"
                    okButtonProps={{ loading: isLoading }}
                >
                    <Button
                        type="primary"
                        disabled={!selectedAgreementId}
                        loading={isLoading}
                    >
                        Assign Agreement
                    </Button>
                </Popconfirm>,
            ]}
            destroyOnClose
        >
            {agreementOptions.length > 0 ? (
                <>
                    <div style={{ marginBottom: 16 }}>
                        <Typography.Text strong>Select Agreement Template:</Typography.Text>
                        <Select
                            placeholder="Choose an agreement template"
                            style={{ width: '100%', marginTop: 8 }}
                            options={agreementOptions}
                            value={selectedAgreementId}
                            onChange={onAgreementChange}
                        />
                    </div>

                    {selectedAgreement && (
                        <div style={{ marginBottom: 16 }}>
                            <AgreementPdfViewer
                                content={DOMPurify.sanitize(processedContent)}
                                adminSignature={selectedAgreement}
                                title={selectedAgreement?.title}
                            />
                        </div>
                    )}
                </>
            ) : (
                <Typography.Text type="warning">
                    No agreement found. Please create an agreement first.
                </Typography.Text>
            )}
        </Modal>
    );
};

export default AgreementSelectionModal;
