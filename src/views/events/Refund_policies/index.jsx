import React, { useState, useMemo, useEffect } from 'react';
import {
    Button,
    Space,
    Tooltip,
    Modal,
    Form,
    InputNumber,
    Select,
    Switch,
    Tag,
    Popconfirm,
    Row,
    Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import DataTable from '../common/DataTable';
import {
    useGetRefundPolicies,
    useGetEvents,
    useCreateRefundPolicy,
    useUpdateRefundPolicy,
    useDeleteRefundPolicy,
} from './useRefundPolicies';
import { useMyContext } from 'Context/MyContextProvider';
import { PERMISSIONS } from 'constants/PermissionConstant';
import PermissionChecker from 'layouts/PermissionChecker';

const RefundPolicies = () => {
    // ========================= STATE =========================
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const [form] = Form.useForm();
    const { UserData } = useMyContext();

    // ========================= TANSTACK QUERY HOOKS =========================
    const { data: policies = [], isLoading } = useGetRefundPolicies();
    const { data: events = [], isLoading: eventsLoading } = useGetEvents(UserData?.id);


    const createMutation = useCreateRefundPolicy({
        onSuccess: () => handleCloseModal(),
    });

    const updateMutation = useUpdateRefundPolicy({
        onSuccess: () => handleCloseModal(),
    });

    const deleteMutation = useDeleteRefundPolicy();

    // ========================= HANDLERS =========================
    const handleOpenModal = (policy = null) => {
        setEditingPolicy(policy);
        if (policy) {
            form.setFieldsValue({
                event_id: policy.event_id || null,
                days_before_event: policy.days_before_event,
                refund_percentage: policy.refund_percentage,
                processing_fee_percentage: policy.processing_fee_percentage || 0,
                min_processing_fee: policy.min_processing_fee || 0,
                requires_approval: policy.requires_approval || false,
                auto_approve_below: policy.auto_approve_below || 0,
                is_active: policy.is_active !== false,
                priority: policy.priority || 0,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({
                is_active: true,
                requires_approval: false,
                processing_fee_percentage: 0,
                min_processing_fee: 0,
                auto_approve_below: 0,
                priority: 0,
            });
        }
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingPolicy(null);
        form.resetFields();
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (editingPolicy) {
                updateMutation.mutate({ id: editingPolicy.id, data: values });
            } else {
                createMutation.mutate(values);
            }
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleDelete = (id) => {
        deleteMutation.mutate(id);
    };

    // Get event name by ID
    const getEventName = (eventId) => {
        if (!eventId) return 'Global (All Events)';
        const event = events.find((e) => e.value === eventId);
        return event?.label || `Event #${eventId}`;
    };

    // ========================= TABLE COLUMNS =========================
    const columns = useMemo(
        () => [
            {
                title: '#',
                render: (_, __, i) => i + 1,
            },
            {
                title: 'Event',
                dataIndex: ['event', 'name'],
                render: (eventId) => (
                    <Tag color={eventId ? 'blue' : 'default'}>
                        {getEventName(eventId)}
                    </Tag>
                ),
                searchable: true,
            },
            {
                title: 'Days Before',
                dataIndex: 'days_before_event',
                render: (days) => `${days} days`,
                sorter: (a, b) => a.days_before_event - b.days_before_event,
            },
            {
                title: 'Refund %',
                dataIndex: 'refund_percentage',
                render: (percentage) => (
                    <span style={{ color: '#52c41a', fontWeight: 500 }}>
                        {percentage}%
                    </span>
                ),
                sorter: (a, b) => a.refund_percentage - b.refund_percentage,
            },
            {
                title: 'Processing Fee %',
                dataIndex: 'processing_fee_percentage',
                render: (fee) => `${fee || 0}%`,
            },
            {
                title: 'Min Fee',
                dataIndex: 'min_processing_fee',
                render: (fee) => `₹${fee || 0}`,
            },
            {
                title: 'Requires Approval',
                dataIndex: 'requires_approval',
                render: (requires) => (
                    <Tag color={requires ? 'orange' : 'green'}>
                        {requires ? 'Yes' : 'No'}
                    </Tag>
                ),
            },
            {
                title: 'Auto Approve Below',
                dataIndex: 'auto_approve_below',
                render: (amount) => (amount ? `₹${amount}` : '-'),
            },
            {
                title: 'Priority',
                dataIndex: 'priority',
                sorter: (a, b) => (a.priority || 0) - (b.priority || 0),
            },
            {
                title: 'Status',
                dataIndex: 'is_active',
                render: (isActive) => (
                    <Tag color={isActive !== false ? 'success' : 'error'}>
                        {isActive !== false ? 'Active' : 'Inactive'}
                    </Tag>
                ),
            },
            {
                title: 'Action',
                align: 'center',
                fixed: 'right',
                render: (_, record) => (
                    <Space>
                        {/* <Tooltip title="Send Notification">
                            <Button
                                type="primary"
                                size="small"
                                icon={<SendOutlined />}
                                onClick={() => handleOpenModal(record)}
                            />
                        </Tooltip> */}
                        <Tooltip title="Edit">
                            <Button
                                type="primary"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleOpenModal(record)}
                            />
                        </Tooltip>
                        <Tooltip title="Delete">
                            <Popconfirm
                                title="Delete this policy?"
                                description="This action cannot be undone."
                                onConfirm={() => handleDelete(record.id)}
                                okText="Yes"
                                cancelText="No"
                            >
                                <Button
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                />
                            </Popconfirm>
                        </Tooltip>
                    </Space>
                ),
            },
        ],
        [events]
    );

    // ========================= RENDER =========================
    return (
        <PermissionChecker permission={PERMISSIONS.VIEW_REFUND_POLICIES}>
            <DataTable
                title="Refund Policies"
                data={policies}
                columns={columns}
                loading={isLoading || deleteMutation.isPending}
                enableSearch={true}
                showSearch={true}
                emptyText="No refund policies found"
                extraHeaderContent={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => handleOpenModal()}
                    >
                        Add Policy
                    </Button>
                }
            />

            {/* Create/Edit Modal */}
            <Modal
                title={editingPolicy ? 'Edit Refund Policy' : 'Create Refund Policy'}
                open={modalVisible}
                onCancel={handleCloseModal}
                onOk={handleSubmit}
                okText={editingPolicy ? 'Update' : 'Create'}
                confirmLoading={createMutation.isPending || updateMutation.isPending}
                width={800}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    style={{ marginTop: 16 }}
                >
                    {/* Form Fields using array configuration */}
                    {(() => {
                        const formFields = [
                            // Row 1
                            [
                                {
                                    name: 'event_id',
                                    label: 'Event (Leave empty for global policy)',
                                    type: 'select',
                                    col: { xs: 24, md: 12 },
                                    props: {
                                        placeholder: 'Select event (optional)',
                                        allowClear: true,
                                        showSearch: true,
                                        loading: eventsLoading,
                                        options: events,
                                        filterOption: (input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
                                    },
                                },
                                {
                                    name: 'days_before_event',
                                    label: 'Days Before Event',
                                    type: 'number',
                                    col: { xs: 24, md: 12 },
                                    props: { min: 0, placeholder: 'e.g., 7' },
                                },
                            ],
                            // Row 2
                            [
                                {
                                    name: 'refund_percentage',
                                    label: 'Refund Percentage',
                                    type: 'number',
                                    col: { xs: 24, md: 12 },
                                    rules: [{ required: true, message: 'Please enter refund percentage' }],
                                    props: { min: 0, max: 100, placeholder: 'e.g., 80', addonAfter: '%' },
                                },
                                {
                                    name: 'processing_fee_percentage',
                                    label: 'Processing Fee Percentage',
                                    type: 'number',
                                    col: { xs: 24, md: 12 },
                                    rules: [{ required: true, message: 'Please enter processing fee percentage' }],
                                    props: { min: 0, max: 100, placeholder: 'e.g., 80', addonAfter: '%' },
                                },
                                {
                                    name: 'min_processing_fee',
                                    label: 'Minimum Processing Fee',
                                    type: 'number',
                                    col: { xs: 24, md: 12 },
                                    props: { min: 0, placeholder: 'e.g., 50', addonBefore: '₹' },
                                },
                            ],
                            // Row 3
                            [
                                {
                                    name: 'auto_approve_below',
                                    label: 'Auto Approve Below Amount',
                                    type: 'number',
                                    col: { xs: 24, md: 12 },
                                    props: { min: 0, placeholder: 'e.g., 500', addonBefore: '₹' },
                                },
                                {
                                    name: 'priority',
                                    label: 'Priority (Higher = More Important)',
                                    type: 'number',
                                    col: { xs: 24, md: 12 },
                                    props: { min: 0, placeholder: 'e.g., 0' },
                                },
                            ],
                            // Row 4 - Switches
                            [
                                {
                                    name: 'requires_approval',
                                    label: 'Requires Approval',
                                    type: 'switch',
                                    col: { xs: 12, md: 6 },
                                    props: { checkedChildren: 'Yes', unCheckedChildren: 'No' },
                                },
                                {
                                    name: 'is_active',
                                    label: 'Active Status',
                                    type: 'switch',
                                    col: { xs: 12, md: 6 },
                                    props: { checkedChildren: 'Active', unCheckedChildren: 'Inactive' },
                                },
                            ],
                        ];

                        const renderField = (field) => {
                            switch (field.type) {
                                case 'select':
                                    return <Select {...field.props} />;
                                case 'number':
                                    return <InputNumber style={{ width: '100%' }} {...field.props} />;
                                case 'switch':
                                    return <Switch {...field.props} />;
                                default:
                                    return null;
                            }
                        };

                        return formFields.map((row, rowIndex) => (
                            <Row gutter={16} key={rowIndex}>
                                {row.map((field) => (
                                    <Col key={field.name} {...field.col}>
                                        <Form.Item
                                            name={field.name}
                                            label={field.label}
                                            rules={field.rules}
                                            valuePropName={field.type === 'switch' ? 'checked' : 'value'}
                                        >
                                            {renderField(field)}
                                        </Form.Item>
                                    </Col>
                                ))}
                            </Row>
                        ));
                    })()}
                </Form>
            </Modal>
        </PermissionChecker>
    );
};

export default RefundPolicies;
