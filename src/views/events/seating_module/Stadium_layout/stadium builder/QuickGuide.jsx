import React, { useState } from 'react';
import { Card, Steps, Button, Space, Typography, Tag, Collapse } from 'antd';
import {
  InfoCircleOutlined,
  HomeOutlined,
  AppstoreOutlined,
  LayoutOutlined,
  MenuOutlined,
  TagsOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * QuickGuide - Interactive guide for stadium configuration
 * Helps users understand the workflow
 */
const QuickGuide = ({ isMobile }) => {
  const [current, setCurrent] = useState(0);

  const steps = [
    {
      title: 'Select Event & Ticket',
      icon: <InfoCircleOutlined />,
      description: (
        <Space direction="vertical" size={12}>
          <Text>First, choose the event and ticket type you want to configure:</Text>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li>Select an event from the dropdown</li>
            <li>Choose a ticket type (e.g., Premium, VIP)</li>
            <li>Wait for the green ✓ success banner</li>
          </ul>
          <Tag color="blue">Tip: The price auto-fills from the ticket type!</Tag>
        </Space>
      ),
    },
    {
      title: 'Build Stadium Structure',
      icon: <HomeOutlined />,
      description: (
        <Space direction="vertical" size={12}>
          <Text>Create your stadium hierarchy:</Text>
          <Steps
            direction="vertical"
            size="small"
            current={-1}
            items={[
              {
                title: 'Add Stands',
                description: 'Click "+ Add Stand" (e.g., North Stand, South Stand)',
                icon: <HomeOutlined />,
              },
              {
                title: 'Add Tiers',
                description: 'Click ⚙️ to manage tiers (e.g., Lower, Upper)',
                icon: <AppstoreOutlined />,
              },
              {
                title: 'Add Sections',
                description: 'Divide tiers into sections (e.g., Section A, B, C)',
                icon: <LayoutOutlined />,
              },
              {
                title: 'Add Rows',
                description: 'Configure seat rows (e.g., Row 1, Row 2)',
                icon: <MenuOutlined />,
              },
            ]}
          />
        </Space>
      ),
    },
    {
      title: 'Assign Tickets',
      icon: <TagsOutlined />,
      description: (
        <Space direction="vertical" size={12}>
          <Text>Use the 🏷️ button to assign tickets at any level:</Text>
          <Card size="small" style={{ marginTop: 8, backgroundColor: 'rgba(82, 196, 26, 0.1)' }}>
            <Space direction="vertical" size={8}>
              <Text strong>Stand Level:</Text>
              <Text type="secondary">Applies to entire stand (all tiers, sections, rows)</Text>
              
              <Text strong style={{ marginTop: 8 }}>Tier Level:</Text>
              <Text type="secondary">Applies to all sections and rows in that tier</Text>
              
              <Text strong style={{ marginTop: 8 }}>Section Level:</Text>
              <Text type="secondary">Applies to all rows in that section</Text>
              
              <Text strong style={{ marginTop: 8 }}>Row Level:</Text>
              <Text type="secondary">Applies to all seats in that row</Text>
            </Space>
          </Card>
          <Tag color="orange">
            Pro Tip: Use "Override Children" to apply tickets to all sub-levels!
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Save & Publish',
      icon: <CheckCircleOutlined />,
      description: (
        <Space direction="vertical" size={12}>
          <Text>Review and save your stadium configuration:</Text>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li>Check the Total Capacity badge at the top</li>
            <li>Verify all stands, tiers, and sections are configured</li>
            <li>Click "Create Stadium" or "Update Stadium"</li>
          </ul>
          <Card size="small" style={{ marginTop: 8, backgroundColor: 'rgba(24, 144, 255, 0.1)' }}>
            <Text strong>✨ Your stadium is now ready for bookings!</Text>
          </Card>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />
          <Title level={5} style={{ margin: 0 }}>Quick Start Guide</Title>
        </Space>
      }
      size="small"
      style={{
        marginBottom: 16,
        borderRadius: 12,
        borderColor: '#1890ff',
      }}
    >
      <Collapse
        ghost
        expandIconPosition="end"
        style={{ backgroundColor: 'transparent' }}
      >
        <Panel header={<Text strong>📖 How to configure your stadium (4 steps)</Text>} key="1">
          <Steps
            direction="vertical"
            current={current}
            onChange={setCurrent}
            items={steps.map((step, index) => ({
              ...step,
              description: current === index ? step.description : null,
              status: current === index ? 'process' : current > index ? 'finish' : 'wait',
            }))}
            style={{ marginTop: 16 }}
          />

          <Space style={{ marginTop: 16, width: '100%', justifyContent: 'space-between' }}>
            <Button
              size="small"
              disabled={current === 0}
              onClick={() => setCurrent(current - 1)}
            >
              Previous
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Step {current + 1} of {steps.length}
            </Text>
            <Button
              size="small"
              type="primary"
              disabled={current === steps.length - 1}
              onClick={() => setCurrent(current + 1)}
            >
              Next
            </Button>
          </Space>
        </Panel>
      </Collapse>

      {/* FAQ Section */}
      <Collapse
        ghost
        expandIconPosition="end"
        style={{ backgroundColor: 'transparent', marginTop: 12 }}
      >
        <Panel header={<Text strong>💡 Frequently Asked Questions</Text>} key="faq">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div>
              <Text strong>Q: Do I need to enter prices manually?</Text>
              <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
                No! Prices auto-fill from the selected ticket type. You can override them if needed.
              </Paragraph>
            </div>

            <div>
              <Text strong>Q: What's "Visual Weight"?</Text>
              <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
                Controls the size of stands in the SVG layout. Use 1.5-2 for larger stands, 0.8-1 for smaller ones.
              </Paragraph>
            </div>

            <div>
              <Text strong>Q: Can I assign different tickets to different sections?</Text>
              <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
                Yes! Assign at the section level, or even individual row level for granular control.
              </Paragraph>
            </div>

            <div>
              <Text strong>Q: Why are the 🏷️ buttons disabled?</Text>
              <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
                You need to select both an Event and a Ticket Type first (see Step 1).
              </Paragraph>
            </div>
          </Space>
        </Panel>
      </Collapse>
    </Card>
  );
};

export default QuickGuide;

