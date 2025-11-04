// TimingStep.jsx

/// conditions added for daily event in timing and date range
import React from 'react';
import { Form, DatePicker, TimePicker, Row, Col, Input, Select } from 'antd';
import dayjs from 'dayjs';
import { ROW_GUTTER } from 'constants/ThemeConstant';
// import LocationStep from './LocationStep';

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

  // Track first picked date to constrain to consecutive days when event_type is daily
  const [firstPickedDate, setFirstPickedDate] = React.useState(null);

  const disabledDate = (current) => {
    if (!current) return false;
    const today = dayjs().startOf('day');
    // Always disable past dates
    if (current.startOf('day').isBefore(today)) return true;

    const type = form.getFieldValue('event_type') || 'daily';
    if (type === 'daily' && firstPickedDate) {
      const anchor = dayjs(firstPickedDate).startOf('day');
      const cur = current.startOf('day');
      // Only allow the anchor day and the next consecutive day
      const isAnchor = cur.isSame(anchor);
      const isNextDay = cur.isSame(anchor.add(1, 'day'));
      return !(isAnchor || isNextDay);
    }
    return false;
  };

  const onCalendarChange = (dates) => {
    if (!dates || (!dates[0] && !dates[1])) {
      setFirstPickedDate(null);
      return;
    }
    const [start, end] = dates;
    if (start && !end) {
      setFirstPickedDate(start);
    } else if (start && end) {
      // Selection completed; reset anchor
      setFirstPickedDate(null);
    }
  };

  // For daily type: if end date is the second consecutive day, allow time only up to 06:00
  const disabledTime = (date, type) => {
    const eventType = form.getFieldValue('event_type') || 'daily';
    if (eventType !== 'daily') return {};
    if (type !== 'end' || !date) return {};

    // Determine the anchor (start) day
    let anchor = firstPickedDate;
    if (!anchor) {
      const dr = form.getFieldValue('date_range');
      if (typeof dr === 'string' && dr.includes(',')) {
        const [d1] = dr.split(',').map(s => s.trim());
        const sd = dayjs(d1, FMT_DATE, true);
        if (sd.isValid()) anchor = sd;
      }
    }

    if (!anchor) return {};

    const isSecondDay = date.startOf('day').isSame(dayjs(anchor).startOf('day').add(1, 'day'));
    if (!isSecondDay) return {};

    const allHours = Array.from({ length: 24 }, (_, h) => h);
    const allMinutes = Array.from({ length: 60 }, (_, m) => m);

    return {
      disabledHours: () => allHours.filter(h => h > 6),
      disabledMinutes: (hour) => (hour === 6 ? allMinutes.filter(m => m > 0) : []),
    };
  };

  return (
    <Row gutter={ROW_GUTTER}>
      <Col xs={24} lg={12}>
        <Row gutter={16}>
          {/* date_range -> "YYYY-MM-DD,YYYY-MM-DD" (dates only) + start/end times from RangePicker */}
          <Col xs={24} md={12}>
            <Form.Item
              name="date_range"
              label="Event Date Range"
              rules={[{ required: true, message: 'Please select date range' }]}
              dependencies={['event_type']}
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
                onCalendarChange={onCalendarChange}
                disabledDate={disabledDate}
                disabledTime={disabledTime}
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
          <Col xs={12} md={6}>
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
