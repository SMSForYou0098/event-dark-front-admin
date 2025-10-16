import React from 'react';
import { Card, Avatar, Button, Space, Typography, Row, Col, Tag, Tooltip, Image } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ROW_GUTTER } from 'constants/ThemeConstant';

const { Text, Title } = Typography;

const SelectedAttendees = ({ attendees = [], onRemove, onEdit, categoryFields = [] }) => {
  if (attendees.length === 0) return null;

  return (
    <>
      <Row gutter={ROW_GUTTER}>
        {attendees.map((attendee, index) => (
          <Col xs={24} sm={12} md={12} lg={12} key={index}>
            <Card
              key={index}
              size="small"
              hoverable

            >
              <Row gutter={[8, 8]} align="middle">
                <Col flex="none">
                  {attendee.Photo ? (
                    <Image src={attendee.Photo} width={40} height={40} className='rounded-circle' />
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
          </Col>
        ))}
      </Row>
    </>
  );
};

export default SelectedAttendees;
