import React from "react";
import { Modal, Table, Input, Button, Badge, Tag, Switch, Tooltip } from "antd";
import { PlusOutlined, DeleteOutlined, AppstoreOutlined, TeamOutlined, TagsOutlined } from "@ant-design/icons";

const TiersModal = ({
  show,
  isMobile,
  stand,
  standIndex,
  onClose,
  addTier,
  updateTierField,
  removeTier,
  openModal,
  openTicketAssignModal,
  selectedEvent,
}) => {
  const columns = [
    {
      title: 'Tier Name',
      dataIndex: 'name',
      key: 'name',
      width: isMobile ? 120 : 200,
      render: (text, record, tierIndex) => (
        <Input
          value={text}
          onChange={(e) =>
            updateTierField(standIndex, tierIndex, "name", e.target.value)
          }
          placeholder="Tier Name"
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
      render: (text, record, tierIndex) => (
        <Input
          type="number"
          value={text}
          min={0}
          onChange={(e) =>
            updateTierField(standIndex, tierIndex, "price", e.target.value)
          }
          placeholder="Price"
          required
          size={isMobile ? "small" : "middle"}
          className="w-100"
          disabled
          style={{ cursor: 'not-allowed', opacity: 0.6 }}
        />
      ),
    },
    {
      title: 'Blocked',
      dataIndex: 'isBlocked',
      key: 'isBlocked',
      width: isMobile ? 100 : 120,
      align: 'center',
      render: (checked, record, tierIndex) => (
        <div className="d-flex flex-column align-items-center">
          <Switch
            checked={checked}
            onChange={(checked) =>
              updateTierField(standIndex, tierIndex, "isBlocked", checked)
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
      width: isMobile ? 140 : 180,
      align: 'center',
      render: (_, record, tierIndex) => (
        <div className="d-flex justify-content-center gap-2 flex-wrap">
          <Tooltip title="Manage Sections">
            <Button
              type="text"
              icon={<AppstoreOutlined style={{ color: 'var(--primary-color)' }} />}
              onClick={() => openModal("sections", { standIndex, tierIndex })}
              size={isMobile ? "small" : "middle"}
            />
          </Tooltip>
          <Tooltip title="Assign Ticket">
            <Button
              type="text"
              icon={<TagsOutlined style={{ color: 'var(--success-color)' }} />}
              onClick={() => openTicketAssignModal?.('tier', record, { standIndex, tierIndex })}
              size={isMobile ? "small" : "middle"}
              disabled={!selectedEvent}
            />
          </Tooltip>
          <Tooltip title="Remove Tier">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                removeTier(standIndex, tierIndex);
                if (stand.tiers.length === 1) onClose();
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
              {stand?.name || `Stand ${standIndex + 1}`} - Tiers
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
              Capacity: {stand?.capacity ?? 0}
            </Tag>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => addTier(standIndex)}
            size="small"
            className="border-0 font-weight-semibold"
            style={{
              borderRadius: 6,
            }}
          >
            {isMobile ? "Add" : "Add Tier"}
          </Button>
        </div>
      }
      open={show}
      onCancel={onClose}
      width={isMobile ? "95%" : 900}
      centered
      closable={false}
      maskClosable={false}
      footer={[
        <div key="footer" className={`d-flex ${isMobile ? 'flex-column' : 'flex-row'} justify-content-end gap-2 w-100`}>
          <Button 
            key="cancel" 
            onClick={onClose}
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
      className="tiers-modal"
    >
      <div className="d-flex flex-column w-100" style={{ gap: '1rem' }}>
        {!stand?.tiers || stand.tiers.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-3" style={{ fontSize: isMobile ? '3rem' : '4rem' }}>
              📊
            </div>
            <p className="text-muted mb-0" style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
              No tiers created yet. Click "Add Tier" to get started!
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table
              columns={columns}
              dataSource={stand?.tiers}
              rowKey={(record, index) => `tier-${standIndex}-${index}-${record.name || index}`}
              pagination={false}
              size={isMobile ? "small" : "middle"}
              scroll={{ x: isMobile ? 700 : undefined }}
              className="tiers-table"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TiersModal;