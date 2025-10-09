import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Select,
  Upload,
  message,
  Radio,
  Spin,
} from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { OrganisationList } from 'utils/CommonInputs';
import { useMyContext } from 'Context/MyContextProvider';
import { useEventCategories } from 'views/events/event/hooks/useEventOptions';
import {
  useOrganizerEvents,
  useBanner,
  useCreateBanner,
  useUpdateBanner,
} from 'views/events/Settings/hooks/useBanners';

const { TextArea } = Input;

const BannerForm = ({ mode = 'create' }) => {
  const { UserData, userRole } = useMyContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  // States
  const [bannerType, setBannerType] = useState('main');
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);
  const [smImage, setSmImage] = useState(null);
  const [mdImage, setMdImage] = useState(null);

  // Check if user is organizer
  const isOrganizer = userRole === 'Organizer';
  const isEditMode = mode === 'edit' && id;

  // Fetch banner data for edit mode
  const { data: bannerData, isLoading: bannerLoading } = useBanner(id, {
    enabled: isEditMode,
  });

  // Set default org ID for organizers
  useEffect(() => {
    if (isOrganizer && UserData?.id && !isEditMode) {
      setSelectedOrgId(UserData.id);
      form.setFieldValue('org_id', String(UserData.id));
    }
  }, [isOrganizer, UserData, form, isEditMode]);

  // Populate form with banner data in edit mode
  useEffect(() => {
    if (isEditMode && bannerData) {
      const data = bannerData;
      
      // Set banner type
      const type = data.event_id ? 'category' : 'main';
      setBannerType(type);
      
      // Set org ID
      if (data.org_id) {
        setSelectedOrgId(data.org_id);
      }
      
      // Set form values
      form.setFieldsValue({
        org_id: data.org_id ? String(data.org_id) : undefined,
        category: data.category,
        title: data.title,
        description: data.description,
        sub_description: data.sub_description,
        button_text: data.button_text,
        button_link: data.button_link,
        external_url: data.external_url,
        event_id: data.event_id,
        event_key: data.event_key,
        banner_type: type,
      });
      
      // Set images if they exist (you may need to create proper file objects)
      if (data.images) {
        setBannerImage({
          uid: '-1',
          name: 'banner-image',
          status: 'done',
          url: data.images,
        });
      }
      
      if (data.sm_image) {
        setSmImage({
          uid: '-2',
          name: 'sm-image',
          status: 'done',
          url: data.sm_image,
        });
      }
      
      if (data.md_image) {
        setMdImage({
          uid: '-3',
          name: 'md-image',
          status: 'done',
          url: data.md_image,
        });
      }
    }
  }, [isEditMode, bannerData, form]);

  // Fetch categories
  const {
    data: categories = [],
    isLoading: catLoading,
  } = useEventCategories();

  // Fetch events based on selected org (only when banner type is 'category')
  const {
    data: events = [],
    isLoading: eventsLoading,
  } = useOrganizerEvents(selectedOrgId, {
    enabled: bannerType === 'category' && !!selectedOrgId,
  });

  // Mutations
  const { mutate: createBanner, isPending: isCreating } = useCreateBanner({
    onSuccess: (res) => {
      message.success(res?.message || 'Banner created successfully');
      navigate(-1); // Go back
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to create banner');
    },
  });

  const { mutate: updateBanner, isPending: isUpdating } = useUpdateBanner({
    onSuccess: (res) => {
      message.success(res?.message || 'Banner updated successfully');
      navigate(-1); // Go back
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to update banner');
    },
  });

  // Handle banner type change
  const handleBannerTypeChange = (e) => {
    const type = e.target.value;
    setBannerType(type);
    
    // Clear category-specific fields when switching to main
    if (type === 'main') {
      form.setFieldsValue({
        org_id: undefined,
        event_id: undefined,
        event_key: undefined,
      });
      setSelectedOrgId(null);
    } else if (type === 'category' && isOrganizer && UserData?.id) {
      // Auto-set org_id for organizers when switching to category
      setSelectedOrgId(UserData.id);
      form.setFieldValue('org_id', String(UserData.id));
    }
  };

  // Handle org selection change
  const handleOrgChange = (value) => {
    setSelectedOrgId(value);
    // Clear event selection when org changes
    form.setFieldsValue({
      event_id: undefined,
      event_key: undefined,
    });
  };

  // Handle event selection
  const handleEventChange = (value) => {
    const selectedEvent = events.find(e => e.value === value);
    if (selectedEvent) {
      form.setFieldValue('event_key', selectedEvent.label);
    }
  };

  // Handle banner image upload (single)
  const handleBannerImageChange = ({ fileList }) => {
    setBannerImage(fileList[0] || null);
  };

  // Handle small image upload (single)
  const handleSmImageChange = ({ fileList }) => {
    setSmImage(fileList[0] || null);
  };

  // Handle medium image upload (single)
  const handleMdImageChange = ({ fileList }) => {
    setMdImage(fileList[0] || null);
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Prepare form data
      const submitData = new FormData();
      
      // Add all form fields based on banner type
      Object.keys(values).forEach(key => {
        // Skip org_id and event fields if banner type is 'main'
        if (bannerType === 'main' && (key === 'org_id' || key === 'event_id' || key === 'event_key')) {
          return;
        }
        
        // Skip banner_type from form values
        if (key === 'banner_type') {
          return;
        }
        
        if (values[key] !== undefined && values[key] !== null) {
          submitData.append(key, values[key]);
        }
      });
      
      // Append banner image (only if new file is uploaded)
      if (bannerImage?.originFileObj) {
        submitData.append('images', bannerImage.originFileObj);
      }
      
      if (smImage?.originFileObj) {
        submitData.append('sm_image', smImage.originFileObj);
      }
      
      if (mdImage?.originFileObj) {
        submitData.append('md_image', mdImage.originFileObj);
      }

      // Submit based on mode
      if (isEditMode) {
        updateBanner({ id, formData: submitData });
      } else {
        createBanner(submitData);
      }
      
    } catch (error) {
      console.error('Validation Failed:', error);
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
      return false; // Prevent auto upload
    },
    maxCount: 1,
  };

  const isSubmitting = isCreating || isUpdating;

  if (bannerLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading banner data..." />
      </div>
    );
  }

  return (
    <Card title={`${isEditMode ? 'Edit' : 'Create'} Banner`}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Row gutter={[16, 16]}>
          {/* Banner Type */}
          <Col xs={24}>
            <Form.Item
              label="Banner Type"
              name="banner_type"
              initialValue="main"
            >
              <Radio.Group onChange={handleBannerTypeChange} value={bannerType}>
                <Radio value="main">Main Banner</Radio>
                <Radio value="category">Category Banner</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>

          {/* Organization - Only show for category banners and non-organizers */}
          {bannerType === 'category' && !isOrganizer && (
            <Col xs={24} md={12}>
              <OrganisationList onChange={handleOrgChange} />
            </Col>
          )}

          {/* Category */}
          <Col xs={24} md={(bannerType === 'category' && !isOrganizer) ? 12 : 24}>
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
              />
            </Form.Item>
          </Col>

          {/* Event Selection - Only for category banners */}
          {bannerType === 'category' && (
            <>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Event"
                  name="event_id"
                  rules={[{ required: true, message: 'Please select event' }]}
                >
                  <Select
                    showSearch
                    placeholder={selectedOrgId ? "Select event" : "Select organization first"}
                    loading={eventsLoading}
                    disabled={!selectedOrgId}
                    options={events?.map(event => ({
                      value: event.value,
                      label: event.label,
                    }))}
                    optionFilterProp="label"
                    onChange={handleEventChange}
                  />
                </Form.Item>
              </Col>
            </>
          )}

          {/* Title */}
          <Col xs={24} md={12}>
            <Form.Item
              label="Title"
              name="title"
              rules={[
                { required: true, message: 'Please enter title' },
                { min: 3, message: 'Title must be at least 3 characters' },
              ]}
            >
              <Input placeholder="Enter banner title" />
            </Form.Item>
          </Col>

          {/* Button Text */}
          <Col xs={24} md={12}>
            <Form.Item
              label="Button Text"
              name="button_text"
            >
              <Input placeholder="Enter button text" />
            </Form.Item>
          </Col>

          {/* Button Link */}
          <Col xs={24} md={12}>
            <Form.Item
              label="Button Link"
              name="button_link"
            >
              <Input placeholder="Enter button link" />
            </Form.Item>
          </Col>

          {/* External URL */}
          <Col xs={24} md={12}>
            <Form.Item
              label="External URL"
              name="external_url"
              rules={[
                {
                  type: 'url',
                  message: 'Please enter a valid URL',
                },
              ]}
            >
              <Input placeholder="https://example.com" />
            </Form.Item>
          </Col>

          {/* Description */}
          <Col xs={24}>
            <Form.Item
              label="Description"
              name="description"
              rules={[{ required: true, message: 'Please enter description' }]}
            >
              <TextArea
                rows={4}
                placeholder="Enter banner description"
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Col>

          {/* Sub Description */}
          <Col xs={24}>
            <Form.Item
              label="Sub Description"
              name="sub_description"
            >
              <TextArea
                rows={3}
                placeholder="Enter sub description (optional)"
                showCount
                maxLength={300}
              />
            </Form.Item>
          </Col>

          {/* Banner Image (Single) */}
          <Col xs={24}>
            <Form.Item
              label="Banner Image"
              name="images"
              rules={[{ required: !isEditMode, message: 'Please upload banner image' }]}
            >
              <Upload
                {...uploadProps}
                fileList={bannerImage ? [bannerImage] : []}
                onChange={handleBannerImageChange}
                listType="picture-card"
                accept="image/*"
              >
                {!bannerImage && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload Banner</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Col>

          {/* Small Image (Single) */}
          <Col xs={24} md={12}>
            <Form.Item
              label="Small Image"
              name="sm_image"
            >
              <Upload
                {...uploadProps}
                fileList={smImage ? [smImage] : []}
                onChange={handleSmImageChange}
                listType="picture-card"
                accept="image/*"
              >
                {!smImage && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload SM</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Col>

          {/* Medium Image (Single) */}
          <Col xs={24} md={12}>
            <Form.Item
              label="Medium Image"
              name="md_image"
            >
              <Upload
                {...uploadProps}
                fileList={mdImage ? [mdImage] : []}
                onChange={handleMdImageChange}
                listType="picture-card"
                accept="image/*"
              >
                {!mdImage && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload MD</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Col>

          {/* Submit Button */}
          <Col xs={24}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                htmlType="submit"
                loading={isSubmitting}
              >
                {isSubmitting 
                  ? (isEditMode ? 'Updating...' : 'Creating...') 
                  : (isEditMode ? 'Update' : 'Create')}
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default BannerForm;