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
  EnvironmentOutlined,
  //   RupeeOutlined,
  AppstoreOutlined,
  MoreOutlined,
  TagOutlined,
  FieldTimeOutlined,
  VideoCameraOutlined,
  TrophyOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useMyContext } from "Context/MyContextProvider";
import TicketDrawer from "../Tickets/modals/TicketDrawer";
import TicketActions from "../Tickets/modals/TicketActions";
import ReassignTokenModal from "./components/ReassignTokenModal";
import PermissionChecker from "layouts/PermissionChecker";
import ReassignmentHistoryDrawer from "./components/ReassignmentHistoryDrawer";
import TransferBookingDrawer from "./components/TransferBookingDrawer";
import { useParams } from "react-router-dom";
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

const BookingCard = React.memo(({ booking, compact = false, showAction, isBoxOffice = false, onTransferSuccess }) => {
  const [ticketData, setTicketData] = useState([]);
  const [ticketType, setTicketType] = useState({ id: "", type: "" });
  const [show, setShow] = useState(false);
  const {id} = useParams();
  const { getCurrencySymbol, formatDateRange, formatDateTime } = useMyContext();
  const [showTransferDrawer, setShowTransferDrawer] = useState(false);
  /** Normalize booking (supports master with .bookings[]) */
  const bookingData = useMemo(() => {
    const normalize = booking?.bookings ? booking.bookings[0] : booking || {};
    return {
      ticket: normalize?.ticket,
      quantity: booking?.bookings ? booking?.bookings?.length : (normalize?.quantity || 1),
      name: normalize?.ticket?.event?.name || normalize?.ticket?.event?.title || normalize?.ticket?.name || "—",
      amount: booking?.amount ?? normalize?.amount ?? 0,
      type: normalize?.type,
      created_at: formatDateTime(normalize?.created_at),
      status: (normalize?.status || "confirmed").toLowerCase(),
      eventType: normalize?.ticket?.event?.event_type,
      eventAddress: normalize?.ticket?.event?.address,
      eventDateRange: normalize?.ticket?.event?.date_range,
      ticketName: normalize?.ticket?.name,
      background: normalize?.event?.event_media?.thumbnail,
      id: booking?.id || booking?._id || normalize?.id || normalize?._id,
    };
  }, [booking, formatDateTime]);

  /** Ticket preview handlers */
  const handleTicketPreview = useCallback((item, type, id) => {
    setTicketData(item);
    setTicketType({ id, type });
    setShow(true);
  }, []);

  const handleOpenTransferDrawer = () => {
    setShowTransferDrawer(true);
  };

  const handleCloseTransferDrawer = () => {
    setShowTransferDrawer(false);
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

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleOpenReassignModal = () => setShowReassignModal(true);
  const handleCloseReassignModal = () => setShowReassignModal(false);

  /** Right actions */
  const rightActions = useMemo(() => (
    <div className="w-100 mt-2">
  
        {/* Left side actions */}
        {isBoxOffice && booking?.card_token && (
          <div className="col-12 col-md-auto">
            <PermissionChecker role={["Admin", "Organizer", "Box Office"]}>
              <div className="d-flex flex-column flex-md-row gap-2">
                <Button
                  type="primary"
                  danger
                  onClick={handleOpenReassignModal}
                >
                  Reassign Token
                </Button>
  
                <Button
                  type="default"
                  icon={<HistoryOutlined />}
                  onClick={() => setShowHistoryModal(true)}
                >
                  View History
                </Button>
              </div>
            </PermissionChecker>
          </div>
        )}
  
        {/* Right side actions */}
        {showAction && (
            <div className="d-flex justify-content-between align-items-center">
  
  
              <TicketActions
                onSendTickets={handleOpenTransferDrawer}
                item={booking}
                userId={id}
              />
              <Dropdown
                trigger={["click"]}
                placement="bottomRight"
                menu={{ items: menuItems, onClick: onMenuClick }}
              >
                <Button type="primary">
                  Generate E-Ticket
                  <MoreOutlined style={{ marginLeft: 6 }} />
                </Button>
              </Dropdown>
            </div>
        )}
  
    </div>
  ), [
    menuItems,
    onMenuClick,
    isBoxOffice,
    booking,
    showAction
  ]);

  return (
    <>
      <Card
        size={compact ? "small" : "default"}
        bordered
        style={{ marginBottom: compact ? 12 : 16, borderRadius: 12 }}
      >
        <div className="d-flex flex-column justify-content-between align-items-center gap-2 p-0 m-0">

          {leftContent}
          {rightActions}
        </div>
      </Card>


      <TicketDrawer
        show={show}
        handleCloseModal={handleCloseModal}
        ticketType={ticketType}
        ticketData={ticketData}
        isAccreditation={ticketData?.type === 'AccreditationBooking'}
        // showTicketDetails={ticketData?.type === 'AccreditationBooking'}
        formatDateRange={formatDateRange}
        showTicketDetails={true}
      />

      <TransferBookingDrawer
        visible={showTransferDrawer}
        onClose={handleCloseTransferDrawer}
        booking={booking}
        onTransferSuccess={onTransferSuccess}
      />

      <ReassignTokenModal
        bookingId={booking?.id}
        visible={showReassignModal}
        onClose={handleCloseReassignModal}
      />

      <ReassignmentHistoryDrawer
        bookingId={booking?.id}
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

    </>
  );
});

BookingCard.displayName = "BookingCard";
export default BookingCard;
