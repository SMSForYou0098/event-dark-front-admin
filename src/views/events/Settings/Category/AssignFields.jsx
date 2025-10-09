import React, { memo, useEffect, useState, useCallback } from "react";
import { Modal, Checkbox, Row, Col, Card, Button, Input, Spin, notification, Empty } from "antd";
import axios from "axios";
import { useMyContext } from "../../../../Context/MyContextProvider";
import { ROW_GUTTER } from "constants/ThemeConstant";
const { Search } = Input;

const AssignFields = memo(({ showFields, onClose, editState, onFieldsChange, selectedIds = [], onFieldsNameChange }) => {
  const { api, successAlert, ErrorAlert, authToken } = useMyContext();

  const [fields, setFields] = useState([]);
  const [filteredFields, setFilteredFields] = useState([]);
  const [selected, setSelected] = useState(selectedIds);
  const [loading, setLoading] = useState(true);

  // ========================= FETCH AVAILABLE FIELDS =========================
  const fetchFields = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${api}fields-name`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.data.status) {
        setFields(response.data.customFields);
        setFilteredFields(response.data.customFields);
      }
    } catch (error) {
      console.error("Error fetching fields:", error);
      ErrorAlert("Failed to fetch fields");
    } finally {
      setLoading(false);
    }
  }, [api, authToken, ErrorAlert]);

  useEffect(() => {
    if (showFields) fetchFields();
  }, [fetchFields, showFields]);

  // ========================= HANDLE SEARCH =========================
  const handleSearch = useCallback(
    (value) => {
      if (!value.trim()) return setFilteredFields(fields);
      const lower = value.toLowerCase();
      setFilteredFields(
        fields.filter((f) => f.field_name.toLowerCase().includes(lower))
      );
    },
    [fields]
  );

  // ========================= HANDLE SELECTION =========================
  const handleSelectionChange = useCallback(
    (checkedValues) => {
      setSelected(checkedValues);
    },
    []
  );

  // ========================= SUBMIT =========================
  const handleSubmit = useCallback(() => {
    const selectedData = fields
      .filter((f) => selected.includes(f.id))
      .map((f) => ({ id: f.id, field_name: f.field_name }));

    onFieldsChange(selected);
    onFieldsNameChange(selectedData);

    notification.success({ message: "Fields updated successfully" });
    onClose();
  }, [selected, fields, onFieldsChange, onFieldsNameChange, onClose, successAlert]);

  // ========================= RESET WHEN CLOSED =========================
  useEffect(() => {
    if (!showFields) {
      setSelected(selectedIds);
    }
  }, [showFields, selectedIds]);

  // ========================= RENDER =========================
  return (
    <Modal
      open={showFields}
      title={editState ? "Update Fields" : "Select Fields"}
      onCancel={onClose}
      style={{ top: 0 }}
      footer={
        <>
          <Button onClick={onClose} className="me-2">
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={!selected.length}
          >
            Save Changes
          </Button>
        </>
      }
      width={900}
      destroyOnClose
    >
      <div className="text-right py-2">
        <Search
          placeholder="Search fields..."
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
          style={{ width: 300 }}
        />
        <div>
        </div>
      </div>

      <Spin spinning={loading}>
        <Row gutter={ROW_GUTTER}>
        {filteredFields.map((item) => {
          const isChecked = selected.includes(item.id);
          const handleCardClick = () => {
            if (isChecked) {
              setSelected(prev => prev.filter(id => id !== item.id));
            } else {
              setSelected(prev => [...prev, item.id]);
            }
          };
          return (
            <Col span={8} key={item.id}>
              <Card
                size="small"
                hoverable
                onClick={handleCardClick}
                className={`transition-all cursor-pointer ${isChecked ? "border-primary shadow-md" : ""}`}
              >
                <Checkbox
                  value={item.id}
                  checked={isChecked}
                  onChange={handleCardClick} // Prevent warning
                  onClick={(e) => e.stopPropagation()} // Prevent checkbox click from bubbling to card
                >
                  {item.field_name}
                </Checkbox>
              </Card>
            </Col>
          );
        })}
        </Row>

      </Spin>
    </Modal>
  );
}
);

AssignFields.displayName = "AssignFields";
export default AssignFields;
