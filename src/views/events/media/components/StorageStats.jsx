import React from 'react';
import { Progress, Typography, Space } from 'antd';
import { CloudServerOutlined, CloudUploadOutlined, CloudOutlined } from '@ant-design/icons';
import { useStorageStats } from '../hooks/useMedia';

const { Text } = Typography;

const StorageStats = () => {
    // Fetch storage stats
    const { data: stats } = useStorageStats();

    // Helper to parse size string to bytes (approximate for progress bar)
    const parseSizeToBytes = (sizeStr) => {
        if (!sizeStr || typeof sizeStr !== 'string') return 0;
        const units = { 'B': 1, 'KB': 1024, 'MB': 1024 * 1024, 'GB': 1024 * 1024 * 1024, 'TB': 1024 * 1024 * 1024 * 1024 };
        const match = sizeStr.match(/^([\d.]+)\s*([A-Z]+)$/i);
        if (match) {
            const val = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            return val * (units[unit] || 1);
        }
        return 0;
    };

    // Default values
    const usedStr = stats?.used || '0 B';
    const totalStr = stats?.total || '500 MB';
    const freeStr = stats?.free || '500 MB';

    // Parse to bytes for percentage calculation
    const usedBytes = parseSizeToBytes(usedStr);
    const totalBytes = parseSizeToBytes(totalStr);

    // Calculate percentage
    const percent = totalBytes > 0 ? Math.min(Math.round((usedBytes / totalBytes) * 100), 100) : 0;

    return (
        <>
            <Space direction="vertical" size={4}>
                <Progress
                    percent={percent}
                    showInfo={true}
                    size="small"
                    style={{ width: 300 }}
                    strokeColor={{
                        '0%': 'var(--primary-color)',
                        '100%': 'var(--secondary-color)',
                    }}
                />
                <Space direction="horizontal" size={20}>
                    <Space direction="vertical" size={0} align="center">
                        <Text type="secondary" style={{ fontSize: 12 }}>Total</Text>
                        <Space size={4}>
                            <CloudOutlined style={{ color: 'var(--primary-color)' }} />
                            <Text strong style={{ fontSize: 13 }}>{totalStr}</Text>
                        </Space>
                    </Space>

                    <Space direction="vertical" size={0} align="center">
                        <Text type="secondary" style={{ fontSize: 12 }}>Used</Text>
                        <Space size={4}>
                            <CloudUploadOutlined style={{ color: 'var(--warning-color)' }} />
                            <Text strong style={{ fontSize: 13 }}>{usedStr}</Text>
                        </Space>
                    </Space>

                    <Space direction="vertical" size={0} align="center">
                        <Text type="secondary" style={{ fontSize: 12 }}>Free</Text>
                        <Space size={4}>
                            <CloudServerOutlined style={{ color: 'var(--success-color)' }} />
                            <Text strong style={{ fontSize: 13 }}>{freeStr}</Text>
                        </Space>
                    </Space>
                </Space>
            </Space>

        </>
    );
};

export default StorageStats;
