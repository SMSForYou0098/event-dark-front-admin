import React, { useState, useCallback, useMemo } from "react";
import {
  Card,
  Image,
  Button,
  Dropdown,
  Tag,
  Space,
  Badge,
  Typography,
  Tooltip,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ShareAltOutlined,
  EnvironmentOutlined,
//   RupeeOutlined,
  AppstoreOutlined,
  MoreOutlined,
  TagOutlined,
  FieldTimeOutlined,
  VideoCameraOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useMyContext } from "Context/MyContextProvider";
import TicketModal from "../Tickets/modals/TicketModal";
import TicketActions from "../Tickets/modals/TicketActions";
import SendTicketsModal from "../Tickets/modals/SendTicketsModal";
// import TicketModal from "../../../components/Tickets/TicketModal";

const { Text } = Typography;

/** Ant-friendly status config */
const STATUS_CONFIG = {
  confirmed: { color: "success", icon: <CheckCircleOutlined /> },
  completed: { color: "success", icon: <CheckCircleOutlined /> },
  pending: { color: "warning", icon: <ClockCircleOutlined /> },
  cancelled: { color: "error", icon: <CloseCircleOutlined /> },
};

/** Small icon helper based on booking type */
const TypeIcon = ({ type, size = 16 }) => {
  const style = { fontSize: size };
  switch ((type || "").toLowerCase()) {
    case "event":
    case "conference":
      return <TagOutlined style={style} />;
    case "match":
    case "sports":
      return <TrophyOutlined style={style} />;
    case "movie":
    case "cinema":
      return <VideoCameraOutlined style={style} />;
    case "accreditationbooking":
      return <AppstoreOutlined style={style} />;
    default:
      return <TagOutlined style={style} />;
  }
};

const BookingCard = React.memo(({ booking, compact = false }) => {
  const [ticketData, setTicketData] = useState([]);
  const [ticketType, setTicketType] = useState({ id: "", type: "" });
  const [show, setShow] = useState(false);

  const { isMobile, getCurrencySymbol, formatDateRange } = useMyContext();
  const [showSendModal, setShowSendModal] = useState(false);
    const [sendData, setSendData] = useState(null);
  /** Normalize booking (supports master with .bookings[]) */
  const bookingData = useMemo(() => {
    const normalize = booking?.bookings ? booking.bookings[0] : booking || {};
    return {
      ticket: normalize?.ticket,
      quantity: booking?.bookings ? booking?.bookings?.length : (normalize?.quantity || 1),
      name: normalize?.ticket?.event?.name || normalize?.ticket?.event?.title || normalize?.ticket?.name || "—",
      amount: booking?.amount ?? normalize?.amount ?? 0,
      type: normalize?.type,
      created_at: normalize?.created_at,
      status: (normalize?.status || "confirmed").toLowerCase(),
      eventType: normalize?.ticket?.event?.event_type,
      eventAddress: normalize?.ticket?.event?.address,
      eventDateRange: normalize?.ticket?.event?.date_range,
      ticketName: normalize?.ticket?.name,
      background: normalize?.ticket?.background_image,
      id: booking?.id || booking?._id || normalize?.id || normalize?._id,
    };
  }, [booking]);

  /** Ticket preview handlers */
  const handleTicketPreview = useCallback((item, type, id) => {
    setTicketData(item);
    setTicketType({ id, type });
    setShow(true);
  }, []);

  const handleOpenSendModal = (item) => {
        setSendData(item);
        setShowSendModal(true);
    };

    const handleCloseSendModal = () => {
        setShowSendModal(false);
        setSendData(null);
    };

  const handleCloseModal = useCallback(() => {
    setTicketData([]);
    setTicketType({ id: "", type: "" });
    setShow(false);
  }, []);

  /** Status Badge */
  const StatusBadge = useMemo(() => {
    const cfg = STATUS_CONFIG[bookingData.status] || STATUS_CONFIG.confirmed;
    return (
      <Space size="small" align="center">
        <Badge status={cfg.color} />
        <Text type="secondary">{bookingData.status.toUpperCase()}</Text>
      </Space>
    );
  }, [bookingData.status]);

  /** Dropdown menu */
  const menuItems = useMemo(() => {
    const items = [
      { key: "combine", label: "Combined E-Ticket" },
    ];
    if (Array.isArray(booking?.bookings) && booking.bookings.length > 0) {
      items.push({ type: "divider" });
      items.push({ key: "individual", label: "Individual E-Tickets" });
    }
    return items;
  }, [booking]);

  const onMenuClick = useCallback(
    ({ key }) => {
      if (key === "combine") {
        handleTicketPreview(booking, "combine", bookingData.id);
      } else if (key === "individual") {
        handleTicketPreview(booking, "individual", bookingData.id);
      }
    },
    [booking, bookingData.id, handleTicketPreview]
  );

  /** Left content (image + primary info) */
  const leftContent = useMemo(
    () => (
      <Space size={16} wrap={false} style={{ width: "100%", alignItems: "flex-start" }}>
        <Image
          src={bookingData.background}
          alt={bookingData.ticketName}
          width={compact ? 80 : 100}
          height={compact ? 100 : 120}
          style={{ objectFit: "cover", borderRadius: 8 }}
          preview={false}
          fallback="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='120'/>"
          placeholder
        />
        <Space direction="vertical" size="small" style={{ minWidth: 0 }}>
          {/* Title row */}
          <Space size="small" align="start" wrap>
            <TypeIcon type={bookingData.type} />
            <Text strong style={{ fontSize: compact ? 14 : 16 }}>
              {bookingData.name}
            </Text>
            {!compact && bookingData.eventType && (
              <Tag color="blue" style={{ textTransform: "uppercase" }}>
                {bookingData.eventType}
              </Tag>
            )}
          </Space>

          {/* Status */}
          {StatusBadge}

          {/* Details */}
          <Space direction="vertical" size={2}>
            {bookingData.eventAddress && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <EnvironmentOutlined style={{ marginRight: 6 }} />
                {bookingData.eventAddress}
              </Text>
            )}

            {(bookingData.eventDateRange || bookingData.created_at) && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <CalendarOutlined style={{ marginRight: 6 }} />
                {bookingData.eventDateRange}
                {bookingData.eventDateRange && bookingData.created_at ? " • " : ""}
                {bookingData.created_at && (
                  <Tooltip title="Booked at">
                    <FieldTimeOutlined style={{ margin: "0 6px 0 2px" }} />
                  </Tooltip>
                )}
                {bookingData.created_at}
              </Text>
            )}

            {bookingData.ticketName && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <AppstoreOutlined style={{ marginRight: 6 }} />
                {bookingData.ticketName} ×{" "}
                <Text strong style={{ fontSize: 12 }}>
                  {bookingData.quantity}
                </Text>
              </Text>
            )}

            <Text type="secondary" style={{ fontSize: 12 }}>
              {/* < style={{ marginRight: 6 }} /> */}
              {getCurrencySymbol?.() || "₹"}
              {bookingData.amount}
            </Text>
          </Space>
        </Space>
      </Space>
    ),
    [bookingData, compact, StatusBadge, getCurrencySymbol]
  );

  /** Right actions */
  const rightActions = useMemo(
    () => (
      <Space direction="vertical" size="small" style={{ alignItems: "flex-end" }}>
        <Space size="small" wrap>
          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            menu={{ items: menuItems, onClick: onMenuClick }}
          >
            <Button type="primary">
              Generate E-Ticket <MoreOutlined style={{ marginLeft: 6 }} />
            </Button>
          </Dropdown>

          {/* <Button>
            Share <ShareAltOutlined style={{ marginLeft: 6 }} />
          </Button> */}
          <TicketActions
                                            onSendTickets={handleOpenSendModal}
                                            item={booking} />
        </Space>
      </Space>
    ),
    [menuItems, onMenuClick]
  );

  return (
    <>
      <Card
        size={compact ? "small" : "default"}
        bordered
        style={{ marginBottom: compact ? 12 : 16, borderRadius: 12 }}
        bodyStyle={{ padding: compact ? 16 : 20 }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {leftContent}
          {rightActions}
        </div>
      </Card>

      
      <TicketModal
        show={show}
        handleCloseModal={handleCloseModal}
        ticketType={ticketType}
        ticketData={ticketData}
        isAccreditation={ticketData?.type === 'AccreditationBooking'}
        showTicketDetails={ticketData?.type === 'AccreditationBooking'}
        formatDateRange={formatDateRange}
      /> 

      <SendTicketsModal
                show={showSendModal}
                handleClose={handleCloseSendModal}
                bookingData={bookingData}
            />
     
    </>
  );
});

BookingCard.displayName = "BookingCard";
export default BookingCard;
