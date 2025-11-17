import React, { useEffect, useState } from 'react';
import { Button, Modal, Checkbox, Space, Divider, Typography } from 'antd';
import { SettingOutlined, HolderOutlined } from '@ant-design/icons';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { Text } = Typography;

const STORAGE_KEY = 'customFieldsSettings';

const SortableCheckboxItem = ({ field, isChecked, onChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '8px 12px',
    borderRadius: 4,
    backgroundColor: isDragging ? '#f0f0f0' : 'transparent',
    opacity: isDragging ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <span {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
        <HolderOutlined />
      </span>
      <Checkbox
        checked={isChecked}
        onChange={(e) => onChange(e.target.checked)}
      >
        <span className='text-white'>{field.lable}</span>
      </Checkbox>
    </div>
  );
};

const CustomFieldsSettings = ({ customFieldsData, setSelectedFields, eventId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fields, setFields] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Get storage key for specific event
  const getStorageKey = () => `${STORAGE_KEY}_event_${eventId}`;

  // Load from localStorage or initialize
  useEffect(() => {
    if (customFieldsData && eventId) {
      try {
        const savedData = localStorage.getItem(getStorageKey());
        
        if (savedData) {
          const { selectedIds, order } = JSON.parse(savedData);
          
          // Create a map for quick lookup of saved order
          const orderMap = new Map(order.map((id, index) => [id, index]));
          
          // Merge saved data with current customFieldsData
          let mergedFields = customFieldsData.map(field => ({
            ...field,
            isSelected: selectedIds.includes(field.id)
          }));
          
          // Sort according to saved order
          mergedFields.sort((a, b) => {
            const orderA = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
            const orderB = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
            return orderA - orderB;
          });
          
          setFields(mergedFields);
          
          // Update parent with saved selection
          const filteredFields = mergedFields
            .filter(f => f.isSelected)
            .map(field => ({
              id: field.id,
              lable: field.lable,
              field_name: field.field_name
            }));
          setSelectedFields(filteredFields);
        } else {
          // Initialize with only fixed fields selected
          const initialFields = customFieldsData.map(field => ({
            ...field,
            isSelected: field.fixed === 1
          }));
          setFields(initialFields);
          
          // Set initial selected fields
          const filteredFields = initialFields
            .filter(f => f.isSelected)
            .map(field => ({
              id: field.id,
              lable: field.lable,
              field_name: field.field_name
            }));
          setSelectedFields(filteredFields);
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        // Fallback to default initialization
        const initialFields = customFieldsData.map(field => ({
          ...field,
          isSelected: field.fixed === 1
        }));
        setFields(initialFields);
      }
    }
  }, [customFieldsData, eventId]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleCheckboxChange = (fieldId, checked) => {
    setFields(prevFields =>
      prevFields.map(field =>
        field.id === fieldId
          ? { ...field, isSelected: checked }
          : field
      )
    );
  };

  const selectedCount = fields.filter(f => f.isSelected).length;
  const totalCount = fields.length;

  const indeterminate = selectedCount > 0 && selectedCount < totalCount;
  const allSelected = selectedCount === totalCount;

  const handleSelectAllChange = (e) => {
    if (e.target.checked) {
      // Select all fields
      setFields(prevFields =>
        prevFields.map(field => ({ ...field, isSelected: true }))
      );
    } else {
      // Deselect all fields
      setFields(prevFields =>
        prevFields.map(field => ({ ...field, isSelected: false }))
      );
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleOk = () => {
    const filteredFields = fields
      .filter(f => f.isSelected)
      .map(field => ({
        id: field.id,
        lable: field.lable,
        field_name: field.field_name
      }));

    // Save to localStorage with event-specific key
    try {
      const dataToSave = {
        eventId: eventId,
        selectedIds: fields.filter(f => f.isSelected).map(f => f.id),
        order: fields.map(f => f.id),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }

    setSelectedFields(filteredFields);
    setIsModalOpen(false);
  };

  return (
    <>
      <Button icon={<SettingOutlined />} onClick={showModal} />

      <Modal
        title="Customize Visible Fields"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Save Changes"
        cancelText="Cancel"
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Space align="center">
            <Checkbox
              indeterminate={indeterminate}
              checked={allSelected}
              onChange={handleSelectAllChange}
            >
              Select All
            </Checkbox>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ({selectedCount} of {totalCount} selected)
            </Text>
          </Space>
        </div>
        <Divider style={{ margin: '12px 0' }} />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map(field => field.id)}
            strategy={verticalListSortingStrategy}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {fields?.map((field) => (
                <SortableCheckboxItem
                  key={field.id}
                  field={field}
                  isChecked={field.isSelected}
                  onChange={(checked) => handleCheckboxChange(field.id, checked)}
                />
              ))}
            </Space>
          </SortableContext>
        </DndContext>
      </Modal>
    </>
  );
};

export default CustomFieldsSettings;