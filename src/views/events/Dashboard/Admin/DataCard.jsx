import { Avatar, Card, Space, Statistic } from 'antd'
import React from 'react'
import { getBackgroundWithOpacity } from 'views/events/common/CustomUtil'

const DataCard = (props) => {
    const { data, formatter } = props

    // Function to convert hex/rgb color to rgba with opacity

    return (
        <Card bordered={false} title={data.title}>
            <Space direction="horizontal" size="large" className="w-100 d-flex justify-content-between">
                <Statistic
                    value={16}
                    valueStyle={{ color: '#fff', fontWeight: 'bold' }}
                     formatter={formatter || ''}
                />
                {data.icon &&
                    <Avatar
                        size={52}
                        icon={data.icon}
                        style={{
                            color: data.color,
                            backgroundColor: getBackgroundWithOpacity(data.color, 0.15)
                        }}
                    />
                }
            </Space>
        </Card>
    )
}

export default DataCard