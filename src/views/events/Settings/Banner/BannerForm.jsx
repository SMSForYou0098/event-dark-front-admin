import React, { useState, useEffect, useMemo } from 'react';
import { Card, Form, Input, Button, Row, Col, Select, Upload, message, Radio, Spin, Carousel, Image, Modal, } from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import { OrganisationList } from 'utils/CommonInputs';
import { useMyContext } from 'Context/MyContextProvider';
import { useEventCategories } from 'views/events/event/hooks/useEventOptions';
import { useOrganizerEvents, useCreateBanner, useUpdateBanner, useEventsByCategories, } from 'views/events/Settings/hooks/useBanners';
import { IMAGE_FIELDS, TEXT_FIELDS, TEXTAREA_FIELDS } from './constants';
import { CustomNextArrow, CustomPrevArrow } from 'views/events/Settings/Banner/CaroselArrows';

const { TextArea } = Input;

// Field configurations


const BannerForm = ({ mode = 'create', id, bannerData, onSuccess, onCancel, visible }) => {
  const { UserData, userRole } = useMyContext();
  const isOrganizer = userRole === 'Organizer'
  const [form] = Form.useForm();
  const isEditMode = mode === 'edit'
  // States
  const [bannerType, setBannerType] = useState(isOrganizer ? 'organization' : 'main');
  const [selectedOrgId, setSelectedOrgId] = useState(isOrganizer ? UserData?.id : null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState(null);
  const [images, setImages] = useState({
    bannerImage: null,
    smImage: null,
    mdImage: null,
  });

  // Set default org ID and banner type for organizers - IMMEDIATELY on mount
  useEffect(() => {
    if (isOrganizer && UserData?.id) {
      const orgId = String(UserData.id);
      setSelectedOrgId(UserData.id);
      setBannerType('organization');

      // Set form values immediately
      form.setFieldsValue({
        org_id: orgId,
        banner_type: 'organization',
      });
    }
  }, [isOrganizer, UserData?.id, form]);

  // Fetch categories
  const {
    data: categories = [],
    isLoading: catLoading,
  } = useEventCategories();

  // Find category title by ID
  const findCategoryTitleById = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId || cat.value === categoryId);
    return category?.name || category?.label || null;
  };

  // Populate form with banner data in edit mode
  useEffect(() => {
    if (isEditMode && bannerData) {
      const data = bannerData;

      // Determine banner type - use the type from data directly
      let type = data.type || 'main';

      // Normalize type names
      if (type === 'organisation') {
        type = 'organization';
      }

      setBannerType(type);

      // Set org ID for organization type
      if (isOrganizer && UserData?.id) {
        setSelectedOrgId(UserData.id);
      } else if (data.org_id) {
        setSelectedOrgId(data.org_id);
      }

      // Extract category ID - handle both object and direct ID
      let categoryId = null;
      if (data.category) {
        categoryId = typeof data.category === 'object' ? data.category.id : data.category;
        setSelectedCategoryId(categoryId);

        // Set category title for fetching events
        const categoryTitle = typeof data.category === 'object'
          ? data.category.title
          : findCategoryTitleById(categoryId);
        setSelectedCategoryTitle(categoryTitle);
      }

      // Set form values
      form.setFieldsValue({
        banner_type: type,
        category: categoryId,
        title: data.title,
        description: data.description,
        sub_description: data.sub_description,
        button_text: data.button_text,
        button_link: data.button_link,
        external_url: data.external_url,
        event_id: data.event_id,
        event_key: data.event_key,
      });

      // Set images if they exist
      const newImages = {};
      if (data.images) {
        newImages.bannerImage = {
          uid: '-1',
          name: 'banner-image',
          status: 'done',
          url: data.images,
        };
      }
      if (data.sm_image) {
        newImages.smImage = {
          uid: '-2',
          name: 'sm-image',
          status: 'done',
          url: data.sm_image,
        };
      }
      if (data.md_image) {
        newImages.mdImage = {
          uid: '-3',
          name: 'md-image',
          status: 'done',
          url: data.md_image,
        };
      }
      setImages(newImages);
    }
  }, [isEditMode, bannerData, form, categories, isOrganizer, UserData]);

  const {
    data: orgEvents = [],
    isLoading: orgEventsLoading,
  } = useOrganizerEvents(selectedOrgId, {
    enabled: bannerType === 'organization' && !!selectedOrgId,
  });
  // Fetch events based on selected category title (for category banner type only)
  const {
    data: categoryEventsData = [],
    isLoading: categoryEventsLoading,
  } = useEventsByCategories(selectedCategoryTitle, {
    enabled: bannerType === 'category' && !!selectedCategoryTitle,
  });

  // Process category events data to match the expected format
  const categoryEvents = useMemo(() => {
    return categoryEventsData?.map(event => ({
      value: event.id,
      label: event.title || event.name,
      event_key: event.event_key,
    })) || [];
  }, [categoryEventsData]);

  // Mutations
  const { mutate: createBanner, isPending: isCreating } = useCreateBanner({
    onSuccess: (res) => {
      message.success(res?.message || 'Banner created successfully');
      onSuccess?.();
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to create banner');
    },
  });

  const { mutate: updateBanner, isPending: isUpdating } = useUpdateBanner({
    onSuccess: (res) => {
      message.success(res?.message || 'Banner updated successfully');
      onSuccess?.();
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to update banner');
    },
  });

  // Handle banner type change - DON'T allow organizers to change
  const handleBannerTypeChange = (e) => {
    // Prevent organizers from changing banner type
    if (isOrganizer) return;

    const type = e.target.value;
    setBannerType(type);

    // Update form field
    form.setFieldValue('banner_type', type);

    // Only reset dropdown-related states
    setSelectedOrgId(null);
    setSelectedCategoryId(null);
    setSelectedCategoryTitle(null);

    // Clear only dropdown fields based on selection
    if (type === 'main') {
      form.setFieldsValue({
        org_id: undefined,
        category: undefined,
        event_id: undefined,
        event_key: undefined,
      });
    } else if (type === 'organization') {
      form.setFieldsValue({
        category: undefined,
        event_id: undefined,
        event_key: undefined,
      });

      // Auto-set org_id for organizers
      if (isOrganizer && UserData?.id) {
        setSelectedOrgId(UserData.id);
        form.setFieldValue('org_id', String(UserData.id));
      }
    } else if (type === 'category') {
      form.setFieldsValues({
        org_id: undefined,
        event_id: undefined,
        event_key: undefined,
      });
    }
  };

  // Handle org selection change (for organization banner type)
  const handleOrgChange = (value) => {
    setSelectedOrgId(value);
    form.setFieldsValue({
      event_id: undefined,
      event_key: undefined,
    });
  };

  // Handle category selection change (for category banner type)
  const handleCategoryChange = (categoryId) => {
    setSelectedCategoryId(categoryId);
    const categoryTitle = findCategoryTitleById(categoryId);
    setSelectedCategoryTitle(categoryTitle);
    form.setFieldsValue({
      event_id: undefined,
      event_key: undefined,
    });
  };

  // Handle event selection
  const handleEventChange = (value) => {
    const events = bannerType === 'organization' ? orgEvents : categoryEvents;
    const selectedEvent = events?.find(e => e.value === value);

    if (selectedEvent) {
      // Always use event_key from the selected event
      form.setFieldValue('event_key', selectedEvent.event_key);
    }
  };

  // Generic image upload handler
  const handleImageChange = (stateKey) => ({ fileList }) => {
    setImages(prev => ({ ...prev, [stateKey]: fileList[0] || null }));
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      // Validate and get values
      const values = await form.validateFields();

      const submitData = new FormData();
      const IMAGE_KEYS = ['images', 'sm_image', 'md_image'];

      // Always send the normalized banner type
      submitData.append('type', bannerType); // change to 'banner_type' if your API expects that

      // Append non-file fields (skip upload fields and irrelevant fields per type)
      Object.entries(values).forEach(([key, val]) => {
        // 1) skip the form-only banner_type field (we already appended 'type' above)
        if (key === 'banner_type') return;

        // 2) skip file fields; they'll be appended from state below
        if (IMAGE_KEYS.includes(key)) return;

        // 3) skip fields based on banner type
        if (bannerType === 'main' && (key === 'org_id' || key === 'event_id' || key === 'event_key')) return;
        if (bannerType === 'organization' && key === 'category') return;
        if (bannerType === 'category' && key === 'org_id') return;

        // 4) append only meaningful values
        if (val !== undefined && val !== null && val !== '') {
          // Coerce to string to be consistent for FormData text fields
          submitData.append(key, String(val));
        }
      });

      // Append image files only if a NEW file is picked (originFileObj exists)
      if (images.bannerImage?.originFileObj) {
        submitData.append('images', images.bannerImage.originFileObj);
      }
      if (images.smImage?.originFileObj) {
        submitData.append('sm_image', images.smImage.originFileObj);
      }
      if (images.mdImage?.originFileObj) {
        submitData.append('md_image', images.mdImage.originFileObj);
      }

      // --- Debug: inspect what will be sent (optional) ---
      // for (const [k, v] of submitData.entries()) {
      //   console.log(k, v instanceof File ? `(file) ${v.name}` : v);
      // }

      // Submit
      if (isEditMode) {
        updateBanner({ id, formData: submitData });
      } else {
        createBanner(submitData);
      }
    } catch (err) {
      console.error('Validation Failed:', err);
      message.error('Please fill all required fields');
    }
  };


  // Upload props for images
  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB!');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    maxCount: 1,
  };

  // Get all uploaded images for carousel
  const uploadedImages = useMemo(() => {
    const imgs = [];
    if (images.bannerImage) {
      imgs.push({
        url: images.bannerImage.url || URL.createObjectURL(images.bannerImage.originFileObj),
        title: 'Banner Image',
      });
    }
    if (images.smImage) {
      imgs.push({
        url: images.smImage.url || URL.createObjectURL(images.smImage.originFileObj),
        title: 'Small Image',
      });
    }
    if (images.mdImage) {
      imgs.push({
        url: images.mdImage.url || URL.createObjectURL(images.mdImage.originFileObj),
        title: 'Medium Image',
      });
    }
    return imgs;
  }, [images]);

  const isSubmitting = isCreating || isUpdating;
  const showOrgDropdown = false; // Never show org dropdown (Organizers use their own ID, others see type options)
  const showCategoryField = bannerType === 'category' || bannerType === 'main';
  const showEventDropdown = bannerType === 'organization' || bannerType === 'category';
  const eventsData = bannerType === 'organization' ? orgEvents : categoryEvents;
  const eventsLoading = bannerType === 'organization' ? orgEventsLoading : categoryEventsLoading;
  const eventPlaceholder = bannerType === 'organization'
    ? (selectedOrgId ? "Select event" : (isOrganizer ? "Loading events..." : "Select organization first"))
    : (selectedCategoryTitle ? "Select event" : "Select category first");

  // Custom arrow components for carousel
  return (
    <Modal
      title={`${mode === 'create' ? 'Create' : 'Edit'} Banner`}
      open={visible}
      onCancel={onCancel}
      footer={
        <>
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()} // Trigger form submission
            loading={isSubmitting}
          >
            {isSubmitting
              ? (isEditMode ? 'Updating...' : 'Creating...')
              : (isEditMode ? 'Update' : 'Create')}
          </Button>
        </>
      }
      width={1200}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={[16, 16]}>
          {/* Banner Type */}
          <Col xs={24}>
            <Form.Item label="Banner Type" name="banner_type" initialValue="main">
              <Radio.Group onChange={handleBannerTypeChange} value={bannerType}>
                <Radio value="main">Main Banner</Radio>
                <Radio value="organization">Organization Banner</Radio>
                <Radio value="category">Category Banner</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>

          {/* Organization Dropdown */}
          {showOrgDropdown && (
            <Col xs={24} md={12}>
              <OrganisationList onChange={handleOrgChange} />
            </Col>
          )}

          {/* Category Dropdown */}
          {showCategoryField && (
            <Col xs={24} md={12}>
              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select
                  showSearch
                  placeholder="Select category"
                  loading={catLoading}
                  options={categories?.map(cat => ({
                    value: cat.id || cat.value,
                    label: cat.name || cat.label,
                  }))}
                  optionFilterProp="label"
                  onChange={handleCategoryChange}
                />
              </Form.Item>
            </Col>
          )}

          {/* Event Dropdown */}
          {showEventDropdown && (
            <Col xs={24} md={12}>
              <Form.Item
                label="Event"
                name="event_id"
                rules={[
                  {
                    required: bannerType === 'category',
                    message: 'Please select event'
                  }
                ]}
              >
                <Select
                  showSearch
                  placeholder={eventPlaceholder}
                  loading={eventsLoading}
                  disabled={bannerType === 'organization' ? !selectedOrgId : !selectedCategoryTitle}
                  options={eventsData?.map(event => ({
                    value: event.value,
                    label: event.label,
                  }))}
                  optionFilterProp="label"
                  onChange={handleEventChange}
                  allowClear
                />
              </Form.Item>
            </Col>
          )}

          {/* Hidden Event Key Field */}
          <Form.Item name="event_key" noStyle>
            <Input type="hidden" />
          </Form.Item>

          {/* Text Fields */}
          {TEXT_FIELDS.map((field) => (
            <Col key={field.name} {...field.span}>
              <Form.Item
                label={field.label}
                name={field.name}
                rules={field.rules}
              >
                <Input placeholder={field.placeholder} />
              </Form.Item>
            </Col>
          ))}
          {/* Image Upload Fields */}
          {IMAGE_FIELDS.map((field) => (
            <Col key={field.name} {...field.span}>
              <Form.Item
                label={field.label}
                name={field.name}
                rules={field.required ? [{ required: !isEditMode, message: `Please upload ${field.label.toLowerCase()}` }] : undefined}
              >
                <Upload
                  {...uploadProps}
                  fileList={images[field.stateKey] ? [images[field.stateKey]] : []}
                  onChange={handleImageChange(field.stateKey)}
                  listType="picture-card"
                  accept="image/*"
                >
                  {!images[field.stateKey] && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>{field.uploadText}</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
          ))}

          {/* TextArea Fields */}
          {TEXTAREA_FIELDS.map((field) => (
            <Col key={field.name} {...field.span}>
              <Form.Item
                label={field.label}
                name={field.name}
                rules={field.rules}
              >
                <TextArea
                  rows={field.rows}
                  placeholder={field.placeholder}
                  showCount
                  maxLength={field.maxLength}
                />
              </Form.Item>
            </Col>
          ))}


          {/* Image Preview Carousel */}
          {uploadedImages.length > 0 && (
            <Col xs={24}>
              <Card title="Image Preview" style={{ marginTop: 16 }}>
                <Carousel
                  arrows
                  prevArrow={<CustomPrevArrow />}
                  nextArrow={<CustomNextArrow />}
                  style={{ padding: '0 40px' }}
                >
                  {uploadedImages.map((img, index) => (
                    <div key={index}>
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <h4 style={{ marginBottom: 16 }}>{img.title}</h4>
                        <Image
                          src={img.url}
                          alt={img.title}
                          style={{
                            maxHeight: '400px',
                            maxWidth: '100%',
                            objectFit: 'contain',
                          }}
                          preview={{
                            mask: 'Click to preview',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </Carousel>
              </Card>
            </Col>
          )}
        </Row>
      </Form>
    </Modal>
  );
};

export default BannerForm;