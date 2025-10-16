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
import { UserOutlined, SearchOutlined, CheckCircleFilled, PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Search } = Input;

// Update props
const AttendeeSuggestion = ({
  showModal,
  handleCloseModal,
  attendees = [],
  onSelectAttendee,
  currentTicketId,
  currentTicketSelectedIds = [],
  attendeeToTicketMap = {},
  handleOpenAttendeeModal
}) => {
  const [searchText, setSearchText] = useState('');

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

  const handleToggle = (attendee, isDisabled) => {
    if (isDisabled) return;
    onSelectAttendee(attendee);
  };

  const handleAddNewClick = () => {
    if (typeof handleOpenAttendeeModal === 'function') {
      handleOpenAttendeeModal(currentTicketId);
    }
    if (typeof handleCloseModal === 'function') {
      handleCloseModal();
    }
  };
  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          <span>Select Existing Attendee</span>
        </Space>
      }
      open={showModal}
      onCancel={handleCloseModal}
      footer={[
        <Button key="close" onClick={handleCloseModal}>Close</Button>,
      ]}
      width={900}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Search
          placeholder="Search by name, email, or phone"
          prefix={<SearchOutlined />}
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          size="large"
        />

        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {filteredAttendees.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <Empty
                description={
                  attendees.length === 0
                    ? 'No existing attendees available'
                    : 'No attendees found matching your search'
                }
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddNewClick}
              >
                Add New Attendee
              </Button>
            </div>
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={filteredAttendees}
              renderItem={(attendee) => {
                const isSelected = currentTicketSelectedIds.includes(attendee.id);
                const usedIn = attendeeToTicketMap[attendee.id];
                const isDisabled = !isSelected && usedIn && usedIn.ticketId !== currentTicketId;

                return (
                  <Card
                    size="small"
                    hoverable={!isDisabled}
                    style={isDisabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                    onClick={() => handleToggle(attendee, isDisabled)}
                  >
                    <List.Item
                      actions={[
                        isSelected ? (
                          <Tag icon={<CheckCircleFilled />} color="success" key="selected">
                            Selected
                          </Tag>
                        ) : isDisabled ? (
                          <Tag color="default" key="in-other">
                            Used in {usedIn?.ticketName || 'other ticket'}
                          </Tag>
                        ) : (
                          <Button
                            key="select"
                            type="primary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle(attendee, isDisabled);
                            }}
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
