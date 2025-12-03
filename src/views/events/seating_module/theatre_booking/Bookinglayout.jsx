// BookingLayout.jsx - IMPROVED VERSION WITH CUSTOM HOOK
import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, message } from 'antd';
import api from 'auth/FetchInterceptor';
import Loader from 'utils/Loader';
import useBooking from './components/Usebooking';
import BookingSeatCanvas from './components/Bookingseatcanvas';
const BookingLayout = (props) => {
    const { layoutId, eventId, setSelectedTkts } = props;
    const stageRef = useRef(null);

    // Custom booking hook
    const {
        selectedSeats,
        setSelectedSeats,
        sections,
        setSections,
        handleSeatClick,
    } = useBooking({
        maxSeats: 10,
        holdDuration: 600, // 10 minutes
        autoHoldTimeout: true
    });

    useEffect(() => {
        setSelectedTkts(selectedSeats);
    }, [selectedSeats])

    // Local state
    const [isLoading, setIsLoading] = useState(false);
    const [layoutData, setLayoutData] = useState(null);
    const [stage, setStage] = useState(null);
    const [canvasScale, setCanvasScale] = useState(1);
    const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

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
                        rows: section.rows?.map(row => ({
                            ...row,
                            numberOfSeats: parseInt(row.numberOfSeats) || 0,
                            curve: parseFloat(row.curve) || 0,
                            spacing: parseFloat(row.spacing) || 40,
                            seats: row.seats?.map(seat => ({
                                ...seat,
                                number: parseInt(seat.number) || 0,
                                x: parseFloat(seat.x) || 0,
                                y: parseFloat(seat.y) || 0,
                                radius: parseFloat(seat.radius) || 12,
                                // Seat status can be: 'available', 'selected', 'booked', 'disabled'
                                status: seat.status || 'available',
                                // Ticket information from relation
                                ticket: seat.ticket || null
                            })) || []
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
                message.success('Layout loaded successfully');
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

    if (isLoading) {
        return (
            <Loader />
        );
    }
    return (
        <div className="booking-layout">
            <Card bodyStyle={{ padding: 0 }}>

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
                                handleWheel={handleWheel}
                                setStagePosition={setStagePosition}
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
            </Card>


        </div>
    );
};

export default BookingLayout;