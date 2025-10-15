import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Checkbox,
  DatePicker,
  Upload,
  InputNumber,
  Slider,
  Button,
  Row,
  Col,
  Typography,
  message,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import FaceDetector from './FaceDetector';
import moment from 'moment';

const { TextArea } = Input;
const { Text } = Typography;

const AttendeesField = ({
  showModal,
  handleCloseModal,
  apiData = [],
  onSave,
  initialData = {},
  editingIndex = null,
}) => {
  const [form] = Form.useForm();
  const [attendeeData, setAttendeeData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [fileList, setFileList] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});

  // Reset state when modal opens/closes
  useEffect(() => {
    if (showModal) {
      setAttendeeData(initialData);
      form.setFieldsValue(initialData);
    } else {
      setAttendeeData({});
      setFileList({});
      setUploadingFiles({});
      form.resetFields();
    }
  }, [showModal, initialData, form]);

  const handleFieldChange = useCallback((fieldName, value) => {
    setAttendeeData(prev => ({ ...prev, [fieldName]: value }));
    // Clear error when user types
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  }, [errors]);

  const processImageFile = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        resolve(base64);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddAttendee = async () => {
    try {
      console.log('Current attendeeData:', attendeeData);
      
      // Check if any files are still uploading
      const isUploading = Object.values(uploadingFiles).some(uploading => uploading);
      if (isUploading) {
        message.warning('Please wait for file uploads to complete');
        return;
      }
      
      // Validate required fields
      const missingFields = [];
      
      apiData.forEach(field => {
        if (field.field_required === 1) {
          const value = attendeeData[field.field_name];
          
          // Check if value exists and handle different types
          if (!value) {
            missingFields.push(field.lable);
          } else if (field.field_type === 'checkbox') {
            // For checkbox, check if array is not empty
            if (Array.isArray(value) && value.length === 0) {
              missingFields.push(field.lable);
            }
          }
        }
      });

      console.log('Missing fields:', missingFields);

      if (missingFields.length > 0) {
        message.error(`Please fill required fields: ${missingFields.join(', ')}`);
        return;
      }

      onSave(attendeeData, editingIndex);
      handleCloseModal();
      form.resetFields();
      setAttendeeData({});
      setFileList({});
      setUploadingFiles({});
    } catch (error) {
      console.error('Validation failed:', error);
      message.error('Please fill all required fields');
    }
  };

  const renderField = useCallback((field) => {
    const { field_name, lable, field_type, field_options = null, field_required } = field;
    const required = field_required === 1;
    const value = attendeeData[field_name] || '';

    const commonProps = {
      label: (
        <span>
          {lable}
          {required && <Text type="danger"> *</Text>}
        </span>
      ),
      name: field_name,
      rules: [{ required: field_type !== 'file' && required, message: `${lable} is required` }],
      validateStatus: errors[field_name] ? 'error' : '',
      help: errors[field_name] || '',
    };

    switch (field_type) {
      case 'text':
        return (
          <Form.Item {...commonProps}>
            <Input
              placeholder={`Enter ${lable}`}
              value={value}
              onChange={(e) => handleFieldChange(field_name, e.target.value)}
            />
          </Form.Item>
        );

      case 'email':
        return (
          <Form.Item
            {...commonProps}
            rules={[
              { required, message: `${lable} is required` },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              type="email"
              placeholder={`Enter ${lable}`}
              value={value}
              onChange={(e) => handleFieldChange(field_name, e.target.value)}
            />
          </Form.Item>
        );

      case 'number':
        return (
          <Form.Item {...commonProps}>
            <InputNumber
              placeholder={`Enter ${lable}`}
              value={value}
              onChange={(val) => handleFieldChange(field_name, val)}
              style={{ width: '100%' }}
            />
          </Form.Item>
        );

      case 'select': {
        const options = field_options ? JSON.parse(field_options) : [];
        return (
          <Form.Item {...commonProps}>
            <Select
              placeholder={`Select ${lable}`}
              value={value}
              onChange={(val) => handleFieldChange(field_name, val)}
              options={options.map(opt => ({ label: opt, value: opt }))}
            />
          </Form.Item>
        );
      }

      case 'radio': {
        const options = field_options ? JSON.parse(field_options) : [];
        return (
          <Form.Item {...commonProps}>
            <Radio.Group
              value={value}
              onChange={(e) => handleFieldChange(field_name, e.target.value)}
            >
              {options.map((option, idx) => (
                <Radio key={idx} value={option}>
                  {option}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        );
      }

      case 'checkbox': {
        let options = [];
        try {
          options = field_options ? JSON.parse(field_options) : [];
        } catch (err) {
          console.error('Failed to parse checkbox options:', err);
          options = [];
        }

        const selected = Array.isArray(value) ? value : [];

        return (
          <Form.Item {...commonProps}>
            <Checkbox.Group
              value={selected}
              onChange={(checkedValues) => handleFieldChange(field_name, checkedValues)}
              options={options.map(opt => ({ label: opt, value: opt }))}
            />
          </Form.Item>
        );
      }

      case 'textarea':
        return (
          <Form.Item {...commonProps}>
            <TextArea
              rows={3}
              placeholder={`Enter ${lable}`}
              value={value}
              onChange={(e) => handleFieldChange(field_name, e.target.value)}
            />
          </Form.Item>
        );

      case 'date':
        return (
          <Form.Item {...commonProps}>
            <DatePicker
              format="YYYY-MM-DD"
              value={value ? moment(value) : null}
              onChange={(date, dateString) => handleFieldChange(field_name, dateString)}
              style={{ width: '100%' }}
            />
          </Form.Item>
        );

      case 'file': {
        const isPhotoField =
          field_name?.toLowerCase().includes('photo') ||
          lable?.toLowerCase().includes('photo') ||
          field_name?.toLowerCase().includes('passport_size_photo');

        const hasFile = !!attendeeData[field_name];
        const isUploading = uploadingFiles[field_name];

        const uploadProps = {
          customRequest: async ({ file, onSuccess, onError }) => {
            try {
              console.log('File selected:', file.name);
              setUploadingFiles(prev => ({ ...prev, [field_name]: true }));
              
              if (isPhotoField) {
                // Face detection for photo fields
                const reader = new FileReader();
                reader.onload = async (e) => {
                  try {
                    const faceImage = await FaceDetector.cropFaceFromImage(e.target.result);

                    if (faceImage) {
                      console.log('Face detected, saving base64');
                      handleFieldChange(field_name, faceImage);
                      message.success('Face detected and cropped successfully');
                    } else {
                      console.log('No face detected, saving original base64');
                      const processedFile = await processImageFile(file);
                      handleFieldChange(field_name, processedFile);
                      message.warning('No face detected, using original image');
                    }
                    setUploadingFiles(prev => ({ ...prev, [field_name]: false }));
                    onSuccess();
                  } catch (error) {
                    console.error('Face detection error:', error);
                    const processedFile = await processImageFile(file);
                    handleFieldChange(field_name, processedFile);
                    setUploadingFiles(prev => ({ ...prev, [field_name]: false }));
                    onSuccess();
                  }
                };
                reader.readAsDataURL(file);
              } else {
                // Regular file upload
                const processedFile = await processImageFile(file);
                console.log('Regular file processed, saving base64');
                handleFieldChange(field_name, processedFile);
                setUploadingFiles(prev => ({ ...prev, [field_name]: false }));
                onSuccess();
              }
            } catch (error) {
              console.error('Upload error:', error);
              setUploadingFiles(prev => ({ ...prev, [field_name]: false }));
              onError(error);
            }
          },
          fileList: fileList[field_name] || [],
          onChange: ({ fileList: newFileList }) => {
            console.log('File list changed:', newFileList);
            setFileList(prev => ({ ...prev, [field_name]: newFileList }));
          },
          onRemove: () => {
            console.log('File removed');
            handleFieldChange(field_name, null);
            setFileList(prev => ({ ...prev, [field_name]: [] }));
            setUploadingFiles(prev => ({ ...prev, [field_name]: false }));
          },
          maxCount: 1,
          accept: isPhotoField ? 'image/*' : undefined,
        };

        return (
          <Form.Item
            label={
              <span>
                {lable}
                {required && <Text type="danger"> *</Text>}
              </span>
            }
            validateStatus={required && !hasFile && !isUploading ? 'error' : ''}
            help={required && !hasFile && !isUploading ? `${lable} is required` : ''}
            extra={
              isPhotoField && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Please upload a clear photo with your face visible
                </Text>
              )
            }
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} loading={isUploading}>
                {hasFile ? 'Change File' : `Upload ${lable}`}
              </Button>
            </Upload>
            {hasFile && !isUploading && (
              <Text type="success" style={{ marginLeft: 8, display: 'block', marginTop: 4 }}>
                ✓ File uploaded successfully
              </Text>
            )}
          </Form.Item>
        );
      }

      case 'color':
        return (
          <Form.Item {...commonProps}>
            <Input
              type="color"
              value={value}
              onChange={(e) => handleFieldChange(field_name, e.target.value)}
            />
          </Form.Item>
        );

      case 'range':
        return (
          <Form.Item {...commonProps}>
            <Slider
              value={value || 0}
              onChange={(val) => handleFieldChange(field_name, val)}
            />
          </Form.Item>
        );

      default:
        return null;
    }
  }, [attendeeData, errors, fileList, uploadingFiles, handleFieldChange, processImageFile]);

  // Sort fields by sr_no
  const sortedApiData = useMemo(() => {
    return [...apiData].sort((a, b) => (a.sr_no || 0) - (b.sr_no || 0));
  }, [apiData]);

  return (
    <Modal
      title={editingIndex !== null ? "Edit Attendee Details" : "Add Attendee Details"}
      open={showModal}
      onCancel={handleCloseModal}
      width={1200}
      footer={[
        <Button key="cancel" onClick={handleCloseModal}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleAddAttendee}
          loading={Object.values(uploadingFiles).some(uploading => uploading)}
        >
          {editingIndex !== null ? 'Update' : 'Save'}
        </Button>,
      ]}
      maskClosable={false}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialData}
      >
        <Row gutter={[16, 0]}>
          {sortedApiData.map((field, fieldIndex) => (
            <Col xs={24} sm={12} md={12} lg={12} key={field.id || fieldIndex}>
              {renderField(field)}
            </Col>
          ))}
        </Row>
      </Form>
    </Modal>
  );
};

export default AttendeesField;