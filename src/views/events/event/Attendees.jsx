import React, {
  memo,
  Fragment,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Row, Col, Image, Button, Modal, Space, Typography, notification, Tooltip, Select, Card, Empty, message } from "antd";
import { useQuery } from "@tanstack/react-query";
import { Edit, Eye, IdCard, Trash2, Download } from "lucide-react";
import SelectAnt from "antd/lib/select";
import { QRCodeCanvas } from "qrcode.react";
import DataTable from "../common/DataTable";
import TicketModal from "../Tickets/modals/TicketModal";
import StickerModal from "../Tickets/modals/StickerModal";
import { useMyContext } from "Context/MyContextProvider";
import apiClient from "auth/FetchInterceptor";
import { API_BASE_URL } from "configs/AppConfig";
import PermissionChecker from "layouts/PermissionChecker";
import { useOrganizerEvents } from "views/events/Settings/hooks/useBanners";
const { Text } = Typography;

/** Trigger browser download from a Blob */
function triggerBlobDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

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
  const [attendeeType, setAttendeeType] = useState("online"); // 'offline' | 'online'
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [bgRequired, setBgRequired] = useState(false);
  const [stickerModal, setStickerModal] = useState(false);
  const [dateRange, setDateRange] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [qrDownloadData, setQrDownloadData] = useState(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [backgroundModalVisible, setBackgroundModalVisible] = useState(false);
  const [tempTicketData, setTempTicketData] = useState(null);
  const [zipLoading, setZipLoading] = useState(false);

  // Fetch events list
  const { data: events = [], isLoading: eventsLoading } = useOrganizerEvents(
    UserData?.id,
    UserData?.role
  );

  const {authToken} = useMyContext();

  // Format date range for API: "YYYY-MM-DD, YYYY-MM-DD"
  const formattedDateForApi = useMemo(() => {
    if (!dateRange) return undefined;
    if (Array.isArray(dateRange)) {
      return dateRange
        .map((d) => (typeof d === "string" ? d.slice(0, 10) : d?.format?.("YYYY-MM-DD") ?? String(d).slice(0, 10)))
        .join(", ");
    }
    return dateRange;
  }, [dateRange]);

  // Fetch attendees for selected event (POST with type, ticket_id, event_id, page, per_page)
  const {
    data: attendeesData,
    isLoading: attendeesLoading,
    refetch: refetchAttendees,
  } = useQuery({
    queryKey: ["attendees", selectedEvent?.value, attendeeType, selectedTicketId, dateRange, searchQuery, page, perPage, UserData?.id],
    queryFn: async () => {
      if (!selectedEvent?.value || !UserData?.id) return null;

      const payload = {
        type: attendeeType,
        ticket_id: selectedTicketId || undefined,
        event_id: selectedEvent.value,
        page,
        per_page: perPage,
      };
      if (formattedDateForApi) payload.date = formattedDateForApi;
      if (searchQuery?.trim()) payload.search = searchQuery.trim();

      const response = await apiClient.post("attendee-list", payload);

      if (response?.status) {
        return {
          attendees: response.attendees || [],
          tickets: response.tickets || [],
          pagination: response.pagination || null,
        };
      }
      return { attendees: [], tickets: [], pagination: null };
    },
    enabled: Boolean(selectedEvent?.value && UserData?.id && attendeeType && selectedTicketId),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  const users = attendeesData?.attendees || [];
  const attendeesPagination = attendeesData?.pagination
    ? {
      current_page: attendeesData.pagination.current_page,
      per_page: attendeesData.pagination.per_page,
      total: attendeesData.pagination.total,
      last_page: attendeesData.pagination.last_page,
    }
    : null;

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

  // Download ZIP handler: calls attendee-download-images (supports direct blob OR async SSE job)
  const downloadZip = useCallback(async () => {
    if (!selectedEvent?.value) return;

    setZipLoading(true);
    try {
      const payload = {
        type: attendeeType,
        event_id: selectedEvent.value,
      };
      if (selectedTicketId != null && selectedTicketId !== "") {
        payload.ticket_id = selectedTicketId;
      }

      const response = await apiClient.post(`attendee-download-images`, payload, {
        responseType: "blob",
      });

      const contentType = response.headers?.["content-type"] || "";

      // Case A: backend returned the ZIP directly as a blob
      if (contentType.includes("application/zip") || contentType.includes("application/octet-stream")) {
        const zipName = `attendee_images_${(selectedEvent.label || selectedEvent.value).replace(/[^\w-]/g, "_")}.zip`;
        triggerBlobDownload(response.data, zipName);
        setZipLoading(false);
        notification.success({
          message: "Download started",
          description: "Attendee images zip is being downloaded.",
        });
        return;
      }

      // Case B: backend returned JSON with a job_id for async processing
      const text = await response.data.text();
      const json = JSON.parse(text);

      if (json?.download_url) {
        // Immediate download URL (no SSE needed)
        window.open(json.download_url);
        setZipLoading(false);
        return;
      }

      if (!json?.job_id) {
        throw new Error(json?.message || "Unexpected response from server.");
      }

      // Listen for job completion via SSE
      const baseUrl = process.env.REACT_APP_API_ENDPOINT_URL || API_BASE_URL || "";
      const sseUrl = `${baseUrl}attendee-zip-status/${json.job_id}?token=${authToken}`;
      const sse = new EventSource(sseUrl, { withCredentials: true });

      sse.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.status === "ready") {
            sse.close();
            setZipLoading(false);
            window.open(data.download_url);
            notification.success({
              message: "Download ready",
              description: "Attendee images zip is ready for download.",
            });
          } else if (data.status === "error") {
            sse.close();
            setZipLoading(false);
            message.error(data.message || "Failed to generate zip.");
          }
          // status === "waiting" → keep loader visible
        } catch (parseErr) {
          console.error("SSE parse error:", parseErr);
        }
      };

      sse.onerror = () => {
        sse.close();
        setZipLoading(false);
        message.error("Connection lost while waiting for zip. Please try again.");
      };
    } catch (err) {
      console.error(err);
      setZipLoading(false);
      message.error(err?.response?.data?.message || err?.message || "Download failed.");
    }
  }, [selectedEvent, attendeeType, selectedTicketId]);

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
        dataIndex: "name",
        key: "name",
        align: "center",
      },
      {
        title: "User Name",
        dataIndex: ["user_data", "name"],
        key: "user_name",
        align: "center",
      },
      {
        title: "Photo",
        dataIndex: "photo",
        key: "photo",
        align: "center",
        width: 100,
        render: (photo) => photo ? <Image src={photo} alt="Thumbnail" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '50%' }} /> : 'N/A',
      },
      {
        title: "Contact",
        dataIndex: "number",
        key: "number",
        align: "center",
      },
      {
        title: "Booking Type",
        dataIndex: "booking_type",
        key: "booking_type",
        align: "center",
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
        dataIndex: "email",
        key: "email",
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
    setSelectedTicketId(null);
    setPage(1);
  }, [events]);

  // Build ticket options from selected event's tickets (from org-event API)
  const ticketOptions = useMemo(() => {
    const list = selectedEvent?.tickets || [];
    if (!Array.isArray(list) || list.length === 0) return [];
    return list.map((t) => ({
      value: t.id,
      label: t.name ?? `Ticket #${t.id}`,
    }));
  }, [selectedEvent?.tickets]);

  // Event Selection, Type dropdown, Ticket dropdown and Download Button
  const ExtraHeaderContent = useMemo(
    () => (
      <>
        <Select
          style={{ width: "15rem" }}
          placeholder="Select Event"
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
          <>
            <Select
              style={{ width: "12rem", marginLeft: 8 }}
              placeholder="Ticket"
              value={selectedTicketId ?? ""}
              onChange={(v) => {
                setSelectedTicketId(v || null);
                setPage(1);
              }}
              allowClear
              showSearch
              optionFilterProp="label"
              options={ticketOptions}
            />
            <Select
              style={{ width: "10rem", marginLeft: 8 }}
              placeholder="Type"
              value={attendeeType}
              onChange={(v) => {
                setAttendeeType(v);
                setPage(1);
              }}
              options={[
                { value: "online", label: "Online" },
                { value: "offline", label: "Offline" },
              ]}
            />
            <PermissionChecker permission="Download Attendees">
              <Tooltip title="Download Zip">
                <Button
                  type="primary"
                  icon={<Download size={16} />}
                  onClick={downloadZip}
                  loading={zipLoading}
                  style={{ marginLeft: 8 }}
                />
              </Tooltip>
            </PermissionChecker>
          </>
        )}
      </>
    ),
    [
      selectedEvent?.value,
      handleSelectEvent,
      eventsLoading,
      events,
      attendeeType,
      selectedTicketId,
      ticketOptions,
      downloadZip,
      zipLoading,
    ]
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
                  ? `export-attendee`
                  : undefined
              }
              exportPayload={{
                event_id: selectedEvent?.value,
                type: attendeeType,
                ticket_id: selectedTicketId,
                date: formattedDateForApi,
              }}
              onDateRangeChange={(dr) => setDateRange(dr)}
              dateRange={dateRange}
              onRefresh={() => refetchAttendees()}
              extraHeaderContent={ExtraHeaderContent}
              enableExport={Boolean(selectedEvent?.value)}
              ExportPermission={Boolean(selectedEvent?.value)}
              serverSide={Boolean(attendeesPagination)}
              pagination={attendeesPagination}
              onPaginationChange={(newPage, newPageSize) => {
                setPage(newPage);
                setPerPage(newPageSize);
              }}
              onSearch={(value) => {
                setSearchQuery(value ?? "");
                setPage(1);
              }}
              searchValue={searchQuery}
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
