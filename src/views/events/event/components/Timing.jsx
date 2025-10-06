// TimingStep.jsx
import React from 'react';
import { Form, DatePicker, TimePicker, Switch, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import LocationStep from './LocationStep';

const { RangePicker } = DatePicker;
const FMT_DT = 'YYYY-MM-DD HH:mm';
const FMT_T = 'HH:mm';

const TimingStep = ({ form, ...props }) => {
  return (
    <Row gutter={ROW_GUTTER}>
      <Col xs={24} lg={12}>
        <Row gutter={16}>
          {/* date_range -> string "YYYY-MM-DD HH:mm,YYYY-MM-DD HH:mm" */}
          <Col xs={24} md={12}>
            <Form.Item
              name="date_range"
              label="Event Date Range"
              rules={[{ required: true, message: 'Please select date range' }]}
              // convert stored string -> picker value
              getValueProps={(value) => {
                if (typeof value !== 'string' || !value.includes(',')) return { value: undefined };
                const [s, e] = value.split(',').map(v => v.trim());
                const sd = dayjs(s, [FMT_DT, 'YYYY-MM-DD'], true);
                const ed = dayjs(e, [FMT_DT, 'YYYY-MM-DD'], true);
                return { value: sd.isValid() && ed.isValid() ? [sd, ed] : undefined };
              }}
              // convert picker value -> stored string
              getValueFromEvent={(range) => {
                if (!Array.isArray(range) || !range[0] || !range[1]) return undefined;
                return `${range[0].format(FMT_DT)},${range[1].format(FMT_DT)}`;
              }}
            >
              <RangePicker
                showTime
                style={{ width: '100%' }}
                placeholder={['Start Date & Time', 'End Date & Time']}
                format={FMT_DT}
              />
            </Form.Item>
          </Col>

          {/* entry_time -> "HH:mm" */}
          <Col xs={12} md={6}>
            <Form.Item
              name="entry_time"
              label="Entry Time"
              rules={[{ required: true, message: 'Please select entry time' }]}
              getValueProps={(value) => ({
                value: typeof value === 'string' && dayjs(value, FMT_T, true).isValid()
                  ? dayjs(value, FMT_T)
                  : undefined,
              })}
              getValueFromEvent={(val) => (val ? val.format(FMT_T) : undefined)}
            >
              <TimePicker style={{ width: '100%' }} format={FMT_T} placeholder="Entry time" />
            </Form.Item>
          </Col>

          {/* event_type -> "daily" / "seasonal" mapped to Switch */}
          <Col xs={12} md={6}>
            <Form.Item
              name="event_type"
              label="Event Type"
              tooltip="Choose between Daily or Seasonal event"
              rules={[{ required: true, message: 'Please choose event type' }]}
              // string -> boolean for Switch checked
              getValueProps={(value) => ({ value: value === 'daily' })}
              // boolean -> string for storage
              getValueFromEvent={(checked) => (checked ? 'daily' : 'seasonal')}
              initialValue="daily"
            >
              <Switch checkedChildren="Daily" unCheckedChildren="Seasonal" />
            </Form.Item>
          </Col>

          {/* start_time -> "HH:mm" */}
          <Col xs={12} md={6}>
            <Form.Item
              name="start_time"
              label="Start Time"
              rules={[{ required: true, message: 'Please select start time' }]}
              getValueProps={(value) => ({
                value: typeof value === 'string' && dayjs(value, FMT_T, true).isValid()
                  ? dayjs(value, FMT_T)
                  : undefined,
              })}
              getValueFromEvent={(val) => (val ? val.format(FMT_T) : undefined)}
            >
              <TimePicker style={{ width: '100%' }} format={FMT_T} placeholder="Start time" />
            </Form.Item>
          </Col>

          {/* end_time -> "HH:mm" */}
          <Col xs={12} md={6}>
            <Form.Item
              name="end_time"
              label="End Time"
              rules={[{ required: true, message: 'Please select end time' }]}
              getValueProps={(value) => ({
                value: typeof value === 'string' && dayjs(value, FMT_T, true).isValid()
                  ? dayjs(value, FMT_T)
                  : undefined,
              })}
              getValueFromEvent={(val) => (val ? val.format(FMT_T) : undefined)}
            >
              <TimePicker style={{ width: '100%' }} format={FMT_T} placeholder="End time" />
            </Form.Item>
          </Col>
        </Row>
      </Col>

      <Col xs={24} lg={12}>
        <LocationStep {...props} />
      </Col>
    </Row>
  );
};

export default TimingStep;
