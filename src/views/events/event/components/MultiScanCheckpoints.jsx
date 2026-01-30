// MultiScanCheckpoints.jsx
import React from 'react';
import { Form, Input, TimePicker, Button, Card, Row, Col, Space, Typography, Divider, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, SortAscendingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;
const FMT_T = 'HH:mm';

/**
 * MultiScanCheckpoints Component
 * Renders a dynamic form for managing checkpoint entries with time validations.
 * 
 * Props:
 * - form: Ant Design form instance
 */
const MultiScanCheckpoints = ({ form }) => {
    // Parse time string to dayjs object
    const parseTime = (timeStr) => {
        if (!timeStr) return null;
        if (typeof timeStr === 'object' && timeStr.format) return timeStr;
        return dayjs(timeStr, FMT_T, true).isValid() ? dayjs(timeStr, FMT_T) : null;
    };

    // Convert time to minutes for comparison
    const timeToMinutes = (time) => {
        const t = parseTime(time);
        if (!t) return null;
        return t.hour() * 60 + t.minute();
    };

    // Sort checkpoints by start_time
    const sortCheckpointsByTime = () => {
        const checkpoints = form.getFieldValue('checkpoints') || [];

        // Filter out checkpoints without start_time (put them at the end)
        const withTime = checkpoints.filter(cp => cp?.start_time);
        const withoutTime = checkpoints.filter(cp => !cp?.start_time);

        // Sort by start_time
        withTime.sort((a, b) => {
            const aMinutes = timeToMinutes(a.start_time);
            const bMinutes = timeToMinutes(b.start_time);
            if (aMinutes === null) return 1;
            if (bMinutes === null) return -1;
            return aMinutes - bMinutes;
        });

        // Combine sorted with those without time
        const sorted = [...withTime, ...withoutTime];

        // Update form with sorted checkpoints
        form.setFieldsValue({ checkpoints: sorted });

        // Revalidate after sorting
        setTimeout(revalidateAll, 100);
    };

    // Validate that end_time > start_time for the same checkpoint
    const validateEndTimeAfterStart = (index) => ({
        validator: (_, value) => {
            const checkpoints = form.getFieldValue('checkpoints') || [];
            const startTime = checkpoints[index]?.start_time;

            if (!value || !startTime) return Promise.resolve();

            const startMinutes = timeToMinutes(startTime);
            const endMinutes = timeToMinutes(value);

            if (startMinutes !== null && endMinutes !== null && endMinutes <= startMinutes) {
                return Promise.reject(new Error('End time must be after start time'));
            }
            return Promise.resolve();
        }
    });

    // Validate no overlapping time ranges
    const validateNoOverlap = (index, isStart = true) => ({
        validator: (_, value) => {
            if (!value) return Promise.resolve();

            const checkpoints = form.getFieldValue('checkpoints') || [];
            const currentCheckpoint = checkpoints[index];

            if (!currentCheckpoint?.start_time || !currentCheckpoint?.end_time) {
                return Promise.resolve();
            }

            const currentStart = timeToMinutes(currentCheckpoint.start_time);
            const currentEnd = timeToMinutes(currentCheckpoint.end_time);

            if (currentStart === null || currentEnd === null) return Promise.resolve();

            for (let i = 0; i < checkpoints.length; i++) {
                if (i === index) continue;

                const otherStart = timeToMinutes(checkpoints[i]?.start_time);
                const otherEnd = timeToMinutes(checkpoints[i]?.end_time);

                if (otherStart === null || otherEnd === null) continue;

                // Check for overlap
                if (currentStart < otherEnd && currentEnd > otherStart) {
                    return Promise.reject(new Error('Time range overlaps with another checkpoint'));
                }
            }
            return Promise.resolve();
        }
    });

    // Validate unique labels
    const validateUniqueLabel = (index) => ({
        validator: (_, value) => {
            if (!value) return Promise.resolve();

            const checkpoints = form.getFieldValue('checkpoints') || [];
            const labels = checkpoints.map((cp, i) => (i !== index ? cp?.label?.toLowerCase()?.trim() : null));

            if (labels.includes(value.toLowerCase().trim())) {
                return Promise.reject(new Error('Label must be unique'));
            }
            return Promise.resolve();
        }
    });

    // Re-validate all checkpoints when one changes
    const revalidateAll = () => {
        const checkpoints = form.getFieldValue('checkpoints') || [];
        const fields = [];

        checkpoints.forEach((_, index) => {
            fields.push(['checkpoints', index, 'start_time']);
            fields.push(['checkpoints', index, 'end_time']);
            fields.push(['checkpoints', index, 'label']);
        });

        // Delay to ensure form values are updated
        setTimeout(() => {
            form.validateFields(fields).catch(() => { });
        }, 100);
    };

    return (
        <Card size="small" title="Checkpoint Configuration" style={{ marginTop: 16 }}
            extra={
                <Tooltip title="Sort checkpoints by start time">
                    <Button
                        type="text"
                        icon={<SortAscendingOutlined />}
                        onClick={sortCheckpointsByTime}
                        size="small"
                    >
                        Sort by Time
                    </Button>
                </Tooltip>
            }
        >
            <Form.List
                name="checkpoints"
                initialValue={[{ label: 'Entry', start_time: null, end_time: null }]}
                rules={[
                    {
                        validator: async (_, checkpoints) => {
                            if (!checkpoints || checkpoints.length < 1) {
                                return Promise.reject(new Error('At least 1 checkpoint is required'));
                            }
                        },
                    },
                ]}
            >
                {(fields, { add, remove }, { errors }) => (
                    <>
                        {fields.map(({ key, name, ...restField }, index) => (
                            <div key={key}>
                                {index > 0 && <Divider style={{ margin: '12px 0' }} />}
                                <Row gutter={16} align="top">
                                    {/* Hidden field to preserve id for updates */}
                                    <Form.Item name={[name, 'id']} hidden>
                                        <Input type="hidden" />
                                    </Form.Item>

                                    <Col xs={24} sm={8}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'label']}
                                            label={index === 0 ? 'Checkpoint Label' : undefined}
                                            rules={[
                                                { required: true, message: 'Label is required' },
                                                { max: 50, message: 'Label must be 50 characters or less' },
                                                validateUniqueLabel(index),
                                            ]}
                                        >
                                            <Input placeholder={`Checkpoint ${index + 1} (e.g., Entry, Lunch)`} />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={12} sm={6}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'start_time']}
                                            label={index === 0 ? 'Start Time' : undefined}
                                            rules={[
                                                { required: true, message: 'Start time required' },
                                                validateNoOverlap(index, true),
                                            ]}
                                            getValueProps={(value) => ({
                                                value: parseTime(value),
                                            })}
                                            getValueFromEvent={(val) => (val ? val.format(FMT_T) : null)}
                                        >
                                            <TimePicker
                                                format={FMT_T}
                                                style={{ width: '100%' }}
                                                placeholder="Start"
                                                onChange={revalidateAll}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={12} sm={6}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'end_time']}
                                            label={index === 0 ? 'End Time' : undefined}
                                            rules={[
                                                { required: true, message: 'End time required' },
                                                validateEndTimeAfterStart(index),
                                                validateNoOverlap(index, false),
                                            ]}
                                            getValueProps={(value) => ({
                                                value: parseTime(value),
                                            })}
                                            getValueFromEvent={(val) => (val ? val.format(FMT_T) : null)}
                                        >
                                            <TimePicker
                                                format={FMT_T}
                                                style={{ width: '100%' }}
                                                placeholder="End"
                                                onChange={revalidateAll}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} sm={4} style={{ display: 'flex', alignItems: 'center', paddingTop: index === 0 ? 30 : 0 }}>
                                        {fields.length > 1 && (
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => {
                                                    remove(name);
                                                    setTimeout(revalidateAll, 50);
                                                }}
                                            />
                                        )}
                                    </Col>
                                </Row>
                            </div>
                        ))}

                        <Form.ErrorList errors={errors} />

                        <Button
                            type="dashed"
                            onClick={() => add({ label: '', start_time: null, end_time: null })}
                            block
                            icon={<PlusOutlined />}
                            style={{ marginTop: 16 }}
                        >
                            Add Checkpoint
                        </Button>

                        <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                            Add checkpoints in any order, then click "Sort by Time" to arrange them chronologically.
                        </Text>
                    </>
                )}
            </Form.List>
        </Card>
    );
};

export default MultiScanCheckpoints;
