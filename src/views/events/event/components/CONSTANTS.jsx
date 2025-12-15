import React, { useCallback, useMemo } from "react";
import { Col, Select, Form, Card, Space, Typography, Button, Alert, Empty, Spin } from "antd";
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

    // Find selected venue from the list
    const selectedVenue = useMemo(() => {
        if (!venues.length || selectedVenueId == null || selectedVenueId === '') {
            return undefined;
        }
        return venues.find(v =>
            (v?.id != null && String(v.id) === String(selectedVenueId)) ||
            (v?.value != null && String(v.value) === String(selectedVenueId))
        );
    }, [selectedVenueId, venues]);

    // Transform venues to select options
    const venueOptions = useMemo(() => {
        return venues.map((v) => ({
            value: String(v.id ?? v.value),
            label: v?.name || v?.label || `Venue #${v?.id ?? ''}`,
            venue: v, // Keep full venue data for rendering
        }));
    }, [venues]);

    // Custom filter for search
    const handleFilter = useCallback((input, option) => {
        const searchText = [
            option?.label || '',
            option?.venue?.location || '',
            option?.venue?.city || '',
            option?.venue?.state || '',
            option?.venue?.address || ''
        ].join(' ').toLowerCase();
        return searchText.includes(input.toLowerCase());
    }, []);

    // Custom option render for dropdown
    const renderOption = useCallback((option) => {
        const v = option.data.venue;
        return (
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
    }, []);

    // Custom empty component with button
    const customNotFoundContent = useMemo(() => (
        <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No venues available"
        >
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddVenue}
            >
                Add Venue
            </Button>
        </Empty>
    ), [handleAddVenue]);

    // Handle change for non-form usage
    const handleChange = useCallback((val) => {
        onChange?.(val);
    }, [onChange]);

    // Common Select component
    const selectComponent = (
        <Select
            placeholder="Select Venue"
            loading={venueLoading}
            disabled={venueLoading && !!selectedVenueId}
            showSearch
            style={{ width: '100%' }}
            options={venueOptions}
            optionRender={renderOption}
            filterOption={handleFilter}
            notFoundContent={venueLoading ? <Spin size="small" /> : customNotFoundContent}
            {...(!form && {
                value: venueLoading ? undefined : (value ? String(value) : undefined),
                onChange: handleChange
            })}
        />
    );

    return (
        <>
            {/* Venues — driven by organizerId */}
            <Col xs={24} md={span ?? 8}>
                {form ? (
                    <Form.Item
                        name="venue_id"
                        className={noMargin ? 'mb-0' : undefined}
                        label={hideLable ? null : "Select Venue"}
                        rules={[{ required: true, message: "Please select venue" }]}
                        // This ensures form doesn't try to display value until options are loaded
                        getValueProps={(val) => ({
                            value: venueLoading || !venues.length ? undefined : (val ? String(val) : undefined)
                        })}
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
            {showDetail && selectedVenue && (
                <Col xs={24}>
                    <Card
                        size="small"
                        title="Venue Details"
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
                                    <Typography.Text>
                                        {selectedVenue?.name || selectedVenue?.label}
                                    </Typography.Text>
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
                        {selectedVenue?.map_url && (
                            <Button
                                type="primary"
                                className='positive-absolute float-sm-center float-none float-sm-right mt-3'
                                icon={<EnvironmentOutlined />}
                                onClick={() => window.open(selectedVenue.map_url, '_blank')}
                            >
                                View Map
                            </Button>
                        )}
                    </Card>
                </Col>
            )}
        </>
    );
};
