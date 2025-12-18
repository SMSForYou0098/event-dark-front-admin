import React from 'react'
import { Card, Row, Col, Form, Input, Button, message } from "antd";
import { MailOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import CustomAuthLayout from 'layouts/CustomAuthLayout';
import api from 'auth/FetchInterceptor';

const backgroundStyle = {
	backgroundImage: 'url(/img/others/img-17.jpg)',
	backgroundRepeat: 'no-repeat',
	backgroundSize: 'cover'
}

const ForgotPassword = () => {
	const [form] = Form.useForm();

	const theme = useSelector(state => state.theme.currentTheme)

	// TanStack Query mutation for forgot password
	const { mutate: sendResetLink, isPending: loading } = useMutation({
		mutationFn: async (values) => {
			const response = await api.post('/forgot-password', values);
			return response;
		},
		onSuccess: (response) => {
			message.success(response?.message || 'Password reset link has been sent to your email!');
			form.resetFields();
		},
		onError: (error) => {
			const errorMessage = error?.response?.data?.message ||
				error?.response?.data?.error ||
				'Failed to send reset link. Please try again.';
			message.error(errorMessage);
		},
	});

	const onSend = (values) => {
		sendResetLink(values);
	};

	return (
		<CustomAuthLayout
			bottomText="Remembered the password ?"
			bottomLink="/auth/login"
			bottomLinkText="Back to login"
		>
			<Form form={form} layout="vertical" name="forget-password" onFinish={onSend}>
				<Form.Item
					name="email"
					rules={
						[
							{
								required: true,
								message: 'Please input your email address'
							},
							{
								type: 'email',
								message: 'Please enter a validate email!'
							}
						]
					}>
					<Input placeholder="Email Address" prefix={<MailOutlined className="text-primary" />} />
				</Form.Item>
				<Form.Item>
					<Button loading={loading} type="primary" htmlType="submit" block>{loading ? 'Sending' : 'Send'}</Button>
				</Form.Item>
			</Form>
		</CustomAuthLayout>
	)
}

export default ForgotPassword
