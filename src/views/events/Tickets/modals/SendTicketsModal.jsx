import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Input, Radio, Alert } from "antd";
import { hasEventStarted, getEventFromBooking } from "../../utils/eventUtils";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useMyContext } from "Context/MyContextProvider";

const SendTicketsModal = ({ show, handleClose, bookingData }) => {
  const { api, authToken, cancelToken } = useMyContext();
  const [step, setStep] = useState(1);
  const [form] = Form.useForm();
  const [ticketSelection, setTicketSelection] = useState("all");
  const [sendMethod, setSendMethod] = useState("both");
  const [ticketCount, setTicketCount] = useState(1);
  const [checkingUser, setCheckingUser] = useState(false);
  const [recipientData, setRecipientData] = useState({
    name: "",
    email: "",
    number: "",
  });
  const [isEventStarted, setIsEventStarted] = useState(false);
  const [isExist, setIsExist] = useState(false);
  const hasMultipleTickets = bookingData?.bookings?.length > 1;
  const totalTickets = bookingData?.bookings?.length || 1;

  useEffect(() => {
    if (bookingData) {
      const event = getEventFromBooking(bookingData);
      if (event) {
        setIsEventStarted(hasEventStarted(event));
      }
    }
  }, [bookingData]);

  const HandleCheckUser = async (number) => {
    setCheckingUser(true);
    try {
      const url = `${api}user-form-number/${number}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        cancelToken: cancelToken,
      });

      setIsExist(response.data.status);
      if (response.data.status) {
        const user = response.data.user;
        setRecipientData((prev) => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
        }));
        form.setFieldsValue({
          name: user.name || "",
          email: user.email || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    } finally {
      setCheckingUser(false);
    }
  };

  useEffect(() => {
    const { number } = recipientData;
    if (number && (number?.length === 10 || number?.length === 12)) {
      HandleCheckUser(number);
    } else {
      setRecipientData((prev) => ({
        ...prev,
        name: "",
        email: "",
      }));
      form.setFieldsValue({
        name: "",
        email: "",
      });
    }
  }, [recipientData?.number]);

  const handleTicketSelectionChange = (e) => {
    setTicketSelection(e.target.value);
  };

  const handleSendMethodChange = (e) => {
    setSendMethod(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRecipientData((prev) => ({
      ...prev,
      [name]: value,
    }));
    form.setFieldsValue({ [name]: value });
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (values) => {
    // Prepare API payload
    const payload = {
      bookingId: bookingData?.id,
      eventId:
        bookingData?.ticket?.event?.id ||
        bookingData?.bookings?.[0]?.ticket?.event?.id,
      eventName:
        bookingData?.ticket?.event?.name ||
        bookingData?.bookings?.[0]?.ticket?.event?.name,
      ticketSelectionType: hasMultipleTickets ? ticketSelection : "all",
      ticketQuantity:
        hasMultipleTickets && ticketSelection === "individual"
          ? ticketCount
          : totalTickets,
      type: hasMultipleTickets ? "master" : "single",
      table: bookingData?.type,
      deliveryMethod: sendMethod,
      recipient: {
        ...recipientData,
        ...values,
      },
    };

    // Make API call
    console.log("Sending tickets API payload:", payload);

    // Simulate success
    setTimeout(() => {
      console.log("Tickets sent successfully");
      resetModal();
      handleClose();
    }, 1000);
  };

  const resetModal = () => {
    setStep(1);
    setTicketSelection("all");
    setSendMethod("whatsapp");
    setTicketCount(1);
    setRecipientData({
      name: "",
      email: "",
      number: "",
    });
    form.resetFields();
    setIsExist(false);
    setCheckingUser(false);
  };

  useEffect(() => {
    if (!show) {
      resetModal();
    }
  }, [show]);

  return (
    <Modal
      open={show}
      onCancel={handleClose}
      centered
      footer={null}
      title={
        <div>
          Send Tickets
          {bookingData && (
            <div style={{ fontSize: "0.8rem", color: "#888" }}>
              {bookingData?.ticket?.event?.name ||
                bookingData?.bookings?.[0]?.ticket?.event?.name}
            </div>
          )}
        </div>
      }
    >
      {isEventStarted && (
        <Alert
          message="This event has already started"
          description="The ticket delivery service is only available before the event begins. Please use alternative methods to share access with your guests."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {!isEventStarted && step === 1 ? (
        <Form layout="vertical">
          {hasMultipleTickets && (
            <Form.Item label="Select Tickets">
              <Radio.Group
                value={ticketSelection}
                onChange={handleTicketSelectionChange}
                style={{ marginBottom: 8 }}
              >
                <Radio value="all">All Tickets</Radio>
                <Radio value="individual">Individual Tickets</Radio>
              </Radio.Group>
              {ticketSelection === "individual" && (
                <Form.Item
                  label="Number of Tickets to Send"
                  style={{ marginTop: 8 }}
                >
                  <Input
                    type="number"
                    min={1}
                    max={totalTickets}
                    value={ticketCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      const limitedValue = Math.min(value, totalTickets);
                      setTicketCount(limitedValue);
                    }}
                  />
                  <div style={{ color: "#888", fontSize: 12 }}>
                    Maximum: {totalTickets} tickets
                  </div>
                </Form.Item>
              )}
            </Form.Item>
          )}

          <Form.Item label="Send Tickets via">
            <Radio.Group
              value={sendMethod}
              onChange={handleSendMethodChange}
              style={{ marginBottom: 8 }}
            >
              <Radio value="whatsapp">WhatsApp</Radio>
              <Radio value="sms">SMS</Radio>
              <Radio value="both">Both</Radio>
            </Radio.Group>
          </Form.Item>
          <div style={{ textAlign: "right" }}>
            <Button style={{ marginRight: 8 }} onClick={handleClose}>
              Cancel
            </Button>
            <Button type="primary" onClick={handleNext}>
              Next
            </Button>
          </div>
        </Form>
      ) : (
        !isEventStarted && (
          <Form
            layout="vertical"
            form={form}
            onFinish={handleSubmit}
            initialValues={recipientData}
          >
            <Form.Item
              label="Phone Number"
              name="number"
              rules={[
                {
                  required: true,
                  message: "Please provide a valid 10 or 12 digit phone number.",
                  pattern: /^(\d{10}|\d{12})$/,
                },
              ]}
            >
              <Input
                name="number"
                value={recipientData.number}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </Form.Item>
            <div
              style={{
                color: "#1677ff",
                fontSize: 12,
                marginBottom: 8,
              }}
            >
              Please enter mobile number to check existing user details
            </div>
            {checkingUser && (
              <div
                style={{
                  color: "#1677ff",
                  fontSize: 12,
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Loader2 size={16} className="animate-spin" />
                Checking user details...
              </div>
            )}
            {!checkingUser &&
              recipientData?.number &&
              (recipientData.number?.length === 10 ||
                recipientData.number?.length === 12) && (
                <>
                  <Form.Item
                    label="Recipient Name"
                    name="name"
                    rules={[
                      { required: true, message: "Please provide a name." },
                    ]}
                  >
                    <Input
                      name="name"
                      value={recipientData.name}
                      disabled={isExist}
                      onChange={handleInputChange}
                      placeholder="Enter recipient name"
                    />
                  </Form.Item>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      {
                        required: true,
                        message: "Please provide a valid email address.",
                      },
                      { type: "email", message: "Please provide a valid email address." },
                    ]}
                  >
                    <Input
                      name="email"
                      value={recipientData.email}
                      disabled={isExist}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                    />
                  </Form.Item>
                </>
              )}
            <div style={{ textAlign: "right" }}>
              <Button style={{ marginRight: 8 }} onClick={handleBack}>
                Back
              </Button>
              <Button type="primary" htmlType="submit">
                Send Tickets
              </Button>
            </div>
          </Form>
        )
      )}
    </Modal>
  );
};

export default SendTicketsModal;
