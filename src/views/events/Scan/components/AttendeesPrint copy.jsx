import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Modal, Avatar, Button, Space } from 'antd';
import { UserOutlined, PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import '../../Bookings/pos/POSPrintModal.css';

const AttendeesPrint = forwardRef(({
  attendeesList,
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
        size: 3in 2in;
        margin: 0;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          margin: 0;
          padding: 0;
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

  // Render attendee card
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
        title={
          <Space>
            <UserOutlined />
            <span>Attendees List - {eventData?.name || 'Event'}</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        width={800}
        bodyStyle={{
          backgroundColor: '#fff',
          color: '#000'
        }}
        footer={
          <Space>
            <Button 
              icon={<CloseOutlined />} 
              onClick={handleCancel}
            >
              Close
            </Button>
            <Button 
              type="primary" 
              icon={<PrinterOutlined />}
              onClick={handlePrintClick}
            >
              Print All ({attendeesList?.length || 0})
            </Button>
          </Space>
        }
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

      {/* Print Content */}
      <div ref={printRef} className="attendees-print-body">
        {attendeesList?.map((attendee, index) => (
          <div key={index} className="attendee-badge">
            {/* Header */}
            <div className="badge-header" style={{ borderBottomColor: primaryColor }}>
              <h6 className="badge-title" style={{ color: primaryColor }}>
                Attendee #{index + 1}/{attendeesList.length}
              </h6>
            </div>
            
            {/* Content */}
            <div className="badge-content">
              <div className="badge-row">
                <p className="badge-label">Name:</p>
                <p className="badge-value badge-name">{attendee?.Name || 'N/A'}</p>
              </div>

              {attendee?.Mo && (
                <div className="badge-row">
                  <p className="badge-label">Mobile:</p>
                  <p className="badge-value">{attendee.Mo}</p>
                </div>
              )}

              {attendee?.Email && (
                <div className="badge-row">
                  <p className="badge-label">Email:</p>
                  <p className="badge-value badge-email">{attendee.Email}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="badge-footer">
              <p className="badge-footer-text">
                {eventData?.name || 'Event'} - {ticket?.name || 'Ticket'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
});

AttendeesPrint.displayName = 'AttendeesPrint';

export default AttendeesPrint;