import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Row, Col, Drawer, Button, Spin, Carousel } from 'antd';
import { CloudDownloadOutlined, PrinterOutlined, LeftOutlined, RightOutlined, YoutubeFilled, InstagramFilled } from '@ant-design/icons';
import { AlertCircle } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { message } from 'antd';
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
    const handleDownload = useCallback(async () => {
        if (ticketType?.type === 'individual') {
            swiperCanvasRefs.current[activeSlideIndex]?.download();
        } else if (ticketType?.type === 'combine' || ticketType?.type === 'single') {
            singleCanvasRef.current?.download();
        } else if (ticketType?.type === 'zip') {
            try {
                const zip = new JSZip();
                // Ensure refs is an array or object we can iterate. Object.values gets all valid refs.
                // We map over ticketData.bookings to ensure correct ordering if needed.
                const bookingsCount = ticketData?.bookings?.length || 0;
                let hasImages = false;

                for (let i = 0; i < bookingsCount; i++) {
                    const ref = swiperCanvasRefs.current[i];
                    if (ref && ref.isReady()) {
                        const dataUrl = ref.getDataURL();
                        if (dataUrl) {
                            const base64Data = dataUrl.split(',')[1];
                            zip.file(`ticket_${i + 1}.jpg`, base64Data, { base64: true });
                            hasImages = true;
                        }
                    }
                }

                if (hasImages) {
                    const content = await zip.generateAsync({ type: 'blob' });
                    saveAs(content, 'tickets.zip');
                    message.success('Tickets downloaded successfully!');
                } else {
                    message.error('Tickets are not ready yet. Please wait or try again.');
                }
            } catch (error) {
                console.error('Error generating ZIP:', error);
                message.error('Failed to generate ZIP file.');
            }
        }
    }, [ticketType, activeSlideIndex, ticketData]);

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

            {/* Ticket Type Notice */}
            {ticketType?.type === 'individual' && (
                <div className="alert alert-warning mb-4 py-3">
                    <p className="mb-0 small">
                        If you select single ticket, each attendee receives a personal QR code for entry,
                        and group tickets won&apos;t work.
                    </p>
                </div>
            )}

            {ticketType?.type === 'combine' && (
                <div className="alert alert-info mb-4 py-3">
                    <p className="mb-0 small">
                        If you select group ticket, all attendees must arrive together and show the group ticket
                        at the venue for entry. Individual tickets will not work.
                    </p>
                </div>
            )}

            {ticketType?.type === 'single' && (
                <ul className="mt-2 ps-3 mb-4 small">
                    <li className="mb-1">
                        To ensure a smooth and hassle-free entry, please scan your ticket before arriving at the venue.
                    </li>
                    <li className="mb-1">
                        Kindly watch the video guide for step-by-step instructions on how to scan your ticket easily.
                    </li>
                    <li>
                        Thank you, and we look forward to welcoming you!
                    </li>
                </ul>
            )}

            {/* Note */}
            <div className="text-center small text-muted mb-3">
                <strong>Note:</strong> Sharing This Ticket manually is the sole responsibility of the Event Organizer.
            </div>

            {/* Social Links */}
            <div className="d-flex justify-content-center align-items-center gap-4 pt-2 border-top">

                <a
                    href="https://www.youtube.com/@Get-Your-Ticket"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none text-white d-flex align-items-center gap-2"
                >
                    <YoutubeFilled style={{ fontSize: 20 }} />
                    <span className="small fw-semibold">YouTube</span>
                </a>

                <a
                    href="https://www.instagram.com/getyourticket.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none text-white d-flex align-items-center gap-2"
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
                        {ticketType?.type === 'individual' || ticketType?.type === 'zip' ? (
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
                                                        <p className="text-center text-secondary m-0 mt-1">
                                                            Ticket {index + 1} of {ticketData.bookings.length} (I)
                                                        </p>
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

                                                </Col>
                                            </div>
                                        ))}
                                    </Carousel>
                                </>
                            )
                        ) : ticketType?.type === 'combine' || ticketType?.type === 'single' ? (
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
                        {ticketType?.type === 'zip' ? 'Download Zip' : 'Download'}
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
            title={ticketType?.type === 'individual' ? 'Individual Tickets' : ticketType?.type === 'single' ? 'Single Ticket' : 'Group Ticket'}
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
