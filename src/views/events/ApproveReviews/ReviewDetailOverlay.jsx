import React from 'react';
import { Modal, Drawer, Grid, Button, Rate, Tag, Space, Descriptions, Typography } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { useBreakpoint } = Grid;
const { Paragraph } = Typography;

const ReviewDetailOverlay = ({ open, onClose, review, onApprove, onReject, loading }) => {
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    if (!review) return null;

    const reviewContent = (
        <div>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="User">
                    {review?.user?.name || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Rating">
                    <Rate disabled value={review?.rating} />
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                    <Tag color={review?.is_approved ? 'green' : 'orange'}>
                        {review?.is_approved ? 'Approved' : 'Pending'}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Submitted">
                    {review?.created_at ? dayjs(review.created_at).format('DD MMM YYYY, hh:mm A') : 'N/A'}
                </Descriptions.Item>
            </Descriptions>

            <div style={{
                backgroundColor: '#1a1a2e',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #2a2a3e',
                marginBottom: 20
            }}>
                <Paragraph style={{
                    color: '#e0e0e0',
                    fontSize: '14px',
                    marginBottom: 0,
                    whiteSpace: 'pre-wrap'
                }}>
                    {review?.review || 'No review text provided.'}
                </Paragraph>
            </div>

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <>
                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => onApprove(review.id)}
                        loading={loading}
                    >
                        Approve
                    </Button>
                    <Button
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => onReject(review.id)}
                        loading={loading}
                    >
                        Reject
                    </Button>
                </>
                <Button onClick={onClose}>Close</Button>
            </Space>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer
                title="Review Details"
                placement="bottom"
                open={open}
                onClose={onClose}
                height="75vh"
                styles={{ body: { paddingBottom: 80 } }}
            >
                {reviewContent}
            </Drawer>
        );
    }

    return (
        <Modal
            title="Review Details"
            open={open}
            onCancel={onClose}
            footer={null}
            width={600}
            centered
        >
            {reviewContent}
        </Modal>
    );
};

export default ReviewDetailOverlay;
