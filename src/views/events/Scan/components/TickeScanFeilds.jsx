import React, { useRef, useEffect } from "react";
import { Card, Form, Input, Select, Switch, Space } from "antd";
import QrScanner from "qr-scanner";
import CustomFieldsSettings from "./CustomFieldsSettings";
const { Option } = Select;

const TickeScanFeilds = ({
  scanMode = "manual",
  QRdata,
  setQRData,
  autoCheck,
  setAutoCheck,
  scanType,
  setScanType,
  categoryData,
  userRole,
  eventId,
  setSelectedFields
}) => {
  const videoElementRef = useRef(null);

  useEffect(() => {
    if (scanMode === "camera" && videoElementRef.current) {
      const qrScanner = new QrScanner(
        videoElementRef.current,
        (result) => {
          if (result?.data) setQRData(result.data);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      qrScanner.start();

      return () => {
        qrScanner.stop();
        qrScanner.destroy();
      };
    }
  }, [scanMode, setQRData]);
  return (
    <Card>
      <div className="d-flex flex-column">
        <div className="d-flex mb-3 justify-content-between align-items-center">
          <Space>
            <Switch
              checked={autoCheck}
              onChange={setAutoCheck}
              className="me-2"
            />
            <span>Auto Check</span>
          </Space>
          <Space>
            {categoryData?.categoryData?.attendy_required === 1 &&
              <CustomFieldsSettings customFieldsData={categoryData?.customFieldsData} setSelectedFields={setSelectedFields} eventId={eventId} />
            }
            {userRole === "Admin" && (
              <Select
                value={scanType}
                onChange={setScanType}
                style={{ width: 180 }}
                placeholder="Select Scan Type"
              >
                <Option value="">Select Type</Option>
                <Option value="verify">Verify Ticket</Option>
                <Option value="shopkeeper">Shopkeeper Mode</Option>
              </Select>
            )}
          </Space>
        </div>

        {scanMode === "manual" ? (
          <Form.Item>
            <Input
              placeholder="QR Data"
              value={QRdata}
              onChange={(e) => setQRData(e.target.value)}
              maxLength={9}
              autoFocus
            />
          </Form.Item>
        ) : (
          <video
            ref={videoElementRef}
            style={{ objectFit: "cover", height: "70vh", borderRadius: 10 }}
          />
        )}
      </div>
    </Card>
  );
};

export default TickeScanFeilds;
