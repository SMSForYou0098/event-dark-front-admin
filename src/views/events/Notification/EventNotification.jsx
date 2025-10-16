import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Form,
  Button,
  Select,
  Radio,
  Alert,
  Spin,
  message,
} from "antd";
import axios from "axios";
import { useMyContext } from "Context/MyContextProvider";

const { Option } = Select;

const EventNotification = () => {
  const { api, authToken } = useMyContext();

  const [show, setShow] = useState(false);
  const [eventDay, setEventDay] = useState("today");
  const [notificationType, setNotificationType] = useState("both");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [fetchingEvents, setFetchingEvents] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [alertMessage, setAlertMessage] = useState(null);

  const handleClose = () => {
    setShow(false);
    setEventDay("today");
    setNotificationType("both");
    setSelectedEventIds([]);
    setFormErrors({});
    setAlertMessage(null);
  };

  const fetchEvents = useCallback(async () => {
    try {
      setFetchingEvents(true);
      const response = await axios.get(`${api}events-days/${eventDay}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data.status && response.data.data) {
        setEvents(response.data.data);
        setSelectedEventIds([]);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    } finally {
      setFetchingEvents(false);
    }
  }, [api, authToken, eventDay]);

  useEffect(() => {
    if (show) {
      fetchEvents();
    }
  }, [show, fetchEvents]);

  const validateForm = () => {
    const errors = {};
    if (selectedEventIds.length === 0) {
      errors.events = "Please select at least one event";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const payload = {
        eventDay,
        notificationType,
        event_ids: selectedEventIds,
      };

      const response = await axios.post(`${api}send-notifications`, payload, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data.status) {
        message.success("Notification sent successfully!");
        handleClose();
      } else {
        setAlertMessage("Failed to send notification. Please try again.");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      setAlertMessage("Failed to send notification. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button type="primary" onClick={() => setShow(true)}>
        Event Notification
      </Button>

      <Modal
        title="Event Notification"
        open={show}
        onCancel={handleClose}
        footer={null}
        destroyOnClose
      >
        {alertMessage && (
          <Alert
            type="error"
            message={alertMessage}
            closable
            onClose={() => setAlertMessage(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form layout="vertical">
          <Form.Item label="Select Event Day">
            <Select
              value={eventDay}
              onChange={(value) => {
                setEventDay(value);
                setSelectedEventIds([]);
              }}
              style={{ width: "100%" }}
            >
              <Option value="today">Today</Option>
              <Option value="tomorrow">Tomorrow</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Select Events"
            validateStatus={formErrors.events ? "error" : ""}
            help={formErrors.events}
          >
            {fetchingEvents ? (
              <Spin />
            ) : (
              <Select
                mode="multiple"
                placeholder={events.length > 0 ? "Select events..." : "No events found"}
                value={selectedEventIds}
                onChange={(values) => {
                  setSelectedEventIds(values);
                  if (values.length > 0) {
                    setFormErrors((prev) => ({ ...prev, events: null }));
                  }
                }}
                disabled={events.length === 0}
                style={{ width: "100%" }}
              >
                {events.map((event) => (
                  <Option key={event.id} value={event.id}>
                    {event.name || event.title}
                  </Option>
                ))}
              </Select>
            )}
          </Form.Item>

          <Form.Item label="Notification Method">
            <Radio.Group
              onChange={(e) => setNotificationType(e.target.value)}
              value={notificationType}
            >
              <Radio value="whatsapp">WhatsApp</Radio>
              <Radio value="sms">SMS</Radio>
              <Radio value="both">Both</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={handleClose}>Cancel</Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                disabled={selectedEventIds.length === 0}
              >
                Send Notification
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EventNotification;
