import React, {
  memo,
  Fragment,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { Row, Col, Image, Button, Modal, Typography, Tooltip, Select, Card, Empty, message } from "antd";
import { useQuery } from "@tanstack/react-query";
import { Eye, IdCard, Download } from "lucide-react";
import DataTable from "../common/DataTable";
import EventTicketDropdowns from "../common/EventTicketDropdowns";
import TicketModal from "../Tickets/modals/TicketModal";
import StickerModal from "../Tickets/modals/StickerModal";
import Loader from "utils/Loader";
import { useMyContext } from "Context/MyContextProvider";
import apiClient from "auth/FetchInterceptor";
import { API_BASE_URL } from "configs/AppConfig";
import PermissionChecker from "layouts/PermissionChecker";
import Utils from "utils";
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

/** Get filename from download URL or event fallback */
function getZipFilename(downloadUrl, eventLabelOrValue) {
  try {
    const pathname = new URL(downloadUrl).pathname;
    const fromPath = pathname.split("/").pop();
    if (fromPath && fromPath.endsWith(".zip")) return fromPath;
  } catch (_) { }
  return `attendee_images_${String(eventLabelOrValue || "event").replace(/[^\w-]/g, "_")}.zip`;
}

const Attendees = memo(() => {
  const {
    convertTo12HourFormat,
    isMobile,
    UserData,
    formatDateTime,
    authToken,
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
  const [backgroundModalVisible, setBackgroundModalVisible] = useState(false);
  const [tempTicketData, setTempTicketData] = useState(null);
  const [zipLoading, setZipLoading] = useState(false);

  const handleEventChange = useCallback((event) => {
    setSelectedEvent(event);
    setSelectedTicketId(null);
    setPage(1);
  }, []);

  /** Download zip from URL via backend proxy (avoids CORS). Falls back to opening URL in new tab if proxy fails.
   *  Backend must implement: GET attendee-download-proxy?url=<encoded_zip_url> → stream zip binary (e.g. Content-Type: application/zip). */
  const downloadZipFromUrl = useCallback(async (downloadUrl, eventLabelOrValue) => {
    const filename = getZipFilename(downloadUrl, eventLabelOrValue);
    try {
      const res = await apiClient.get("attendee-download-proxy", {
        params: { url: downloadUrl },
        responseType: "blob",
      });
      if (res?.data instanceof Blob) {
        triggerBlobDownload(res.data, filename);
        message.success("Download started. Attendee images zip is being downloaded.");
        return;
      }
    } catch (proxyErr) {
      console.warn("Proxy download failed, opening URL in new tab.", proxyErr);
    }
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
    try {
      await navigator.clipboard.writeText(downloadUrl);
      message.info("Download link opened in new tab. If the tab was blocked, the link was copied to your clipboard — paste it in a new tab to download.");
    } catch (_) {
      message.info("Download link opened in new tab. Paste the link in a new tab if the zip doesn’t download.");
    }
  }, []);

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
        message.success("Download started. Attendee images zip is being downloaded.");
        return;
      }

      // Case B: backend returned JSON with a job_id for async processing
      const text = await response.data.text();
      const json = JSON.parse(text);

      if (json?.download_url) {
        // Immediate download URL – use backend proxy to avoid CORS, else open in new tab
        await downloadZipFromUrl(json.download_url, selectedEvent?.label || selectedEvent?.value);
        setZipLoading(false);
        return;
      }

      if (!json?.job_id) {
        throw new Error(json?.message || "Unexpected response from server.");
      }

      // Listen for job completion via SSE
      const baseUrl = process.env.REACT_APP_API_ENDPOINT_URL || API_BASE_URL || "";
      const sseUrl = `${baseUrl}attendee-zip-status/${json.job_id}?token=${authToken}`;
      const sse = new EventSource(sseUrl);

      sse.onmessage = async (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.status === "ready") {
            sse.close();
            await downloadZipFromUrl(data.download_url, selectedEvent?.label || selectedEvent?.value);
            setZipLoading(false);
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
      message.error(Utils.getErrorMessage(err, "Download failed."));
    }
  }, [selectedEvent, attendeeType, selectedTicketId, authToken, downloadZipFromUrl]);

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
    ]
  );

  // Build ticket options from selected event's tickets (from org-event API)
  const ticketOptions = useMemo(() => {
    const list = selectedEvent?.tickets || [];
    if (!Array.isArray(list) || list.length === 0) return [];
    return list.map((t) => ({
      value: t.id,
      label: t.name ?? `Ticket #${t.id}`,
    }));
  }, [selectedEvent?.tickets]);

  // Default to first ticket when event has tickets and none is selected (or selected is not in list)
  useEffect(() => {
    if (ticketOptions.length > 0) {
      const firstValue = ticketOptions[0].value;
      const currentValid =
        selectedTicketId != null &&
        selectedTicketId !== "" &&
        ticketOptions.some((o) => o.value === selectedTicketId);
      if (!currentValid) {
        setSelectedTicketId(firstValue);
        setPage(1);
      }
    }
  }, [ticketOptions, selectedTicketId]);

  // Event Selection, Ticket selection (shared component), Type dropdown and Download Button
  const ExtraHeaderContent = useMemo(
    () => (
      <>
        <EventTicketDropdowns
          organizerId={UserData?.id}
          role={UserData?.role}
          selectedEvent={selectedEvent}
          selectedTicketId={selectedTicketId}
          onEventChange={handleEventChange}
          onTicketChange={(v) => {
            setSelectedTicketId(v ?? null);
            setPage(1);
          }}
        />
        {selectedEvent?.value && (
          <>
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
                  disabled={zipLoading}
                  style={{ marginLeft: 8 }}
                />
              </Tooltip>
            </PermissionChecker>
          </>
        )}
      </>
    ),
    [
      UserData?.id,
      UserData?.role,
      selectedEvent,
      selectedTicketId,
      handleEventChange,
      attendeeType,
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

      {/* Zip download loader overlay – shown until SSE returns ready or error */}
      <Modal
        open={zipLoading}
        footer={null}
        closable={false}
        maskClosable={false}
        width={200}
        centered
        styles={{ body: { padding: 24, minHeight: 120 } }}
      >
        <Loader width={100} height={100} />
        <div className="text-center mt-2">
          <Text type="secondary">Preparing zip…</Text>
        </div>
      </Modal>

      {/* QR Download Confirmation Modal */}
    </Fragment>
  );
});

Attendees.displayName = "Attendees";
export default Attendees;
