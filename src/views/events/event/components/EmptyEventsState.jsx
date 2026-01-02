import React from 'react';
import { Card, Typography, Space, Button, Steps, Divider } from 'antd';
import {
    FileTextOutlined,
    EnvironmentOutlined,
    AppstoreOutlined,
    PlayCircleOutlined,
    QuestionCircleOutlined,
    RocketOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PermissionChecker from 'layouts/PermissionChecker';
import Flex from 'components/shared-components/Flex';

const { Title, Text, Paragraph } = Typography;

const EmptyEventsState = ({ isJunk }) => {
    const navigate = useNavigate();

    const setupSteps = [
        {
            title: 'Notes & Descriptions',
            description: 'Create content templates for your events',
            icon: <FileTextOutlined />,
            action: () => navigate('/event-content'),
            buttonText: 'Go to Notes & Descriptions',
            color: '#1890ff',
        },
        {
            title: 'Venues Library',
            description: 'Verify your event venue is listed',
            icon: <EnvironmentOutlined />,
            action: () => navigate('/venues'),
            buttonText: 'View Venues Library',
            color: '#52c41a',
        },
        {
            title: 'Seating Layouts',
            description: 'Set up seating arrangements for your venue',
            icon: <AppstoreOutlined />,
            action: () => navigate('/venue-layouts'),
            buttonText: 'Manage Seating Layouts',
            color: '#722ed1',
        },
    ];

    return (
        <Card bordered={false} className='d-flex justify-content-center align-items-center'>
            {/* Header Section */}
            <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 800, margin: '0 auto' }}>
                {/* Icon and Title */}
                <div>
                    <div
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #b51515 0%, #ff4d4f 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            boxShadow: '0 8px 24px rgba(181, 21, 21, 0.3)',
                        }}
                    >
                        <RocketOutlined style={{ fontSize: 36, color: '#fff' }} />
                    </div>
                    <Flex justifyContent="center" flexDirection="column" alignItems="center">
                        <Title level={2} style={{ marginBottom: 8 }}>
                            No Events Found
                        </Title>
                        <Text type="secondary" style={{ fontSize: 16 }}>
                            {
                                isJunk ? "No Events are Deleted yet" : "It looks like you haven't created any events yet."
                            }
                        </Text>
                    </Flex>
                </div>

                {
                    !isJunk && (
                        <>
                            {/* Main Create Event Button */}
                            <PermissionChecker permission="Create Event">
                                <Flex justifyContent="center">
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => navigate('create')}
                                        size="large"
                                        style={{
                                            background: 'linear-gradient(135deg, #b51515 0%, #ff4d4f 100%)',
                                            border: 'none',
                                            boxShadow: '0 4px 12px rgba(181, 21, 21, 0.3)',
                                            height: 48,
                                            paddingInline: 32,
                                            fontSize: 16,
                                        }}
                                    >
                                        Create Your First Event
                                    </Button>
                                </Flex>
                            </PermissionChecker>

                            <Divider style={{ margin: '8px 0' }}>
                                <Text type="secondary">or set up prerequisites first</Text>
                            </Divider>

                            {/* Setup Steps */}
                            <Card
                                size="small"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: 12,
                                }}
                            >
                                <Paragraph style={{ marginBottom: 16 }}>
                                    <Text strong style={{ fontSize: 16 }}>
                                        To get started, please make sure to:
                                    </Text>
                                </Paragraph>

                                <Steps
                                    direction="vertical"
                                    size="small"
                                    current={-1}
                                    items={setupSteps.map((step, index) => ({
                                        title: (
                                            <Text strong style={{ color: step.color }}>
                                                {step.title}
                                            </Text>
                                        ),
                                        description: (
                                            <Space direction="vertical" size={8} style={{ paddingTop: 4 }}>
                                                <Text type="secondary">{step.description}</Text>
                                                <Button
                                                    size="small"
                                                    type="link"
                                                    icon={step.icon}
                                                    onClick={step.action}
                                                    style={{ padding: 0, height: 'auto' }}
                                                >
                                                    {step.buttonText}
                                                </Button>
                                            </Space>
                                        ),
                                        icon: (
                                            <div
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '50%',
                                                    background: `${step.color}20`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: step.color,
                                                }}
                                            >
                                                {step.icon}
                                            </div>
                                        ),
                                    }))}
                                />
                            </Card>

                            {/* Welcome Message */}
                            <Card
                                size="small"
                                style={{
                                    background: 'rgba(24, 144, 255, 0.05)',
                                    border: '1px solid rgba(24, 144, 255, 0.2)',
                                    borderRadius: 12,
                                }}
                            >
                                <Space direction="vertical" size={8}>
                                    <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                                        🎉 Welcome to Get Your Ticket!
                                    </Title>
                                    <Paragraph style={{ margin: 0 }}>
                                        If you have any questions, like how to create an event, watch our helpful{' '}
                                        <Button
                                            type="link"
                                            icon={<PlayCircleOutlined />}
                                            style={{ padding: 0, height: 'auto' }}
                                            onClick={() => window.open('https://your-tutorial-url.com', '_blank')}
                                        >
                                            video tutorial 📺
                                        </Button>{' '}
                                        or reach out to our{' '}
                                        <Button
                                            type="link"
                                            icon={<QuestionCircleOutlined />}
                                            style={{ padding: 0, height: 'auto' }}
                                            onClick={() => window.open('https://help.getyourticket.com', '_blank')}
                                        >
                                            Help Center
                                        </Button>
                                        . We're here to guide you every step of the way.
                                    </Paragraph>
                                </Space>
                            </Card>

                            {/* CTA Section */}
                            <div style={{ paddingTop: 16 }}>
                                <Text strong style={{ display: 'block', marginBottom: 16, fontSize: 16 }}>
                                    Quick Links:
                                </Text>
                                <Space wrap size="middle" style={{ justifyContent: 'center' }}>
                                    <Button
                                        icon={<FileTextOutlined />}
                                        onClick={() => navigate('/event-content')}
                                    >
                                        Notes & Descriptions
                                    </Button>
                                    <Button
                                        icon={<EnvironmentOutlined />}
                                        onClick={() => navigate('/venues')}
                                    >
                                        Venues Library
                                    </Button>
                                    <Button
                                        icon={<AppstoreOutlined />}
                                        onClick={() => navigate('/layouts')}
                                    >
                                        Seating Layouts
                                    </Button>
                                </Space>
                            </div></>
                    )
                }

            </Space>
        </Card>
    );
};

export default EmptyEventsState;