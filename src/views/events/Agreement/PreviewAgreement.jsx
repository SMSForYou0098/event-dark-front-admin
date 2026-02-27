import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Button, Card, message, Row, Col, Space, Avatar } from 'antd';
import { ArrowRightOutlined, BankOutlined, MailOutlined, PhoneOutlined, UserOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import AgreementPdfViewer from 'components/shared-components/AgreementPdfViewer';
import { useAgreementPreview, useUpdateUserSignature, useConfirmAgreement } from './useAgreement';
import { getBackgroundWithOpacity } from '../common/CustomUtil';
import { PRIMARY } from 'utils/consts';
import SignatureInput, { SIGNATURE_FONTS } from '../../../components/shared-components/SignatureInput';
import { useMyContext } from 'Context/MyContextProvider';
import Utils from 'utils';

const PreviewAgreement = () => {
    const navigate = useNavigate();
    const { id, user_id } = useParams();
    const { UserData } = useMyContext();

    // Check if this is an interactive view (with user_id) or read-only view
    const isInteractiveView = !!user_id;

    // Validate user_id matches logged-in user
    useEffect(() => {
        if (user_id && UserData?.id && UserData.id !== parseInt(user_id)) {
            message.error('Unauthorized access');
            navigate('/dashboard');
        }
    }, [user_id, UserData, navigate]);

    const [agreementData, setAgreementData] = useState(null);

    // Signature state (for when organizer_signature is null)
    const [signatureType, setSignatureType] = useState('type');
    const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]);
    const [typedSignature, setTypedSignature] = useState('');
    const [uploadedSignature, setUploadedSignature] = useState(null);
    const [signaturePreview, setSignaturePreview] = useState(null);
    const canvasRef = useRef(null);

    // Preview query - fetch agreement data
    const { refetch: fetchPreview, isFetching: isLoadingPreview } = useAgreementPreview(id, {
        enabled: false
    });

    // Mutation for updating user signature
    const updateSignatureMutation = useUpdateUserSignature({
        onSuccess: async (data) => {
            if (data?.status) {
                message.success(data?.message || 'Signature submitted successfully!');
                // Refetch the preview to get updated data
                const { data: previewData } = await fetchPreview();
                if (previewData?.status) {
                    setAgreementData(previewData.data);
                }
                // After signature is updated, confirm the agreement
                confirmAgreementMutation.mutate({
                    agreement_id: id,
                    user_id: agreementData.user.id,
                    action: 'approve'
                });
            } else {
                message.error(data?.message || 'Failed to submit signature');
            }
        },
        onError: (error) => {
            console.error('Signature submission error:', error);
            message.error(Utils.getErrorMessage(error, 'Failed to submit signature'));
        }
    });

    // Mutation for confirming agreement
    const confirmAgreementMutation = useConfirmAgreement({
        onSuccess: async (data) => {
            if (data?.status) {
                message.success(data?.message || 'Agreement approved successfully!');
                // Navigate to read-only view (remove user_id from URL)
                navigate(`/agreement/preview/${id}`, { replace: true });
            } else {
                message.error(data?.message || 'Agreement confirmation failed');
            }
        },
        onError: (error) => {
            console.error('Agreement confirmation error:', error);
            message.error(Utils.getErrorMessage(error, 'Failed to confirm agreement'));
        }
    });

    // Fetch agreement data on mount
    useEffect(() => {
        if (!id) {
            message.error('Agreement ID is missing');
            navigate(-1);
            return;
        }

        // Fetch agreement preview data
        const loadAgreement = async () => {
            const { data: previewData } = await fetchPreview();
            if (previewData?.status) {
                setAgreementData(previewData.data);
            } else {
                message.error(Utils.getErrorMessage(previewData, 'Failed to load agreement'));
            }
        };

        loadAgreement();
    }, [id, navigate, fetchPreview]);

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

        // Submit signature using mutation
        updateSignatureMutation.mutate({
            userId: agreementData.user.id,
            formData
        });
    };

    // Handle agreement approval when signature already exists
    const handleApproveAgreement = () => {
        if (!agreementData?.user?.id) {
            message.error('User ID not found');
            return;
        }

        confirmAgreementMutation.mutate({
            agreement_id: id,
            user_id: agreementData.user.id,
            action: 'approve'
        });
    };

    // Transform admin signature from API response
    const formattedAdminSignature = useMemo(() => {
        if (!agreementData?.agreement) return null;

        const adminSig = agreementData.agreement;
        return {
            signature_type: adminSig.signature_type,
            signature_text: adminSig.signature_type === 'type' ? adminSig.signature_text : null,
            signature_font: adminSig.signature_font || null,
            signature_font_style: adminSig.signature_font_style || null,
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
            signature_font: orgSig.signature_font || null,
            signature_font_style: orgSig.signature_font_style || null,
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

    return (
        <div className="p-4 bg-light" style={{ minHeight: '100vh' }}>

            {/* Agreement Document */}
            {agreementData && (
                <Row gutter={[16, 16]}>
                    <Col md={isInteractiveView ? 18 : 24} xs={24}>
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

                    {/* Sidebar - Only show in interactive view */}
                    {isInteractiveView && (
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
                                        loading={updateSignatureMutation.isPending || confirmAgreementMutation.isPending}
                                        className="mt-3"
                                        icon={<EditOutlined />}
                                    >
                                        Submit
                                    </Button>
                                </Card>
                            )}

                            {/* Approve Agreement Button - Show when signature already exists */}
                            {/* {(!needsOrganizerSignature || agreementData?.status === 'pending') && ( */}
                            {(!needsOrganizerSignature && agreementData?.status === 'pending') && (
                                <Card
                                    title="Agreement Actions"
                                    className="shadow-sm mt-3"
                                    bodyStyle={{ padding: 20 }}
                                >
                                    <Button
                                        type="primary"
                                        block
                                        size="large"
                                        onClick={handleApproveAgreement}
                                        loading={confirmAgreementMutation.isPending}
                                        icon={<EditOutlined />}
                                    >
                                        Approve Agreement
                                    </Button>
                                </Card>
                            )}

                            <div className="d-flex justify-content-end w-100 mt-3">
                                <Button icon={<ArrowRightOutlined />} type='primary' onClick={() => navigate('/dashboard')}>Dashboard</Button>
                            </div>
                        </Col>
                    )}

                </Row>
            )}
        </div>
    );
};

export default PreviewAgreement;

