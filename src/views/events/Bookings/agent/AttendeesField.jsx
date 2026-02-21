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
  currentTicketId = null, // ✅ NEW: Current ticket ID being edited
  selectedTickets = [], // ✅ NEW: Selected tickets array
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
    setIsSaving(true);
    try {
      const formValues = form.getFieldsValue();

      // Block while files are uploading
      const isUploading = Object.values(uploadingFiles).some(Boolean);
      if (isUploading) {
        message.warning('Please wait for file uploads to complete');
        return;
      }

      // AntD validation
      await form.validateFields();

      // Merge with uploaded file/base64 values
      const completeAttendeeData = {
        ...formValues,
        ...uploadedFiles,
      };

      // ✅ Get ticket name from selectedTickets using currentTicketId
      const currentTicket = selectedTickets.find(t => {
        const ticketId = t.id;
        const currentId = currentTicketId;
        // Handle both number and string comparisons
        return ticketId === currentId || 
               ticketId === String(currentId) || 
               String(ticketId) === String(currentId) ||
               Number(ticketId) === Number(currentId);
      });
      
      // Try multiple possible fields for ticket name
      const ticketName = currentTicket?.category || 
                        currentTicket?.name || 
                        currentTicket?.ticket_name ||
                        currentTicket?.ticket?.name ||
                        currentTicket?.ticket?.category ||
                        '';

      // 👇 Include id when editing (same API) and add ticket name
      const attendeePayload = initialData?.id
        ? { ...completeAttendeeData, id: initialData.id, ticket_name: ticketName }
        : { ...completeAttendeeData, ticket_name: ticketName };

      const formData = buildAttendeesFormData({
        attendees: [attendeePayload],
        userMeta: {
          user_id: UserData?.id || userId || null,
          event_name: eventName || '',
          isAgentBooking: false,
          ticket_name: ticketName, // ✅ Add ticket name at root level too
        },
        fieldGroupName: isCorporate ? 'corporateUser' : 'attendees',
      });
      if (initialData?.id != null) {
        formData.append(`${isCorporate ? 'corporateUser' : 'attendees'}[0][id]`, String(initialData.id));
      }

      // ✅ SAME API for both create & edit
      const response = await storeAttendeesMutation.mutateAsync({
        formData,

        isCorporate,
      });

      if (!response?.status || !response?.data || response.data.length === 0) {
        throw new Error('Failed to save attendee - No data in response');
      }

      const saved = response.data[0];

      const attendeeDataWithId = {
        ...completeAttendeeData,
        id: saved.id,                         // server id (create or update)
        token: saved.token ?? initialData?.token,
        Photo: saved.Photo ?? completeAttendeeData.Photo,
        needsSaving: false,
      };

      onSave(attendeeDataWithId, editingIndex);

      // Reset UI
      handleCloseModal();
      form.resetFields();
      setFileList({});
      setUploadingFiles({});
      setUploadedFiles({});

      // message.success(
      //   initialData?.id
      //     ? `Attendee updated successfully (ID: ${saved.id})`
      //     : `Attendee saved successfully! ID: ${saved.id}`
      // );
    } catch (error) {
      console.error('❌ Validation/Save failed:', error);
      if (error?.errorFields) {
        const fieldNames = error.errorFields.map(f => f.name?.[0]).join(', ');
        message.error(`Please fill required fields: ${fieldNames}`);
      } else {
        message.error(error?.message || 'Failed to save attendee');
      }
    } finally {
      setIsSaving(false);
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
