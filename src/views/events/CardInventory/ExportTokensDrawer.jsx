import React from "react";
import { Drawer, Form, Select, InputNumber, Button, Typography, Divider, Row, Col } from "antd";
import { ExportOutlined } from "@ant-design/icons";

const { Text } = Typography;

const ExportTokensDrawer = ({
    open,
    onClose,
    selectedEventId,
    loading = false,
    onExport,
}) => {
    const [form] = Form.useForm();
    const type = Form.useWatch("type", form);
    const rangeMode = Form.useWatch("range_mode", form);

    const handleSubmit = () => {
        form.validateFields().then((values) => {
            const payload = {};
            if (values.type != null && values.type !== undefined) payload.type = values.type;
            if (values.range_mode === "custom_range") {
                if (values.range_start != null && values.range_start !== undefined) payload.range_start = values.range_start;
                if (values.range_end != null && values.range_end !== undefined) payload.range_end = values.range_end;
            }
            if (values.type === "unassigned") {
                payload.status = "all";
            } else if (values.status != null && values.status !== undefined) {
                payload.status = values.status;
            }
            onExport(payload);
        });
    };

    const handleClose = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Drawer
            title="Export Tokens"
            placement="right"
            width={420}
            onClose={handleClose}
            open={open}
            styles={{
                body: { padding: "24px 24px 0" },
                footer: { padding: "16px 24px" },
            }}
            footer={
                <Row gutter={8}>
                    <Col xs={12} sm={12}>
                        <Button block onClick={handleClose}>Cancel</Button>
                    </Col>
                    <Col xs={12} sm={12}>
                        <Button
                            block
                            type="primary"
                            icon={<ExportOutlined />}
                            loading={loading}
                            onClick={handleSubmit}
                            disabled={!selectedEventId}
                        >
                            {loading ? "Exporting…" : "Export"}
                        </Button>
                    </Col>
                </Row>
            }
        >
            {!selectedEventId ? (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "12px 16px",
                        background: "var(--ant-color-warning-bg)",
                        border: "1px solid var(--ant-color-warning-border)",
                        borderRadius: 8,
                        color: "var(--ant-color-warning-text)",
                    }}
                >
                    Please select an event first.
                </div>
            ) : (
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        type: undefined,
                        range_mode: "all",
                        range_start: undefined,
                        range_end: undefined,
                        status: undefined,
                    }}
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                    {/* Type */}
                    <Form.Item
                        name="type"
                        label="Type"
                        style={{ marginBottom: 20 }}
                    >
                        <Select
                            placeholder="All types"
                            allowClear
                            onChange={(v) => {
                                if (v === "unassigned") form.setFieldValue("status", "all");
                            }}
                            options={[
                                { value: "all", label: "All" },
                                { value: "assigned", label: "Assigned" },
                                { value: "unassigned", label: "Unassigned" },
                            ]}
                        />
                    </Form.Item>

                    {/* Status — only for assigned */}
                    {type !== "unassigned" && (
                        <Form.Item
                            name="status"
                            label="Status"
                            style={{ marginBottom: 20 }}
                        >
                            <Select
                                placeholder="All statuses"
                                allowClear
                                options={[
                                    { value: "claimed", label: "Claimed" },
                                    { value: "available", label: "Available" },
                                    { value: "all", label: "All" },
                                ]}
                            />
                        </Form.Item>
                    )}

                    <Divider style={{ margin: "4px 0 16px" }} />

                    {/* Range mode: All | Custom range */}
                    <Form.Item
                        name="range_mode"
                        label="Range"
                        style={{ marginBottom: 20 }}
                    >
                        <Select
                            placeholder="Select range"
                            options={[
                                { value: "all", label: "All" },
                                { value: "custom_range", label: "Custom range" },
                            ]}
                        />
                    </Form.Item>

                    {/* Range inputs — only when Custom range */}
                    {rangeMode === "custom_range" && (
                    <>
                    <div style={{ marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 14 }}>Custom range</Text>
                    </div>

                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <Form.Item
                            name="range_start"
                            label="Start"
                            help="Min: 1"
                            style={{ flex: 1, marginBottom: 0 }}
                        >
                            <InputNumber
                                placeholder="e.g. 1"
                                min={1}
                                style={{ width: "100%" }}
                            />
                        </Form.Item>

                        <div style={{ paddingTop: 30, color: "var(--ant-color-text-tertiary)", fontWeight: 600 }}>
                            –
                        </div>

                        <Form.Item
                            name="range_end"
                            label="End"
                            dependencies={["range_start"]}
                            rules={[
                                {
                                    validator(_, value) {
                                        if (value == null || value === "") return Promise.resolve();
                                        const start = form.getFieldValue("range_start");
                                        if (start != null && value < start) {
                                            return Promise.reject(new Error("Must be ≥ start"));
                                        }
                                        return Promise.resolve();
                                    },
                                },
                            ]}
                            help="Must be ≥ start"
                            style={{ flex: 1, marginBottom: 0 }}
                        >
                            <InputNumber
                                placeholder="e.g. 100"
                                min={1}
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                    </div>
                    </>
                    )}
                </Form>
            )}
        </Drawer>
    );
};

export default ExportTokensDrawer;