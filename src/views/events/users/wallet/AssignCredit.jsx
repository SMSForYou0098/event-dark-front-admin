import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Button, Form, Select, Switch, Radio, Typography, Divider, Card, Tooltip, Tag, notification, Input, Space, Table } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, WalletOutlined, QrcodeOutlined } from '@ant-design/icons';
import { useMyContext } from '../../../../Context/MyContextProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from 'auth/FetchInterceptor';
import { capitilize } from './Transaction';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import Flex from 'components/shared-components/Flex';

const { Option } = Select;

const AssignCredit = ({ id }) => {
  const { UserData, UserList, formatAmountWithCommas } = useMyContext();
  const queryClient = useQueryClient();

  // States
  const [creditAmount, setCreditAmount] = useState('');
  const [previewBalance, setPreviewBalance] = useState(0);
  const [isDeduction, setIsDeduction] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isQRScanEnabled, setIsQRScanEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Quick amount options
  const quickAmounts = [10000, 50000, 100000, 200000, 500000, 1000000];

  // Computed user ID for queries
  const activeUserId = useMemo(() => id || userId?.value, [id, userId]);

  // Fetch user credits using TanStack Query
  const {
    data: userBalance,
    isLoading: balanceLoading,
    refetch: refetchBalance
  } = useQuery({
    queryKey: ['userCredits', activeUserId],
    queryFn: async () => {
      if (!activeUserId) return null;
      const response = await apiClient.get(`chek-user/${activeUserId}`);
      return response.balance;
    },
    enabled: !!activeUserId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Derived current balance
  const currentBalance = useMemo(() => {
    return userBalance?.total_credits || 0;
  }, [userBalance]);

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

  // Set userId from id prop
  useEffect(() => {
    if (id) {
      const foundUser = UserList.find(user => user.value === id);
      setUserId(foundUser || null);
    }
  }, [id, UserList]);

  // Update preview balance when currentBalance changes
  useEffect(() => {
    if (currentBalance !== undefined) {
      setPreviewBalance(currentBalance);
    }
  }, [currentBalance]);

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
      name: capitilize(userId?.label || userBalance?.user?.name),
      credits: parseFloat(creditAmount) || 0,
      ctCredits: previewBalance,
      type: isDeduction ? 'debit' : 'credit'
    };
    // await handleWhatsappAlert(userId?.number || userBalance?.user?.number, values, template);
  };

  // Update balance mutation
  const updateBalanceMutation = useMutation({
    mutationFn: async ({ isDeduct, amount }) => {
      const endpoint = isDeduct ? 'deduct-balance' : 'add-balance';
      const payload = isDeduct ? {
        user_id: activeUserId,
        deductAmount: amount,
        payment_method: paymentMethod,
        assign_by: UserData?.id,
        manual_deduction: true
      } : {
        user_id: activeUserId,
        newCredit: amount,
        payment_method: paymentMethod,
        assign_by: UserData?.id,
        deduction: isDeduct
      };

      return await apiClient.post(endpoint, payload);
    },
    onSuccess: (response) => {
      if (response.status) {
        // Invalidate and refetch user credits
        queryClient.invalidateQueries({ queryKey: ['userCredits', activeUserId] });

        // Send alerts
        HandleSendAlerts();

        // Reset form
        setCreditAmount('');
        setIsDeduction(false);
        setPaymentMethod('cash');

        notification.success({
          message: 'Success',
          description: response.message
        });
      }
    },
    onError: (error) => {
      console.error('Error updating balance:', error);
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to update balance'
      });
    },
  });

  const UpdateBalance = () => {
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

    updateBalanceMutation.mutate({ isDeduct: isDeduction, amount });
  };

  const numericCreditAmount = parseFloat(creditAmount) || 0;

  const userFields = [
    {
      key: 'name',
      title: (
        <Flex alignItem="center" gap="5px">
          <UserOutlined className="me-2" />
          Name
        </Flex>
      ),
      dataIndex: 'name',
      render: () => userBalance?.user?.name || 'N/A',
    },
    {
      key: 'email',
      title: (
        <Flex alignItem="center" gap="5px">
          <MailOutlined className="me-2" />
          Email
        </Flex>
      ),
      dataIndex: 'email',
      render: () => userBalance?.user?.email || 'N/A',
    },
    {
      key: 'number',
      title: (
        <Flex alignItem="center" gap="5px">
          <PhoneOutlined className="me-2" />
          Mobile Number
        </Flex>
      ),
      dataIndex: 'number',
      render: () => userBalance?.user?.number || 'N/A',
    },
    {
      key: 'balance',
      title: (
        <Flex alignItem="center" gap="5px">
          <WalletOutlined className="me-2" />
          Current Balance
        </Flex>
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
      name: userBalance?.user?.name,
      email: userBalance?.user?.email,
      number: userBalance?.user?.number,
      balance: currentBalance,
    },
  ];


  return (
    <>
      <Row gutter={ROW_GUTTER}>
        <Col xs={24} md={12}>
          <Card title="Enter Credits" extra={
            <Row align="middle" justify="space-between">
              <Col>
                <Typography.Text strong className="fs-6">Total Credits <Tag color='red'>₹{safeFormatAmount(previewBalance)}</Tag></Typography.Text>
              </Col>
              <Col>
                <Tag color="blue" className="fs-12">
                  {userBalance?.user?.name || userId?.label || 'N/A'}
                </Tag>
              </Col>
            </Row>
          } bordered={false} className="h-100">
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

              <Form.Item >
                <Space>
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
                </Space>
              </Form.Item>

              <Form.Item label="Payment Method" required>
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
                loading={updateBalanceMutation.isPending}
                disabled={
                  (!id && !userId?.value) ||
                  !creditAmount ||
                  numericCreditAmount <= 0 ||
                  (isDeduction && numericCreditAmount > currentBalance)
                }
                className="mt-3 border-0"
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
        <Col xs={24} md={12}>
          {userBalance?.user && (
            <Card title="User Details" bordered={false}>
              <Table
                columns={userFields}
                dataSource={data}
                pagination={false}
                loading={balanceLoading}
              />
            </Card>
          )}
        </Col>
      </Row>



    </>
  );
};

export default AssignCredit;