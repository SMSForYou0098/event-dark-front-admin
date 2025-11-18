import React from 'react'
import { Card, Row, Col } from "antd";
import { useMyContext } from 'Context/MyContextProvider';
import { Link } from 'react-router-dom';

const backgroundStyle = {
    backgroundImage: 'url(/img/others/01.webp)',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover'
}

const CustomAuthLayout = ({ children, bottomText, bottomLink, bottomLinkText }) => {
    // const {systemSetting} = useMyContext()
    return (
        <div className="h-100" style={backgroundStyle}>
            <div className="container d-flex flex-column justify-content-center h-100">
                <Row justify="center">
                    <Col xs={20} sm={20} md={20} lg={10}>
                        <Card className='glassmorphism-card' hoverable>
                            <div className="my-4">
                                <div className="text-center mb-3">
                                    <img 
                                        className="img-fluid"
                                        src={'/img/logo.webp'} 
                                        alt="logo" 
                                        width={100}
                                    />
                                  
                                </div>
                                <Row justify="center">
                                    <Col xs={24} sm={24} md={20} lg={20}>
                                        {children}
                                    </Col>
                                </Row>
                                  {bottomText && (
                                        <p className='text-center'>{bottomText} <Link to={bottomLink}><strong>{bottomLinkText}</strong></Link></p>
                                    )}
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    )
}

export default CustomAuthLayout