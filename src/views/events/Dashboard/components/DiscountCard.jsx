import React from 'react';
import { Card, List, Typography, Space } from 'antd';

const { Text } = Typography;

const DiscountCard = ({ title, data, formatCurrency }) => {
    return (
        <Card title={title} bordered={false}>
            <Space direction="vertical" className='w-100' size="middle">
                <div>
                    <List
                        dataSource={data}
                        size="small"
                        bordered={false}
                        renderItem={(item) => (
                            <List.Item className="px-0">
                                <div className='w-100 d-flex justify-content-between align-items-center'>
                                    <Text>{item.type}</Text>
                                    <Text strong type="success">
                                        {formatCurrency(item.amount)}
                                    </Text>
                                </div>
                            </List.Item>
                        )}
                    />
                </div>
            </Space>
        </Card>
    );
};

export default DiscountCard;