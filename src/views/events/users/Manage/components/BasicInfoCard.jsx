import React from 'react';
import { Card, Col, Row, Form, Input, Switch, Tag } from 'antd';
import { CircleCheckBig, CircleX, ScrollText } from 'lucide-react';
import PermissionChecker from 'layouts/PermissionChecker';
import Flex from 'components/shared-components/Flex';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import FormActionButtons from './FormActionButtons';

/**
 * Basic Information Card Component
 * Contains name, email, phone, and organization fields
 */
const BasicInfoCard = ({
    formState,
    mode,
    userRole,
    isSubmitting,
    editOtherUser,
}) => {
    const navigate = useNavigate();

    return (
        <Card
            title="Basic Information"
            extra={
                <Flex justifyContent="end" alignItems="center" gap="middle">
                    {formState?.email_verified_at ? (
                        <Tag
                            color="success"
                            className="btn btn-secondary d-inline-flex align-items-center gap-2"
                        >
                            <CircleCheckBig size={14} />
                            Email Verified
                        </Tag>
                    ) : (
                        <Tag
                            color="error"
                            className="btn btn-secondary d-inline-flex align-items-center gap-2"
                        >
                            <CircleX size={14} />
                            Email Not Verified
                        </Tag>
                    )}
                    {editOtherUser && (
                        <PermissionChecker permission={["Edit User", "Edit Profile"]}>
                            <FormActionButtons
                                mode={mode}
                                isSubmitting={isSubmitting}
                                onDiscard={() => navigate(-1)}
                            />
                        </PermissionChecker>
                    )}

                    {formState.agreement && (
                        <PermissionChecker role={["Admin", "Organizer"]}>
                            <Button
                                type="default"
                                onClick={() => navigate(`/agreement/preview/${formState.agreement}`)}
                                className="btn btn-secondary d-inline-flex align-items-center gap-2"
                                icon={<ScrollText size={16} />}
                            >
                                View Agreement
                            </Button>
                        </PermissionChecker>
                    )}
                </Flex>
            }
        >
            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[{ required: true, message: 'Please enter name' }]}
                    >
                        <Input placeholder="Enter name" />
                    </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                    <Form.Item
                        label="Mobile Number"
                        name="number"
                        rules={[
                            { required: true, message: 'Please enter mobile number' },
                            { pattern: /^\d{10,12}$/, message: 'Must be 10-12 digits' }
                        ]}
                    >
                        <Input placeholder="Enter mobile number" disabled={mode === 'edit' && userRole !== 'Admin'} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Please enter email' },
                            { type: 'email', message: 'Please enter valid email' }
                        ]}
                    >
                        <Input placeholder="Enter email" />
                    </Form.Item>
                </Col>

                {/* Verified Email Checkbox - Only for Admin creating Organizer */}
                {mode === 'create' && userRole === 'Admin' && formState.roleName === 'Organizer' && (
                    <Col xs={24} md={8}>
                        <Form.Item
                            label="Email Verification Required"
                            name="verifiedEmail"
                            valuePropName="checked"
                        >
                            <Switch
                                checkedChildren="Yes"
                                unCheckedChildren="No"
                            />
                        </Form.Item>
                    </Col>
                )}
            </Row>
        </Card>
    );
};

export default BasicInfoCard;
