import React, { useState, useMemo } from 'react';
import { Modal, Button, Space, Tag, message } from 'antd';
import {
  WhatsAppOutlined,
  MessageOutlined,
  MailOutlined,
  CloseOutlined,
  LoadingOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useMyContext } from 'Context/MyContextProvider';
import DataTable from 'views/events/common/DataTable';
import { resendTickets } from '../agent/utils';
import SendTickets from './SendTickets';
import Utils from 'utils';
import PermissionChecker from 'layouts/PermissionChecker';

const BatchDataModel = ({ show, onHide, batchData = [], batchId }) => {
  const { handleWhatsappAlert, extractDetails, HandleSendSMS, sendMail } = useMyContext();
  const [loadingId, setLoadingId] = useState(null);
  const [processingType, setProcessingType] = useState(null);

  // Fetch specific booking data
  console.log(batchData)
  const fetchData = (id) => {
    return batchData?.find((elm) => elm?.id === id);
  };

  // Handle WhatsApp
  const handleWhatsApp = async (id) => {
    const booking = fetchData(id);
    await handleMessageProcess(booking, sendWhatsappTicket, 'WhatsApp', id);
  };

  // Handle SMS
  const handleSMS = async (id) => {
    const booking = fetchData(id);
    await handleMessageProcess(booking, sendSMSTicket, 'SMS', id);
  };

  // Handle Email
  const handleMail = async (id) => {
    const booking = fetchData(id);
    await handleMessageProcess(booking, sendEmailTicket, 'Email', id);
  };

  // Generic message process handler
  const handleMessageProcess = async (booking, typeFunction, processName, id) => {
    if (!booking) {
      message.error('Unable to fetch booking details.');
      return;
    }

    setLoadingId(id);
    setProcessingType(processName);

    // Show loading message
    const hideLoading = message.loading(`Sending ${processName}...`, 0);

    try {
      await typeFunction(booking);
      hideLoading();
      message.success({
        content: `${processName} sent successfully!`,
        duration: 3,
      });
    } catch (error) {
      hideLoading();
      message.error({
        content: Utils.getErrorMessage(error, `Failed to send ${processName}. Please try again.`),
        duration: 3,
      });
      console.error(`${processName} Error:`, error);
    } finally {
      setLoadingId(null);
      setProcessingType(null);
    }
  };

  // Send WhatsApp ticket
  const sendWhatsappTicket = async (booking) => {
    const { eventName, category, location, DateTime, thumbnail } = extractDetails(booking?.data);
    const values = [booking?.name, eventName, 1, category, location, DateTime];
    await handleWhatsappAlert(booking?.number, 'bookingconfirmed2', values, thumbnail);
  };

  // Send SMS ticket
  const sendSMSTicket = async (booking) => {
    const { eventName, organizerSenderId, organizerApiKey, config_status, ticketName } = extractDetails(booking?.data);
    await HandleSendSMS(
      booking?.number,
      null,
      organizerApiKey,
      organizerSenderId,
      config_status,
      booking?.name,
      1,
      ticketName,
      eventName
    );
  };

  // Send Email ticket
  const sendEmailTicket = async (booking) => {
    const { eventName, thumbnail, category, eventDate, eventTime, DateTime, address, location } = extractDetails(booking?.data);
    const data = {
      email: booking?.email,
      number: booking?.number,
      thumbnail,
      category,
      qty: 1,
      name: booking?.name,
      eventName,
      eventDate,
      eventTime,
      DateTime,
      address,
      location,
      price: 0,
      convenience_fee: 0,
      total: 0,
    };
    await sendMail([data]);
  };

  const sendTickets = async (booking) => {
    console.log(booking)
    const response = await resendTickets(booking, 'complimentary_bookings')
    console.log(response)
  };

  // Define columns
  const columns = useMemo(() => [
    {
      title: '#',
      key: 'index',
      align: 'center',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      searchable: true,
      ellipsis: true,
    },
    {
      title: 'Number',
      dataIndex: 'number',
      key: 'number',
      align: 'center',
      searchable: true,
      ellipsis: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      align: 'center',
      searchable: true,
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 120,
      filters: [
        { text: 'Checked', value: 1 },
        { text: 'Unchecked', value: 0 },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? 'Checked' : 'Unchecked'}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 180,
      fixed: 'right',
      render: (_, record) => {
        const isLoading = loadingId === record.id;
        const isDisabled = loadingId !== null && loadingId !== record.id;

        return (
          <Space size="small">
            {/* <Button
              type="default"
              icon={isLoading && processingType === 'WhatsApp' ? <LoadingOutlined /> : <WhatsAppOutlined />}
              onClick={() => handleWhatsApp(record.id)}
              loading={isLoading && processingType === 'WhatsApp'}
              disabled={isDisabled}
              title="Send WhatsApp"
              size="small"
              style={{
                color: '#25D366',
                borderColor: isLoading && processingType === 'WhatsApp' ? '#25D366' : undefined
              }}
            />
            <Button
              type="default"
              icon={isLoading && processingType === 'SMS' ? <LoadingOutlined /> : <MessageOutlined />}
              onClick={() => handleSMS(record.id)}
              loading={isLoading && processingType === 'SMS'}
              disabled={isDisabled}
              title="Send SMS"
              size="small"
              style={{
                color: '#1890ff',
                borderColor: isLoading && processingType === 'SMS' ? '#1890ff' : undefined
              }}
            />
            <Button
              type="default"
              icon={isLoading && processingType === 'Email' ? <LoadingOutlined /> : <MailOutlined />}
              onClick={() => handleMail(record.id)}
              loading={isLoading && processingType === 'Email'}
              disabled={isDisabled}
              title="Send Email"
              size="small"
              style={{
                color: '#f5222d',
                borderColor: isLoading && processingType === 'Email' ? '#f5222d' : undefined
              }}
            /> */}
            <PermissionChecker permission="Resend Complimentary Booking">
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => sendTickets(record)}
                disabled={record?.is_deleted}
                title="Resend Tickets"
                size="small"
              />
            </PermissionChecker>
          </Space>
        );
      },
    },
  ], [loadingId, processingType]);

  return (
    <Modal
      title="Send Tickets"
      open={show}
      onCancel={onHide}
      width={1200}
      footer={[
        <Button key="close" onClick={onHide} icon={<CloseOutlined />}>
          Close
        </Button>,
      ]}
      destroyOnClose
      maskClosable={false}
    >
      <DataTable
        data={batchData}
        columns={columns}
        loading={false}
        enableSearch
        showSearch
        emptyText="No tickets found"
        tableProps={{
          size: 'middle',
          scroll: { x: 800 },
          pagination: {
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} tickets`,
            pageSizeOptions: ['10', '20', '50', '100'],
            position: ['bottomCenter'],
          },
        }}
        extraHeaderContent={
          <Space>
            <SendTickets batchId={batchId} />
          </Space>
        }
      />
    </Modal>
  );
};

export default BatchDataModel;
