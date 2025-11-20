import React, { useState } from 'react';
import { Drawer, Steps, Button, Space, Typography, Divider, Badge, Tag } from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  LayoutOutlined,
  MenuOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import TiersModal from '../stadium form/TiersModal';
import SectionsModal from '../stadium form/SectionsModal';
import RowsModal from '../stadium form/RowsModal';

const { Title, Text } = Typography;

/**
 * StadiumBuilderDrawer - A modern, step-based approach to stadium configuration
 * Replaces nested modals with a cleaner drawer experience
 */
const StadiumBuilderDrawer = ({
  visible,
  onClose,
  stand,
  standIndex,
  stands,
  isMobile,
  // Pass-through functions
  addTier,
  updateTierField,
  removeTier,
  addSection,
  updateSectionField,
  removeSection,
  addRow,
  updateRow,
  removeRow,
  openModal,
  openTicketAssignModal,
  selectedEvent,
}) => {
  const [currentStep, setCurrentStep] = useState(0); // 0: Tiers, 1: Sections, 2: Rows
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  const steps = [
    {
      title: 'Tiers',
      icon: <AppstoreOutlined />,
      description: 'Manage stand tiers',
    },
    {
      title: 'Sections',
      icon: <LayoutOutlined />,
      description: 'Configure sections',
    },
    {
      title: 'Rows',
      icon: <MenuOutlined />,
      description: 'Setup seat rows',
    },
  ];

  const handleNext = (tierIndex) => {
    setSelectedTier(tierIndex);
    setCurrentStep(1);
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setSelectedSection(null);
    } else if (currentStep === 1) {
      setCurrentStep(0);
      setSelectedTier(null);
    }
  };

  const handleSectionSelect = (sectionIndex) => {
    setSelectedSection(sectionIndex);
    setCurrentStep(2);
  };

  const renderBreadcrumb = () => {
    const items = [
      <Tag key="stand" icon={<HomeOutlined />} color="blue">{stand?.name}</Tag>
    ];

    if (selectedTier !== null && stand?.tiers?.[selectedTier]) {
      items.push(
        <Tag key="tier" icon={<AppstoreOutlined />} color="green">
          {stand.tiers[selectedTier].name}
        </Tag>
      );
    }

    if (selectedSection !== null && stand?.tiers?.[selectedTier]?.sections?.[selectedSection]) {
      items.push(
        <Tag key="section" icon={<LayoutOutlined />} color="orange">
          {stand.tiers[selectedTier].sections[selectedSection].name}
        </Tag>
      );
    }

    return <Space size={8} wrap>{items}</Space>;
  };

  return (
    <Drawer
      title={
        <div>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space>
              <HomeOutlined style={{ fontSize: 20, color: '#1890ff' }} />
              <Title level={4} style={{ margin: 0 }}>
                Configure {stand?.name || 'Stand'}
              </Title>
            </Space>
            {renderBreadcrumb()}
          </Space>
        </div>
      }
      width={isMobile ? '100%' : 720}
      onClose={onClose}
      open={visible}
      extra={
        currentStep > 0 && (
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            type="text"
          >
            Back
          </Button>
        )
      }
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>Close</Button>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={onClose}>
              Done
            </Button>
          </Space>
        </div>
      }
    >
      {/* Progress Steps */}
      <Steps
        current={currentStep}
        items={steps}
        size="small"
        style={{ marginBottom: 24 }}
      />

      <Divider />

      {/* Step Content */}
      {currentStep === 0 && (
        <TiersModal
          show={true}
          isMobile={isMobile}
          stand={stand}
          standIndex={standIndex}
          onClose={onClose}
          addTier={addTier}
          updateTierField={updateTierField}
          removeTier={removeTier}
          openModal={(type, indices) => {
            if (type === 'sections') {
              handleNext(indices.tierIndex);
            }
          }}
          openTicketAssignModal={openTicketAssignModal}
          selectedEvent={selectedEvent}
        />
      )}

      {currentStep === 1 && selectedTier !== null && (
        <SectionsModal
          currentModal="sections"
          closeModal={handleBack}
          isMobile={isMobile}
          currentIndices={{ standIndex, tierIndex: selectedTier }}
          standsWithCapacity={stands}
          addSection={addSection}
          updateSectionField={updateSectionField}
          openModal={(type, indices) => {
            if (type === 'rows') {
              handleSectionSelect(indices.sectionIndex);
            }
          }}
          removeSection={removeSection}
          openTicketAssignModal={openTicketAssignModal}
          selectedEvent={selectedEvent}
        />
      )}

      {currentStep === 2 && selectedTier !== null && selectedSection !== null && (
        <RowsModal
          currentModal="rows"
          closeModal={handleBack}
          isMobile={isMobile}
          currentIndices={{ standIndex, tierIndex: selectedTier, sectionIndex: selectedSection }}
          standsWithCapacity={stands}
          addRow={addRow}
          updateRow={updateRow}
          removeRow={removeRow}
          openTicketAssignModal={openTicketAssignModal}
          selectedEvent={selectedEvent}
        />
      )}
    </Drawer>
  );
};

export default StadiumBuilderDrawer;

