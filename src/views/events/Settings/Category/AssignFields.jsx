import React, { memo, useEffect, useState, useCallback } from "react";
import { Modal, Checkbox, Row, Col, Card, Button, Input, Spin, notification } from "antd";
import { useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { ROW_GUTTER } from "constants/ThemeConstant";

const { Search } = Input;

const AssignFields = memo(({ showFields, onClose, editState, onFieldsChange, selectedIds = [], onFieldsNameChange }) => {
  const [selected, setSelected] = useState(selectedIds);
  const [searchTerm, setSearchTerm] = useState("");

  // ========================= FETCH AVAILABLE FIELDS =========================
  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['fields-name'],
    queryFn: async () => {
      const res = await api.get('fields-name');
      return res.customFields || [];
    },
    enabled: showFields, // Only fetch when modal is open
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // ========================= FILTER FIELDS =========================
  const filteredFields = fields.filter(f => 
    f.field_name.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [selected, fields, onFieldsChange, onFieldsNameChange, onClose]);

  // ========================= RESET WHEN CLOSED =========================
  useEffect(() => {
    if (showFields) {
      setSelected(selectedIds);
      setSearchTerm("");
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
          onSearch={setSearchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
          style={{ width: 300 }}
          value={searchTerm}
        />
      </div>

      <Spin spinning={isLoading}>
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
                    onChange={() => {}} // Handled by Card click
                    onClick={(e) => e.stopPropagation()} // Prevent bubbling
                  >
                    {item.field_name}
                  </Checkbox>
                </Card>
              </Col>
            );
          })}
          {filteredFields.length === 0 && !isLoading && (
            <Col span={24}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                No fields found
              </div>
            </Col>
          )}
        </Row>
      </Spin>
    </Modal>
  );
});

AssignFields.displayName = "AssignFields";
export default AssignFields;
