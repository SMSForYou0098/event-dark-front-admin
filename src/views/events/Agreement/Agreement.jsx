import React, { useState, useRef } from 'react';
import {
  Modal,
  Button,
  Typography,
  Divider,
  Row,
  Col,
  Checkbox,
  message,
  Upload,
  Tabs,
  Input,
  Select
} from 'antd';
import {
  UploadOutlined,
  EditOutlined,
  FontSizeOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const SIGNATURE_FONTS = [
  { name: 'Brush Script', style: 'Brush Script MT, cursive' },
  { name: 'Lucida Handwriting', style: 'Lucida Handwriting, cursive' },
  { name: 'Snell Roundhand', style: 'Snell Roundhand, cursive' },
  { name: 'Zapfino', style: 'Zapfino, cursive' },
  { name: 'Edwardian Script', style: 'Edwardian Script ITC, cursive' }
];

const AgreementPreview = ({ 
  visible, 
  onClose, 
  agreementData,
  onAccept,
  showAcceptance = true,
  adminSignature = null
}) => {
  const [agreed, setAgreed] = useState(false);
  const [signatureType, setSignatureType] = useState('type');
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]);
  const [typedSignature, setTypedSignature] = useState('');
  const [uploadedSignature, setUploadedSignature] = useState(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleAccept = () => {
    if (!agreed) {
      message.warning('Please accept the terms and conditions');
      return;
    }

    const signatureData = signatureType === 'draw' ? canvasRef.current?.toDataURL() : 
                          signatureType === 'type' ? typedSignature : 
                          uploadedSignature;

    if (!signatureData) {
      message.warning('Please provide your signature');
      return;
    }

    setLoading(true);
    
    const acceptanceData = {
      agreed: true,
      signature: {
        type: signatureType,
        data: signatureData,
        font: signatureType === 'type' ? selectedFont.name : null
      },
      timestamp: new Date().toISOString(),
      ipAddress: 'USER_IP_HERE' // You can get this from backend
    };

    // Simulate API call
    setTimeout(() => {
      console.log('Agreement Accepted:', acceptanceData);
      message.success('Agreement accepted successfully!');
      setLoading(false);
      if (onAccept) onAccept(acceptanceData);
    }, 1000);
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

  const renderAdminSignature = () => {
    if (!adminSignature) return <Text type="secondary">No signature</Text>;

    if (adminSignature.type === 'draw' || adminSignature.type === 'upload') {
      return <img src={adminSignature.data} alt="Admin Signature" className="img-fluid" style={{ maxHeight: '80px' }} />;
    }
    
    if (adminSignature.type === 'type') {
      return (
        <div style={{ 
          fontFamily: SIGNATURE_FONTS.find(f => f.name === adminSignature.font)?.style || 'cursive', 
          fontSize: '32px' 
        }}>
          {adminSignature.data}
        </div>
      );
    }
    
    return <Text type="secondary">No signature</Text>;
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={showAcceptance ? [
        <Button key="decline" onClick={onClose}>
          Decline
        </Button>,
        <Button 
          key="accept" 
          type="primary" 
          icon={<CheckCircleOutlined />}
          onClick={handleAccept}
          loading={loading}
          disabled={!agreed}
        >
          Accept & Sign Agreement
        </Button>
      ] : [
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button key="download" type="primary">
          Download PDF
        </Button>
      ]}
    >
      <div className="p-4" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <Title level={3} className="text-center mb-4">
          PARTNER AGREEMENT
        </Title>
        
        <div className="border border-2 p-4 bg-light rounded">
          <Title level={4} className="mb-3">
            {agreementData?.agreementTitle || 'Event Organizer Partnership Agreement'}
          </Title>
          <div className="mb-3">
            <Text type="secondary">Version: {agreementData?.version || 'v1.0'}</Text>
            <Text type="secondary" className="ms-3">
              Status: <span className="text-capitalize badge bg-success">{agreementData?.agreementStatus || 'Active'}</span>
            </Text>
          </div>
          
          <Divider />
          
          <Row gutter={[16, 16]} className="mb-4">
            <Col span={12}>
              <Text strong>Effective Date:</Text>
              <div>{agreementData?.effectiveDate?.format?.('DD MMMM YYYY') || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </Col>
            <Col span={12}>
              <Text strong>Jurisdiction:</Text>
              <div>{agreementData?.jurisdiction || 'Mumbai, Maharashtra, India'}</div>
            </Col>
          </Row>

          <Divider orientation="left"><strong>1. Financial Terms</strong></Divider>
          <Row gutter={[16, 16]} className="mb-4">
            <Col span={8}>
              <Text strong>Commission Rate:</Text>
              <div className="text-primary fs-5">{agreementData?.commissionValue || 15}%</div>
              <Text type="secondary" className="small">Per ticket sold</Text>
            </Col>
            <Col span={8}>
              <Text strong>Settlement Cycle:</Text>
              <div className="text-capitalize">{agreementData?.settlementCycle || 'Weekly'}</div>
              <Text type="secondary" className="small">Payment frequency</Text>
            </Col>
            <Col span={8}>
              <Text strong>Minimum Payout:</Text>
              <div>₹{agreementData?.minimumPayout?.toLocaleString('en-IN') || '1,000'}</div>
              <Text type="secondary" className="small">Threshold amount</Text>
            </Col>
            <Col span={24}>
              <Text strong>Payment Gateway Charges:</Text>
              <div className="text-capitalize">{agreementData?.platformFeeResponsibility || 'Organizer Bears'}</div>
            </Col>
          </Row>

          <Divider orientation="left"><strong>2. Event Management Terms</strong></Divider>
          <Row gutter={[16, 16]} className="mb-4">
            <Col span={12}>
              <Text strong>Event Approval Process:</Text>
              <div>{agreementData?.autoApproveEvents ? '✓ Auto-Approved' : '✗ Manual Review Required'}</div>
            </Col>
            <Col span={12}>
              <Text strong>Cancellation Notice Period:</Text>
              <div>{agreementData?.eventCancellationNoticeDays || 7} days minimum</div>
            </Col>
            <Col span={12}>
              <Text strong>Refund Processing Time:</Text>
              <div>{agreementData?.refundProcessingDays || 7} business days</div>
            </Col>
            <Col span={24}>
              <Text strong>Allowed Event Categories:</Text>
              <div className="mt-2">
                {agreementData?.allowedCategories?.map(cat => (
                  <span key={cat} className="badge bg-primary me-2 text-capitalize">{cat}</span>
                )) || (
                  <>
                    <span className="badge bg-primary me-2">Music</span>
                    <span className="badge bg-primary me-2">Sports</span>
                    <span className="badge bg-primary me-2">Theatre</span>
                  </>
                )}
              </div>
            </Col>
          </Row>

          <Divider orientation="left"><strong>3. Data Privacy & Access</strong></Divider>
          <Row gutter={[16, 16]} className="mb-4">
            <Col span={24}>
              <Text strong>Customer Data Access Level:</Text>
              <div className="text-capitalize mt-1">{agreementData?.customerDataAccess || 'Limited (Name & Email only)'}</div>
              <Text type="secondary" className="small d-block mt-2">
                Partner agrees to comply with all applicable data protection laws and regulations.
              </Text>
            </Col>
          </Row>

          <Divider orientation="left"><strong>4. Termination Clause</strong></Divider>
          <Row gutter={[16, 16]} className="mb-4">
            <Col span={24}>
              <Text strong>Notice Period:</Text>
              <div className="mt-1">{agreementData?.terminationNoticeDays || 30} days written notice required by either party.</div>
              <Text type="secondary" className="small d-block mt-2">
                All pending settlements will be processed within 60 days of termination.
              </Text>
            </Col>
          </Row>

          {agreementData?.description && (
            <>
              <Divider orientation="left"><strong>5. Agreement Description</strong></Divider>
              <Paragraph className="mb-4">
                {agreementData.description}
              </Paragraph>
            </>
          )}

          {agreementData?.customClauses && (
            <>
              <Divider orientation="left"><strong>6. Additional Terms & Conditions</strong></Divider>
              <Paragraph className="mb-4" style={{ whiteSpace: 'pre-wrap' }}>
                {agreementData.customClauses}
              </Paragraph>
            </>
          )}

          <Divider orientation="left"><strong>Signatures</strong></Divider>
          <Row gutter={16} className="mt-4">
            <Col span={12}>
              <div className="border border-2 rounded p-3 text-center bg-white">
                <Text strong className="d-block mb-3">Platform Authorized Signatory</Text>
                <div style={{ minHeight: '100px' }} className="d-flex align-items-center justify-content-center">
                  {renderAdminSignature()}
                </div>
                <Divider className="my-2" />
                <Text type="secondary" className="d-block">Digital Signature</Text>
                <Text type="secondary" className="d-block mt-2">
                  Date: {new Date().toLocaleDateString('en-IN')}
                </Text>
              </div>
            </Col>
            <Col span={12}>
              <div className="border border-2 rounded p-3 text-center bg-white">
                <Text strong className="d-block mb-3">Partner / Organizer</Text>
                <div style={{ minHeight: '100px' }} className="d-flex align-items-center justify-content-center">
                  <Text type="secondary">(Your signature will appear here)</Text>
                </div>
                <Divider className="my-2" />
                <Text type="secondary" className="d-block">Digital Signature</Text>
                <Text type="secondary" className="d-block mt-2">
                  Date: {new Date().toLocaleDateString('en-IN')}
                </Text>
              </div>
            </Col>
          </Row>
        </div>

        {showAcceptance && (
          <>
            <Divider />
            <div className="p-4 border border-2 rounded">
              <Title level={5} className="mb-3">Partner Signature Required</Title>
              
              <Tabs activeKey={signatureType} onChange={setSignatureType}>
                <Tabs.TabPane tab={<><EditOutlined /> Draw</>} key="draw">
                  <div className="text-center">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={150}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="border border-2 rounded"
                      style={{ cursor: 'crosshair', maxWidth: '100%' , background: 'white'}}
                    />
                    <div className="mt-3">
                      <Button onClick={clearCanvas} danger size="small">Clear</Button>
                    </div>
                  </div>
                </Tabs.TabPane>

                <Tabs.TabPane tab={<><FontSizeOutlined /> Type</>} key="type">
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <label className="d-block mb-2"><Text strong>Font Style:</Text></label>
                      <Select 
                        value={selectedFont.name}
                        onChange={(val) => setSelectedFont(SIGNATURE_FONTS.find(f => f.name === val))}
                        className="w-100"
                      >
                        {SIGNATURE_FONTS.map(font => (
                          <Option key={font.name} value={font.name}>
                            <span style={{ fontFamily: font.style }}>{font.name}</span>
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    <Col xs={24} md={12}>
                      <label className="d-block mb-2"><Text strong>Your Name:</Text></label>
                      <Input
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        placeholder="Enter your full name"
                        maxLength={50}
                      />
                    </Col>
                    <Col xs={24} className="mt-3">
                      <div className="border border-2 rounded p-3 text-center bg-white">
                        <Text type="secondary" className="d-block mb-2">Preview:</Text>
                        {typedSignature ? (
                          <div style={{ fontFamily: selectedFont.style, fontSize: '28px' }}>
                            {typedSignature}
                          </div>
                        ) : (
                          <Text type="secondary">Type your name to preview</Text>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Tabs.TabPane>

                <Tabs.TabPane tab={<><UploadOutlined /> Upload</>} key="upload">
                  <div className="text-center">
                    <Upload
                      accept="image/jpeg,image/png,image/jpg"
                      beforeUpload={beforeUpload}
                      onChange={handleImageUpload}
                      showUploadList={false}
                    >
                      <Button icon={<UploadOutlined />} type="dashed">
                        Upload Signature Image
                      </Button>
                    </Upload>
                    <Text type="secondary" className="d-block mt-2 small">
                      JPG/PNG, Max 2MB
                    </Text>
                    {uploadedSignature && (
                      <div className="border rounded p-3 mt-3 d-inline-block bg-white">
                        <img src={uploadedSignature} alt="Signature" style={{ maxHeight: '100px' }} />
                      </div>
                    )}
                  </div>
                </Tabs.TabPane>
              </Tabs>

              <Divider />

              <Checkbox 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)}
                className="mb-3"
              >
                <Text strong>
                  I have read and agree to all the terms and conditions mentioned in this Partner Agreement
                </Text>
              </Checkbox>

              <div className="p-3 bg-white border rounded">
                <Text type="secondary" className="small">
                  <strong>Legal Notice:</strong> By checking the box above and providing your signature, you acknowledge that:
                  <ul className="mb-0 mt-2">
                    <li>You have read and understood all terms</li>
                    <li>This constitutes a legally binding electronic signature</li>
                    <li>Your acceptance is recorded with timestamp and IP address</li>
                  </ul>
                </Text>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
export default AgreementPreview
// Demo Usage Component
// const DemoUsage = () => {
//   const [visible, setVisible] = useState(false);

//   const sampleAgreementData = {
//     agreementTitle: 'Standard Event Organizer Partnership Agreement',
//     version: 'v2.1',
//     agreementStatus: 'active',
//     effectiveDate: { format: (fmt) => '15 October 2025' },
//     jurisdiction: 'Mumbai, Maharashtra, India',
//     commissionValue: 15,
//     settlementCycle: 'weekly',
//     minimumPayout: 1000,
//     platformFeeResponsibility: 'organizer',
//     autoApproveEvents: false,
//     eventCancellationNoticeDays: 7,
//     refundProcessingDays: 7,
//     customerDataAccess: 'limited',
//     terminationNoticeDays: 30,
//     allowedCategories: ['music', 'sports', 'theatre', 'comedy'],
//     description: 'This agreement governs the partnership between the Platform and Event Organizer for hosting and managing events.',
//     customClauses: 'Partner must maintain valid insurance.\nAll promotional materials require platform approval.'
//   };

//   const sampleAdminSignature = {
//     type: 'type',
//     data: 'John Administrator',
//     font: 'Brush Script'
//   };

//   const handleAccept = (acceptanceData) => {
//     console.log('User accepted agreement:', acceptanceData);
//     setVisible(false);
//     // Save to backend here
//   };

//   return (
//     <div className="p-5 text-center">
//       <Title level={3}>Agreement Preview Component Demo</Title>
//       <Button type="primary" size="large" onClick={() => setVisible(true)}>
//         Show Agreement for User Acceptance
//       </Button>

//       <AgreementPreview
//         visible={visible}
//         onClose={() => setVisible(false)}
//         agreementData={sampleAgreementData}
//         adminSignature={sampleAdminSignature}
//         onAccept={handleAccept}
//         showAcceptance={true}
//       />
//     </div>
//   );
// };

// export default DemoUsage;