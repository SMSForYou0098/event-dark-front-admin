import React from 'react';
import { Row, Col } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import DataCard from '../Admin/DataCard';

const PaymentStatsCard = ({ title, value, today, icon, color = '#1890ff' }) => {
  // Extract payment method from title (e.g., "Total Cash" -> "Cash")
const paymentMethod = title.replace("Total ", "");
  // console.log(title);
  // Total card data
  const totalCardData = {
    title: title,
    icon: icon || <DollarOutlined />,
    color: color,
  };

  // Today card data
  const todayCardData = {
    title: `Today ${paymentMethod}`,
    icon: icon || <DollarOutlined />,
    color: '#52c41a', // Green color for today stats
  };

  return (
    <Col xs={24} sm={12} lg={6}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <DataCard 
            data={totalCardData} 
            value={value || 0}
            formatter={(val) => `₹${val.toLocaleString('en-IN')}`}
          />
        </Col>

        <Col span={24}>
          <DataCard 
            data={todayCardData} 
            value={today || 0}
            formatter={(val) => `₹${val.toLocaleString('en-IN')}`}
          />
        </Col>
      </Row>
    </Col>
  );
};

export default PaymentStatsCard;