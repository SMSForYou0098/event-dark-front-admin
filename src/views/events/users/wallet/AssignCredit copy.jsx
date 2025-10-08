import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Form, Select, Switch, Radio, Typography, Divider, Card, Tooltip, Tag, notification, Input, Space, Table } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, WalletOutlined, QrcodeOutlined } from '@ant-design/icons';
import { useMyContext } from '../../../../Context/MyContextProvider';
import axios from 'axios';
import { capitilize } from './Transaction';

const { Option } = Select;

const AssignCredit = ({ id }) => {
  const { UserData, api, authToken, UserList, formatAmountWithCommas, handleWhatsappAlert } = useMyContext();

  // States
  const [currentBalance, setCurrentBalance] = useState(0);
  const [creditAmount, setCreditAmount] = useState('');
  const [previewBalance, setPreviewBalance] = useState(0);
  const [isDeduction, setIsDeduction] = useState(false);
  const [userData, setUserData] = useState({});
  const [resData, setResData] = useState({});
  const [userId, setUserId] = useState(null);
  const [isQRScanEnabled, setIsQRScanEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);

  // Quick amount options
  const quickAmounts = [10000, 50000, 100000, 200000, 500000, 1000000];

  // Safe number formatting function
  const safeFormatAmount = (amount) => {
    if (!amount && amount !== 0) return '0.00';

    try {
      // Convert to number first
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

      // Handle NaN case
      if (isNaN(numAmount)) return '0.00';

      // Use formatAmountWithCommas if available, otherwise use default formatting
      if (formatAmountWithCommas) {
        return formatAmountWithCommas(numAmount.toFixed(2));
      } else {
        return numAmount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
    } catch (error) {
      console.error('Error formatting amount:', error);
      return '0.00';
    }
  };

  // Safe toFixed alternative
  const safeToFixed = (value, decimals = 2) => {
    if (!value && value !== 0) return '0.00';

    try {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num)) return '0.00';

      return num.toFixed(decimals);
    } catch (error) {
      console.error('Error in safeToFixed:', error);
      return '0.00';
    }
  };

  // Fetch user credits
  const UserCredits = async (uid) => {
    if (uid) {
      try {
        const response = await axios.get(`${api}chek-user/${uid}`, {
          headers: { 'Authorization': 'Bearer ' + authToken }
        });

        const balance = response.data.balance;
        setUserData(balance);

        // Set current balance from total_credits
        const totalCredits = balance.total_credits || 0;
        setCurrentBalance(totalCredits);
        setPreviewBalance(totalCredits);
      } catch (error) {
        console.error('Error fetching user credits:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to fetch user credits'
        });
      }
    }
  };

  useEffect(() => {
    if (id) {
      const foundUser = UserList.find(user => user.value === id);
      setUserId(foundUser || null);
    }
  }, [id, UserList]);

  useEffect(() => {
    if (id || userId?.value) {
      UserCredits(id || userId?.value);
    }
  }, [userId, id]);

  // Handle credit input and calculate preview
  const handleCreditChange = (value) => {
    // Allow empty string for clearing the input
    if (value === '' || value === null) {
      setCreditAmount('');
      setPreviewBalance(currentBalance);
      return;
    }

    const numValue = parseFloat(value) || 0;
    setCreditAmount(value); // Store as string to preserve decimal input

    if (isDeduction) {
      // Calculate remaining balance after deduction
      if (numValue > currentBalance) {
        setPreviewBalance(0);
      } else {
        setPreviewBalance(currentBalance - numValue);
      }
    } else {
      // Calculate balance after addition
      setPreviewBalance(currentBalance + numValue);
    }
  };

  // Handle quick amount selection
  const handleQuickAmountSelect = (amount) => {
    setCreditAmount(amount.toString());

    if (isDeduction) {
      if (amount > currentBalance) {
        setPreviewBalance(0);
      } else {
        setPreviewBalance(currentBalance - amount);
      }
    } else {
      setPreviewBalance(currentBalance + amount);
    }
  };

  // Handle manual input change (for Input component)
  const handleManualInputChange = (e) => {
    const value = e.target.value;

    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleCreditChange(value);
    }
  };

  // Handle deduction toggle
  const handleDeductionToggle = (checked) => {
    setIsDeduction(checked);
    // Recalculate preview with new mode
    if (checked) {
      const amount = parseFloat(creditAmount) || 0;
      setPreviewBalance(Math.max(0, currentBalance - amount));
    } else {
      const amount = parseFloat(creditAmount) || 0;
      setPreviewBalance(currentBalance + amount);
    }
  };

  const today = () => {
    const date = new Date();
    return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
  };

  const methods = [
    { id: "cash", label: "Cash" },
    { id: "upi", label: "UPI" },
    { id: "bank", label: "Bank Transfer" },
    { id: "card", label: "Card" }
  ];

  const HandleSendAlerts = async () => {
    const template = isDeduction ? 'Transaction Debit' : 'Transaction Credit';
    const values = {
      name: capitilize(userId?.label || userData?.user?.name),
      credits: parseFloat(creditAmount) || 0,
      ctCredits: previewBalance,
      type: isDeduction ? 'debit' : 'credit'
    };
    await handleWhatsappAlert(userId?.number || userData?.user?.number, values, template);
  };

  const UpdateBalance = async () => {
    const amount = parseFloat(creditAmount) || 0;

    if (!creditAmount || amount <= 0) {
      notification.warning({
        message: 'Invalid Amount',
        description: 'Please enter a valid credit amount'
      });
      return;
    }

    if (isDeduction && amount > currentBalance) {
      notification.error({
        message: 'Insufficient Balance',
        description: 'Deduction amount exceeds current balance'
      });
      return;
    }

    setLoading(true);
    const endpoint = isDeduction ? 'deduct-balance' : 'add-balance';

    try {
      // Prepare payload based on whether it's deduction or addition
      const payload = isDeduction ? {
        user_id: userId?.value ?? id,
        deductAmount: amount,
        payment_method: paymentMethod,
        assign_by: UserData?.id,
        manual_deduction: true
      } : {
        user_id: userId?.value ?? id,
        newCredit: amount,
        payment_method: paymentMethod,
        assign_by: UserData?.id,
        deduction: isDeduction
      };

      const response = await axios.post(`${api}${endpoint}`, payload, {
        headers: { 'Authorization': 'Bearer ' + authToken }
      });

      if (response.data.status) {
        setResData(response.data);

        // Refresh user credits
        await UserCredits(userId?.value || id);

        // Send alerts
        HandleSendAlerts();

        // Reset form
        setCreditAmount('');
        setIsDeduction(false);
        setPaymentMethod('cash');

        notification.success({
          message: 'Success',
          description: response.data.message
        });
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to update balance'
      });
    } finally {
      setLoading(false);
    }
  };

  const numericCreditAmount = parseFloat(creditAmount) || 0;

  const userFields = [
    {
      key: 'name',
      title: (
        <>
          <UserOutlined className="me-2" />
          Name
        </>
      ),
      dataIndex: 'name',
      render: () => userData?.user?.name || 'N/A',
    },
    {
      key: 'email',
      title: (
        <>
          <MailOutlined className="me-2" />
          Email
        </>
      ),
      dataIndex: 'email',
      render: () => userData?.user?.email || 'N/A',
    },
    {
      key: 'number',
      title: (
        <>
          <PhoneOutlined className="me-2" />
          Mobile Number
        </>
      ),
      dataIndex: 'number',
      render: () => userData?.user?.number || 'N/A',
    },
    {
      key: 'balance',
      title: (
        <>
          <WalletOutlined className="me-2" />
          Current Balance
        </>
      ),
      dataIndex: 'balance',
      render: () => (
        <Tag color="green">
          ₹ {safeFormatAmount(currentBalance)}
        </Tag>
      ),
    },
  ];

  // Dummy data for 1 row — AntD Table expects array of objects
  const data = [
    {
      key: 'user-info',
      name: userData?.user?.name,
      email: userData?.user?.email,
      number: userData?.user?.number,
      balance: currentBalance,
    },
  ];


  return (
    <>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="Balance Preview" bordered={false} className="h-100">
            {!id && (
              <>
                <Row align="middle" justify="space-between" className="mb-3">
                  <Col>
                    <Typography.Text strong className="fs-6">Search User: *</Typography.Text>
                  </Col>
                  <Col>
                    <Switch
                      checked={isQRScanEnabled}
                      onChange={setIsQRScanEnabled}
                      checkedChildren={<QrcodeOutlined />}
                      unCheckedChildren="QR Scan"
                    />
                  </Col>
                </Row>
                <Divider className="my-3" />
                {isQRScanEnabled ? (
                  <div className="text-center p-4 border rounded">
                    <Typography.Text type="secondary">QR Scanner Component</Typography.Text>
                  </div>
                ) : (
                  <Form.Item label="User" required className="mb-0">
                    <Select
                      showSearch
                      placeholder="Search by name, mobile or email"
                      value={userId?.value}
                      onChange={val => {
                        const found = UserList.find(u => u.value === val);
                        setUserId(found || null);
                      }}
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={UserList}
                      className="w-100"
                    />
                  </Form.Item>
                )}
              </>
            )}
            <Divider className="my-4" />
            <div className="text-center p-4 border rounded bg-light">
              <Typography.Text type="secondary" className="fs-12 text-uppercase fw-medium">
                Preview Balance
              </Typography.Text>
              <Typography.Title
                level={2}
                className="mb-0 mt-2 fw-bolder"
                style={{
                  fontFamily: "'Roboto Mono', monospace, sans-serif",
                  color: isDeduction ? '#cf1322' : '#389e0d'
                }}
              >
                ₹ {safeFormatAmount(previewBalance)}
              </Typography.Title>
              <Typography.Text type="secondary" className="fs-14 mt-2 d-block">
                {today()}
              </Typography.Text>

              {/* Transaction summary */}
              {creditAmount && parseFloat(creditAmount) > 0 && (
                <div className="mt-3">
                  <Tag
                    color={isDeduction ? 'red' : 'green'}
                    className="fs-12 fw-medium px-3 py-1"
                  >
                    {isDeduction ? '➖ Deduction: ' : '➕ Addition: '}
                    ₹{safeFormatAmount(creditAmount)}
                  </Tag>
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card bordered={false} className="h-100">
            <Row align="middle" justify="space-between" className="mb-3">
              <Col>
                <Typography.Text strong className="fs-6">Enter Credits</Typography.Text>
              </Col>
              <Col>
                <Tag color="blue" className="fs-12">
                  {userData?.user?.name || userId?.label || 'N/A'}
                </Tag>
              </Col>
            </Row>
            <Divider className="my-3" />

            <Form layout="vertical">
              <Form.Item
                label="Credit Amount"
                required
                className="mb-4"
                help={isDeduction && numericCreditAmount > currentBalance ? 'Amount exceeds current balance' : ''}
                validateStatus={isDeduction && numericCreditAmount > currentBalance ? 'error' : ''}
              >
                <Input
                  value={creditAmount}
                  onChange={handleManualInputChange}
                  placeholder="0.00"
                  className="w-100 text-center"
                  style={{ fontSize: '16px', height: '40px' }}
                  type="text"
                  inputMode="decimal"
                />

                {/* Quick Amount Selection */}
                <div className="mt-3 text-center">
                  <Typography.Text type="secondary" className="fs-12 d-block mb-2">
                    Quick Select:
                  </Typography.Text>
                  <Radio.Group
                    value={creditAmount}
                    onChange={(e) => handleQuickAmountSelect(parseFloat(e.target.value))}
                    buttonStyle="solid"
                    size="small"
                  >
                    <Row gutter={[8, 8]} justify="center">
                      {quickAmounts.map(amount => (
                        <Col key={amount}>
                          <Radio.Button value={amount.toString()} className="fs-12">
                            ₹{safeFormatAmount(amount)}
                          </Radio.Button>
                        </Col>
                      ))}
                    </Row>
                  </Radio.Group>
                </div>
              </Form.Item>

              <Form.Item className="mb-4">
                <div className="d-flex align-items-center">
                  <Switch
                    checked={isDeduction}
                    onChange={handleDeductionToggle}
                    checkedChildren="Deduction"
                    unCheckedChildren="Add"
                  />
                  <Tooltip title="Toggle to deduct credits instead of adding">
                    <span className="ms-2 fs-14">
                      {isDeduction ? 'Deduction Mode' : 'Addition Mode'}
                    </span>
                  </Tooltip>
                </div>
              </Form.Item>

              <Form.Item label="Payment Method" required className="mb-4">
                <Radio.Group
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <Space wrap>
                    {methods.map(({ id, label }) => (
                      <Radio key={id} value={id} className="fs-14">
                        {label}
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </Form.Item>

              <Button
                type="primary"
                block
                onClick={UpdateBalance}
                loading={loading}
                disabled={
                  (!id && !userId?.value) ||
                  !creditAmount ||
                  numericCreditAmount <= 0 ||
                  (isDeduction && numericCreditAmount > currentBalance)
                }
                className="mt-3"
                size="large"
              >
                {isDeduction ? 'Deduct Credits' : 'Add Credits'}
              </Button>
            </Form>

            {isDeduction && numericCreditAmount > currentBalance && (
              <div className="mt-3 p-3 border rounded bg-danger bg-opacity-10">
                <Typography.Text type="danger" className="fs-14">
                  Deduction amount (₹{safeFormatAmount(numericCreditAmount)}) exceeds current balance (₹{safeFormatAmount(currentBalance)})
                </Typography.Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {userData?.user && (
        <Card title="User Details" className="mt-4 shadow-sm">
          <Table
            columns={userFields}
            dataSource={data}
            pagination={false}
          />
        </Card>
      )}

    </>
  );
};

export default AssignCredit;