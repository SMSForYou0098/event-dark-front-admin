import React, { useEffect, useCallback } from 'react';
import { Card, Row, Col, Form, Input, Select, Radio, Button, Space, Spin, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useMyContext } from 'Context/MyContextProvider';
import Utils from 'utils';
const Commission = () => {
    const { api, UserData, authToken } = useMyContext();
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    const commissionOptions = [
        { value: 'Fixed', label: 'Fixed' },
        { value: 'Percentage', label: 'Percentage' },
    ];

    // Fetch commission data
    const { data: commissionData, isLoading } = useQuery({
        queryKey: ['commission', 1],
        queryFn: async () => {
            const response = await axios.get(`${api}commissions/${UserData.id}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            return response.data?.commission;
        },
        enabled: !!authToken,
        onSuccess: (data) => {
            // Populate form with fetched data
            form.setFieldsValue({
                commission_type: data?.commission_type,
                commission_rate: data?.commission_rate,
                status: data?.status,
            });
        },
        onError: (error) => {
            message.error(Utils.getErrorMessage(error));
        },
    });

    // Store/Update commission mutation
    const storeCommissionMutation = useMutation({
        mutationFn: async (values) => {
            return await axios.post(
                `${api}commissions-store`,
                {
                    commission_type: values.commission_type,
                    commission_rate: values.commission_rate,
                    status: values.status,
                    user_id: UserData?.id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );
        },
        onSuccess: () => {
            message.success('Commission stored successfully');
            queryClient.invalidateQueries(['commission', 1]);
        },
        onError: (error) => {
            message.error(Utils.getErrorMessage(error));
        },
    });

    const onFinish = useCallback((values) => {
        storeCommissionMutation.mutate(values);
    }, [storeCommissionMutation]);

    // Set initial values when data is loaded
    useEffect(() => {
        if (commissionData) {
            form.setFieldsValue({
                commission_type: commissionData.commission_type,
                commission_rate: commissionData.commission_rate,
                status: commissionData.status,
            });
        }
    }, [commissionData, form]);

    return (
        <Card title="Commission Configuration">
            <Spin spinning={isLoading}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        status: '1',
                    }}
                >
                    <Row gutter={16}>
                        <Col xs={24} lg={12}>
                            <Form.Item
                                label="Commission Type"
                                name="commission_type"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please select commission type',
                                    },
                                ]}
                            >
                                <Select
                                    options={commissionOptions}
                                    placeholder="Select commission type"
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Form.Item
                                label="Commission Rate"
                                name="commission_rate"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please enter commission rate',
                                    },
                                    {
                                        pattern: /^\d+(\.\d+)?$/,
                                        message: 'Please enter a valid number',
                                    },
                                ]}
                            >
                                <Input
                                    type="number"
                                    placeholder="Enter commission rate"
                                    min={0}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24}>
                            <Form.Item
                                label="Status"
                                name="status"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please select status',
                                    },
                                ]}
                            >
                                <Radio.Group>
                                    <Radio value="1">Enable</Radio>
                                    <Radio value="0">Disable</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>

                        <Col xs={24}>
                            <Form.Item className="mb-0">
                                <div className="d-flex justify-content-end">
                                    <Space>
                                        <Button
                                            onClick={() => form.resetFields()}
                                        >
                                            Reset
                                        </Button>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={storeCommissionMutation.isLoading}
                                        >
                                            Submit
                                        </Button>
                                    </Space>
                                </div>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Spin>
        </Card>
    );
};

export default Commission;