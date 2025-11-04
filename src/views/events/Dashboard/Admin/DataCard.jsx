import { Avatar, Card, Space, Statistic } from 'antd'
import React from 'react'
import { getBackgroundWithOpacity } from 'views/events/common/CustomUtil'

const DataCard = (props) => {
    const { data, formatter, value } = props

    return (
        <Card bordered={false} title={<span style={{ fontSize: '1rem' }}>{data.title}</span>}>
            <Space direction="horizontal" size="large" className="w-100 d-flex justify-content-between">
                <Statistic
                    value={value % 1 !== 0 ? Number(value).toFixed(2) : value}
                    valueStyle={{ color: '#fff', fontWeight: 'bold', fontSize:'1rem' }}
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