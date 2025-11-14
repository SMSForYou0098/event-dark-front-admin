import React from 'react';
import { Modal, Descriptions, List, Tag, Button, Divider, Space, Image, Typography } from 'antd';
import {
  CheckCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  TagOutlined,
  IdcardOutlined,
  DollarOutlined,
  TeamOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useMyContext } from 'Context/MyContextProvider';

const { Text, Title } = Typography;

const ScanedUserData = ({
  show,
  setShow,
  event,
  ticketData,
  type,
  showAttendeee,
  attendees = [],
  categoryData,
  handleVerify,
}) => {
  const {formateTemplateTime} = useMyContext()
  if (!ticketData) return null;
  const handleClose = () => setShow(false);

  const { bookings } = ticketData;
  const ticket = bookings?.ticket;
  const eventData = ticketData?.event || event;
  const category = eventData?.category;

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

  // Booking Information
  const bookingInfo = [
    // {
    //   label: <>
    //     <QrcodeOutlined className='text-primary mr-2'/> Booking Token
    //   </>,
    //   value: <Text strong copyable>{bookings?.token || 'N/A'}</Text>,
    // },
    {
      label: <>
        <IdcardOutlined className='text-primary mr-2' /> Customer Name
      </>,
      value: bookings?.name || 'N/A',
    },
    {
      label: <>
        <PhoneOutlined className='text-primary mr-2' /> Phone Number
      </>,
      value: <Text copyable>{bookings?.number || 'N/A'}</Text>,
    },
    {
      label: 'Quantity',
      value: <Text strong>{bookings?.quantity || 0} Ticket(s)</Text>,
    },
    {
      label: <>
        <CalendarOutlined className='text-primary mr-2' /> Booking Date
      </>,
      value: bookings?.booking_date
        ? dayjs(bookings.booking_date).format('DD MMM YYYY, hh:mm A')
        : 'N/A',
    },

    {
      label: <>
        <TagOutlined className='text-primary mr-2' /> Booking Type
      </>,
      value: <Tag color={ticketData?.type === 'POS' ? 'blue' : 'green'}>{ticketData?.type || type || 'N/A'}</Tag>,
    },
    {
      label: 'Booking Status',
      value: <Tag color={statusInfo.color}>{statusInfo.text}</Tag>,
    },
  ];

  // Ticket & Payment Information
  const ticketInfo = [
    {
      label: <>
        <CalendarOutlined className='text-primary mr-2' /> Event Name
      </>,
      value: <Text strong>{eventData?.name || 'N/A'}</Text>,
    },
    {
      label: <>
        <TagOutlined className='text-primary mr-2' /> Ticket Type
      </>,
      value: <Tag color="purple">{ticket?.name || 'N/A'}</Tag>,
    },


    {
      label: <>
        <DollarOutlined className='text-primary mr-2' /> Ticket Price
      </>,
      value: (
        <Text strong style={{ fontSize: 16 }}>
          {ticket?.currency || 'INR'} {bookings?.price || 0}
          {bookings?.discount > 0 && (
            <Tag color="red" className="ms-2">-{bookings.discount}% OFF</Tag>
          )}
        </Text>
      ),
    },
    {
      label: <>
        <DollarOutlined className='text-primary mr-2' /> Total Amount
      </>,
      value: (
        <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
          {ticket?.currency || 'INR'} {bookings?.total_amount || 0}
        </Text>
      ),
    },
    {
      label: 'Payment Method',
      value: <Tag color="cyan">{bookings?.payment_method || 'N/A'}</Tag>,
    },
    {
      label: 'Tax',
      value: <Tag>{ticket?.taxes || 'N/A'}</Tag>,
    },
    {
      label: 'Scan Status',
      value: bookings?.is_scaned ? (
        <Tag color="success" icon={<CheckCircleOutlined />}>Already Scanned</Tag>
      ) : (
        <Tag color="default">Not Scanned</Tag>
      ),
    },
  ];

  // Event Information
  const eventInfo = [
        {
      label: <>
        <CalendarOutlined className='text-primary mr-2' /> Date Range
      </>,
      value: formateTemplateTime(eventData?.date_range) || 'N/A',
    },
    {
      label: 'Category',
      value: (
        <Space>
          {/* {category?.image && (
            <Image
              src={category.image}
              alt={category.title}
              width={30}
              height={30}
              style={{ borderRadius: 4 }}
              preview={false}
            />
          )} */}
          <Text>{category?.title || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      label: 'Event Type',
      value: <Tag color="geekblue">{eventData?.event_type || 'N/A'}</Tag>,
    },

    // {
    //   label: <>
    //     <ClockCircleOutlined className='text-primary mr-2' /> Event Timings
    //   </>,
    //   value: eventData ? (
    //     <div>
    //       <Text>Entry: <Text strong>{eventData.entry_time}</Text></Text><br />
    //       <Text>Start: <Text strong>{eventData.start_time}</Text></Text><br />
    //       <Text>End: <Text strong>{eventData.end_time}</Text></Text>
    //     </div>
    //   ) : 'N/A',
    // },
    // {
    //   label: <>
    //     <EnvironmentOutlined className='text-primary mr-2' /> Venue ID
    //   </>,
    //   value: eventData?.venue_id || 'N/A',
    // },
    // {
    //   label: 'Event Key',
    //   value: <Text code>{eventData?.event_key || 'N/A'}</Text>,
    // },
    // {
    //   label: 'Short URL',
    //   value: eventData?.short_url ? (
    //     <a href={eventData.short_url} target="_blank" rel="noopener noreferrer">
    //       {eventData.short_url}
    //     </a>
    //   ) : 'N/A',
    // },
  ];

  // Organizer Information
  // const organizerInfo = [
  //   {
  //     label: <>
  //       <ShopOutlined className='text-primary mr-2' /> Organization
  //     </>,
  //     value: <Text strong>{organizer?.organisation || 'N/A'}</Text>,
  //   },
  //   {
  //     label: 'Brand Name',
  //     value: organizer?.brand_name || 'N/A',
  //   },
  //   {
  //     label: <>
  //       <PhoneOutlined className='text-primary mr-2' /> Contact
  //     </>,
  //     value: <Text copyable>{organizer?.number || 'N/A'}</Text>,
  //   },
  //   {
  //     label: 'Email',
  //     value: organizer?.email || 'N/A',
  //   },
  //   {
  //     label: <>
  //       <EnvironmentOutlined className='text-primary mr-2' /> City
  //     </>,
  //     value: organizer?.city || 'N/A',
  //   },
  // ];

  return (
    <Modal
      open={show}
      onCancel={handleClose}
      centered
      footer={
        <div className='text-center'>
          <Button
            type="primary"
            onClick={handleVerify}
            icon={<CheckCircleOutlined />}
            disabled={bookings?.is_scaned}
          >
            {bookings?.is_scaned ? 'Already Verified' : 'Verify Ticket'}
          </Button>
        </div>
      }
      width={800}
      title={
        <Space size="small">
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <span>Scanned Ticket Details</span>
        </Space>
      }
      bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
    >

      {/* Booking Details */}
      <Descriptions bordered column={1} size="small">
        {bookingInfo.map((item, idx) => (
          <Descriptions.Item key={idx} label={item.label}>
            {item.value}
          </Descriptions.Item>
        ))}
      </Descriptions>

      <Divider />

      {/* Ticket & Payment Details */}
      <Title level={5}>Ticket & Payment Details</Title>
      <Descriptions bordered column={1} size="small">
        {ticketInfo.map((item, idx) => (
          <Descriptions.Item key={idx} label={item.label}>
            {item.value}
          </Descriptions.Item>
        ))}
      </Descriptions>

      <Divider />

      {/* Event Details */}
      <Title level={5}>Event Information</Title>
      <Descriptions bordered column={1} size="small">
        {eventInfo.map((item, idx) => (
          <Descriptions.Item key={idx} label={item.label}>
            {item.value}
          </Descriptions.Item>
        ))}
      </Descriptions>

      {/* <Divider /> */}

      {/* Organizer Details */}
      {/* <Title level={5}>Organizer Information</Title>
      <Descriptions bordered column={1} size="small">
        {organizerInfo.map((item, idx) => (
          <Descriptions.Item key={idx} label={item.label}>
            {item.value}
          </Descriptions.Item>
        ))}
      </Descriptions> */}

      {/* Attendee Requirement Notice */}
      {ticketData?.attendee_required && (
        <>
          <Divider />
          <Tag color="orange" icon={<TeamOutlined />} className="mb-3">
            Attendee Information Required
          </Tag>
        </>
      )}

      {/* Attendees List */}
      {showAttendeee && attendees?.length > 0 && (
        <>
          <Divider orientation="left">
            <TeamOutlined /> Attendees ({attendees.length})
          </Divider>
          <List
            bordered
            dataSource={attendees}
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
        </>
      )}

      {/* Verify Button */}

    </Modal>
  );
};

export default ScanedUserData;