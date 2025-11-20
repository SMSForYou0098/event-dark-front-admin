import React, { useMemo, useEffect, useState } from 'react';
import { Modal, Button, Badge, Tag, Table, Input, Switch, Space, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, CloseOutlined, TeamOutlined, TagsOutlined } from '@ant-design/icons';

const RowsModal = ({
  currentModal,
  closeModal,
  isMobile,
  currentIndices,
  standsWithCapacity,
  addRow,
  updateRow,
  removeRow,
  openTicketAssignModal,
  selectedEvent,
}) => {
  const { standIndex, tierIndex, sectionIndex } = currentIndices || {};
  const [localRows, setLocalRows] = useState([]);
  
  // Get live section data directly without useMemo caching issues
  const section = standsWithCapacity?.[standIndex]?.tiers?.[tierIndex]?.sections?.[sectionIndex];

  // Update local rows whenever section data changes
  useEffect(() => {
    if (section?.rows) {
      setLocalRows([...section.rows]);
    } else {
      setLocalRows([]);
    }
  }, [section, section?.rows, section?.rows?.length]);

  // If no section data, don't render the modal
  if (!section) return null;

  const handleUpdateRow = (standIdx, tierIdx, sectionIdx, rowIdx, field, value) => {
    updateRow(standIdx, tierIdx, sectionIdx, rowIdx, field, value);
    // Force immediate local update for UI responsiveness
    setLocalRows(prev => {
      const newRows = [...prev];
      if (newRows[rowIdx]) {
        newRows[rowIdx] = { ...newRows[rowIdx], [field]: value };
      }
      return newRows;
    });
  };

  const handleRemoveRow = (standIdx, tierIdx, sectionIdx, rowIdx) => {
    removeRow(standIdx, tierIdx, sectionIdx, rowIdx);
    // Force immediate local update
    setLocalRows(prev => prev.filter((_, idx) => idx !== rowIdx));
  };

  const handleAddRow = (standIdx, tierIdx, sectionIdx) => {
    addRow(standIdx, tierIdx, sectionIdx);
    // The useEffect will catch the update from standsWithCapacity
  };

  const columns = [
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
      width: isMobile ? 100 : 150,
      render: (text, record, rowIndex) => (
        <Input
          placeholder="Row Label"
          value={text}
          onChange={(e) =>
            handleUpdateRow(
              standIndex,
              tierIndex,
              sectionIndex,
              rowIndex,
              "label",
              e.target.value
            )
          }
          size={isMobile ? "small" : "middle"}
          className="w-100"
        />
      ),
    },
    {
      title: 'Seats',
      dataIndex: 'seats',
      key: 'seats',
      width: isMobile ? 80 : 120,
      render: (text, record, rowIndex) => (
        <Input
          type="number"
          placeholder="Seats"
          value={text}
          min={1}
          onChange={(e) =>
            handleUpdateRow(
              standIndex,
              tierIndex,
              sectionIndex,
              rowIndex,
              "seats",
              e.target.value
            )
          }
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
      render: (text, record, rowIndex) => (
        <Input
          type="number"
          placeholder="Price"
          value={text}
          min={0}
          onChange={(e) =>
            handleUpdateRow(
              standIndex,
              tierIndex,
              sectionIndex,
              rowIndex,
              "price",
              e.target.value
            )
          }
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
      render: (checked, record, rowIndex) => (
        <div className="d-flex flex-column align-items-center">
          <Switch
            checked={checked}
            onChange={(checked) =>
              handleUpdateRow(
                standIndex,
                tierIndex,
                sectionIndex,
                rowIndex,
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
      title: 'Actions',
      key: 'actions',
      width: isMobile ? 100 : 140,
      align: 'center',
      render: (_, record, rowIndex) => (
        <div className="d-flex justify-content-center gap-2 flex-wrap">
          <Tooltip title="Assign Ticket">
            <Button
              type="text"
              icon={<TagsOutlined style={{ color: 'var(--success-color)' }} />}
              onClick={() => openTicketAssignModal?.('row', record, { standIndex, tierIndex, sectionIndex, rowIndex })}
              size={isMobile ? "small" : "middle"}
              disabled={!selectedEvent}
            />
          </Tooltip>
          <Tooltip title="Remove Row">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveRow(standIndex, tierIndex, sectionIndex, rowIndex)}
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
              {section?.name || `Section ${sectionIndex + 1}`} - Rows
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
              Total: {section?.capacity ?? 0} seats
            </Tag>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleAddRow(standIndex, tierIndex, sectionIndex)}
            size="small"
            className="border-0 font-weight-semibold"
          >
            {isMobile ? "Add" : "Add Row"}
          </Button>
        </div>
      }
      closable={false}
      open={currentModal === "rows"}
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
      className="rows-modal"
    >
      <div className="d-flex flex-column w-100">
        {!localRows || localRows.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-3" style={{ fontSize: isMobile ? '3rem' : '4rem' }}>
              🚫
            </div>
            <p className="text-muted mb-0" style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
              No rows created yet. Click "Add Row" to get started!
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table
              columns={columns}
              dataSource={localRows}
              rowKey={(record, index) => `row-${standIndex}-${tierIndex}-${sectionIndex}-${index}-${record.label || index}`}
              pagination={false}
              size={isMobile ? "small" : "middle"}
              scroll={{ x: isMobile ? 600 : undefined }}
              className="rows-table"
              style={{ fontSize: isMobile ? '0.92rem' : '1rem' }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RowsModal;