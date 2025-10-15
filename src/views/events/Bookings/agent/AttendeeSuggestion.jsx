import React, { useState, useMemo } from 'react';
import {
  Modal,
  List,
  Avatar,
  Button,
  Input,
  Empty,
  Tag,
  Space,
  Typography,
  Card,
} from 'antd';
import { UserOutlined, SearchOutlined, CheckCircleFilled } from '@ant-design/icons';

const { Text } = Typography;
const { Search } = Input;

const AttendeeSuggestion = ({
  showModal,
  handleCloseModal,
  attendees = [],
  onSelectAttendee,
  selectedAttendeeIds = [],
}) => {
  const [searchText, setSearchText] = useState('');

  // Filter attendees based on search
  const filteredAttendees = useMemo(() => {
    if (!searchText) return attendees;

    const search = searchText.toLowerCase();
    return attendees.filter(attendee => {
      const name = attendee.Name?.toLowerCase() || '';
      const email = attendee.email?.toLowerCase() || '';
      const phone = attendee.Mo?.toString() || '';
      
      return name.includes(search) || email.includes(search) || phone.includes(search);
    });
  }, [attendees, searchText]);

  const handleSelect = (attendee) => {
    onSelectAttendee(attendee);
  };

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          <span>Select Existing Attendee</span>
          <Tag color="blue">{attendees.length} Available</Tag>
        </Space>
      }
      open={showModal}
      onCancel={handleCloseModal}
      footer={[
        <Button key="close" onClick={handleCloseModal}>
          Close
        </Button>,
      ]}
      width={700}
      style={{ top: 20 }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Search Bar */}
        <Search
          placeholder="Search by name, email, or phone"
          prefix={<SearchOutlined />}
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          size="large"
        />

        {/* Attendees List */}
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {filteredAttendees.length === 0 ? (
            <Empty
              description={
                searchText
                  ? 'No attendees found matching your search'
                  : 'No existing attendees available'
              }
            />
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={filteredAttendees}
              renderItem={(attendee) => {
                const isSelected = selectedAttendeeIds.includes(attendee.id);

                return (
                  <Card
                    size="small"
                    style={{
                      marginBottom: 12,
                      border: isSelected ? '2px solid #52c41a' : '1px solid #d9d9d9',
                      backgroundColor: isSelected ? '#f6ffed' : 'transparent',
                    }}
                    hoverable={!isSelected}
                  >
                    <List.Item
                      actions={[
                        isSelected ? (
                          <Tag icon={<CheckCircleFilled />} color="success">
                            Selected
                          </Tag>
                        ) : (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleSelect(attendee)}
                          >
                            Select
                          </Button>
                        ),
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          attendee.Photo ? (
                            <Avatar src={attendee.Photo} size={48} />
                          ) : (
                            <Avatar icon={<UserOutlined />} size={48} />
                          )
                        }
                        title={
                          <Space>
                            <Text strong>{attendee.Name || 'N/A'}</Text>
                            {isSelected && <CheckCircleFilled style={{ color: '#52c41a' }} />}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={0}>
                            {attendee.email && (
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                📧 {attendee.email}
                              </Text>
                            )}
                            {attendee.Mo && (
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                📱 {attendee.Mo}
                              </Text>
                            )}
                            {attendee.Company_Name && (
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                🏢 {attendee.Company_Name}
                              </Text>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  </Card>
                );
              }}
            />
          )}
        </div>
      </Space>
    </Modal>
  );
};

export default AttendeeSuggestion;
