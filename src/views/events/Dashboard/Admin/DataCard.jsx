import { Avatar, Card, Space, Statistic } from 'antd'
import React from 'react'

const DataCard = (props) => {
    const { data, formatter } = props
    return (
        <Card bordered={false} title={data.title}>
            <Space direction="horizontal" size="large" className="w-100 d-flex justify-content-between">
                <Statistic
                    value={16}
                    valueStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={formatter || ''}
                />
                <Avatar
                    size={52}
                    icon={data.icon}
                    style={{ color: data.color }}
                    className="bg-transparent"
                />
            </Space>
        </Card>
    )
}

export default DataCard
