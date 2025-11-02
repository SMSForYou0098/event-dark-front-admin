import React from 'react'
import { Button, Row, Col } from "antd";
import { ArrowLeftOutlined, LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { signOut } from 'store/slices/authSlice';

const AccessDenied = () => {

    const APP_NAME = "Application";
	const dispatch = useDispatch();
	const handleSignOut = () => {
			dispatch(signOut());

		}
    return (
        <div className={`h-100 bg-dark`}>
            <div className="container-fluid d-flex flex-column justify-content-between h-100 px-md-4 pb-md-4 pt-md-1 dark">
                {/* Header Logo */}
                <div>
                    <img className="img-fluid" src={`/img/logo-white.png`} alt="Logo" />
                </div>
                
                {/* Error Content */}
                <div className="container">
                    <Row align="middle">
                        <Col xs={24} sm={24} md={8}>
                            {/* Changed Headline */}
                            <h1 className="font-weight-bold mb-4 display-4">
                                <LockOutlined className="mr-2" /> Access Denied
                            </h1>
                            {/* Changed Message */}
                            <p className="font-size-md mb-4">
                                Sorry, you do not have permission to access this page. 
                                Please log in with the correct credentials or contact an administrator.
                            </p>
                            {/* Changed Link to point to login */}
                                <Button type="primary" onClick={handleSignOut} icon={<ArrowLeftOutlined />}>Go to Login</Button>
                        </Col>
                        <Col xs={24} sm={24} md={{ span: 14, offset: 2 }}>
                            {/* Updated image to a security/access theme (img-19 is often used for this) */}
                            <img className="img-fluid mt-md-0 mt-4" src="/img/others/img-19.png" alt="Access Denied" />
                        </Col>
                    </Row>
                </div>
                
                {/* Footer */}
                {/* Replaced Flex component with a standard div and inline styles */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span>Copyright  &copy;  {`${new Date().getFullYear()}`} <span className="font-weight-semibold">{`${APP_NAME}`}</span></span>
                    <div>
                        <a className="text-gray" href="/#" onClick={e => e.preventDefault()}>Term & Conditions</a>
                        <span className="mx-2 text-muted"> | </span>
                        <a className="text-gray" href="/#" onClick={e => e.preventDefault()}>Privacy & Policy</a>
                    </div>
                </div> {/* <-- Corrected this line from </Flex> to </div> */}
            </div>
        </div>
    )
}

export default AccessDenied

