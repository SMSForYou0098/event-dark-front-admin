import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { LockOutlined, MailOutlined, UserOutlined, PhoneOutlined, HomeOutlined, BankOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Button, Form, Input, Alert, Typography, Row, Col } from "antd";
import { signUp, showAuthMessage, showLoading, hideAuthMessage } from '../../../store/slices/authSlice';
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from "framer-motion"
import axios from 'axios';
import { API_BASE_URL, AUTH_PREFIX_PATH } from 'configs/AppConfig';

const { Text } = Typography;

const rules = {
	name: [
		{
			required: true,
			message: 'Please input your full name'
		},
		{
			min: 3,
			message: 'Name must be at least 3 characters'
		},
		{
			pattern: /^[A-Za-z ]+$/,
			message: 'Name can only contain letters and spaces'
		}
	],
	number: [
		{
			required: true,
			message: 'Please input your phone number'
		},
		{
			pattern: /^(?:\d{10}|\d{12})$/,
			message: 'Please enter either 10 or 12 digit phone number'
		}
	],
	email: [
		{
			required: true,
			message: 'Please input your email address'
		},
		{
			type: 'email',
			message: 'Please enter a valid email!'
		}
	],
	company: [
		{
			required: true,
			message: 'Please input your company name'
		},
		{
			min: 2,
			message: 'Company name must be at least 2 characters'
		}
	],
	city: [
		{
			required: true,
			message: 'Please input your city'
		},
		{
			min: 2,
			message: 'City name must be at least 2 characters'
		},
		{
			pattern: /^[A-Za-z ]+$/,
			message: 'City can only contain letters and spaces'
		}
	]
}

export const RegisterForm = (props) => {

	const { token, loading, redirect, message, showMessage, hideAuthMessage, allowRedirect = true } = props
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const location = useLocation();
	const data = location?.state?.data;

	const [error, setError] = useState('');
	const [formLoading, setFormLoading] = useState(false);

	useEffect(() => {
		if (data) {
			const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
			const isEmail = emailRegex.test(data);
			const isPhone = /^\d{10}$/.test(data) || /^\d{12}$/.test(data);

			if (isEmail) {
				form.setFieldsValue({ email: data });
			} else if (isPhone) {
				form.setFieldsValue({ number: data });
			} else {
				setError('Please enter a valid email or phone number.');
			}
		}
	}, [data, form]);

	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => {
				setError('');
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [error]);

	useEffect(() => {
		if (token !== null && allowRedirect) {
			navigate(redirect)
		}
		if (showMessage) {
			const timer = setTimeout(() => hideAuthMessage(), 3000)
			return () => {
				clearTimeout(timer);
			};
		}
	}, [token, allowRedirect, navigate, redirect, showMessage, hideAuthMessage]);

	const handleLogin = async (phoneNumber) => {
		if (!phoneNumber) {
			setError('Please enter your email or mobile number.');
			return;
		}
		try {
			setFormLoading(true);
			const response = await axios.post(`${API_BASE_URL}verify-user`, { data: phoneNumber });
			if (response.data.status) {
				const isPassReq = response.data?.pass_req;
				const path = '/';

				if (isPassReq === true) {
					const session_id = response.data.session_id;
					const auth_session = response.data.auth_session;
					const info = {
						data: phoneNumber,
						password_required: isPassReq,
						session_id,
						auth_session
					};
					navigate(`${AUTH_PREFIX_PATH}/verify-password`, { state: { info } });
				} else {
					navigate(`${AUTH_PREFIX_PATH}/two-factor`, { state: { data: phoneNumber, path } });
				}
				setFormLoading(false);
			} else {
				setFormLoading(false);
			}
		} catch (err) {
			setError(err.response?.data?.message || err.response?.data?.error || 'Something went wrong');
			setFormLoading(false);
		}
	};

	const handleSignup = async (values) => {
		try {
			setFormLoading(true);
			const formData = {
				email: values.email,
				number: values.number,
				name: values.name,
				company: values.company,
				city: values.city,
				password: values.number, // Using phone number as password
				role_id: 4
			};

			const response = await axios.post(`${API_BASE_URL}create-user`, formData);

			if (response.data.status) {
				const phoneNumber = response.data.user?.number;
				handleLogin(phoneNumber);
			}
			setFormLoading(false);
		} catch (err) {
			setError(
				err.response?.data?.error ||
				err.response?.data?.message ||
				'Something went wrong'
			);
			setFormLoading(false);
		}
	};

	const onSignUp = () => {
		form.validateFields().then(values => {
			handleSignup(values);
		}).catch(info => {
			console.log('Validate Failed:', info);
		});
	};

	return (
		<>
			<AnimatePresence>
				{(showMessage || error) && (
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.3 }}
						style={{ marginBottom: 20 }}
					>
						<Alert
							type="error"
							showIcon
							message={error || message}
							closable
							onClose={() => {
								setError('');
								if (showMessage) hideAuthMessage();
							}}
						/>
					</motion.div>
				)}
			</AnimatePresence>

			<Form
				form={form}
				layout="vertical"
				name="register-form"
				onFinish={onSignUp}
			>
				<Row gutter={16}>
					<Col xs={24} sm={12}>
						<Form.Item
							name="name"
							label="Full Name"
							rules={rules.name}
							hasFeedback
						>
							<Input
								prefix={<UserOutlined className="text-primary" />}
								placeholder="Enter your full name"
								size="large"
							/>
						</Form.Item>
					</Col>

					<Col xs={24} sm={12}>
						<Form.Item
							name="number"
							label="Phone Number"
							rules={rules.number}
							hasFeedback
						>
							<Input
								prefix={<PhoneOutlined className="text-primary" />}
								placeholder="Enter 10 or 12 digit phone number"
								maxLength={12}
								size="large"
							/>
						</Form.Item>
					</Col>

					<Col xs={24} sm={12}>
						<Form.Item
							name="email"
							label="Email Address"
							rules={rules.email}
							hasFeedback
						>
							<Input
								prefix={<MailOutlined className="text-primary" />}
								placeholder="Enter your email address"
								size="large"
							/>
						</Form.Item>
					</Col>

					<Col xs={24} sm={12}>
						<Form.Item
							name="company"
							label="Company Name"
							rules={rules.company}
							hasFeedback
						>
							<Input
								prefix={<BankOutlined className="text-primary" />}
								placeholder="Enter your company name"
								size="large"
							/>
						</Form.Item>
					</Col>
				</Row>

				<Form.Item>
					<Button
						type="primary"
						htmlType="submit"
						block
						loading={loading || formLoading}
						size="large"
					>
						{loading || formLoading ? 'Creating account...' : 'Sign Up'}
					</Button>
				</Form.Item>
			</Form>
		</>
	)
}

const mapStateToProps = ({ auth }) => {
	const { loading, message, showMessage, token, redirect } = auth;
	return { loading, message, showMessage, token, redirect }
}

const mapDispatchToProps = {
	signUp,
	showAuthMessage,
	hideAuthMessage,
	showLoading
}

export default connect(mapStateToProps, mapDispatchToProps)(RegisterForm)