import { Avatar, Card, Space, Statistic } from 'antd'
import React from 'react'

const DataCard = (props) => {
    const { data, formatter } = props

    // Function to convert hex/rgb color to rgba with opacity
    const getBackgroundWithOpacity = (color, opacity = 0.1) => {
        // If color is already in rgb/rgba format
        if (color?.startsWith('rgb')) {
            return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`)
        }
        // If color is in hex format
        if (color?.startsWith('#')) {
            const hex = color.replace('#', '')
            const r = parseInt(hex.substring(0, 2), 16)
            const g = parseInt(hex.substring(2, 4), 16)
            const b = parseInt(hex.substring(4, 6), 16)
            return `rgba(${r}, ${g}, ${b}, ${opacity})`
        }
        // Fallback
        return color
    }
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