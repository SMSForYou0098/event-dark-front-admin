// SEOStep.jsx
import React, { useEffect } from 'react';
import { Form, Input, Row, Col, Button, Typography, message, Switch, Divider } from 'antd';
import { Sparkles, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { PRIMARY } from 'utils/consts';
import Utils from 'utils';

const { TextArea } = Input;
const { Text } = Typography;

const SEOStep = ({ form, eventKey, eventData, componentLoader, setComponentLoader }) => {
    // TanStack Query mutation for SEO generation
    const { mutate: generateSEO, isPending: generating } = useMutation({
        mutationFn: async () => {
            if (!eventKey) {
                throw new Error('Event key is required');
            }
            const response = await api.get(`/generate-seo/${eventKey}`);
            if (response?.status === false) {
                throw new Error(Utils.getErrorMessage(response, 'Failed to generate SEO content'));
            }
            return response;
        },
        onSuccess: (response) => {
            // Auto-fill form fields with generated data from nested seo object
            if (response?.seo) {
                const {
                    seo_title,
                    meta_description,
                    keywords,
                    focus_keyword
                } = response.seo;

                // Convert keywords array to comma-separated string
                const keywordsString = Array.isArray(keywords) ? keywords.join(', ') : '';

                form.setFieldsValue({
                    meta_title: seo_title || '',
                    meta_description: meta_description || '',
                    meta_keyword: keywordsString || '',
                    meta_tag: focus_keyword || '',
                });

                message.success('SEO content generated successfully!');
            }
        },
        onError: (error) => {
            console.error('SEO generation failed:', error);
            message.error(Utils.getErrorMessage(error, 'Failed to generate SEO content'));
        },
    });

    useEffect(() => {
        if (generating) {
            setComponentLoader(true);
        } else {
            setComponentLoader(false);
        }
    }, [generating]);

    return (
        <div style={{ position: 'relative' }}>
            {/* AI Loading Overlay */}
            {generating && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        borderRadius: '8px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '20px',
                        }}
                    >
                        {/* Animated Gemini Icon */}
                        <div
                            style={{
                                position: 'relative',
                                width: '80px',
                                height: '80px',
                            }}
                        >
                            <Sparkles
                                size={80}
                                style={{
                                    color: PRIMARY,
                                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                                }}
                            />
                            {/* <Loader2
                                size={40}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    color: '#fff',
                                    animation: 'spin 1s linear infinite',
                                }}
                            /> */}
                        </div>

                        {/* Loading Text */}
                        <div style={{ textAlign: 'center' }}>
                            <Text
                                style={{
                                    color: '#fff',
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    display: 'block',
                                    marginBottom: '8px',
                                }}
                            >
                                Generating SEO with AI
                            </Text>
                            <Text
                                style={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: '14px',
                                }}
                            >
                                Creating optimized meta tags for your event...
                            </Text>
                        </div>

                        {/* Animated Dots */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#4285f4',
                                        animation: `bounce 1.4s infinite ease-in-out ${i * 0.16}s`,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* CSS Animations */}
                    <style>
                        {`
                            @keyframes pulse {
                                0%, 100% {
                                    opacity: 1;
                                    transform: scale(1);
                                }
                                50% {
                                    opacity: 0.5;
                                    transform: scale(1.1);
                                }
                            }
                            
                            @keyframes spin {
                                from {
                                    transform: translate(-50%, -50%) rotate(0deg);
                                }
                                to {
                                    transform: translate(-50%, -50%) rotate(360deg);
                                }
                            }
                            
                            @keyframes bounce {
                                0%, 80%, 100% {
                                    transform: scale(0);
                                    opacity: 0.5;
                                }
                                40% {
                                    transform: scale(1);
                                    opacity: 1;
                                }
                            }
                        `}
                    </style>
                </div>
            )}

            <Row gutter={[16, 0]}>
                <Col xs={24} className="mb-2 text-right">
                    <Button
                        type="primary"
                        icon={<Sparkles size={14} />}
                        onClick={() => generateSEO()}
                        loading={generating}
                        disabled={!eventKey || generating}

                    >
                        {generating ? 'Generating...' : 'Generate SEO with AI'}
                    </Button>
                    {!eventKey && (
                        <Text type="secondary" style={{ marginLeft: '12px' }}>
                            Save event first to generate SEO
                        </Text>
                    )}
                </Col>

                <Col xs={24}>
                    <Form.Item
                        name="meta_title"
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
                        name="meta_description"
                        label="Meta Description"
                        rules={[
                            { required: true, message: 'Please enter meta description' },
                            { max: 280, message: 'Meta description should be max 280 characters' }
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
                        name="meta_keyword"
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
                        name="meta_tag"
                        label="Meta Tags"
                        tooltip="Separate tags with commas"
                    >
                        <Input
                            placeholder="event, music, concert, live show"
                            size="large"
                        />
                    </Form.Item>
                </Col>

                <Col xs={24}>
                    <Divider orientation="left">Tracking & Analytics</Divider>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item name="google_tag_manager_id" label="Google Tag Manager ID">
                        <Input placeholder="GTM-XXXXXXX" size="large" />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item name="google_analytics_id" label="Google Analytics ID">
                        <Input placeholder="G-XXXXXXXXXX" size="large" />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item name="google_ads_conversion_id" label="Google Ads Conversion ID">
                        <Input placeholder="AW-XXXXXXXXXX" size="large" />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item name="meta_pixel_id" label="Meta Pixel ID">
                        <Input placeholder="123456789012345" size="large" />
                    </Form.Item>
                </Col>

                <Col xs={24}>
                    <Divider orientation="left">Schema Markup</Divider>
                </Col>

                <Col xs={24}>
                    <Form.Item name="schema_enabled" label="Enable Schema Markup" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Col>

                <Col xs={24}>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.schema_enabled !== currentValues.schema_enabled}
                    >
                        {({ getFieldValue }) => {
                            const isEnabled = getFieldValue('schema_enabled');

                            // Generate dynamic default schema if enabled and no string is set yet
                            if (isEnabled && !getFieldValue('schema_override_json') && eventKey && eventKey !== 'new') {
                                // Extract required dynamic data from the form's other state if available
                                // Some data comes from other steps. Form instance should have them if we've been there.
                                // We are making a best effort to assemble this dynamically.
                                const name = eventData?.name || getFieldValue('name') || '';
                                const description = eventData?.description || getFieldValue('description') || '';
                                const startDateRaw = eventData?.date_range || getFieldValue('date_range') || '';
                                let startDate = '';
                                let endDate = '';

                                if (startDateRaw) {
                                    const dates = startDateRaw.split(',');
                                    startDate = dates[0]?.trim() || '';
                                    endDate = dates[1]?.trim() || '';

                                    // Append start_time/end_time if available
                                    const st = eventData?.start_time || getFieldValue('start_time');
                                    const et = eventData?.end_time || getFieldValue('end_time');

                                    if (startDate && st) startDate = `${startDate}T${st}:00+05:30`;
                                    if (endDate && et) endDate = `${endDate}T${et}:00+05:30`;
                                    else if (startDate && et) endDate = `${startDate}T${et}:00+05:30`;
                                }

                                const orgName = eventData?.user?.organisation || (typeof getFieldValue('user') === 'object' ? getFieldValue('user')?.organisation : '');
                                const cityName = eventData?.venue?.city || '';
                                const venueName = eventData?.venue?.name || '';
                                const thumbnail = eventData?.event_media?.thumbnail || getFieldValue('thumbnail') || '';

                                // helper to slugify strings for URL
                                const slugify = (text) => text?.toString().toLowerCase()
                                    .replace(/\s+/g, '-')           // Replace spaces with -
                                    .replace(/[^\w-]+/g, '')       // Remove all non-word chars
                                    .replace(/--+/g, '-')         // Replace multiple - with single -
                                    .replace(/^-+/, '')             // Trim - from start of text
                                    .replace(/-+$/, '');            // Trim - from end of text

                                const dynamicUrl = `https://getyourticket.in/events/${slugify(cityName)}/${slugify(orgName)}/${slugify(name)}/${eventData?.event_key || eventKey}`;

                                const defaultSchema = {
                                    "@context": "https://schema.org",
                                    "@type": "Event",
                                    "name": name,
                                    "url": dynamicUrl,
                                    "description": description.replace(/(<([^>]+)>)/gi, ""), // Strip HTML tags
                                    "startDate": startDate,
                                    "endDate": endDate,
                                    "eventStatus": "https://schema.org/EventScheduled",
                                    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                                    "location": {
                                        "@type": "Place",
                                        "name": venueName || "Venue Name",
                                        "address": {
                                            "@type": "PostalAddress",
                                            "addressLocality": cityName || "City",
                                            "addressRegion": "Gujarat"
                                        }
                                    },
                                    "organizer": {
                                        "@type": "Organization",
                                        "name": orgName,
                                        "url": "https://getyourticket.in"
                                    },
                                    "image": thumbnail || "https://getyourticket.in/uploads/default-event.jpg",
                                    "offers": {
                                        "@type": "Offer",
                                        "url": `${dynamicUrl}`,
                                        "priceCurrency": "INR",
                                        "availability": "https://schema.org/InStock"
                                    }
                                };

                                // To correctly update the field inside a render prop, we wait for a tick
                                setTimeout(() => {
                                    form.setFieldValue('schema_override_json', JSON.stringify(defaultSchema, null, 2));
                                }, 0);
                            }

                            return isEnabled ? (
                                <Form.Item
                                    name="schema_override_json"
                                    label="Schema Override JSON"
                                    tooltip="Enter custom JSON-LD schema to override the default generated schema."
                                >
                                    <TextArea
                                        rows={12}
                                        placeholder='{&#10;  "@context": "https://schema.org",&#10;  "@type": "Event",&#10;  "name": "Event Name",&#10;  ...&#10;}'
                                        style={{ fontFamily: 'monospace' }}
                                    />
                                </Form.Item>
                            ) : null;
                        }}
                    </Form.Item>
                </Col>

                {/* <Col xs={24}>
                    <Form.Item
                        name="canonicalUrl"
                        label="Canonical URL"
                        rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
                    >
                        <Input
                            placeholder="https://yourwebsite.com/events/event-name"
                            size="large"
                        />
                    </Form.Item>
                </Col> */}
            </Row>
        </div>
    );
};

export default SEOStep;