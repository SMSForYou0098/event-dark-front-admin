import React, { useEffect, useRef } from 'react';
import { Descriptions, List, Tag, Button, Divider, Space, Typography, Drawer, Card, Image, Row, Col, Carousel, Badge, Modal } from 'antd';
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
  PrinterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useMyContext } from 'Context/MyContextProvider';
import Loader from 'utils/Loader';
import AttendeesPrint from './AttendeesPrint';
import { MdProductionQuantityLimits } from 'react-icons/md';

const { Text, Title } = Typography;

const ScanedUserData = ({
  show,
  setShow,
  ticketData,
  showAttendeee,
  attendees = [],
  handleVerify,
  loading
}) => {
  console.log('tttt', ticketData)
  const {
    bookings = {},
    is_master = false,
    type = '',
    event = {},
    scan_history = []
  } = ticketData ?? {};
  const { isMobile } = useMyContext();
  const attendeesPrintRef = useRef(null);
  useEffect(() => {
    if (show && isMobile) {
      const dotsElement = document.querySelector('ul.slick-dots.slick-dots-bottom.custom-dots');
      if (dotsElement) {
        dotsElement.style.bottom = '-8px';
      }
    }
  }, [show, isMobile]);
  if (!ticketData) return null;


  const handleClose = () => setShow(false);

  const eventData = event;
  // Determine if this is a master booking or regular booking

  // Get ticket data based on type
  const ticket = is_master
    ? bookings?.tickets?.[0] // For master booking, get first ticket from array
    : bookings?.tickets; // For regular booking, get single ticket

  // Get attendees data
  const attendeesList = is_master
    ? bookings?.attendees || []
    : attendees;

  // Get customer name and phone
  const getCustomerInfo = () => {
    // For regular booking
    return {
      name: bookings?.user?.name || 'N/A',
      phone: bookings?.user?.number || 'N/A'
    };
  };

  const customerInfo = getCustomerInfo();

  console.log(customerInfo);

  // Status color mapping
  const getStatusTag = (status) => {
    const statusMap = {
      "0": { color: "warning", text: "Pending" },
      "1": { color: "success", text: "Confirmed" },
      "2": { color: "error", text: "Cancelled" },
    };
    return statusMap[status] || { color: "default", text: "Unknown" };
  };

  const statusInfo = getStatusTag(bookings?.status);

  // Scan history table columns
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

  // Booking Information
  const bookingInfo = [
    {
      label: <>
        <IdcardOutlined className='text-primary mr-2' /> Name
      </>,
      value: customerInfo.name,
    },
    {
      label: <>
        <PhoneOutlined className='text-primary mr-2' style={{ transform: 'rotate(100deg)' }} /> Number
      </>,
      value: <Text copyable>{customerInfo.phone}</Text>,
    },
    {
      label: <>
        <MdProductionQuantityLimits className='text-primary mr-2' /> Quantity
      </>,
      value: <Text strong>{bookings?.quantity || 0} Ticket(s)</Text>,
    },
    {
      label: <>
        <CalendarOutlined className='text-primary mr-2' /> Booking Date
      </>,
      value: bookings?.created_at
        ? dayjs(bookings.created_at).format('DD MMM YYYY, hh:mm A')
        : bookings?.booking_date
          ? dayjs(bookings.booking_date).format('DD MMM YYYY, hh:mm A')
          : 'N/A',
    },
    {
      label: <>
        <TagOutlined className='text-primary mr-2' /> Booking Type
      </>,
      value: <Tag color={bookings?.type === 'POS' ? 'blue' : 'green'}>
        {bookings?.type || type || 'N/A'}
      </Tag>,
    },
    ...(bookings?.status ? [{
      label: 'Booking Status',
      value: <Tag color={statusInfo.color}>{statusInfo.text}</Tag>,
    }] : []),
    {
      label: <>
        <CalendarOutlined className='text-primary mr-2' /> Event Name
      </>,
      value: <Text strong>{eventData?.name || 'N/A'}</Text>,
    },
    {
      label: (
        <>
          <TagOutlined className="text-primary mr-2" /> Ticket
        </>
      ),
      value: Array.isArray(ticket)
        ? ticket.length > 0
          ? ticket.map((t) => (
            <Tag color="cyan" key={t.id} className="mb-1">
              {t.name} - {t?.quantity}
            </Tag>
          ))
          : "N/A"
        : ticket?.name
          ? <Tag color="purple">{ticket?.name}</Tag>
          : "N/A",
    }


  ];


  // Render attendee card for master bookings
  const renderAttendeeCard = (attendee, idx) => (
    <Card
      size="small"
      key={attendee.id || idx}
      className="mb-3"
      bordered
    >
      <div className="d-flex gap-3">
        <Space size="small" className="w-100">
          {attendee?.photo && (
            <Image
              src={attendee.photo}
              alt={attendee.name}
              width={80}
              height={80}
              style={{ objectFit: 'cover', borderRadius: '8px' }}
              fallback="data:image/png;base64,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"
            />
          )}
          <div className="flex-grow-1">
            <Space direction="vertical" size="small" className="w-100">
              <div>
                <UserOutlined className="mr-2" />
                <Text strong>{attendee?.name || `Attendee ${idx + 1}`}</Text>
                {/* {attendee?.mr_/mrs/_ms && (
                <Tag size="small" className="ml-2">{attendee['mr_/mrs/_ms']}</Tag>
              )} */}
              </div>

              {attendee?.email && (
                <div>
                  <MailOutlined className="mr-2" />
                  <Text copyable>{attendee.email}</Text>
                </div>
              )}

              {attendee?.number && (
                <div>
                  <PhoneOutlined className="mr-2" />
                  <Text copyable>{attendee.number}</Text>
                </div>
              )}

              {attendee?.gender && (
                <div>
                  <Tag color="blue">{attendee.gender}</Tag>
                </div>
              )}
            </Space>
          </div>
        </Space>
      </div>
    </Card>
  );

  const renderAttendeesSection = () => {
    if (isMobile) {
      // Carousel for mobile
      return (
        <Carousel
          dots={{ className: 'custom-dots' }}
          autoplay={false}
          dotPosition="bottom"
        >
          {attendeesList.map((attendee, idx) => (
            <div key={attendee.id || idx} style={{ padding: '0 8px' }}>
              {renderAttendeeCard(attendee, idx)}
            </div>
          ))}
        </Carousel>
      );
    } else {
      // Grid layout for desktop (2 cards per row)
      return (
        <Row gutter={[16, 16]}>
          {attendeesList.map((attendee, idx) => (
            <Col xs={24} sm={24} md={12} lg={12} xl={12} key={attendee.id || idx}>
              {renderAttendeeCard(attendee, idx)}
            </Col>
          ))}
        </Row>
      );
    }
  };

  const buttonsCount = [
    is_master && attendeesList.length > 0,
    true // verify button is always shown
  ].filter(Boolean).length;

  return (
    <>
      <Drawer
        open={show}
        closable={false}
        placement={isMobile ? 'bottom' : "right"}
        height="85vh"
        width="95vh"
        title={
          <Space size="small">
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>Scanned Ticket Details</span>
          </Space>
        }
        extra={
          <CloseOutlined onClick={handleClose} />
        }
        footer={
          <Space
            className={`w-100 ${buttonsCount === 1 ? 'single-btn' : ''}`}
            size="middle"
            direction={isMobile ? 'vertical' : 'horizontal'}
          >
            {attendeesList.length > 0 && (
              // {true && attendeesList.length > 0 && (
              <Button
                type="default"
                className='btn-tertiary w-100'
                onClick={() => attendeesPrintRef.current?.handlePrintAllAttendees()}
                icon={<PrinterOutlined />}
                size="large"
                block={isMobile || buttonsCount === 1}
              >
                Print Attendees ({attendeesList.length})
              </Button>
            )}

            <Button
              type="primary"
              onClick={handleVerify}
              icon={loading?.verifying ? <LoadingOutlined spin /> : <CheckCircleOutlined />}
              disabled={bookings?.is_scaned || loading?.verifying}
              size="large"
              block={isMobile || buttonsCount === 1}
            >
              {bookings?.is_scaned ? 'Already Verified' : 'Verify Ticket'}
            </Button>
          </Space>

        }
        footerStyle={{ textAlign: 'center', padding: '16px' }}
        styles={{
          body: { paddingBottom: 80 }
        }}
      >
        {loading?.fetching ? (
          <Loader />
        ) : (
          <>
            {/* Booking Details */}
            {/* <Title level={5}>Booking Information</Title> */}
            <Descriptions bordered column={1} size="small">
              {bookingInfo.map((item, idx) => (
                <Descriptions.Item key={idx} label={item.label}>
                  {item.value}
                </Descriptions.Item>
              ))}
            </Descriptions>

            {/* Scan History Table */}
            {scan_history && scan_history.length > 0 && (
              <DataTable
                title={`Scan History (${scan_history.length})`}
                data={scan_history}
                columns={scanHistoryColumns}
                emptyText="No scan history"

                tableProps={{
                  rowKey: (record, index) => `scan-${index}`,
                  pagination: false,
                  size: 'small',
                  scroll: { x: 700 },
                  size: "middle",
                }}
              />
            )}

            {/* Event Details */}
            {/* <Title level={5}>Event Information</Title>
          <Descriptions bordered column={1} size="small">
            {eventInfo.map((item, idx) => (
              <Descriptions.Item key={idx} label={item.label}>
                {item.value}
              </Descriptions.Item>
            ))}
          </Descriptions> */}

            {/* Attendees List - Enhanced for Master Bookings */}
            {(showAttendeee || is_master) && Boolean(attendeesList?.length) && (
              <>
                <Divider orientation="left" className='mt-0'>
                  <TeamOutlined /> Attendees ({attendeesList.length})
                </Divider>

                {attendeesList.length > 0 ? (
                  // Rich attendee cards for master bookings
                  <div>
                    {renderAttendeesSection()}
                  </div>
                ) : (

                  // Simple list for regular bookings
                  <List
                    bordered
                    dataSource={attendeesList}
                    renderItem={(attendee, idx) => (
                      <List.Item>
                        <div className="d-flex align-items-center w-100 justify-content-between">
                          <div className="d-flex align-items-center gap-2">
                            <UserOutlined />
                            <span>
                              {attendee?.name || `Attendee ${idx + 1}`} (
                              {attendee?.phone || 'N/A'})
                            </span>
                          </div>
                          <Tag color={attendee?.status ? 'success' : 'default'}>
                            {attendee?.status ? 'Checked In' : 'Pending'}
                          </Tag>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </>
            )}
          </>
        )}
      </Drawer>
      {attendeesList.length > 0 && (
        //  {true && attendeesList.length > 0 && (
        <AttendeesPrint
          ref={attendeesPrintRef}
          attendeesList={attendeesList}
          eventData={eventData}
          ticket={ticket}
          bookings={bookings}
          primaryColor="#B51515"
        />
      )}
    </>

  );
};

export default ScanedUserData;