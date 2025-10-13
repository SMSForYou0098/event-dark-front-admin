import React from "react";
import { Modal, Button, Space } from "antd";

const AdminActionModal = ({ show, onHide, onActionSelect }) => {
  const actions = [
    { id: "verify", label: "Verify Ticket" },
    { id: "shopkeeper", label: "Shop Ticket Verification" },
    { id: "cancel", label: "Cancel Ticket" },
  ];

  const handleActionClick = (actionId) => {
    onActionSelect(actionId);
    onHide();
  };

  return (
    <Modal
      open={show}
      onCancel={onHide}
      footer={null}
      centered
      title="Select Action"
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {actions.map((action) => (
          <Button
            key={action.id}
            type="default"
            block
            onClick={() => handleActionClick(action.id)}
          >
            {action.label}
          </Button>
        ))}
      </Space>
    </Modal>
  );
};

export default AdminActionModal;
