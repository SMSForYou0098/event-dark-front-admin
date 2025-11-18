import React, { useMemo } from 'react';
import { Modal, Button, Badge, Tag, Table, Input, Switch, Space, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, MenuOutlined, TeamOutlined } from '@ant-design/icons';

const SectionsModal = ({
  currentModal,
  closeModal,
  isMobile,
  currentIndices,
  standsWithCapacity,
  addSection,
  updateSectionField,
  openModal,
  removeSection
}) => {
  const { standIndex, tierIndex } = currentIndices || {};
  
  // Get live tier data with useMemo
  const tier = useMemo(() => {
    return standsWithCapacity?.[standIndex]?.tiers?.[tierIndex];
  }, [standsWithCapacity, standIndex, tierIndex]);

  if (!tier) return null;

  const columns = [
    {
      title: 'Section Name',
      dataIndex: 'name',
      key: 'name',
      width: isMobile ? 120 : 200,
      render: (text, record, sectionIndex) => (
        <Input
          value={text}
          onChange={(e) =>
            updateSectionField(
              standIndex,
              tierIndex,
              sectionIndex,
              "name",
              e.target.value
            )
          }
          placeholder="Section Name"
          required
          size={isMobile ? "small" : "middle"}
          className="w-100"
        />
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: isMobile ? 80 : 120,
      render: (text, record, sectionIndex) => (
        <Input
          type="number"
          value={text}
          min={0}
          onChange={(e) =>
            updateSectionField(
              standIndex,
              tierIndex,
              sectionIndex,
              "price",
              e.target.value
            )
          }
          placeholder="Price"
          required
          size={isMobile ? "small" : "middle"}
          className="w-100"
        />
      ),
    },
    {
      title: 'Blocked',
      dataIndex: 'isBlocked',
      key: 'isBlocked',
      width: isMobile ? 100 : 120,
      align: 'center',
      render: (checked, record, sectionIndex) => (
        <div className="d-flex flex-column align-items-center">
          <Switch
            checked={checked}
            onChange={(checked) =>
              updateSectionField(
                standIndex,
                tierIndex,
                sectionIndex,
                "isBlocked",
                checked
              )
            }
            size={isMobile ? "small" : "default"}
          />
          <span className={`text-white mt-1 ${isMobile ? 'font-size-xs' : 'font-size-sm'}`}>
            {checked ? "Blocked" : "Open"}
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
      title: 'Actions',
      key: 'actions',
      width: isMobile ? 100 : 120,
      align: 'center',
      render: (_, record, sectionIndex) => (
        <div className="d-flex justify-content-center gap-2">
          <Tooltip title="Manage Rows">
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: 'var(--primary-color)' }} />}
              onClick={() =>
                openModal("rows", { standIndex, tierIndex, sectionIndex })
              }
              size={isMobile ? "small" : "middle"}
            />
          </Tooltip>
          <Tooltip title="Remove Section">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                removeSection(standIndex, tierIndex, sectionIndex);
              }}
              size={isMobile ? "small" : "middle"}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="d-flex align-items-center justify-content-between w-100 flex-wrap" style={{ gap: '0.5rem' }}>
          <div className="d-flex align-items-center flex-wrap" style={{ gap: '0.5rem' }}>
            <span className="text-white font-weight-semibold">
              {tier?.name || `Tier ${tierIndex + 1}`} - Sections
            </span>
            <Tag 
              icon={<TeamOutlined />}
              color="success"
              style={{ 
                fontSize: isMobile ? 12 : 14,
                padding: '4px 12px',
                borderRadius: 16,
                fontWeight: 500,
                border: 'none'
              }}
            >
              Capacity: {tier?.capacity ?? 0}
            </Tag>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => addSection(standIndex, tierIndex)}
            size="small"
            className="bg-primary border-0 font-weight-semibold"
            style={{
              borderRadius: 6,
            }}
          >
            {isMobile ? "Add" : "Add Section"}
          </Button>
        </div>
      }
      open={currentModal === "sections"}
      onCancel={closeModal}
      width={isMobile ? "95%" : 900}
      centered
      maskClosable={false}
      footer={[
        <div key="footer" className={`d-flex ${isMobile ? 'flex-column' : 'flex-row'} justify-content-end gap-2 w-100`}>
          <Button 
            key="cancel" 
            onClick={closeModal}
            size={isMobile ? "middle" : "large"}
            className={`font-weight-medium ${isMobile ? 'w-100' : ''}`}
            style={{ 
              minWidth: isMobile ? 'auto' : 120,
            }}
          >
            Close
          </Button>
        </div>
      ]}
      styles={{
        body: {
          maxHeight: 'calc(100vh - 240px)',
          minHeight: isMobile ? '200px' : '300px',
          overflowY: 'auto',
          padding: isMobile ? '12px' : '24px',
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
      className="sections-modal"
    >
      <div className="d-flex flex-column w-100" style={{ gap: '1rem' }}>
        {!tier?.sections || tier.sections.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-3" style={{ fontSize: isMobile ? '3rem' : '4rem' }}>
              🎯
            </div>
            <p className="text-muted mb-0" style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
              No sections created yet. Click "Add Section" to get started!
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table
              columns={columns}
              dataSource={tier.sections || []}
              rowKey={(record, index) => `section-${standIndex}-${tierIndex}-${index}-${record.name || index}`}
              pagination={false}
              bordered
              size={isMobile ? "small" : "middle"}
              scroll={{ x: isMobile ? 700 : undefined }}
              className="sections-table"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SectionsModal;