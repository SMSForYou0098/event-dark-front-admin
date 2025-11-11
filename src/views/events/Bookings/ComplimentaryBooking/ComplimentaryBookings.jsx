import React, { useState, memo, useRef, useCallback } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Table,
  Switch,
  Select,
  Input,
  Upload,
  Space,
  Typography,
  Row,
  Col,
  message,
  Badge,
  Spin,
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import CountUp from "react-countup";
import api from "auth/FetchInterceptor";
// import generateQRCodeZip from "../Events/Tickets/generateQRCodeZip";
// import QRGenerator from "../Events/Tickets/QRGenerator";
import SendTickets from "./SendTickets";
import { useMyContext } from "../../../../Context/MyContextProvider";
import generateQRCodeZip from "views/events/Tickets/generateQRCodeZip";
import QRGenerator from "views/events/Tickets/QRGenerator";
import PosEvents from "../components/PosEvents";
// import CommonEventAccordion from "./CommonEventAccordion";

const { Title, Text } = Typography;
const { Option } = Select;

const ComplimentaryBookings = memo(() => {
  const { UserData, systemSetting, loader } = useMyContext();

  // Add loading modal state
  const [loadingModal, setLoadingModal] = useState({
    open: false,
    title: "Processing",
  });

  // Local state
  const [tickets, setTickets] = useState([]);
  const [showExistDataModal, setShowExistDataModal] = useState(false);
  const [data, setData] = useState([]);
  const [existData, setExistData] = useState([]);
  const [number, setNumber] = useState("");
  const [selectedTicketID, setSelectedTicketID] = useState(null);
  const [dataType, setDataType] = useState(false);
  const [disable, setDisable] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateData, setDuplicateData] = useState([]);
  const fileInputRef = useRef(null);
  const [zipLoading, setZipLoading] = useState(false);


  // Check users mutation
  const checkUsersMutation = useMutation({
    mutationFn: async (users) => {
      const response = await api.post("complimentary-booking/check/users", {
        users,
      });
      return response;
    },
    onSuccess: (response) => {
      const results = response?.results || [];
      if (results.length > 0) {
        resetFileInput();
        setShowExistDataModal(true);
        setExistData(results);
      } else {
        setData(response.users || data);
        setDisable(false);
        message.success(
          `File Imported: ${data.length} Attendees Detected successfully`
        );
      }
    },
    onError: (error) => {
      message.error("An error occurred while checking user booking.");
    },
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (requestData) => {
      const endpoint = dataType
        ? "complimentary-booking"
        : "complimentary-booking-store";
      const response = await api.post(endpoint, requestData);
      return response;
    },
    onSuccess: (response) => {
      if (response.status) {
        const allBookings = response.bookings?.map((item) => ({
          token: item?.token,
          name: item?.name,
          email: item?.email,
          number: item?.number,
        }));

        setBookings(allBookings);
        message.success("Complimentary Booking Created Successfully");
      }
    },
    onError: (error) => {
      message.error(error.response?.data?.message || "Something went wrong");
    },
  });

  // Replace showLoading function with Ant Design Modal
  const showLoading = (title = "Processing") => {
    setLoadingModal({ open: true, title });

    return {
      close: () => setLoadingModal({ open: false, title: "" }),
    };
  };

  const handleZip = async () => {
    // Start button spinner immediately
    setZipLoading(true);

    try {
      await generateQRCodeZip({
        bookings,
        QRGenerator: QRGenerator,
        loader: loader,
        // Callback when modal is opened - modal is now visible
        onModalOpen: () => {
          // Modal is now visible, button loading state continues until completion
        },
      });
    } catch (e) {
      console.error('Error generating ZIP:', e);
      message.error('Failed to generate QR codes. Please try again.');
    } finally {
      // Always stop button loading when done (success or error)
      setZipLoading(false);
    }
  };


  const handleChange = (value) => {
    if (value === "" || /^\d*$/.test(value)) {
      const numericValue = Number(value);
      if (numericValue <= 1000) {
        setNumber(value);
        setDisable(value === "" || value === "0");
      } else {
        setNumber("");
        message.error("Oops! You can create a maximum 1000 bookings");
      }
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetBookings = () => {
    // clear main booking data
    setBookings([]);
    setData([]);
    setDisable(true);
  };

  const fullReset = () => {

    // reset inputs / selections
    setNumber("");
    setSelectedTicketID(null);
    setDataType(false);

    // clear modals / duplicate/exist data
    setExistData([]);
    setShowExistDataModal(false);
    setShowDuplicateModal(false);
    setDuplicateData([]);

    // reset upload input and zip state
    resetFileInput();
    setZipLoading(false);

    // close any loading modal
    setLoadingModal({ open: false, title: "" });
  }

  const HandleTicket = (id) => {
    resetBookings();
    setDataType(false);
    setSelectedTicketID(id);
  };

  const handleSwitchChange = (checked) => {
    resetBookings();
    setDataType(checked);
  };

  const handleFileChange = (info) => {
    resetBookings();
    const file = info.file.originFileObj || info.file;

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const loadingAlert = showLoading("Verifying Excel file...");
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const range = XLSX.utils.decode_range(worksheet["!ref"]);

          const processedData = [];

          for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
            const row = [];
            for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
              const cellAddress = XLSX.utils.encode_cell({
                r: rowNum,
                c: colNum,
              });
              const cell = worksheet[cellAddress];
              row.push(cell ? cell.v : undefined);
            }
            if (row[1] && row[2]) {
              processedData.push({
                name: row[0] || "",
                email: row[1],
                number: row[2],
                token: row[3],
                rowIndex: rowNum + 1,
              });
            }
          }

          if (!processedData || processedData.length === 0) {
            message.error("The Excel file is empty.");
            resetFileInput();
            return;
          }

          // Validate each row
          const emailRegex =
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          const emailMap = new Map();
          const duplicates = [];

          processedData.forEach((item, index) => {
            // Validate email
            if (!emailRegex.test(item.email)) {
              throw new Error(
                `Row ${index + 1}: Invalid email address: ${item.email}`
              );
            }

            // Validate number
            if (isNaN(Number(item.number))) {
              throw new Error(
                `Row ${index + 1}: Invalid number: ${item.number}`
              );
            }

            if (emailMap.has(item.email)) {
              duplicates.push({
                ...item,
                duplicateRows: [emailMap.get(item.email), item.rowIndex],
              });
            } else {
              emailMap.set(item.email, item.rowIndex);
            }
          });

          if (duplicates.length > 0) {
            setDuplicateData(duplicates);
            setShowDuplicateModal(true);
            resetFileInput();
          } else {
            const attendeeValidation =
              systemSetting?.complimentary_attendee_validation === 1;
            if (attendeeValidation) {
              checkUsersMutation.mutate(processedData);
            } else {
              setData(processedData);
              message.success(
                `File Imported: ${processedData.length} Attendees Detected successfully`
              );
              setDisable(false);
            }
          }
        } catch (error) {
          resetFileInput();
          message.error(error.message);
        } finally {
          loadingAlert.close();
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleSubmit = async () => {
    const loadingAlert = showLoading("Creating Bookings...");

    try {
      const ticketData = tickets.find(
        (item) => parseInt(item.id) === parseInt(selectedTicketID)
      );

      if (!ticketData) {
        message.error("Please Select Event/Ticket First");
        return;
      }

      let requestData = {
        user_id: UserData.id,
        payment_method: "offline",
        ticket_id: ticketData.id,
      };

      if (dataType) {
        requestData.user = data;
        requestData.quantity = data.length;
      } else {
        requestData.number = UserData.number;
        requestData.email = UserData.email;
        requestData.name = UserData.name;
        requestData.quantity = number;
      }

      createBookingMutation.mutate(requestData);
    } finally {
      loadingAlert.close();
    }
  };

  const existDataColumns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Number",
      dataIndex: "number",
      key: "number",
    },
    {
      title: "Email Exists",
      dataIndex: "email_exists",
      key: "email_exists",
      render: (exists) => (
        <Badge
          status={exists ? "success" : "default"}
          text={exists ? "Yes" : "No"}
        />
      ),
    },
    {
      title: "Number Exists",
      dataIndex: "number_exists",
      key: "number_exists",
      render: (exists) => (
        <Badge
          status={exists ? "success" : "default"}
          text={exists ? "Yes" : "No"}
        />
      ),
    },
  ];

  const duplicateColumns = [
    {
      title: "#",
      key: "index",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Duplicate Rows",
      dataIndex: "duplicateRows",
      key: "duplicateRows",
      render: (rows) => rows.join(", "),
    },
  ];

  const uploadProps = {
    accept: ".xls,.xlsx",
    beforeUpload: () => false,
    onChange: handleFileChange,
    maxCount: 1,
    showUploadList: false,
  };

  const handleButtonClick = useCallback(async (evnt, tkts) => {
    setTickets(tkts);
  }, []);

  return (
    <>
      {/* Loading Modal - Replaces SweetAlert */}
      <Modal
        open={loadingModal.open}
        closable={false}
        footer={null}
        centered
        width={300}
        maskClosable={false}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Spin
            indicator={
              <LoadingOutlined
                style={{
                  fontSize: 48,
                  color: "#1890ff",
                }}
                spin
              />
            }
          />
          <Typography.Title level={4} style={{ marginTop: 20 }}>
            {loadingModal.title}
          </Typography.Title>
          {loader && (
            <img
              src={loader}
              alt="Loading"
              style={{
                width: "10rem",
                display: "block",
                margin: "20px auto 0",
              }}
            />
          )}
        </div>
      </Modal>

      {/* Existing Data Modal */}
      <Modal
        title="Existing Users"
        open={showExistDataModal}
        onCancel={() => setShowExistDataModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowExistDataModal(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        <Table
          columns={existDataColumns}
          dataSource={existData}
          rowKey={(record, index) => index}
          scroll={{ y: 400 }}
          pagination={{ pageSize: 10 }}
        />
      </Modal>

      {/* Duplicate Data Modal */}
      <Modal
        title="Duplicate Emails Found"
        open={showDuplicateModal}
        onCancel={() => setShowDuplicateModal(false)}
        footer={[
          <Text type="danger" key="warning">
            Please fix the duplicates and re-upload the file.
          </Text>,
          <Button key="close" onClick={() => setShowDuplicateModal(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          The following emails appear in multiple rows:
        </Text>
        <Table
          columns={duplicateColumns}
          dataSource={duplicateData}
          rowKey={(record, index) => index}
          scroll={{ y: 400 }}
          pagination={false}
        />
      </Modal>

      <PosEvents type={'Complimentary'} handleButtonClick={handleButtonClick} />

      {tickets.length > 0 ? (
        <Form layout="vertical">
          <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={12}>
            <Card
              title='Complimentary Bookings'
              extra={
                <Button danger onClick={() => fullReset()} icon={<CloseCircleOutlined />}>
                  Reset Bookings
                </Button>
              }
            >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8} lg={12}>
                    <Form.Item label="Select Category" required>
                      <Select
                        placeholder="Select ticket"
                        value={selectedTicketID}
                        onChange={HandleTicket}
                      >
                        {tickets.map((item) => (
                          <Option key={item.id} value={item.id}>
                            {item.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  {selectedTicketID && (
                    <>
                      <Col xs={24} sm={12} md={8} lg={12}>
                        <Form.Item label="Select Option">
                          <Switch
                            checked={dataType}
                            onChange={handleSwitchChange}
                            checkedChildren="Excel Import"
                            unCheckedChildren="Manual Entry"
                          />
                          {!(data.length > 0) && (
                            <div style={{ marginTop: 8 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Enable for Excel import data
                              </Text>
                            </div>
                          )}
                        </Form.Item>
                      </Col>

                      {dataType ? (
                        <>
                          <Col xs={24} sm={12} md={8} lg={12}>
                            <Form.Item label="Select File">
                              <Upload {...uploadProps}>
                                <Button icon={<UploadOutlined />} block>
                                  Upload Excel
                                </Button>
                              </Upload>
                              {!(data.length > 0) && bookings.length === 0 && (
                                <div style={{ marginTop: 8 }}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    ❕ Please upload an Excel file
                                  </Text>
                                </div>
                              )}
                            </Form.Item>
                          </Col>

                          {data.length > 0 ? (
                            <Col xs={24} sm={12} md={8} lg={12}>
                              <Form.Item label="Imported Data Overview">
                                <Title level={4} style={{ margin: 0 }}>
                                  <CountUp
                                    start={0}
                                    end={data.length}
                                    duration={3}
                                    separator=","
                                  />
                                  {" Attendees"}
                                </Title>
                              </Form.Item>
                            </Col>
                          ) : (
                            <Col xs={24} sm={12} md={8} lg={12}>
                              <Form.Item label="Download Sample">
                                <Button
                                  icon={<FileExcelOutlined />}
                                  href={`/uploads/sample.xlsx`}
                                  download
                                  className="d-flex justify-content-center align-items-center"
                                  block
                                >
                                  Sample File
                                </Button>
                              </Form.Item>
                            </Col>
                          )}

                          {bookings.length > 0 && (
                            <Col xs={24} sm={12} md={8} lg={12}>
                              <Form.Item label="Send Tickets">
                                <SendTickets bookings={bookings} />
                              </Form.Item>
                            </Col>
                          )}
                        </>
                      ) : (
                        <Col xs={24} sm={12} md={8} lg={12}>
                          <Form.Item
                            label="Total Tickets"
                            extra={
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                ❕ Max 1000 tickets allowed
                              </Text>
                            }
                          >
                            <Input
                              type="number"
                              placeholder="Enter quantity"
                              value={number}
                              onChange={(e) => handleChange(e.target.value)}
                              max={1000}
                            />
                          </Form.Item>
                        </Col>
                      )}

                      <Col xs={24} sm={12} md={8} lg={24}>
                        <Form.Item label="Action">
                          {bookings.length > 0 ? (
                            <Button
                              type="primary"
                              icon={<DownloadOutlined />}
                              onClick={handleZip}
                              loading={zipLoading || createBookingMutation.isPending}
                              disabled={zipLoading || createBookingMutation.isPending}
                              block
                            >
                              {zipLoading ? 'Generating...' : 'Download ZIP'}
                            </Button>
                          ) : (
                            <Button
                              type="primary"
                              disabled={disable}
                              onClick={handleSubmit}
                              loading={createBookingMutation.isPending}
                              block
                            >
                              Submit Booking
                            </Button>
                          )}
                        </Form.Item>
                      </Col>
                    </>
                  )}
                </Row>
            </Card>
              </Col>
          </Row>
        </Form>
      ) : "This event has no tickets available for complimentary booking."}
    </>
  );
});

ComplimentaryBookings.displayName = "ComplimentaryBookings";
export default ComplimentaryBookings;