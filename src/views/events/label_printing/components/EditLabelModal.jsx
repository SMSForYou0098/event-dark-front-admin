import React from "react";
import { Modal, Form, Input, Button, Row, Col } from "antd";
import { Edit2 } from "lucide-react";

/**
 * Edit Label Modal
 * Two-column layout matching API field names
 */
const EditLabelModal = ({
    open,
    onCancel,
    onOk,
    form,
    isLoading,
}) => {
    return (
        <Modal
            title={
                <span className="d-flex align-items-center gap-2">
                    <Edit2 size={16} />
                    Edit Label
                </span>
            }
            open={open}
            onCancel={onCancel}
            width={600}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={isLoading}
                    onClick={() => form.submit()}
                >
                    Save Changes
                </Button>,
            ]}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onOk}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="name"
                            label="First Name"
                            rules={[{ required: true, message: 'First name is required' }]}
                        >
                            <Input placeholder="First Name" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="surname"
                            label="Surname"
                        >
                            <Input placeholder="Surname" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="number"
                            label="Mobile Number"
                        >
                            <Input placeholder="Mobile Number" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="designation"
                            label="Designation"
                        >
                            <Input placeholder="Designation" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="company_name"
                            label="Company Name"
                        >
                            <Input placeholder="Company Name" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="stall_number"
                            label="Stall Number"
                        >
                            <Input placeholder="Stall Number" />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default EditLabelModal;
