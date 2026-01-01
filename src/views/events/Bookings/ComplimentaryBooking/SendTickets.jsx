import React, { useState } from 'react';
import { Button, Modal, Spin, message } from 'antd';
import { LoadingOutlined, CheckCircleOutlined, SendOutlined } from '@ant-design/icons';
import api from 'auth/FetchInterceptor';

const SendTickets = ({ batchId }) => {
    const [showModal, setShowModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const showSuccessAlert = () => {
        Modal.success({
            title: 'Tickets Sent!',
            content: 'All tickets have been sent successfully.',
            icon: <CheckCircleOutlined />,
        });
    };

    const handleSend = async () => {
        if (!batchId) {
            message.error("Batch ID not found. Please create bookings first.");
            return;
        }

        setShowModal(true);
        setIsProcessing(true);

        try {
            const response = await api.post("/resend-ticket-bulk", {
                batch_id: batchId,
                table_name: "complimentary_bookings"
            });

            if (response.status) {
                showSuccessAlert();
            } else {
                message.error(response.message || "Failed to send tickets.");
            }
        } catch (error) {
            console.error('Error sending tickets:', error);
            Modal.error({
                title: 'Error',
                content: 'Failed to send tickets. Please try again.',
            });
        } finally {
            setIsProcessing(false);
            setShowModal(false);
        }
    };

    return (
        <>
            <Modal
                title="Sending Tickets"
                open={showModal}
                footer={null}
                closable={false}
                maskClosable={false}
                width={400}
            >
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <Spin
                        indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
                        size="large"
                    />
                    <p style={{ marginTop: 16, marginBottom: 4, fontSize: 16 }}>
                        Sending tickets in bulk...
                    </p>
                    <p style={{ color: '#8c8c8c', fontSize: 14 }}>
                        Please wait while we process your request...
                    </p>
                </div>
            </Modal>

            <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={isProcessing}
            >
                Send Bulk Tickets
            </Button>
        </>
    );
};

export default SendTickets;
