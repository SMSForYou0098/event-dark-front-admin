import React from "react";
import { Button, Row, Col } from "antd";

const MobileScan = () => {
  return (
    <div
      className="d-flex flex-column justify-content-end position-fixed start-0 bottom-0 w-100 m-0 p-0"
      style={{ zIndex: 99 }}
      onClick={() => window.location.reload()}
    >
      <Row className="g-0 m-0">
        <Col span={24} className="p-0">
          <Button
            type="primary"
            block
            className="text-white py-4"
            style={{ borderRadius: 0 }}
          >
            Scan
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default MobileScan;
