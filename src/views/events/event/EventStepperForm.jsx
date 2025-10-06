// EventStepperForm.jsx
import React, { useState } from 'react';
import { Steps, Form, Button, Card, Typography, message, Divider, Tooltip } from 'antd';
import {
    CheckCircleOutlined,
    SaveOutlined,
    FormOutlined,
    ControlOutlined,
    FieldTimeOutlined,
    TagsOutlined,
    EnvironmentOutlined,
    PictureOutlined,
    GlobalOutlined
} from '@ant-design/icons';

import BasicDetailsStep from './components/BasicDetails';
import EventControlsStep from './components/EventControls';
import TimingStep from './components/Timing';
import TicketsStep from './components/Tickets';
import LocationStep from './components/LocationStep';
import MediaStep from './components/MediaStep';
import SEOStep from './components/SEOStep';
import PublishStep from './components/PublishStep';
import { useNavigate } from 'react-router-dom';
import ArtistStep from './components/ArtistStep';
import { buildEventFormData, useCreateEvent } from './hooks/useEventOptions';

const { Step } = Steps;
const { Title } = Typography;

const EventStepperForm = () => {
    const navigate = useNavigate();
    const [current, setCurrent] = useState(0);
    const [form] = Form.useForm();
    const [formData, setFormData] = useState({});
    const [embedCode, setEmbedCode] = useState('');
    const [tickets, setTickets] = useState([
        { key: '1', name: 'General', price: '500', quantity: '100' },
        { key: '2', name: 'VIP', price: '1000', quantity: '50' },
    ]);

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

    const handleEmbedChange = (e) => {
        setEmbedCode(e.target.value);
    };

    const steps = [
        {
            title: 'Basic Details',
            content: <BasicDetailsStep form={form} />,
            icon: <FormOutlined />
        },
        {
            title: 'Event Controls',
            content: <EventControlsStep form={form} />,
            icon: <ControlOutlined />
        },
        {
            title: 'Timing & Location',
            content: <TimingStep form={form} />,
            icon: <FieldTimeOutlined />
        },
        {
            title: 'Tickets',
            content: <TicketsStep
                tickets={tickets}
                form={form}
                embedCode={embedCode}
                onEmbedChange={handleEmbedChange}
                onAddTicket={handleAddTicket}
                onDeleteTicket={handleDeleteTicket}
            />,
            icon: <TagsOutlined />
        },
        {
            title: 'Artist',
            content: <ArtistStep form={form} />,
            icon: <EnvironmentOutlined />
        },
        {
            title: 'Media',
            content: <MediaStep form={form} />,
            icon: <PictureOutlined />
        },
        {
            title: 'SEO',
            content: <SEOStep form={form} />,
            icon: <GlobalOutlined />
        },
        {
            title: 'Publish',
            content: <PublishStep formData={formData} />,
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

const { mutateAsync: createEvent, isLoading: creating } = useCreateEvent({
  onSuccess: (res) => {
    message.success(res?.message || 'Event created successfully!');
    form.resetFields();
    setFormData({});
    setTickets([]);
    setCurrent(0);
  },
  onError: (error) => {
    message.error(error?.message || 'Failed to create event');
  },
});

const handleSubmit = async () => {
  try {
    const values = await form.validateFields();

    const merged = {
      ...formData,
      ...values,
      tickets, // keep tickets in the payload; helper will JSON.stringify it
    };

    const formDataBody = buildEventFormData(merged);
    console.log('Submitting (multipart):', [...formDataBody.entries()]); // dev only
    await createEvent(formDataBody);
  } catch (error) {
    message.error('Please complete all required fields before publishing.');
  }
};


    return (
        <div>
            <Card bordered={false}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
                    Create New Event
                </Title>

                <Steps current={current} style={{ marginBottom: 32 }} responsive>
                    {steps.map((item) => (
                        <Step key={item.title} title={item.title} />
                    ))}
                </Steps>

                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ userDataWhileScan: 'both' }}
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