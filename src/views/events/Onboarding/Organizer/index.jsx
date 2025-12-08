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

  // Get the first active agreement for display
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
      payload: { agreement_id: selectedAgreementId },
    });
  }, [agreementAccepted, approveMutation, selectedRecord, selectedAgreementId]);

  const handleAgreementChange = useCallback((value) => {
    setSelectedAgreementId(value);
    setAgreementAccepted(false); // Reset checkbox when agreement changes
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
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                />
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
                  styles={{ body: { maxHeight: 400, overflowY: 'auto' } }}
                >
                  <Typography.Paragraph>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(processedContent),
                      }}
                    />
                  </Typography.Paragraph>
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
          <Typography.Text type="warning">No agreement found. Please create an agreement first.</Typography.Text>
        )}
      </Modal>
    </Card>
  );
};

export default OrganizerOnboarding;
