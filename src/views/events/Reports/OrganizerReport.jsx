import React, { useState } from 'react';
import { Card, Spin, Typography, Select, Row, Col, Empty, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import OrganizerService from 'services/OrganizerService';
import { useMyContext } from 'Context/MyContextProvider';
import OrganizerSummary from '../Dashboard/components/OrganizerSummary';
import EventTicketDropdowns from '../common/EventTicketDropdowns';
import { TeamOutlined, BarChartOutlined, CalendarOutlined } from '@ant-design/icons';

import { PERMISSIONS } from 'constants/PermissionConstant';
import PermissionChecker from 'layouts/PermissionChecker';

const { Title, Text } = Typography;

const OrganizerReport = () => {
    const { OrganizerList } = useMyContext();
    const [selectedOrganizer, setSelectedOrganizer] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Organizer options for dropdown
    const organizerOptions = OrganizerList?.map(org => ({
        value: String(org.id),
        label: `${org.organisation} (${org.name})`,
    })) || [];

    // Fetch organizer report data using the new service
    const {
        data: reportData,
        isLoading: reportLoading,
        error: reportError
    } = useQuery({
        queryKey: ['organizer-report', selectedOrganizer, selectedEvent],
        queryFn: () => OrganizerService.getOrganizerReport(selectedOrganizer, selectedEvent),
        enabled: !!selectedOrganizer && !!selectedEvent, // Both organizer and event must be selected
        staleTime: 5 * 60 * 1000,
    });

    const handleOrganizerChange = (value) => {
        setSelectedOrganizer(value);
        setSelectedEvent(null); // Reset event selection when organizer changes
    };

    const handleEventChange = (eventObj) => {
        setSelectedEvent(eventObj?.value ?? null);
    };

    return (
        <PermissionChecker permission={PERMISSIONS.VIEW_ORGANIZER_REPORTS}>
            <div className="p-3">
                {/* Header with Title and Organizer/Event Selection */}
                <Card className="mb-4">
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} lg={8}>
                            <Space align="center">
                                <BarChartOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                                <div>
                                    <Title level={4} className="mb-0">Organizer Report</Title>
                                    <Text type="secondary">View detailed reports</Text>
                                </div>
                            </Space>
                        </Col>
                        <Col xs={24} lg={16}>
                            <Row gutter={[12, 12]}>
                                <Col xs={24} sm={12}>
                                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                        <Text strong style={{ fontSize: 12 }}>Select Organizer *</Text>
                                        <Select
                                            showSearch
                                            allowClear
                                            placeholder="Choose an organizer"
                                            options={organizerOptions}
                                            optionFilterProp="label"
                                            onChange={handleOrganizerChange}
                                            value={selectedOrganizer}
                                            style={{ width: '100%' }}
                                            size="medium"
                                        />
                                    </Space>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                        <Text strong style={{ fontSize: 12 }}>
                                            <CalendarOutlined className="mr-2" />
                                            Select Event *
                                        </Text>
                                        <EventTicketDropdowns
                                            organizerId={selectedOrganizer}
                                            role="Organizer"
                                            selectedEvent={selectedEvent ? { value: selectedEvent } : null}
                                            onEventChange={handleEventChange}
                                            showTicketDropdown={false}
                                            disabled={!selectedOrganizer}
                                            eventPlaceholder={selectedOrganizer ? "Choose an event" : "Select organizer first"}
                                            eventSelectStyle={{ width: '100%' }}
                                        />
                                    </Space>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Card>

                {/* Content Area */}
                {!selectedOrganizer || !selectedEvent ? (
                    // Empty State - No organizer/event selected
                    <Card className="text-center py-5">
                        <Empty
                            image={<TeamOutlined style={{ fontSize: 80, color: '#8c8c8c' }} />}
                            imageStyle={{ height: 100 }}
                            description={
                                <Space direction="vertical" size={8}>
                                    <Title level={4} className="mb-0" style={{ color: '#595959' }}>
                                        {!selectedOrganizer ? 'No Organizer Selected' : 'No Event Selected'}
                                    </Title>
                                    <Text type="secondary" style={{ fontSize: 16 }}>
                                        {!selectedOrganizer
                                            ? 'Please select an organizer from the dropdown above to view their events'
                                            : 'Please select an event to view the detailed report'
                                        }
                                    </Text>
                                    <Text type="secondary">
                                        You'll be able to see gateway earnings, event-wise earnings, and more
                                    </Text>
                                </Space>
                            }
                        />
                    </Card>
                ) : (
                    // Reports Content
                    <Spin spinning={reportLoading}>
                        {reportError ? (
                            <Card>
                                <Empty
                                    description={
                                        <Text type="danger">
                                            Failed to load report data. Please try again.
                                        </Text>
                                    }
                                />
                            </Card>
                        ) : (
                            <>
                                {/* Organizer Summary Component */}
                                <OrganizerSummary organizerSummary={reportData?.organizerSummary} />

                            </>
                        )}
                    </Spin>
                )
                }
            </div >
        </PermissionChecker>
    );
};

export default OrganizerReport;
