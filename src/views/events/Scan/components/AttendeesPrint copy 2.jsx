import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Modal, Avatar, Button, Space, Table, Typography } from 'antd';
import { UserOutlined, PrinterOutlined, CloseOutlined } from '@ant-design/icons';
// import '../../Bookings/pos/POSPrintModal.css';
// import './AttendeesPrint.css'

const { Title, Text } = Typography;

const AttendeesPrint = forwardRef(({
  attendeesList = [],
  eventData,
  ticket,
  bookings,
  primaryColor = '#B51515' 
}, ref) => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const printRef = useRef(null);

  // Print all attendees
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Attendees-${eventData?.name || 'Event'}`,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        * {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .pos-print-body {
          width: 80mm !important;
          padding: 8px !important;
          font-size: 14px !important;
          margin: 0 !important;
        }
        
        .pos-print-body * {
          font-size: 14px !important;
        }
        
        .pos-print-body h4 {
          font-size: 18px !important;
          margin: 5px 0 !important;
        }
        
        .pos-print-body .ant-table {
          font-size: 14px !important;
          margin-top: 10px !important;
          margin-bottom: 10px !important;
        }
        
        .pos-print-body .ant-table-cell {
          padding: 6px 4px !important;
          font-size: 14px !important;
        }
        
        .pos-print-body .summary-row {
          font-size: 14px !important;
          padding: 3px 0 !important;
        }
        
        .pos-print-body .footer-text {
          font-size: 14px !important;
          margin: 8px 0 4px 0 !important;
        }
        
        .pos-print-body .website-text {
          font-size: 12px !important;
          margin: 0 !important;
        }
      }
    `
  });

  // Show modal
  const showModal = () => {
    setIsModalOpen(true);
  };

  // Close modal
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // Handle print
  const handlePrintClick = () => {
    handlePrint();
  };

  // Expose functions to parent
  useImperativeHandle(ref, () => ({
    handlePrintAllAttendees: showModal
  }));

  // Attendee columns for table (using useMemo like POSPrintModal)
  const attendeeColumns = React.useMemo(() => [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      width: '10%',
      align: 'center',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '40%',
      align: 'left',
    },
    {
      title: 'Mobile',
      dataIndex: 'mobile',
      key: 'mobile',
      width: '25%',
      align: 'left',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '25%',
      align: 'left',
      ellipsis: true,
    },
  ], []);

  // Transform attendees data for table (using useMemo like POSPrintModal)
  const attendeeTableData = React.useMemo(() => {
    return attendeesList?.map((attendee, index) => ({
      key: index,
      index: index + 1,
      name: attendee?.Name || 'N/A',
      mobile: attendee?.Mo || '-',
      email: attendee?.Email || '-',
    }));
  }, [attendeesList]);

  // Summary columns (like POSPrintModal)
  const summaryColumns = React.useMemo(() => [
    {
      dataIndex: 'label',
      key: 'label',
      align: 'right',
    },
    {
      dataIndex: 'value',
      key: 'value',
      align: 'right',
      width: '40%',
    },
  ], []);

  // Summary data (like POSPrintModal)
  const summaryData = React.useMemo(() => [
    {
      key: '1',
      label: <strong style={{ fontSize: '16px' }}>TOTAL ATTENDEES</strong>,
      value: <strong style={{ fontSize: '16px' }}>{attendeesList?.length || 0}</strong>,
    },
  ], [attendeesList]);

  // Render attendee card for modal preview
  const renderAttendeeCard = (attendee, index) => (
    <div className="card h-100 bg-white">
      <div className="card-body">
        <Space size="middle" align="start">
          {attendee?.Photo ? (
            <Avatar 
              src={attendee.Photo}
              size={64}
              shape="square"
              style={{ 
                border: `2px solid ${primaryColor}`,
                flexShrink: 0
              }}
            />
          ) : (
            <Avatar 
              icon={<UserOutlined />}
              size={64}
              shape="square"
              style={{ 
                border: `2px solid ${primaryColor}`,
                backgroundColor: '#f0f0f0',
                color: primaryColor,
                flexShrink: 0
              }}
            />
          )}
          
          <div className="flex-grow-1">
            <h6 className="mb-2 fw-bold text-black">{attendee?.Name || 'N/A'}</h6>
            {attendee?.Mo && (
              <p className="mb-1 small text-black">📱 {attendee.Mo}</p>
            )}
            {attendee?.Email && (
              <p className="mb-0 small text-break text-black">✉️ {attendee.Email}</p>
            )}
          </div>
        </Space>
      </div>
    </div>
  );

  return (
    <>
      <Modal
        title="Attendees List"
        open={isModalOpen}
        onCancel={handleCancel}
        width={800}
        bodyStyle={{
          background : 'fff'
        }}
        footer={[
          <Button key="close" onClick={handleCancel} icon={<CloseOutlined />}>
            Close
          </Button>,
          <Button 
            key="print" 
            className='border-0' 
            type="primary" 
            onClick={handlePrintClick} 
            icon={<PrinterOutlined />}
          >
            Print Attendees List
          </Button>,
        ]}
      >
        <div className="bg-white">
          <div className="mb-3">
            <p className="mb-1 text-muted">
              Total Attendees: <span className="fw-bold text-black">{attendeesList?.length || 0}</span>
            </p>
            <p className="mb-0 text-muted">
              Ticket: <span className="fw-bold text-black">{ticket?.name || 'N/A'}</span>
            </p>
          </div>

          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <div className="row g-3">
              {attendeesList?.map((attendee, index) => (
                <div className="col-12 col-md-6" key={index}>
                  {renderAttendeeCard(attendee, index)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Print Content - POS Style */}
      <div ref={printRef} className="pos-print-body" style={{ padding: '10px 15px' }}>
        <div style={{ textAlign: 'center' }}>
          {eventData?.name && (
            <Title level={4} style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
              {eventData.name}
            </Title>
          )}

          <Text strong style={{ 
            fontSize: '14px', 
            display: 'block', 
            marginBottom: '5px' 
          }}>
            Attendees List
          </Text>

          {ticket?.name && (
            <Text style={{ 
              fontSize: '14px', 
              display: 'block', 
              marginBottom: '10px',
              color: '#666'
            }}>
              Ticket: {ticket.name}
            </Text>
          )}

          <Table
            columns={attendeeColumns}
            dataSource={attendeeTableData}
            pagination={false}
            size="small"
            bordered
            style={{ marginBottom: '10px', fontSize: '14px' }}
          />

          <Table
            columns={summaryColumns}
            dataSource={summaryData}
            pagination={false}
            size="small"
            showHeader={false}
            bordered={false}
            style={{ marginBottom: '10px' }}
          />

          <Text className="footer-text" style={{ 
            display: 'block', 
            fontSize: '14px', 
            margin: '8px 0 4px 0' 
          }}>
            Thank You
          </Text>

          <Text type="secondary" className="website-text" style={{ 
            fontSize: '12px',
            display: 'block',
            margin: 0
          }}>
            www.getyourticket.in
          </Text>
        </div>
      </div>
    </>
  );
});

AttendeesPrint.displayName = 'AttendeesPrint';

export default AttendeesPrint;