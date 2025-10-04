import React, { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Button, Row, Col, Spin, Alert } from "antd"; // Ant Design components
import TicketCanvasZip from "./TicketCanvasZip";
import axios from "axios";
import { File, Loader } from "lucide-react";
import { useMyContext } from "Context/MyContextProvider";

const TicketCanvasBatch = (props) => {
  const { ticketData } = props;
  const { api, formatDateRange, convertTo12HourFormat, isMobile } = useMyContext();

  const canvasRefs = useRef([]);
  const [imageUrl, setImageUrl] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    setIsDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let hasValidCanvases = false;
      for (let i = 0; i < ticketData?.bookings?.length; i++) {
        const canvasRef = canvasRefs.current[i]?.canvasRef?.current;
        if (canvasRef) {
          try {
            const dataUrl = canvasRef.toDataURL("image/jpeg", 0.9);
            const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
            if (base64) {
              zip.file(
                `ticket_${ticketData.bookings[i].OrderId || i + 1}.jpg`,
                base64,
                { base64: true }
              );
              hasValidCanvases = true;
            }
          } catch (canvasError) {
            console.error(`Error capturing canvas ${i}:`, canvasError);
          }
        } else {
          console.warn(`Canvas ref ${i} is not available`);
        }
      }
      if (!hasValidCanvases) {
        // Use Ant Design Alert for error
        setLoadError("No valid ticket canvases found to download");
        return;
      }
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "all_tickets.zip");
    } catch (error) {
      console.error("Error generating zip file:", error);
      setLoadError("Error generating zip file.");
    } finally {
      setIsDownloading(false);
    }
  };

  const RetriveName = (data) => (
    data?.attendee?.Name ||
    data?.bookings?.[0]?.attendee?.Name ||
    data?.user?.name ||
    data?.bookings?.[0]?.user?.name ||
    "N/A"
  );
  const RetriveUser = (data) => (
    data?.attendee ||
    data?.bookings?.[0]?.attendee ||
    data?.user ||
    data?.bookings?.[0]?.user ||
    "N/A"
  );
  const RetriveNumber = (data) => (
    data?.attendee?.Mo ||
    data?.bookings?.[0]?.attendee?.Mo ||
    data?.user?.number ||
    data?.bookings?.[0]?.user?.number ||
    "N/A"
  );

  const fetchImage = async (ticketBG) => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const response = await axios.post(
        `${api}get-image/retrive`,
        { path: ticketBG },
        { responseType: "blob" }
      );
      const imageUrl = URL.createObjectURL(response.data);
      setImageUrl(imageUrl);
    } catch (error) {
      setLoadError("Failed to load ticket background. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ticketData) {
      const ticketBG =
        ticketData?.ticket?.background_image ||
        ticketData?.bookings?.[0]?.ticket?.background_image ||
        "";
      if (ticketBG) {
        fetchImage(ticketBG);
      }
    }
  }, [ticketData]);

  return (
    <>
      <Row justify="center" className="mb-2">
        <Col xs={24} sm={12}>
          <Button
            type="primary"
            block
            icon={isDownloading ? <Spin size="small" /> : <File size={16} />}
            onClick={handleDownloadAll}
            disabled={isDownloading || !ticketData?.bookings?.length}
          >
            {isDownloading ? "Preparing Download..." : "Download All Tickets (ZIP)"}
          </Button>
        </Col>
      </Row>
      {loadError && (
        <Alert
          message="Error"
          description={loadError}
          type="error"
          showIcon
          style={{ marginBottom: 16, textAlign: "center" }}
        />
      )}
      {isLoading && !loadError ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
          <Loader />
        </div>
      ) : (
        <div
          className="ticket-scroll-container"
          style={{
            height: isMobile ? "calc(100vh - 180px)" : "70vh",
            overflowY: "auto",
            overflowX: "hidden",
            padding: isMobile ? "5px" : "10px",
            border: "1px solid #e9ecef",
            borderRadius: "8px",
          }}
        >
          <Row justify="center">
            {ticketData?.bookings?.map((booking, idx) => (
              <Col
                key={booking?.token || idx}
                xs={24}
                sm={12}
                md={8}
                style={{ marginBottom: 16 }}
              >
                <div
                  className="ticket-wrapper"
                  style={{
                    transform: "scale(0.9)",
                    transformOrigin: "top center",
                  }}
                >
                  <TicketCanvasZip
                    ref={(el) => (canvasRefs.current[idx] = el)}
                    {...booking}
                    ticketData={ticketData}
                    imageUrl={imageUrl}
                    showDetails={false}
                    {...props}
                    number={RetriveNumber(ticketData)}
                    userName={RetriveName(ticketData)}
                    user={RetriveUser(ticketData)}
                    photo={booking?.attendee?.Photo || "N/A"}
                    ticketName={booking?.ticket?.name || "Ticket Name"}
                    category={booking?.ticket?.event?.category || "Category"}
                    title={booking?.ticket?.event?.name || "Event Name"}
                    date={
                      formatDateRange(
                        ticketData?.booking_date ||
                          booking?.booking_date ||
                          ticketData?.ticket?.event?.date_range ||
                          booking?.ticket?.event?.date_range
                      ) || "Date Not Available"
                    }
                    city={booking?.ticket?.event?.city || "City"}
                    address={
                      booking?.ticket?.event?.address || "Address Not Specified"
                    }
                    time={
                      convertTo12HourFormat(
                        booking?.ticket?.event?.start_time
                      ) || "Time Not Set"
                    }
                    OrderId={booking?.token || "N/A"}
                    quantity={1}
                  />
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}
      <div className="text-center text-muted">
        <small>Showing {ticketData?.bookings?.length || 0} tickets</small>
      </div>
    </>
  );
};

export default TicketCanvasBatch;
