import React, { useState, useEffect, useMemo } from 'react';
import { Card, Form, Input, Button, Row, Col, Select, Upload, message, Radio, Spin, Carousel, Image, Modal, Switch, Space, Typography, } from 'antd';
import { UploadOutlined, SaveOutlined, PictureOutlined, DeleteOutlined } from '@ant-design/icons';
import { OrganisationList } from 'utils/CommonInputs';
import { useMyContext } from 'Context/MyContextProvider';
import { useEventCategories } from 'views/events/event/hooks/useEventOptions';
import { useOrganizerEvents, useCreateBanner, useUpdateBanner, useEventsByCategories, } from 'views/events/Settings/hooks/useBanners';
import { IMAGE_FIELDS, SWITCH_FIELDS, TEXT_FIELDS, TEXTAREA_FIELDS } from './constants';
import { CustomNextArrow, CustomPrevArrow } from 'views/events/Settings/Banner/CaroselArrows';
import { MediaGalleryPickerModal } from 'components/shared-components/MediaGalleryPicker';

const { TextArea } = Input;
const { Text } = Typography;

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

  // Media picker states
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [currentImageField, setCurrentImageField] = useState(null); // Track which field is being edited

  // Clear state when modal closes
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setBannerType(isOrganizer ? 'organization' : 'main');
      setSelectedOrgId(isOrganizer ? UserData?.id : null);
      setSelectedCategoryId(null);
      setSelectedCategoryTitle(null);
      setImages({
        bannerImage: null,
        smImage: null,
        mdImage: null,
      });
      setMediaPickerOpen(false);
      setCurrentImageField(null);
    }
  }, [visible, form, isOrganizer, UserData?.id]);

  // Set default org ID and banner type for organizers
  useEffect(() => {
    if (visible && isOrganizer && UserData?.id && !isEditMode) {
      const orgId = String(UserData.id);
      setSelectedOrgId(UserData.id);
      setBannerType('organization');
      form.setFieldsValue({
        org_id: orgId,
        banner_type: 'organization',
      });
    }
  }, [visible, isOrganizer, UserData?.id, form, isEditMode]);

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
    if (visible && isEditMode && bannerData) {
      const data = bannerData;
      let type = data.type || 'main';
      if (type === 'organisation') {
        type = 'organization';
      }
      setBannerType(type);

      if (isOrganizer && UserData?.id) {
        setSelectedOrgId(UserData.id);
      } else if (data.org_id) {
        setSelectedOrgId(data.org_id);
      }

      let categoryId = null;
      if (data.category) {
        categoryId = typeof data.category === 'object' ? data.category.id : data.category;
        setSelectedCategoryId(categoryId);
        const categoryTitle = typeof data.category === 'object'
          ? data.category.title
          : findCategoryTitleById(categoryId);
        setSelectedCategoryTitle(categoryTitle);
      }

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
        media_url: data.media_url,
        display_in_popup: data.display_in_popup ? 1 : 0,
      });

      // Set images if they exist - store as URL strings for gallery-selected images
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
  }, [visible, isEditMode, bannerData, form, categories, isOrganizer, UserData]);

  const {
    data: orgEvents = [],
    isLoading: orgEventsLoading,
  } = useOrganizerEvents(selectedOrgId, {
    enabled: bannerType === 'organization' && !!selectedOrgId,
  });

  const {
    data: categoryEventsData = [],
    isLoading: categoryEventsLoading,
  } = useEventsByCategories(selectedCategoryTitle, {
    enabled: bannerType === 'category' && !!selectedCategoryTitle,
  });

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

  // Handle banner type change
  const handleBannerTypeChange = (e) => {
    if (isOrganizer) return;
    const type = e.target.value;
    setBannerType(type);
    form.setFieldValue('banner_type', type);
    setSelectedOrgId(null);
    setSelectedCategoryId(null);
    setSelectedCategoryTitle(null);

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
      if (isOrganizer && UserData?.id) {
        setSelectedOrgId(UserData.id);
        form.setFieldValue('org_id', String(UserData.id));
      }
    } else if (type === 'category') {
      form.setFieldsValue({
        org_id: undefined,
        event_id: undefined,
        event_key: undefined,
      });
    }
  };

  const handleOrgChange = (value) => {
    setSelectedOrgId(value);
    form.setFieldsValue({
      event_id: undefined,
      event_key: undefined,
    });
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategoryId(categoryId);
    const categoryTitle = findCategoryTitleById(categoryId);
    setSelectedCategoryTitle(categoryTitle);
    form.setFieldsValue({
      event_id: undefined,
      event_key: undefined,
    });
  };

  const handleEventChange = (value) => {
    const events = bannerType === 'organization' ? orgEvents : categoryEvents;
    const selectedEvent = events?.find(e => e.value === value);
    if (selectedEvent) {
      form.setFieldValue('event_key', selectedEvent.event_key);
    }
  };

  // Open media picker for a specific image field
  const openMediaPicker = (stateKey) => {
    setCurrentImageField(stateKey);
    setMediaPickerOpen(true);
  };

  // Handle media selection from gallery picker
  const handleMediaSelect = (url) => {
    if (currentImageField) {
      setImages(prev => ({
        ...prev,
        [currentImageField]: {
          uid: Date.now().toString(),
          name: 'gallery-image',
          status: 'done',
          url: url,
          isGalleryImage: true, // Flag to identify gallery-selected images
        }
      }));
    }
    setMediaPickerOpen(false);
    setCurrentImageField(null);
  };

  // Clear image for a field
  const clearImage = (stateKey) => {
    setImages(prev => ({ ...prev, [stateKey]: null }));
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = new FormData();
      const IMAGE_KEYS = ['images', 'sm_image', 'md_image'];

      submitData.append('type', bannerType);

      Object.entries(values).forEach(([key, val]) => {
        if (key === 'banner_type') return;
        if (IMAGE_KEYS.includes(key)) return;
        if (bannerType === 'main' && (key === 'org_id' || key === 'event_id' || key === 'event_key')) return;
        if (bannerType === 'organization' && key === 'category') return;
        if (bannerType === 'category' && key === 'org_id') return;

        if (key === 'display_in_popup') {
          submitData.append(key, val ? '1' : '0');
          return;
        }

        if (val !== undefined && val !== null && val !== '') {
          submitData.append(key, String(val));
        }
      });

      // Append images - handle both gallery URLs and file uploads
      // Field name: 'images' for bannerImage, 'sm_image' for smImage, 'md_image' for mdImage
      if (images.bannerImage) {
        if (images.bannerImage.originFileObj) {
          submitData.append('images', images.bannerImage.originFileObj);
        } else if (images.bannerImage.isGalleryImage && images.bannerImage.url) {
          submitData.append('images', images.bannerImage.url);
        }
      }
      if (images.smImage) {
        if (images.smImage.originFileObj) {
          submitData.append('sm_image', images.smImage.originFileObj);
        } else if (images.smImage.isGalleryImage && images.smImage.url) {
          submitData.append('sm_image', images.smImage.url);
        }
      }
      if (images.mdImage) {
        if (images.mdImage.originFileObj) {
          submitData.append('md_image', images.mdImage.originFileObj);
        } else if (images.mdImage.isGalleryImage && images.mdImage.url) {
          submitData.append('md_image', images.mdImage.url);
        }
      }

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

  // Get all uploaded images for carousel
  const uploadedImages = useMemo(() => {
    const imgs = [];
    if (images.bannerImage) {
      const url = images.bannerImage.url ||
        (images.bannerImage.originFileObj ? URL.createObjectURL(images.bannerImage.originFileObj) : null);
      if (url) {
        imgs.push({ url, title: 'Banner Image' });
      }
    }
    if (images.smImage) {
      const url = images.smImage.url ||
        (images.smImage.originFileObj ? URL.createObjectURL(images.smImage.originFileObj) : null);
      if (url) {
        imgs.push({ url, title: 'Small Image' });
      }
    }
    if (images.mdImage) {
      const url = images.mdImage.url ||
        (images.mdImage.originFileObj ? URL.createObjectURL(images.mdImage.originFileObj) : null);
      if (url) {
        imgs.push({ url, title: 'Medium Image' });
      }
    }
    return imgs;
  }, [images]);

  const isSubmitting = isCreating || isUpdating;
  const showCategoryField = bannerType === 'category' || bannerType === 'main';
  const showEventDropdown = bannerType === 'organization' || bannerType === 'category';
  const eventsData = bannerType === 'organization' ? orgEvents : categoryEvents;
  const eventsLoading = bannerType === 'organization' ? orgEventsLoading : categoryEventsLoading;
  const eventPlaceholder = bannerType === 'organization'
    ? (selectedOrgId ? "Select event" : (isOrganizer ? "Loading events..." : "Select organization first"))
    : (selectedCategoryTitle ? "Select event" : "Select category first");

  // Get current image URL for a field
  const getImageUrl = (stateKey) => {
    const img = images[stateKey];
    if (!img) return null;
    return img.url || (img.originFileObj ? URL.createObjectURL(img.originFileObj) : null);
  };

  return (
    <>
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
              onClick={() => form.submit()}
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
        afterClose={() => {
          form.resetFields();
        }}
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
            {bannerType === 'organization' && (
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

            {/* Switch Fields */}
            {SWITCH_FIELDS.map((field) => (
              <Col key={field.name} {...field.span}>
                <Form.Item
                  label={field.label}
                  name={field.name}
                  valuePropName="checked"
                  tooltip={field.tooltip}
                  initialValue={false}
                >
                  <Switch />
                </Form.Item>
              </Col>
            ))}

            {/* Image Fields - Using MediaGalleryPicker */}
            {IMAGE_FIELDS.map((field) => (
              <Col key={field.name} {...field.span}>
                <Form.Item
                  label={field.label}
                  name={field.name}
                  rules={field.required ? [{ required: !isEditMode && !images[field.stateKey], message: `Please select ${field.label.toLowerCase()}` }] : undefined}
                >
                  <Card
                    size="small"
                    style={{
                      border: images[field.stateKey] ? '2px solid #52c41a' : '1px solid #303030',
                      minHeight: 120,
                    }}
                    styles={{ body: { padding: 12 } }}
                  >
                    {getImageUrl(field.stateKey) ? (
                      <div style={{ textAlign: 'center' }}>
                        <Image
                          src={getImageUrl(field.stateKey)}
                          alt={field.label}
                          style={{ maxHeight: 100, objectFit: 'contain' }}
                        />
                        <div style={{ marginTop: 8 }}>
                          <Space size="small">
                            <Button
                              size="small"
                              icon={<PictureOutlined />}
                              onClick={() => openMediaPicker(field.stateKey)}
                            >
                              Change
                            </Button>
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => clearImage(field.stateKey)}
                            />
                          </Space>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <Button
                          type="dashed"
                          icon={<PictureOutlined />}
                          onClick={() => openMediaPicker(field.stateKey)}
                          style={{ height: 60, width: '100%' }}
                        >
                          <div>
                            <div>{field.uploadText}</div>
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              Select from Gallery
                            </Text>
                          </div>
                        </Button>
                      </div>
                    )}
                  </Card>
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

      {/* Media Gallery Picker Modal */}
      <MediaGalleryPickerModal
        open={mediaPickerOpen}
        onCancel={() => {
          setMediaPickerOpen(false);
          setCurrentImageField(null);
        }}
        onSelect={handleMediaSelect}
        multiple={false}
        title={`Select ${currentImageField === 'bannerImage' ? 'Banner' : currentImageField === 'smImage' ? 'Small' : 'Medium'} Image`}
        value={getImageUrl(currentImageField)}
      />
    </>
  );
};

export default BannerForm;