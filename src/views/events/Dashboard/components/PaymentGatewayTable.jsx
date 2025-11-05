import React from 'react';
import { Card, Table } from 'antd';

const PaymentGatewayTable = ({ data, columns }) => {
    return (
        <Card bordered={false}>
            <Table
                dataSource={data}
                columns={columns}
                pagination={false}
                size="small"
                rowKey="gateway"
            />
        </Card>
    );
};

export default PaymentGatewayTable;