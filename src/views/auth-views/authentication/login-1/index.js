import React from 'react'
import LoginForm from '../../components/LoginForm'
import CustomAuthLayout from '../../../../layouts/CustomAuthLayout'

const LoginOne = props => {
	return (
		<CustomAuthLayout
		// bottomText="Don't have an account?"
		// bottomLink="/auth/register-1"
		// bottomLinkText="Sign Up"
		>
			<LoginForm {...props} />
		</CustomAuthLayout>
	)
}

export default LoginOne
