import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Card,
  Modal,
  Badge,
  Tag,
  Table,
  Input,
  InputNumber,
  Select,
  Switch,
  Space,
  Typography,
  Tooltip,
  Empty,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SettingOutlined,
  UsergroupAddOutlined,
  HomeOutlined,
  TeamOutlined,
  TrophyOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import "./Stadium.module.css";
import TiersModal from "../stadium form/TiersModal";
import SectionsModal from "../stadium form/SectionsModal";
import RowsModal from "../stadium form/RowsModal";
import EventTicketSelector from "./EventTicketSelector";
import TicketAssignmentModal from "./TicketAssignmentModal";
import { useMyContext } from "Context/MyContextProvider";
import { useVenues } from "views/events/event/hooks/useEventOptions";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;
const { Option } = Select;

const StadiumConfigForm = ({
  config,
  setConfig,
  onApply,
  mode = "add",
  show,
  onHide,
  loading,
}) => {
  const { stands, venue_id } = config;
  const [currentModal, setCurrentModal] = useState(null);
  const [currentIndices, setCurrentIndices] = useState({});
  const { isMobile, ErrorAlert } = useMyContext();

  const [form] = Form.useForm();
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [showTicketAssignModal, setShowTicketAssignModal] = useState(false);
  const [ticketAssignTarget, setTicketAssignTarget] = useState(null);
  const navigate = useNavigate();

  // Dummy ticket types - will be replaced with real data from selectedEvent
  const DUMMY_TICKET_TYPES = [
    { id: 1, name: 'General', price: 500, color: '#52c41a' },
    { id: 2, name: 'Premium', price: 1500, color: '#faad14' },
    { id: 3, name: 'VIP', price: 3000, color: '#f5222d' },
    { id: 4, name: 'Corporate Box', price: 10000, color: '#722ed1' },
    { id: 5, name: 'Student', price: 300, color: '#13c2c2' },
  ];

  // Show all ticket types from the event (for now, using DUMMY_TICKET_TYPES)
  // In production, this would filter based on selectedEvent.ticketTypes
  const availableTicketTypes = selectedEvent ? DUMMY_TICKET_TYPES : [];
  // Fetch venues
  const {
    data: venues = [],
    isLoading: venueLoading,
  } = useVenues();

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
      name: "Section 1",
      rows: createDefaultRows(),
      isBlocked: false,
    };
  };

  const createDefaultTier = () => {
    return {
      id: `tier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "Tier 1",
      sections: [createDefaultSection()],
      isBlocked: false,
    };
  };

  // Calculate capacities at all levels
  const calculateCapacities = () => {
    const standsWithSectionCapacities = stands.map((stand) => ({
      ...stand,
      tiers: stand.tiers.map((tier) => ({
        ...tier,
        sections: tier.sections.map((section) => ({
          ...section,
          capacity: section.rows.reduce(
            (sum, row) => sum + (row.seats || 0),
            0
          ),
        })),
      })),
    }));

    const standsWithTierCapacities = standsWithSectionCapacities.map(
      (stand) => ({
        ...stand,
        tiers: stand.tiers.map((tier) => ({
          ...tier,
          capacity: tier.sections.reduce(
            (sum, section) => sum + (section.capacity || 0),
            0
          ),
        })),
      })
    );

    const standsWithStandCapacities = standsWithTierCapacities.map((stand) => ({
      ...stand,
      capacity: stand.tiers.reduce(
        (sum, tier) => sum + (tier.capacity || 0),
        0
      ),
    }));

    const stadiumCapacity = standsWithStandCapacities.reduce(
      (sum, stand) => sum + (stand.capacity || 0),
      0
    );

    return {
      stadiumCapacity,
      stands: standsWithStandCapacities,
    };
  };

  const { stadiumCapacity, stands: standsWithCapacity } = calculateCapacities();

  useEffect(() => {
    setConfig((prev) => ({ ...prev, stadiumCapacity }));
  }, [stadiumCapacity, setConfig]);

  const getDefaultName = (type, index) => {
    return `${type} ${index + 1}`;
  };

  const updateStadium = (name, value) => {
    setConfig({ ...config, [name]: value });
  };

  // Handle venue selection
  const handleVenueChange = (venueId) => {
    const venue = venues.find((v) => String(v.id) === String(venueId) || String(v.value) === String(venueId));
    setSelectedVenue(venue);
    updateStadium("venue_id", venueId);
  };

  // Render venue option label
  const renderVenueOptionLabel = (venue) => (
    <Space direction="vertical" size={0}>
      <Typography.Text strong>{venue?.name || venue?.label}</Typography.Text>
      {(venue?.location || venue?.city || venue?.state) && (
        <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
          {venue?.location || [venue?.city, venue?.state].filter(Boolean).join(', ')}
        </Typography.Text>
      )}
    </Space>
  );

  const customNotFoundContent = (
    <Empty
      description="No venues found"
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    />
  );

  const handleAddVenue = () => {
    navigate('/venues');
  };

  const validateSeats = (value) => {
    const val = parseInt(value, 10);
    return isNaN(val) || val < 1 ? 1 : val;
  };

  const handleApply = () => {
    form.validateFields().then(() => {
      onApply?.();
    }).catch((error) => {
      ErrorAlert("Please fill all required fields");
    });
  };

  // ==== Modal Handlers ====
  const openModal = (modalType, indices = {}) => {
    const updatedStands = [...standsWithCapacity];
    const { standIndex, tierIndex, sectionIndex } = indices;

    const applyPriceIfEmpty = (target, sourcePrice) => {
      return target?.price != null ? target : { ...target, price: sourcePrice };
    };

    if (modalType === "tiers") {
      const stand = updatedStands[standIndex];
      const standPrice = stand?.price;

      stand.tiers = (stand.tiers || []).map((tier) => {
        const tierWithPrice = applyPriceIfEmpty(tier, standPrice);
        const tierPrice = tierWithPrice?.price;

        tierWithPrice.sections = (tierWithPrice.sections || []).map((section) => {
          const sectionWithPrice = applyPriceIfEmpty(section, tierPrice);
          const sectionPrice = sectionWithPrice?.price;

          sectionWithPrice.rows = (sectionWithPrice.rows || []).map((row) =>
            applyPriceIfEmpty(row, sectionPrice)
          );

          return sectionWithPrice;
        });

        return tierWithPrice;
      });

      updatedStands[standIndex] = stand;
    }

    if (modalType === "sections") {
      const tier = updatedStands[standIndex]?.tiers?.[tierIndex];
      const tierPrice = tier?.price;

      tier.sections = (tier.sections || []).map((section) => {
        const sectionWithPrice = applyPriceIfEmpty(section, tierPrice);
        const sectionPrice = sectionWithPrice?.price;

        sectionWithPrice.rows = (sectionWithPrice.rows || []).map((row) =>
          applyPriceIfEmpty(row, sectionPrice)
        );

        return sectionWithPrice;
      });

      updatedStands[standIndex].tiers[tierIndex] = tier;
    }

    if (modalType === "rows") {
      const section = updatedStands[standIndex]?.tiers?.[tierIndex]?.sections?.[sectionIndex];
      const sectionPrice = section?.price;

      section.rows = (section.rows || []).map((row) =>
        applyPriceIfEmpty(row, sectionPrice)
      );

      updatedStands[standIndex].tiers[tierIndex].sections[sectionIndex] = section;
    }

    setConfig({ ...config, stands: updatedStands });
    setCurrentModal(modalType);
    setCurrentIndices(indices);
  };

  const closeModal = () => {
    if (currentModal === "rows") {
      setCurrentModal("sections");
    } else if (currentModal === "sections") {
      setCurrentModal("tiers");
    } else if (currentModal === "tiers") {
      setCurrentModal(null);
    }
  };

  // ==== Stand Functions ====
  const addStand = () => {
    const newStand = {
      id: `stand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Stand ${stands.length + 1}`,
      type: "stand",
      tiers: [createDefaultTier()],
      isBlocked: false,
      visualWeight: 1,
    };
    setConfig({ ...config, stands: [...stands, newStand] });
  };

  const removeStand = (index) => {
    const updated = [...stands];
    updated.splice(index, 1);
    setConfig({ ...config, stands: updated });
  };

  const updateStandField = (index, field, value) => {
    const updated = [...stands];
    if (field === "visualWeight") {
      const numeric = Number(value);
      updated[index][field] = Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
    } else {
      updated[index][field] = value;
    }
    setConfig({ ...config, stands: updated });
  };

  const updateSectionField = (
    standIndex,
    tierIndex,
    sectionIndex,
    key,
    value
  ) => {
    const updated = [...stands];
    updated[standIndex].tiers[tierIndex].sections[sectionIndex][key] = value;
    setConfig({ ...config, stands: updated });
  };

  // ==== Tier Functions ====
  const addTier = (standIndex) => {
    const updated = [...stands];
    const tierCount = updated[standIndex].tiers.length;
    updated[standIndex].tiers.push({
      id: `tier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Tier ${tierCount + 1}`,
      sections: [createDefaultSection()],
      isBlocked: false,
    });
    setConfig({ ...config, stands: updated });
  };

  const removeTier = (standIndex, tierIndex) => {
    const updated = [...stands];
    updated[standIndex].tiers.splice(tierIndex, 1);
    setConfig({ ...config, stands: updated });
  };

  const updateTierField = (standIndex, tierIndex, key, value) => {
    const updated = [...stands];
    updated[standIndex].tiers[tierIndex][key] = value;
    setConfig({ ...config, stands: updated });
  };

  // ==== Section Functions ====
  const addSection = (standIndex, tierIndex) => {
    const updated = [...stands];
    const sectionCount = updated[standIndex].tiers[tierIndex].sections.length;
    updated[standIndex].tiers[tierIndex].sections.push({
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Section ${sectionCount + 1}`,
      rows: createDefaultRows(),
      isBlocked: false,
    });
    setConfig({ ...config, stands: updated });
  };

  const removeSection = (standIndex, tierIndex, sectionIndex) => {
    const updated = [...stands];
    updated[standIndex].tiers[tierIndex].sections.splice(sectionIndex, 1);
    setConfig({ ...config, stands: updated });
  };

  // ==== Row Functions ====
  const addRow = (standIndex, tierIndex, sectionIndex) => {
    const updated = [...stands];
    updated[standIndex].tiers[tierIndex].sections[sectionIndex].rows.push({
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: getDefaultName(
        "Row",
        updated[standIndex].tiers[tierIndex].sections[sectionIndex].rows.length
      ),
      seats: 1,
      isBlocked: false,
      seatIcon: 'circle',
    });
    setConfig({ ...config, stands: updated });
  };

  // ==== Ticket Assignment Handlers ====
  const openTicketAssignModal = (level, targetData, indices = {}) => {
    setTicketAssignTarget({ level, data: targetData, indices });
    setShowTicketAssignModal(true);
  };

  const handleTicketAssign = (assignment) => {
    const {
      level,
      ticketTypeId,
      price,
      seatIcon,
      assignmentMode,
      assignmentLevel: assignmentLevelValue,
    } = assignment;
    const { indices } = ticketAssignTarget;
    const mode = assignmentLevelValue || assignmentMode || 'override';

    // Get the ticket type to use its default price if custom price not provided
    const ticketType = availableTicketTypes.find(t => t.id === ticketTypeId);
    const finalPrice = price || ticketType?.price || 0;

    const updated = JSON.parse(JSON.stringify(stands)); // Deep clone

    const applyTicket = (target) => {
      target.ticketTypeId = ticketTypeId;
      target.price = finalPrice;
      target.seatIcon = seatIcon || 'circle';
    };

    const cascadeToChildren = (target) => {
      applyTicket(target);
      if (target.tiers) {
        target.tiers.forEach(tier => cascadeToChildren(tier));
      }
      if (target.sections) {
        target.sections.forEach(section => cascadeToChildren(section));
      }
      if (target.rows) {
        target.rows.forEach(row => {
          applyTicket(row);
          // Generate seat list with icons if not exists
          if (!row.seatList || row.seatList.length === 0) {
            row.seatList = Array.from({ length: row.seats || 0 }, (_, idx) => ({
              id: `${row.id || Math.random()}-seat-${idx + 1}`,
              number: idx + 1,
              isBooked: false,
              status: 'available',
              price: finalPrice,
              seatIcon: seatIcon || 'circle',
            }));
          } else {
            row.seatList.forEach(seat => {
              seat.price = finalPrice;
              seat.seatIcon = seatIcon || 'circle';
            });
          }
        });
      }
    };

    // Apply assignment based on level
    if (level === 'stand' && indices.standIndex !== undefined) {
      const stand = updated[indices.standIndex];
      if (!stand) return;
      if (mode === 'override') {
        cascadeToChildren(stand);
      } else {
        applyTicket(stand);
      }
    } else if (level === 'tier' && indices.standIndex !== undefined && indices.tierIndex !== undefined) {
      const stand = updated[indices.standIndex];
      const tier = stand?.tiers?.[indices.tierIndex];
      if (!tier) return;
      if (mode === 'override') {
        cascadeToChildren(tier);
      } else {
        applyTicket(tier);
      }
    } else if (level === 'section' && indices.standIndex !== undefined && indices.tierIndex !== undefined && indices.sectionIndex !== undefined) {
      const stand = updated[indices.standIndex];
      const tier = stand?.tiers?.[indices.tierIndex];
      const section = tier?.sections?.[indices.sectionIndex];
      if (!section) return;
      if (mode === 'override') {
        cascadeToChildren(section);
      } else {
        applyTicket(section);
      }
    } else if (level === 'row' && indices.standIndex !== undefined && indices.tierIndex !== undefined && indices.sectionIndex !== undefined && indices.rowIndex !== undefined) {
      const stand = updated[indices.standIndex];
      const tier = stand?.tiers?.[indices.tierIndex];
      const section = tier?.sections?.[indices.sectionIndex];
      const row = section?.rows?.[indices.rowIndex];
      if (!row) return;
      applyTicket(row);
      // Generate seat list with icons
      if (!row.seatList || row.seatList.length === 0) {
        row.seatList = Array.from({ length: row.seats || 0 }, (_, idx) => ({
          id: `${row.id || Math.random()}-seat-${idx + 1}`,
          number: idx + 1,
          isBooked: false,
          status: 'available',
          price: finalPrice,
          seatIcon: seatIcon || 'circle',
        }));
      } else {
        row.seatList.forEach(seat => {
          seat.price = finalPrice;
          seat.seatIcon = seatIcon || 'circle';
        });
      }
    }

    setConfig({ ...config, stands: updated });
  };

  const removeRow = (standIndex, tierIndex, sectionIndex, rowIndex) => {
    const updated = [...stands];
    updated[standIndex].tiers[tierIndex].sections[sectionIndex].rows.splice(
      rowIndex,
      1
    );
    setConfig({ ...config, stands: updated });
  };

  const updateRow = (
    standIndex,
    tierIndex,
    sectionIndex,
    rowIndex,
    field,
    value
  ) => {
    const updated = [...stands];
    updated[standIndex].tiers[tierIndex].sections[sectionIndex].rows[rowIndex][
      field
    ] = field === "seats" ? validateSeats(value) : value;
    setConfig({ ...config, stands: updated });
  };

  const columns = [
    {
      title: 'Stand Name',
      dataIndex: 'name',
      key: 'name',
      width: isMobile ? 120 : 180,
      render: (text, record, standIndex) => (
        <Input
          value={text}
          onChange={(e) => updateStandField(standIndex, "name", e.target.value)}
          placeholder="Stand Name"
          size={isMobile ? "small" : "middle"}
          className="w-100"
        />
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: isMobile ? 100 : 140,
      render: (type, record, standIndex) => (
        <Select
          value={type}
          onChange={(value) => updateStandField(standIndex, "type", value)}
          size={isMobile ? "small" : "middle"}
          className="w-100"
        >
          <Option value="stand">Stand</Option>
          <Option value="pavilion">Pavilion</Option>
        </Select>
      ),
    },
    {
      title: 'Blocked',
      dataIndex: 'isBlocked',
      key: 'isBlocked',
      width: isMobile ? 100 : 120,
      align: 'center',
      render: (isBlocked, record, standIndex) => (
        <div className="d-flex flex-column align-items-center">
          <Switch
            checked={isBlocked}
            onChange={(checked) => updateStandField(standIndex, "isBlocked", checked)}
            size={isMobile ? "small" : "default"}
          />
          <span className={`text-white mt-1 ${isMobile ? 'font-size-xs' : 'font-size-sm'}`}>
            {isBlocked ? "Blocked" : "Open"}
          </span>
        </div>
      ),
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      width: isMobile ? 80 : 100,
      align: 'center',
      render: (capacity) => (
        <Badge
          count={capacity ?? 0}
          showZero
          style={{
            backgroundColor: 'var(--primary-color)',
            color: 'var(--text-white)'
          }}
        />
      ),
    },
    {
      title: 'Visual Weight',
      dataIndex: 'visualWeight',
      key: 'visualWeight',
      width: isMobile ? 120 : 150,
      align: 'center',
      render: (visualWeight, record, standIndex) => (
        <InputNumber
          min={0.2}
          max={4}
          step={0.1}
          value={visualWeight ?? 1}
          onChange={(value) => updateStandField(standIndex, "visualWeight", value)}
          size={isMobile ? "small" : "middle"}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: isMobile ? 140 : 180,
      align: 'center',
      render: (_, record, standIndex) => (
        <div className="d-flex justify-content-center gap-2 flex-wrap">
          <Tooltip title="Manage Tiers">
            <Button
              type="text"
              icon={<SettingOutlined style={{ color: 'var(--primary-color)' }} />}
              onClick={() => openModal("tiers", { standIndex })}
              size={isMobile ? "small" : "middle"}
            />
          </Tooltip>
          <Tooltip title="Assign Ticket">
            <Button
              type="text"
              icon={<TagsOutlined style={{ color: 'var(--success-color)' }} />}
              onClick={() => openTicketAssignModal('stand', record, { standIndex })}
              size={isMobile ? "small" : "middle"}
              disabled={!selectedEvent}
            />
          </Tooltip>
          <Tooltip title="Remove Stand">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeStand(standIndex)}
              size={isMobile ? "small" : "middle"}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <div className="d-flex align-items-center justify-content-between flex-wrap w-100" style={{ gap: '0.5rem' }}>
            <div className="d-flex align-items-center flex-wrap" style={{ gap: '0.5rem' }}>
              <span className={`text-white font-weight-semibold ${isMobile ? 'font-size-base' : 'font-size-lg'}`}>
                {mode === "edit" ? "Edit Stadium" : "Create Stadium"}
              </span>
              <Tag
                icon={<TrophyOutlined />}
                color="gold"
                style={{
                  fontSize: isMobile ? 12 : 14,
                  padding: '4px 12px',
                  borderRadius: 16,
                  fontWeight: 500,
                  border: 'none'
                }}
              >
                Total Capacity: {stadiumCapacity}
              </Tag>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addStand}
              size="small"
              className="border-0 font-weight-semibold"
              style={{
                borderRadius: 6,
              }}
            >
              {isMobile ? "Add" : "Add Stand"}
            </Button>
          </div>
        }
        open={show}
        onCancel={onHide}
        width={isMobile ? "95%" : 1200}
        centered
        maskClosable={false}
        confirmLoading={loading}
        footer={[
          <div key="footer" className={`d-flex ${isMobile ? 'flex-column' : 'flex-row'} justify-content-end gap-2 w-100`}>
            <Button
              key="cancel"
              onClick={onHide}
              size={isMobile ? "middle" : "large"}
              className={`font-weight-medium ${isMobile ? 'w-100' : ''}`}
              style={{
                minWidth: isMobile ? 'auto' : 120,
              }}
            >
              Cancel
            </Button>
            <Button
              key="submit"
              type="primary"
              icon={<HomeOutlined />}
              onClick={handleApply}
              loading={loading}
              size={isMobile ? "middle" : "large"}
              className={`bg-primary border-0 font-weight-semibold ${isMobile ? 'w-100' : ''}`}
              style={{
                minWidth: isMobile ? 'auto' : 150,
              }}
            >
              {mode === "edit" ? "Apply Changes" : "Save Layout"}
            </Button>
          </div>
        ]}
        styles={{
          body: {
            maxHeight: 'calc(100vh - 240px)',
            overflowY: 'auto',
            padding: isMobile ? 12 : 24,
            backgroundColor: 'var(--body-bg)'
          },
          header: {
            backgroundColor: 'var(--component-bg)',
            borderBottom: '1px solid var(--border-secondary)',
          },
          footer: {
            backgroundColor: 'var(--component-bg)',
            borderTop: '1px solid var(--border-secondary)',
          }
        }}
        className="stadium-config-modal"
        closable={false}
      >
        <Form form={form} layout="vertical">
          {/* Venue Selection */}
          <Form.Item
            label={<span className="text-white font-weight-medium">Select Venue</span>}
            name="venue_id"
            rules={[{ required: true, message: 'Please select venue' }]}
            initialValue={venue_id}
            className="mb-3"
          >
            <Select
              placeholder=""
              loading={venueLoading}
              onChange={handleVenueChange}
              options={venues.map((v) => ({
                value: String(v.id) ?? String(v.value),
                label: renderVenueOptionLabel(v),
              }))}
              optionLabelProp="label"
              showSearch
              filterOption={(input, option) => {
                const text =
                  (option?.label?.props?.children?.[0]?.props?.children ?? '') + ' ' +
                  (option?.label?.props?.children?.[1]?.props?.children ?? '');
                return text.toLowerCase().includes(input.toLowerCase());
              }}
              size={isMobile ? "middle" : "large"}
              className="w-100"
              notFoundContent={customNotFoundContent}
            />
          </Form.Item>

          {/* Event & Ticket Selection */}
          <EventTicketSelector
            onEventChange={setSelectedEvent}
            onTicketTypeChange={setSelectedTicketType}
            selectedEvent={selectedEvent}
            selectedTicketType={selectedTicketType}
          />

          {/* Venue Details */}
          {selectedVenue && (
            <Card
              size="small"
              title={<span className="text-white font-weight-medium">Venue Details</span>}
              className="mb-4"
              style={{
                backgroundColor: 'var(--component-bg)',
                borderColor: 'var(--border-secondary)',
              }}
              extra={
                <Button
                  type="link"
                  onClick={handleAddVenue}
                  icon={<PlusOutlined />}
                  size="small"
                >
                  New Venue
                </Button>
              }
            >
              <Space direction="vertical" className="w-100">
                <Space size="large" wrap>
                  <Space>
                    <HomeOutlined className='text-white bg-primary p-2 rounded-circle' />
                    <Typography.Text className="text-white">
                      {selectedVenue?.name || selectedVenue?.label}
                    </Typography.Text>
                  </Space>
                  {(selectedVenue?.location || selectedVenue?.city || selectedVenue?.state) && (
                    <Space>
                      <CompassOutlined className='text-white bg-primary p-2 rounded-circle' />
                      <Typography.Text className="text-white">
                        {selectedVenue?.location || [selectedVenue?.city, selectedVenue?.state].filter(Boolean).join(', ')}
                      </Typography.Text>
                    </Space>
                  )}
                </Space>
                {selectedVenue?.address && (
                  <Space>
                    <EnvironmentOutlined className='text-white bg-primary p-2 rounded-circle' />
                    <Typography.Text className="text-white">{selectedVenue.address}</Typography.Text>
                  </Space>
                )}
                {selectedVenue?.address && (
                  <Button
                    type="primary"
                    className='mt-2'
                    icon={<EnvironmentOutlined />}
                    onClick={() => window.open(`${selectedVenue?.map_url}`, '_blank')}
                    size={isMobile ? "middle" : "default"}
                  >
                    View Map
                  </Button>
                )}
              </Space>
            </Card>
          )}

          {/* <Form.Item
            label={<span className="text-white font-weight-medium">Stadium Name</span>}
            name="stadiumName"
            rules={[{ required: true, message: 'Please enter stadium name' }]}
            initialValue={stadiumName}
            className="mb-3"
          >
            <Input
              value={stadiumName}
              onChange={(e) => updateStadium("stadiumName", e.target.value)}
              placeholder="Enter stadium name"
              size={isMobile ? "middle" : "large"}
              className="w-100"
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-white font-weight-medium">Location</span>}
            name="location"
            rules={[{ required: true, message: 'Please enter location' }]}
            initialValue={location}
            className="mb-4"
          >
            <Input
              value={location}
              onChange={(e) => updateStadium("location", e.target.value)}
              placeholder="Enter stadium location"
              size={isMobile ? "middle" : "large"}
              className="w-100"
            />
          </Form.Item> */}

          {/* Stands Summary */}
          <Card
            size="small"
            className="mb-3"
            style={{
              backgroundColor: 'var(--component-bg)',
              borderColor: 'var(--border-secondary)',
            }}
          >
            <div className="d-flex justify-content-between align-items-center flex-wrap" style={{ gap: '0.75rem' }}>
              <Title level={5} className="m-0 text-white font-weight-semibold">Stands Overview</Title>
              <div className="d-flex gap-2 flex-wrap">
                <Tag
                  icon={<TeamOutlined />}
                  color="processing"
                  style={{
                    fontSize: 13,
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontWeight: 500,
                    border: 'none'
                  }}
                >
                  Total Stands: {stands.length}
                </Tag>
                <Tag
                  icon={<UsergroupAddOutlined />}
                  color="success"
                  style={{
                    fontSize: 13,
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontWeight: 500,
                    border: 'none'
                  }}
                >
                  Total Capacity: {stadiumCapacity}
                </Tag>
              </div>
            </div>
          </Card>

          {/* Stands Table */}
          {standsWithCapacity.length === 0 ? (
            <Empty
              description={
                <span className="text-muted">
                  No stands created yet. Click "Add Stand" to get started!
                </span>
              }
              className="py-5"
            />
          ) : (
            <div className="table-responsive">
              <Table
                columns={columns}
                dataSource={standsWithCapacity}
                rowKey={(record, index) => `stand-${index}-${record.name || index}`}
                pagination={false}
                size={isMobile ? "small" : "middle"}
                scroll={{ x: isMobile ? 700 : undefined }}
                className="stadium-table"
              />
            </div>
          )}
        </Form>
      </Modal>

      {/* Nested Modals */}
      {currentModal === "tiers" && (
        <TiersModal
          show={true}
          isMobile={isMobile}
          stand={standsWithCapacity[currentIndices?.standIndex]}
          standIndex={currentIndices?.standIndex}
          onClose={closeModal}
          addTier={addTier}
          updateTierField={updateTierField}
          removeTier={removeTier}
          openModal={openModal}
          openTicketAssignModal={openTicketAssignModal}
          selectedEvent={selectedEvent}
        />
      )}

      <SectionsModal
        currentModal={currentModal}
        closeModal={closeModal}
        isMobile={isMobile}
        currentIndices={currentIndices}
        standsWithCapacity={standsWithCapacity}
        addSection={addSection}
        updateSectionField={updateSectionField}
        openModal={openModal}
        removeSection={removeSection}
        openTicketAssignModal={openTicketAssignModal}
        selectedEvent={selectedEvent}
      />

      <RowsModal
        currentModal={currentModal}
        closeModal={closeModal}
        isMobile={isMobile}
        currentIndices={currentIndices}
        standsWithCapacity={standsWithCapacity}
        addRow={addRow}
        updateRow={updateRow}
        removeRow={removeRow}
        openTicketAssignModal={openTicketAssignModal}
        selectedEvent={selectedEvent}
      />

      {/* Ticket Assignment Modal */}
      <TicketAssignmentModal
        show={showTicketAssignModal}
        onHide={() => setShowTicketAssignModal(false)}
        onAssign={handleTicketAssign}
        ticketTypes={availableTicketTypes}
        level={ticketAssignTarget?.level}
        targetData={ticketAssignTarget?.data}
        isMobile={isMobile}
        selectedEvent={selectedEvent}
        selectedTicketType={selectedTicketType}
      />
    </>
  );
};

export default StadiumConfigForm;
