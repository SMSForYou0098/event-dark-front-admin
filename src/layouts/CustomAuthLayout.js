import React from 'react'
import { Card, Row, Col } from "antd";
import { useSelector } from 'react-redux';
import { useMyContext } from 'Context/MyContextProvider';
import { Link } from 'react-router-dom';

const backgroundStyle = {
    backgroundImage: 'url(/img/others/01.webp)',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover'
}

const CustomAuthLayout = ({ children, bottomText, bottomLink, bottomLinkText }) => {
    const {systemSetting} = useMyContext()
    return (
        <div className="h-100" style={backgroundStyle}>
            <div className="container d-flex flex-column justify-content-center h-100">
                <Row justify="center">
                    <Col xs={20} sm={20} md={20} lg={10}>
                        <Card className='glassmorphism-card' hoverable>
                            <div className="my-4">
                                <div className="text-center">
                                    <img 
                                        className="img-fluid"
                                        src={systemSetting?.logo} 
                                        alt="logo" 
                                        width={100}
                                    />
                                    {bottomText && (
                                        <p>{bottomText} <Link to={bottomLink}><strong>{bottomLinkText}</strong></Link></p>
                                    )}
                                </div>
                                <Row justify="center">
                                    <Col xs={24} sm={24} md={20} lg={20}>
                                        {children}
                                    </Col>
                                </Row>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    )
}

export default CustomAuthLayout