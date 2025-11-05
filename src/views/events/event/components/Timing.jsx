// TimingStep.jsx
import React from 'react';
import { Form, DatePicker, TimePicker, Row, Col, Input, Select, Checkbox } from 'antd';
import dayjs from 'dayjs';
import { ROW_GUTTER } from 'constants/ThemeConstant';
 

const { RangePicker } = DatePicker;

// Formats
const FMT_DATE = 'YYYY-MM-DD';
const FMT_DT = 'YYYY-MM-DD HH:mm';
const FMT_T = 'HH:mm';

const TimingStep = ({ form, ...props }) => {
  // helper to build the picker value from stored fields
  const buildRangePickerValue = (dateRangeStr, startTimeStr, endTimeStr) => {
    if (typeof dateRangeStr !== 'string' || !dateRangeStr.includes(',')) return undefined;
    const [d1, d2] = dateRangeStr.split(',').map(s => s.trim());
    const sd = dayjs(d1, FMT_DATE, true);
    const ed = dayjs(d2, FMT_DATE, true);
    if (!sd.isValid() || !ed.isValid()) return undefined;

    const st = (typeof startTimeStr === 'string' && dayjs(startTimeStr, FMT_T, true).isValid())
      ? dayjs(startTimeStr, FMT_T)
      : null;
    const et = (typeof endTimeStr === 'string' && dayjs(endTimeStr, FMT_T, true).isValid())
      ? dayjs(endTimeStr, FMT_T)
      : null;

    // Combine date + (optional) time when showing the picker
    const start = st ? sd.hour(st.hour()).minute(st.minute()) : sd;
    const end = et ? ed.hour(et.hour()).minute(et.minute()) : ed;

    return [start, end];
  };

  const onRangeChange = (range) => {
    if (!Array.isArray(range) || !range[0] || !range[1]) {
      form.setFieldsValue({ date_range: undefined, start_time: undefined, end_time: undefined });
      return;
    }
    const [start, end] = range;
    form.setFieldsValue({
      date_range: `${start.format(FMT_DATE)},${end.format(FMT_DATE)}`,
      start_time: start.format(FMT_T),
      end_time: end.format(FMT_T),
    });
  };

  return (
    <Row gutter={ROW_GUTTER}>
      <Col xs={24} lg={24}>
        <Row gutter={16}>
          {/* date_range -> "YYYY-MM-DD,YYYY-MM-DD" (dates only) + start/end times from RangePicker */}
          <Col xs={24} md={6}>
            <Form.Item
              name="date_range"
              label="Event Date Range"
              rules={[{ required: true, message: 'Please select date range' }]}
              // Show RangePicker using stored dates + start/end_time for the time parts
              getValueProps={(value) => {
                const startTime = form.getFieldValue('start_time');
                const endTime = form.getFieldValue('end_time');
                return { value: buildRangePickerValue(value, startTime, endTime) };
              }}
            >
              <RangePicker
                showTime
                style={{ width: '100%' }}
                placeholder={['Start Date & Time', 'End Date & Time']}
                format={FMT_DT}
                onChange={onRangeChange}
              />
            </Form.Item>
          </Col>

          {/* entry_time -> "HH:mm" */}
          <Col xs={12} md={3}>
            <Form.Item
              name="entry_time"
              label="Entry Time"
              rules={[{ required: true, message: 'Please select entry time' }]}
              getValueProps={(value) => ({
                value:
                  typeof value === 'string' && dayjs(value, FMT_T, true).isValid()
                    ? dayjs(value, FMT_T)
                    : undefined,
              })}
              getValueFromEvent={(val) => (val ? val.format(FMT_T) : undefined)}
            >
              <TimePicker style={{ width: '100%' }} format={FMT_T} placeholder="Entry time" />
            </Form.Item>
          </Col>

          {/* event_type -> "daily" / "seasonal" via Switch */}
          <Col xs={12} md={3}>
            <Form.Item
              name="event_type"
              label="Event Type"
              tooltip="Choose between Daily or Seasonal event"
              rules={[{ required: true, message: "Please choose event type" }]}
              initialValue="daily"
            >
              <Select placeholder="Select event type">
                <Select.Option value="daily">Daily</Select.Option>
                <Select.Option value="seasonal">Seasonal</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Overnight event -> shown only when event_type is 'daily' */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.event_type !== cur.event_type}>
            {({ getFieldValue }) =>
              getFieldValue('event_type') === 'daily' ? (
                <Col xs={12} md={12}>
                  <Form.Item name="overnight_event" valuePropName="checked" label="Overnight Event" tooltip="Check if the daily event runs past midnight" initialValue={false}>
                    <Checkbox>Overnight event — end time will be set to <strong>6 hours after start</strong></Checkbox>
                  </Form.Item>
                </Col>
              ) : null
            }
          </Form.Item>

          {/* start_time -> "HH:mm" (kept in sync with RangePicker) */}
          {/* <Col xs={12} md={6}>
            <Form.Item
              name="start_time"
              label="Start Time"
              rules={[{ required: true, message: 'Please select start time' }]}
              getValueProps={(value) => ({
                value:
                  typeof value === 'string' && dayjs(value, FMT_T, true).isValid()
                    ? dayjs(value, FMT_T)
                    : undefined,
              })}
              getValueFromEvent={(val) => (val ? val.format(FMT_T) : undefined)}
            >
              <TimePicker
                style={{ width: '100%' }}
                format={FMT_T}
                placeholder="Start time"
                onChange={onTimeChange('start_time')}
              />
            </Form.Item>
          </Col> */}

          {/* end_time -> "HH:mm" (kept in sync with RangePicker) */}
          {/* <Col xs={12} md={6}>
            <Form.Item
              name="end_time"
              label="End Time"
              rules={[{ required: true, message: 'Please select end time' }]}
              getValueProps={(value) => ({
                value:
                  typeof value === 'string' && dayjs(value, FMT_T, true).isValid()
                    ? dayjs(value, FMT_T)
                    : undefined,
              })}
              getValueFromEvent={(val) => (val ? val.format(FMT_T) : undefined)}
            >
              <TimePicker
                style={{ width: '100%' }}
                format={FMT_T}
                placeholder="End time"
                onChange={onTimeChange('end_time')}
              />
            </Form.Item>
          </Col> */}

          {/* hidden to force rerender when only time changes */}
          <Form.Item name="start_time" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="end_time" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="__force_rerender__" hidden><input /></Form.Item>
        </Row>
      </Col>
    </Row>
  );
};

export default TimingStep;
