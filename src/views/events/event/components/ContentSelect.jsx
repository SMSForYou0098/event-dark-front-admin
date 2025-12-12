import React from "react";
import { Col, Form, Select, Button, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import DOMPurify from "dompurify";
import { useNavigate } from "react-router-dom";

export const ContentSelect = ({
  form,
  fieldName = "description",
  label = "Select Content",
  contentList = [],
  loading = false,
  placeholder = `Select ${label.toLowerCase()}`,
  rules = [{ required: true, message: `Please select ${label.toLowerCase()}` }],
  allowAdd = true,
  extra = '',
}) => {
  const navigate = useNavigate();

  // selected value will be the id
  const selectedId = Form.useWatch(fieldName, form);

  // lookup selected item to render preview
  const selectedItem = (contentList || []).find((it) => String(it.id) === String(selectedId));

  const handleSelectChange = (value) => {
    // store only the id in the form
    form.setFieldsValue({ [fieldName]: value });
  };

  return (
    <>
      <Col xs={24}>
        <Form.Item name={fieldName} label={label} rules={rules}>
          <Select
            placeholder={placeholder}
            loading={loading}
            disabled={loading} // ⬅ prevents render issues when list is empty
            extra={extra}

            // options appear only when contentList is ready
            options={(contentList || []).map((item) => ({
              label: item.title,
              value: String(item.id),
            }))}

            onChange={handleSelectChange}
            optionLabelProp="label"

            // avoid mismatch: only set value when loading is done & item exists
            value={
              !loading && selectedId
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
                      onClick={() => navigate("/event-content")}
                      disabled={loading}
                    >
                      Add Content
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
    </>
  );
};

export default ContentSelect;
