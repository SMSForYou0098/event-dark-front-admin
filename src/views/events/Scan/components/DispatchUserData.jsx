import React, { useState, useRef } from 'react';
import { Drawer, Descriptions, Button, Tag, Space, Card, Timeline, Typography, Divider, Image, Input, message } from 'antd';
import {
    CheckCircleOutlined,
    CloseOutlined,
    UserOutlined,
    PhoneOutlined,
    IdcardOutlined,
    CalendarOutlined,
    TagOutlined,
    EnvironmentOutlined,
    HistoryOutlined,
    LoadingOutlined,
    SendOutlined,
    FileTextOutlined,
    PrinterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useMyContext } from 'Context/MyContextProvider';
import AttendeesPrint from './AttendeesPrint';

const { Text, Title } = Typography;

const DispatchUserData = ({
    show,
    setShow,
    ticketData,
    loading,
    handleUpdateStatus
}) => {
    const { isMobile } = useMyContext();
    const { booking, dispatch_hash } = ticketData || {};
    const [notes, setNotes] = useState('');
    const attendeesPrintRef = useRef(null);

    // Build attendees list from booking attendee (single -> array)
    const attendeesList = booking?.attendee ? [booking.attendee] : [];

    if (!booking) return null;

    const handleClose = () => {
        setShow(false);
        setNotes('');
    };

    const onUpdateClick = () => {
        handleUpdateStatus({
            id: booking.id,
            dispatch_hash: dispatch_hash,
            notes: notes,
            token: ticketData?.token
        });
    };

    // Booking Information
    const bookingInfo = [
        {
            label: <><IdcardOutlined className='text-primary mr-2' /> Name</>,
            value: booking?.user?.name || booking?.name || 'N/A',
        },
        {
            label: <><PhoneOutlined className='text-primary mr-2' style={{ transform: 'rotate(100deg)' }} /> Number</>,
            value: <Text copyable>{booking?.user?.number || booking?.number || 'N/A'}</Text>,
        },
        {
                label: <><EnvironmentOutlined className='text-primary mr-2' /> Address</>,
                value: booking?.user?.address || booking?.address || null,
            },
            {
                label: <><TagOutlined className='text-primary mr-2' /> Ticket</>,
                value: <Tag color="cyan">{booking?.ticket?.name}</Tag>,
            },
            {
                label: <><CalendarOutlined className='text-primary mr-2' /> Event</>,
                value: <Text strong>{booking?.ticket?.event?.name}</Text>,
            },
            
        {
            label: <><CheckCircleOutlined className='text-primary mr-2' /> Dispatched</>,
            value: <Tag color={booking?.is_dispatched ? "success" : "warning"}>{booking?.is_dispatched ? "Yes" : "No"}</Tag>,
        },
    ];

    // Format Date
    const formatDate = (date) => {
        if (!date) return 'N/A';
        return dayjs(date).format('DD MMM YYYY, hh:mm A');
    };

    return (
        <>
        <Drawer
            open={show}
            closable={false}
            placement={isMobile ? 'bottom' : "right"}
            height="85vh"
            width={isMobile ? "100%" : "600px"}
            title={
                <Space size="small">
                    <SendOutlined style={{ color: '#1890ff' }} />
                    <span>Dispatch Details</span>
                </Space>
            }
            extra={
                <CloseOutlined onClick={handleClose} />
            }
            footer={
                <Space direction="vertical" size="middle" className="w-100">
                    <Button
                        type="default"
                        className="w-100"
                        onClick={() => attendeesPrintRef.current?.handlePrintAllAttendees()}
                        icon={<PrinterOutlined />}
                        size="large"
                        block
                    >
                        Print {attendeesList.length > 0 ? `Attendees (${attendeesList.length})` : 'User Data'}
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        icon={<CheckCircleOutlined />}
                        onClick={onUpdateClick}
                        loading={loading?.updating}
                        block
                    >
                        Update Status
                    </Button>
                </Space>
            }
        >
            <Descriptions bordered column={1} size="small" className="mb-4">
                {bookingInfo
                    .filter((item) => item.value !== null && item.value !== undefined)
                    .map((item, idx) => (
                        <Descriptions.Item key={idx} label={item.label}>
                            {item.value}
                        </Descriptions.Item>
                    ))}
            </Descriptions>

            {booking.attendee && (
                <Card size="small" className="mt-3 mb-3" title="Attendee Details">
                    <Descriptions size="small" column={1}>
                        <Descriptions.Item label="Name">{booking.attendee.name}</Descriptions.Item>
                        <Descriptions.Item label="Email">{booking.attendee.email}</Descriptions.Item>
                    </Descriptions>
                </Card>
            )}

            <Card size="small" className="mb-3" title={<><FileTextOutlined /> Dispatch Notes (Optional)</>}>
                <Input.TextArea
                    rows={3}
                    placeholder="Enter any notes for this dispatch update..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </Card>

            {booking?.dispatches && booking.dispatches.length > 0 && (
                <Card title={<><HistoryOutlined /> Dispatch History</>} size="small" className="mt-3">
                    <Timeline mode="left" className="mt-2">
                        {booking.dispatches.map((dispatch, index) => (
                            <Timeline.Item
                                key={dispatch.id}
                                color={dispatch.status === 'delivered' ? 'green' : 'blue'}
                                label={formatDate(dispatch.created_at)}
                            >
                                <Text strong>{dispatch.status.toUpperCase()}</Text>
                                <br />
                                <Text type="secondary">By: {dispatch.dispatcher?.name || 'Unknown'}</Text>
                                {dispatch.notes && (
                                    <div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>{dispatch.notes}</Text>
                                    </div>
                                )}
                            </Timeline.Item>
                        ))}
                    </Timeline>
                </Card>
            )}
        </Drawer>

            <AttendeesPrint
                ref={attendeesPrintRef}
                attendeesList={attendeesList}
                eventData={booking?.ticket?.event}
                ticket={booking?.ticket}
                bookings={booking}
                primaryColor="#1890ff"
            />
        </>
    );
};

export default DispatchUserData;
