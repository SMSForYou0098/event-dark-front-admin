import React, { useEffect, useCallback } from 'react';
import { Card, Row, Col, Form, Input, Select, Radio, Button, Space, Spin, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Comission from './Comission';
import { useMyContext } from 'Context/MyContextProvider';
import Utils from 'utils';

const Tax = () => {
    const { api, UserData, authToken } = useMyContext();
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    const taxTypeOptions = [
        { value: 'Inclusive', label: 'Inclusive' },
        { value: 'Exclusive', label: 'Exclusive' },
    ];

    const rateOptions = [
        { value: 'Fixed', label: 'Fixed' },
        { value: 'Percentage', label: 'Percentage' },
    ];

    // Fetch tax data
    const { data: taxData, isLoading } = useQuery({
        queryKey: ['tax', 1],
        queryFn: async () => {
            const response = await axios.get(`${api}taxes/${UserData?.id}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            return response.data?.taxes;
        },
        enabled: !!authToken,
        onSuccess: (data) => {
            // Populate form with fetched data
            form.setFieldsValue({
                tax_title: data?.tax_title,
                rate_type: data?.rate_type,
                rate: data?.rate,
                tax_type: data?.tax_type,
                status: data?.status,
            });
        },
        onError: (error) => {
            message.error(Utils.getErrorMessage(error));
        },
    });

    // Store/Update tax mutation
    const storeTaxMutation = useMutation({
        mutationFn: async (values) => {
            return await axios.post(
                `${api}taxes`,
                {
                    tax_title: values.tax_title,
                    rate_type: values.rate_type,
                    rate: values.rate,
                    tax_type: values.tax_type,
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
            message.success('Tax stored successfully');
            queryClient.invalidateQueries(['tax', 1]);
        },
        onError: (error) => {
            message.error(Utils.getErrorMessage(error));
        },
    });

    const onFinish = useCallback((values) => {
        storeTaxMutation.mutate(values);
    }, [storeTaxMutation]);

    // Set initial values when data is loaded
    useEffect(() => {
        if (taxData) {
            form.setFieldsValue({
                tax_title: taxData.tax_title,
                rate_type: taxData.rate_type,
                rate: taxData.rate,
                tax_type: taxData.tax_type,
                status: taxData.status,
            });
        }
    }, [taxData, form]);

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
                <Card title="Tax Configuration">
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
                                        label="Tax Title"
                                        name="tax_title"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Please enter tax title',
                                            },
                                        ]}
                                    >
                                        <Input placeholder="Enter tax title" />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} lg={12}>
                                    <Form.Item
                                        label="Rate Type"
                                        name="rate_type"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Please select rate type',
                                            },
                                        ]}
                                    >
                                        <Select
                                            options={rateOptions}
                                            placeholder="Select rate type"
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} lg={12}>
                                    <Form.Item
                                        label="Rate"
                                        name="rate"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Please enter rate',
                                            },
                                            {
                                                pattern: /^\d+(\.\d+)?$/,
                                                message: 'Please enter a valid number',
                                            },
                                        ]}
                                    >
                                        <Input
                                            type="number"
                                            placeholder="Enter rate"
                                            min={0}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} lg={12}>
                                    <Form.Item
                                        label="Tax Type"
                                        name="tax_type"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Please select tax type',
                                            },
                                        ]}
                                    >
                                        <Select
                                            options={taxTypeOptions}
                                            placeholder="Select tax type"
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
                                                    loading={storeTaxMutation.isLoading}
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
            </Col>

            <Col xs={24} lg={12}>
                <Comission />
            </Col>
        </Row>
    );
};

export default Tax;