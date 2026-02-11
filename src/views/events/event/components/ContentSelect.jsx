import React, { useState } from "react";
import { Col, Form, Select, Button, Collapse, Card, Empty, Spin, Typography, Space, Tag, Divider } from "antd";
import { PlusOutlined, FileTextOutlined, InfoCircleOutlined, EyeOutlined } from "@ant-design/icons";
import DOMPurify from "dompurify";
import ContentFormModal from "views/events/EventContent/ContentFormModal";
import { useGetAllContentMaster } from "views/events/EventContent/useContentMaster";
import { useMyContext } from "Context/MyContextProvider";

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

export const ContentSelect = ({
  form,
  fieldName = "description",
  label = "Select Content",
  placeholder = `Select ${label.toLowerCase()}`,
  rules = [{ required: true, message: `Please select ${label.toLowerCase()}` }],
  allowAdd = true,
  extra = '',
  contentType = null, // 'note' or 'description' - filters the list and sets default type for new content
  customOrgId = null,
  previewMaxHeight = 200, // Max height in pixels for the preview card, enables scrolling if content overflows
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const { userRole, UserData } = useMyContext();

  // Prioritize customOrgId if provided, otherwise use org_id from form
  const formOrgId = Form.useWatch('org_id', form);
  const orgId = userRole === 'Organizer' ? UserData?.id : customOrgId || formOrgId;

  // selected value will be the id
  const selectedId = Form.useWatch(fieldName, form);
  const { data: contentList = [], isLoading: contentLoading } = useGetAllContentMaster(orgId, 'Organizer');

  // Filter content list by type if contentType is provided
  const filteredContentList = contentType
    ? (contentList || []).filter((item) => !item.type || item.type === contentType)
    : contentList || [];

  // lookup selected item to render preview - ALWAYS use unfiltered list
  const selectedItem = React.useMemo(() => {
    if (!selectedId || !contentList?.length) return null;
    return (contentList || []).find((it) => String(it.id) === String(selectedId)) || null;
  }, [selectedId, contentList]);

  const handleSelectChange = (value) => {
    form.setFieldsValue({ [fieldName]: value });
    setPreviewExpanded(false); // Reset preview expansion when selection changes
  };

  const handleAddContent = () => {
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  const handleModalSuccess = (data) => {
    setModalVisible(false);
    // Auto-select the newly created content
    if (data?.data?.id) {
      form.setFieldsValue({ [fieldName]: String(data.data.id) });
    }
  };

  // Get content type label
  const getContentTypeLabel = () => {
    if (contentType === 'description') return 'Description';
    if (contentType === 'note') return 'Note';
    return 'Content';
  };

  return (
    <>
      <Col xs={24}>
        <Collapse
          className="mb-3"

          bordered={false}
          expandIconPosition="end"
        >
          <Panel
            key="1"
            header={
              <Space align="center">
                <FileTextOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
                <Text strong style={{ fontSize: '15px' }}>
                  {label}
                </Text>
                {selectedItem && (
                  <Tag color="cyan" style={{ marginLeft: 8 }}>
                    Selected
                  </Tag>
                )}
              </Space>
            }
            extra={
              selectedItem?.title && (
                <Text type="secondary" style={{ fontSize: '13px', fontStyle: 'italic' }}>
                  {selectedItem.title.length > 30
                    ? `${selectedItem.title.substring(0, 30)}...`
                    : selectedItem.title}
                </Text>
              )
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* Info Alert */}
              {extra && (
                <Card size="small" bordered={false} >
                  <Space align="start">
                    <InfoCircleOutlined style={{ color: '#1890ff', marginTop: 4 }} />
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      {extra}
                    </Text>
                  </Space>
                </Card>
              )}

              {/* Select Field */}
              <Form.Item
                name={fieldName}
                rules={rules}
                style={{ marginBottom: 0 }}
              >
                <Select
                  size="large"
                  placeholder={placeholder}
                  loading={contentLoading}
                  disabled={contentLoading}
                  notFoundContent={
                    contentLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Spin size="small" />
                        <div style={{ marginTop: 8, color: '#999' }}>Loading content...</div>
                      </div>
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <Space direction="vertical" size="small">
                            <Text type="secondary">No content available</Text>
                            {allowAdd && (
                              <Button
                                type="link"
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={handleAddContent}
                              >
                                Create your first {getContentTypeLabel().toLowerCase()}
                              </Button>
                            )}
                          </Space>
                        }
                      />
                    )
                  }
                  options={filteredContentList.map((item) => ({
                    label: item.title,
                    value: String(item.id),
                    item: item, // Store full item for custom rendering
                  }))}
                  onChange={handleSelectChange}
                  optionLabelProp="label"
                  value={selectedId ? String(selectedId) : undefined}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      {allowAdd && filteredContentList.length > 0 && (
                        <>
                          <Divider style={{ margin: '8px 0' }} />
                          <div style={{
                            padding: '8px 12px',
                            textAlign: 'center',
                          }}>
                            <Button
                              type="link"
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={handleAddContent}
                              disabled={contentLoading}
                            >
                              Create New {getContentTypeLabel()}
                            </Button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  optionRender={(option) => (
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <Text strong>{option.label}</Text>
                      {option.data.item?.type && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          <Tag
                            color={option.data.item.type === 'description' ? 'blue' : 'green'}
                            style={{ fontSize: '11px', marginRight: 4 }}
                          >
                            {option.data.item.type}
                          </Tag>
                        </Text>
                      )}
                    </Space>
                  )}
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  style={{ width: "100%" }}
                  suffixIcon={contentLoading ? <Spin size="small" /> : undefined}
                />
              </Form.Item>

              {/* Preview Section */}
              {selectedItem && (
                <Card
                  size="small"
                  title={
                    <Space>
                      <EyeOutlined style={{ color: '#1890ff' }} />
                      <Text strong>Preview</Text>
                      <Tag color="processing">{selectedItem.title}</Tag>
                    </Space>
                  }

                  extra={
                    selectedItem?.content && selectedItem.content.length > 500 && (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => setPreviewExpanded(!previewExpanded)}
                      >
                        {previewExpanded ? 'Show Less' : 'Show More'}
                      </Button>
                    )
                  }
                >
                  {contentLoading ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <Spin />
                      <div style={{ marginTop: 12, color: '#999' }}>Loading preview...</div>
                    </div>
                  ) : selectedItem?.content ? (
                    <div
                      style={{
                        maxHeight: previewExpanded ? 'none' : previewMaxHeight,
                        overflowY: previewExpanded ? 'visible' : 'auto',
                        padding: '12px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        lineHeight: '1.8',
                        transition: 'max-height 0.3s ease',
                      }}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify ? DOMPurify.sanitize(selectedItem.content) : selectedItem.content,
                        }}
                      />
                    </div>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No content available for preview"
                      style={{ padding: '24px 0' }}
                    />
                  )}
                </Card>
              )}

              {/* Help Text */}
              {!selectedItem && filteredContentList.length > 0 && (
                <Card size="small" bordered={false}>
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    💡 Select a {getContentTypeLabel().toLowerCase()} from the dropdown to see its preview
                  </Text>
                </Card>
              )}
            </Space>
          </Panel>
        </Collapse>
      </Col>

      {/* Content Creation Modal */}
      <ContentFormModal
        open={modalVisible}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        defaultType={contentType}
        organizerId={orgId}
      />
    </>
  );
};

export default ContentSelect;