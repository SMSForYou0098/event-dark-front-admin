import React, { useState } from 'react';
import {
    Steps,
    Form,
    Input,
    Button,
    Select,
    Switch,
    DatePicker,
    TimePicker,
    Upload,
    Table,
    Card,
    Row,
    Col,
    Space,
    Typography,
    message,
    Divider,
    Alert,
    Tooltip
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    SaveOutlined,
    UploadOutlined,
    FormOutlined,
    ControlOutlined,
    FieldTimeOutlined,
    TagsOutlined,
    EnvironmentOutlined,
    PictureOutlined,
    GlobalOutlined
} from '@ant-design/icons';

const { Step } = Steps;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;

const EventStepperForm = () => {
    const [current, setCurrent] = useState(0);
    const [form] = Form.useForm();
    const [formData, setFormData] = useState({});
    const [embedCode, setEmbedCode] = useState('');
    const [tickets, setTickets] = useState([
        { key: '1', name: 'General', price: '500', quantity: '100' },
        { key: '2', name: 'VIP', price: '1000', quantity: '50' },
    ]);

    // Sample options data
    const organizers = [
        { value: '1', label: 'Organizer 1' },
        { value: '2', label: 'Organizer 2' },
        { value: '3', label: 'Organizer 3' },
    ];

    const categories = [
        { value: 'music', label: 'Music' },
        { value: 'sports', label: 'Sports' },
        { value: 'conference', label: 'Conference' },
        { value: 'comedy', label: 'Comedy' },
        { value: 'exhibition', label: 'Exhibition' },
    ];

    const states = [
        { value: 'gujarat', label: 'Gujarat' },
        { value: 'maharashtra', label: 'Maharashtra' },
        { value: 'karnataka', label: 'Karnataka' },
        { value: 'delhi', label: 'Delhi' },
    ];

    const cities = [
        { value: 'ahmedabad', label: 'Ahmedabad' },
        { value: 'mumbai', label: 'Mumbai' },
        { value: 'bangalore', label: 'Bangalore' },
        { value: 'delhi', label: 'Delhi' },
    ];

    const venues = [
        { value: 'venue1', label: 'Narendra Modi Stadium' },
        { value: 'venue2', label: 'Wankhede Stadium' },
        { value: 'venue3', label: 'Phoenix Marketcity' },
    ];

    const userDataOptions = [
        { value: 'user', label: 'User Detail' },
        { value: 'attendee', label: 'Attendee Detail' },
        { value: 'both', label: 'Both' },
    ];

    // Ticket table columns
    const ticketColumns = [
        {
            title: 'Ticket Name',
            dataIndex: 'name',
            key: 'name',
            width: '30%'
        },
        {
            title: 'Price (₹)',
            dataIndex: 'price',
            key: 'price',
            width: '25%'
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            width: '25%'
        },
        {
            title: 'Action',
            key: 'action',
            width: '20%',
            render: (_, record) => (
                <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteTicket(record.key)}
                >
                    Delete
                </Button>
            )
        },
    ];

    const handleDeleteTicket = (key) => {
        setTickets(tickets.filter(ticket => ticket.key !== key));
        message.success('Ticket deleted successfully');
    };

    const handleAddTicket = () => {
        const newKey = String(tickets.length + 1);
        setTickets([
            ...tickets,
            { key: newKey, name: `Ticket ${newKey}`, price: '0', quantity: '0' }
        ]);
        message.success('Ticket added successfully');
    };

    // Step 1: Basic Details
    const BasicDetails = () => (
        <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
                <Form.Item
                    name="organizer"
                    label="Organizer"
                    rules={[{ required: true, message: 'Please select organizer' }]}
                >
                    <Select
                        placeholder="Select Organizer"
                        options={organizers}
                        size="large"
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Form.Item>
            </Col>

            <Col xs={24} md={12}>
                <Form.Item
                    name="category"
                    label="Category"
                    rules={[{ required: true, message: 'Please select category' }]}
                >
                    <Select
                        placeholder="Select Category"
                        options={categories}
                        size="large"
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Form.Item>
            </Col>

            <Col xs={24}>
                <Form.Item
                    name="eventName"
                    label="Event Name"
                    rules={[
                        { required: true, message: 'Please enter event name' },
                        { min: 3, message: 'Event name must be at least 3 characters' }
                    ]}
                >
                    <Input placeholder="Enter Event Name" size="large" />
                </Form.Item>
            </Col>

            <Col xs={24} md={12}>
                <Form.Item
                    name="state"
                    label="State"
                    rules={[{ required: true, message: 'Please select state' }]}
                >
                    <Select
                        placeholder="Select State"
                        options={states}
                        size="large"
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Form.Item>
            </Col>

            <Col xs={24} md={12}>
                <Form.Item
                    name="city"
                    label="City"
                    rules={[{ required: true, message: 'Please select city' }]}
                >
                    <Select
                        placeholder="Select City"
                        options={cities}
                        size="large"
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Form.Item>
            </Col>

            <Col xs={24}>
                <Form.Item
                    name="venue"
                    label="Select Venue"
                    rules={[{ required: true, message: 'Please select venue' }]}
                >
                    <Select
                        placeholder="Select Venue"
                        options={venues}
                        size="large"
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Form.Item>
            </Col>

            <Col xs={24}>
                <Form.Item
                    name="description"
                    label="Event Description"
                    rules={[
                        { required: true, message: 'Please enter description' },
                        { min: 20, message: 'Description must be at least 20 characters' }
                    ]}
                >
                    <TextArea
                        rows={5}
                        placeholder="Enter detailed event description..."
                        showCount
                        maxLength={500}
                    />
                </Form.Item>
            </Col>
        </Row>
    );

    // Step 2: Event Controls
    const EventControls = () => (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Form.Item
                name="userDataWhileScan"
                label="User Data While Scan"
                initialValue="both"
                rules={[{ required: true, message: 'Please select user data option' }]}
            >
                <Select options={userDataOptions} size="large" />
            </Form.Item>

            <Card title="Event Settings" size="small">
                <Row gutter={[24, 16]}>
                    <Col xs={24} sm={12} lg={8}>
                        <Form.Item
                            name="highDemand"
                            label="High Demand"
                            valuePropName="checked"
                            tooltip="Mark this event as high demand"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} lg={8}>
                        <Form.Item
                            name="eventStatus"
                            label="Event Status"
                            valuePropName="checked"
                            tooltip="Enable or disable event"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} lg={8}>
                        <Form.Item
                            name="houseFull"
                            label="House Full"
                            valuePropName="checked"
                            tooltip="Mark event as sold out"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} lg={8}>
                        <Form.Item
                            name="hideOnlineAttendee"
                            label="Hide Online Attendee Suggestion"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} lg={8}>
                        <Form.Item
                            name="hideAgentAttendee"
                            label="Hide Agent Attendee Suggestion"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} lg={8}>
                        <Form.Item
                            name="multiScanTicket"
                            label="Multi Scan Ticket"
                            valuePropName="checked"
                            tooltip="Allow tickets to be scanned multiple times"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} lg={8}>
                        <Form.Item
                            name="bookingByTicket"
                            label="Booking By Ticket"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} lg={8}>
                        <Form.Item
                            name="bookingBySeat"
                            label="Booking By Seat"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Form.Item
                name="whatsappNote"
                label="WhatsApp Note"
                tooltip="This note will be sent via WhatsApp to attendees"
            >
                <TextArea
                    rows={3}
                    placeholder="Enter WhatsApp notification message..."
                    showCount
                    maxLength={200}
                />
            </Form.Item>

            <Form.Item
                name="instagramUrl"
                label="Instagram URL"
                rules={[
                    { type: 'url', message: 'Please enter a valid URL' }
                ]}
            >
                <Input
                    placeholder="https://instagram.com/your-event"
                    size="large"
                />
            </Form.Item>
        </Space>
    );

    // Step 3: Timing
    const Timing = () => (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Form.Item
                name="dateRange"
                label="Event Date Range"
                rules={[{ required: true, message: 'Please select date range' }]}
            >
                <RangePicker
                    showTime
                    placeholder={['Start Date', 'End Date']}
                />
            </Form.Item>

            <Form.Item
                name="entryTime"
                label="Entry Time"
                rules={[{ required: true, message: 'Please select entry time' }]}
            >
                <TimePicker
                    style={{ width: '100%' }}
                    size="large"
                    format="HH:mm"
                    placeholder="Select entry time"
                />
            </Form.Item>

            <Card title="Repeat Options" size="small">
                <Row gutter={24}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="daily"
                            label="Daily Event"
                            valuePropName="checked"
                            tooltip="Event occurs daily"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="season"
                            label="Seasonal Event"
                            valuePropName="checked"
                            tooltip="Event is seasonal"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>
        </Space>
    );

    // Step 4: Tickets
    const Tickets = () => (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddTicket}
                    style={{ marginBottom: 16 }}
                >
                    Add Ticket
                </Button>
                <Table
                    columns={ticketColumns}
                    dataSource={tickets}
                    pagination={false}
                    size="small"
                    scroll={{ x: 'max-content' }}
                />
            </div>

            <Form.Item
                name="ticketTerms"
                label="Ticket Terms & Conditions"
                rules={[{ required: true, message: 'Please enter ticket terms' }]}
            >
                <TextArea
                    rows={6}
                    placeholder="Enter ticket terms and conditions..."
                    showCount
                    maxLength={1000}
                />
            </Form.Item>
        </Space>
    );

    // Step 5: Location
    const Location = () => (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Form.Item
                name="mapEmbedCode"
                label="Google Map Embed Code"
                rules={[{ required: true, message: 'Please enter map embed code' }]}
                tooltip="Copy the embed code from Google Maps"
            >
                <TextArea
                    rows={4}
                    placeholder='Paste Google Map embed code here...'
                    onChange={(e) => setEmbedCode(e.target.value)}
                />
            </Form.Item>

            {embedCode && (
                <Card title="Map Preview" size="small">
                    <div
                        style={{
                            width: '100%',
                            height: '400px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}
                        dangerouslySetInnerHTML={{ __html: embedCode }}
                    />
                </Card>
            )}
        </Space>
    );

    // Step 6: Media
    const Media = () => (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Form.Item
                name="eventThumbnail"
                label="Event Thumbnail"
                rules={[{ required: true, message: 'Please upload event thumbnail' }]}
                tooltip="Recommended size: 1200x630px"
            >
                <Upload
                    listType="picture-card"
                    maxCount={1}
                    beforeUpload={() => false}
                    accept="image/*"
                >
                    <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>Upload Thumbnail</div>
                    </div>
                </Upload>
            </Form.Item>

            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="youtubeUrl"
                        label="YouTube Video URL"
                        rules={[
                            { type: 'url', message: 'Please enter a valid URL' }
                        ]}
                    >
                        <Input
                            placeholder="https://youtube.com/watch?v=..."
                            size="large"
                        />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item
                        name="instagramMediaUrl"
                        label="Instagram URL"
                        rules={[
                            { type: 'url', message: 'Please enter a valid URL' }
                        ]}
                    >
                        <Input
                            placeholder="https://instagram.com/p/..."
                            size="large"
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="instagramThumbnail"
                        label="Instagram Thumbnail"
                    >
                        <Upload
                            listType="picture-card"
                            maxCount={1}
                            beforeUpload={() => false}
                            accept="image/*"
                        >
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                        </Upload>
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item
                        name="arenaLayout"
                        label="Ground/Arena Layout Image"
                    >
                        <Upload
                            listType="picture-card"
                            maxCount={1}
                            beforeUpload={() => false}
                            accept="image/*"
                        >
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Upload Layout</div>
                            </div>
                        </Upload>
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item
                name="eventGallery"
                label="Event Image Gallery (Max 5 images)"
            >
                <Upload
                    listType="picture-card"
                    multiple
                    maxCount={5}
                    beforeUpload={() => false}
                    accept="image/*"
                >
                    <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>Upload Images</div>
                    </div>
                </Upload>
            </Form.Item>
        </Space>
    );

    // Step 7: SEO
    const SEO = () => (
        <Row gutter={[16, 0]}>
            <Col xs={24}>
                <Form.Item
                    name="metaTitle"
                    label="Meta Title"
                    rules={[
                        { required: true, message: 'Please enter meta title' },
                        { max: 60, message: 'Meta title should be max 60 characters' }
                    ]}
                >
                    <Input
                        placeholder="Enter Meta Title"
                        size="large"
                        maxLength={60}
                        showCount
                    />
                </Form.Item>
            </Col>

            <Col xs={24}>
                <Form.Item
                    name="metaDescription"
                    label="Meta Description"
                    rules={[
                        { required: true, message: 'Please enter meta description' },
                        { max: 160, message: 'Meta description should be max 160 characters' }
                    ]}
                >
                    <TextArea
                        rows={3}
                        placeholder="Enter Meta Description"
                        maxLength={160}
                        showCount
                    />
                </Form.Item>
            </Col>

            <Col xs={24}>
                <Form.Item
                    name="metaKeywords"
                    label="Meta Keywords"
                    tooltip="Separate keywords with commas"
                >
                    <Input
                        placeholder="event, music, concert, live show"
                        size="large"
                    />
                </Form.Item>
            </Col>

            <Col xs={24}>
                <Form.Item
                    name="canonicalUrl"
                    label="Canonical URL"
                    rules={[
                        { type: 'url', message: 'Please enter a valid URL' }
                    ]}
                >
                    <Input
                        placeholder="https://yourwebsite.com/events/event-name"
                        size="large"
                    />
                </Form.Item>
            </Col>
        </Row>
    );

    // Step 8: Publish
    const Publish = () => (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <CheckCircleOutlined style={{ fontSize: 80, color: '#52c41a', marginBottom: 24 }} />

            <Title level={2}>Review & Publish Event</Title>

            <Paragraph style={{ fontSize: 16, color: '#666', marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
                Please review all the information you've entered before publishing your event.
                Once published, your event will be visible to all users on the platform.
            </Paragraph>

            <Alert
                message="Important Notice"
                description="Make sure all required fields are filled correctly. You can edit the event after publishing, but some changes may affect existing bookings and attendees."
                type="info"
                showIcon
                style={{ marginBottom: 32, textAlign: 'left', maxWidth: 700, margin: '0 auto 32px' }}
            />

            <Card
                title="Event Summary"
                size="small"
                style={{ maxWidth: 500, margin: '0 auto', textAlign: 'left' }}
            >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                        <Text strong>Event Name:</Text>{' '}
                        <Text>{formData.eventName || 'N/A'}</Text>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                        <Text strong>Category:</Text>{' '}
                        <Text>{formData.category || 'N/A'}</Text>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                        <Text strong>Venue:</Text>{' '}
                        <Text>{formData.venue || 'N/A'}</Text>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                        <Text strong>Location:</Text>{' '}
                        <Text>{formData.city || 'N/A'}, {formData.state || 'N/A'}</Text>
                    </div>
                </Space>
            </Card>
        </div>
    );

    const steps = [
        {
            title: 'Basic Details',
            content: <BasicDetails />,
            icon: <FormOutlined />
        },
        {
            title: 'Event Controls',
            content: <EventControls />,
            icon: <ControlOutlined />
        },
        {
            title: 'Timing',
            content: <Timing />,
            icon: <FieldTimeOutlined />
        },
        {
            title: 'Tickets',
            content: <Tickets />,
            icon: <TagsOutlined />
        },
        {
            title: 'Location',
            content: <Location />,
            icon: <EnvironmentOutlined />
        },
        {
            title: 'Media',
            content: <Media />,
            icon: <PictureOutlined />
        },
        {
            title: 'SEO',
            content: <SEO />,
            icon: <GlobalOutlined />
        },
        {
            title: 'Publish',
            content: <Publish />,
            icon: <CheckCircleOutlined />
        },
    ];

    const next = async () => {
        try {
            const values = await form.validateFields();
            setFormData({ ...formData, ...values });
            setCurrent(current + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            message.error('Please fill all required fields correctly');
        }
    };

    const prev = () => {
        setCurrent(current - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSaveDraft = async () => {
        const values = form.getFieldsValue();
        const draftData = { ...formData, ...values };
        console.log('Draft saved:', draftData);
        message.success('Draft saved successfully!');
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const finalData = { ...formData, ...values, tickets };
            console.log('Final Event Data:', finalData);
            message.success('Event published successfully!');

            // Reset form after successful submission
            setTimeout(() => {
                form.resetFields();
                setFormData({});
                setCurrent(0);
                setTickets([]);
            }, 2000);
        } catch (error) {
            message.error('Please complete all required fields');
        }
    };

    return (
        <div>
            <Card bordered={false}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
                    Create New Event
                </Title>

                <Steps
                    current={current}
                    style={{ marginBottom: 32 }}
                    responsive
                >
                    {steps.map((item) => (
                        <Step key={item.title} title={item.title} />
                    ))}
                </Steps>

                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        userDataWhileScan: 'both',
                    }}
                >
                    <div style={{ minHeight: 450, marginBottom: 24 }}>
                        {steps[current].content}
                    </div>

                    <Divider />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <Tooltip title="Save current progress">
                                <Button
                                    icon={<SaveOutlined />}
                                    onClick={handleSaveDraft}
                                    style={{ marginRight: 8 }}
                                >
                                    Save Draft
                                </Button>
                            </Tooltip>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                            {current > 0 && (
                                <Button onClick={prev} size="large">
                                    Previous
                                </Button>
                            )}

                            {current < steps.length - 1 && (
                                <Button type="primary" onClick={next} size="large">
                                    Next
                                </Button>
                            )}

                            {current === steps.length - 1 && (
                                <Button
                                    type="primary"
                                    onClick={handleSubmit}
                                    size="large"
                                    icon={<CheckCircleOutlined />}
                                >
                                    Publish Event
                                </Button>
                            )}
                        </div>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default EventStepperForm;