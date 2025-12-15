import React, { useState } from "react";
import { Col, Form, Select, Button, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import DOMPurify from "dompurify";
import ContentFormModal from "views/events/EventContent/ContentFormModal";
import { useGetAllContentMaster } from "views/events/EventContent/useContentMaster";

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
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const orgId = Form.useWatch('org_id', form) || customOrgId;

  // selected value will be the id
  const selectedId = Form.useWatch(fieldName, form);
  const { data: contentList = [], isLoading: contentLoading } = useGetAllContentMaster(orgId, 'Organizer');
  // Filter content list by type if contentType is provided
  const filteredContentList = contentType
    ? (contentList || []).filter((item) => item.type === contentType)
    : contentList || [];

  // lookup selected item to render preview
  const selectedItem = filteredContentList.find((it) => String(it.id) === String(selectedId));

  const handleSelectChange = (value) => {
    // store only the id in the form
    form.setFieldsValue({ [fieldName]: value });
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

  return (
    <>
      <Col xs={24}>
        <Form.Item name={fieldName} label={label} rules={rules}>
          <Select
            placeholder={placeholder}
            loading={contentLoading}
            disabled={contentLoading} // ⬅ prevents render issues when list is empty
            extra={extra}

            // options appear only when contentList is ready
            options={filteredContentList.map((item) => ({
              label: item.title,
              value: String(item.id),
            }))}

            onChange={handleSelectChange}
            optionLabelProp="label"

            // avoid mismatch: only set value when loading is done & item exists
            value={
              !contentLoading && selectedId
                ? String(selectedId)
                : undefined
            }

            dropdownRender={(menu) => (
              <>
                {menu}
                {allowAdd && (
                  <div style={{ display: "flex", padding: 8, justifyContent: "center" }}>
                    <Button
                      size="small"
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={handleAddContent}
                      disabled={contentLoading}
                    >
                      Add New {contentType === 'description' ? 'Description' : 'Note'}
                    </Button>
                  </div>
                )}
              </>
            )}

            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }

            style={{ width: "100%" }}
          />
        </Form.Item>

      </Col>

      {/* Preview Card */}
      <Col xs={24}>
        <Card size="small" title={`${label} Preview`} bordered>
          {selectedItem?.content ? (
            <div

              dangerouslySetInnerHTML={{
                __html: DOMPurify ? DOMPurify.sanitize(selectedItem.content) : selectedItem.content,
              }}
            />
          ) : (
            <div style={{ color: "#888" }}>No content selected</div>
          )}
        </Card>
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
