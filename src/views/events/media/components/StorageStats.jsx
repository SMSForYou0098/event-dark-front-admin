import React from 'react';
import { Card, Progress, Typography, Space } from 'antd';
import { CloudServerOutlined, CloudUploadOutlined, CloudOutlined } from '@ant-design/icons';
import { useStorageStats } from '../hooks/useMedia';

const { Text } = Typography;

const StorageStats = () => {
    // Fetch storage stats
    const { data: stats, isLoading } = useStorageStats();

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
        <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 5 }}>
                <Progress
                    percent={percent}
                    showInfo={true}
                    size="small"
                    style={{ width: 200 }}
                    strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                    }}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20 }}>
                <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Total</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CloudOutlined style={{ color: '#1890ff' }} />
                        <Text strong style={{ fontSize: 13 }}>{totalStr}</Text>
                    </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Used</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CloudUploadOutlined style={{ color: '#faad14' }} />
                        <Text strong style={{ fontSize: 13 }}>{usedStr}</Text>
                    </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Free</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CloudServerOutlined style={{ color: '#52c41a' }} />
                        <Text strong style={{ fontSize: 13 }}>{freeStr}</Text>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StorageStats;
