import React from 'react';
import { Card, Col, Row, Form, Input, Radio } from 'antd';

/**
 * Address Card Component
 * Contains city and pincode fields
 */
const AddressCard = () => {
    return (
        <Card title="Address" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
                <Col xs={24} md={24}>
                    <Form.Item label="Address" name="address">
                        <Input.TextArea rows={2} placeholder="Enter full address" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="City" name="city">
                        <Input placeholder="Enter city" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Pincode" name="pincode">
                        <Input placeholder="Enter pincode" />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    );
};

/**
 * Banking Details Card Component
 * Contains bank name, IFSC, branch, and account number fields
 */
const BankingDetailsCard = () => {
    return (
        <Card title="Banking Details" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Form.Item label="Bank Name" name="bankName">
                        <Input placeholder="Enter bank name" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        label="IFSC Code"
                        name="bankIfsc"
                        rules={[
                            {
                                pattern: /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/,
                                message: 'Please enter a valid IFSC code (e.g., ABCD0123456)'
                            }
                        ]}
                    >
                        <Input placeholder="Enter IFSC code" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Branch Name" name="bankBranch">
                        <Input placeholder="Enter branch name" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Account Number" name="bankNumber">
                        <Input placeholder="Enter account number" />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    );
};

/**
 * Payment Method Card Component
 * Contains payment method radio buttons for POS/Corporate users
 */
const PaymentMethodCard = () => {
    return (
        <Card title="Payment Method" style={{ marginBottom: 16 }}>
            <Form.Item
                name="paymentMethod"
                rules={[{ required: true, message: 'Please select payment method' }]}
            >
                <Radio.Group>
                    <Radio value="Cash">Cash</Radio>
                    <Radio value="UPI">UPI</Radio>
                    <Radio value="Card">Card</Radio>
                </Radio.Group>
            </Form.Item>
        </Card>
    );
};

export { AddressCard, BankingDetailsCard, PaymentMethodCard };
