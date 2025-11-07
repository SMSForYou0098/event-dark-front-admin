import React from 'react';
import { Button, Card, Col, Row } from 'antd';
import { LockOutlined, HomeOutlined, ArrowRightOutlined } from '@ant-design/icons';
import './forbidden.css';
import { Ticket } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <Card className="forbidden-page">
      <div className="animated-bg">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
      </div>
        <Row>
          {/* Left Content */}
          <Col lg={12}>
            <div className="content-wrapper">
              {/* Logo */}
              {/* <div className="logo-wrapper">
                <div className="logo-icon bg-primary">
                  <Ticket style={{ fontSize: '24px', color: 'white' , rotate: '-20deg' }} />
                </div>
                <span className="logo-text">Get Your Ticket</span>
              </div> */}

              {/* Main Content */}
              <div className="main-content">
                <div className="heading-section">
                  <h1 className="main-heading">Access Denied</h1>
                  {/* <p className="sub-heading">This module requires elevated permissions</p> */}
                </div>

                <div className="info-cards">
                  <div className="info-card">
                    <p className="card-title">Permissionized Access Only</p>
                    <p className="card-description">
                      Only users with verified credentials can access this section.
                    </p>
                  </div>

                  <div className="info-card">
                    <p className="card-title">Tier Requirements</p>
                    <p className="card-description">
                      Your current account tier doesn't have access to access this feature. Contact your organizer to update the access.
                    </p>
                  </div>

                  {/* <div className="info-card">
                    <p className="card-title">Contact Support</p>
                    <p className="card-description">
                      Reach out to our support team to request elevated permissions or upgrade your account.
                    </p>
                  </div> */}
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-between">
                  <Button 
                    type="primary" 
                    size="large" 
                    onClick={() => window.location.href = '/dashboard'}
                    icon={<HomeOutlined />}
                  >
                    Back to Dashboard
                  </Button>
                  {/* <Button 
                    size="large"
                  >
                    Request Access
                    <ArrowRightOutlined />
                  </Button> */}
                </div>
              </div>
            </div>
          </Col>

          {/* Right Visual */}
          <Col lg={12} className='d-none d-lg-block'>
            <div className="visual-wrapper">
              <div className="visual-container">
                <div className="outer-glow"></div>
                <div className="glass-card">
                  <div className="lock-icon-wrapper">
                    <div className="lock-glow"></div>
                    <div className="lock-bg">
                      <LockOutlined className="text-white" style={{ fontSize: '96px' }} />
                    </div>
                  </div>
                  <div className="visual-text">
                    <p className="visual-title">Restricted Area</p>
                    <p className="visual-description">
                      You need special permissions to access this area. Contact your organizer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
    </Card>
  );
}