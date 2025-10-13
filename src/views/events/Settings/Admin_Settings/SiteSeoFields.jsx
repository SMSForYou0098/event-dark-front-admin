import React from 'react'
import { Col, Row, Form, Input, Divider, Typography } from 'antd'

const { TextArea } = Input;
const { Title } = Typography;

const SiteSeoFields = () => {

    return (
        <>
            <Col span={24}>
                <Title level={5}>SEO</Title>
            </Col>
            
            <Col xs={24} lg={12}>
                <Form.Item 
                    label="Meta Title" 
                    name="meta_title"
                    className="mb-3"
                >
                    <Input placeholder="Enter meta title" />
                </Form.Item>
            </Col>
            
            <Col xs={24} lg={12}>
                <Form.Item 
                    label="Meta Tag" 
                    name="meta_tag"
                    className="mb-3"
                >
                    <Input placeholder="Enter meta tag" />
                </Form.Item>
            </Col>
            
            <Col span={24}>
                <Form.Item 
                    label="Meta Description" 
                    name="meta_description"
                    className="mb-3"
                >
                    <TextArea 
                        rows={4} 
                        placeholder="Enter meta description" 
                    />
                </Form.Item>
            </Col>
            
            <Col span={24}>
                <Divider />
            </Col>
            
            <Col span={24}>
                <Title level={5}>Copyright</Title>
            </Col>
            
            <Col xs={24} lg={12}>
                <Form.Item 
                    label="Copyright Text" 
                    name="copyright"
                    className="mb-3"
                >
                    <Input placeholder="Enter copyright text" />
                </Form.Item>
            </Col>
            
            <Col xs={24} lg={12}>
                <Form.Item 
                    label="Copyright URL" 
                    name="copyright_link"
                    className="mb-3"
                >
                    <Input placeholder="Enter copyright URL" />
                </Form.Item>
            </Col>
        </>
    )
}

export default SiteSeoFields
