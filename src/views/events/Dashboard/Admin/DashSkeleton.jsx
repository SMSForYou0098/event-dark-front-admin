import React from 'react'
import { Card, Col, Row, Skeleton, Space } from 'antd'
const DashSkeleton = () => {
    return (
        <div className="p-4">
            <Row gutter={[16, 16]}>
                {[1, 2, 3, 4].map((item) => (
                    <Col xs={24} sm={12} md={12} lg={6} key={item}>
                        <Card bordered={false}>
                            <Space direction="horizontal" size="large" className="w-100 d-flex justify-content-between align-items-center">
                                <div>
                                    <Skeleton.Input
                                        active
                                        size="small"
                                        style={{ width: 80, marginBottom: 8 }}
                                    />
                                    <Skeleton.Input
                                        active
                                        size="large"
                                        style={{ width: 100 }}
                                    />
                                </div>
                                <Skeleton.Avatar
                                    active
                                    size={52}
                                    shape="circle"
                                />
                            </Space>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    )
}

export default DashSkeleton
