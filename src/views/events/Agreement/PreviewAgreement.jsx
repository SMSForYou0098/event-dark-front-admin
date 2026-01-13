import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Button, Card, Modal, Form, Input, message, Spin, Row, Col, Space, Avatar } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, BankOutlined, LockOutlined, MailOutlined, PhoneOutlined, UserOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import AgreementPdfViewer from 'components/shared-components/AgreementPdfViewer';
import { useAgreementPreview, useVerifyUser } from './useAgreement';
import { getBackgroundWithOpacity } from '../common/CustomUtil';
import { PRIMARY } from 'utils/consts';
import SignatureInput, { SIGNATURE_FONTS } from '../../../components/shared-components/SignatureInput';
import { useMyContext } from 'Context/MyContextProvider';

const PreviewAgreement = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { api, authToken } = useMyContext();

    const [authModalVisible, setAuthModalVisible] = useState(true); // Show modal immediately
    const [agreementData, setAgreementData] = useState(null);
    const [form] = Form.useForm();

    // Signature state (for when organizer_signature is null)
    const [signatureType, setSignatureType] = useState('type');
    const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]);
    const [typedSignature, setTypedSignature] = useState('');
    const [uploadedSignature, setUploadedSignature] = useState(null);
    const [signaturePreview, setSignaturePreview] = useState(null);
    const canvasRef = useRef(null);
    const [isSubmittingSignature, setIsSubmittingSignature] = useState(false);

    // Preview query (will be triggered after verification)
    const { refetch: fetchPreview, isFetching: isLoadingPreview } = useAgreementPreview(id, {
        enabled: false // Don't auto-fetch
    });

    // Verify user mutation
    const { mutate: verifyUser, isPending: isVerifying } = useVerifyUser({
        onSuccess: async (response) => {
            if (response.status) {
                // After verification, fetch the agreement preview
                const { data: previewData } = await fetchPreview();
                message.success('User verified successfully');
                if (previewData?.status) {
                    setAgreementData(previewData.data);
                    setAuthModalVisible(false);
                    form.resetFields();
                }
            }
        }
    });

    // Handle missing ID
    useEffect(() => {
        if (!id) {
            message.error('Agreement ID is missing');
            navigate(-1);
        }
    }, [id, navigate]);

    const handleAuthentication = (values) => {
        verifyUser({
            user_agreement_id: id,
            password: values.password
        });
    };

    const handleAuthModalCancel = () => {
        setAuthModalVisible(false);
        form.resetFields();
        navigate(-1);
    };

    // Get signature data based on type
    const getSignatureData = useCallback(async () => {
        if (signatureType === 'draw' && canvasRef.current) {
            return { type: 'draw', data: canvasRef.current.toDataURL() };
        } else if (signatureType === 'type' && typedSignature) {
            return {
                type: 'type',
                text: typedSignature,
                font: selectedFont.name,
                fontStyle: selectedFont.style
            };
        } else if (signatureType === 'upload' && uploadedSignature) {
            return { type: 'upload', file: uploadedSignature };
        }
        return null;
    }, [signatureType, typedSignature, selectedFont, uploadedSignature]);

    // Handle signature submission
    const handleSignatureSubmit = async () => {
        const signatureData = await getSignatureData();

        if (!signatureData) {
            message.error('Please provide a signature before submitting');
            return;
        }

        if (!agreementData?.user?.id) {
            message.error('User ID not found');
            return;
        }

        setIsSubmittingSignature(true);
        try {
            const formData = new FormData();

            // Append signature data
            formData.append('signature_type', signatureData.type);

            if (signatureData.type === 'type') {
                formData.append('signature_text', signatureData.text);
                formData.append('signature_font', signatureData.font);
                formData.append('signature_font_style', signatureData.fontStyle);
            } else if (signatureData.type === 'draw') {
                // Base64 data for draw
                formData.append('signature_image', signatureData.data);
            } else if (signatureData.type === 'upload' && signatureData.file) {
                // File object for upload
                formData.append('signature_image', signatureData.file);
            }

            const url = `${api}update-user/${agreementData.user.id}`;
            const response = await axios.post(url, formData, {
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (response.data?.status) {
                message.success('Signature submitted successfully!');
                // Refetch the preview to get updated data
                const { data: previewData } = await fetchPreview();
                if (previewData?.status) {
                    setAgreementData(previewData.data);
                }
            } else {
                message.error(response.data?.message || 'Failed to submit signature');
            }
        } catch (error) {
            console.error('Signature submission error:', error);
            message.error(error?.response?.data?.message || 'Failed to submit signature');
        } finally {
            setIsSubmittingSignature(false);
        }
    };

    // Transform admin signature from API response
    const formattedAdminSignature = useMemo(() => {
        console.log(agreementData);
        if (!agreementData?.agreement) return null;

        const adminSig = agreementData.agreement;
        return {
            signature_type: adminSig.signature_type,
            signature_text: adminSig.signature_type === 'type' ? adminSig.signature_text : null,
            signature_image: adminSig.signature_type !== 'type' ? adminSig.signature_image : null,
            signatory_name: adminSig.signatory_name || 'Platform Admin',
            signing_date: adminSig.signing_date || new Date().toISOString()
        };
    }, [agreementData]);

    // Transform organizer signature from API response
    const formattedOrganizerSignature = useMemo(() => {
        if (!agreementData?.organizer_signature) return null;

        const orgSig = agreementData.organizer_signature;
        return {
            signature_type: orgSig.signature_type,
            signature_text: orgSig.signature_type === 'type' ? orgSig.signature_text : null,
            signature_image: orgSig.signature_type !== 'type' ? orgSig.signature_image : null,
            signatory_name: orgSig.signatory_name || agreementData.user?.name || 'Organizer',
            signing_date: orgSig.signing_date || agreementData.signed_at || new Date().toISOString()
        };
    }, [agreementData]);

    // Get agreement content from API response
    const agreementContent = useMemo(() => {
        return agreementData?.agreement?.content || '';
    }, [agreementData]);

    // Check if organizer signature is missing
    const needsOrganizerSignature = useMemo(() => {
        return agreementData && !agreementData.organizer_signature;
    }, [agreementData]);

    const isLoading = isVerifying || isLoadingPreview;

    return (
        <div className="p-4 bg-light" style={{ minHeight: '100vh' }}>
            {/* Authentication Modal */}
            <Modal
                title={
                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <LockOutlined style={{ fontSize: '24px', marginBottom: '10px', display: 'block' }} />
                        Authentication Required
                    </div>
                }
                open={authModalVisible}
                onCancel={handleAuthModalCancel}
                footer={null}
                centered
                closable={!isLoading}
                maskClosable={false}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleAuthentication}
                    autoComplete="off"
                >
                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[
                            { required: true, message: 'Please enter your password' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Enter your password"
                            size="large"
                            disabled={isLoading}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            loading={isLoading}
                        >
                            Verify & View Agreement
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Agreement Document */}
            {agreementData && (
                <Row gutter={[16, 16]}>
                    <Col md={18} xs={24}>
                        <Card className="shadow-sm" bodyStyle={{ padding: '20px' }}>
                            <AgreementPdfViewer
                                auto={true}
                                showDownload={true}
                                showPrint={true}
                                defaultScale={0.8}
                                content={agreementContent}
                                title={agreementData.agreement?.title || 'Partner Agreement'}
                                adminSignature={formattedAdminSignature}
                                org={agreementData.user}
                                organizerSignature={formattedOrganizerSignature}
                            />
                        </Card>
                    </Col>
                    <Col md={6} xs={24}>
                        <Card title="Organizer Details" className="shadow-sm" bodyStyle={{ padding: 20 }}>
                            <Space direction="vertical" size="large" className="w-100">

                                {[
                                    {
                                        label: "Name",
                                        value: agreementData.user?.name,
                                        icon: <UserOutlined />
                                    },
                                    {
                                        label: "Organization",
                                        value: agreementData.user?.organisation,
                                        icon: <BankOutlined />
                                    },
                                    {
                                        label: "Email",
                                        value: agreementData.user?.email,
                                        icon: <MailOutlined />
                                    },
                                    {
                                        label: "Phone",
                                        value: agreementData.user?.number,
                                        icon: <PhoneOutlined />
                                    }
                                ].map((item, index) => (
                                    <div key={index} className="d-flex align-items-center gap-2">

                                        <Avatar
                                            icon={item.icon}
                                            style={{
                                                color: PRIMARY,
                                                backgroundColor: getBackgroundWithOpacity(PRIMARY, 0.15)
                                            }}
                                        />

                                        <strong className="ml-2">{item.label}:</strong>
                                        <span>{item.value || "N/A"}</span>

                                    </div>
                                ))}

                            </Space>
                        </Card>

                        {/* Signature Section - Show when organizer_signature is null */}
                        {needsOrganizerSignature && (
                            <Card
                                title={
                                    <Space>
                                        <EditOutlined />
                                        <span>Your Signature</span>
                                    </Space>
                                }
                                className="shadow-sm mt-3"
                                bodyStyle={{ padding: 20 }}
                            >
                                <SignatureInput
                                    signatureType={signatureType}
                                    onSignatureTypeChange={setSignatureType}
                                    selectedFont={selectedFont}
                                    onFontChange={setSelectedFont}
                                    typedSignature={typedSignature}
                                    onTypedSignatureChange={setTypedSignature}
                                    uploadedSignature={uploadedSignature}
                                    onUploadedSignatureChange={setUploadedSignature}
                                    signaturePreview={signaturePreview}
                                    onSignaturePreviewChange={setSignaturePreview}
                                    canvasRef={canvasRef}
                                    onClearCanvas={() => {
                                        const canvas = canvasRef.current;
                                        if (canvas) {
                                            const ctx = canvas.getContext('2d');
                                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                                        }
                                    }}
                                />
                                <Button
                                    type="primary"
                                    block
                                    size="large"
                                    onClick={handleSignatureSubmit}
                                    loading={isSubmittingSignature}
                                    className="mt-3"
                                    icon={<EditOutlined />}
                                >
                                    Submit Signature
                                </Button>
                            </Card>
                        )}

                        <div className="d-flex justify-content-end w-100 mt-3">
                            <Button icon={<ArrowRightOutlined />} type='primary' onClick={() => navigate('/dashboard')}>Dashboard</Button>
                        </div>
                    </Col>

                </Row>
            )}
        </div>
    );
};

export default PreviewAgreement;

