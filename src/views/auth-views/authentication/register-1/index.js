import React from 'react'
import RegisterForm from '../../components/RegisterForm'
import CustomAuthLayout from 'layouts/CustomAuthLayout';
const RegisterOne = props => {
	return (
		<CustomAuthLayout
			bottomText="Already have an account?"
			bottomLink="/auth/login-1"
			bottomLinkText="Login"
		>
			<RegisterForm {...props} />
		</CustomAuthLayout>
	)
}

export default RegisterOne
