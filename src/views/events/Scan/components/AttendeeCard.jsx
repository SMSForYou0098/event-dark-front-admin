import React from 'react';
import { Avatar, Space } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';

const AttendeeCard = ({ attendee, primaryColor = '#B51515' }) => {
  return (
    <div 
      className="mb-3 p-3 rounded"
      style={{
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.borderColor = 'rgba(181, 21, 21, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }}
    >
      <Space size="small" align="start" className="w-100">
        {attendee?.Photo ? (
          <Avatar
            src={attendee.Photo}
            size={56}
            shape="square"
            className="flex-shrink-0"
            style={{
              border: `2px solid ${primaryColor}`,
              boxShadow: `0 0 10px rgba(181, 21, 21, 0.3)`
            }}
          />
        ) : (
          <Avatar
            icon={<UserOutlined />}
            size={56}
            shape="square"
            className="flex-shrink-0"
            style={{
              border: `2px solid ${primaryColor}`,
              backgroundColor: primaryColor,
              color: '#fff',
              boxShadow: `0 0 10px rgba(181, 21, 21, 0.3)`
            }}
          />
        )}

        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="fw-bold mb-2 text-white" style={{ fontSize: '15px' }}>
            {attendee?.Name || 'N/A'}
          </div>
          {attendee?.Mo && (
            <div className="small mb-2 text-white-50 d-flex align-items-center">
              <PhoneOutlined className="me-2" style={{ color: primaryColor }} />
              <span>{attendee.Mo}</span>
            </div>
          )}
          {attendee?.Email && (
            <div className="small text-white-50 text-break d-flex align-items-center">
              <MailOutlined className="me-2" style={{ color: primaryColor }} />
              <span>{attendee.Email}</span>
            </div>
          )}
        </div>
      </Space>
    </div>
  );
};

export default AttendeeCard;

