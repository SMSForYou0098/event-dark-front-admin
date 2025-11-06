import React, { useEffect, useState } from 'react';
import { Modal, Row, Col, Carousel } from 'antd'; // Added Carousel
import { YoutubeOutlined, InstagramOutlined } from '@ant-design/icons';
// Removed Swiper import
import axios from 'axios';
import { useMyContext } from 'Context/MyContextProvider';
import IDCardDragAndDrop from '../IDCardDragAndDrop';
import AmusementTicket from '../tickets_type/AmusementTicket';
import AccreditationTicket from '../tickets_type/AccreditationTicket';
import TicketCanvas from '../Ticket_canvas';
import TicketCanvasBatch from '../TicketCanvasBatch';

const TicketModal = (props) => {
    const { convertTo12HourFormat, isMobile, api, authToken } = useMyContext();
    const { showPrintButton, showTicketDetails, show, handleCloseModal, ticketType, ticketData, formatDateRange, isAccreditation, isIdCard, card_url, bgRequired, eventId } = props;
    const [savedLayout, setSavedLayout] = useState({});
    const [userPhoto, setUserPhoto] = useState();
    const [idCardBg, setIdCardBg] = useState();

    const RetriveName = (data) => (
        data?.attendee?.Name ||
        data?.bookings?.[0]?.attendee?.Name ||
        data?.user?.name ||
        data?.bookings?.[0]?.user?.name ||
        'N/A'
    );
    const RetriveUser = (data) => (
        data?.attendee ||
        data?.bookings?.[0]?.attendee ||
        data?.user ||
        data?.bookings?.[0]?.user ||
        data ||
        'N/A'
    );
    const RetriveNumber = (data) => (
        data?.attendee?.Mo ||
        data?.bookings?.[0]?.attendee?.Mo ||
        data?.user?.number ||
        data?.bookings?.[0]?.user?.number ||
        'N/A'
    );
    const category = ticketData?.ticket?.event?.category || (ticketData?.bookings && ticketData?.bookings[0]?.ticket?.event?.category);
    const isAmusementTicket = category === 18;

    const getTicketComponent = () => {
        if (isIdCard) return IDCardDragAndDrop;
        if (isAmusementTicket) return AmusementTicket;
        if (isAccreditation) return AccreditationTicket;
        return TicketCanvas;
    };

    const Ticket = getTicketComponent();

    const fetchLayout = async () => {
        try {
            const response = await axios.get(`${api}layout/${eventId}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const layoutData = response.data?.layout || {};
            setSavedLayout(layoutData);
        } catch (error) {
            console.error("❌ Error fetching layout:", error);
            setSavedLayout({});
        }
    };

    const fetchImage = async (bg, setBg) => {
        try {
            const response = await axios.post(
                `${api}get-image/retrive`,
                { path: bg },
                { responseType: 'blob' }
            );
            const imageUrl = URL.createObjectURL(response.data);
            setBg(imageUrl);
        } catch (error) {
            console.error('Image fetch error:', error);
        }
    };

    useEffect(() => {
        if (show && isIdCard) {
            if (ticketData?.Photo) {
                fetchImage(ticketData.Photo, setUserPhoto);
            }

            if (bgRequired && card_url) {
                fetchImage(card_url, setIdCardBg);
                fetchLayout();
            }
        }
    }, [show, ticketData, card_url, bgRequired, isIdCard]);

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
                    {ticketType?.type === 'individual' ? (
                        ticketData?.bookings?.length > 0 && (
                            <Carousel
                                autoplay
                                dots
                            >
                                {ticketData.bookings.map((item, index) => {
                                    const event = item?.ticket?.event || item?.bookings[0]?.ticket?.event ||{};
                                    const ticket = item?.ticket || item?.bookings[0]?.ticket || {};
                                    console.log('ticket item:', item);
                                    return (
                                        <div key={index} style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                                            <Col span={24}>
                                                <div>
                                                    <Ticket
                                                        showDetails={showTicketDetails}
                                                        showPrintButton={showPrintButton}
                                                        category={event.category || 'N/A'}
                                                        title={event.name || 'Event Name'}
                                                        number={item?.user?.number}
                                                        user={item?.user}
                                                        ticketBG={ticket.background_image || ''}
                                                        ticketName={ticket.name || 'Ticket'}
                                                        date={formatDateRange?.(item?.booking_date || event.date_range) || 'Date Not Available'}
                                                        city={event.city || 'City'}
                                                        address={event.address || 'Address Not Specified'}
                                                        time={convertTo12HourFormat(event.start_time) || 'Time Not Set'}
                                                        OrderId={item?.order_id || item?.token || 'N/A'}
                                                        quantity={1}
                                                        idCardBg={idCardBg}
                                                        bgRequired={bgRequired}
                                                        ticketNumber={index + 1}
                                                    />
                                                </div>
                                                <p style={{ textAlign: "center", color: "#888" }}>{index + 1}</p>
                                            </Col>
                                        </div>
                                    );
                                })}
                            </Carousel>
                        )
                    ) : ticketType?.type === 'combine' ? (
                        <div style={{ height: "auto" }}>
                            <Col span={24}>
                                <div>
                                    <Ticket
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
                                                (ticketData?.booking_date ||
                                                    ticketData?.bookings?.[0]?.booking_date) ||
                                                (ticketData?.ticket?.event?.date_range ||
                                                    ticketData?.bookings?.[0]?.ticket?.event?.date_range)
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
                                </div>
                            </Col>
                        </div>
                    ) : ticketType?.type === 'zip' ? (
                        <TicketCanvasBatch
                            isMobile={isMobile}
                            ticketData={ticketData}
                            formatDateRange={formatDateRange}
                            convertTo12HourFormat={convertTo12HourFormat}
                        />
                    ) : null}
                </Col>
            </Row>
            <div style={{ textAlign: "center", fontSize: "13px", padding: "8px 0 0 0" }}>
                <strong>Go paperless! </strong>download your pass and enjoy easy entry with GetYourTicket.in.
                <span className='fw-bold'>
                    Watch the video to get entry without any hassle
                    <a
                        href="https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
                        target="_blank"
                        rel="noopener noreferrer"
                        className='text-primary fw-bold'
                    >
                        <YoutubeOutlined size={16} className='mx-2' />
                    </a>
                    &
                    <a
                        href="https://www.instagram.com/YOUR_INSTAGRAM_LINK"
                        target="_blank"
                        rel="noopener noreferrer"
                        className='text-primary fw-bold'
                    >
                        <InstagramOutlined size={16} className='mx-2' />
                    </a>
                </span>
            </div>
        </Modal>
    );
};

export default TicketModal;