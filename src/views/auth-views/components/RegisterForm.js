import React, { useEffect, useState } from 'react'
import { connect, useDispatch, useSelector } from 'react-redux'
import { MailOutlined, UserOutlined, PhoneOutlined, BankOutlined } from '@ant-design/icons';
import { Button, Form, Input, Alert, Row, Col, message as antMessage } from "antd";
import { signUp, showAuthMessage, showLoading, hideAuthMessage, setOtpCooldown, clearOtpCooldown } from '../../../store/slices/authSlice';
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from "framer-motion"
import axios from 'axios';
import { API_BASE_URL } from 'configs/AppConfig';
import api from 'auth/FetchInterceptor';
import { OtpVerificationModal } from 'views/events/users/Manage/components';
import { parseRetryAfter, formatCooldownTime } from 'utils/otpUtils';

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
	organisation: [
		{
			required: true,
			message: 'Please input your organisation name'
		},
		{
			min: 2,
			message: 'organisation name must be at least 2 characters'
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
	const dispatch = useDispatch();

	const [error, setError] = useState('');
	const [formLoading, setFormLoading] = useState(false);

	// OTP verification state
	const [otpModalVisible, setOtpModalVisible] = useState(false);
	const [otpValue, setOtpValue] = useState('');
	const [otpLoading, setOtpLoading] = useState(false);
	const [otpSending, setOtpSending] = useState(false);
	const [pendingFormValues, setPendingFormValues] = useState(null);
	const [sessionId, setSessionId] = useState(null);

	// Get OTP cooldown from Redux
	const otpCooldownEnd = useSelector((state) => state.auth.otpCooldownEnd);
	const otpCooldownNumber = useSelector((state) => state.auth.otpCooldownNumber);
	const [remainingCooldown, setRemainingCooldown] = useState(0);

	// Default cooldown duration in seconds when no retry_after is provided
	const DEFAULT_COOLDOWN_SECONDS = 10; // For initial OTP send failures
	const RESEND_COOLDOWN_SECONDS = 30; // For resend button cooldown

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

	// Update remaining cooldown time
	useEffect(() => {
		if (!otpCooldownEnd) {
			setRemainingCooldown(0);
			return;
		}

		const updateCooldown = () => {
			const now = Date.now();
			const remaining = Math.max(0, Math.ceil((otpCooldownEnd - now) / 1000));
			setRemainingCooldown(remaining);

			if (remaining <= 0) {
				dispatch(clearOtpCooldown());
			}
		};

		updateCooldown();
		const interval = setInterval(updateCooldown, 1000);

		return () => clearInterval(interval);
	}, [otpCooldownEnd]);

	// Send OTP to phone number
	const sendOtp = async (phoneNumber) => {
		// Check if we're in cooldown period for the same phone number
		if (otpCooldownEnd && otpCooldownNumber === phoneNumber && Date.now() < otpCooldownEnd) {
			// Just return false - timer will show on Sign Up button
			return false;
		}

		setOtpSending(true);
		try {
			const response = await api.post(`${API_BASE_URL}onboarding/otp`, { number: phoneNumber });

			if (response?.status) {
				antMessage.success('OTP sent successfully!');
				return true;
			} else {
				// Check for rate limit error with retry_after
				if (response?.retry_after) {
					const seconds = parseRetryAfter(response.retry_after);
					const cooldownEndTime = Date.now() + (seconds * 1000);
					dispatch(setOtpCooldown({ timestamp: cooldownEndTime, phoneNumber }));
					antMessage.error(response?.message || response?.error || 'Too many OTP requests');
				} else {
					// Apply default 10s cooldown on any failed request
					const cooldownEndTime = Date.now() + (DEFAULT_COOLDOWN_SECONDS * 1000);
					dispatch(setOtpCooldown({ timestamp: cooldownEndTime, phoneNumber }));
					antMessage.error(response?.message || response?.error || 'Failed to send OTP');
				}
				return false;
			}
		} catch (error) {
			console.error('Send OTP error:', error);
			// Check for rate limit error in error response
			const errorData = error?.response?.data;
			if (errorData?.retry_after) {
				const seconds = parseRetryAfter(errorData.retry_after);
				const cooldownEndTime = Date.now() + (seconds * 1000);
				dispatch(setOtpCooldown({ timestamp: cooldownEndTime, phoneNumber }));
				antMessage.error(errorData?.message || errorData?.error || 'Too many OTP requests');
			} else {
				// Apply default 10s cooldown on any failed request
				const cooldownEndTime = Date.now() + (DEFAULT_COOLDOWN_SECONDS * 1000);
				dispatch(setOtpCooldown({ timestamp: cooldownEndTime, phoneNumber }));
				antMessage.error(errorData?.message || errorData?.error || 'Failed to send OTP');
			}
			return false;
		} finally {
			setOtpSending(false);
		}
	};

	// Verify OTP and get session_id
	const verifyOtp = async () => {
		if (!otpValue || otpValue.length < 6) {
			antMessage.error('Please enter a valid 6-digit OTP');
			return;
		}

		if (!pendingFormValues?.number) {
			antMessage.error('Phone number not found');
			return;
		}

		setOtpLoading(true);
		try {
			const response = await api.post(`${API_BASE_URL}user/otp/verify`, {
				number: pendingFormValues.number,
				otp: otpValue
			});

			if (response?.status && response?.session_id) {
				antMessage.success('OTP verified successfully!');
				setSessionId(response?.session_id);
				setOtpModalVisible(false);
				setOtpValue('');

				// Now proceed with user creation using session_id
				await handleSignup(pendingFormValues, response?.session_id);
			} else {
				antMessage.error(response?.message || 'Invalid OTP');
			}
		} catch (error) {
			console.error('Verify OTP error:', error);
			antMessage.error(error?.response?.data?.message || 'Failed to verify OTP');
		} finally {
			setOtpLoading(false);
		}
	};

	// Resend OTP
	const resendOtp = async () => {
		if (pendingFormValues?.number) {
			const success = await sendOtp(pendingFormValues.number);
			// Apply 30s cooldown for resend regardless of success
			if (success) {
				const cooldownEndTime = Date.now() + (RESEND_COOLDOWN_SECONDS * 1000);
				dispatch(setOtpCooldown({ timestamp: cooldownEndTime, phoneNumber: pendingFormValues.number }));
			}
		}
	};

	const handleSignup = async (values, sessionId = null) => {
		try {
			setFormLoading(true);
			const formData = {
				email: values.email,
				number: values.number,
				name: values.name,
				organisation: values.organisation,
				city: values.city,
				password: values.number, // Using phone number as password
			};

			// Add session_id if available (from OTP verification)
			if (sessionId) {
				formData.session_id = sessionId;
			}

			const response = await axios.post(
				`${API_BASE_URL}create-user?`,
				formData,
				{
					headers: {
						"X-Unique-Request": "org_form_1",   // your custom header
						"X-Custom-Token": "abc123",            // you can add anything
					}
				}
			);

			if (response.data.status) {
				// const phoneNumber = response.data.user?.number;
				// handleLogin(phoneNumber);
				navigate(`auth/login?set=email-verification-pending`);
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
		form.validateFields().then(async values => {
			// Store form values and trigger OTP flow
			setPendingFormValues(values);

			// Send OTP to the phone number
			const otpSent = await sendOtp(values.number);

			if (otpSent) {
				// Show OTP modal
				setOtpModalVisible(true);
			}
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
							name="organisation"
							label="Organisation"
							rules={rules.organisation}
							hasFeedback
						>
							<Input
								prefix={<BankOutlined className="text-primary" />}
								placeholder="Enter your organisation name"
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
						disabled={remainingCooldown > 0}
					>
						{loading || formLoading
							? 'Creating account...'
							: remainingCooldown > 0
								? `Wait ${Math.floor(remainingCooldown / 60)}:${String(remainingCooldown % 60).padStart(2, '0')}`
								: 'Sign Up'
						}
					</Button>
				</Form.Item>
			</Form>

			{/* OTP Verification Modal */}
			<OtpVerificationModal
				open={otpModalVisible}
				onClose={() => {
					setOtpModalVisible(false);
					setOtpValue('');
				}}
				onVerify={verifyOtp}
				onResend={resendOtp}
				phoneNumber={pendingFormValues?.number}
				title="Verify OTP"
				description={`Please enter the OTP sent to ${pendingFormValues?.number} to complete registration.`}
				otpValue={otpValue}
				onOtpChange={setOtpValue}
				isVerifying={otpLoading}
				isSending={otpSending}
				verifyButtonText="Verify & Create Account"
				cooldownSeconds={remainingCooldown}
			/>
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