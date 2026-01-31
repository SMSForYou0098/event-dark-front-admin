// TimingStep.jsx
import React, { useState } from 'react';
import { Form, DatePicker, TimePicker, Row, Col, Input, Select, Checkbox } from 'antd';
import dayjs from 'dayjs';
import { ROW_GUTTER } from 'constants/ThemeConstant';


const { RangePicker } = DatePicker;

// Formats
const FMT_DATE = 'YYYY-MM-DD';
const FMT_DT = 'YYYY-MM-DD HH:mm';
const FMT_T = 'HH:mm';

const TimingStep = ({ form, ...props }) => {
  // State to track first selected date for overnight range picker
  const [overnightFirstDate, setOvernightFirstDate] = useState(null);
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
      form.setFieldsValue({
        date_range: undefined,
        start_time: undefined,
        end_time: undefined,
        // no_date_range: true // Optional: could auto-check if cleared, but user didn't ask for this explicitly
      });
      return;
    }
    const [start, end] = range;
    form.setFieldsValue({
      date_range: `${start.format(FMT_DATE)},${end.format(FMT_DATE)}`,
      start_time: start.format(FMT_T),
      end_time: end.format(FMT_T),
      tba: false, // Auto-uncheck when date is selected
    });
    // Re-validate entry_time when start_time changes
    setTimeout(() => form.validateFields(['entry_time']), 0);
  };

  return (
    <Row gutter={ROW_GUTTER}>
      <Col xs={24} lg={24}>
        <Row gutter={16}>
          {/* To Be Announced - First field */}
          <Col xs={12} md={3}>
            <Form.Item
              name="tba"
              label="To Be Announced"
              valuePropName="checked"
              initialValue={false}
            >
              <Checkbox>TBA</Checkbox>
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
                <Select.Option value="day">Day</Select.Option>
                <Select.Option value="daily">Daily</Select.Option>
                <Select.Option value="seasonal">Seasonal</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              noStyle
              shouldUpdate={(prev, cur) => prev.tba !== cur.tba || prev.event_type !== cur.event_type || prev.overnight_event !== cur.overnight_event}
            >
              {({ getFieldValue }) => {
                const isTba = getFieldValue('tba');
                const eventType = getFieldValue('event_type');
                const isDayEvent = eventType === 'day';
                const isOvernight = getFieldValue('overnight_event');

                // Disable past dates (and for overnight mode, disable non-consecutive dates)
                const disabledDate = (current) => {
                  // Always disable past dates
                  if (current && current < dayjs().startOf('day')) {
                    return true;
                  }

                  // For overnight day event, disable non-consecutive dates after first date is selected
                  if (isDayEvent && isOvernight && overnightFirstDate) {
                    const nextDay = overnightFirstDate.add(1, 'day');
                    // Only allow the first date and the next consecutive day
                    return !current.isSame(overnightFirstDate, 'day') && !current.isSame(nextDay, 'day');
                  }

                  return false;
                };

                // Handle calendar changes for overnight mode (track first selected date)
                const handleOvernightCalendarChange = (dates) => {
                  if (dates && dates[0] && !dates[1]) {
                    // First date selected, track it to disable other dates
                    setOvernightFirstDate(dates[0]);
                  } else if (!dates || (!dates[0] && !dates[1])) {
                    // Both cleared
                    setOvernightFirstDate(null);
                  }
                };

                // Clear first date state when picker closes
                const handleOvernightOpenChange = (open) => {
                  if (!open) {
                    setOvernightFirstDate(null);
                  }
                };

                // Custom onChange handler for overnight day event
                const handleOvernightRangeChange = (range) => {
                  setOvernightFirstDate(null); // Clear state on complete selection

                  if (!Array.isArray(range) || !range[0] || !range[1]) {
                    form.setFieldsValues({
                      date_range: undefined,
                      start_time: undefined,
                      end_time: undefined,
                    });
                    return;
                  }

                  const [start, end] = range;
                  // Valid consecutive dates (guaranteed by disabledDate)
                  form.setFieldsValue({
                    date_range: `${start.format(FMT_DATE)},${end.format(FMT_DATE)}`,
                    start_time: start.format(FMT_T),
                    end_time: end.format(FMT_T),
                    tba: false,
                  });
                  // Re-validate entry_time when start_time changes
                  setTimeout(() => form.validateFields(['entry_time']), 0);
                };

                return (
                  <Form.Item
                    name="date_range"
                    label={isDayEvent && !isOvernight ? 'Event Date' : 'Event Date Range'}
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                      {
                        required: !isTba,
                        message: isDayEvent && !isOvernight ? 'Please select event date' : 'Please select date range',
                      },
                      {
                        validator: (_, value) => {
                          // For daily and seasonal events, start and end dates must be different
                          if (!value || typeof value !== 'string' || !value.includes(',')) {
                            return Promise.resolve();
                          }

                          const currentEventType = form.getFieldValue('event_type');
                          if (currentEventType === 'daily' || currentEventType === 'seasonal') {
                            const [startDate, endDate] = value.split(',').map(s => s.trim());
                            if (startDate === endDate) {
                              return Promise.reject(
                                new Error(`${currentEventType === 'daily' ? 'Daily' : 'Seasonal'} events must have different start and end dates`)
                              );
                            }
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                    // Show picker using stored dates + start/end_time for the time parts
                    getValueProps={(value) => {
                      if (isDayEvent && !isOvernight) {
                        // For day event without overnight, parse single date from date_range (first part)
                        if (typeof value !== 'string' || !value) return { value: undefined };
                        const dateStr = value.includes(',') ? value.split(',')[0].trim() : value.trim();
                        const startTime = form.getFieldValue('start_time');
                        const d = dayjs(dateStr, FMT_DATE, true);
                        if (!d.isValid()) return { value: undefined };
                        const st = (typeof startTime === 'string' && dayjs(startTime, FMT_T, true).isValid())
                          ? dayjs(startTime, FMT_T)
                          : null;
                        return { value: st ? d.hour(st.hour()).minute(st.minute()) : d };
                      }
                      // For range picker (daily, seasonal, or day with overnight)
                      const startTime = form.getFieldValue('start_time');
                      const endTime = form.getFieldValue('end_time');
                      return { value: buildRangePickerValue(value, startTime, endTime) };
                    }}
                  >
                    {isDayEvent && !isOvernight ? (
                      <DatePicker
                        showTime
                        style={{ width: '100%' }}
                        placeholder="Select Date & Start Time"
                        format={FMT_DT}
                        disabledDate={disabledDate}
                        onChange={(date) => {
                          if (!date) {
                            form.setFieldsValue({
                              date_range: undefined,
                              start_time: undefined,
                            });
                            return;
                          }
                          // For day event, set same date for start and end, only set start_time
                          form.setFieldsValue({
                            date_range: `${date.format(FMT_DATE)},${date.format(FMT_DATE)}`,
                            start_time: date.format(FMT_T),
                            tba: false,
                          });
                          // Re-validate entry_time when start_time changes
                          setTimeout(() => form.validateFields(['entry_time']), 0);
                        }}
                        disabled={isTba}
                      />
                    ) : (
                      <RangePicker
                        showTime
                        style={{ width: '100%' }}
                        placeholder={isDayEvent && isOvernight
                          ? ['Day 1 Start Time', 'Day 2 End Time']
                          : ['Start Date & Time', 'End Date & Time']}
                        format={FMT_DT}
                        disabledDate={disabledDate}
                        onCalendarChange={isDayEvent && isOvernight ? handleOvernightCalendarChange : undefined}
                        onOpenChange={isDayEvent && isOvernight ? handleOvernightOpenChange : undefined}
                        onChange={isDayEvent && isOvernight ? handleOvernightRangeChange : onRangeChange}
                        disabled={isTba}
                      />
                    )}
                  </Form.Item>
                );
              }}
            </Form.Item>
          </Col>

          {/* End Time for Day Events (only show when overnight is NOT checked, because RangePicker includes end time) */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.event_type !== cur.event_type || prev.tba !== cur.tba || prev.overnight_event !== cur.overnight_event}>
            {({ getFieldValue }) => {
              const eventType = getFieldValue('event_type');
              const isTba = getFieldValue('tba');
              const isOvernight = getFieldValue('overnight_event');

              // Show End Time only for day events WITHOUT overnight (RangePicker already has end time when overnight is checked)
              return eventType === 'day' && !isOvernight ? (
                <Col xs={12} md={3}>
                  <Form.Item
                    name="end_time"
                    label="End Time"
                    rules={[
                      {
                        required: !isTba,
                        message: 'Please select end time',
                      },
                    ]}
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
                      disabled={isTba}
                    />
                  </Form.Item>
                </Col>
              ) : null;
            }}
          </Form.Item>

          {/* entry_time -> "HH:mm" */}
          <Col xs={12} md={3}>
            <Form.Item
              noStyle
              shouldUpdate={(prev, cur) => prev.tba !== cur.tba || prev.start_time !== cur.start_time}
            >
              {({ getFieldValue }) => {
                const isTba = getFieldValue('tba');
                const startTime = getFieldValue('start_time');

                return (
                  <Form.Item
                    name="entry_time"
                    label="Entry Time"
                    dependencies={['tba', 'start_time']}
                    rules={[
                      {
                        required: !isTba,
                        message: 'Please select entry time',
                      },
                      {
                        validator: (_, value) => {
                          if (!value || !startTime) {
                            return Promise.resolve();
                          }
                          const entryTimeObj = typeof value === 'string'
                            ? dayjs(value, FMT_T, true)
                            : value;
                          const startTimeObj = dayjs(startTime, FMT_T, true);

                          if (entryTimeObj.isValid() && startTimeObj.isValid()) {
                            if (entryTimeObj.isBefore(startTimeObj) || entryTimeObj.isSame(startTimeObj)) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Entry time must be earlier than or equal to start time'));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
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
                      placeholder="Entry time"
                      disabled={isTba}
                      disabledTime={() => {
                        if (!startTime) return {};

                        const startTimeObj = dayjs(startTime, FMT_T, true);
                        if (!startTimeObj.isValid()) return {};

                        const startHour = startTimeObj.hour();
                        const startMinute = startTimeObj.minute();

                        return {
                          disabledHours: () => {
                            // Disable all hours after start hour
                            const hours = [];
                            for (let i = startHour + 1; i < 24; i++) {
                              hours.push(i);
                            }
                            return hours;
                          },
                          disabledMinutes: (selectedHour) => {
                            // If selected hour equals start hour, disable minutes after start minute
                            if (selectedHour === startHour) {
                              const minutes = [];
                              for (let i = startMinute + 1; i < 60; i++) {
                                minutes.push(i);
                              }
                              return minutes;
                            }
                            return [];
                          },
                        };
                      }}
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>
          </Col>

          {/* Overnight event -> shown when event_type is 'daily' or 'day' */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.event_type !== cur.event_type}>
            {({ getFieldValue }) => {
              const eventType = getFieldValue('event_type');
              return (eventType === 'daily' || eventType === 'day') ? (
                <Col xs={12} md={12}>
                  <Form.Item
                    name="overnight_event"
                    valuePropName="checked"
                    label="Overnight Event"
                    tooltip={eventType === 'day'
                      ? "Check if the event runs past midnight (allows selecting 2 consecutive dates)"
                      : "Check if the daily event runs past midnight"}
                    initialValue={false}
                  >
                    <Checkbox>
                      {eventType === 'day'
                        ? "Overnight event — allows selecting 2 consecutive dates"
                        : "Overnight event — end time will be set after midnight"}
                    </Checkbox>
                  </Form.Item>
                </Col>
              ) : null;
            }}
          </Form.Item>

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
