import { Modal, Form, Input, Button, Upload, Row, Col, Typography, Space, Radio, Image, Alert, Spin, Segmented, Switch } from 'antd';
import { MailOutlined, WhatsAppOutlined, MessageOutlined, UploadOutlined, FileImageOutlined, FileTextOutlined, FileOutlined, CloseOutlined, LoadingOutlined, EditOutlined } from '@ant-design/icons';
import { useMyContext } from 'Context/MyContextProvider';
// import api from 'auth/FetchInterceptor';
import confirm_loader from '../../../../assets/event/stock/booking_confirm.gif'
import { useUserByNumber } from './useAgentBookingHooks';
import { useEffect, useState } from 'react';
const { Title, Text } = Typography;
const { TextArea } = Input;

// Handle document open function
export const handleDocumentOpen = (doc) => {
  // If it's a string URL (from server), just open it in a new tab
  if (typeof doc === 'string') {
    window.open(doc, '_blank');
  }
  // If it's a File object, handle different file types
  else if (doc && typeof doc === 'object' && doc.name) {
    const url = URL.createObjectURL(doc);

    if (doc.type && doc.type.includes('image')) {
      window.open(url, '_blank');
    } else if (doc.type && doc.type.includes('pdf')) {
      window.open(url, '_blank');
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name || 'document';
      a.click();
      URL.revokeObjectURL(url);
    }
  }
};

// Get file icon component
const getFileIcon = (doc) => {
  if (typeof doc === 'string') {
    // For string URLs, check file extension
    if (doc.toLowerCase().endsWith('.pdf')) {
      return <FileTextOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />;
    } else if (doc.toLowerCase().match(/\.(doc|docx)$/)) {
      return <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
    } else if (doc.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
      return <FileImageOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
    } else {
      return <FileOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />;
    }
  } else if (doc && typeof doc === 'object' && doc.type) {
    // For File objects, check MIME type
    if (doc.type.includes('pdf')) {
      return <FileTextOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />;
    } else if (doc.type.includes('word') || (doc.name && doc.name.match(/\.(doc|docx)$/))) {
      return <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
    } else if (doc.type.includes('image')) {
      return <FileImageOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
    } else {
      return <FileOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />;
    }
  } else {
    return <FileOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />;
  }
};

// Get file name
const getFileName = (doc) => {
  const filename = typeof doc === 'string'
    ? doc.split('/').pop()
    : (doc && typeof doc === 'object' && doc.name ? doc.name : "Document uploaded");

  return filename.length > 22
    ? filename.slice(0, 10) + '...' + filename.slice(-9)
    : filename;
};

const AgentBookingModal = (props) => {
  const { loader } = useMyContext();
  const {
    showPrintModel,
    handleClose,
    confirm,
    disabled,
    loading,
    userDetails,
    setUserDetails,
    handleSubmit,
    setMethod,
    method,
    setConfirmed,
    isAccreditation = false,
    bookingError,
    isEditing,
    setIsEditing,
    isCardBooking,
  } = props;

  const [form] = Form.useForm();
  // const [isExist, setIsExist] = useState(false);
  // const [checkingUser, setCheckingUser] = useState(false);

  // Fetch user details by number
  const { data: userResponse, isLoading: isCheckingUser } = useUserByNumber(userDetails.number, {
    enabled: !!userDetails.number && (userDetails.number.length === 10 || userDetails.number.length === 12)
  });

  const isExist = !!userResponse?.status;




  // Update form and state when user is found
  useEffect(() => {
    if (userResponse?.status && userResponse?.user) {
      const user = userResponse.user;
      const newDetails = {
        ...userDetails,
        name: user.name || '',
        email: user.email || '',
        photo: user.photo || null,
        doc: user.doc || null,
        companyName: user.company_name || '',
        designation: user.designation || '',
        address: user.address || ''
      };
      setUserDetails(newDetails);

      form.setFieldsValue({
        name: user.name || '',
        email: user.email || '',
        companyName: user.company_name || '',
        designation: user.designation || '',
        address: user.address || ''
      });
    }
  }, [userResponse, form, setUserDetails]); // Added setUserDetails to dependency array

  // Effect to check user when number changes
  // Clear fields if number is cleared or invalid
  useEffect(() => {
    if (!userDetails.number || (userDetails.number.length !== 10 && userDetails.number.length !== 12)) {
      // Only clear if it was previously set (to avoid infinite loops or clearing on initial render if empty)
      if (userDetails.name || userDetails.email) {
        // setUserDetails(prev => ({ ...prev, name: '', email: '', companyName: '', designation: '', address: '', photo: null, doc: null }));
        form.setFieldsValue({
          name: '',
          email: '',
          companyName: '',
          designation: '',
          address: ''
        });
        setIsEditing(false);
      }
    }
  }, [userDetails.number]);

  // Reset fields on modal close
  const resetAllFields = () => {
    form.resetFields();
    setUserDetails({
      name: '',
      number: '',
      email: '',
      photo: null,
      doc: null,
      companyName: '',
      designation: '',
      address: '',
      card_allocated: false
    });
    // setIsExist(false);
    setIsEditing(false);
    setMethod('UPI');
  };

  // Handle modal close
  const handleModalClose = () => {
    if (!disabled) {
      resetAllFields();
      handleClose();
      setConfirmed(false);
    }
  };

  // Handle form submit
  const onFinish = (values) => {
    handleSubmit();
  };

  // Payment options
  const paymentOptions = ["Cash", "UPI", "Net Banking"];

  // Custom upload button for photo
  const uploadPhotoButton = (
    <div>
      <UploadOutlined />
      <div style={{ marginTop: 8 }}>Upload Photo</div>
    </div>
  );

  // Custom upload button for document
  const uploadDocButton = (
    <div>
      <UploadOutlined />
      <div style={{ marginTop: 8 }}>Upload Document</div>
    </div>
  );

  // Handle photo upload
  const handlePhotoChange = (info) => {
    const file = info.file.originFileObj || info.file;
    setUserDetails(prev => ({ ...prev, photo: file }));
  };

  // Handle document upload
  const handleDocChange = (info) => {
    const file = info.file.originFileObj || info.file;
    setUserDetails(prev => ({ ...prev, doc: file }));
  };

  // Render content based on state
  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Image src={loader} width={150} preview={false} />
        </div>
      );
    }

    if (confirm) {
      return (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Image src={confirm_loader} width={150} preview={false} style={{ marginBottom: 16 }} />
          <Title level={3}>Booking Confirmed</Title>
          <Text type="secondary" style={{ display: 'block', margin: '20px 0' }}>
            Ticket sent on Email/WhatsApp/SMS.
          </Text>

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button
              type="primary"
              size="large"
              block
              onClick={handleModalClose}
              disabled={disabled}
            >
              {disabled ? 'Please Wait' : 'Close'}
            </Button>

            {isAccreditation && (
              <Button
                type="default"
                size="large"
                block
                disabled={disabled}
              >
                {disabled ? 'Please Wait' : 'Generate Ticket'}
              </Button>
            )}
          </Space>
        </div>
      );
    }

    return (
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          method: 'UPI'
        }}
      >
        {bookingError && (
          <Alert
            message={bookingError}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Row gutter={[16, 16]}>
          {/* Phone Number */}
          <Col span={24}>
            <Form.Item
              label="Phone Number"
              name="number"
              rules={[
                { required: true, message: 'Please enter phone number' },
                {
                  pattern: /^[0-9]{10,12}$/,
                  message: 'Please enter valid phone number (10 or 12 digits)'
                }
              ]}
            >
              <Input
                placeholder="Enter Phone Number"
                type="number"
                value={userDetails.number}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 12);
                  setUserDetails(prev => ({ ...prev, number: value }));
                }}
                maxLength={12}
                suffix={isCheckingUser && <LoadingOutlined />}
                disabled={isEditing}
              />
            </Form.Item>

            {isCheckingUser && (
              <Alert
                message="Checking user details..."
                type="info"
                showIcon
                icon={<LoadingOutlined />}
                style={{ marginBottom: 16 }}
              />
            )}
          </Col>

          {/* Show other fields only after valid number is entered */}
          {!isCheckingUser && userDetails.number && (userDetails.number.length === 10 || userDetails.number.length === 12) && (
            <>
              {/* Name */}
              <Col span={24}>
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[{ required: true, message: 'Please enter name' }]}
                >
                  <Input
                    placeholder="Enter Name"
                    value={userDetails.name}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, name: e.target.value }))}
                    maxLength={50}
                    disabled={isExist}
                  />
                </Form.Item>
              </Col>

              {/* Email */}
              <Col span={24}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter email' },
                    { type: 'email', message: 'Please enter valid email' }
                  ]}
                >
                  <Input
                    placeholder="Enter Email"
                    value={userDetails.email}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, email: e.target.value }))}
                    disabled={isExist}
                  />
                </Form.Item>
              </Col>

              {/* Address Field */}
              <Col span={24}>
                <Form.Item
                  label={
                    <Space>
                      <span>Address</span>
                      {isExist && (
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          size="small"
                          onClick={() => setIsEditing(!isEditing)}
                          style={{ color: '#1890ff' }}
                        >
                          {isEditing ? null : 'Edit'}
                        </Button>
                      )}
                    </Space>
                  }
                  name="address"
                  rules={[{ required: true, message: 'Please enter address' }]}
                >
                  <TextArea
                    placeholder="Enter Address"
                    rows={2}
                    value={userDetails.address}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, address: e.target.value }))}
                    disabled={isExist && !isEditing}
                  />
                </Form.Item>
              </Col>

              {/* Accreditation specific fields */}
              {isAccreditation && (
                <>
                  {/* Designation */}
                  <Col span={24}>
                    <Form.Item
                      label="Designation"
                      name="designation"
                      rules={[{ required: true, message: 'Please enter designation' }]}
                    >
                      <Input
                        placeholder="Enter Designation"
                        value={userDetails.designation}
                        onChange={(e) => setUserDetails(prev => ({ ...prev, designation: e.target.value }))}
                        maxLength={50}
                        disabled={isExist}
                      />
                    </Form.Item>
                  </Col>

                  {/* Company Name */}
                  <Col span={24}>
                    <Form.Item
                      label="Company Name"
                      name="companyName"
                      rules={[{ required: true, message: 'Please enter company name' }]}
                    >
                      <Input
                        placeholder="Enter Company Name"
                        value={userDetails.companyName}
                        onChange={(e) => setUserDetails(prev => ({ ...prev, companyName: e.target.value }))}
                        maxLength={50}
                        disabled={isExist}
                      />
                    </Form.Item>
                  </Col>

                  {/* Photo Upload */}
                  <Col span={24}>
                    <Form.Item
                      label={
                        <span>
                          Passport Size Photo <Text type="danger">*</Text>
                        </span>
                      }
                      name="photo"
                      rules={[
                        {
                          required: !(typeof userDetails.photo === 'string' && userDetails.photo),
                          message: 'Please upload a photo'
                        }
                      ]}
                    >
                      <Upload
                        listType="picture-card"
                        maxCount={1}
                        beforeUpload={() => false}
                        onChange={handlePhotoChange}
                        accept="image/*"
                        fileList={userDetails.photo ? [{ uid: '-1', name: 'photo', status: 'done', url: typeof userDetails.photo === 'string' ? userDetails.photo : URL.createObjectURL(userDetails.photo) }] : []}
                        onRemove={() => setUserDetails(prev => ({ ...prev, photo: null }))}
                        disabled={isExist}
                      >
                        {!userDetails.photo && uploadPhotoButton}
                      </Upload>
                    </Form.Item>
                  </Col>

                  {/* Document Upload */}
                  <Col span={24}>
                    <Form.Item
                      label={
                        <span>
                          Upload ID Proof <Text type="danger">*</Text>
                        </span>
                      }
                      name="document"
                      rules={[
                        {
                          required: !(typeof userDetails.doc === 'string' && userDetails.doc),
                          message: 'Please upload a document'
                        }
                      ]}
                    >
                      <Upload
                        maxCount={1}
                        beforeUpload={() => false}
                        onChange={handleDocChange}
                        accept=".pdf,.doc,.docx,image/jpeg,image/png,image/bmp,image/webp"
                        fileList={[]}
                        disabled={isExist}
                      >
                        <Button icon={<UploadOutlined />} disabled={isExist}>Click to Upload</Button>
                      </Upload>
                    </Form.Item>

                    {userDetails.doc && (
                      <div
                        style={{
                          border: '1px dashed #d9d9d9',
                          borderRadius: 8,
                          padding: 16,
                          marginTop: 8,
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleDocumentOpen(userDetails.doc)}
                      >
                        <Button
                          type="text"
                          danger
                          icon={<CloseOutlined />}
                          size="small"
                          style={{ position: 'absolute', top: 8, right: 8 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserDetails(prev => ({ ...prev, doc: null }));
                          }}
                        />
                        <Space direction="vertical" align="center" style={{ width: '100%' }}>
                          {getFileIcon(userDetails.doc)}
                          <Text type="primary">{getFileName(userDetails.doc)}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Click to view document
                          </Text>
                        </Space>
                      </div>
                    )}
                  </Col>
                </>
              )}

              {/* Ticket Notification Info */}
              <Col span={24}>

                <Alert
                  message={
                    <Space>
                      <span>Ticket will be sent to {userDetails.name || 'User'} on</span>
                      <MailOutlined />
                      <Text>/</Text>
                      <WhatsAppOutlined />
                      <Text>/</Text>
                      <MessageOutlined />
                    </Space>
                  }
                  type="info"
                  showIcon={false}
                  style={{ textAlign: 'center' }}
                />
              </Col>

              {/* Payment Method */}
              <Col span={12}>
                <Form.Item
                  label="Payment Method"
                  name="method"
                  rules={[{ required: true, message: 'Please select payment method' }]}
                >
                  <Segmented
                    options={paymentOptions.map(option => ({
                      label: option,
                      value: option
                    }))}
                    onChange={(value) => setMethod(value)}
                    value={method}
                  />
                </Form.Item>
              </Col>

              {/* Card Allocated */}
              {isCardBooking && (
              <Col span={12}>
                <Form.Item
                  label="Card Allocated"
                  name="card_allocated"
                  valuePropName="checked"
                >
                  <Switch
                    checked={userDetails.card_allocated || false}
                    onChange={(checked) => setUserDetails(prev => ({ ...prev, card_allocated: checked }))}
                  />
                </Form.Item>
              </Col>
              )}

              {/* Submit Button */}
              <Col span={24}>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    loading={loading || disabled}
                    icon={loading && <LoadingOutlined />}
                  >
                    {loading ? 'Sending Tickets' : 'Submit'}
                  </Button>
                </Form.Item>
              </Col>
            </>
          )}
        </Row>
      </Form>
    );
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          {confirm ? 'Thank You For Your Booking!' : 'User Details'}
        </div>
      }
      open={showPrintModel}
      onCancel={handleModalClose}
      footer={null}
      closable={!disabled}
      maskClosable={!disabled}
      width={600}
      centered
    >
      {renderContent()}
    </Modal>
  );
};

export default AgentBookingModal;