// EventStepperForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    Steps,
    Form,
    Button,
    Card,
    Typography,
    message,
    Divider,
    Tooltip,
    Spin,
} from 'antd';
import {
    CheckCircleOutlined,
    SaveOutlined,
    FormOutlined,
    ControlOutlined,
    FieldTimeOutlined,
    TagsOutlined,
    EnvironmentOutlined,
    PictureOutlined,
    GlobalOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import BasicDetailsStep from './components/BasicDetails';
import EventControlsStep from './components/EventControls';
import TimingStep from './components/Timing';
import TicketsStep from './components/Tickets';
import LocationStep from './components/LocationStep';
import MediaStep from './components/MediaStep';
import SEOStep from './components/SEOStep';
import PublishStep from './components/PublishStep';
import ArtistStep from './components/ArtistStep';

import {
    buildEventFormData,
    useCreateEvent,
    useUpdateEvent,
    useEventDetail,
    toUploadFileList,
} from './hooks/useEventOptions';

const { Step } = Steps;
const { Title } = Typography;

const EventStepperForm = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // <-- edit id from route
    const isEdit = !!id;

    const [current, setCurrent] = useState(0);
    const [form] = Form.useForm();
    const [formShadow, setFormShadow] = useState({}); // incremental cache between steps
    const [embedCode, setEmbedCode] = useState('');
    const [tickets, setTickets] = useState([
        { key: '1', name: 'General', price: '500', quantity: '100' },
        { key: '2', name: 'VIP', price: '1000', quantity: '50' },
    ]);

    // ---------- LOAD FOR EDIT ----------
    const {
        data: detail,
        isLoading: loadingDetail,
        isError: detailError,
    } = useEventDetail(id, { enabled: isEdit });

    useEffect(() => {
        if (!isEdit || !detail) return;

        // Map API -> form fields used across steps
        const patch = {
            // Basic details / selects
            user_id: detail?.user_id && String(detail.user_id), // or "user" if you renamed it; keep in sync with BasicDetailsStep
            category: detail?.category?.id,
            name: detail?.name,
            country: detail?.country,
            state: detail?.state,
            city: detail?.city,
            venue_id: detail?.venue_id,
            description: detail?.description,

            // Controls (numeric flags 0/1)
            scan_detail: detail?.scan_detail ?? '2',
            event_feature: Number(detail?.event_feature) || 0,
            status: Number(detail?.status) || 0,
            house_full: Number(detail?.house_full) || 0,
            online_att_sug: Number(detail?.online_att_sug) || 0,
            offline_att_sug: Number(detail?.offline_att_sug) || 0,
            multi_scan: Number(detail?.multi_scan) || 0,
            ticket_system: Number(detail?.ticket_system) || 0,
            bookingBySeat: Number(detail?.bookingBySeat) || 0,
            insta_whts_url: detail?.insta_whts_url || undefined,
            whts_note: detail?.whts_note || undefined,

            // Timing hidden API strings
            date_range: detail?.date_range,
            entry_time: detail?.entry_time,
            start_time: detail?.start_time,
            end_time: detail?.end_time,
            event_type: detail?.event_type, // "daily" | "seasonal"
            map_code: detail?.map_code || undefined,
            address: detail?.address || undefined,

            // SEO
            tags: detail?.meta_tag,
            keyword: detail?.meta_keyword,
            meta_title: detail?.meta_title,
            meta_description: detail?.meta_description,

            // tickets
            ticket_terms: detail?.ticket_terms || undefined,

        };

        // Hydrate visible timing pickers.
        if (detail?.date_range) {
            const [s, e] = detail.date_range.split(',').map((x) => x.trim());
            const ds = dayjs(s, ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD'], true);
            const de = dayjs(e, ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD'], true);
            if (ds.isValid() && de.isValid()) patch.dateRange = [ds, de];
        }
        if (detail?.thumbnail) {
            patch.thumbnail = [
                {
                    uid: 'existing-thumb',
                    name: 'current-thumbnail.jpg',
                    status: 'done',
                    url: detail.thumbnail,
                },
            ];
        }
         // ✅ hydrate images for AntD Upload
  if (detail.images) {
    patch.images = toUploadFileList(detail.images);
  }

        if (detail?.insta_thumb) {
            patch.insta_thumb = [
                {
                    uid: 'ig-thumb',
                    name: 'instagram-thumb.jpg',
                    status: 'done',
                    url: detail.insta_thumb,
                },
            ];
        }

        if (detail?.layout_image) {
            patch.layout_image = [
                {
                    uid: 'arena-layout',
                    name: 'arena-layout.jpg',
                    status: 'done',
                    url: detail.layout_image,
                },
            ];
        }


        // Tickets
        if (Array.isArray(detail?.tickets) && detail.tickets.length) {
            setTickets(detail.tickets.map((t, idx) => ({ key: String(idx + 1), ...t })));
        }

        form.setFieldsValue(patch);
        setFormShadow((prev) => ({ ...prev, ...patch }));
    }, [isEdit, detail, form]);

    // ---------- MUTATIONS ----------
    const { mutateAsync: createEvent, isLoading: creating } = useCreateEvent({
        onSuccess: (res) => {
            message.success(res?.message || 'Event created successfully!');
            form.resetFields();
            setFormShadow({});
            setTickets([]);
            setCurrent(0);
            // navigate('/events'); // optionally go back
        },
        onError: (error) => {
            message.error(error?.message || 'Failed to create event');
        },
    });

    const { mutateAsync: updateEvent, isLoading: updating } = useUpdateEvent({
        onSuccess: (res) => {
            message.success(res?.message || 'Event updated successfully!');
            // navigate(`/events/${id}`); // optionally go to detail
        },
        onError: (error) => {
            message.error(error?.message || 'Failed to update event');
        },
    });

    // ---------- TICKETS HANDLERS ----------
    const handleDeleteTicket = (key) => {
        setTickets((prev) => prev.filter((t) => t.key !== key));
        message.success('Ticket deleted successfully');
    };
    const handleAddTicket = () => {
        setTickets((prev) => {
            const newKey = String(prev.length + 1);
            return [...prev, { key: newKey, name: `Ticket ${newKey}`, price: '0', quantity: '0' }];
        });
        message.success('Ticket added successfully');
    };
    const handleEmbedChange = (e) => setEmbedCode(e.target.value);

    // ---------- STEPS ----------
    const steps = useMemo(
        () => [
            { title: 'Basic Details', content: <BasicDetailsStep isEdit={isEdit} form={form} />, icon: <FormOutlined /> },
            { title: 'Event Controls', content: <EventControlsStep isEdit={isEdit} form={form} />, icon: <ControlOutlined /> },
            { title: 'Timing & Location', content: <TimingStep isEdit={isEdit} form={form} />, icon: <FieldTimeOutlined /> },
            {
                title: 'Tickets',
                content: (
                    <TicketsStep
                        tickets={tickets}
                        form={form}
                        embedCode={embedCode}
                        onEmbedChange={handleEmbedChange}
                        onAddTicket={handleAddTicket}
                        onDeleteTicket={handleDeleteTicket}
                    />
                ),
                icon: <TagsOutlined />,
            },
            { title: 'Artist', content: <ArtistStep form={form} />, icon: <EnvironmentOutlined /> },
            { title: 'Media', content: <MediaStep form={form} />, icon: <PictureOutlined /> },
            { title: 'SEO', content: <SEOStep form={form} />, icon: <GlobalOutlined /> },
            { title: 'Publish', content: <PublishStep formData={formShadow} />, icon: <CheckCircleOutlined /> },
        ],
        [form, tickets, embedCode, formShadow]
    );

    // ---------- NAV ----------
    const next = async () => {
        try {
            const values = await form.validateFields();
            setFormShadow((prev) => ({ ...prev, ...values }));
            setCurrent((c) => c + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            message.error('Please fill all required fields correctly');
        }
    };

    const prev = () => {
        setCurrent((c) => c - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSaveDraft = () => {
        const values = form.getFieldsValue();
        const draftData = { ...formShadow, ...values };
        // Store locally or call your draft endpoint here
        // localStorage.setItem('eventDraft', JSON.stringify(draftData));
        message.success('Draft saved successfully!');
    };

    // ---------- SUBMIT ----------
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const merged = {
                ...formShadow,
                ...values,
                tickets, // builder will JSON.stringify it
            };

            const body = buildEventFormData(merged);

            if (isEdit) {
                await updateEvent({ id, body });
            } else {
                await createEvent(body);
            }
        } catch {
            message.error('Please complete all required fields before submitting.');
        }
    };

    // ---------- RENDER ----------
    if (isEdit && loadingDetail) {
        return (
            <Card bordered={false} style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
            </Card>
        );
    }

    if (isEdit && detailError) {
        return (
            <Card bordered={false}>
                <Typography.Text type="danger">Failed to load event details.</Typography.Text>
            </Card>
        );
    }

    return (
        <div>
            <Card bordered={false}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
                    {isEdit ? 'Edit Event' : 'Create New Event'}
                </Title>

                <Steps current={current} style={{ marginBottom: 32 }} responsive>
                    {steps.map((item) => (
                        <Step key={item.title} title={item.title} />
                    ))}
                </Steps>

                <Form form={form} layout="vertical" initialValues={{ userDataWhileScan: 'both' }}>
                    <div style={{ minHeight: 450, marginBottom: 24 }}>{steps[current].content}</div>

                    <Divider />

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 12,
                        }}
                    >
                        <div>
                            <Tooltip title="Save current progress">
                                <Button icon={<SaveOutlined />} onClick={handleSaveDraft} style={{ marginRight: 8 }}>
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
                                    loading={creating || updating}
                                    icon={<CheckCircleOutlined />}
                                >
                                    {isEdit ? 'Update Event' : 'Publish Event'}
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
