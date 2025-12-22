import { useState, useEffect, useCallback } from "react";
import { Modal, Button, Form, Input, Radio, Space, Typography } from "antd";
import { useMyContext } from "../../../../Context/MyContextProvider";
import axios from "axios";

const { Text } = Typography;

const POSAttendeeModal = (props) => {
  const {
    show,
    handleClose,
    disabled,
    setName,
    name,
    setNumber,
    handleSubmit,
    setMethod,
    userRole,
    number
  } = props;

  const { api, authToken } = useMyContext();
  const [form] = Form.useForm();
  const [error, setError] = useState("");
  const [showNameField, setShowNameField] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // Fetch user details when phone number is valid
  const fetchUserDetails = useCallback(async () => {
    if ((number?.length === 10 || number?.length === 12) && /^\d+$/.test(number)) {
      setIsLoadingUser(true);
      setError("");

      try {
        const response = await axios.get(`${api}pos/ex-user/${number}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.data.status) {
          const userData = response.data.data;
          setName(userData.name || "");
          form.setFieldsValue({ name: userData.name || "" });
          setShowNameField(true);
        } else {
          // User not found, show name field for manual entry
          setName("");
          form.setFieldsValue({ name: "" });
          setShowNameField(true);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        if (error.response && error.response.status === 404) {
          // User not found, show name field for manual entry
          setName("");
          form.setFieldsValue({ name: "" });
        } else {
          setError("Failed to fetch user details. Please try again.");
        }
        setShowNameField(true);
      } finally {
        setIsLoadingUser(false);
      }
    } else {
      setShowNameField(false);
      setName("");
      form.setFieldsValue({ name: "" });
    }
  }, [number, api, authToken, setName, form]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const validateAndSubmit = useCallback(() => {
    form.validateFields()
      .then(() => {
        if (!name.trim()) {
          setError("Please enter a valid name.");
          return;
        }
        if (!/^\d{10}$/.test(number)) {
          setError("Please enter a valid 10-digit phone number.");
          return;
        }
        setError("");
        handleSubmit();
      })
      .catch((errorInfo) => {
        // console.error('Validation failed:', errorInfo);
      });
  }, [form, name, number, handleSubmit]);

  const handleNameChange = useCallback((e) => {
    setName(e.target.value);
    setError("");
  }, [setName]);

  const handleNumberChange = useCallback((e) => {
    const value = e.target.value.slice(0, 10);
    setNumber(value);
    setError("");
  }, [setNumber]);

  const handleMethodChange = useCallback((e) => {
    setMethod(e.target.value);
  }, [setMethod]);

  const isSubmitDisabled = !name.trim() || number?.length !== 10 || isLoadingUser;

  return (
    <Modal
      open={show}
      onCancel={() => !disabled && handleClose()}
      closable={!disabled}
      title={
        <div style={{ textAlign: 'center', width: '100%' }}>
          Attendee Detail For This Booking
        </div>
      }
      footer={null}
      centered
      width={480}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ payment: 'Cash' }}
      >
        <Form.Item
          name="phone"
          label="Phone Number"
          rules={[
            { required: true, message: 'Please enter phone number' },
            {
              pattern: /^\d{10}$/,
              message: 'Please enter a valid 10-digit phone number'
            }
          ]}
        >
          <Input
            placeholder="Enter Phone Number"
            size="large"
            type="tel"
            maxLength={10}
            value={number}
            onChange={handleNumberChange}
          />
        </Form.Item>

        {showNameField && (
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: 'Please enter name' },
              { whitespace: true, message: 'Name cannot be empty' }
            ]}
          >
            <Input
              placeholder={isLoadingUser ? "Loading..." : "Enter Name"}
              size="large"
              value={name}
              onChange={handleNameChange}
              disabled={isLoadingUser}
            />
          </Form.Item>
        )}

        {error && (
          <div style={{ marginBottom: 16 }}>
            <Text type="danger" style={{ display: 'block', textAlign: 'center' }}>
              {error}
            </Text>
          </div>
        )}

        {/* {(userRole === 'Admin' || userRole === 'Organizer') && (
          <Form.Item
            name="payment"
            label="Payment Method"
          >
            <Radio.Group
              onChange={handleMethodChange}
              defaultValue="Cash"
              style={{ width: '100%' }}
            >
              <Space direction="horizontal" size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Radio value="Cash">Cash</Radio>
                <Radio value="UPI">UPI</Radio>
                <Radio value="Net Banking">Net Banking</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        )} */}

        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'center' }} size="middle">
            <Button
              type="primary"
              size="large"
              onClick={validateAndSubmit}
              disabled={isSubmitDisabled}
            >
              {isLoadingUser ? "Loading..." : "Submit"}
            </Button>
            <Button
              type="default"
              size="large"
              onClick={() => handleClose(true)}
            >
              Skip
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default POSAttendeeModal;