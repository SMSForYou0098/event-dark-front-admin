import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Space,
  Button,
  Card,
  Typography,
  Tag,
  Radio,
  Alert,
} from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  LayoutOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const TicketAssignmentModal = ({
  show,
  onHide,
  onAssign,
  ticketTypes,
  level,
  targetData,
  isMobile,
  selectedEvent,
}) => {
  const [form] = Form.useForm();
  const [assignmentLevel, setAssignmentLevel] = useState('current'); // 'current' or 'override'
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Reset form and state when modal opens/closes
  useEffect(() => {
    if (show) {
      form.resetFields();
      setSelectedTicket(null);
      setAssignmentLevel('current');
    }
  }, [show, form]);
  
  // Auto-fill price when ticket type is selected
  const handleTicketTypeChange = (ticketTypeId) => {
    const ticket = ticketTypes?.find((t) => t.id === ticketTypeId);
    setSelectedTicket(ticket);
    if (ticket) {
      form.setFieldsValue({ price: ticket.price });
    }
  };

  const getLevelInfo = () => {
    switch (level) {
      case 'stand':
        return {
          icon: <HomeOutlined />,
          title: 'Assign to Stand',
          name: targetData?.name || 'Stand',
          color: '#1890ff',
        };
      case 'tier':
        return {
          icon: <AppstoreOutlined />,
          title: 'Assign to Tier',
          name: targetData?.name || 'Tier',
          color: '#52c41a',
        };
      case 'section':
        return {
          icon: <LayoutOutlined />,
          title: 'Assign to Section',
          name: targetData?.name || 'Section',
          color: '#faad14',
        };
      case 'seat':
        return {
          icon: <CheckCircleOutlined />,
          title: 'Assign to Seat',
          name: `Seat ${targetData?.number || ''}`,
          color: '#f5222d',
        };
      default:
        return { icon: null, title: 'Assign Ticket', name: '', color: '#8c8c8c' };
    }
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const assignment = {
        ...values,
        level,
        targetId: targetData?.id,
        assignmentLevel,
      };
      onAssign?.(assignment);
      form.resetFields();
      onHide();
    });
  };

  const levelInfo = getLevelInfo();

  return (
    <Modal
      title={
        <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
          <span style={{ color: levelInfo.color, fontSize: 20 }}>{levelInfo.icon}</span>
          <span className="text-white font-weight-semibold">{levelInfo.title}</span>
        </div>
      }
      open={show}
      onCancel={onHide}
      width={isMobile ? '95%' : 600}
      centered
      zIndex={2000}
      maskClosable={false}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onHide} size={isMobile ? 'middle' : 'large'}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          size={isMobile ? 'middle' : 'large'}
        >
          Assign Ticket
        </Button>,
      ]}
      styles={{
        body: {
          backgroundColor: 'var(--body-bg)',
          maxHeight: 'calc(100vh - 240px)',
          overflowY: 'auto',
        },
        header: {
          backgroundColor: 'var(--component-bg)',
          borderBottom: '1px solid var(--border-secondary)',
        },
      }}
    >
      <Form form={form} layout="vertical" initialValues={{ seatIcon: 'circle' }}>
        <Card
          size="small"
          style={{
            marginBottom: 16,
            backgroundColor: `${levelInfo.color}15`,
            borderColor: levelInfo.color,
          }}
        >
          <Space direction="vertical" size={4}>
            <Text type="secondary">Target:</Text>
            <Text strong style={{ fontSize: 16, color: 'var(--text-white)' }}>
              {levelInfo.name}
            </Text>
          </Space>
        </Card>

        <Alert
          message="Assignment Scope"
          description="This will assign the ticket type to all seats within this level."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item
          label={<span className="text-white">Ticket Type</span>}
          name="ticketTypeId"
          rules={[{ required: true, message: 'Please select a ticket type' }]}
        >
          <Select
            placeholder="Select ticket type"
            size="large"
            showSearch
            onChange={handleTicketTypeChange}
            optionFilterProp="label"
          >
            {ticketTypes?.map((ticket) => (
              <Option 
                key={ticket.id} 
                value={ticket.id}
                label={`${ticket.name} ${ticket.price}`}
              >
                <Space>
                  <Tag color={ticket.color} style={{ margin: 0 }}>
                    {ticket.name}
                  </Tag>
                  <Text>₹{ticket.price?.toLocaleString()}</Text>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedTicket && (
          <Card
            size="small"
            style={{
              marginBottom: 16,
              backgroundColor: `${selectedTicket.color}15`,
              borderColor: selectedTicket.color,
            }}
          >
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary">Selected Ticket Details:</Text>
              <Space>
                <Tag color={selectedTicket.color}>{selectedTicket.name}</Tag>
                <Text strong style={{ fontSize: 16, color: 'var(--text-white)' }}>
                  ₹{selectedTicket.price?.toLocaleString()}
                </Text>
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                This price (₹{selectedTicket.price?.toLocaleString()}) will be applied to all seats at this level.
              </Text>
            </Space>
          </Card>
        )}

        {/* Custom Price Field - Commented out as per requirement
        <Form.Item
          label={
            <span className="text-white">
              Custom Price (Optional)
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                Leave empty to use ticket price
              </Text>
            </span>
          }
          name="price"
          tooltip="Override the default ticket price for this specific assignment"
        >
          <InputNumber
            placeholder={selectedTicket ? `Default: ₹${selectedTicket.price}` : "Enter custom price"}
            size="large"
            style={{ width: '100%' }}
            min={0}
            prefix={<DollarOutlined />}
          />
        </Form.Item>
        */}

        {/* TODO: Seat Icon Selection - Commented out for now, needs proper implementation
        <Divider style={{ margin: '16px 0', borderColor: 'var(--border-secondary)' }} />

        <Form.Item
          label={<span className="text-white">Seat Icon</span>}
          name="seatIcon"
          tooltip="Choose an icon to represent seats with this ticket type"
        >
          <Radio.Group buttonStyle="solid" size="large" style={{ width: '100%' }}>
            <Space wrap style={{ width: '100%' }}>
              {SEAT_ICON_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <Radio.Button key={option.value} value={option.value}>
                    <Space size={4}>
                      <Icon style={{ fontSize: 16 }} />
                      <span>{option.label}</span>
                    </Space>
                  </Radio.Button>
                );
              })}
            </Space>
          </Radio.Group>
        </Form.Item>
        */}

        <Form.Item
          label={<span className="text-white">Assignment Mode</span>}
          name="assignmentMode"
          initialValue="current"
        >
          <Radio.Group
            onChange={(e) => setAssignmentLevel(e.target.value)}
            buttonStyle="solid"
            size="large"
            style={{ width: '100%' }}
          >
            <Radio.Button value="current" style={{ width: '50%', textAlign: 'center' }}>
              Current Level Only
            </Radio.Button>
            <Radio.Button value="override" style={{ width: '50%', textAlign: 'center' }}>
              Override Children
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {assignmentLevel === 'override' && (
          <Alert
            message="Override Mode"
            description="This will override all child-level ticket assignments (e.g., if assigning to a tier, it will override section and seat assignments)."
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
          />
        )}
      </Form>
    </Modal>
  );
};

export default TicketAssignmentModal;

