// SEOStep.jsx
import React from 'react';
import { Form, Input, Row, Col, Button } from 'antd';
import api from 'auth/FetchInterceptor';

const { TextArea } = Input;

const generateSEO = async () => {
    const response = await api.post("/generate-seo", {

        date: "27/12/2025",
        name: "DJ Party",
        description: "DJ Party",
        location: "Delhi",
        city: "Delhi",
        organisation: "Sunburn",
        category: "Music",

    });
    console.log(response.data);
}
const SEOStep = () => (
    <Row gutter={[16, 0]}>
        <Button onClick={generateSEO}>Generate SEO</Button>
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

        <Col xs={24}>
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
        </Col>
    </Row>
);

export default SEOStep;