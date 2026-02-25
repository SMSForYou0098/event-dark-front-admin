import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Row, Col, Drawer, Button, Spin, Carousel } from 'antd';
import { CloudDownloadOutlined, PrinterOutlined, LeftOutlined, RightOutlined, YoutubeFilled, InstagramFilled } from '@ant-design/icons';
import { AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMyContext } from 'Context/MyContextProvider';
import TicketCanvasView from '../TicketCanvasView';
import { fetchTicketBgBlobUrl } from '../utils/fetchTicketBg';

/**
 * TicketDrawer - Common drawer component for ticket display
 * Used by: summary page, bookings page
 * 
 * Props:
 * - show: boolean - whether drawer is open
 * - handleCloseModal: function - callback to close drawer (matching modal)
 * - onClose: function - callback to close drawer
 * - ticketType: { type: 'individual' | 'combine', id: string }
 * - ticketData: object - booking data including tickets
 * - showPrintButton: boolean - whether to show print button
 * - showTicketDetails: boolean - whether to show ticket details on canvas
 */
const TicketDrawer = ({
    show,
    handleCloseModal,
    onClose,
    ticketType,
    ticketData,
    showPrintButton = false,
    showTicketDetails = true,
}) => {
    const { isMobile, api } = useMyContext();
    const handleClose = onClose || handleCloseModal;

    // State for showing ticket after user confirms notice
    const [showTicket, setShowTicket] = useState(false);
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);

    // Refs for canvas download functionality
    const singleCanvasRef = useRef(null);
    const swiperCanvasRefs = useRef({});

    // Get ticket background URL from first booking
    const ticketBgUrl = ticketData?.ticket?.background_image ||
        ticketData?.bookings?.[0]?.ticket?.background_image || '';

    // Pre-fetch and cache the ticket background image
    const { data: cachedBgImage, isLoading: isBgLoading } = useQuery({
        queryKey: ['ticket-drawer-bg', ticketBgUrl, api],
        queryFn: () => fetchTicketBgBlobUrl(api, ticketBgUrl),
        enabled: show && !!ticketBgUrl,
        staleTime: 1000 * 60 * 30, // 30 minutes
        retry: 1,
    });

    const isImageReady = !isBgLoading;
    const bgImageForCanvas = cachedBgImage ?? null;

    // Reset state when drawer opens/closes
    useEffect(() => {
        if (!show) {
            setShowTicket(false);
            setIsCanvasReady(false);
            setActiveSlideIndex(0);
        }
    }, [show]);

    // Handle generate ticket click
    const handleGenerateTicket = useCallback(() => {
        setShowTicket(true);
    }, []);

    // Handle download click
    const handleDownload = useCallback(() => {
        if (ticketType?.type === 'individual') {
            swiperCanvasRefs.current[activeSlideIndex]?.download();
        } else {
            singleCanvasRef.current?.download();
        }
    }, [ticketType, activeSlideIndex]);

    // Handle print click
    const handlePrint = useCallback(() => {
        if (ticketType?.type === 'individual') {
            swiperCanvasRefs.current[activeSlideIndex]?.print();
        } else {
            singleCanvasRef.current?.print();
        }
    }, [ticketType, activeSlideIndex]);

    // Drawer content - Notice before generating ticket
    const noticeContent = (
        <div className="p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
                <AlertCircle size={24} className="text-warning" />
                <h6 className="mb-0 fw-bold">Important Information</h6>
            </div>

            {ticketType?.type === 'individual' && (
                <div className="alert alert-warning mb-3">
                    <h6 className="alert-heading mb-2 fw-bold">Single Ticket</h6>
                    <p className="mb-0">
                        If you select single ticket, each attendee receives a personal QR code for entry,
                        and group tickets won&apos;t work.
                    </p>
                </div>
            )}

            {ticketType?.type === 'combine' && (
                <div className="alert alert-info mb-3">
                    <h6 className="alert-heading mb-2 fw-bold">Group Ticket</h6>
                    <p className="mb-0">
                        If you select group ticket, all attendees must arrive together and show the group ticket
                        at the venue for entry. Individual tickets will not work.
                    </p>
                </div>
            )}
            <div className="text-center h6">
                Note: Sharing This Ticket manually is the sole responsibility of the Event Organizer.
            </div>

            <div className="d-flex justify-content-center align-items-center gap-4 mt-3 mb-1">
                <a
                    href="https://www.youtube.com/@Get-Your-Ticket"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none text-white d-flex align-items-center"
                    style={{ gap: 6, marginRight: 10 }}
                >
                    <YoutubeFilled style={{ fontSize: 20 }} />
                    <span className="small fw-semibold">YouTube</span>
                </a>
                <a
                    href="https://www.instagram.com/getyourticket.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none text-white d-flex align-items-center"
                    style={{ gap: 6 }}
                >
                    <InstagramFilled style={{ fontSize: 20 }} />
                    <span className="small fw-semibold">Instagram</span>
                </a>
            </div>

        </div>
    );

    // Drawer content - Ticket display after user confirms
    const ticketContent = (
        <div className="p-3">
            {/* Loading state */}
            {!isImageReady && (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                    <Spin size="large" />
                </div>
            )}

            {/* Ticket Canvas */}
            {isImageReady && (
                <Row>
                    <Col span={24}>
                        {ticketType?.type === 'individual' ? (
                            ticketData?.bookings?.length > 0 && (
                                <>
                                    {isMobile && ticketData.bookings.length > 1 && (
                                        <div className="d-flex justify-content-center align-items-center gap-2 mb-2 text-secondary small">
                                            <LeftOutlined />
                                            <span>Swipe to see all tickets</span>
                                            <RightOutlined />
                                        </div>
                                    )}
                                <Carousel
                                    dots={false}
                                    arrows={true}
                                    draggable
                                    className="cursor-grab pb-4 custom-ticket-carousel"
                                    prevArrow={<div className="custom-arrow left-arrow"><LeftOutlined /></div>}
                                    nextArrow={<div className="custom-arrow right-arrow"><RightOutlined /></div>}
                                    afterChange={(current) => setActiveSlideIndex(current)}
                                >
                                    {ticketData.bookings.map((item, index) => (
                                        <div key={index}>
                                            <Col span={24}>
                                                <div>
                                                    <TicketCanvasView
                                                        ref={(el) => { swiperCanvasRefs.current[index] = el; }}
                                                        showDetails={showTicketDetails}
                                                        ticketData={item}
                                                        ticketNumber={index + 1}
                                                        ticketLabel="(I)"
                                                        onReady={() => {
                                                            setIsCanvasReady(true);
                                                        }}
                                                        preloadedImage={bgImageForCanvas}
                                                    />
                                                </div>
                                                <p className="text-center text-secondary m-0 mt-1">
                                                    Ticket {index + 1} of {ticketData.bookings.length} (I)
                                                </p>
                                            </Col>
                                        </div>
                                    ))}
                                </Carousel>
                                </>
                            )
                        ) : ticketType?.type === 'combine' ? (
                            <div style={{ height: "auto" }}>
                                <Col span={24}>
                                    <div>
                                        <TicketCanvasView
                                            ref={singleCanvasRef}
                                            showDetails={showTicketDetails}
                                            ticketData={ticketData}
                                            ticketNumber={1}
                                            ticketLabel="(G)"
                                            onReady={() => setIsCanvasReady(true)}
                                            preloadedImage={bgImageForCanvas}
                                        />
                                    </div>
                                    <p className="text-center text-secondary m-0 mt-2">(G)</p>
                                </Col>
                            </div>
                        ) : null}
                    </Col>
                </Row>
            )}
        </div>
    );

    const drawerFooter = showTicket ? (
        <div className="p-2">
            <div className="text-center text-secondary small mb-3">
                <p className="mb-0">No physical ticket needed! Download your Ticket & enjoy unlimited fun.</p>
            </div>
            <Row justify="center">
                <Col xs={24} sm={16} className="d-flex justify-content-center gap-2">
                    <Button
                        type="primary"
                        icon={<CloudDownloadOutlined />}
                        loading={!isCanvasReady}
                        disabled={!isCanvasReady}
                        className="flex-grow-1"
                        onClick={handleDownload}
                    >
                        Download
                    </Button>

                    {showPrintButton && (
                        <Button
                            type="default"
                            icon={<PrinterOutlined />}
                            loading={!isCanvasReady}
                            disabled={!isCanvasReady}
                            className="flex-grow-1"
                            onClick={handlePrint}
                        >
                            Print
                        </Button>
                    )}
                </Col>
            </Row>
        </div>
    ) : (
        <div className="p-2">
            <Row justify="center">
                <Col xs={24} sm={16}>
                    <Button
                        type="primary"
                        block
                        size="large"
                        onClick={handleGenerateTicket}
                        loading={!isImageReady}
                    >
                        Generate Ticket
                    </Button>
                </Col>
            </Row>
        </div>
    );

    return (
        <Drawer
            title={ticketType?.type === 'individual' ? 'Individual Tickets' : 'Group Ticket'}
            placement="right"
            closable={true}
            onClose={handleClose}
            open={show}
            width={isMobile ? '100%' : 500}
            footer={drawerFooter}
            styles={{ body: { padding: 0 } }}
        >
            {showTicket ? ticketContent : noticeContent}
        </Drawer>
    );
};

export default TicketDrawer;
