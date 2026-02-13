import React, {
  memo,
  Fragment,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Row, Col, Image, Button, Modal, Space, Typography, notification, Tooltip, Select, Card, Empty } from "antd";
import { useQuery } from "@tanstack/react-query";
import { Edit, Eye, IdCard, Trash2, Download } from "lucide-react";
import SelectAnt from "antd/lib/select";
import { QRCodeCanvas } from "qrcode.react";
import DataTable from "../common/DataTable";
import TicketModal from "../Tickets/modals/TicketModal";
import StickerModal from "../Tickets/modals/StickerModal";
import { useMyContext } from "Context/MyContextProvider";
import apiClient from "auth/FetchInterceptor";
import PermissionChecker from "layouts/PermissionChecker";
import { useOrganizerEvents } from "views/events/Settings/hooks/useBanners";
const { Text } = Typography;

const Attendees = memo(() => {
  const {
    convertTo12HourFormat,
    isMobile,
    UserData,
    formatDateTime,
  } = useMyContext();

  const [ticketData, setTicketData] = useState({});
  const [ticketModal, setTicketModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bgRequired, setBgRequired] = useState(false);
  const [stickerModal, setStickerModal] = useState(false);
  const [dateRange, setDateRange] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [qrDownloadData, setQrDownloadData] = useState(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [backgroundModalVisible, setBackgroundModalVisible] = useState(false);
  const [tempTicketData, setTempTicketData] = useState(null);
  const [zipLoading, setZipLoading] = useState(false);

  // Fetch events list
  // Fetch events list
  const { data: events = [], isLoading: eventsLoading } = useOrganizerEvents(
    UserData?.id,
    UserData?.role
  );

  // Fetch attendees for selected event
  const {
    data: attendeesData,
    isLoading: attendeesLoading,
    refetch: refetchAttendees,
  } = useQuery({
    queryKey: ["attendees", selectedEvent?.value, dateRange, UserData?.id],
    queryFn: async () => {
      if (!selectedEvent?.value || !UserData?.id) return null;

      const queryParams = dateRange ? `?date=${dateRange}` : "";
      const response = await apiClient.get(
        `attendee-list/${UserData.id}/${selectedEvent.value}${queryParams}`
      );

      if (response?.status) {
        return {
          attendees: response.attendees || [],
          tickets: response.tickets || [],
        };
      }
      return { attendees: [], tickets: [] };
    },
    enabled: Boolean(selectedEvent?.value && UserData?.id),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  const users = attendeesData?.attendees || [];
  const attendeesCount = attendeesData?.tickets || [];

  const openLightbox = useCallback((imagePath) => {
    setSelectedImage(imagePath);
    setImageModalVisible(true);
  }, []);

  const handleShowIdCardModal = useCallback((ticket) => {
    setTempTicketData(ticket);
    setBackgroundModalVisible(true);
  }, []);

  const handleBackgroundSelection = useCallback((withBackground) => {
    setTicketData(tempTicketData);
    setBgRequired(withBackground);
    setTicketModal(true);
    setBackgroundModalVisible(false);
    setTempTicketData(null);
  }, [tempTicketData]);

  const handleCloseModal = useCallback(() => {
    setTicketModal(false);
    setTimeout(() => {
      setSelectedImage("");
      setTicketData({});
    }, 500);
  }, []);

  const handleShowStickerModal = useCallback((row) => {
    setStickerModal(true);
    setTicketData(row);
  }, []);

  const handleCloseStickerModal = useCallback(() => {
    setStickerModal(false);
  }, []);

  const handleQrDownloadFromTable = useCallback((data) => {
    setQrDownloadData(data);
    setQrModalVisible(true);
  }, []);

  const confirmQrDownload = useCallback(() => {
    if (!qrDownloadData) return;

    const tempCanvasId = "table-qr-download-canvas";
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "-9999px";
    document.body.appendChild(container);

    const qrElem = (
      <QRCodeCanvas
        id={tempCanvasId}
        value={qrDownloadData.token}
        size={180}
        bgColor="#fff"
        fgColor="#000"
        level="H"
      />
    );

    import("react-dom").then((ReactDOM) => {
      ReactDOM.render(qrElem, container);

      setTimeout(() => {
        const canvas = document.getElementById(tempCanvasId);
        if (canvas) {
          const url = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = url;
          const safeName = qrDownloadData.Name
            ? qrDownloadData.Name.replace(/\s+/g, "_")
              .replace(/[^\w_]/g, "")
              .toLowerCase()
            : "user";
          a.download = `${qrDownloadData.id || "user"}_${safeName}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        ReactDOM.unmountComponentAtNode(container);
        document.body.removeChild(container);
        setQrModalVisible(false);
        setQrDownloadData(null);
      }, 100);
    });
  }, [qrDownloadData]);

  // Download ZIP handler
  const downloadZip = useCallback(async () => {
    if (!selectedEvent?.value) return;

    setZipLoading(true);
    try {
      const response = await apiClient.get(`attendee_images/${selectedEvent.value}`);

      const downloadUrl = response?.download_url;
      if (!downloadUrl) {
        throw new Error("No download URL received.");
      }

      // Trigger direct browser download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `attendee_images_${selectedEvent.label}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      notification.success({
        message: "Download Started",
        description: "Attendee images zip is being downloaded.",
      });
    } catch (err) {
      let msg = "Download failed.";
      if (err.response?.data?.message) msg = err.response.data.message;
      else if (err.message) msg = err.message;

      notification.error({
        message: "Download Error",
        description: msg,
      });
    } finally {
      setZipLoading(false);
    }
  }, [selectedEvent]);

  const columns = useMemo(
    () => [
      {
        title: "#",
        dataIndex: "idx",
        key: "idx",
        align: "center",
        width: 60,
        render: (_text, _row, index) => index + 1,
      },
      {
        title: "Name",
        dataIndex: "Name",
        key: "Name",
        align: "center",
      },
      {
        title: "User Name",
        dataIndex: ["user_data", "name"],
        key: "user_name",
        align: "center",
      },
      {
        title: "Booking Mode",
        dataIndex: "agent_id",
        key: "booking_mode",
        align: "center",
        render: (agent_id, row) =>
          agent_id ? row?.agent_user?.name : "Online",
      },
      {
        title: "Contact",
        dataIndex: "Mo",
        key: "Mo",
        align: "center",
      },
      {
        title: "Ticket",
        dataIndex: ["ticket_data", "name"],
        key: "ticket_name",
        align: "center",
      },
      {
        title: "Photo",
        dataIndex: "Photo",
        key: "Photo",
        align: "center",
        width: 100,
        render: (cell) =>
          cell ? (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button type="link" onClick={() => openLightbox(cell)}>
                <Image
                  src={cell}
                  alt="Attendee"
                  width={50}
                  height={50}
                  style={{ objectFit: "cover", borderRadius: "50%" }}
                  preview={false}
                />
              </Button>
            </div>
          ) : (
            <span>No Image</span>
          ),
      },
      {
        title: "Created At",
        dataIndex: "updated_at",
        key: "created_at",
        align: "center",
        render: (cell) => formatDateTime(cell),
      },
      {
        title: "QR Code",
        dataIndex: "qrdata",
        key: "qrdata",
        align: "center",
        width: 100,
        render: (_cell, row) =>
          row.token ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                cursor: "pointer",
              }}
              onClick={() => handleQrDownloadFromTable(row)}
              title="Click to download QR"
            >
              <QRCodeCanvas
                value={row.token}
                size={48}
                bgColor="#fff"
                fgColor="#000"
              />
            </div>
          ) : (
            <span className="text-muted">No Token</span>
          ),
      },
      {
        title: "Email",
        dataIndex: "Email",
        key: "Email",
        align: "center",
      },
      {
        title: "Id Card",
        key: "idcard",
        align: "center",
        fixed: "right",
        width: 100,
        render: (_text, row) => (
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            <Button
              size="small"
              type="primary"
              onClick={() => handleShowIdCardModal(row)}
              icon={<IdCard size={16} />}
            />
          </div>
        ),
      },
      {
        title: "Label",
        key: "label",
        fixed: "right",
        align: "center",

        width: 100,
        render: (_text, row) => (
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            <Button
              size="small"
              onClick={() => handleShowStickerModal(row)}
              icon={<Eye size={16} />}
            />
          </div>
        ),
      },
    ],
    [
      formatDateTime,
      handleShowIdCardModal,
      handleShowStickerModal,
      openLightbox,
      handleQrDownloadFromTable,
    ]
  );

  const handleSelectEvent = useCallback((value) => {
    const sel = events.find((e) => e.value === value) || null;
    setSelectedEvent(sel);
  }, [events]);

  // Event Selection Component and Download Button
  const ExtraHeaderContent = useMemo(
    () => (
      <>
        <Select
          style={{ width: '15rem' }}
          placeholder="Select Events"
          value={selectedEvent?.value}
          onChange={handleSelectEvent}
          loading={eventsLoading}
          allowClear
          showSearch
          optionFilterProp="label"
          options={events.map((ev) => ({
            value: ev.value,
            label: ev.label,
          }))}
        />
        {selectedEvent?.value && (
          <PermissionChecker permission="Download Attendees">
            <Tooltip title="Download Zip">
              <Button
                type="primary"
                icon={<Download size={16} />}
                onClick={downloadZip}
                loading={zipLoading}
              />
            </Tooltip>
          </PermissionChecker>
        )}
      </>
    ),
    [selectedEvent?.value, handleSelectEvent, eventsLoading, events, downloadZip, zipLoading]
  );

  return (
    <Fragment>
      <Row>
        <Col span={24}>
          {selectedEvent ? (
            <DataTable
              title={selectedEvent ? `Attendees - ${selectedEvent.label}` : "Attendees"}
              data={users}
              columns={columns}
              loading={attendeesLoading}
              emptyText={
                !selectedEvent
                  ? "Please select an event to view attendees"
                  : "No attendees found"
              }
              enableSearch
              showSearch
              showRefresh
              showDateRange
              exportRoute={
                selectedEvent?.value
                  ? `export-attndy/${selectedEvent.value}`
                  : undefined
              }
              onDateRangeChange={(dr) => setDateRange(dr)}
              dateRange={dateRange}
              onRefresh={() => refetchAttendees()}
              extraHeaderContent={ExtraHeaderContent}
              enableExport={Boolean(selectedEvent?.value)}
              ExportPermission={Boolean(selectedEvent?.value)}
            />
          ) : (
            <Card title="Attendees">
              <div className="text-center">
                {ExtraHeaderContent}
                <div style={{ marginTop: 24, padding: '40px 20px' }}>
                  <Empty
                    description={
                      <div>
                        <h4>
                          No Event Selected
                        </h4>
                        <p>
                          Please select an event from the dropdown above to view attendees data
                        </p>
                      </div>
                    }
                  />
                </div>
              </div>
            </Card>
          )}
        </Col>

        <TicketModal
          show={ticketModal}
          handleCloseModal={handleCloseModal}
          ticketType={{ type: "combine" }}
          ticketData={ticketData}
          ticketRefs={[]}
          loading={attendeesLoading}
          isIdCard={true}
          bgRequired={bgRequired}
          card_url={selectedEvent?.card_url || ""}
          showTicketDetails={true}
          showPrintButton={true}
          eventId={selectedEvent?.value}
          isMobile={isMobile}
          convertTo12HourFormat={convertTo12HourFormat}
        />

        <StickerModal
          data={ticketData}
          open={stickerModal}
          setOpen={setStickerModal}
          category_id={selectedEvent?.categoryId}
        />
      </Row>

      {/* Image Preview Modal */}
      <Modal
        open={imageModalVisible}
        footer={null}
        onCancel={() => setImageModalVisible(false)}
        centered
        width="80%"
      >
        {selectedImage && (
          <Image src={selectedImage} alt="Full size" style={{ width: "100%" }} />
        )}
      </Modal>

      {/* Background Selection Modal */}
      <Modal
        title="Background Selection"
        open={backgroundModalVisible}
        onCancel={() => {
          setBackgroundModalVisible(false);
          setTempTicketData(null);
        }}
        footer={[
          <Button key="without" onClick={() => handleBackgroundSelection(false)}>
            Without Background
          </Button>,
          <Button
            key="with"
            type="primary"
            onClick={() => handleBackgroundSelection(true)}
          >
            With Background
          </Button>,
        ]}
        centered
      >
        <Text>Please choose whether you want the ticket with or without a background.</Text>
      </Modal>

      {/* QR Download Confirmation Modal */}
      <Modal
        title="Download QR Code"
        open={qrModalVisible}
        onOk={confirmQrDownload}
        onCancel={() => {
          setQrModalVisible(false);
          setQrDownloadData(null);
        }}
        okText="Download"
        cancelText="Cancel"
        centered
      >
        <Space direction="vertical" style={{ width: "100%" }} align="center">
          <Text>Do you want to download this QR code?</Text>
          {qrDownloadData?.token && (
            <QRCodeCanvas
              value={qrDownloadData.token}
              size={180}
              bgColor="#fff"
              fgColor="#000"
              level="H"
              style={{ marginTop: 16 }}
            />
          )}
        </Space>
      </Modal>
    </Fragment>
  );
});

Attendees.displayName = "Attendees";
export default Attendees;
