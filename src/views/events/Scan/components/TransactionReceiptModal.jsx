import React from "react";
import { Modal, Button, Row, Col, Divider } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const TransactionReceiptModal = ({ open, onClose, data }) => {
  const isSuccess = data?.status === "success";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={400}
      className="text-center"
    >
      <div className="d-flex flex-column align-items-center justify-content-center">
        {isSuccess ? (
          <CheckCircleOutlined style={{ fontSize: 60, color: "#52c41a" }} />
        ) : (
          <CloseCircleOutlined style={{ fontSize: 60, color: "#ff4d4f" }} />
        )}

        <h4 className="mt-3 mb-0">
          {isSuccess ? "Payment Successful" : "Payment Failed"}
        </h4>
        <p className="text-muted mb-4">
          {isSuccess
            ? "Your transaction has been completed successfully."
            : "Something went wrong during the transaction."}
        </p>

        <Divider />

        <Row gutter={[0, 8]} className="text-start w-100 px-3">
          <Col span={12}>
            <strong>Transaction ID:</strong>
          </Col>
          <Col span={12} className="text-end">
            {data?.transaction_id || "-"}
          </Col>

          <Col span={12}>
            <strong>Amount:</strong>
          </Col>
          <Col span={12} className="text-end">
            ₹{data?.amount || "0.00"}
          </Col>

          <Col span={12}>
            <strong>Date:</strong>
          </Col>
          <Col span={12} className="text-end">
            {data?.date || "-"}
          </Col>
        </Row>

        <Divider />

        <Button
          type="primary"
          block
          size="large"
          className="mt-2"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default TransactionReceiptModal;
