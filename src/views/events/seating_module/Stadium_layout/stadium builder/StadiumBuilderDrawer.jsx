import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Steps,
  Form,
  Input,
  Select,
  Button,
  Space,
  Card,
  Table,
  InputNumber,
  Switch,
  Tag,
  Typography,
  Tooltip,
  Empty,
  Badge,
  Divider,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SettingOutlined,
  TagsOutlined,
  HomeOutlined,
  AppstoreOutlined,
  LayoutOutlined,
  UnorderedListOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import EventTicketSelector from './EventTicketSelector';
import TicketAssignmentModal from './TicketAssignmentModal';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * StadiumBuilderDrawer - A cleaner, step-by-step approach to building stadiums
 * Replaces nested modals with a single drawer that guides users through the process
 */
const StadiumBuilderDrawer = ({
  open,
  onClose,
  config,
  setConfig,
  onSubmit,
  mode = 'add',
  loading,
  venues = [],
  venueLoading = false,
  isMobile = false,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [selectedStand, setSelectedStand] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [showTicketAssignModal, setShowTicketAssignModal] = useState(false);
  const [ticketAssignTarget, setTicketAssignTarget] = useState(null);

  const DUMMY_TICKET_TYPES = [
    { id: 1, name: 'General', price: 500, color: '#52c41a' },
    { id: 2, name: 'Premium', price: 1500, color: '#faad14' },
    { id: 3, name: 'VIP', price: 3000, color: '#f5222d' },
    { id: 4, name: 'Corporate Box', price: 10000, color: '#722ed1' },
    { id: 5, name: 'Student', price: 300, color: '#13c2c2' },
  ];

  const { stands = [], venue_id } = config;

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ venue_id });
      setCurrentStep(0);
      setSelectedStand(null);
      setSelectedTier(null);
      setSelectedSection(null);
    }
  }, [open, venue_id, form]);

  // Helper functions for ID generation
  const createDefaultRows = () => {
    return Array.from({ length: 2 }, (_, i) => ({
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
      label: `Row ${i + 1}`,
      seats: 1 + i,
      isBlocked: false,
    }));
  };

  const createDefaultSection = () => {
    return {
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Section 1',
      rows: createDefaultRows(),
      isBlocked: false,
    };
  };

  const createDefaultTier = () => {
    return {
      id: `tier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Tier 1',
      sections: [createDefaultSection()],
      isBlocked: false,
    };
  };

  // Stand operations
  const addStand = () => {
    const newStand = {
      id: `stand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Stand ${stands.length + 1}`,
      visualWeight: 1,
      tiers: [createDefaultTier()],
      isBlocked: false,
    };
    setConfig((prev) => ({
      ...prev,
      stands: [...prev.stands, newStand],
    }));
  };

  const deleteStand = (index) => {
    setConfig((prev) => ({
      ...prev,
      stands: prev.stands.filter((_, i) => i !== index),
    }));
  };

  const updateStandField = (index, field, value) => {
    setConfig((prev) => ({
      ...prev,
      stands: prev.stands.map((stand, i) =>
        i === index ? { ...stand, [field]: value } : stand
      ),
    }));
  };

  // Tier operations
  const addTier = (standIndex) => {
    setConfig((prev) => ({
      ...prev,
      stands: prev.stands.map((stand, i) =>
        i === standIndex
          ? {
              ...stand,
              tiers: [...stand.tiers, createDefaultTier()],
            }
          : stand
      ),
    }));
  };

  const deleteTier = (standIndex, tierIndex) => {
    setConfig((prev) => ({
      ...prev,
      stands: prev.stands.map((stand, i) =>
        i === standIndex
          ? {
              ...stand,
              tiers: stand.tiers.filter((_, ti) => ti !== tierIndex),
            }
          : stand
      ),
    }));
  };

  const updateTierField = (standIndex, tierIndex, field, value) => {
    setConfig((prev) => ({
      ...prev,
      stands: prev.stands.map((stand, si) =>
        si === standIndex
          ? {
              ...stand,
              tiers: stand.tiers.map((tier, ti) =>
                ti === tierIndex ? { ...tier, [field]: value } : tier
              ),
            }
          : stand
      ),
    }));
  };

  // Section operations
  const addSection = (standIndex, tierIndex) => {
    setConfig((prev) => ({
      ...prev,
      stands: prev.stands.map((stand, si) =>
        si === standIndex
          ? {
              ...stand,
              tiers: stand.tiers.map((tier, ti) =>
                ti === tierIndex
                  ? {
                      ...tier,
                      sections: [...tier.sections, createDefaultSection()],
                    }
                  : tier
              ),
            }
          : stand
      ),
    }));
  };

  const deleteSection = (standIndex, tierIndex, sectionIndex) => {
    setConfig((prev) => ({
      ...prev,
      stands: prev.stands.map((stand, si) =>
        si === standIndex
          ? {
              ...stand,
              tiers: stand.tiers.map((tier, ti) =>
                ti === tierIndex
                  ? {
                      ...tier,
                      sections: tier.sections.filter((_, seci) => seci !== sectionIndex),
                    }
                  : tier
              ),
            }
          : stand
      ),
    }));
  };

  const updateSectionField = (standIndex, tierIndex, sectionIndex, field, value) => {
    setConfig((prev) => ({
      ...prev,
      stands: prev.stands.map((stand, si) =>
        si === standIndex
          ? {
              ...stand,
              tiers: stand.tiers.map((tier, ti) =>
                ti === tierIndex
                  ? {
                      ...tier,
                      sections: tier.sections.map((section, seci) =>
                        seci === sectionIndex ? { ...section, [field]: value } : section
                      ),
                    }
                  : tier
              ),
            }
          : stand
      ),
    }));
  };

  // Row operations
  const addRow = (standIndex, tierIndex, sectionIndex) => {
    setConfig((prev) => ({
      ...prev,
      stands: prev.stands.map((stand, si) =>
        si === standIndex
          ? {
              ...stand,
              tiers: stand.tiers.map((tier, ti) =>
                ti === tierIndex
                  ? {
                      ...tier,
                      sections: tier.sections.map((section, seci) =>
                        seci === sectionIndex
                          ? {
                              ...section,
                              rows: [
                                ...section.rows,
                                {
                                  id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                  label: `Row ${section.rows.length + 1}`,
                                  seats: 10,
                                  isBlocked: false,
                                },
                              ],
                            }
                          : section
                      ),
                    }
                  : tier
              ),
            }
          : stand
      ),
    }));
  };

  const deleteRow = (standIndex, tierIndex, sectionIndex, rowIndex) => {
    setConfig((prev) => ({
      ...prev,
      stands: prev.stands.map((stand, si) =>
        si === standIndex
          ? {
              ...stand,
              tiers: stand.tiers.map((tier, ti) =>
                ti === tierIndex
                  ? {
                      ...tier,
                      sections: tier.sections.map((section, seci) =>
                        seci === sectionIndex
                          ? {
                              ...section,
                              rows: section.rows.filter((_, ri) => ri !== rowIndex),
                            }
                          : section
                      ),
                    }
                  : tier
              ),
            }
          : stand
      ),
    }));
  };

  const updateRowField = (standIndex, tierIndex, sectionIndex, rowIndex, field, value) => {
    setConfig((prev) => ({
      ...prev,
      stands: prev.stands.map((stand, si) =>
        si === standIndex
          ? {
              ...stand,
              tiers: stand.tiers.map((tier, ti) =>
                ti === tierIndex
                  ? {
                      ...tier,
                      sections: tier.sections.map((section, seci) =>
                        seci === sectionIndex
                          ? {
                              ...section,
                              rows: section.rows.map((row, ri) =>
                                ri === rowIndex ? { ...row, [field]: value } : row
                              ),
                            }
                          : section
                      ),
                    }
                  : tier
              ),
            }
          : stand
      ),
    }));
  };

  // Ticket assignment handler
  const handleTicketAssign = (assignmentData) => {
    const { ticketTypeId, level, targetData, assignmentLevel: mode } = assignmentData;
    
    const ticket = DUMMY_TICKET_TYPES.find((t) => t.id === ticketTypeId);
    if (!ticket) return;

    const assignment = {
      ticketTypeId: ticket.id,
      ticketTypeName: ticket.name,
      price: ticket.price,
      color: ticket.color,
    };

    // Apply ticket assignment based on level
    setConfig((prev) => {
      const newConfig = { ...prev };
      
      if (level === 'stand') {
        const standIndex = newConfig.stands.findIndex(s => s.id === targetData.id);
        if (standIndex >= 0) {
          newConfig.stands[standIndex] = {
            ...newConfig.stands[standIndex],
            ...assignment,
          };
          
          if (mode === 'override') {
            // Recursively apply to all children
            newConfig.stands[standIndex].tiers = newConfig.stands[standIndex].tiers.map(tier => ({
              ...tier,
              ...assignment,
              sections: tier.sections.map(section => ({
                ...section,
                ...assignment,
                rows: section.rows.map(row => ({
                  ...row,
                  ...assignment,
                })),
              })),
            }));
          }
        }
      }
      
      // Similar logic for tier, section, row levels...
      
      return newConfig;
    });

    setShowTicketAssignModal(false);
  };

  const openTicketAssignModal = (level, data) => {
    setTicketAssignTarget({ level, data });
    setShowTicketAssignModal(true);
  };

  // Step definitions
  const steps = [
    {
      title: 'Basic Info',
      icon: <HomeOutlined />,
      description: 'Venue & Event',
    },
    {
      title: 'Stands',
      icon: <AppstoreOutlined />,
      description: 'Add Stands',
    },
    {
      title: 'Structure',
      icon: <LayoutOutlined />,
      description: 'Tiers & Sections',
    },
    {
      title: 'Rows',
      icon: <UnorderedListOutlined />,
      description: 'Configure Rows',
    },
  ];

  // Step content renderers
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderStandsStep();
      case 2:
        return renderStructureStep();
      case 3:
        return renderRowsStep();
      default:
        return null;
    }
  };

  const renderBasicInfo = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title={<><HomeOutlined /> Venue Selection</>} size="small">
        <Form.Item
          label="Select Venue"
          name="venue_id"
          rules={[{ required: true, message: 'Please select a venue' }]}
        >
          <Select
            placeholder="Choose a venue"
            size="large"
            loading={venueLoading}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {venues.map((venue) => (
              <Option key={venue.id} value={venue.id}>
                {venue.venue_name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Card>

      <EventTicketSelector
        onEventChange={setSelectedEvent}
        onTicketTypeChange={setSelectedTicketType}
        selectedEvent={selectedEvent}
        selectedTicketType={selectedTicketType}
      />
    </Space>
  );

  const renderStandsStep = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <AppstoreOutlined />
            <span>Stadium Stands</span>
            <Badge count={stands.length} style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={addStand}>
            Add Stand
          </Button>
        }
      >
        <Table
          dataSource={stands}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Name',
              dataIndex: 'name',
              key: 'name',
              render: (name, record, index) => (
                <Input
                  value={name}
                  onChange={(e) => updateStandField(index, 'name', e.target.value)}
                />
              ),
            },
            {
              title: 'Visual Weight',
              dataIndex: 'visualWeight',
              key: 'visualWeight',
              width: 150,
              render: (weight, record, index) => (
                <InputNumber
                  min={0.2}
                  max={4}
                  step={0.1}
                  value={weight ?? 1}
                  onChange={(value) => updateStandField(index, 'visualWeight', value)}
                  style={{ width: '100%' }}
                />
              ),
            },
            {
              title: 'Blocked',
              dataIndex: 'isBlocked',
              key: 'isBlocked',
              width: 100,
              render: (blocked, record, index) => (
                <Switch
                  checked={blocked}
                  onChange={(checked) => updateStandField(index, 'isBlocked', checked)}
                />
              ),
            },
            {
              title: 'Ticket',
              key: 'ticket',
              width: 120,
              render: (_, record, index) => (
                <Button
                  type="link"
                  icon={<TagsOutlined />}
                  onClick={() => openTicketAssignModal('stand', record)}
                >
                  Assign
                </Button>
              ),
            },
            {
              title: 'Actions',
              key: 'actions',
              width: 150,
              render: (_, record, index) => (
                <Space>
                  <Tooltip title="Configure">
                    <Button
                      size="small"
                      icon={<SettingOutlined />}
                      onClick={() => {
                        setSelectedStand(index);
                        setCurrentStep(2);
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="Delete">
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => deleteStand(index)}
                    />
                  </Tooltip>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );

  const renderStructureStep = () => {
    if (selectedStand === null || !stands[selectedStand]) {
      return (
        <Empty description="Please select a stand from the previous step">
          <Button type="primary" onClick={() => setCurrentStep(1)}>
            Go Back to Stands
          </Button>
        </Empty>
      );
    }

    const stand = stands[selectedStand];
    
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message={`Configuring: ${stand.name}`}
          type="info"
          showIcon
          action={
            <Button size="small" onClick={() => setSelectedStand(null)}>
              Change Stand
            </Button>
          }
        />

        <Card
          title={
            <Space>
              <LayoutOutlined />
              <span>Tiers</span>
              <Badge count={stand.tiers?.length || 0} style={{ backgroundColor: '#1890ff' }} />
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => addTier(selectedStand)}
            >
              Add Tier
            </Button>
          }
        >
          {stand.tiers?.map((tier, tierIndex) => (
            <Card
              key={tier.id}
              type="inner"
              title={tier.name}
              size="small"
              style={{ marginBottom: 16 }}
              extra={
                <Space>
                  <Button
                    size="small"
                    icon={<TagsOutlined />}
                    onClick={() => openTicketAssignModal('tier', tier)}
                  >
                    Assign Ticket
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteTier(selectedStand, tierIndex)}
                  />
                </Space>
              }
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Input
                  placeholder="Tier Name"
                  value={tier.name}
                  onChange={(e) =>
                    updateTierField(selectedStand, tierIndex, 'name', e.target.value)
                  }
                />
                
                <Divider style={{ margin: '8px 0' }}>Sections</Divider>
                
                <Space wrap>
                  {tier.sections?.map((section, sectionIndex) => (
                    <Tag
                      key={section.id}
                      closable
                      onClose={() => deleteSection(selectedStand, tierIndex, sectionIndex)}
                      onClick={() => {
                        setSelectedSection({ standIndex: selectedStand, tierIndex, sectionIndex });
                        setCurrentStep(3);
                      }}
                      style={{ cursor: 'pointer', padding: '4px 8px' }}
                    >
                      {section.name}
                    </Tag>
                  ))}
                  <Button
                    size="small"
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => addSection(selectedStand, tierIndex)}
                  >
                    Add Section
                  </Button>
                </Space>
              </Space>
            </Card>
          ))}
        </Card>
      </Space>
    );
  };

  const renderRowsStep = () => {
    if (!selectedSection) {
      return (
        <Empty description="Please select a section from the previous step">
          <Button type="primary" onClick={() => setCurrentStep(2)}>
            Go Back to Structure
          </Button>
        </Empty>
      );
    }

    const { standIndex, tierIndex, sectionIndex } = selectedSection;
    const section = stands[standIndex]?.tiers[tierIndex]?.sections[sectionIndex];

    if (!section) {
      return <Empty description="Section not found" />;
    }

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message={`Configuring Rows for: ${section.name}`}
          type="info"
          showIcon
          action={
            <Button size="small" onClick={() => setSelectedSection(null)}>
              Change Section
            </Button>
          }
        />

        <Card
          title={
            <Space>
              <UnorderedListOutlined />
              <span>Rows</span>
              <Badge count={section.rows?.length || 0} style={{ backgroundColor: '#722ed1' }} />
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => addRow(standIndex, tierIndex, sectionIndex)}
            >
              Add Row
            </Button>
          }
        >
          <Table
            dataSource={section.rows}
            rowKey="id"
            pagination={false}
            size="small"
            columns={[
              {
                title: 'Label',
                dataIndex: 'label',
                key: 'label',
                render: (label, record, rowIndex) => (
                  <Input
                    value={label}
                    onChange={(e) =>
                      updateRowField(standIndex, tierIndex, sectionIndex, rowIndex, 'label', e.target.value)
                    }
                  />
                ),
              },
              {
                title: 'Seats',
                dataIndex: 'seats',
                key: 'seats',
                width: 120,
                render: (seats, record, rowIndex) => (
                  <InputNumber
                    min={1}
                    value={seats}
                    onChange={(value) =>
                      updateRowField(standIndex, tierIndex, sectionIndex, rowIndex, 'seats', value)
                    }
                    style={{ width: '100%' }}
                  />
                ),
              },
              {
                title: 'Blocked',
                dataIndex: 'isBlocked',
                key: 'isBlocked',
                width: 100,
                render: (blocked, record, rowIndex) => (
                  <Switch
                    checked={blocked}
                    onChange={(checked) =>
                      updateRowField(standIndex, tierIndex, sectionIndex, rowIndex, 'isBlocked', checked)
                    }
                  />
                ),
              },
              {
                title: 'Actions',
                key: 'actions',
                width: 80,
                render: (_, record, rowIndex) => (
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteRow(standIndex, tierIndex, sectionIndex, rowIndex)}
                  />
                ),
              },
            ]}
          />
        </Card>
      </Space>
    );
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    form.validateFields().then((values) => {
      onSubmit({ ...config, venue_id: values.venue_id });
    });
  };

  return (
    <>
      <Drawer
        title={
          <Space>
            <HomeOutlined style={{ color: '#1890ff' }} />
            <span>{mode === 'edit' ? 'Edit Stadium' : 'Create Stadium'}</span>
          </Space>
        }
        placement="right"
        width={isMobile ? '100%' : 720}
        onClose={onClose}
        open={open}
        extra={
          <Space>
            {currentStep > 0 && (
              <Button icon={<ArrowLeftOutlined />} onClick={handlePrev}>
                Previous
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button type="primary" icon={<ArrowRightOutlined />} onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleFinish}
                loading={loading}
              >
                Save Stadium
              </Button>
            )}
          </Space>
        }
        styles={{
          body: {
            paddingBottom: 80,
          },
        }}
      >
        <Form form={form} layout="vertical">
          <Steps
            current={currentStep}
            items={steps}
            style={{ marginBottom: 24 }}
            size="small"
          />

          <div style={{ minHeight: 400 }}>{renderStepContent()}</div>
        </Form>
      </Drawer>

      <TicketAssignmentModal
        show={showTicketAssignModal}
        onHide={() => setShowTicketAssignModal(false)}
        onAssign={handleTicketAssign}
        ticketTypes={DUMMY_TICKET_TYPES}
        level={ticketAssignTarget?.level}
        targetData={ticketAssignTarget?.data}
        isMobile={isMobile}
        selectedEvent={selectedEvent}
        selectedTicketType={selectedTicketType}
      />
    </>
  );
};

export default StadiumBuilderDrawer;
