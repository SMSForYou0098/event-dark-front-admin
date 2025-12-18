import React, { useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import CustomAuthLayout from 'layouts/CustomAuthLayout';
import api from 'auth/FetchInterceptor';

const ResetPassword = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Get token and email from URL params
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    useEffect(() => {
        // Redirect if token or email is missing
        if (!token || !email) {
            message.error('Invalid reset link. Please request a new password reset.');
            navigate('/auth/forgot-password');
        }
    }, [token, email, navigate]);

    // TanStack Query mutation for reset password
    const { mutate: resetPassword, isPending: loading } = useMutation({
        mutationFn: async (values) => {
            const response = await api.post('/reset-password', {
                token,
                email,
                password: values.password,
                password_confirmation: values.confirmPassword,
            });
            return response;
        },
        onSuccess: (response) => {
            message.success(response?.message || 'Password reset successfully!');
            form.resetFields();
            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/auth/login');
            }, 2000);
        },
        onError: (error) => {
            const errorMessage = error?.response?.data?.message ||
                error?.response?.data?.error ||
                'Failed to reset password. Please try again.';
            message.error(errorMessage);
        },
    });

    const onFinish = (values) => {
        resetPassword(values);
    };

    return (
        <CustomAuthLayout
            bottomText="Remembered your password?"
            bottomLink="/auth/login"
            bottomLinkText="Back to login"
        >
            <div>
                <h2>Reset Password</h2>
                <p>Enter your new password</p>
            </div>

            <Form
                form={form}
                layout="vertical"
                name="reset-password"
                onFinish={onFinish}
            >
                <Form.Item
                    name="password"
                    rules={[
                        {
                            required: true,
                            message: 'Please input your new password',
                        },
                        {
                            min: 6,
                            message: 'Password must be at least 6 characters',
                        },
                    ]}
                >
                    <Input.Password
                        placeholder="New Password"
                        prefix={<LockOutlined className="text-primary" />}
                    />
                </Form.Item>

                <Form.Item
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                        {
                            required: true,
                            message: 'Please confirm your password',
                        },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('Passwords do not match!'));
                            },
                        }),
                    ]}
                >
                    <Input.Password
                        placeholder="Confirm Password"
                        prefix={<LockOutlined className="text-primary" />}
                    />
                </Form.Item>

                <Form.Item>
                    <Button
                        loading={loading}
                        type="primary"
                        htmlType="submit"
                        block
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </Form.Item>
            </Form>
        </CustomAuthLayout>
    );
};

export default ResetPassword;
