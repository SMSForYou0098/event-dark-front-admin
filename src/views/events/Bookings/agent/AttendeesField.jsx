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
import { processImageFile } from './utils';
import { buildAttendeesFormData, useStoreAttendees } from './useAgentBookingHooks';
import { useMyContext } from 'Context/MyContextProvider';

const { TextArea } = Input;
const { Text } = Typography;

const AttendeesField = ({
  showModal,
  handleCloseModal,
  apiData = [],
  onSave,
  initialData = {},
  editingIndex = null,
  userId, // ✅ NEW: Pass user ID
  eventName, // ✅ NEW: Pass event name
  isCorporate = false, // ✅ NEW: Pass corporate flag
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isSaving, setIsSaving] = useState(false); // ✅ NEW: Loading state

  // ✅ Import mutation hook
  const { UserData } = useMyContext();
  const storeAttendeesMutation = useStoreAttendees();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (showModal) {
      form.setFieldsValue(initialData);
    } else {
      setFileList({});
      setUploadingFiles({});
      setUploadedFiles({});
      form.resetFields();
    }
  }, [showModal, initialData, form]);

  const handleAddAttendee = async () => {
    try {
      setIsSaving(true);
      
      // ✅ Get all form values
      const formValues = form.getFieldsValue();
      
      // Check if any files are still uploading
      const isUploading = Object.values(uploadingFiles).some(uploading => uploading);
      if (isUploading) {
        message.warning('Please wait for file uploads to complete');
        setIsSaving(false);
        return;
      }

      // ✅ Validate form using Ant Design's validation
      await form.validateFields();
      
      // ✅ Merge form values with uploaded files (base64)
      const completeAttendeeData = {
        ...formValues,
        ...uploadedFiles, // Add uploaded file base64 strings
      };


      // ✅ If editing existing attendee with ID, just update locally
      if (editingIndex !== null && initialData.id) {
        const attendeeDataWithId = {
          ...completeAttendeeData,
          id: initialData.id,
          isEdited: true,
          needsSaving: false // Already has ID
        };

        onSave(attendeeDataWithId, editingIndex);
        
        handleCloseModal();
        form.resetFields();
        setFileList({});
        setUploadingFiles({});
        setUploadedFiles({});
        setIsSaving(false);
        
        message.success('Attendee updated successfully');
        return;
      }

      // ✅ NEW ATTENDEE: Call API to save and get ID

      const formData = buildAttendeesFormData({
        attendees: [completeAttendeeData], // Single attendee
        userMeta: {
          user_id: userId || null,
          user_name: eventName || '',
          event_name: eventName || '',
          isAgentBooking: true
        },
        fieldGroupName: isCorporate ? 'corporateUser' : 'attendees'
      });

      // ✅ Call attndy-store API
      const response = await storeAttendeesMutation.mutateAsync({ 
        formData, 
        isCorporate 
      });


      if (response.status && response.data && response.data.length > 0) {
        const savedAttendee = response.data[0]; // Get first (and only) saved attendee
        

        // ✅ Pass saved attendee with ID to parent
        const attendeeDataWithId = {
          ...completeAttendeeData,
          id: savedAttendee.id, // ✅ ID from API (52 in your case)
          token: savedAttendee.token, // Also save token
          Photo: savedAttendee.Photo, // Use server URL for photo
          isNew: false,
          needsSaving: false // Already saved
        };

        onSave(attendeeDataWithId, editingIndex);
        
        // Reset
        handleCloseModal();
        form.resetFields();
        setFileList({});
        setUploadingFiles({});
        setUploadedFiles({});
        
        message.success(`Attendee saved successfully! ID: ${savedAttendee.id}`);
      } else {
        throw new Error('Failed to save attendee - No data in response');
      }

      setIsSaving(false);
    } catch (error) {
      console.error('❌ Validation/Save failed:', error);
      setIsSaving(false);
      
      if (error.errorFields) {
        // Ant Design validation errors
        const fieldNames = error.errorFields.map(f => f.name[0]).join(', ');
        message.error(`Please fill required fields: ${fieldNames}`);
      } else {
        message.error(error.message || 'Failed to save attendee');
      }
    }
  };

  const renderField = useCallback((field) => {
    const { field_name, lable, field_type, field_options = null, field_required } = field;
    const required = field_required === 1;

    // Base rules for all fields
    const baseRules = required && field_type !== 'file' 
      ? [{ required: true, message: `${lable} is required` }] 
      : [];

    // ✅ Special handling for phone number field
    const isMobileField = field_name === 'Mo' || 
                          field_name === 'mobile' || 
                          field_name === 'phone' ||
                          lable?.toLowerCase().includes('mobile') ||
                          lable?.toLowerCase().includes('phone');

    switch (field_type) {
      case 'text':
        if (isMobileField) {
          return (
            <Form.Item
              label={lable}
              name={field_name}
              rules={[
                ...baseRules,
                { whitespace: true, message: `${lable} cannot be empty` },
                {
                  pattern: /^[0-9]{10}$/,
                  message: 'Please enter a valid 10-digit mobile number',
                },
                {
                  validator: async (_, value) => {
                    if (value && value.length > 0 && value.length !== 10) {
                      throw new Error('Mobile number must be exactly 10 digits');
                    }
                    if (value && !/^[6-9][0-9]{9}$/.test(value)) {
                      throw new Error('Please enter a valid Indian mobile number (starting with 6-9)');
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input 
                placeholder={`Enter ${lable}`} 
                maxLength={10}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>
          );
        }

        return (
          <Form.Item
            label={lable}
            name={field_name}
            rules={[
              ...baseRules,
              { whitespace: true, message: `${lable} cannot be empty` },
            ]}
          >
            <Input placeholder={`Enter ${lable}`} />
          </Form.Item>
        );

      case 'email':
        return (
          <Form.Item
            label={lable}
            name={field_name}
            rules={[
              ...baseRules,
              { type: 'email', message: 'Please enter a valid email address' },
            ]}
          >
            <Input type="email" placeholder={`Enter ${lable}`} />
          </Form.Item>
        );

      case 'number':
        if (isMobileField) {
          return (
            <Form.Item
              label={lable}
              name={field_name}
              rules={[
                ...baseRules,
                { type: 'number', message: 'Please enter a valid number' },
                {
                  validator: async (_, value) => {
                    if (value && value.toString().length !== 10) {
                      throw new Error('Mobile number must be exactly 10 digits');
                    }
                    if (value && !/^[6-9][0-9]{9}$/.test(value.toString())) {
                      throw new Error('Please enter a valid Indian mobile number (starting with 6-9)');
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber 
                placeholder={`Enter ${lable}`} 
                style={{ width: '100%' }}
                maxLength={10}
                controls={false}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>
          );
        }

        return (
          <Form.Item
            label={lable}
            name={field_name}
            rules={[
              ...baseRules,
              { type: 'number', message: 'Please enter a valid number' },
            ]}
          >
            <InputNumber placeholder={`Enter ${lable}`} style={{ width: '100%' }} />
          </Form.Item>
        );

      case 'select': {
        const options = field_options ? JSON.parse(field_options) : [];
        return (
          <Form.Item
            label={lable}
            name={field_name}
            rules={baseRules}
          >
            <Select
              placeholder={`Select ${lable}`}
              options={options.map(opt => ({ label: opt, value: opt }))}
              allowClear
            />
          </Form.Item>
        );
      }

      case 'radio': {
        const options = field_options ? JSON.parse(field_options) : [];
        return (
          <Form.Item
            label={lable}
            name={field_name}
            rules={baseRules}
          >
            <Radio.Group>
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

        return (
          <Form.Item
            label={lable}
            name={field_name}
            rules={[
              {
                required,
                validator: async (_, value) => {
                  if (required && (!value || value.length === 0)) {
                    throw new Error(`Please select at least one ${lable}`);
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Checkbox.Group options={options.map(opt => ({ label: opt, value: opt }))} />
          </Form.Item>
        );
      }

      case 'textarea':
        return (
          <Form.Item
            label={lable}
            name={field_name}
            rules={[
              ...baseRules,
              { whitespace: true, message: `${lable} cannot be empty` },
            ]}
          >
            <TextArea rows={3} placeholder={`Enter ${lable}`} />
          </Form.Item>
        );

      case 'date':
        return (
          <Form.Item
            label={lable}
            name={field_name}
            rules={baseRules}
          >
            <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>
        );

       case 'file': {
  const isPhotoField =
    field_name?.toLowerCase().includes('photo') ||
    lable?.toLowerCase().includes('photo') ||
    field_name?.toLowerCase().includes('passport_size_photo');

  const uploadProps = {
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setUploadingFiles(prev => ({ ...prev, [field_name]: true }));
        
        if (isPhotoField) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const faceImage = await FaceDetector.cropFaceFromImage(e.target.result);
              const finalImage = faceImage || await processImageFile(file);
              
              // ✅ CRITICAL: Update form value immediately
              form.setFieldValue(field_name, finalImage);
              
              // Also update state for display
              setUploadedFiles(prev => ({ ...prev, [field_name]: finalImage }));
              setFileList(prev => ({
                ...prev,
                [field_name]: [{
                  uid: '-1',
                  name: file.name,
                  status: 'done',
                  url: finalImage
                }]
              }));
              
              setUploadingFiles(prev => ({ ...prev, [field_name]: false }));
              
              // ✅ Trigger validation after setting value
              form.validateFields([field_name]);
              
              message.success(faceImage ? 'Face detected and cropped successfully' : 'File uploaded successfully');
              onSuccess();
            } catch (error) {
              console.error('Face detection error:', error);
              const processedFile = await processImageFile(file);
              
              form.setFieldValue(field_name, processedFile);
              setUploadedFiles(prev => ({ ...prev, [field_name]: processedFile }));
              setFileList(prev => ({
                ...prev,
                [field_name]: [{
                  uid: '-1',
                  name: file.name,
                  status: 'done',
                  url: processedFile
                }]
              }));
              
              setUploadingFiles(prev => ({ ...prev, [field_name]: false }));
              form.validateFields([field_name]);
              onSuccess();
            }
          };
          reader.readAsDataURL(file);
        } else {
          const processedFile = await processImageFile(file);
          
          // ✅ Update form value immediately
          form.setFieldValue(field_name, processedFile);
          
          setUploadedFiles(prev => ({ ...prev, [field_name]: processedFile }));
          setFileList(prev => ({
            ...prev,
            [field_name]: [{
              uid: '-1',
              name: file.name,
              status: 'done',
              url: processedFile
            }]
          }));
          
          setUploadingFiles(prev => ({ ...prev, [field_name]: false }));
          
          // ✅ Trigger validation
          form.validateFields([field_name]);
          
          message.success('File uploaded successfully');
          onSuccess();
        }
      } catch (error) {
        console.error('Upload error:', error);
        setUploadingFiles(prev => ({ ...prev, [field_name]: false }));
        message.error('Failed to upload file');
        onError(error);
      }
    },
    fileList: fileList[field_name] || [],
    onRemove: () => {
      // ✅ Clear form value and trigger validation
      form.setFieldValue(field_name, undefined);
      form.validateFields([field_name]);
      
      setUploadedFiles(prev => {
        const newState = { ...prev };
        delete newState[field_name];
        return newState;
      });
      setFileList(prev => ({ ...prev, [field_name]: [] }));
      setUploadingFiles(prev => ({ ...prev, [field_name]: false }));
    },
    maxCount: 1,
    accept: isPhotoField ? 'image/*' : undefined,
  };

  return (
    <Form.Item
      label={lable}
      name={field_name}
      // ✅ Simplified validator - checks form value directly
      rules={[
        {
          required,
          validator: async (_, value) => {
            if (required && !value) {
              throw new Error(`Please upload ${lable}`);
            }
            return Promise.resolve();
          },
        },
      ]}
      extra={
        isPhotoField && !uploadedFiles[field_name] && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Please upload a clear photo with your face visible
          </Text>
        )
      }
    >
      <div>
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />} loading={uploadingFiles[field_name]}>
            {uploadedFiles[field_name] ? 'Change File' : `Upload ${lable}`}
          </Button>
        </Upload>
        {uploadedFiles[field_name] && !uploadingFiles[field_name] && (
          <Text type="success" style={{ marginLeft: 8, display: 'block', marginTop: 4 }}>
            ✓ File uploaded successfully
          </Text>
        )}
      </div>
    </Form.Item>
  );
}


      case 'color':
        return (
          <Form.Item
            label={lable}
            name={field_name}
            rules={baseRules}
          >
            <Input type="color" />
          </Form.Item>
        );

      case 'range':
        return (
          <Form.Item
            label={lable}
            name={field_name}
            rules={baseRules}
          >
            <Slider min={0} max={100} />
          </Form.Item>
        );

      default:
        return null;
    }
  }, [form, fileList, uploadingFiles, uploadedFiles]);

  // Sort fields by sr_no
  const sortedApiData = useMemo(() => {
    return [...apiData].sort((a, b) => (a.sr_no || 0) - (b.sr_no || 0));
  }, [apiData]);

  return (
    <Modal
      title={
        <span>
          {editingIndex !== null ? "Edit Attendee Details" : "Add Attendee Details"}
          <Text type="secondary" style={{ fontSize: '14px', marginLeft: 8 }}>
            * Required fields
          </Text>
        </span>
      }
      open={showModal}
      onCancel={handleCloseModal}
      width={1200}
      footer={[
        <Button key="cancel" onClick={handleCloseModal} disabled={isSaving}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleAddAttendee}
          loading={isSaving || Object.values(uploadingFiles).some(uploading => uploading)}
        >
          {editingIndex !== null ? 'Update Attendee' : 'Save Attendee'}
        </Button>,
      ]}
      maskClosable={false}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        scrollToFirstError
        requiredMark="optional"
      >
        <Row gutter={[16, 0]}>
          {sortedApiData.map((field, fieldIndex) => (
            <Col 
              xs={24} 
              sm={field.field_type === 'textarea' ? 24 : 12} 
              md={field.field_type === 'textarea' ? 24 : 12} 
              lg={field.field_type === 'textarea' ? 24 : 12} 
              key={field.id || fieldIndex}
            >
              {renderField(field)}
            </Col>
          ))}
        </Row>
      </Form>
    </Modal>
  );
};

export default AttendeesField;
