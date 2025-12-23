// SEOStep.jsx
import React from 'react';
import { Form, Input, Row, Col, Button, Typography, message } from 'antd';
import { Sparkles, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { PRIMARY } from 'utils/consts';

const { TextArea } = Input;
const { Text } = Typography;

const SEOStep = ({ form, eventKey }) => {
    // TanStack Query mutation for SEO generation
    const { mutate: generateSEO, isPending: generating } = useMutation({
        mutationFn: async () => {
            if (!eventKey) {
                throw new Error('Event key is required');
            }
            const response = await api.get(`/generate-seo/${eventKey}`);
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
            message.error(error?.message || 'Failed to generate SEO content');
        },
    });

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