// BookingLayout.jsx - IMPROVED VERSION WITH CUSTOM HOOK
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Row, Col, message, Modal, Space, Button, Drawer } from 'antd';
import { FaClock } from 'react-icons/fa';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import api from 'auth/FetchInterceptor';
import Loader from 'utils/Loader';
import useBooking from './components/Usebooking';
import BookingSeatCanvas from './components/Bookingseatcanvas';
import { useMyContext } from 'Context/MyContextProvider';
const BookingLayout = forwardRef((props, ref) => {
    const { layoutId, eventId, setSelectedTkts, allowMultiple = false } = props;
    const stageRef = useRef(null);
    const { UserData, isMobile } = useMyContext();
    
    // Custom booking hook
    const {
        selectedSeats,
        setSelectedSeats,
        sections,
        setSections,
        handleSeatClick,
        handleStandingTickets,
        markSelectedSeatsAsBooked,
        updateSeatsByIds,
        maxSeats
    } = useBooking({
        maxSeats: 10,
        holdDuration: 600, // 10 minutes
        autoHoldTimeout: true,
        allowMultiple: allowMultiple
    });

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        // Mark all selected seats as booked after successful booking
        markSeatsAsBooked: () => {
            markSelectedSeatsAsBooked();
        },
        // Mark specific seat IDs as booked (for 409 conflict errors)
        markSeatIdsAsBooked: (seatIds) => {
            if (Array.isArray(seatIds) && seatIds.length > 0) {
                // Check if any of the booked seats are in user's current selection (BEFORE removing them)
                const bookedSeatIdsStr = seatIds.map(id => String(id).trim());
                const bookedFromSelection = [];

                // Check selected seats before they get removed by updateSeatsByIds
                selectedSeats.forEach(ticket => {
                    ticket.seats?.forEach(selectedSeat => {
                        const selectedSeatIdStr = String(selectedSeat.seat_id || selectedSeat.id || '').trim();
                        if (bookedSeatIdsStr.includes(selectedSeatIdStr)) {
                            bookedFromSelection.push({
                                seatName: selectedSeat.seat_name || selectedSeat.label || `Seat ${selectedSeat.seat_id}`,
                                seatId: selectedSeatIdStr
                            });
                        }
                    });
                });

                // Update seats (this will also remove them from selectedSeats)
                updateSeatsByIds(seatIds, 'booked');

                // Show alert modal if seats from user's selection were booked
                if (bookedFromSelection.length > 0) {
                    const seatNames = bookedFromSelection.map(s => s.seatName).join(', ');
                    const seatText = bookedFromSelection.length === 1 ? 'seat' : 'seats';

                    Modal.warning({
                        title: (
                            <span>
                                <FaClock style={{ marginRight: 8, color: '#B51515' }} />
                                Seat Unavailable
                            </span>
                        ),
                        content: `From your selected ${seatText}, ${seatNames} ${bookedFromSelection.length === 1 ? 'was' : 'were'} just booked by another user`,
                        okText: 'OK',
                    });
                }
            }
        },
        // Update seat status by IDs with custom status (for WebSocket updates)
        // Backend filters: only sends updates to other users, not the current user booking
        updateSeatStatus: (seatIds, status = 'booked') => {
            if (Array.isArray(seatIds) && seatIds.length > 0) {
                // Check if any of the updated seats are in user's current selection (BEFORE removing them)
                const updatedSeatIdsStr = seatIds.map(id => String(id).trim());
                const matchedFromSelection = [];

                // Check selected seats before they get removed by updateSeatsByIds
                selectedSeats.forEach(ticket => {
                    ticket.seats?.forEach(selectedSeat => {
                        const selectedSeatIdStr = String(selectedSeat.seat_id || selectedSeat.id || '').trim();
                        if (updatedSeatIdsStr.includes(selectedSeatIdStr)) {
                            matchedFromSelection.push({
                                seatName: selectedSeat.seat_name || selectedSeat.label || `Seat ${selectedSeat.seat_id}`,
                                seatId: selectedSeatIdStr
                            });
                        }
                    });
                });

                // Update seats (this will also remove them from selectedSeats if status is 'booked')
                updateSeatsByIds(seatIds, status);

                // Show alert modal if seats from user's selection were locked/booked by another user
                if (matchedFromSelection.length > 0) {
                    const seatNames = matchedFromSelection.map(s => s.seatName).join(', ');
                    const seatText = matchedFromSelection.length === 1 ? 'seat' : 'seats';
                    const actionText = status === 'locked' ? 'locked' : 'booked';

                    Modal.warning({
                        title: (
                            <span>
                                Seat Unavailable
                            </span>
                        ),
                        content: `From your selected ${seatText}, ${seatNames} ${matchedFromSelection.length === 1 ? 'was' : 'were'} just ${actionText} by another user`,
                        okText: 'OK',
                    });
                }
            }
        },
        // Clear all selections
        clearSelection: () => {
            setSelectedSeats([]);
        }
    }), [markSelectedSeatsAsBooked, updateSeatsByIds, setSelectedSeats, selectedSeats]);

    useEffect(() => {
        setSelectedTkts(selectedSeats);
    }, [selectedSeats])

    // Local state
    const [isLoading, setIsLoading] = useState(false);
    const [layoutData, setLayoutData] = useState(null);
    const [stage, setStage] = useState(null);
    const [canvasScale, setCanvasScale] = useState(1);
    const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

    // Standing Section Modal State
    const [isStandingModalVisible, setIsStandingModalVisible] = useState(false);
    const [selectedStandingSection, setSelectedStandingSection] = useState(null);
    const [standingQuantity, setStandingQuantity] = useState(0);

    const handleRemoveSeat = () => {
        setSelectedSeats([]);
    };

    // Fetch layout data with seat and ticket information
    useEffect(() => {
        let isMounted = true;
        const abortController = new AbortController();
        const fetchLayoutData = async () => {
            if (!layoutId) return;

            setIsLoading(true);
            handleRemoveSeat()
            try {
                const response = await api.get(`layout/theatre/${layoutId}?eventId=${eventId}`, {
                    signal: abortController.signal
                });

                if (!isMounted) return;

                const data = response?.data || response;
                // Process the layout data
                if (data.stage) {
                    setStage({
                        ...data.stage,
                        x: parseFloat(data.stage.x) || 0,
                        y: parseFloat(data.stage.y) || 0,
                        width: parseFloat(data.stage.width) || 800,
                        height: parseFloat(data.stage.height) || 50
                    });
                }

                if (data.sections && Array.isArray(data.sections)) {
                    // Process sections and seats with ticket information
                    const processedSections = data.sections.map(section => ({
                        ...section,
                        x: parseFloat(section.x) || 0,
                        y: parseFloat(section.y) || 0,
                        width: parseFloat(section.width) || 600,
                        height: parseFloat(section.height) || 250,
                        seatColor: section.seatColor || section.color || null,
                        rows: section.rows?.map(row => ({
                            ...row,
                            numberOfSeats: parseInt(row.numberOfSeats) || 0,
                            curve: parseFloat(row.curve) || 0,
                            spacing: parseFloat(row.spacing) || 40,
                            seatColor: row.seatColor || row.color || null,
                            seats: row.seats?.map(seat => {
                                // Filter out hold status for current user's seats
                                let seatStatus = seat.status || 'available';
                                if (seat.status === 'hold' && String(seat.hold_by) === String(UserData?.id)) {
                                    seatStatus = 'available'; // Unload hold status for current user
                                }

                                return {
                                    ...seat,
                                    number: parseInt(seat.number) || 0,
                                    x: parseFloat(seat.x) || 0,
                                    y: parseFloat(seat.y) || 0,
                                    radius: parseFloat(seat.radius) || 12,
                                    seatColor: seat.seatColor || seat.color || null,
                                    // Seat status can be: 'available', 'selected', 'booked', 'disabled'
                                    status: seatStatus,
                                    // Ticket information from relation
                                    ticket: seat.ticket || null
                                };
                            }) || []
                        })) || []
                    }));

                    setSections(processedSections);

                    // Set default zoom based on number of sections
                    const sectionCount = processedSections.length;
                    let initialZoom = 1;

                    if (sectionCount === 0 || sectionCount === 1) {
                        initialZoom = 1; // Full zoom for 0 or 1 section
                    } else if (sectionCount === 2) {
                        initialZoom = 0.9; // Slight zoom out for 2 sections
                    } else if (sectionCount <= 4) {
                        initialZoom = 0.75; // More zoom out for 3-4 sections
                    } else if (sectionCount <= 6) {
                        initialZoom = 0.6; // Further zoom out for 5-6 sections
                    } else {
                        initialZoom = 0.5; // Maximum zoom out for 7+ sections
                    }

                    setCanvasScale(initialZoom);
                }

                setLayoutData(data);
                // message.success('Layout loaded successfully');
            } catch (error) {
                if (error.name === 'AbortError') return;
                if (!isMounted) return;

                console.error('Error fetching layout:', error);
                message.error('Failed to load seating layout');
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchLayoutData();

        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [layoutId, setSections]);

    // Handle wheel zoom
    const handleWheel = (e) => {
        e.evt.preventDefault();
        const stageInst = e.target.getStage();
        const oldScale = stageInst.scaleX();
        const pointer = stageInst.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stageInst.x()) / oldScale,
            y: (pointer.y - stageInst.y()) / oldScale
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
        const clampedScale = Math.max(0.5, Math.min(newScale, 3));

        setCanvasScale(clampedScale);

        const newPos = {
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale
        };

        stageInst.position(newPos);
        setStagePosition(newPos);
        stageInst.batchDraw();
    };

    const handleStandingSectionClick = (section) => {
        setSelectedStandingSection(section);
        const ticketId = section.ticket?.id;
        if (!ticketId) {
            message.error("This section has no ticket assigned.");
            return;
        }

        const existingTicket = selectedSeats.find(t => t.id === ticketId);
        let qty = 0;
        if (existingTicket) {
            qty = existingTicket.standingQuantities?.[section.id] || 0;
        }
        setStandingQuantity(qty);
        setIsStandingModalVisible(true);
    };

    const handleConfirmStandingTickets = () => {
        if (!selectedStandingSection) return;
        handleStandingTickets(selectedStandingSection, standingQuantity);
        setIsStandingModalVisible(false);
    };

    if (isLoading) {
        return (
            <Loader />
        );
    }
    return (
        <div className="booking-layout">
            <Row gutter={16}>
                {/* Left Side - Canvas */}
                <Col xs={24} span={24}>
                    <div className='booking-canvas rounded-4 overflow-hidden' style={{ height: '33rem' }}>
                        <BookingSeatCanvas
                            stageRef={stageRef}
                            canvasScale={canvasScale}
                            stage={stage}
                            sections={sections}
                            selectedSeats={selectedSeats}
                            onSeatClick={handleSeatClick}
                            onStandingSectionClick={handleStandingSectionClick}
                            handleWheel={handleWheel}
                            setStagePosition={setStagePosition}
                            layoutId={layoutId}
                        />
                    </div>
                </Col>

                {/* Right Side - Summary */}
                {/* <Col xs={24} span={24}>
                        <BookingSummary
                            selectedSeats={selectedSeats}
                            totalAmount={totalAmount}
                            ticketCategoryCounts={ticketCategoryCounts}
                            onRemoveSeat={handleRemoveSeat}
                            onClearSelection={handleClearSelection}
                            onProceedToCheckout={handleProceedToCheckout}
                        />
                        <BookingLegend sections={sections} />
                    </Col> */}
            </Row>

            {isMobile ? (
                <Drawer
                    title={`Select Quantity for ${selectedStandingSection?.name || 'Standing Area'}`}
                    placement="bottom"
                    onClose={() => setIsStandingModalVisible(false)}
                    open={isStandingModalVisible}
                    height="auto"
                >
                    <div className="d-flex flex-column align-items-center justify-content-center py-2">
                        <div style={{ marginBottom: 16, color: '#888' }}>
                            {selectedStandingSection?.ticket?.name} (₹{selectedStandingSection?.ticket?.price})
                        </div>
                        <Space size="large" align="center">
                            <Button
                                shape="circle"
                                icon={<MinusOutlined />}
                                onClick={() => setStandingQuantity(Math.max(0, standingQuantity - 1))}
                                disabled={standingQuantity <= 0}
                            />
                            <div style={{ fontSize: 24, fontWeight: 'bold', minWidth: 40, textAlign: 'center' }}>
                                {standingQuantity}
                            </div>
                            <Button
                                shape="circle"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    const ticketLimit = selectedStandingSection?.ticket?.selection_limit ? parseInt(selectedStandingSection.ticket.selection_limit) : maxSeats;
                                    setStandingQuantity(Math.min(ticketLimit, standingQuantity + 1));
                                }}
                                disabled={standingQuantity >= (selectedStandingSection?.ticket?.selection_limit ? parseInt(selectedStandingSection.ticket.selection_limit) : maxSeats)}
                            />
                        </Space>
                        <div style={{ marginTop: 16, color: '#888', fontSize: 13, textAlign: 'center' }}>
                            Maximum {selectedStandingSection?.ticket?.selection_limit || maxSeats} tickets allowed for this category
                        </div>
                        <Button
                            type="primary"
                            block
                            size="large"
                            style={{ marginTop: 24 }}
                            onClick={handleConfirmStandingTickets}
                        >
                            Confirm Selection
                        </Button>
                    </div>
                </Drawer>
            ) : (
                <Modal
                    title={`Select Quantity for ${selectedStandingSection?.name || 'Standing Area'}`}
                    open={isStandingModalVisible}
                    onOk={handleConfirmStandingTickets}
                    onCancel={() => setIsStandingModalVisible(false)}
                    okText="Confirm"
                    centered
                    destroyOnClose
                >
                    <div className="d-flex flex-column align-items-center justify-content-center py-4">
                        <div style={{ marginBottom: 16, color: '#888' }}>
                            {selectedStandingSection?.ticket?.name} (₹{selectedStandingSection?.ticket?.price})
                        </div>
                        <Space size="large" align="center">
                            <Button
                                shape="circle"
                                icon={<MinusOutlined />}
                                onClick={() => setStandingQuantity(Math.max(0, standingQuantity - 1))}
                                disabled={standingQuantity <= 0}
                            />
                            <div style={{ fontSize: 24, fontWeight: 'bold', minWidth: 40, textAlign: 'center' }}>
                                {standingQuantity}
                            </div>
                            <Button
                                shape="circle"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    const ticketLimit = selectedStandingSection?.ticket?.selection_limit ? parseInt(selectedStandingSection.ticket.selection_limit) : maxSeats;
                                    setStandingQuantity(Math.min(ticketLimit, standingQuantity + 1));
                                }}
                                disabled={standingQuantity >= (selectedStandingSection?.ticket?.selection_limit ? parseInt(selectedStandingSection.ticket.selection_limit) : maxSeats)}
                            />
                        </Space>
                        <div style={{ marginTop: 16, color: '#888', fontSize: 13, textAlign: 'center' }}>
                            Maximum {selectedStandingSection?.ticket?.selection_limit || maxSeats} tickets allowed for this category
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
});

BookingLayout.displayName = 'BookingLayout';
export default BookingLayout;