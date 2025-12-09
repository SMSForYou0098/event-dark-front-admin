import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Button,
  Card,
  Modal,
  Table,
  Space,
  Spin,
  Popconfirm,
  Checkbox,
  Typography,
  Select,
  Tooltip,
} from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import DOMPurify from 'dompurify';
import SignatureDisplay from 'components/shared-components/SignatureDisplay';
import {
  useGetAllOrganizerOnboarding,
  useApproveOrganizerOnboarding,
  useRejectOrganizerOnboarding,
} from './useOrganizerOnboarding';
import { useGetAllOrganizerAgreements } from '../../Agreement/Organizer/useOrganizerAgreement';

const OrganizerOnboarding = () => {
  // ========================= STATE =========================
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedAgreementId, setSelectedAgreementId] = useState(null);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  // ========================= TANSTACK QUERY HOOKS =========================
  const { data: onboardingRequests = [], isLoading } = useGetAllOrganizerOnboarding();
  const { data: agreements = [] } = useGetAllOrganizerAgreements();

  const approveMutation = useApproveOrganizerOnboarding({
    onSuccess: () => handleModalClose(),
  });

  const rejectMutation = useRejectOrganizerOnboarding();

  // Get the selected agreement
  const selectedAgreement = useMemo(() => {
    if (selectedAgreementId) {
      return agreements.find((a) => a.id === selectedAgreementId);
    }
    return null;
  }, [agreements, selectedAgreementId]);

  // Agreement options for select dropdown
  const agreementOptions = useMemo(() => {
    return agreements
      .filter((a) => a.status === 1 || a.status === true)
      .map((a) => ({ label: a.title, value: a.id }));
  }, [agreements]);

  // Auto-select if only one agreement is available
  useEffect(() => {
    if (agreementOptions.length === 1 && !selectedAgreementId) {
      setSelectedAgreementId(agreementOptions[0].value);
    }
  }, [agreementOptions, selectedAgreementId]);

  // Replace placeholders in agreement content
  const processedContent = useMemo(() => {
    if (!selectedAgreement?.content || !selectedRecord) return selectedAgreement?.content || '';

    return selectedAgreement.content
      .replace(/:C_Name/g, `<strong>${selectedRecord.name || ''}</strong>`)
      .replace(/:ORG_Name/g, `<strong>${selectedRecord.organisation || ''}</strong>`);
  }, [selectedAgreement, selectedRecord]);

  // Helper function to generate signature HTML
  const generateSignatureHTML = (signatureData, label) => {
    if (!signatureData) return '';

    const {
      signature_type,
      signature_text,
      signature_font_style,
      signature_image,
      signatory_name,
      signing_date,
      updated_at
    } = signatureData;

    let signatureContent = '';

    // Type signature
    if (signature_type === 'type' && signature_text) {
      signatureContent = `
        <div style="font-family: ${signature_font_style || 'cursive'}; font-size: 32px; margin-bottom: 8px; color: #000; line-height: 1.2;">
          ${signature_text}
        </div>
      `;
    }

    // Draw or Upload signature
    if ((signature_type === 'draw' || signature_type === 'upload') && signature_image) {
      const imgSrc = signature_image.startsWith('data:') || signature_image.startsWith('http')
        ? signature_image
        : signature_image;
      
      signatureContent = `
        <div style="margin-bottom: 8px; display: inline-block; background-color: #fff;">
          <img 
            src="${imgSrc}" 
            alt="Signature" 
            style="max-width: 250px; max-height: 100px; display: block; border: 1px solid #d9d9d9; border-radius: 4px; padding: 8px; background-color: #fff;"
          />
        </div>
      `;
    }

    const signatoryHTML = signatory_name 
      ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">${signatory_name}</div>` 
      : '';

    const dateHTML = (signing_date || updated_at)
      ? `<div style="font-size: 11px; color: #666; margin-top: 2px;">
          Signed on: ${new Date(signing_date || updated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div>`
      : '';

    return `
      <div style="text-align: right;">
        <div style="font-weight: 600; display: block; margin-bottom: 8px;">${label}</div>
        ${signatureContent}
        ${signatoryHTML}
        ${dateHTML}
      </div>
    `;
  };

  // Generate complete email HTML
  const generateEmailHTML = useMemo(() => {
    if (!selectedAgreement || !selectedRecord) return '';

    const adminSignatureHTML = generateSignatureHTML(agreements[0], 'Admin Signature:');
    const organizerSignatureHTML = generateSignatureHTML(
      selectedRecord?.organizer_signature,
      'Organizer Signature:'
    );

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="margin-bottom: 16px; padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
          ${processedContent}
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 32px; border-top: 1px solid #f0f0f0; padding-top: 16px;">
          <div style="flex: 1; padding-right: 20px;">
            ${adminSignatureHTML}
          </div>
          <div style="flex: 1; padding-left: 20px;">
            ${organizerSignatureHTML}
          </div>
        </div>
      </div>
    `;
  }, [selectedAgreement, selectedRecord, processedContent, agreements]);

  // ========================= MODAL HANDLERS =========================
  const handleModalClose = useCallback(() => {
    setApproveModalVisible(false);
    setSelectedRecord(null);
    setSelectedAgreementId(null);
    setAgreementAccepted(false);
  }, []);

  const handleApproveClick = useCallback((record) => {
    setSelectedRecord(record);
    setAgreementAccepted(false);
    setApproveModalVisible(true);
  }, []);

  const handleApproveConfirm = useCallback(() => {
    if (!agreementAccepted || !selectedAgreementId) {
      return;
    }

    approveMutation.mutate({
      id: selectedRecord?.id,
      payload: {
        agreement_id: selectedAgreementId,
        action: 'approve',
        email_html_content: generateEmailHTML, // Complete HTML with signatures
        agreement_title: selectedAgreement?.title,
        organizer_email: selectedRecord?.email,
        organizer_name: selectedRecord?.name,
        organization_name: selectedRecord?.organisation,
      },
    });
  }, [
    agreementAccepted,
    approveMutation,
    selectedRecord,
    selectedAgreementId,
    generateEmailHTML,
    selectedAgreement,
  ]);

  const handleAgreementChange = useCallback((value) => {
    setSelectedAgreementId(value);
    setAgreementAccepted(false);
  }, []);

  const handleReject = useCallback(
    (id) => {
      rejectMutation.mutate(id);
    },
    [rejectMutation]
  );

  // ========================= TABLE COLUMNS =========================
  const columns = useMemo(
    () => [
      {
        title: '#',
        render: (_, __, i) => i + 1,
        width: 60,
      },
      {
        title: 'Name',
        dataIndex: 'name',
        sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      },
      {
        title: 'Organization',
        dataIndex: 'organisation',
        sorter: (a, b) => (a.organization || '').localeCompare(b.organization || ''),
      },
      {
        title: 'Number',
        dataIndex: 'number',
      },
      {
        title: 'Email',
        dataIndex: 'email',
      },
      {
        title: 'Action',
        align: 'center',
        fixed: 'right',
        width: 150,
        render: (_, record) => (
          <Space>
            <Tooltip title="Approve">
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApproveClick(record)}
              />
            </Tooltip>
            <Tooltip title="Reject">
              <Popconfirm
                title="Reject this request?"
                onConfirm={() => handleReject(record.id)}
              >
                <Button danger size="small" icon={<CloseOutlined />} />
              </Popconfirm>
            </Tooltip>
          </Space>
        ),
      },
    ],
    [handleApproveClick, handleReject]
  );

  const isSubmitting = approveMutation.isPending;

  // ========================= RENDER =========================
  return (
    <Card bordered={false} title="Organizer Onboarding Requests">
      <Spin spinning={isLoading}>
        <Table
          rowKey="id"
          dataSource={onboardingRequests}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Spin>

      <Modal
        open={approveModalVisible}
        title="Approve Organizer - Agreement"
        onCancel={handleModalClose}
        width={800}
        footer={[
          <Button key="cancel" onClick={handleModalClose}>
            Cancel
          </Button>,
          <Button
            key="approve"
            type="primary"
            loading={isSubmitting}
            disabled={!agreementAccepted || !selectedAgreementId}
            onClick={handleApproveConfirm}
          >
            Approve
          </Button>,
        ]}
        destroyOnClose
      >
        {agreementOptions.length > 0 ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Select Agreement Template:</Typography.Text>
              <Select
                placeholder="Choose an agreement template"
                style={{ width: '100%', marginTop: 8 }}
                options={agreementOptions}
                value={selectedAgreementId}
                onChange={handleAgreementChange}
              />
            </div>

            {selectedAgreement && (
              <>
                <Card
                  style={{ marginBottom: 16 }}
                  styles={{ body: { maxHeight: 400, overflowY: 'auto', position: 'relative' } }}
                >
                  <Typography.Paragraph>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(processedContent),
                      }}
                    />
                  </Typography.Paragraph>

                  <div className="d-flex justify-content-between">
                    <SignatureDisplay
                      signatureData={agreements[0]}
                      label="Admin Signature:"
                      align="right"
                      showBorder={false}
                    />
                    <SignatureDisplay
                      signatureData={selectedRecord?.organizer_signature}
                      label="Organizer Signature:"
                      align="right"
                      showBorder={false}
                    />
                  </div>
                </Card>
                <Checkbox
                  checked={agreementAccepted}
                  onChange={(e) => setAgreementAccepted(e.target.checked)}
                >
                  I confirm that the organizer has accepted this agreement
                </Checkbox>
              </>
            )}
          </>
        ) : (
          <Typography.Text type="warning">
            No agreement found. Please create an agreement first.
          </Typography.Text>
        )}
      </Modal>
    </Card>
  );
};

export default OrganizerOnboarding;
