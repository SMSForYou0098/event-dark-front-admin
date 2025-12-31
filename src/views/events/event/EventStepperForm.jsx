import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
    Image,
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
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
import { useMyContext } from 'Context/MyContextProvider';
import { useGetAllContentMaster } from '../EventContent/useContentMaster';

const { Step } = Steps;
const { Title } = Typography;

// Step name mapping for API queries
const STEP_NAMES = {
    0: 'basic',
    1: 'controls',
    2: 'timing',
    3: 'tickets',
    4: 'artist',
    5: 'media',
    6: 'seo',
    7: 'publish',
};

const EventStepperForm = () => {
    const navigate = useNavigate();
    const { loader, UserData, userRole } = useMyContext()
    const location = useLocation();
    const { id } = useParams();
    const isEdit = !!id;

    const [current, setCurrent] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('step')) || 0;
    });
    const [form] = Form.useForm();
    const [tickets, setTickets] = useState([]);
    const [layouts, setLayouts] = useState([]);
    const [eventLayoutId, setEventLayoutId] = useState(null)
    const [embedCode, setEmbedCode] = useState('');

    // Sync step from location state
    useEffect(() => {
        const stepFromState = location.state?.step;
        if (typeof stepFromState === 'number' && stepFromState >= 0 && stepFromState < 8) {
            setCurrent(stepFromState);
        }
    }, [location.state?.step]);

    // Load event details for current step only
    const stepName = STEP_NAMES[current];
    const { data: detail, isLoading: loadingDetail, isError: detailError, refetch: refetchDetail } = useEventDetail(
        id,
        stepName,
        { enabled: isEdit }
    );

    // Populate form with event details based on current step
    useEffect(() => {
        if (!isEdit || !detail) return;

        const controls = detail?.event_controls ?? {};
        const event_galleries = detail?.event_media ?? {};
        const event_seo = detail?.event_seo ?? {};

        const patch = {};

        // Always set org_id if available (needed for ContentSelect components in all steps)
        if (detail?.user_id) {
            patch.org_id = String(detail.user_id);
        }

        // Step 0: Basic Details
        if (current === 0) {
            Object.assign(patch, {
                org_id: detail?.user_id && String(detail.user_id),
                category: detail?.category?.id,
                name: detail?.name,
                country: detail?.country,
                state: detail?.state,
                city: detail?.city,
                venue_id: detail?.venue_id,
                description: detail?.description,
            });
        }

        // Step 1: Event Controls
        if (current === 1) {
            // Helper to convert API values (could be boolean, number, or string) to boolean
            const toBool = (v) => v === true || v === 1 || v === '1';

            // Parse expected_date if it exists (from controls object)
            let expectedDateValue = undefined;
            if (controls?.expected_date) {
                const parsed = dayjs(controls.expected_date);
                expectedDateValue = parsed.isValid() ? parsed : undefined;
            }

            // Handle scan_detail - convert boolean/number to number for Select
            let scanDetailValue = 2; // default
            if (controls?.scan_detail !== undefined && controls?.scan_detail !== null) {
                // If it's a boolean, convert: true -> 2, false -> 0
                if (typeof controls.scan_detail === 'boolean') {
                    scanDetailValue = controls.scan_detail ? 2 : 0;
                } else {
                    scanDetailValue = Number(controls.scan_detail);
                }
            }

            Object.assign(patch, {
                scan_detail: scanDetailValue,
                event_feature: toBool(controls?.event_feature),
                status: toBool(controls?.status),
                house_full: toBool(controls?.house_full),
                online_att_sug: toBool(controls?.online_att_sug),
                offline_att_sug: toBool(controls?.offline_att_sug),
                show_on_home: toBool(controls?.show_on_home),
                expected_date: expectedDateValue,
                is_sold_out: toBool(controls?.is_sold_out),
                is_postponed: toBool(controls?.is_postponed),
                is_cancelled: toBool(controls?.is_cancelled),

                // storing instagram post id from url
                insta_whts_url: detail?.insta_whts_url || '',
                whts_note: detail?.whts_note || undefined,
                booking_notice: detail?.booking_notice || undefined,
            });
        }

        // Step 2: Timing & Location
        if (current === 2) {
            Object.assign(patch, {
                date_range: detail?.date_range,
                entry_time: detail?.entry_time,
                start_time: detail?.start_time,
                end_time: detail?.end_time,
                event_type: detail?.event_type,
                overnight_event: Number(controls?.overnight_event) || 0,
                // map_code: detail?.map_code || undefined,
                // address: detail?.address || undefined,
            });

            if (detail?.date_range) {
                const [s, e] = detail.date_range.split(',').map((x) => x.trim());
                const ds = dayjs(s, ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD'], true);
                const de = dayjs(e, ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD'], true);
                if (ds.isValid() && de.isValid()) patch.dateRange = [ds, de];
            }
        }

        // Step 3: Tickets
        if (current === 3) {
            const toBool = (v) => v === true || v === 1 || v === '1';
            const ticketSystem = Number(controls?.ticket_system) || 0;
            // If both are 0 from backend, default to ticket_system = 1
            const finalTicketSystem = ticketSystem === 0 ? 1 : 0;
            const finalBookingBySeat = ticketSystem === 1 ? 1 : 0;
            Object.assign(patch, {
                multi_scan: toBool(controls?.multi_scan),
                ticket_system: finalTicketSystem,
                bookingBySeat: finalBookingBySeat,
                ticket_terms: detail?.ticket_terms || undefined,
            });
            setEventLayoutId(detail?.event_has_layout?.layout_id)
            setLayouts(detail?.layout)
            if (Array.isArray(detail?.tickets) && detail.tickets.length) {
                setTickets(detail.tickets.map((t, idx) => ({ key: String(idx + 1), ...t })));
            }
        }

        // Step 4: Artist
        if (current === 4) {
            Object.assign(patch, {
                artist_id: detail?.artist_id
                    ? detail.artist_id.split(',').map((id) => Number(id.trim()))
                    : [],
            });
        }

        // Step 5: Media
        if (current === 5) {
            if (event_galleries?.thumbnail) {
                patch.thumbnail = [{
                    uid: 'existing-thumb',
                    name: 'current-thumbnail.jpg',
                    status: 'done',
                    url: event_galleries.thumbnail,
                }];
            }

            if (event_galleries.images) {
                patch.images = toUploadFileList(event_galleries.images);
            }

            if (event_galleries?.insta_thumb) {
                patch.insta_thumb = [{
                    uid: 'ig-thumb',
                    name: 'instagram-thumb.jpg',
                    status: 'done',
                    url: event_galleries.insta_thumb,
                }];
            }

            if (event_galleries?.layout_image) {
                patch.layout_image = [{
                    uid: 'arena-layout',
                    name: 'arena-layout.jpg',
                    status: 'done',
                    url: event_galleries.layout_image,
                }];
            }
        }

        // Step 6: SEO
        if (current === 6) {
            Object.assign(patch, {
                meta_tag: event_seo?.meta_tag,
                meta_keyword: event_seo?.meta_keyword,
                meta_title: event_seo?.meta_title,
                meta_description: event_seo?.meta_description,
            });
        }

        // Only update form if we have data for this step
        if (Object.keys(patch).length > 0) {
            form.setFieldsValue(patch);
        }
    }, [isEdit, detail, form, current]);




    const { mutateAsync: createEvent, isPending: creating } = useCreateEvent({
        onSuccess: (res) => {
            message.success(res?.message || 'Event created successfully!');
            const eventId = res?.event?.event_key || res?.data?.event_key || res?.event_key;
            // refetchDetail();
            if (eventId) {
                setTimeout(() => {
                    navigate(`/events/update/${eventId}`, { state: { step: 1 } });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 500);
            } else {
                message.error('Event created but ID not found. Please refresh.');
            }
        },
        onError: (error) => {
            message.error(error?.message || 'Failed to create event');
        },
    });

    const { mutateAsync: updateEvent, isPending: updating } = useUpdateEvent({
        onSuccess: (res) => {
            message.success(res?.message || 'Event updated successfully!');
            refetchDetail();
        },
        onError: (error) => {
            message.error(error?.message || 'Failed to update event');
        },
    });

    // Ticket handlers
    const handleDeleteTicket = useCallback((key) => {
        setTickets((prev) => prev.filter((t) => t.key !== key));
        message.success('Ticket deleted successfully');
    }, []);

    const handleAddTicket = useCallback(() => {
        setTickets((prev) => {
            const newKey = String(prev.length + 1);
            return [...prev, { key: newKey, name: `Ticket ${newKey}`, price: '0', quantity: '0' }];
        });
        message.success('Ticket added successfully');
    }, []);

    const handleEmbedChange = useCallback((e) => setEmbedCode(e.target.value), []);

    // Memoized form data from form values + tickets
    const getFormData = useCallback(() => {
        const values = form.getFieldsValue();
        return { ...values, tickets };
    }, [form, tickets]);
    // Get orgId from detail or form (form is more reliable as it's set in all steps)
    const orgId = detail?.user_id || form.getFieldValue('org_id');
    // Steps configuration
    const steps = useMemo(
        () => [
            { title: 'Basic Details', content: <BasicDetailsStep isEdit={isEdit} form={form} />, icon: <FormOutlined /> },
            { title: 'Event Controls', content: <EventControlsStep isEdit={isEdit} form={form} orgId={orgId} />, icon: <ControlOutlined /> },
            { title: 'Timing', content: <TimingStep isEdit={isEdit} form={form} />, icon: <FieldTimeOutlined /> },
            {
                title: 'Tickets',
                content: (
                    <TicketsStep
                        tickets={tickets}
                        layouts={layouts}
                        eventLayoutId={eventLayoutId}
                        form={form}
                        orgId={orgId}
                        embedCode={embedCode}
                        onEmbedChange={handleEmbedChange}
                        onAddTicket={handleAddTicket}
                        onDeleteTicket={handleDeleteTicket}
                        eventId={detail?.event_key}
                        eventName={detail?.name}
                    />
                ),
                icon: <TagsOutlined />,
            },
            { title: 'Artist', content: <ArtistStep artistList={detail?.artists} form={form} />, icon: <EnvironmentOutlined /> },
            { title: 'Media', content: <MediaStep form={form} />, icon: <PictureOutlined /> },
            { title: 'SEO', content: <SEOStep form={form} eventKey={id} />, icon: <GlobalOutlined /> },
            { title: 'Publish', content: <PublishStep eventData={detail} formData={getFormData()} />, icon: <CheckCircleOutlined /> },
        ],
        [form, tickets, embedCode, isEdit, handleEmbedChange, handleAddTicket, handleDeleteTicket, getFormData, detail]
    );

    // Navigation handlers
    const next = async () => {
        try {
            await form.validateFields();

            // Create event on first step if not in edit mode
            if (current === 0 && !isEdit) {
                const formValues = getFormData();
                const body = buildEventFormData({
                    ...formValues,
                    step: stepName,
                });
                await createEvent(body);
                return; // Navigation handled in onSuccess
            }

            // Update event if we have an ID
            if (id && current < steps.length - 1) {
                const formValues = getFormData();
                const body = buildEventFormData({
                    ...formValues,
                    step: stepName,
                });
                await updateEvent({ id, body });
                window.scrollTo({ top: 0, behavior: 'smooth' });
                if (current === 6) {
                    message.success('Event ready to publish!');
                }
                else {
                    setCurrent((c) => c + 1);
                }
                return;
            }

            // Default: just move to next step
            setCurrent((c) => c + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            // console.error('Validation error:', error);
            message.error('Please fill all required fields correctly');
        }
    };

    const prev = useCallback(() => {
        setCurrent((c) => c - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleSaveDraft = useCallback(async () => {
        try {
            // Get all current form values
            const draftValues = getFormData();

            // Force status to 0 for drafts
            const body = buildEventFormData({
                ...draftValues,
                step: stepName,
            }, true);

            if (id) {
                await updateEvent({ id, body });
                message.success('Draft saved successfully!');
                navigate(-1)
            } else {
                message.error('Cannot save draft: Event ID missing.');
            }
        } catch (error) {
            console.error('Save draft error:', error);
            message.error('Failed to save draft. Please check your form.');
        }
    }, [getFormData, id, updateEvent]);


    const handleSubmit = async () => {
        try {
            await form.validateFields();

            // Get all current form values and force status = 1 (published)
            const values = getFormData();
            const body = buildEventFormData({
                ...values,
                status: 1,
                step: 'publish',
            });

            if (id) {
                await updateEvent({ id, body });
                message.success('Event published successfully!');
                setCurrent((c) => c + 1);
                //   setTimeout(() => navigate('/app/apps/events'), 1500);
            } else {
                message.error('Cannot publish: Event ID missing. Please try again.');
            }
        } catch (error) {
            console.error('Submit error:', error);
            message.error('Please complete all required fields before submitting.');
        }
    };


    const isLoading = creating || updating;

    // Loading state
    if (isEdit && loadingDetail) {
        return (
            <Card bordered={false} style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* <Spin size="large" tip={`Loading ${STEP_NAMES[current]} details...`} /> */}
                <Image src={loader} width={150} preview={false} />
            </Card>
        );
    }

    // Error state
    if (isEdit && detailError) {
        return (
            <Card bordered={false}>
                <Typography.Text type="danger">Failed to load event details.</Typography.Text>
                <Button type="primary" onClick={() => navigate('/app/apps/events/create')} style={{ marginTop: 16 }}>
                    Create New Event Instead
                </Button>
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
                        {
                            isEdit && current !== steps.length - 1 &&
                            <Tooltip title="Save current progress">
                                <Button icon={<SaveOutlined />} onClick={handleSaveDraft} disabled={isLoading}>
                                    Save Draft
                                </Button>
                            </Tooltip>
                        }

                        <div style={{ display: 'flex', gap: 8 }}>
                            {current > 0 && current !== steps.length - 1 && (
                                <Button onClick={prev} size="large" disabled={isLoading}>
                                    Previous
                                </Button>
                            )}

                            {current < steps.length - 1 && (
                                <Button
                                    type="primary"
                                    onClick={next}
                                    size="large"
                                    loading={isLoading}
                                    disabled={isLoading}
                                >
                                    {current === 0 && !isEdit ? 'Create & Continue' : 'Save & Continue'}
                                </Button>
                            )}

                            {current === steps.length - 2 && (
                                <Button
                                    type="primary"
                                    onClick={handleSubmit}
                                    size="large"
                                    loading={isLoading}
                                    disabled={isLoading}
                                    icon={<CheckCircleOutlined />}
                                >
                                    Publish Event
                                </Button>
                            )}
                            {

                            }
                        </div>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default EventStepperForm;