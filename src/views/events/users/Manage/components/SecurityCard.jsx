import React from 'react';
import { Card, Col, Row, Form, Input, Switch, Space, Alert } from 'antd';
import { Key } from 'lucide-react';
import PermissionChecker from 'layouts/PermissionChecker';
import { useNavigate } from 'react-router-dom';
import FormActionButtons from './FormActionButtons';

/**
 * Security Card Component
 * Contains password fields and user status/authentication settings
 */
const SecurityCard = ({
    mode,
    isSubmitting,
}) => {
    const navigate = useNavigate();

    return (
        <PermissionChecker role={['Admin', 'Organizer']}>
            <Card
                title="Status & Security"
                extra={
                    <PermissionChecker permission={["Edit User", "Edit Profile"]}>
                        <FormActionButtons
                            mode={mode}
                            isSubmitting={isSubmitting}
                            onDiscard={() => navigate(-1)}
                        />
                    </PermissionChecker>
                }
            >
                <Row gutter={[16, 16]}>
                    {/* Password Fields */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[
                                { required: mode === 'create', message: 'Please enter password' },
                                ...(mode === 'create' ? [{ min: 8, message: 'Min 8 characters' }] : [])
                            ]}
                        >
                            <Input.Password
                                prefix={<Key className="text-primary" size={16} />}
                                placeholder="Enter password"
                            />
                        </Form.Item>
                    </Col>
                    {mode === 'create' && (
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Confirm Password"
                                name="repeatPassword"
                                dependencies={['password']}
                                rules={[
                                    { required: true, message: 'Please confirm password' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Passwords do not match'));
                                        }
                                    })
                                ]}
                            >
                                <Input.Password placeholder="Re-enter password" />
                            </Form.Item>
                        </Col>
                    )}
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="User Status"
                            name="status"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Space size="large">
                            <Form.Item
                                label="Authentication"
                                name="authentication"
                                valuePropName="checked"
                            >
                                <Switch
                                    checkedChildren="Password"
                                    unCheckedChildren="OTP"
                                />
                            </Form.Item>
                            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) =>
                                prevValues.authentication !== currentValues.authentication
                            }>
                                {({ getFieldValue }) => {
                                    const isPasswordAuth = getFieldValue('authentication');
                                    return (
                                        <Alert
                                            type="info"
                                            message={
                                                isPasswordAuth
                                                    ? "Password login is currently active"
                                                    : "OTP (One-Time Password) login is currently active"
                                            }
                                            showIcon
                                        />
                                    );
                                }}
                            </Form.Item>
                        </Space>
                    </Col>
                </Row>
            </Card>
        </PermissionChecker>
    );
};

export default SecurityCard;
