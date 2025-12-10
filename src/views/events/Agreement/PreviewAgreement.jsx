import React, { useState, useMemo, useEffect } from 'react';
import { Button, Card, Modal, Form, Input, message, Spin } from 'antd';
import { ArrowLeftOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import AgreementPdfViewer from 'components/shared-components/AgreementPdfViewer';
import   { useAgreementPreview, useVerifyUser } from './useAgreement';

const PreviewAgreement = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const [authModalVisible, setAuthModalVisible] = useState(true); // Show modal immediately
    const [agreementData, setAgreementData] = useState(null);
    const [form] = Form.useForm();

    // Preview query (will be triggered after verification)
    const { refetch: fetchPreview, isFetching: isLoadingPreview } = useAgreementPreview(id, {
        enabled: false // Don't auto-fetch
    });

    // Verify user mutation
    const { mutate: verifyUser, isPending: isVerifying } = useVerifyUser({
        onSuccess: async (response) => {
            if (response.status) {
                message.success('User verified successfully');
                // After verification, fetch the agreement preview
                const { data: previewData } = await fetchPreview();
                if (previewData?.status) {
                    setAgreementData(previewData.data);
                    setAuthModalVisible(false);
                    form.resetFields();
                } else {
                    message.error(previewData?.message || 'Failed to load agreement');
                }
            } else {
                message.error(response.message || 'User verification failed');
            }
        },
        onError: (error) => {
            console.error('Error verifying user:', error);
            message.error(error.response?.data?.message || 'Failed to verify user. Please check your credentials.');
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
                <>
                        <Card className="shadow-sm" bodyStyle={{ padding: '20px' }}>
                            <AgreementPdfViewer 
                                content={agreementContent}
                                title={agreementData.agreement?.title || 'Partner Agreement'}
                                adminSignature={formattedAdminSignature}
                                organizerSignature={formattedOrganizerSignature}
                            />
                        </Card>
                </>
            )}
        </div>
    );
};

export default PreviewAgreement;

