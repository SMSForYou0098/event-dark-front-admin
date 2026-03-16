import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Drawer,
  Button,
  Space,
  Tag,
  Alert,
  Divider,
  message,
  Checkbox,
  Spin,
  List,
  Typography,
  Input,
  Empty
} from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useMyContext } from 'Context/MyContextProvider';
import AddFields from './AddFields';

const { Text } = Typography;
const { TextArea } = Input;

const SelectFields = ({
  open,
  onClose,
  onSuccess,
  initialSelectedIds = [],
  initialFieldNotes = {}
}) => {
  const { api, authToken } = useMyContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableFields, setAvailableFields] = useState([]);
  const [selectedFieldIds, setSelectedFieldIds] = useState([]);
  const [fieldNotes, setFieldNotes] = useState({});
  const [fetchingFields, setFetchingFields] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // AddFields modal state
  const [addFieldsOpen, setAddFieldsOpen] = useState(false);
  const [editFieldData, setEditFieldData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch available fields
  const fetchAvailableFields = useCallback(async () => {
    if (!open) return;

    setFetchingFields(true);
    try {
      const response = await axios.get(`${api}fields-list`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data?.status && response.data?.customFields) {
        setAvailableFields(response.data.customFields);
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
      message.error('Failed to fetch available fields');
    } finally {
      setFetchingFields(false);
    }
  }, [api, authToken, open]);

  // Default fields that should be pre-selected (by field_name)
  const defaultSelectedFieldNames = ['name', 'number', 'email'];

  // Fetch fields when modal opens
  useEffect(() => {
    if (open) {
      fetchAvailableFields();
      setSelectedFieldIds(initialSelectedIds);
      setFieldNotes(initialFieldNotes);
    }
  }, [open, fetchAvailableFields, initialSelectedIds, initialFieldNotes]);

  // Pre-select default fields (name, number, email) when no initial selection and fields are loaded
  useEffect(() => {
    if (open && availableFields.length > 0 && initialSelectedIds.length === 0 && selectedFieldIds.length === 0) {
      const defaultFieldIds = availableFields
        .filter(field => defaultSelectedFieldNames.includes(field.field_name?.toLowerCase()))
        .map(field => field.id);

      if (defaultFieldIds.length > 0) {
        setSelectedFieldIds(defaultFieldIds);
      }
    }
  }, [open, availableFields, initialSelectedIds.length, selectedFieldIds.length]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setError(null);
      setSearchQuery('');
    }
  }, [open]);

  // Filter fields based on search
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return availableFields;

    const query = searchQuery.toLowerCase();
    return availableFields.filter(field =>
      (field.lable || '').toLowerCase().includes(query) ||
      (field.field_name || '').toLowerCase().includes(query) ||
      (field.field_type || '').toLowerCase().includes(query)
    );
  }, [availableFields, searchQuery]);

  // Handle field selection
  const handleFieldSelection = useCallback((fieldId, checked) => {
    setSelectedFieldIds(prev => {
      if (checked) {
        // Prevent duplicates
        if (prev.includes(fieldId)) return prev;
        return [...prev, fieldId];
      } else {
        return prev.filter(id => id !== fieldId);
      }
    });
    // Clear note if field is deselected
    if (!checked) {
      setFieldNotes(prev => {
        const updated = { ...prev };
        delete updated[fieldId];
        return updated;
      });
    }
  }, []);

  // Handle note change for a field
  const handleNoteChange = useCallback((fieldId, note) => {
    setFieldNotes(prev => ({
      ...prev,
      [fieldId]: note
    }));
  }, []);

  // Handle select all fields
  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      // Merge with existing selections, deduplicate using Set
      const filteredIds = filteredFields.map(field => field.id);
      setSelectedFieldIds(prev => [...new Set([...prev, ...filteredIds])]);
    } else {
      // Only remove filtered fields from selection, keep others
      const filteredIds = new Set(filteredFields.map(field => field.id));
      setSelectedFieldIds(prev => prev.filter(id => !filteredIds.has(id)));
    }
  }, [filteredFields]);

  // Submit selected fields
  const handleSubmit = useCallback(async () => {
    // Deduplicate before submitting
    const uniqueFieldIds = [...new Set(selectedFieldIds)];

    if (uniqueFieldIds.length === 0) {
      setError('Please select at least one field');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get selected field objects for parent (deduplicated)
      const selectedFields = availableFields.filter(f =>
        uniqueFieldIds.includes(f.id)
      );

      onSuccess?.(uniqueFieldIds, selectedFields, fieldNotes);
      message.success('Fields selected successfully');
      onClose();
    } catch (error) {
      console.error('Error submitting selected fields:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save selected fields';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedFieldIds, availableFields, fieldNotes, onSuccess, onClose]);

  // Open AddFields modal for creating new field
  const handleAddNewField = useCallback(() => {
    setIsEditMode(false);
    setEditFieldData(null);
    setAddFieldsOpen(true);
  }, []);

  // Open AddFields modal for editing a field
  const handleEditField = useCallback((field) => {
    setIsEditMode(true);
    setEditFieldData(field);
    setAddFieldsOpen(true);
  }, []);

  // Callback after field is added/edited
  const handleFieldSaved = useCallback(() => {
    setAddFieldsOpen(false);
    setEditFieldData(null);
    setIsEditMode(false);
    // Refresh the fields list
    fetchAvailableFields();
  }, [fetchAvailableFields]);

  // Get field type color
  const getFieldTypeColor = (type) => {
    const colors = {
      text: 'blue',
      email: 'cyan',
      number: 'green',
      select: 'purple',
      multiselect: 'purple',
      checkbox: 'orange',
      radio: 'orange',
      textarea: 'geekblue',
      date: 'magenta',
      file: 'volcano',
      switch: 'lime',
      color: 'gold',
      range: 'default'
    };
    return colors[type] || 'default';
  };

  const allSelected = selectedFieldIds.length === filteredFields.length && filteredFields.length > 0;
  const someSelected = selectedFieldIds.length > 0 && !allSelected;

  return (
    <>
      <Drawer
        title="Select Registration Fields"
        placement="right"
        open={open}
        onClose={onClose}
        width={500}
        footer={
          <div className="d-flex justify-content-end gap-2">
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={loading}
              onClick={handleSubmit}
              disabled={selectedFieldIds.length === 0}
            >
              Add Selected ({selectedFieldIds.length})
            </Button>
          </div>
        }
      >
        {error && (
          <Alert
            message={error}
            type="error"
            closable
            onClose={() => setError(null)}
            className="mb-3"
          />
        )}

        {fetchingFields ? (
          <div className="text-center py-5">
            <Spin size="large" />
            <div className="mt-3 text-muted">Loading available fields...</div>
          </div>
        ) : availableFields.length === 0 ? (
          <div className="text-center py-4">
            <Empty
              description="No custom fields available"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddNewField}
              className="mt-3"
            >
              Create New Field
            </Button>
          </div>
        ) : (
          <>
            {/* Search Input & Add New Button */}
            <div className="d-flex gap-2 mb-3">
              <Input
                placeholder="Search fields..."
                prefix={<SearchOutlined className="text-muted" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
                className="flex-grow-1"
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddNewField}
              >
                New
              </Button>
            </div>

            {/* Select All & Counter */}
            <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                <Text strong className="mb-0">Select All</Text>
              </Checkbox>
              <Text className="text-muted">
                {selectedFieldIds.length} of {availableFields.length} selected
              </Text>
            </div>

            <Divider className="my-2" />

            {/* Fields List */}
            {filteredFields.length === 0 ? (
              <Empty
                description="No fields match your search"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={filteredFields}
                renderItem={(field) => {
                  const isSelected = selectedFieldIds.includes(field.id);
                  return (
                    <div
                      className={`select-field-row rounded mb-2 border ${isSelected ? 'border-primary' : ''}`}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: isSelected ? 'rgba(24, 144, 255, 0.05)' : 'transparent'
                      }}
                    >
                      <div
                        className="d-flex align-items-center cursor-pointer"
                        onClick={() => handleFieldSelection(field.id, !isSelected)}
                        style={{ gap: '12px' }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleFieldSelection(field.id, e.target.checked);
                          }}
                        />
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '4px' }}>
                            <div className="d-flex align-items-center" style={{ gap: '8px', flexWrap: 'wrap' }}>
                              <Text strong style={{ fontSize: '14px' }}>
                                {field.lable || field.field_name}
                              </Text>
                              {field.fixed && <Tag color="blue" style={{ margin: 0, fontSize: '11px' }}>Fixed</Tag>}
                              {field.field_required && <Tag color="red" style={{ margin: 0, fontSize: '11px' }}>Required</Tag>}
                            </div>
                            <Button
                              type="link"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditField(field);
                              }}
                              style={{ padding: 0, height: 'auto' }}
                            >
                              Edit
                            </Button>
                          </div>
                          <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                            <Tag color={getFieldTypeColor(field.field_type)} style={{ margin: 0, fontSize: '11px' }}>
                              {field.field_type}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {field.field_name}
                            </Text>
                          </div>
                        </div>
                      </div>

                      {/* Note field - only show when selected */}
                      {isSelected && (
                        <div style={{ marginTop: '12px', marginLeft: '32px' }}>
                          <TextArea
                            placeholder="Add a note for this field (optional)"
                            value={fieldNotes[field.id] || ''}
                            onChange={(e) => handleNoteChange(field.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            rows={2}
                            style={{ width: '100%' }}
                            maxLength={200}
                            showCount
                          />
                        </div>
                      )}
                    </div>
                  );
                }}
              />
            )}
          </>
        )}
      </Drawer>

      {/* AddFields Modal for creating/editing fields */}
      <AddFields
        open={addFieldsOpen}
        onClose={() => {
          setAddFieldsOpen(false);
          setEditFieldData(null);
          setIsEditMode(false);
        }}
        editState={isEditMode}
        editData={editFieldData}
        onSuccess={handleFieldSaved}
      />
    </>
  );
};

export default SelectFields;
