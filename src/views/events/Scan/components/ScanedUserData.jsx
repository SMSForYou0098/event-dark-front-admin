import React from 'react';
import { Modal, Descriptions, List, Tag, Button, Divider, Space } from 'antd';
import { CheckCircleOutlined, UserOutlined, PhoneOutlined, CalendarOutlined, TagOutlined, IdcardOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

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
  if (!ticketData) return null;

  const handleClose = () => setShow(false);

  const bookingInfo = [
    {
      label: <>
        <TagOutlined className='text-primary mr-2'/> Ticket Type
      </>,
      value: type || 'N/A',
    },
    {
      label: <>
        <IdcardOutlined className='text-primary mr-2'/> Booked By
      </>,
      value: ticketData?.user?.name || 'N/A',
    },
    {
      label: <>
        <PhoneOutlined className='text-primary mr-2'/> Phone
      </>,
      value: ticketData?.user?.phone || 'N/A',
    },
    {
      label: <>
        <CalendarOutlined className='text-primary mr-2'/> Booking Date
      </>,
      value: ticketData?.created_at
        ? dayjs(ticketData.created_at).format('DD MMM YYYY, hh:mm A')
        : 'N/A',
    },
  ];


  return (
    <Modal
      open={show}
      onCancel={handleClose}
      footer={null}
      centered
      width={700}
      title={
        <Space size="small">
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <span>Ticket Details</span>
        </Space>
      }
    >
      {/* Ticket Summary */}
      <Descriptions bordered column={1} size="middle">
        {bookingInfo.map((item) => (
          <Descriptions.Item key={item.label} label={item.label} className='text-white'>
            {item.value}
          </Descriptions.Item>
        ))}
      </Descriptions>

      {/* Attendees List */}
      {showAttendeee && attendees?.length > 0 && (
        <>
          <Divider orientation="left">Attendees</Divider>
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
                  <Tag color="blue">
                    {attendee?.status ? 'Checked In' : 'Pending'}
                  </Tag>
                </div>
              </List.Item>
            )}
          />
        </>
      )}

      {/* Verify Button */}
      <div className="text-center mt-4">
        <Button
          type="primary"
          size="large"
          onClick={handleVerify}
          icon={<CheckCircleOutlined />}
        >
          Verify Ticket
        </Button>
      </div>
    </Modal>
  );
};

export default ScanedUserData;
