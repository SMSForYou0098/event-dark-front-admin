import React, { useEffect, useState, useMemo } from 'react';
import {
    Row,
    Col,
    Card,
    Select,
    InputNumber,
    Button,
    Radio,
    Switch,
    Typography,
    Statistic,
    Divider,
    Empty,
    message,
    Space,
    Badge,
    Input
} from 'antd';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    WalletOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from 'auth/FetchInterceptor';
import CountUp from 'react-countup';
import { useMyContext } from 'Context/MyContextProvider';
import { capitilize } from '../users/wallet/Transaction';
import QRScanner from '../Scan/QRScanner';
import { IndianRupee } from 'lucide-react';

const { Text, Title } = Typography;

const AgentCredit = ({ id }) => {
    const { UserData, api, successAlert, authToken, UserList, handleWhatsappAlert } = useMyContext();
    const queryClient = useQueryClient();

    // States
    const [selectedUserId, setSelectedUserId] = useState(id || null);
    const [creditAmount, setCreditAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [isQRScanEnabled, setIsQRScanEnabled] = useState(false);
    const [searchValue, setSearchValue] = useState('');

    // Get today's date
    const today = useMemo(() => {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }, []);

    // Payment methods
    const paymentMethods = [
        { value: 'cash', label: 'Cash' },
        { value: 'upi', label: 'UPI' },
        { value: 'bank', label: 'Bank Transfer' },
        { value: 'card', label: 'Card' }
    ];

    // Transform UserList to options
    const userOptions = useMemo(() => {
        if (!UserList) return [];
        return UserList.map((user) => ({
            value: user.value,
            label: user.label,
            email: user.email,
            number: user.number,
        }));
    }, [UserList]);

    // Filter options based on search
    const filterOption = (input, option) => {
        if (!input) return true;
        const searchLower = input.toLowerCase();
        const label = option?.label?.toLowerCase() || '';
        const email = option?.email?.toLowerCase() || '';
        const number = option?.number?.toString().toLowerCase() || '';

        return (
            label.includes(searchLower) ||
            email.includes(searchLower) ||
            number.includes(searchLower)
        );
    };

    const filteredOptions = useMemo(() => {
        if (!searchValue || searchValue.length === 0) return [];
        return userOptions.filter((option) => filterOption(searchValue, option));
    }, [userOptions, searchValue]);

    // Fetch user credits
    const {
        data: userBalance,
        isLoading: balanceLoading
    } = useQuery({
        queryKey: ['userBalance', selectedUserId],
        queryFn: async () => {
            if (!selectedUserId) return null;
            const response = await apiClient.get(`chek-user/${selectedUserId}`);
            return response.balance;
        },
        enabled: !!selectedUserId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    // Get selected user details
    const selectedUser = useMemo(() => {
        return userOptions.find(user => user.value === selectedUserId);
    }, [userOptions, selectedUserId]);

    // Calculate new balance
    const calculatedBalance = useMemo(() => {
        const currentBalance = userBalance?.latest_balance || 0;
        return creditAmount ? parseFloat(currentBalance) + parseFloat(creditAmount) : currentBalance;
    }, [userBalance, creditAmount]);

    // Send WhatsApp alert
    const sendWhatsAppAlert = async () => {
        const template = 'Transaction Credit';
        const values = {
            name: capitilize(selectedUser?.label),
            credits: creditAmount,
            ctCredits: calculatedBalance,
        };
        await handleWhatsappAlert(selectedUser?.number, values, template);
    };

    // Update balance mutation
    const updateBalanceMutation = useMutation({
        mutationFn: async () => {
            return await apiClient.post(
                `add-balance`,
                {
                    amount: calculatedBalance,
                    assign_by: UserData?.id,
                    user_id: selectedUserId,
                    newCredit: creditAmount,
                    deduction: false,
                    payment_method: paymentMethod,
                }
            );
        },
        onSuccess: (response) => {
            if (response.status) {
                queryClient.invalidateQueries({ queryKey: ['userBalance', selectedUserId] });
                sendWhatsAppAlert();
                successAlert('Success', response.message);
                setCreditAmount(0);
            }
        },
        onError: (error) => {
            message.error(error.response?.data?.message || 'Failed to update balance');
        },
    });

    const handleSubmit = () => {
        if (!selectedUserId || !creditAmount || creditAmount <= 0) {
            message.warning('Please select a user and enter valid credit amount');
            return;
        }
        updateBalanceMutation.mutate();
    };

    const handleQRData = (data) => {
        // console.log('QR Code scanned:', data);
    };

    // Set user ID from prop
    useEffect(() => {
        if (id) {
            setSelectedUserId(id);
        }
    }, [id]);

    return (
        <>
            <Row gutter={[16, 16]}>
                {/* Left Column - User Selection & Balance */}
                <Col xs={24} lg={12}>
                    <Card title="Search User: *" extra={
                        <Space>
                            <Text>QR Scan</Text>
                            <Switch
                                checked={isQRScanEnabled}
                                onChange={setIsQRScanEnabled}
                            />
                        </Space>
                    }>
                        {!id && (
                            <>
                                {isQRScanEnabled ? (
                                    <QRScanner
                                        onScan={handleQRData}
                                        scanMode={isQRScanEnabled}
                                        styles={{ height: '400px' }}
                                    />
                                ) : (
                                    <>
                                        <Select
                                            showSearch
                                            size="large"
                                            className="w-100 mb-2"
                                            placeholder="Search by name, email, or mobile number"
                                            options={filteredOptions}
                                            onSearch={setSearchValue}
                                            onChange={setSelectedUserId}
                                            value={selectedUserId}
                                            filterOption={false}
                                            notFoundContent={
                                                searchValue ? (
                                                    <Empty
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        description="No user found"
                                                    />
                                                ) : (
                                                    <div className="text-center text-muted p-3">
                                                        Start typing to search users
                                                    </div>
                                                )
                                            }
                                            allowClear
                                        />
                                        <Text type="secondary" className="d-block">
                                            User can search via name, mobile number or email
                                        </Text>
                                    </>
                                )}
                            </>
                        )}

                        <div className="mt-4">
                            <Statistic
                                title={today}
                                value={userBalance?.total_credits || 0}
                                precision={2}
                                prefix="₹"
                                valueStyle={{ fontSize: '2rem' }}
                                formatter={(value) => (
                                    <CountUp
                                        start={0}
                                        end={parseFloat(value) + parseFloat(creditAmount || 0)}
                                        duration={1}
                                        separator=","
                                        decimals={2}
                                    />
                                )}
                            />
                        </div>
                    </Card>
                </Col>

                {/* Right Column - Credit Input & Payment Method */}
                <Col xs={24} lg={12}>
                    <Card title="Enter Credits" extra={
                        userBalance?.name && (
                            <Badge
                                count={userBalance.name}
                                style={{ backgroundColor: '#1890ff' }}
                            />
                        )
                    }>
                        <Input
                            type='number'
                            size="large"
                            className="w-100 mb-3"
                            placeholder="Enter credit amount"
                            min={0}
                            precision={2}
                            disabled={!selectedUserId}
                            value={creditAmount}
                            onChange={(e) => {
                                let value = e.target.value
                                if (value > 500000) {
                                    message.warning('Maximum credit amount is ₹5,00,000');
                                    setCreditAmount(500000);
                                } else {
                                    setCreditAmount(value || 0);
                                }
                            }}
                            prefix={<IndianRupee size={16} />}
                        />

                        <div className="mb-3">
                            <Text strong className="d-block mb-3">Select Payment Method:</Text>
                            <Radio.Group options={paymentMethods} onChange={(e) => setPaymentMethod(e.target.value)} value={paymentMethod} />
                        </div>

                        <Button
                            type="primary"
                            size="large"
                            className="w-100 mt-2 border-0"
                            onClick={handleSubmit}
                            loading={updateBalanceMutation.isPending}
                            disabled={!selectedUserId || !creditAmount || creditAmount <= 0}
                        >
                            Submit
                        </Button>
                    </Card>

                </Col>
            </Row>

            {/* User Details Section */}
            {userBalance?.user && (
                <Row gutter={[16, 16]} className="mt-4">
                    <Col xs={24}>
                        <Title level={5} className="text-center mb-3">
                            User Detail
                        </Title>
                        <Divider className="mt-0 mb-3" />
                    </Col>

                    <Col xs={12} md={6}>
                        <Card size="small" className="h-100">
                            <Space direction="vertical" size={0}>
                                <Space size="small">
                                    <UserOutlined />
                                    <Text type="secondary">Name</Text>
                                </Space>
                                <Text strong>{userBalance?.user?.name || 'N/A'}</Text>
                            </Space>
                        </Card>
                    </Col>

                    <Col xs={12} md={6}>
                        <Card size="small" className="h-100">
                            <Space direction="vertical" size={0}>
                                <Space size="small">
                                    <MailOutlined />
                                    <Text type="secondary">Email</Text>
                                </Space>
                                <Text strong className="text-truncate d-block">
                                    {userBalance?.user?.email || 'N/A'}
                                </Text>
                            </Space>
                        </Card>
                    </Col>

                    <Col xs={12} md={6}>
                        <Card size="small" className="h-100">
                            <Space direction="vertical" size={0}>
                                <Space size="small">
                                    <PhoneOutlined />
                                    <Text type="secondary">Mobile Number</Text>
                                </Space>
                                <Text strong>{userBalance?.user?.number || 'N/A'}</Text>
                            </Space>
                        </Card>
                    </Col>

                    <Col xs={12} md={6}>
                        <Card size="small" className="h-100">
                            <Space direction="vertical" size={0}>
                                <Space size="small">
                                    <WalletOutlined />
                                    <Text type="secondary">Current Balance</Text>
                                </Space>
                                <Text strong type="success">
                                    ₹ {userBalance?.total_credits?.toLocaleString() || '0'}
                                </Text>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            )}
        </>
    );
};

export default AgentCredit;