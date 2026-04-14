import React from 'react';
import { Card, Col, Row, Form, Input, Radio } from 'antd';
import { VALIDATION_RULES } from 'constants/ValidationConstants';

/**
 * Address Card Component
 * Contains city and pincode fields
 */
const AddressCard = () => {
    return (
        <Card title="Address" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
                <Col xs={24} md={24}>
                    <Form.Item label="Address" name="address" rules={VALIDATION_RULES.ADDRESS}>
                        <Input.TextArea rows={2} placeholder="Enter full address" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="City" name="city" rules={VALIDATION_RULES.CITY}
                        getValueFromEvent={(e) => e.target.value.replace(/[^A-Za-z\s-]/g, '')
                        }>
                        <Input placeholder="Enter city" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        label="Pincode"
                        name="pincode"
                        rules={VALIDATION_RULES.PINCODE}
                        getValueFromEvent={(e) => e.target.value.replace(/\D/g, '').slice(0, 6)}
                    >
                        <Input placeholder="Enter pincode" maxLength={6} />
                    </Form.Item>
                </Col>
            </Row>
        </Card >
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
                    <Form.Item label="Bank Name" name="bankName" rules={VALIDATION_RULES.BANK_NAME}>
                        <Input placeholder="Enter bank name" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        label="IFSC Code"
                        name="bankIfsc"
                        rules={VALIDATION_RULES.IFSC}
                        getValueFromEvent={(e) => e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11)}
                    >
                        <Input placeholder="Enter IFSC code" maxLength={11} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        label="Branch Name"
                        name="bankBranch"
                        rules={[
                            ...(VALIDATION_RULES.BANK_BRANCH || []),
                            {
                                validator: (_, value) => {
                                    if (value && /[^A-Za-z0-9\s]{2,}/.test(value)) {
                                        return Promise.reject(new Error('Consecutive special characters are not allowed'));
                                    }
                                    return Promise.resolve();
                                }
                            }
                        ]}
                    >
                        <Input placeholder="Enter branch name" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        label="Account Number"
                        name="bankNumber"
                        rules={[
                            { pattern: /^\d{9,18}$/, message: 'Please enter a valid account number (9-18 digits)' }
                        ]}
                        getValueFromEvent={(e) => e.target.value.replace(/\D/g, '').slice(0, 18)}
                    >
                        <Input placeholder="Enter account number" maxLength={18} />
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
