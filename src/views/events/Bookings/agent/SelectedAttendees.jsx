import React from 'react';
import { Card, Avatar, Button, Space, Typography, Row, Col, Tag, Tooltip } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const SelectedAttendees = ({ attendees = [], onRemove, onEdit, categoryFields = [] }) => {
  if (attendees.length === 0) return null;

  return (
    <Card
      size="small"
      title={
        <Space>
          <UserOutlined />
          <span>Selected Attendees</span>
          <Tag color="blue">{attendees.length}</Tag>
        </Space>
      }
      style={{ marginTop: 8 }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {attendees.map((attendee, index) => (
          <Card
            key={index}
            size="small"
            hoverable
            style={{ backgroundColor: '#fafafa' }}
          >
            <Row gutter={[8, 8]} align="middle">
              <Col flex="none">
                {attendee.Photo ? (
                  <Avatar src={attendee.Photo} size={40} />
                ) : (
                  <Avatar icon={<UserOutlined />} size={40} />
                )}
              </Col>

              <Col flex="auto">
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Text strong>{attendee.Name || 'N/A'}</Text>
                  {attendee.Mo && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      📱 {attendee.Mo}
                    </Text>
                  )}
                  {attendee.email && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      📧 {attendee.email}
                    </Text>
                  )}
                  {attendee.Company_Name && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      🏢 {attendee.Company_Name}
                    </Text>
                  )}
                </Space>
              </Col>

              <Col flex="none">
                <Space>
                  <Tooltip title="Edit">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      size="small"
                      onClick={() => onEdit(index)}
                    />
                  </Tooltip>
                  <Tooltip title="Remove">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      onClick={() => onRemove(index)}
                    />
                  </Tooltip>
                </Space>
              </Col>
            </Row>
          </Card>
        ))}
      </Space>
    </Card>
  );
};

export default SelectedAttendees;
