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
    Upload,
    Tabs,
    Spin
} from 'antd';
import {
    FileTextOutlined,
    DollarOutlined,
    SafetyOutlined,
    SettingOutlined,
    EyeOutlined,
    UploadOutlined,
    EditOutlined,
    FontSizeOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import AgreementPreview from './Agreement';
import {
    useGetUserAgreement,
    useCreateUserAgreement,
    useUpdateUserAgreement
} from './useAgreement';

const { Title, Text } = Typography;
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
    const [previewVisible, setPreviewVisible] = useState(false);
    const [formData, setFormData] = useState({});
    const [signatureType, setSignatureType] = useState('type');
    const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]);
    const [typedSignature, setTypedSignature] = useState('');
    const [uploadedSignature, setUploadedSignature] = useState(null);
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    // Use custom hooks for API calls
    const { data: agreementData, isLoading: isFetchingAgreement } = useGetUserAgreement(id, {
        onSuccess: (data) => {
            // Populate form with fetched data
            const formValues = {
                ...data,
                effectiveDate: data.effectiveDate ? dayjs(data.effectiveDate) : null,
            };
            formInstance.setFieldsValue(formValues);

            // Set signature data
            if (data.signatureType) {
                setSignatureType(data.signatureType);
            }
            if (data.signatureType === 'type' && data.signatureText) {
                setTypedSignature(data.signatureText);
                if (data.signatureFont) {
                    const font = SIGNATURE_FONTS.find(f => f.name === data.signatureFont);
                    if (font) setSelectedFont(font);
                }
            } else if (data.signatureType === 'upload' && data.signatureUrl) {
                setUploadedSignature(data.signatureUrl);
            } else if (data.signatureType === 'draw' && data.signatureUrl) {
                // Load drawn signature to canvas
                const img = new Image();
                img.onload = () => {
                    const canvas = canvasRef.current;
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                    }
                };
                img.src = data.signatureUrl;
            }
        }
    });

    const { mutate: createAgreement, isPending: isCreating } = useCreateUserAgreement({
        onSuccess: () => {
            // Optionally navigate or reset form
            // navigate('/agreements');
            // formInstance.resetFields();
            // setTypedSignature('');
            // setUploadedSignature(null);
            // clearCanvas();
        }
    });

    const { mutate: updateAgreement, isPending: isUpdating } = useUpdateUserAgreement({
        onSuccess: () => {
            // Optionally navigate
            // navigate('/agreements');
        }
    });

    const prepareFormData = async (values) => {
        // Prepare signature data
        let signatureData = null;
        let signatureBlob = null;

        if (signatureType === 'draw' && canvasRef.current) {
            const canvas = canvasRef.current;
            signatureBlob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });
        } else if (signatureType === 'type' && typedSignature) {
            signatureData = typedSignature;
        } else if (signatureType === 'upload' && uploadedSignature) {
            if (uploadedSignature.startsWith('data:')) {
                const response = await fetch(uploadedSignature);
                signatureBlob = await response.blob();
            }
        }

        const formDataObj = new FormData();

        // Append basic information
        if (values.agreementTitle) formDataObj.append('agreementTitle', values.agreementTitle);
        if (values.version) formDataObj.append('version', values.version);
        if (values.effectiveDate) formDataObj.append('effectiveDate', values.effectiveDate.toISOString());
        if (values.agreementStatus) formDataObj.append('agreementStatus', values.agreementStatus);
        if (values.description) formDataObj.append('description', values.description);

        // Append financial terms
        if (values.currency) formDataObj.append('currency', values.currency);
        if (values.commissionType) formDataObj.append('commissionType', values.commissionType);
        if (values.commissionValue !== undefined) formDataObj.append('commissionValue', values.commissionValue);
        if (values.platformFeeResponsibility) formDataObj.append('platformFeeResponsibility', values.platformFeeResponsibility);
        if (values.settlementCycle) formDataObj.append('settlementCycle', values.settlementCycle);
        if (values.minimumPayout !== undefined) formDataObj.append('minimumPayout', values.minimumPayout);

        // Append event management
        if (values.autoApproveEvents !== undefined) formDataObj.append('autoApproveEvents', values.autoApproveEvents);
        if (values.eventCancellationNoticeDays !== undefined) formDataObj.append('eventCancellationNoticeDays', values.eventCancellationNoticeDays);
        if (values.refundProcessingDays !== undefined) formDataObj.append('refundProcessingDays', values.refundProcessingDays);
        if (values.allowedCategories) formDataObj.append('allowedCategories', JSON.stringify(values.allowedCategories));

        // Append legal & policies
        if (values.terminationNoticeDays !== undefined) formDataObj.append('terminationNoticeDays', values.terminationNoticeDays);
        if (values.jurisdiction) formDataObj.append('jurisdiction', values.jurisdiction);
        if (values.customerDataAccess) formDataObj.append('customerDataAccess', values.customerDataAccess);
        if (values.customClauses) formDataObj.append('customClauses', values.customClauses);

        // Append signature information
        formDataObj.append('signatureType', signatureType);

        if (signatureType === 'type') {
            if (signatureData) formDataObj.append('signatureText', signatureData);
            if (selectedFont.name) formDataObj.append('signatureFont', selectedFont.name);
            if (selectedFont.style) formDataObj.append('signatureFontStyle', selectedFont.style);
        } else if (signatureBlob) {
            formDataObj.append('signature', signatureBlob, `signature-${Date.now()}.png`);
        }

        console.log('FormData Contents:');
        for (let pair of formDataObj.entries()) {
            console.log(pair[0], ':', pair[1]);
        }

        return formDataObj;
    };

    const handleSubmit = async (values) => {
        try {
            const formDataObj = await prepareFormData(values);

            if (isEditMode) {
                updateAgreement({ id, formData: formDataObj });
            } else {
                createAgreement(formDataObj);
            }

        } catch (error) {
            console.error('Error preparing form data:', error);
            message.error('Failed to prepare agreement data. Please try again.');
        }
    };

    const showPreview = () => {
        const values = formInstance.getFieldsValue();

        let signatureData = null;
        let signatureFont = null;

        if (signatureType === 'draw' && canvasRef.current) {
            signatureData = canvasRef.current.toDataURL();
        } else if (signatureType === 'type' && typedSignature) {
            signatureData = typedSignature;
            signatureFont = selectedFont.style;
        } else if (signatureType === 'upload' && uploadedSignature) {
            signatureData = uploadedSignature;
        }

        const previewData = {
            ...values,
            signature: signatureData,
            signatureType: signatureType,
            signatureFont: signatureFont
        };

        setFormData(previewData);
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

    const isPending = isCreating || isUpdating;

    if (isFetchingAgreement) {
        return (
            <Card>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
                    <Title level={4} className="mt-3">Loading Agreement...</Title>
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card
                title={
                    <div>
                        <Title level={2} className="mb-1">
                            <FileTextOutlined /> {isEditMode ? 'Edit' : 'Create'} Partner Agreement
                        </Title>
                        <Text type="secondary">
                            {isEditMode ? 'Update partnership terms and conditions' : 'Configure partnership terms and conditions'}
                        </Text>
                    </div>
                }
                extra={
                    <Button type="primary" icon={<EyeOutlined />} onClick={showPreview}>
                        Preview Agreement
                    </Button>
                }
            >

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
                <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
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
                                            <Button icon={<UploadOutlined />} type="dashed">
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
                    <Button className='gap-1' onClick={() => formInstance.resetFields()}>
                        Reset Form
                    </Button>
                    <Button className='gap-1' type="default">
                        Save as Draft
                    </Button>
                    <Button type="primary" htmlType="submit" className='gap-1' loading={isPending}>
                        {isEditMode ? 'Update Agreement' : 'Create Agreement'}
                    </Button>
                </div>
            </Form>
        </Card >
            <AgreementPreview
                visible={previewVisible}
                onClose={() => setPreviewVisible(false)}
                agreementData={formData}
                adminSignature={{
                    data: formData.signature,
                    type: formData.signatureType,
                    font: formData.signatureFont
                }}
                showAcceptance={true}
            />
        </>
    );
};

export default AgreementCreator;