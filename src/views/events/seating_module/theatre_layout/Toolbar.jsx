import React, { useState } from 'react';
import { Button, Select, Space, Card } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SaveOutlined,
  AppstoreAddOutlined,
  HomeOutlined
} from '@ant-design/icons';

const { Option } = Select;

const Toolbar = ({ 
  onAddSection, 
  onAddHall,
  onDeleteHall,
  onSave,
  halls = [],
  currentHallIndex = 0,
  onHallChange,
  canDeleteHall = true
}) => {
  const [sectionType, setSectionType] = useState('rect');
  const [sectionLevel, setSectionLevel] = useState('main');

  return (
    <Card
      size="small"
      className="m-0"
      style={{
        backgroundColor: 'var(--component-bg)',
        borderColor: 'var(--border-secondary)',
        borderRadius: 0,
        borderLeft: 0,
        borderRight: 0,
        borderTop: 0,
      }}
      bodyStyle={{
        padding: '12px 16px'
      }}
    >
      <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: '1rem' }}>
        {/* Hall Selection and Management */}
        <Space size="middle" wrap>
          <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
            <span className="text-white font-weight-medium" style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
              Current Hall:
            </span>
            <Select
              size="large"
              style={{ minWidth: '180px' }}
              value={currentHallIndex}
              onChange={(value) => onHallChange(value)}
              className="custom-select"
            >
              {halls.map((hall, index) => (
                <Option key={hall.hallId} value={index}>
                  <HomeOutlined className="me-2" />
                  {hall.hallName}
                </Option>
              ))}
            </Select>
          </div>
          
          <Button 
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={onAddHall}
            className="bg-success border-0 font-weight-semibold"
            style={{
              backgroundColor: 'var(--success-color)',
              borderRadius: 6,
            }}
          >
            Add Hall
          </Button>
          
          <Button 
            danger
            size="large"
            icon={<DeleteOutlined />}
            onClick={onDeleteHall}
            disabled={!canDeleteHall}
            className="font-weight-semibold"
            style={{
              borderRadius: 6,
            }}
          >
            Delete Hall
          </Button>
        </Space>

        {/* Section Creation Controls */}
        <Space size="middle" wrap>
          <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
            <span className="text-white font-weight-medium" style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
              Section Type:
            </span>
            <Select 
              size="large"
              style={{ minWidth: '160px' }}
              value={sectionType} 
              onChange={(value) => setSectionType(value)}
              className="custom-select"
            >
              <Option value="rect">
                <i className="bi bi-grid-3x3 me-2"></i>
                Standard Seats
              </Option>
              <Option value="circle">
                <i className="bi bi-circle me-2"></i>
                Premium Seats
              </Option>
              <Option value="polygon">
                <i className="bi bi-pentagon me-2"></i>
                Box Seats
              </Option>
              <Option value="wheelchair">
                <i className="bi bi-person-wheelchair me-2"></i>
                Wheelchair
              </Option>
            </Select>
          </div>
          
          <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
            <span className="text-white font-weight-medium" style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
              Level:
            </span>
            <Select 
              size="large"
              style={{ minWidth: '160px' }}
              value={sectionLevel} 
              onChange={(value) => setSectionLevel(value)}
              className="custom-select"
            >
              <Option value="main">
                <i className="bi bi-building me-2"></i>
                Main Floor
              </Option>
              <Option value="balcony-1">
                <i className="bi bi-arrow-up-circle me-2"></i>
                Balcony Level 1
              </Option>
              <Option value="balcony-2">
                <i className="bi bi-arrow-up-circle-fill me-2"></i>
                Balcony Level 2
              </Option>
              <Option value="boxes">
                <i className="bi bi-square me-2"></i>
                Boxes
              </Option>
            </Select>
          </div>
          
          <Button 
            type="primary"
            size="large"
            icon={<AppstoreAddOutlined />}
            onClick={() => onAddSection(sectionType === 'wheelchair' ? 'rect' : sectionType)}
            className="bg-primary border-0 font-weight-semibold"
            style={{
              borderRadius: 6,
            }}
          >
            Add Section
          </Button>
        </Space>

        {/* Action Buttons */}
        <Space size="middle" wrap className="ms-auto">
          <Button 
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            onClick={onSave}
            className="bg-success border-0 font-weight-semibold"
            style={{
              backgroundColor: 'var(--success-color)',
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(52, 168, 83, 0.3)',
            }}
          >
            Save Layout
          </Button>
        </Space>
      </div>
    </Card>
  );
};

export default Toolbar;