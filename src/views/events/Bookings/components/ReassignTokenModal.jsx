import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from "auth/FetchInterceptor";

const ReassignTokenModal = ({ bookingId, visible, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (values) => {
            const payload = {
                booking_id: bookingId,
                reason: values.reason
            };
            const response = await apiClient.post('dispatch/reassign-token', payload);
            return response;
        },
        onSuccess: (data) => {
            if (data?.status || data?.success) {
                message.success('Token reassigned successfully');
                form.resetFields();
                if (onSuccess) onSuccess();
                // Invalidate query to refresh data
                queryClient.invalidateQueries(['user-bookings']);
                onClose();
            } else {
                message.error(data?.message || 'Failed to reassign token');
            }
        },
        onError: (error) => {
            message.error(error?.message || 'An error occurred');
        }
    });

    const handleOk = () => {
        form.validateFields().then(values => {
            mutation.mutate(values);
        }).catch(info => {
            console.log('Validate Failed:', info);
        });
    };

    return (
        <Modal
            title="Reassign Token"
            open={visible}
            onCancel={onClose}
            onOk={handleOk}
            confirmLoading={mutation.isPending}
            okText="Reassign"
        >
            <Form
                form={form}
                layout="vertical"
                name="reassign_token_form"
            >
                <Form.Item
                    name="reason"
                    label="Reason for Reassignment"
                    rules={[{ required: true, message: 'Please provide a reason!' }]}
                >
                    <Input.TextArea rows={4} placeholder="Enter reason..." />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ReassignTokenModal;
