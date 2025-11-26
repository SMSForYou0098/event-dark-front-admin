import React, { useMemo } from "react";
import { Col, Select, Form, Card, Space, Typography, Button, Alert, Empty } from "antd";
import { HomeOutlined, CompassOutlined, EnvironmentOutlined, PlusOutlined } from "@ant-design/icons";
import { useVenues } from "../hooks/useEventOptions";
import { useNavigate } from "react-router-dom";

// constants.js
export const CONSTANTS = {
    organizers: [
        { value: '1', label: 'Organizer 1' },
        { value: '2', label: 'Organizer 2' },
        { value: '3', label: 'Organizer 3' },
    ],
    categories: [
        { value: 'music', label: 'Music' },
        { value: 'sports', label: 'Sports' },
        { value: 'conference', label: 'Conference' },
        { value: 'comedy', label: 'Comedy' },
        { value: 'exhibition', label: 'Exhibition' },
    ],
    states: [
        { value: 'gujarat', label: 'Gujarat' },
        { value: 'maharashtra', label: 'Maharashtra' },
        { value: 'karnataka', label: 'Karnataka' },
        { value: 'delhi', label: 'Delhi' },
    ],
    cities: [
        { value: 'ahmedabad', label: 'Ahmedabad' },
        { value: 'mumbai', label: 'Mumbai' },
        { value: 'bangalore', label: 'Bangalore' },
        { value: 'delhi', label: 'Delhi' },
    ],
    venues: [
        {
            value: 'venue1',
            label: 'Narendra Modi Stadium',
            location: 'Ahmedabad',
            address: 'Narendra Modi Stadium, Sardar Patel Stadium Road, Ahmedabad, Gujarat 380013'
        },
        {
            value: 'venue2',
            label: 'Wankhede Stadium',
            location: 'Mumbai',
            address: 'Wankhede Stadium, D Road, Churchgate, Mumbai, Maharashtra 400020'
        },
        {
            value: 'venue3',
            label: 'Phoenix Marketcity',
            location: 'Bangalore',
            address: 'Phoenix Marketcity, 140, 1st Floor, Whitefield Main Road, Mahadevpura, Bangalore, Karnataka 560048'
        },
    ],
    userDataOptions: [
        { value: 0, label: 'User Detail Only' },
        { value: 1, label: 'Attendee Detail Only' },
        { value: 2, label: 'Both' },
    ],
};

export const VanueList = ({
    form,
    value,
    span,
    noMargin = false,
    hideLable = false,
    showDetail = true,
    onChange
}) => {
    const {
        data: venues = [],
        isLoading: venueLoading,
        isError: venueError,
        error: venueErrObj,
        refetch: refetchVenues,
    } = useVenues();
    const navigate = useNavigate();

    const handleAddVenue = () => {
        navigate('/venues');
    };

    // Always call the hook, but use form value only if form exists
    const formVenueId = Form.useWatch('venue_id', form);

    // Use form value if form exists, otherwise use controlled value prop
    const selectedVenueId = form ? formVenueId : value;

    const selectedVenue = useMemo(() => {
        const venueId = selectedVenueId;
        if (venueId == null || venueId === '') return undefined;
        return venues.find(v =>
            (v?.id != null && String(v.id) === String(venueId)) ||
            (v?.value != null && String(v.value) === String(venueId))
        );
    }, [selectedVenueId, venues]);

    const renderVenueOptionLabel = (v) => (
        <div>
            <Typography.Text strong>
                {v?.name || v?.label || `Venue #${v?.id ?? ''}`}
            </Typography.Text>
            {(v?.location || v?.city || v?.state) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <EnvironmentOutlined />
                    <span>{v?.location || [v?.city, v?.state].filter(Boolean).join(', ')}</span>
                </div>
            )}
            {v?.address && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {v.address}
                </Typography.Text>
            )}
        </div>
    );

    // Custom empty component with button
    const customNotFoundContent = (
        <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
                <span>
                    {"No venues available"}
                </span>
            }
        >
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddVenue}
            >
                Add Venue
            </Button>
        </Empty>
    );

    // Common Select component
    const selectComponent = (
        <Select
            placeholder="Select Venue"
            loading={venueLoading}
            options={venues.map((v) => ({
                value: String(v.id) ?? String(v.value),
                label: renderVenueOptionLabel(v),
            }))}
            {...(!form && { value: value ? String(value) : undefined })}
            {...(!form && { onChange: onChange })}
            optionLabelProp="label"
            showSearch
            filterOption={(input, option) => {
                const text =
                    (option?.label?.props?.children?.[0]?.props?.children ?? '') + ' ' +
                    (option?.label?.props?.children?.[1]?.props?.children?.[1] ?? '') + ' ' +
                    (option?.label?.props?.children?.[2]?.props?.children ?? '');
                return text.toLowerCase().includes(input.toLowerCase());
            }}
            style={{ width: '100%' }}
            notFoundContent={customNotFoundContent}
        />
    );

    return (
        <>
            {/* Errors */}
            {venueError && (
                <Col span={24}>
                    <Alert
                        type="error"
                        showIcon
                        message="Failed to load venues"
                        description={venueErrObj?.message}
                        action={<Button size="small" onClick={() => refetchVenues()}>Retry</Button>}
                    />
                </Col>
            )}
            {/* Venues — driven by organizerId */}
            <Col xs={24} md={span ?? 8}>
                {form ? (
                    <Form.Item
                        name="venue_id"
                        className={noMargin && 'mb-0'}
                        label={hideLable ? null : "Select Venue"}
                        rules={[{ required: true, message: "Please select venue" }]}
                    >
                        {selectComponent}
                    </Form.Item>
                ) : (
                    <>
                        {!hideLable && <label>Select Venue</label>}
                        {selectComponent}
                    </>
                )}
            </Col>


            {/* Venue Details */}
            {(selectedVenue && showDetail) && (
                <Col xs={24}>
                    <Form.Item dependencies={['venue_id']} noStyle>
                        {() => selectedVenue ? (
                            <Card size="small" title="Venue Details"
                                extra={
                                    <Button
                                        type="link"
                                        onClick={handleAddVenue}
                                        icon={<PlusOutlined />}
                                    >
                                        New Venue
                                    </Button>
                                }
                            >
                                <Space direction="vertical">
                                    <Space size="large">
                                        <Space>
                                            <HomeOutlined className='text-white bg-primary p-2 rounded-circle' />
                                            <Typography.Text>{selectedVenue?.name || selectedVenue?.label}</Typography.Text>
                                        </Space>
                                        {(selectedVenue?.location || selectedVenue?.city || selectedVenue?.state) && (
                                            <Space>
                                                <CompassOutlined className='text-white bg-primary p-2 rounded-circle' />
                                                <Typography.Text>
                                                    {selectedVenue?.location || [selectedVenue?.city, selectedVenue?.state].filter(Boolean).join(', ')}
                                                </Typography.Text>
                                            </Space>
                                        )}
                                    </Space>
                                    {selectedVenue?.address && (
                                        <Space>
                                            <EnvironmentOutlined className='text-white bg-primary p-2 rounded-circle' />
                                            <Typography.Text>{selectedVenue.address}</Typography.Text>
                                        </Space>
                                    )}
                                </Space>
                                {selectedVenue?.address && (
                                    <Button
                                        type="primary"
                                        className='positive-absolute float-sm-center float-none float-sm-right mt-3'
                                        icon={<EnvironmentOutlined />}
                                        onClick={() => window.open(`${selectedVenue?.map_url}`, '_blank')}
                                    >
                                        View Map
                                    </Button>
                                )}
                            </Card>
                        ) : null}
                    </Form.Item>
                </Col>
            )}
        </>
    );
};
