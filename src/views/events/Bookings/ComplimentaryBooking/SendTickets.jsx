import React, { useState } from 'react';
import { Button, Modal, Switch, Space, Progress, Spin, Tooltip, message } from 'antd';
import { WhatsAppOutlined, MessageOutlined, MailOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useMyContext } from '../../../../Context/MyContextProvider';

const ProgressDisplay = ({ type, number, percentage }) => (
    <div style={{ marginBottom: 24 }}>
        <p style={{ marginBottom: 8 }}>Sending {type} ticket to: <strong>{number}</strong></p>
        <Progress 
            percent={parseFloat(percentage)} 
            status="active"
            strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
            }}
        />
    </div>
);

const LoadingDisplay = ({ type }) => (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
            size="large"
        />
        <p style={{ marginTop: 16, marginBottom: 4, fontSize: 16 }}>
            Preparing to send tickets via {type}
        </p>
        <p style={{ color: '#8c8c8c', fontSize: 14 }}>
            Please wait while we initialize the process...
        </p>
    </div>
);

const SendTickets = ({ bookings }) => {
    const { handleWhatsappAlert, extractDetails, HandleSendSMS, sendMail } = useMyContext();
    const [sendToAll, setSendToAll] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [type, setType] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentNumber, setCurrentNumber] = useState('');

    const [progress, setProgress] = useState({
        Whatsapp: 0,
        SMS: 0,
        Email: 0
    });

    const updateProgress = (type, index, total) => {
        setProgress(prev => ({
            ...prev,
            [type]: ((index + 1) / total * 100).toFixed(2)
        }));
    };

    const resetProgress = () => {
        setProgress({
            Whatsapp: 0,
            SMS: 0,
            Email: 0
        });
    };

    const sendWhatsappTicket = async (booking, index, total) => {
        const { eventName, category, location, DateTime, thumbnail } = extractDetails(booking?.data);
        const values = [booking?.name, eventName, 1, category, location, DateTime];
        setCurrentNumber(booking?.number);
        await handleWhatsappAlert(booking?.number, 'bookingconfirmed2', values, thumbnail);
        updateProgress('Whatsapp', index, total);
    };

    const sendSMSTicket = async (booking, index, total) => {
        const { eventName, organizerSenderId, organizerApiKey, config_status, ticketName } = extractDetails(booking?.data);
        setCurrentNumber(booking?.number);
        await HandleSendSMS(
            booking?.number,
            null,
            organizerApiKey,
            organizerSenderId,
            config_status,
            booking?.name,
            1,
            ticketName,
            eventName
        );
        updateProgress('SMS', index, total);
    };

    const sendEmailTicket = async (booking, index, total) => {
        const { eventName, thumbnail, category, eventDate, eventTime, DateTime, address, location } = extractDetails(booking?.data);
        const data = {
            email: booking?.email,
            number: booking?.number,
            thumbnail,
            category,
            qty: 1,
            name: booking?.name,
            eventName,
            eventDate,
            eventTime,
            DateTime,
            address,
            location,
            price: 0,
            convenience_fee: 0,
            total: 0
        };
        setCurrentNumber(booking?.number);
        await sendMail([data]);
        updateProgress('Email', index, total);
    };

    const showSuccessAlert = () => {
        Modal.success({
            title: 'Tickets Sent!',
            content: 'All tickets have been sent successfully.',
            icon: <CheckCircleOutlined />,
        });
    };

    const handleSend = async (type) => {
        setShowModal(true);
        setType(type);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const totalBookings = bookings.length;

        try {
            if (type === 'All') {
                setIsProcessing(true);
                for (let i = 0; i < bookings.length; i++) {
                    const booking = bookings[i];
                    await sendWhatsappTicket(booking, i, totalBookings);
                    await sendSMSTicket(booking, i, totalBookings);
                    // await sendEmailTicket(booking, i, totalBookings);
                }
            } else {
                const sendFunction = {
                    Whatsapp: sendWhatsappTicket,
                    SMS: sendSMSTicket,
                    // Email: sendEmailTicket
                }[type];
                setIsProcessing(true);
                await Promise.all(
                    bookings.map((booking, index) => sendFunction(booking, index, totalBookings))
                );
            }

            resetProgress();
            setShowModal(false);
            setIsProcessing(false);
            showSuccessAlert();
        } catch (error) {
            console.error('Error sending tickets:', error);
            setIsProcessing(false);
            setShowModal(false);
            Modal.error({
                title: 'Error',
                content: 'Failed to send some tickets. Please try again.',
            });
        }
    };

    const getModalContent = (type) => {
        if (!isProcessing) {
            return (
                <LoadingDisplay
                    type={type === 'All' ? 'all channels' : type}
                />
            );
        }
        return (
            <>
                {progress.Whatsapp > 0 && (
                    <ProgressDisplay
                        type="Whatsapp"
                        number={currentNumber}
                        percentage={progress.Whatsapp}
                    />
                )}
                {progress.SMS > 0 && (
                    <ProgressDisplay
                        type="SMS"
                        number={currentNumber}
                        percentage={progress.SMS}
                    />
                )}
                {progress.Email > 0 && (
                    <ProgressDisplay
                        type="Email"
                        number={currentNumber}
                        percentage={progress.Email}
                    />
                )}
            </>
        );
    };

    return (
        <div>
            <Modal
                title="Sending Tickets"
                open={showModal}
                footer={null}
                closable={false}
                maskClosable={false}
                width={500}
            >
                {getModalContent(type)}
            </Modal>

            <div style={{ marginBottom: 20 }}>
                <Space>
                    <Switch
                        checked={sendToAll}
                        onChange={(checked) => setSendToAll(checked)}
                    />
                    <span>{sendToAll ? 'Send All' : 'Send Individually'}</span>
                </Space>
            </div>

            {sendToAll ? (
                <Button type="primary" onClick={() => handleSend('All')}>
                    Send Tickets
                </Button>
            ) : (
                <Space size="large">
                    <Tooltip title="WhatsApp" placement="top">
                        <Button
                            type="text"
                            icon={<WhatsAppOutlined style={{ fontSize: 24, color: '#25D366' }} />}
                            onClick={() => handleSend('Whatsapp')}
                            size="large"
                        />
                    </Tooltip>
                    <Tooltip title="SMS" placement="top">
                        <Button
                            type="text"
                            icon={<MessageOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />}
                            onClick={() => handleSend('SMS')}
                            size="large"
                        />
                    </Tooltip>
                    {/* <Tooltip title="Email" placement="top">
                        <Button
                            type="text"
                            icon={<MailOutlined style={{ fontSize: 22, color: '#8c8c8c' }} />}
                            onClick={() => handleSend('Email')}
                            size="large"
                        />
                    </Tooltip> */}
                </Space>
            )}
        </div>
    );
};

export default SendTickets;
