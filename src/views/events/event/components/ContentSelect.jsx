import React, { useState } from "react";
import { Col, Form, Select, Button, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import DOMPurify from "dompurify";
import ContentFormModal from "views/events/EventContent/ContentFormModal";
import { useGetAllContentMaster } from "views/events/EventContent/useContentMaster";
import { useMyContext } from "Context/MyContextProvider";

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
  const {userRole, UserData} = useMyContext();
  // Prioritize customOrgId if provided, otherwise use org_id from form
  const formOrgId = Form.useWatch('org_id', form);
  if(userRole ==='Organizer'){
    orgId=UserData?.id 
  }
  const orgId = customOrgId || formOrgId;
  // selected value will be the id
  const selectedId = Form.useWatch(fieldName, form);
  const { data: contentList = [], isLoading: contentLoading } = useGetAllContentMaster(orgId, 'Organizer');
  // Filter content list by type if contentType is provided
  // Include items without type field (for backward compatibility with existing content)
  const filteredContentList = contentType
    ? (contentList || []).filter((item) => !item.type || item.type === contentType)
    : contentList || [];

  // lookup selected item to render preview - ALWAYS use unfiltered list
  // This ensures we can find the selected item even if it doesn't have a type field
  const selectedItem = React.useMemo(() => {
    if (!selectedId || !contentList?.length) return null;
    return (contentList || []).find((it) => String(it.id) === String(selectedId)) || null;
  }, [selectedId, contentList]);

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

            // Set value if selectedId exists (preserve selection even during loading)
            value={selectedId ? String(selectedId) : undefined}

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
          {contentLoading ? (
            <div style={{ color: "#888" }}>Loading...</div>
          ) : selectedItem?.content ? (
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
