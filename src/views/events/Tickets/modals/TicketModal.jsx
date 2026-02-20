import React, { useEffect, useRef, useState } from 'react';
import { Modal, Row, Col, Carousel, Button, Spin } from 'antd';
import { CloudDownloadOutlined, LeftOutlined, PrinterOutlined, RightOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useMyContext } from 'Context/MyContextProvider';
import IDCardDragAndDrop from '../IDCardDragAndDrop';
import AmusementTicket from '../tickets_type/AmusementTicket';
import AccreditationTicket from '../tickets_type/AccreditationTicket';
import TicketCanvasView from '../TicketCanvasView';
import TicketCanvasBatch from '../TicketCanvasBatch';

const TicketModal = (props) => {
    const { convertTo12HourFormat, isMobile, api, authToken, formatDateRange } = useMyContext();
    const {
        showPrintButton,
        showTicketDetails,
        show,
        handleCloseModal,
        ticketType,
        ticketData,
        isAccreditation,
        isIdCard,
        card_url,
        bgRequired,
        eventId,
    } = props;

    // State for special ticket types (IDCard etc.)
    const [savedLayout, setSavedLayout] = useState({});
    const [userPhoto, setUserPhoto] = useState();
    const [idCardBg, setIdCardBg] = useState();

    // Canvas state
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);

    // Refs for download / print via TicketCanvasView
    const singleCanvasRef = useRef(null);
    const swiperCanvasRefs = useRef({});

    // ─── Special ticket type detection ────────────────────────────────────────
    const category =
        ticketData?.ticket?.event?.category ||
        (ticketData?.bookings && ticketData?.bookings[0]?.ticket?.event?.category);
    const isAmusementTicket = category === 18;
    const isSpecialTicket = isIdCard || isAmusementTicket || isAccreditation;

    const getSpecialTicketComponent = () => {
        if (isIdCard) return IDCardDragAndDrop;
        if (isAmusementTicket) return AmusementTicket;
        if (isAccreditation) return AccreditationTicket;
        return null;
    };
    const SpecialTicket = getSpecialTicketComponent();

    // ─── Helper extractors (for special ticket types) ─────────────────────────
    const RetriveName = (data) =>
        data?.attendee?.Name ||
        data?.bookings?.[0]?.attendee?.Name ||
        data?.user?.name ||
        data?.bookings?.[0]?.user?.name ||
        'N/A';

    const RetriveUser = (data) =>
        data?.attendee ||
        data?.bookings?.[0]?.attendee ||
        data?.user ||
        data?.bookings?.[0]?.user ||
        data ||
        'N/A';

    const RetriveNumber = (data) =>
        data?.attendee?.Mo ||
        data?.bookings?.[0]?.attendee?.Mo ||
        data?.user?.number ||
        data?.bookings?.[0]?.user?.number ||
        'N/A';

    // ─── TanStack Query: pre-fetch & cache background image ───────────────────
    const ticketBgUrl =
        ticketData?.ticket?.background_image ||
        ticketData?.bookings?.[0]?.ticket?.background_image ||
        '';

    const { data: cachedBgImage, isLoading: isBgLoading } = useQuery({
        queryKey: ['ticket-modal-bg', ticketBgUrl, api],
        queryFn: () =>
            axios
                .post(`${api}get-image/retrive`, { path: ticketBgUrl }, { responseType: 'blob' })
                .then((r) => URL.createObjectURL(r.data)),
        enabled: show && !!ticketBgUrl && !isSpecialTicket,
        staleTime: 1000 * 60 * 30, // 30 min
        retry: 1,
    });

    // ─── Special-ticket helpers: fetch image & layout ─────────────────────────
    const fetchImage = async (bg, setBg) => {
        try {
            const response = await axios.post(
                `${api}get-image/retrive`,
                { path: bg },
                { responseType: 'blob' }
            );
            setBg(URL.createObjectURL(response.data));
        } catch (error) {
            console.error('Image fetch error:', error);
        }
    };

    const fetchLayout = async () => {
        try {
            const response = await axios.get(`${api}layout/${eventId}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setSavedLayout(response.data?.layout || {});
        } catch (error) {
            console.error('❌ Error fetching layout:', error);
            setSavedLayout({});
        }
    };

    useEffect(() => {
        if (show && isIdCard) {
            if (ticketData?.Photo) fetchImage(ticketData.Photo, setUserPhoto);
            if (bgRequired && card_url) {
                fetchImage(card_url, setIdCardBg);
                fetchLayout();
            }
        }
    }, [show, ticketData, card_url, bgRequired, isIdCard]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Reset state when modal opens / closes ────────────────────────────────
    useEffect(() => {
        if (!show) {
            setIsCanvasReady(false);
            setActiveSlideIndex(0);
        }
    }, [show]);

    // ─── Download / Print handlers ────────────────────────────────────────────
    const handleDownload = () => {
        if (ticketType?.type === 'individual') {
            swiperCanvasRefs.current[activeSlideIndex]?.download();
        } else {
            singleCanvasRef.current?.download();
        }
    };

    const handlePrint = () => {
        if (ticketType?.type === 'individual') {
            swiperCanvasRefs.current[activeSlideIndex]?.print();
        } else {
            singleCanvasRef.current?.print();
        }
    };

    return (
        <Modal
            open={show}
            onCancel={handleCloseModal}
            width={ticketType?.type === 'zip' ? 1200 : 600}
            footer={null}
            style={{ top: -200 }}
        >
            <Row>
                <Col span={24}>
                    {/* ── ZIP / Batch ──────────────────────────────────────────── */}
                    {ticketType?.type === 'zip' ? (
                        <TicketCanvasBatch
                            isMobile={isMobile}
                            ticketData={ticketData}
                            formatDateRange={formatDateRange}
                            convertTo12HourFormat={convertTo12HourFormat}
                        />
                    ) : isSpecialTicket ? (
                        /* ── Special tickets (IDCard / Amusement / Accreditation) ── */
                        <div style={{ height: 'auto' }}>
                            <Col span={24}>
                                <SpecialTicket
                                    ticketData={ticketData}
                                    userPhoto={userPhoto}
                                    showDetails={showTicketDetails}
                                    showPrintButton={showPrintButton}
                                    number={RetriveNumber(ticketData)}
                                    userName={RetriveName(ticketData)}
                                    user={RetriveUser(ticketData)}
                                    photo={
                                        ticketData?.attendee?.Photo ||
                                        ticketData?.bookings?.[0]?.attendee?.Photo ||
                                        'N/A'
                                    }
                                    ticketName={
                                        ticketData?.ticket?.name ||
                                        ticketData?.bookings?.[0]?.ticket?.name ||
                                        'Ticket Name'
                                    }
                                    category={
                                        ticketData?.ticket?.event?.category ||
                                        ticketData?.bookings?.[0]?.ticket?.event?.category ||
                                        'Category'
                                    }
                                    ticketBG={
                                        ticketData?.ticket?.background_image ||
                                        ticketData?.bookings?.[0]?.ticket?.background_image ||
                                        ''
                                    }
                                    title={
                                        ticketData?.ticket?.event?.name ||
                                        ticketData?.bookings?.[0]?.ticket?.event?.name ||
                                        'Event Name'
                                    }
                                    date={
                                        formatDateRange?.(
                                            ticketData?.created_at ||
                                            ticketData?.bookings?.[0]?.created_at ||
                                            ticketData?.ticket?.event?.date_range ||
                                            ticketData?.bookings?.[0]?.ticket?.event?.date_range
                                        ) || 'Date Not Available'
                                    }
                                    city={
                                        ticketData?.ticket?.event?.city ||
                                        ticketData?.bookings?.[0]?.ticket?.event?.city ||
                                        'City'
                                    }
                                    address={
                                        ticketData?.ticket?.event?.address ||
                                        ticketData?.bookings?.[0]?.ticket?.event?.address ||
                                        'Address Not Specified'
                                    }
                                    time={
                                        convertTo12HourFormat(
                                            ticketData?.ticket?.event?.start_time ||
                                            ticketData?.bookings?.[0]?.ticket?.event?.start_time
                                        ) || 'Time Not Set'
                                    }
                                    OrderId={ticketData?.order_id || ticketData?.token || 'N/A'}
                                    orderId={ticketData?.order_id || ticketData?.token || 'N/A'}
                                    quantity={ticketData?.bookings?.length || 1}
                                    finalImage={idCardBg}
                                    {...(savedLayout ? { savedLayout } : {})}
                                    userData={RetriveUser(ticketData)}
                                    userImage={userPhoto}
                                    bgRequired={bgRequired}
                                    isEdit={false}
                                    download={true}
                                    print={true}
                                    isCircle={savedLayout?.user_photo?.isCircle || false}
                                    handleCloseModal={handleCloseModal}
                                />
                            </Col>
                        </div>
                    ) : (
                        /* ── Standard tickets ────────────────────────────────── */
                        <>
                            {/* Loading spinner while pre-fetching background */}
                            {isBgLoading && (
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        minHeight: 300,
                                    }}
                                >
                                    <Spin size="large" />
                                </div>
                            )}

                            {/* Individual tickets – Carousel */}
                            {!isBgLoading && ticketType?.type === 'individual' &&
                                ticketData?.bookings?.length > 0 && (
                                    <Carousel
                                        dots={false}
                                        arrows
                                        draggable
                                        className="cursor-grab"
                                        prevArrow={<LeftOutlined className="text-primary" />}
                                        nextArrow={<RightOutlined className="text-primary" />}
                                        afterChange={(current) => setActiveSlideIndex(current)}
                                    >
                                        {ticketData.bookings.map((item, index) => (
                                            <div key={index}>
                                                <Col span={24}>
                                                    <TicketCanvasView
                                                        ref={(el) => {
                                                            swiperCanvasRefs.current[index] = el;
                                                        }}
                                                        showDetails={showTicketDetails}
                                                        ticketData={item}
                                                        ticketNumber={index + 1}
                                                        ticketLabel="(I)"
                                                        onReady={() => {
                                                            if (index === 0) setIsCanvasReady(true);
                                                        }}
                                                        preloadedImage={cachedBgImage}
                                                    />
                                                    <p className="p-0 m-0 text-center">
                                                        {index + 1}
                                                    </p>
                                                </Col>
                                            </div>
                                        ))}
                                    </Carousel>
                                )}

                            {/* Combined / group ticket */}
                            {!isBgLoading && ticketType?.type === 'combine' && (
                                <div style={{ height: 'auto' }}>
                                    <Col span={24}>
                                        <TicketCanvasView
                                            ref={singleCanvasRef}
                                            showDetails={showTicketDetails}
                                            ticketData={ticketData}
                                            ticketNumber={1}
                                            ticketLabel="(G)"
                                            onReady={() => setIsCanvasReady(true)}
                                            preloadedImage={cachedBgImage}
                                        />
                                        <p className="p-0 m-0 text-center">(G)</p>
                                    </Col>
                                </div>
                            )}
                        </>
                    )}
                </Col>
            </Row>

            {/* Download / Print buttons – only for standard tickets */}
            {!isSpecialTicket && ticketType?.type !== 'zip' && (
                <Row justify="center" className="mt-3 mb-2">
                    <Col xs={24} sm={12}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Button
                                type="primary"
                                block
                                icon={<CloudDownloadOutlined />}
                                loading={!isCanvasReady || isBgLoading}
                                disabled={!isCanvasReady || isBgLoading}
                                onClick={handleDownload}
                            >
                                {!isCanvasReady || isBgLoading ? 'Please Wait...' : 'Download'}
                            </Button>
                            {showPrintButton && (
                                <Button
                                    type="default"
                                    block
                                    icon={<PrinterOutlined />}
                                    loading={!isCanvasReady || isBgLoading}
                                    disabled={!isCanvasReady || isBgLoading}
                                    onClick={handlePrint}
                                >
                                    Print
                                </Button>
                            )}
                        </div>
                    </Col>
                </Row>
            )}

            <div className="text-center h6">
                Note: Sharing This Ticket manually is the sole responsibility of the Event Organizer.
            </div>
        </Modal>
    );
};

export default TicketModal;