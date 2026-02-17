import React, { useRef, useEffect } from "react";
import { Card, Form, Input, Select, Switch, Space, Typography, Button, Row, Col } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import QrScanner from "qr-scanner";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import CustomFieldsSettings from "./CustomFieldsSettings";
import DispatchCardSearch from "./DispatchCardSearch";
const { Option } = Select;
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

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
  // eventId,
  setSelectedFields,
  selectedEventsList = [],
  selectedCheckpoints = [],
  setSelectedCheckpoints,
  isCardPrefix,
  setIsCardPrefix,
  onScan,
  dispatchedTokens = []
}) => {
  const videoElementRef = useRef(null);

  // Helper to check if a checkpoint is active based on current time
  const isCheckpointActive = (checkpoint) => {
    if (!checkpoint.start_time || !checkpoint.end_time) return true;

    const format = 'HH:mm:ss';
    const now = dayjs();
    const startTime = dayjs(checkpoint.start_time, format);
    const endTime = dayjs(checkpoint.end_time, format);

    // Handle overnight schedules if needed, but assuming same day for now from previous conversations
    // Making it simple comparison against current day's time
    const current = dayjs(now.format(format), format);

    return current.isBetween(startTime, endTime, null, '[]');
  };

  const handleCheckpointChange = (value, eventId) => {
    setSelectedCheckpoints(prev => {
      const filtered = prev.filter(item => item.event_id !== eventId);
      if (value) {
        return [...filtered, { event_id: eventId, checkpoint_id: value }];
      }
      return filtered;
    });
  };

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
        {/* Header Section */}
        <Row gutter={[16, 16]} align="middle" className="mb-3">
          {/* Left Side - Auto Check and Custom Fields */}
          <Col xs={24} lg={12}>
            <Space wrap>
              <Switch
                checked={autoCheck}
                onChange={setAutoCheck}
              />
              <span>Auto Check</span>

              {/* {categoryData?.categoryData?.attendy_required !== 1 && (
            <CustomFieldsSettings 
              customFieldsData={categoryData?.customFieldsData} 
              setSelectedFields={setSelectedFields} 
              eventId={eventId} 
            />
          )} */}
            </Space>
          </Col>

          {/* Right Side - Checkpoint Selector, Card Prefix, and Scan Type */}
          <Col xs={24} lg={12}>
            <Space wrap className="w-100 justify-content-lg-end">
              {(() => {
                // Collect all events that have checkpoints
                const eventsWithCheckpoints = selectedEventsList?.filter(
                  event => event?.scan_checkpoints?.length > 0
                ) || [];

                if (scanType === 'dispatch') {
                  return (
                    <Space>
                      <Switch
                        checked={isCardPrefix}
                        onChange={setIsCardPrefix}
                      />
                      <span>Card Prefix</span>
                    </Space>
                  );
                }

                if (eventsWithCheckpoints.length === 0) return null;

                // Build the current value - using compound key "eventId_checkpointId"
                const currentValues = selectedCheckpoints.map(
                  cp => `${cp.event_id}_${cp.checkpoint_id}`
                );

                const handleChange = (values, option) => {
                  // Parse all selected values
                  const allSelections = values.map(val => {
                    const [eventId, checkpointId] = val.split('_').map(Number);
                    return { event_id: eventId, checkpoint_id: checkpointId };
                  });

                  // Enforce single selection per event: keep only the latest selection per event
                  const eventMap = new Map();
                  // Process in reverse so the latest selection (last added) wins
                  for (let i = allSelections.length - 1; i >= 0; i--) {
                    const sel = allSelections[i];
                    if (!eventMap.has(sel.event_id)) {
                      eventMap.set(sel.event_id, sel);
                    }
                  }

                  // Convert back to array
                  const uniqueCheckpoints = Array.from(eventMap.values());
                  setSelectedCheckpoints(uniqueCheckpoints);
                };

                return (
                  <Select
                    mode="multiple"
                    value={currentValues}
                    onChange={handleChange}
                    style={{ minWidth: 200, maxWidth: 350 }}
                    placeholder="Select Checkpoints"
                    allowClear
                    maxTagCount={2}
                  >
                    {eventsWithCheckpoints.map(event => (
                      <Select.OptGroup key={event.id} label={event.name}>
                        {event.scan_checkpoints.map(cp => {
                          const isActive = isCheckpointActive(cp);
                          const compoundKey = `${event.id}_${cp.id}`;
                          return (
                            <Option key={compoundKey} value={compoundKey} disabled={!isActive}>
                              {cp.label} ({dayjs(cp.start_time, "HH:mm:ss").format("HH:mm")} - {dayjs(cp.end_time, "HH:mm:ss").format("HH:mm")})
                              {!isActive && <CloseCircleOutlined style={{ color: "red", marginLeft: 5 }} />}
                            </Option>
                          );
                        })}
                      </Select.OptGroup>
                    ))}
                  </Select>
                );
              })()}

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
                  <Option value="dispatch">Dispatch</Option>
                </Select>
              )}
            </Space>
          </Col>
        </Row>

        {/* Scan Input/Video Section */}
        <Row>
          <Col span={24}>
            {scanMode === "manual" ? (
              <>
                {scanType === 'dispatch' && isCardPrefix ? (
                  <DispatchCardSearch
                    events={selectedEventsList.filter(e => e.event_controls?.use_preprinted_cards)}
                    onScan={onScan}
                    dispatchedTokens={dispatchedTokens}
                  />
                ) : (
                  <Form.Item className="mb-0">
                    <Input
                      placeholder="QR Data"
                      value={QRdata}
                      onChange={(e) => setQRData(e.target.value)}
                      maxLength={isCardPrefix ? undefined : 9}
                      autoFocus
                      onPressEnter={() => {
                        // Regular dispatch manual enter (if needed, though this path might be less used now)
                        // or verify mode
                      }}
                      size="large"
                    />
                  </Form.Item>
                )}
              </>
            ) : (
              <video
                ref={videoElementRef}
                style={{ objectFit: "cover", height: "70vh", borderRadius: 10, width: "100%" }}
              />
            )}
          </Col>
        </Row>
      </div>
    </Card>
  );
};

export default TickeScanFeilds;
