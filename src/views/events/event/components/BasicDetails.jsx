// BasicDetailsStep.jsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Form, Input, Select, Row, Col, Button, Tag, Space, Card, Empty } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import { useEventCategories } from '../hooks/useEventOptions';
import { useMyContext } from 'Context/MyContextProvider';
import { OrganisationList } from 'utils/CommonInputs';
import { VanueList } from './CONSTANTS';
import { ContentSelect } from './ContentSelect';
import apiClient from 'auth/FetchInterceptor';
import SelectFields from 'views/events/Settings/Fields/SelectFields';

const BasicDetailsStep = ({ form, isEdit, eventFields = [], }) => {
  const [selectFieldsModalOpen, setSelectFieldsModalOpen] = useState(false);
  const [selectedFieldIds, setSelectedFieldIds] = useState([]);
  const [selectedFieldsData, setSelectedFieldsData] = useState([]);
  const [fieldNotes, setFieldNotes] = useState({});
  const { UserData, } = useMyContext();

  // Ref to track if we've already initialized existing fields
  const hasInitializedFields = useRef(false);

  // categories
  const {
    data: categories = [],
    isLoading: catLoading,
  } = useEventCategories();

  // Watch selected category
  const selectedCategory = Form.useWatch('category', form);

  // Fetch category details when category is selected
  const {
    data: categoryDetails,
    isLoading: categoryDetailsLoading,
  } = useQuery({
    queryKey: ['category-show', selectedCategory],
    queryFn: async () => {
      const response = await apiClient.get(`category-show/${selectedCategory}`);
      return response?.data || response;
    },
    enabled: !!selectedCategory,
    staleTime: 5 * 60 * 1000,
  });

  // Get fields from category details
  const categoryFields = categoryDetails?.fields || [];
  const hasFields = categoryFields.length > 0;

  // Check if category is "Registration" type
  const isRegistrationCategory = categoryDetails?.title?.toLowerCase() === 'registration';

  // Fetch all available fields for mapping field_id to field data
  // Enable when editing - we need this data to populate existing selections
  const { data: allFields = [], isFetched: fieldsFetched } = useQuery({
    queryKey: ['fields-list'],
    queryFn: async () => {
      const response = await apiClient.get('fields-list');
      return response?.customFields || response?.data?.customFields || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: isEdit,
  });

  // Populate existing fields when editing - runs once when data is ready
  useEffect(() => {
    // Skip if already initialized or not in edit mode
    if (hasInitializedFields.current || !isEdit) return;

    // Wait for all required data to be available (using eventFields prop)
    if (!eventFields?.length || !fieldsFetched || !allFields?.length) return;

    console.log('=== Populating existing fields ===');

    // Mark as initialized to prevent re-running
    hasInitializedFields.current = true;

    // Extract field_ids and notes from eventFields prop
    const fieldIds = eventFields.map(ef => ef.field_id);
    const notes = {};
    eventFields.forEach(ef => {
      if (ef.note) {
        notes[ef.field_id] = ef.note;
      }
    });

    console.log('fieldIds extracted:', fieldIds);

    // Get field data for selected field_ids
    const fieldsData = allFields.filter(f => fieldIds.includes(f.id));

    console.log('fieldsData matched:', fieldsData);

    // Update state
    setSelectedFieldIds(fieldIds);
    setSelectedFieldsData(fieldsData);
    setFieldNotes(notes);

    // Build fields array for payload
    const fieldsPayload = fieldIds.map(id => ({
      field_id: id,
      note: notes[id] || ''
    }));

    // Store in form
    form.setFieldsValue({
      fields: fieldsPayload
    });
  }, [isEdit, eventFields, allFields, fieldsFetched, form]);

  // Reset initialization flag when component unmounts or isEdit changes
  useEffect(() => {
    return () => {
      hasInitializedFields.current = false;
    };
  }, [isEdit]);

  // Handle selected fields from SelectFields modal
  const handleFieldsSelected = (fieldIds, fieldsData, notes) => {
    setSelectedFieldIds(fieldIds);
    setSelectedFieldsData(fieldsData);
    setFieldNotes(notes || {});

    // Build fields array for payload: [{id, note}]
    const fieldsPayload = fieldIds.map(id => ({
      field_id: id,
      note: notes?.[id] || ''
    }));

    // Store in form
    form.setFieldsValue({
      selected_field_ids: fieldIds,
      field_notes: notes || {},
      fields: fieldsPayload
    });
  };

  // Remove a selected field
  const handleRemoveField = (fieldId) => {
    const newFieldIds = selectedFieldIds.filter(id => id !== fieldId);
    const newFieldsData = selectedFieldsData.filter(f => f.id !== fieldId);
    const newNotes = { ...fieldNotes };
    delete newNotes[fieldId];

    // Build updated fields array for payload
    const fieldsPayload = newFieldIds.map(id => ({
      id,
      note: newNotes[id] || ''
    }));

    setSelectedFieldIds(newFieldIds);
    setSelectedFieldsData(newFieldsData);
    setFieldNotes(newNotes);
    form.setFieldsValue({
      selected_field_ids: newFieldIds,
      field_notes: newNotes,
      fields: fieldsPayload
    });
  };

  // compute the organizerId for venues:
  const selectedOrganizerFromForm = Form.useWatch('org_id', form);
  const organizerId = useMemo(() => {
    if (UserData?.role === 'Organizer') {
      return UserData?.id;
    }
    return selectedOrganizerFromForm;
  }, [UserData, selectedOrganizerFromForm]);

  // if user is organizer, set the organizer field once
  useEffect(() => {
    if (UserData?.role === 'Organizer') {
      const current = form.getFieldValue('org_id');
      if (!current && organizerId != null) {
        form.setFieldsValue({ org_id: String(organizerId) });
      }
    }
  }, [UserData, organizerId, form]);

  // Reset venue when organizer changes
  useEffect(() => {
    if (!isEdit && selectedOrganizerFromForm) {
      form.setFieldsValue({ venue_id: undefined });
    }
  }, [selectedOrganizerFromForm, form, isEdit]);

  // Force attendee_required = false if category has attendy_required = true
  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      const category = categories.find(c => c.value === selectedCategory);
      if (category?.attendy_required) {
        console.log('Setting attendee_required to false');
        form.setFieldsValue({ atd: false });
      }
    }
  }, [selectedCategory, categories, form]);

  // venues by organizer
  const isUserOrganizer = UserData?.role?.toLowerCase() === 'organizer';

  return (
    <Row gutter={ROW_GUTTER}>


      {/* Organizer (hidden when user is an organizer) */}
      {!isUserOrganizer && (
        <Col xs={24} md={8}>
          <OrganisationList disabled={isEdit} />
        </Col>
      )}

      {/* Category */}
      <Col xs={24} md={8}>
        <Form.Item
          name="category"
          label="Category"
          rules={[{ required: true, message: "Please select category" }]}
        >
          <Select
            placeholder="Select Category"
            loading={catLoading}
            options={categories}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent={catLoading ? "Loading..." : "No categories found"}
          />
        </Form.Item>
      </Col>

      {/* Category Fields Section - Display when category is Registration */}
      {isRegistrationCategory && (
        <Col xs={24}>
          <Card
            size="small"
            title={
              <Space>
                <span>Registration Fields</span>
                {categoryDetailsLoading && <Tag>Loading...</Tag>}
              </Space>
            }
            extra={
              <Button
                type="primary"
                icon={selectedFieldIds.length > 0 ? <EditOutlined /> : <PlusOutlined />}
                onClick={() => setSelectFieldsModalOpen(true)}
                size="small"
              >
                {selectedFieldIds.length > 0 ? 'Edit Fields' : 'Add Fields'}
              </Button>
            }
            className="mb-3"
          >
            {/* Show category's default fields */}
            {hasFields && (
              <div className={selectedFieldIds.length > 0 ? 'mb-3' : ''}>
                <div className="mb-2 text-muted small">
                  Default Category Fields:
                </div>
                <Space wrap>
                  {categoryFields.map((field) => (
                    <Tag
                      key={field.id}
                      color="blue"
                      className="py-1 px-2"
                    >
                      {field.lable || field.field_name}
                      {field.field_required && <span className="text-danger ms-1">*</span>}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            {/* Show selected fields for Registration category */}
            {selectedFieldIds.length > 0 && (
              <div>
                <div className="mb-2 text-muted small">
                  Selected Registration Fields:
                </div>
                <div className="d-flex flex-column gap-2">
                  {selectedFieldsData.map((field) => (
                    <div key={field.id} className="d-flex align-items-center gap-2">
                      <Tag
                        color="green"
                        closable
                        onClose={() => handleRemoveField(field.id)}
                        className="py-1 px-2 m-0"
                      >
                        {field.lable || field.field_name}
                      </Tag>
                      {fieldNotes[field.id] && (
                        <span className="text-muted small fst-italic">
                          — {fieldNotes[field.id]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show add fields prompt when no fields selected */}
            {selectedFieldIds.length === 0 && !hasFields && (
              <Empty
                description="No registration fields selected"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setSelectFieldsModalOpen(true)}
                >
                  Add Registration Fields
                </Button>
              </Empty>
            )}
          </Card>

          {/* Hidden form field for fields payload [{id, note}] */}
          <Form.Item name="fields" hidden>
            <Input />
          </Form.Item>

          {/* Hidden attendee_required field (forced to false by category selection if needed) */}
          <Form.Item name="attendee_required" hidden>
            <Input type="hidden" />
          </Form.Item>
        </Col>
      )}

      {/* Select Fields Drawer for Registration Category */}
      <SelectFields
        open={selectFieldsModalOpen}
        onClose={() => setSelectFieldsModalOpen(false)}
        onSuccess={handleFieldsSelected}
        initialSelectedIds={selectedFieldIds}
        initialFieldNotes={fieldNotes}
      />

      {/* Event Name */}
      <Col xs={24} md={8} className=''>
        <Form.Item
          name="name"
          label="Event Name"
          rules={[
            { required: true, message: "Please enter event name" },
            { min: 3, message: "Event name must be at least 3 characters" },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                // Allow letters (any language), digits, spaces, hyphen and underscore only.
                // Disallow dot (.) and other special characters because they cause issues with Easebuzz.
                const valid = /^[\p{L}0-9 _-]+$/u.test(value);
                return valid
                  ? Promise.resolve()
                  : Promise.reject(
                    new Error(
                      "Only letters, numbers and spaces are allowed — hyphen (-) and underscore (_) are also permitted. Dots (.) and other special characters are not allowed."
                    )
                  );
              },
            },
          ]}
        >
          <Input placeholder="Enter Event Name" />
        </Form.Item>

      </Col>
      <Col xs={24} md={12}>

        <VanueList form={form} />
      </Col>

      {/* Description */}
      {/* <Col xs={24}>
        <Form.Item
          name="description"
          label="Event Description"
          rules={[
            { required: true, message: "Please enter description" },
            { min: 20, message: "Description must be at least 20 characters" },
          ]}
        >
          <TextArea rows={5} placeholder="Enter detailed event description..." showCount maxLength={500} />
        </Form.Item>
      </Col> */}

      <Col xs={24} md={12} className=''>
        <ContentSelect
          form={form}
          fieldName="description"
          contentType="description"
          label="Event Description"
          placeholder="Select content for event description"
          rules={[{ required: true, message: "Please select content for event description" }]}
        />
      </Col>

      <Col xs={24} md={12}>
        <ContentSelect
          form={form}
          fieldName="online_ticket_terms"
          contentType="description"
          label="Ticket Terms & Conditions (Online)"
          placeholder="Select ticket terms"
          rules={[{ required: true, message: "Please select ticket terms" }]}
        />
      </Col>
      <Col xs={24} md={12}>
        <ContentSelect
          form={form}
          fieldName="offline_ticket_terms"
          contentType="description"
          label="Ticket Terms & Conditions (Offline)"
          placeholder="Select ticket terms"
          rules={[{ required: true, message: "Please select ticket terms" }]}
        />
      </Col>
    </Row>
  );
};

export default BasicDetailsStep;