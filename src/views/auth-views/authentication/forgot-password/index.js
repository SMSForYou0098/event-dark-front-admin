import React, { useState } from 'react'
import { Card, Row, Col, Form, Input, Button, message } from "antd";
import { MailOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import CustomAuthLayout from 'layouts/CustomAuthLayout';

const backgroundStyle = {
	backgroundImage: 'url(/img/others/img-17.jpg)',
	backgroundRepeat: 'no-repeat',
	backgroundSize: 'cover'
}

const ForgotPassword = () => {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);

	const theme = useSelector(state => state.theme.currentTheme)

	const onSend = values => {
		setLoading(true)
		setTimeout(() => {
			setLoading(false)
			message.success('New password has send to your email!');
		}, 1500);
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

