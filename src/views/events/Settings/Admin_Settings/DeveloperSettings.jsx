import React from 'react';
import {
    Row, Col, Form, Input, Select, Button, Card, Divider, Typography, Tooltip
} from 'antd';
import { PlusOutlined, DeleteOutlined, KeyOutlined, RobotOutlined } from '@ant-design/icons';

const { Text } = Typography;

const AI_PROVIDERS = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'gemini', label: 'Google Gemini' },
    { value: 'anthropic', label: 'Anthropic (Claude)' },
    { value: 'mistral', label: 'Mistral AI' },
    { value: 'cohere', label: 'Cohere' },
    { value: 'groq', label: 'Groq' },
    { value: 'other', label: 'Other' },
];

const AI_MODELS = {
    openai: [
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    gemini: [
        { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
    anthropic: [
        { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
        { value: 'claude-3-opus', label: 'Claude 3 Opus' },
        { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
    ],
    mistral: [
        { value: 'mistral-large', label: 'Mistral Large' },
        { value: 'mistral-small', label: 'Mistral Small' },
        { value: 'mixtral-8x7b', label: 'Mixtral 8x7B' },
    ],
    cohere: [
        { value: 'command-r-plus', label: 'Command R+' },
        { value: 'command-r', label: 'Command R' },
    ],
    groq: [
        { value: 'llama-3.3-70b', label: 'LLaMA 3.3 70B' },
        { value: 'llama-3.1-8b', label: 'LLaMA 3.1 8B' },
        { value: 'mixtral-8x7b-groq', label: 'Mixtral 8x7B' },
    ],
    other: [],
};

const DeveloperSettings = ({ form }) => {
    // Watch ai_keys to get current provider for each entry
    const aiKeys = Form.useWatch('ai_keys', form) || [];

    const getModelsForProvider = (provider) => {
        return AI_MODELS[provider] || [];
    };

    return (
        <>
            <h4 style={{ marginBottom: '16px' }}>
                <RobotOutlined style={{ marginRight: 8 }} />
                AI API Keys
            </h4>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                Configure API keys for AI providers used across the platform.
            </Text>

            <Form.List name="ai_keys">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }) => {
                            const currentProvider = aiKeys[name]?.ai;
                            const models = getModelsForProvider(currentProvider);

                            return (
                                <Card
                                    key={key}
                                    size="small"
                                    className="mb-3"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    extra={
                                        <Tooltip title="Remove">
                                            <Button
                                                type="text"
                                                danger
                                                size="small"
                                                icon={<DeleteOutlined />}
                                                onClick={() => remove(name)}
                                            />
                                        </Tooltip>
                                    }
                                >
                                    <Row gutter={[16, 0]}>
                                        {/* AI Provider */}
                                        <Col xs={24} sm={8}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'ai']}
                                                label="AI Provider"
                                                rules={[{ required: true, message: 'Select a provider' }]}
                                            >
                                                <Select
                                                    placeholder="Select provider"
                                                    options={AI_PROVIDERS}
                                                    onChange={() => {
                                                        // Clear model when provider changes
                                                        const currentKeys = form.getFieldValue('ai_keys');
                                                        currentKeys[name].model = undefined;
                                                        form.setFieldsValue({ ai_keys: currentKeys });
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>

                                        {/* Model */}
                                        <Col xs={24} sm={8}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'model']}
                                                label="Model"
                                                rules={[{ required: true, message: 'Enter or select a model' }]}
                                            >
                                                {models.length > 0 ? (
                                                    <Select
                                                        placeholder="Select model"
                                                        options={models}
                                                        showSearch
                                                        allowClear
                                                    />
                                                ) : (
                                                    <Input placeholder="e.g. gpt-4o, gemini-pro" />
                                                )}
                                            </Form.Item>
                                        </Col>

                                        {/* API Key */}
                                        <Col xs={24} sm={8}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'key']}
                                                label="API Key"
                                                rules={[{ required: true, message: 'Enter the API key' }]}
                                            >
                                                <Input.Password
                                                    placeholder="sk-... or AIza..."
                                                    prefix={<KeyOutlined style={{ color: '#8c8c8c' }} />}
                                                    visibilityToggle
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>
                            );
                        })}

                        <Button
                            type="dashed"
                            onClick={() => add({ ai: undefined, model: undefined, key: '' })}
                            icon={<PlusOutlined />}
                            block
                        >
                            Add AI Key
                        </Button>
                    </>
                )}
            </Form.List>
        </>
    );
};

export default DeveloperSettings;
