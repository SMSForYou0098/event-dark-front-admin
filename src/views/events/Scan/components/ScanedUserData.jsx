import React, { useEffect, useRef } from 'react';
import {
  Descriptions, List, Tag, Button, Divider, Space,
  Typography, Drawer, Card, Image, Row, Col, Carousel, Badge, Modal
} from 'antd';
import DataTable from 'views/events/common/DataTable';
import {
  CheckCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  TagOutlined,
  IdcardOutlined,
  TeamOutlined,
  LoadingOutlined,
  CloseOutlined,
  MailOutlined,
  FileImageOutlined,
  ExclamationCircleOutlined,
  PrinterOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useMyContext } from 'Context/MyContextProvider';
import Loader from 'utils/Loader';
import { MdProductionQuantityLimits } from 'react-icons/md';

const { Text, Title } = Typography;

const ScanedUserData = ({
  show,
  setShow,
  setAttendees,
  ticketData,
  showAttendeee,
  attendees = [],
  handleVerify,
  handlePrintAttendees,
  loading
}) => {
  const {
    bookings = {},
    is_master = false,
    type = '',
    event = {},
    scan_history = []
  } = ticketData ?? {};

  const { isMobile } = useMyContext();

  useEffect(() => {
    if (show && isMobile) {
      const dotsElement = document.querySelector('ul.slick-dots.slick-dots-bottom.custom-dots');
      if (dotsElement) {
        dotsElement.style.bottom = '-8px';
      }
    }
  }, [show, isMobile]);

  if (!ticketData) return null;

  const handleClose = () => {
    setShow(false);
    setAttendees([]);
  };

  const eventData = event;

  const ticket = is_master
    ? bookings?.tickets?.[0]
    : bookings?.tickets;

  const attendeesList = is_master === true
    ? bookings?.attendees || []
    : attendees || [];

  const getCustomerInfo = () => ({
    name: bookings?.user?.name || bookings?.name || 'N/A',
    phone: bookings?.user?.number || bookings?.number || 'N/A'
  });

  const customerInfo = getCustomerInfo();

  const getStatusTag = (status) => {
    const statusMap = {
      "0": { color: "warning", text: "Pending" },
      "1": { color: "success", text: "Confirmed" },
      "2": { color: "error", text: "Cancelled" },
    };
    return statusMap[status] || { color: "default", text: "Unknown" };
  };

  const statusInfo = getStatusTag(bookings?.status);

  const scanHistoryColumns = [
    {
      title: '#',
      key: 'index',
      align: 'center',
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Checkpoint',
      dataIndex: 'checkpoint_name',
      key: 'checkpoint_name',
      align: 'center',
      render: (name) => <Tag color="purple">{name || '-'}</Tag>,
    },
    {
      title: 'Scanned By',
      dataIndex: 'scanner_name',
      key: 'scanner_name',
      align: 'center',
      render: (name) => name || '-',
    },
    {
      title: 'Scanned At',
      dataIndex: 'scanned_at',
      key: 'scanned_at',
      align: 'center',
      render: (scannedAt) => {
        if (!scannedAt) return '-';
        const date = dayjs(scannedAt);
        return date.isSame(dayjs(), 'day')
          ? `Today, ${date.format('hh:mm A')}`
          : date.format('DD MMM YYYY, hh:mm A');
      },
    }
  ];

  const bookingInfo = [
    {
      label: <><IdcardOutlined className='text-primary me-2' /> Name</>,
      value: customerInfo.name,
    },
    {
      label: <><PhoneOutlined className='text-primary me-2' style={{ transform: 'rotate(100deg)' }} /> Number</>,
      value: <Text copyable>{customerInfo.phone}</Text>,
    },
    {
      label: <><MdProductionQuantityLimits className='text-primary me-2' /> Quantity</>,
      value: <Text strong>{bookings?.quantity || 0} Ticket(s)</Text>,
    },
    {
      label: <><CalendarOutlined className='text-primary me-2' /> Booking Date</>,
      value: bookings?.created_at
        ? dayjs(bookings?.created_at).format('DD MMM YYYY, hh:mm A')
        : bookings?.booking_date
          ? dayjs(bookings?.booking_date).format('DD MMM YYYY, hh:mm A')
          : 'N/A',
    },
    {
      label: <><TagOutlined className='text-primary me-2' /> Booking Type</>,
      value: (
        <Tag color={bookings?.type === 'POS' ? 'blue' : 'green'}>
          {bookings?.type || type || 'N/A'}
        </Tag>
      ),
    },
    // ...(bookings?.status ? [{
    //   label: 'Booking Status',
    //   value: <Tag color={statusInfo.color}>{statusInfo.text}</Tag>,
    // }] : []),
    {
      label: <><CalendarOutlined className='text-primary me-2' /> Event Name</>,
      value: <Text strong>{eventData?.name || 'N/A'}</Text>,
    },
    {
      label: <><TagOutlined className="text-primary me-2" /> Ticket</>,
      value: Array.isArray(ticket)
        ? ticket?.length > 0
          ? ticket?.map((t) => (
            <Tag color="cyan" key={t?.id} className="mb-1">
              {t?.name} - {t?.quantity}
            </Tag>
          ))
          : "N/A"
        : ticket?.name
          ? <Tag color="purple">{ticket?.name}</Tag>
          : "N/A",
    }
  ];

  const formatFieldLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const excludedFields = ['id', 'photo', 'created_at', 'updated_at', 'booking_id', 'deleted_at'];

  const renderAttendeeCard = (attendee, idx) => {
    const dynamicFields = Object.entries(attendee || {}).filter(
      ([key, value]) => !excludedFields.includes(key) && value !== null && value !== undefined && value !== ''
    );

    return (
      <Card
        size="small"
        key={attendee?.id || idx}
        className="mb-3 shadow-sm"
        bordered
        style={{ borderRadius: 10 }}
      >
        <div className="d-flex gap-3 align-items-start">
          {attendee?.photo && (
            <div className="flex-shrink-0">
              <Image
                src={attendee?.photo}
                alt={attendee?.name || `Attendee ${idx + 1}`}
                width={isMobile ? 60 : 80}
                height={isMobile ? 60 : 80}
                style={{ objectFit: 'cover', borderRadius: '8px' }}
                fallback="data:image/png;base64,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"
              />
            </div>
          )}
          <div className="flex-grow-1 overflow-hidden">
            <Space direction="vertical" size={4} className="w-100">
              {dynamicFields.map(([key, value]) => (
                <div key={key} className="d-flex flex-wrap align-items-baseline gap-1">
                  <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
                    {formatFieldLabel(key)}:
                  </Text>
                  <Text
                    strong={key === 'name'}
                    style={{ fontSize: 13, wordBreak: 'break-word' }}
                    copyable={['email', 'number', 'phone', 'registration_id'].includes(key)}
                  >
                    {value}
                  </Text>
                </div>
              ))}
              {dynamicFields.length === 0 && (
                <Text type="secondary" style={{ fontSize: 12 }}>No attendee information available</Text>
              )}
            </Space>
          </div>
        </div>
      </Card>
    );
  };

  const renderAttendeesSection = () => {
    if (isMobile) {
      return (
        <Carousel
          dots={{ className: 'custom-dots' }}
          autoplay={false}
          dotPosition="bottom"
        >
          {attendeesList?.map((attendee, idx) => (
            <div key={attendee?.id || idx} style={{ padding: '0 4px' }}>
              {renderAttendeeCard(attendee, idx)}
            </div>
          ))}
        </Carousel>
      );
    }
    return (
      <Row gutter={[12, 12]}>
        {attendeesList?.map((attendee, idx) => (
          <Col xs={24} sm={24} md={24} lg={24} xl={24} key={attendee?.id || idx}>
            {renderAttendeeCard(attendee, idx)}
          </Col>
        ))}
      </Row>
    );
  };

  const isAlreadyScanned = bookings?.is_scaned;
  const hasAttendees = attendeesList?.length > 0;

  return (
    <Drawer
      open={show}
      closable={false}
      placement={isMobile ? 'bottom' : 'right'}
      height={isMobile ? '92dvh' : undefined}
      width={isMobile ? '100%' : 520}
      styles={{
        body: {
          padding: isMobile ? '12px 12px 0' : '16px 20px 0',
          overflowX: 'hidden',
        },
        footer: {
          padding: isMobile ? '10px 12px' : '12px 20px',
          borderTop: '1px solid #f0f0f0',
        },
        header: {
          padding: isMobile ? '12px 12px' : '16px 20px',
          borderBottom: '1px solid #f0f0f0',
        }
      }}
      title={
        <Space size="small">
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: isMobile ? 16 : 18 }} />
          <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600 }}>Scanned Ticket Details</span>
        </Space>
      }
      extra={
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={handleClose}
          size="small"
          style={{ color: '#8c8c8c' }}
        />
      }
      footer={
        <div className={`d-flex ${isMobile ? 'flex-column' : 'flex-row'} gap-2`}>
          {hasAttendees && (
            <Button
              type="default"
              className="btn-tertiary"
              onClick={handlePrintAttendees}
              icon={<PrinterOutlined />}
              size={isMobile ? 'middle' : 'large'}
              block
            >
              Print Attendees ({attendeesList?.length})
            </Button>
          )}
          <Button
            type="primary"
            onClick={handleVerify}
            icon={loading?.verifying ? <LoadingOutlined spin /> : <CheckCircleOutlined />}
            disabled={isAlreadyScanned || loading?.verifying}
            size={isMobile ? 'middle' : 'large'}
            block
          >
            {isAlreadyScanned ? 'Already Verified' : 'Verify Ticket'}
          </Button>
        </div>
      }
    >
      {loading?.fetching ? (
        <Loader />
      ) : (
        <div className="pb-3">

          {/* ── Booking Details ── */}
          <Descriptions
            bordered
            column={1}
            size="small"
            labelStyle={{
              fontSize: isMobile ? 12 : 13,
              padding: isMobile ? '6px 8px' : '8px 12px',
              whiteSpace: 'nowrap',
              width: isMobile ? 130 : 150,
            }}
            contentStyle={{
              fontSize: isMobile ? 12 : 13,
              padding: isMobile ? '6px 8px' : '8px 12px',
              wordBreak: 'break-word',
            }}
          >
            {bookingInfo?.map((item, idx) => (
              <Descriptions.Item key={idx} label={item?.label}>
                {item?.value}
              </Descriptions.Item>
            ))}
          </Descriptions>

          {/* ── Scan History ── */}
          {scan_history?.length > 0 && (
            <div className="mt-3">
              <DataTable
                title={
                  <span style={{ fontSize: isMobile ? 13 : 14 }}>
                    <HistoryOutlined className="me-2" />
                    Scan History ({scan_history?.length})
                  </span>
                }
                data={scan_history}
                columns={scanHistoryColumns}
                emptyText="No scan history"
                tableProps={{
                  rowKey: (record, index) => `scan-${index}`,
                  pagination: false,
                  size: 'small',
                  scroll: { x: isMobile ? 400 : 600 },
                }}
              />
            </div>
          )}

          {/* ── Attendees ── */}
          {hasAttendees && (
            <div className="mt-2">
              <Divider orientation="left" className="mt-2 mb-2" style={{ fontSize: isMobile ? 13 : 14 }}>
                <TeamOutlined className="me-1" />
                Attendees ({attendeesList?.length})
              </Divider>
              {renderAttendeesSection()}
            </div>
          )}

        </div>
      )}
    </Drawer>
  );
};

export default ScanedUserData;