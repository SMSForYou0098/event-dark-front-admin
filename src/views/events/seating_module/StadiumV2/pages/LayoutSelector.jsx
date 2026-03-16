/**
 * LayoutSelector - Browse and Select Existing Stadium Layouts
 * 
 * Purpose: Allow organizers to view and select pre-created layouts
 * 
 * Features:
 * - Grid view of available layouts
 * - Search and filter layouts
 * - Preview layout before selection
 * - Create new layout option (redirects to LayoutBuilder)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Card, Row, Col, Input, Button, Space, Typography, Tag, 
  Empty, Spin, Modal, Tooltip, Badge, Grid 
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  CheckOutlined,
  PlusOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import StadiumCanvas from '../components/StadiumCanvas';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

// Simulated layouts for development
const SAMPLE_LAYOUTS = [
  {
    id: 'layout-1',
    name: 'Standard Football Stadium',
    description: 'Classic football stadium with 4 main stands',
    capacity: 45000,
    standsCount: 4,
    thumbnail: null,
    createdAt: '2024-01-15',
    stands: [
      { id: 's1', name: 'North Stand', tiers: [{ id: 't1', name: 'Lower', sections: [] }] },
      { id: 's2', name: 'South Stand', tiers: [{ id: 't2', name: 'Lower', sections: [] }] },
    ],
  },
  {
    id: 'layout-2',
    name: 'Cricket Ground',
    description: 'Oval cricket ground with 360° seating',
    capacity: 30000,
    standsCount: 8,
    thumbnail: null,
    createdAt: '2024-02-20',
    stands: [],
  },
  {
    id: 'layout-3',
    name: 'Indoor Arena',
    description: 'Multi-purpose indoor arena',
    capacity: 15000,
    standsCount: 4,
    thumbnail: null,
    createdAt: '2024-03-10',
    stands: [],
  },
];

const LayoutSelector = ({
  onSelect,
  onCreateNew,
  selectedLayoutId,
  title = 'Select Stadium Layout',
  showCreateButton = true,
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // State
  const [searchText, setSearchText] = useState('');
  const [viewType, setViewType] = useState('grid'); // 'grid' | 'list'
  const [previewLayout, setPreviewLayout] = useState(null);

  // Fetch layouts from API
  const { 
    data: layouts = [], 
    isLoading, 
    refetch,
  } = useQuery({
    queryKey: ['stadium-layouts'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      // const response = await api.get('/layouts');
      // return response.data;
      
      // Simulated data for now
      await new Promise(resolve => setTimeout(resolve, 500));
      return SAMPLE_LAYOUTS;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Filter layouts based on search
  const filteredLayouts = useMemo(() => {
    if (!searchText.trim()) return layouts;
    
    const searchLower = searchText.toLowerCase();
    return layouts.filter(layout => 
      layout.name.toLowerCase().includes(searchLower) ||
      layout.description?.toLowerCase().includes(searchLower)
    );
  }, [layouts, searchText]);

  // Handle layout selection
  const handleSelect = useCallback((layout) => {
    if (onSelect) {
      onSelect(layout);
    }
  }, [onSelect]);

  // Render layout card
  const renderLayoutCard = (layout) => {
    const isSelected = selectedLayoutId === layout.id;
    
    return (
      <Col xs={24} sm={12} md={8} lg={6} key={layout.id}>
        <Card
          hoverable
          style={{
            background: isSelected 
              ? 'rgba(24, 144, 255, 0.15)' 
              : 'rgba(255,255,255,0.03)',
            border: isSelected 
              ? '2px solid #1890ff' 
              : '1px solid rgba(255,255,255,0.06)',
            height: '100%',
          }}
          bodyStyle={{ padding: 16 }}
          onClick={() => handleSelect(layout)}
        >
          {/* Preview Thumbnail */}
          <div 
            style={{ 
              height: 120, 
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {layout.stands?.length > 0 ? (
              <StadiumCanvas
                stadium={layout}
                width={150}
                height={100}
                viewLevel="stands"
                interactive={false}
              />
            ) : (
              <Text type="secondary">No preview</Text>
            )}
            
            {/* Selection Badge */}
            {isSelected && (
              <Badge 
                count={<CheckOutlined style={{ color: '#fff' }} />}
                style={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8,
                  background: '#52c41a',
                }}
              />
            )}
          </div>

          {/* Layout Info */}
          <Title level={5} style={{ margin: 0, color: '#fff' }} ellipsis>
            {layout.name}
          </Title>
          
          <Paragraph 
            type="secondary" 
            ellipsis={{ rows: 2 }}
            style={{ marginTop: 4, marginBottom: 8, fontSize: 12 }}
          >
            {layout.description || 'No description'}
          </Paragraph>

          <Space wrap size={4}>
            <Tag>{layout.capacity?.toLocaleString() || 0} seats</Tag>
            <Tag>{layout.standsCount || 0} stands</Tag>
          </Space>

          {/* Actions */}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <Tooltip title="Preview Layout">
              <Button 
                size="small" 
                icon={<EyeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewLayout(layout);
                }}
              />
            </Tooltip>
            <Button 
              type={isSelected ? 'primary' : 'default'}
              size="small"
              style={{ flex: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(layout);
              }}
            >
              {isSelected ? 'Selected' : 'Select'}
            </Button>
          </div>
        </Card>
      </Col>
    );
  };

  // Render list item
  const renderLayoutListItem = (layout) => {
    const isSelected = selectedLayoutId === layout.id;
    
    return (
      <Card
        key={layout.id}
        style={{
          marginBottom: 12,
          background: isSelected 
            ? 'rgba(24, 144, 255, 0.15)' 
            : 'rgba(255,255,255,0.03)',
          border: isSelected 
            ? '2px solid #1890ff' 
            : '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
        }}
        bodyStyle={{ padding: 12 }}
        onClick={() => handleSelect(layout)}
      >
        <Row align="middle" gutter={16}>
          <Col flex="none">
            <div 
              style={{ 
                width: 80, 
                height: 60, 
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {layout.stands?.length > 0 ? (
                <StadiumCanvas
                  stadium={layout}
                  width={70}
                  height={50}
                  viewLevel="stands"
                  interactive={false}
                />
              ) : (
                <Text type="secondary" style={{ fontSize: 10 }}>Preview</Text>
              )}
            </div>
          </Col>
          <Col flex="auto">
            <Title level={5} style={{ margin: 0, color: '#fff' }}>
              {layout.name}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {layout.capacity?.toLocaleString() || 0} seats • {layout.standsCount || 0} stands
            </Text>
          </Col>
          <Col flex="none">
            <Space>
              <Button 
                size="small" 
                icon={<EyeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewLayout(layout);
                }}
              />
              <Button 
                type={isSelected ? 'primary' : 'default'}
                size="small"
              >
                {isSelected ? 'Selected' : 'Select'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" tip="Loading layouts..." />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <Card
        style={{
          marginBottom: 16,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        bodyStyle={{ padding: isMobile ? '12px 16px' : '16px 24px' }}
      >
        <Row justify="space-between" align="middle" gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Title level={4} style={{ margin: 0, color: '#fff' }}>
              {title}
            </Title>
          </Col>
          <Col xs={24} md={16}>
            <Space wrap style={{ width: '100%', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
              <Input
                placeholder="Search layouts..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: isMobile ? '100%' : 200 }}
                allowClear
              />
              <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                Refresh
              </Button>
              {!isMobile && (
                <Button.Group>
                  <Button 
                    icon={<AppstoreOutlined />}
                    type={viewType === 'grid' ? 'primary' : 'default'}
                    onClick={() => setViewType('grid')}
                  />
                  <Button 
                    icon={<UnorderedListOutlined />}
                    type={viewType === 'list' ? 'primary' : 'default'}
                    onClick={() => setViewType('list')}
                  />
                </Button.Group>
              )}
              {showCreateButton && (
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={onCreateNew}
                >
                  Create New
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Layouts Grid/List */}
      {filteredLayouts.length === 0 ? (
        <Card
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Empty
            description={
              <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
                {searchText ? 'No layouts match your search' : 'No layouts available'}
              </Text>
            }
          >
            {showCreateButton && (
              <Button type="primary" icon={<PlusOutlined />} onClick={onCreateNew}>
                Create First Layout
              </Button>
            )}
          </Empty>
        </Card>
      ) : viewType === 'grid' ? (
        <Row gutter={[16, 16]}>
          {filteredLayouts.map(renderLayoutCard)}
        </Row>
      ) : (
        <div>
          {filteredLayouts.map(renderLayoutListItem)}
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        title={previewLayout?.name || 'Layout Preview'}
        open={!!previewLayout}
        onCancel={() => setPreviewLayout(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewLayout(null)}>
            Close
          </Button>,
          <Button 
            key="select" 
            type="primary"
            onClick={() => {
              handleSelect(previewLayout);
              setPreviewLayout(null);
            }}
          >
            Select This Layout
          </Button>,
        ]}
        width={800}
        centered
      >
        {previewLayout && (
          <div style={{ textAlign: 'center' }}>
            <div 
              style={{ 
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                padding: 20,
                marginBottom: 16,
              }}
            >
              {previewLayout.stands?.length > 0 ? (
                <StadiumCanvas
                  stadium={previewLayout}
                  width={500}
                  height={400}
                  viewLevel="stands"
                  interactive={false}
                />
              ) : (
                <Empty description="No stands configured yet" />
              )}
            </div>
            
            <Space size="large">
              <Text>
                <strong>Capacity:</strong> {previewLayout.capacity?.toLocaleString() || 0} seats
              </Text>
              <Text>
                <strong>Stands:</strong> {previewLayout.standsCount || 0}
              </Text>
              <Text>
                <strong>Created:</strong> {previewLayout.createdAt}
              </Text>
            </Space>
            
            {previewLayout.description && (
              <Paragraph style={{ marginTop: 16 }}>
                {previewLayout.description}
              </Paragraph>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LayoutSelector;
