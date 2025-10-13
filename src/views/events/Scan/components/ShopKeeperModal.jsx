import React, { useState } from "react";
import { Modal, Form, InputNumber, Input, Button, Card, Row, Col, Space, Typography, Tag } from "antd";
import { UserOutlined, WalletOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const ShopKeeperModal = ({ show, onHide, ticketData, handleDebit }) => {
  const [form] = Form.useForm();
  const [amount, setAmount] = useState(null);
  const [remarks, setRemarks] = useState('');
  const predefinedAmounts = [100, 200, 500, 1000];
  const balance = ticketData?.user_balance ?? 0;

  const isAmountValid = amount && amount > 0 && amount <= balance;
  const remainingBalance = balance - (amount || 0);

  const handleSubmit = () => {
    if (!isAmountValid) return;
    handleDebit(Number(amount), remarks);
    setAmount(null);
    setRemarks('');
    form.resetFields();
  };

  const handleAmountChange = (value) => {
    if (value === null || (value >= 0 && value <= balance)) {
      setAmount(value);
    }
  };

  return (
    <Modal
      open={show}
      onCancel={onHide}
      footer={null}
      width={600}
      centered
      title={
        <div className="d-flex align-items-center gap-2">
          <WalletOutlined />
          Wallet Details
        </div>
      }
    >
      {balance <= 0 ? (
        <Card className="text-center">
          <Title level={4} type="danger">Insufficient Balance</Title>
          <Text>Current Balance: ₹{balance}</Text>
          <div className="mt-3">
            <Button icon={<CloseOutlined />} onClick={onHide} danger>
              Close
            </Button>
          </div>
        </Card>
      ) : (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Card>
            {/* User Info */}
            <Row gutter={16} className="mb-3">
              <Col span={12}>
                <Text strong>User:</Text> <Text>{ticketData?.user?.name}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Balance:</Text> <Text>₹{balance}</Text>
                {amount && (
                  <div>
                    <Text type={remainingBalance < 0 ? 'danger' : 'secondary'}>
                      Remaining Balance: ₹{remainingBalance}
                    </Text>
                  </div>
                )}
              </Col>
            </Row>

            {/* Amount Field */}
            <Form.Item
              label="Enter Amount to Debit"
              rules={[
                { required: true, message: 'Amount is required' },
                { type: 'number', min: 1, max: balance, message: `Amount must be 1-${balance}` }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                value={amount}
                onChange={handleAmountChange}
                min={1}
                max={balance}
                placeholder="Enter amount"
                addonBefore="₹"
              />
            </Form.Item>

            {/* Remarks Field */}
            <Form.Item
              label="Purpose / Remarks"
              rules={[{ required: true, message: 'Please enter transaction purpose' }]}
            >
              <Input.TextArea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter purpose of transaction"
              />
            </Form.Item>

            {/* Quick Amount Buttons */}
            <Space wrap className="mb-3">
              <Text strong>Quick Amount:</Text>
              {predefinedAmounts.map((preAmount) => (
                <Button
                  key={preAmount}
                  type={amount === preAmount ? "primary" : "default"}
                  onClick={() => setAmount(preAmount)}
                  disabled={preAmount > balance}
                >
                  ₹{preAmount}
                </Button>
              ))}
            </Space>

            {/* Submit Button */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                disabled={!isAmountValid || !remarks.trim()}
                icon={<CheckOutlined />}
              >
                {isAmountValid ? `Debit ₹${amount}` : 'Enter Valid Amount'}
              </Button>
            </Form.Item>
          </Card>
        </Form>
      )}
    </Modal>
  );
};

export default ShopKeeperModal;
