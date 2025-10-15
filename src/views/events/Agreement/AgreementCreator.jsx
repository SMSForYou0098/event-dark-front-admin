import React, { useState, useRef } from 'react';
import {
    Form,
    Input,
    InputNumber,
    Select,
    DatePicker,
    Switch,
    Button,
    Card,
    Divider,
    Space,
    Typography,
    Row,
    Col,
    Radio,
    Collapse,
    message,
    Modal,
    Upload,
    Tabs
} from 'antd';
import {
    FileTextOutlined,
    DollarOutlined,
    SafetyOutlined,
    SettingOutlined,
    EyeOutlined,
    UploadOutlined,
    EditOutlined,
    FontSizeOutlined
} from '@ant-design/icons';
import AgreementPreview from './Agreement';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

const SIGNATURE_FONTS = [
    { name: 'Brush Script', style: 'Brush Script MT, cursive' },
    { name: 'Lucida Handwriting', style: 'Lucida Handwriting, cursive' },
    { name: 'Snell Roundhand', style: 'Snell Roundhand, cursive' },
    { name: 'Zapfino', style: 'Zapfino, cursive' },
    { name: 'Edwardian Script', style: 'Edwardian Script ITC, cursive' }
];

const AgreementCreator = () => {
    const [formInstance] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [formData, setFormData] = useState({});
    const [signatureType, setSignatureType] = useState('type');
    const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]);
    const [typedSignature, setTypedSignature] = useState('');
    const [uploadedSignature, setUploadedSignature] = useState(null);
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const handleSubmit = (values) => {
        setLoading(true);
        const agreementData = {
            ...values,
            signature: {
                type: signatureType,
                data: signatureType === 'draw' ? canvasRef.current?.toDataURL() :
                    signatureType === 'type' ? typedSignature :
                        uploadedSignature,
                font: signatureType === 'type' ? selectedFont.name : null
            }
        };
        console.log('Agreement Data:', agreementData);
        setTimeout(() => {
            message.success('Partner Agreement created successfully!');
            setLoading(false);
        }, 1000);
    };

    const showPreview = () => {
        const values = formInstance.getFieldsValue();
        setFormData(values);
        setPreviewVisible(true);
    };

    const handleImageUpload = (info) => {
        if (info.file.status === 'done' || info.file.originFileObj) {
            const reader = new FileReader();
            reader.onload = (e) => setUploadedSignature(e.target.result);
            reader.readAsDataURL(info.file.originFileObj);
        }
    };

    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('Only image files allowed!');
            return false;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must be smaller than 2MB!');
            return false;
        }
        const validFormats = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validFormats.includes(file.type)) {
            message.error('Only JPG/PNG allowed!');
            return false;
        }
        return true;
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const getSignaturePreview = () => {
        if (signatureType === 'draw' && canvasRef.current) {
            return <img src={canvasRef.current.toDataURL()} alt="Signature" className="img-fluid" />;
        }
        if (signatureType === 'type' && typedSignature) {
            return <div style={{ fontFamily: selectedFont.style, fontSize: '32px' }}>{typedSignature}</div>;
        }
        if (signatureType === 'upload' && uploadedSignature) {
            return <img src={uploadedSignature} alt="Signature" className="img-fluid" style={{ maxHeight: '80px' }} />;
        }
        return <Text type="secondary">No signature added</Text>;
    };

    return (
        <>
            <Card>
                <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
                    <div className="mb-3 mb-md-0">
                        <Title level={2} className="mb-1">
                            <FileTextOutlined /> Create Partner Agreement
                        </Title>
                        <Text type="secondary">Configure partnership terms and conditions</Text>
                    </div>
                    <Button type="primary" size="large" icon={<EyeOutlined />} onClick={showPreview}>
                        Preview Agreement
                    </Button>
                </div>

                <Divider />

                <Form
                    form={formInstance}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        agreementStatus: 'active',
                        autoApproveEvents: false,
                        commissionType: 'percentage',
                        commissionValue: 15,
                        settlementCycle: 'weekly',
                        minimumPayout: 1000,
                        eventCancellationNoticeDays: 7,
                        terminationNoticeDays: 30,
                        currency: 'INR'
                    }}
                >
                    <div style={{maxHeight : '60vh', overflow : 'auto'}}>
                    <Collapse defaultActiveKey={['1']} className="mb-4">

                        <Panel header={<><FileTextOutlined /> Basic Information</>} key="1">
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Agreement Title" name="agreementTitle" rules={[{ required: true, message: 'Required' }]}>
                                        <Input placeholder="e.g., Standard Partnership Agreement" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Version" name="version" rules={[{ required: true, message: 'Required' }]}>
                                        <Input placeholder="e.g., v2.0" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Effective Date" name="effectiveDate" rules={[{ required: true, message: 'Required' }]}>
                                        <DatePicker className="w-100" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Status" name="agreementStatus">
                                        <Select>
                                            <Option value="active">Active</Option>
                                            <Option value="draft">Draft</Option>
                                            <Option value="archived">Archived</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24}>
                                    <Form.Item label="Description" name="description">
                                        <TextArea rows={3} placeholder="Brief description of the agreement" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Panel>

                        <Panel header={<><DollarOutlined /> Financial Terms</>} key="2">
                            <Row gutter={16}>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Currency" name="currency">
                                        <Select>
                                            <Option value="INR">INR (₹)</Option>
                                            <Option value="USD">USD ($)</Option>
                                            <Option value="EUR">EUR (€)</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Commission Type" name="commissionType">
                                        <Select>
                                            <Option value="percentage">Percentage (%)</Option>
                                            <Option value="flat">Flat Fee</Option>
                                            <Option value="tiered">Tiered</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Commission Value (%)" name="commissionValue" rules={[{ required: true, message: 'Required' }]}>
                                        <InputNumber min={0} max={100} className="w-100" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Payment Gateway Charges" name="platformFeeResponsibility">
                                        <Select>
                                            <Option value="organizer">Organizer Bears</Option>
                                            <Option value="platform">Platform Bears</Option>
                                            <Option value="split">Split 50-50</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Settlement Cycle" name="settlementCycle">
                                        <Select>
                                            <Option value="daily">Daily</Option>
                                            <Option value="weekly">Weekly</Option>
                                            <Option value="biweekly">Bi-weekly</Option>
                                            <Option value="monthly">Monthly</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Minimum Payout (₹)" name="minimumPayout">
                                        <InputNumber min={0} className="w-100" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Panel>

                        <Panel header={<><SettingOutlined /> Event Management</>} key="3">
                            <Row gutter={16}>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Auto-Approve Events" name="autoApproveEvents" valuePropName="checked">
                                        <Switch />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Cancellation Notice (Days)" name="eventCancellationNoticeDays">
                                        <InputNumber min={0} max={90} className="w-100" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Refund Processing (Days)" name="refundProcessingDays">
                                        <InputNumber min={1} max={30} className="w-100" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24}>
                                    <Form.Item label="Allowed Event Categories" name="allowedCategories">
                                        <Select mode="multiple" placeholder="Select categories">
                                            <Option value="music">Music & Concerts</Option>
                                            <Option value="sports">Sports</Option>
                                            <Option value="theatre">Theatre & Arts</Option>
                                            <Option value="comedy">Comedy Shows</Option>
                                            <Option value="workshop">Workshops</Option>
                                            <Option value="conference">Conferences</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Panel>

                        <Panel header={<><SafetyOutlined /> Legal & Policies</>} key="4">
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Termination Notice (Days)" name="terminationNoticeDays">
                                        <InputNumber min={0} max={180} className="w-100" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Jurisdiction" name="jurisdiction">
                                        <Input placeholder="e.g., Mumbai, India" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24}>
                                    <Form.Item label="Customer Data Access" name="customerDataAccess">
                                        <Radio.Group>
                                            <Space direction="vertical">
                                                <Radio value="full">Full Access (Name, Email, Phone)</Radio>
                                                <Radio value="limited">Limited (Name & Email)</Radio>
                                                <Radio value="anonymous">Anonymous (Booking ID only)</Radio>
                                            </Space>
                                        </Radio.Group>
                                    </Form.Item>
                                </Col>
                                <Col xs={24}>
                                    <Form.Item label="Additional Terms & Conditions" name="customClauses">
                                        <TextArea rows={4} placeholder="Enter any additional terms, clauses or special conditions" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Panel>

                        <Panel header={<><EditOutlined /> Admin Signature</>} key="5">
                            <Tabs activeKey={signatureType} onChange={setSignatureType}>

                                <Tabs.TabPane tab={<><EditOutlined /> Draw Signature</>} key="draw">
                                    <div className="text-center">
                                        <div className="d-inline-block">
                                            <canvas
                                                ref={canvasRef}
                                                width={600}
                                                height={200}
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseLeave={stopDrawing}
                                                className="border border-2 rounded"
                                                style={{ cursor: 'crosshair', touchAction: 'none', maxWidth: '100%', background: 'white' }}
                                            />
                                        </div>
                                        <div className="mt-3">
                                            <Button onClick={clearCanvas} danger>Clear Signature</Button>
                                        </div>
                                        <Text type="secondary" className="d-block mt-2">
                                            Draw your signature using mouse/touchpad
                                        </Text>
                                    </div>
                                </Tabs.TabPane>

                                <Tabs.TabPane tab={<><FontSizeOutlined /> Type Signature</>} key="type">
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Select Font Style">
                                                <Select
                                                    value={selectedFont.name}
                                                    onChange={(val) => setSelectedFont(SIGNATURE_FONTS.find(f => f.name === val))}
                                                >
                                                    {SIGNATURE_FONTS.map(font => (
                                                        <Option key={font.name} value={font.name}>
                                                            <span style={{ fontFamily: font.style, fontSize: '20px' }}>{font.name}</span>
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Type Your Signature">
                                                <Input
                                                    value={typedSignature}
                                                    onChange={(e) => setTypedSignature(e.target.value)}
                                                    placeholder="Enter your name"
                                                    maxLength={50}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24}>
                                            <div className="border border-2 rounded p-4 text-center">
                                                <Text type="secondary" className="d-block mb-3">Signature Preview:</Text>
                                                {typedSignature ? (
                                                    <div style={{ fontFamily: selectedFont.style, fontSize: '32px' }}>
                                                        {typedSignature}
                                                    </div>
                                                ) : (
                                                    <Text type="secondary">Type your name above to preview</Text>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>
                                </Tabs.TabPane>

                                <Tabs.TabPane tab={<><UploadOutlined /> Upload Signature</>} key="upload">
                                    <div className="text-center">
                                        <Upload
                                            accept="image/jpeg,image/png,image/jpg"
                                            beforeUpload={beforeUpload}
                                            onChange={handleImageUpload}
                                            showUploadList={false}
                                            maxCount={1}
                                        >
                                            <Button icon={<UploadOutlined />} size="large" type="dashed">
                                                Click to Upload Signature
                                            </Button>
                                        </Upload>
                                        <div className="mt-3">
                                            <Text type="secondary" className="d-block">
                                                <strong>Accepted formats:</strong> JPG, PNG (Max 2MB)
                                            </Text>
                                            <Text type="secondary" className="d-block">
                                                <strong>Recommended:</strong> White background, 600×200px
                                            </Text>
                                            <Text type="secondary" className="d-block">
                                                <strong>Note:</strong> Transparent backgrounds supported
                                            </Text>
                                        </div>
                                        {uploadedSignature && (
                                            <div className="border border-2 rounded p-3 mt-4 d-inline-block bg-white">
                                                <Text strong className="d-block mb-2">Uploaded Signature:</Text>
                                                <img
                                                    src={uploadedSignature}
                                                    alt="Signature"
                                                    className="img-fluid"
                                                    style={{ maxHeight: '150px', maxWidth: '100%' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Tabs.TabPane>
                            </Tabs>
                        </Panel>
                    </Collapse>
                    </div>
                    <div className="d-flex justify-content-end flex-wrap">
                        <Button size="large" className='gap-1' onClick={() => formInstance.resetFields()}>
                            Reset Form
                        </Button>
                        <Button size="large" className='gap-1' type="default">
                            Save as Draft
                        </Button>
                        <Button type="primary" htmlType="submit" size="large" className='gap-1' loading={loading}>
                            Create Agreement
                        </Button>
                    </div>
                </Form>
            </Card>
            <AgreementPreview
                visible={previewVisible}
                onClose={() => setPreviewVisible(false)}
                // agreementData={sampleAgreementData}
                // adminSignature={sampleAdminSignature}
                // onAccept={handleAccept}
                showAcceptance={true}
            />
        </>
    );
};

export default AgreementCreator