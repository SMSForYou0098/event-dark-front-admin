import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Switch, 
  Button, 
  Space, 
  Tag, 
  Alert,
  Row,
  Col,
  Divider
} from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useMyContext } from 'Context/MyContextProvider';

const { Option } = Select;
const { TextArea } = Input;

const AddFields = ({ open, onClose, editState, editData, onSuccess }) => {
  const { api, successAlert, ErrorAlert, authToken, userRole } = useMyContext();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fieldType, setFieldType] = useState('');
  const [options, setOptions] = useState([]);
  const [newOption, setNewOption] = useState('');
  const [error, setError] = useState(null);

  const fieldOptions = useMemo(() => [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'select', label: 'Select' },
    { value: 'multiselect', label: 'Multi Select' },
    { value: 'switch', label: 'Switch' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'file', label: 'File' },
    { value: 'color', label: 'Color Picker' },
    { value: 'range', label: 'Range' },
  ], []);

  // Load edit data
  useEffect(() => {
    if (editState && editData && open) {
      form.setFieldsValue({
        label: editData?.field_name,
        fieldType: editData?.field_type,
        required: editData?.field_required === 1,
        fixed: editData?.fixed === 1,
      });
      setFieldType(editData?.field_type);
      
      if (editData?.field_options) {
        try {
          const parsedOptions = JSON.parse(editData.field_options);
          setOptions(Array.isArray(parsedOptions) ? parsedOptions : []);
        } catch (e) {
          setOptions([]);
        }
      }
    }
  }, [editState, editData, open, form]);

  // Reset form on close
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setFieldType('');
      setOptions([]);
      setNewOption('');
      setError(null);
    }
  }, [open, form]);

  const handleFieldTypeChange = useCallback((value) => {
    setFieldType(value);
    setOptions([]);
    setNewOption('');
  }, []);

  const addOption = useCallback(() => {
    const trimmedOption = newOption.trim();
    if (trimmedOption && !options.includes(trimmedOption)) {
      setOptions(prev => [...prev, trimmedOption]);
      setNewOption('');
    }
  }, [newOption, options]);

  const removeOption = useCallback((index) => {
    setOptions(prev => prev.filter((_, i) => i !== index));
  }, []);

  const needsOptions = useMemo(
    () => ['select', 'multiselect', 'checkbox', 'radio'].includes(fieldType),
    [fieldType]
  );

  const handleSubmit = useCallback(async (values) => {
    // Validate options for fields that need them
    if (needsOptions && options.length === 0) {
      setError('Please add at least one option for this field type');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        field_type: values.fieldType,
        field_name: values.label,
        field_required: values.required || false,
        field_options: needsOptions ? options : [],
        fixed: values.fixed || false,
        field_slug: values.label.replace(/\s+/g, '_').toLowerCase(),
      };

      if (editState && editData?.id) {
        payload.id = editData.id;
      }

      const apiUrl = editState 
        ? `${api}field-update/${editData.id}` 
        : `${api}field-store`;

      await axios.post(apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      successAlert(
        editState ? 'Field Updated Successfully' : 'New Field Added Successfully'
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error submitting field:', error);
      setError(error.response?.data?.message || 'Failed to save field');
      ErrorAlert(error.response?.data?.message || 'Failed to save field');
    } finally {
      setLoading(false);
    }
  }, [
    api,
    authToken,
    editState,
    editData,
    options,
    needsOptions,
    successAlert,
    ErrorAlert,
    onSuccess,
    onClose,
  ]);

  const renderFieldPreview = useMemo(() => {
    switch (fieldType) {
      case 'text':
      case 'email':
        return (
          <Form.Item label="Field Preview">
            <Input placeholder="Your field preview" />
          </Form.Item>
        );
      
      case 'select':
        return (
          <Form.Item label="Field Preview">
            <Select placeholder="Select an option">
              {options.map((opt, i) => (
                <Option key={i} value={opt}>{opt}</Option>
              ))}
            </Select>
          </Form.Item>
        );
      
      case 'multiselect':
        return (
          <Form.Item label="Field Preview">
            <Select 
              mode="multiple" 
              placeholder="Select multiple options"
            >
              {options.map((opt, i) => (
                <Option key={i} value={opt}>{opt}</Option>
              ))}
            </Select>
          </Form.Item>
        );
      
      case 'textarea':
        return (
          <Form.Item label="Field Preview">
            <TextArea rows={4} placeholder="Your field preview" />
          </Form.Item>
        );
      
      case 'number':
        return (
          <Form.Item label="Field Preview">
            <Input type="number" placeholder="Enter a number" />
          </Form.Item>
        );
      
      case 'date':
        return (
          <Form.Item label="Field Preview">
            <Input type="date" />
          </Form.Item>
        );
      
      case 'switch':
        return (
          <Form.Item label="Field Preview">
            <Switch />
          </Form.Item>
        );
      
      case 'checkbox':
      case 'radio':
        return (
          <Form.Item label="Field Preview">
            <Space direction="vertical">
              {options.map((opt, i) => (
                <Tag key={i}>{opt}</Tag>
              ))}
            </Space>
          </Form.Item>
        );
      
      default:
        return null;
    }
  }, [fieldType, options]);

  return (
    <Modal
      title={`${editState ? 'Edit' : 'New'} Field`}
      open={open}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Discard Changes
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
        >
          {editState ? 'Update' : 'Save'}
        </Button>,
      ]}
    >
      {error && (
        <Alert
          message={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          required: false,
          fixed: false,
        }}
      >
        <Form.Item
          name="label"
          label="Label"
          rules={[
            { required: true, message: 'Please enter a label' },
            { whitespace: true, message: 'Label cannot be empty' },
          ]}
        >
          <Input placeholder="Enter field label" />
        </Form.Item>

        <Form.Item
          name="fieldType"
          label="Field Type"
          rules={[{ required: true, message: 'Please select a field type' }]}
        >
          <Select
            placeholder="Select field type"
            onChange={handleFieldTypeChange}
            options={fieldOptions}
          />
        </Form.Item>

        {needsOptions && (
          <>
            <Divider orientation="left">Options</Divider>
            <Row gutter={8}>
              <Col flex="auto">
                <Input
                  placeholder="Add option"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onPressEnter={(e) => {
                    e.preventDefault();
                    addOption();
                  }}
                />
              </Col>
              <Col>
                <Button
                  type="primary"
                  className='border-0'
                  icon={<PlusOutlined />}
                  onClick={addOption}
                  disabled={!newOption.trim()}
                >
                  Add
                </Button>
              </Col>
            </Row>
            <div style={{ fontSize: '12px', color: '#999', marginTop: 4 }}>
              Press <strong>Enter</strong> or click <strong>Add</strong> to add an option
            </div>

            {options.length > 0 && (
              <Space wrap style={{ marginTop: 12 }}>
                {options.map((option, index) => (
                  <Tag
                    key={index}
                    closable
                    onClose={() => removeOption(index)}
                  >
                    {option}
                  </Tag>
                ))}
              </Space>
            )}
          </>
        )}

        {fieldType && (
          <>
            <Divider orientation="left">Preview</Divider>
            {renderFieldPreview}
          </>
        )}

        <Divider />

        <Row gutter={16}>
          <Col span={userRole === 'Admin' ? 12 : 24}>
            <Form.Item
              name="required"
              label="Required Field"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>

          {userRole === 'Admin' && (
            <Col span={12}>
              <Form.Item
                name="fixed"
                label="Fixed Field"
                valuePropName="checked"
                tooltip="Fixed fields cannot be edited later"
              >
                <Switch />
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>
    </Modal>
  );
};

export default AddFields;