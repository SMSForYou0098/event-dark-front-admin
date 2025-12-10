// BasicDetailsStep.jsx
import React, { useEffect, useMemo } from 'react';
import { Form, Input, Select, Row, Col} from 'antd';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import { useEventCategories } from '../hooks/useEventOptions';
import { useMyContext } from 'Context/MyContextProvider';
import { OrganisationList } from 'utils/CommonInputs';
import { VanueList } from './CONSTANTS';

const { TextArea } = Input;

const BasicDetailsStep = ({ form, isEdit }) => {
  const { UserData, } = useMyContext();

  // categories
  const {
    data: categories = [],
    isLoading: catLoading,
  } = useEventCategories();

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

      {/* Event Name */}
      <Col xs={24} md={8}>
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

      <VanueList form={form} />
      {/* Description */}
      <Col xs={24}>
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
      </Col>

    </Row>
  );
};

export default BasicDetailsStep;