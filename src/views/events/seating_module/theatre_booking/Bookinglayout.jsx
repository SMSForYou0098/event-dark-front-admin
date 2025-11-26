// BookingLayout.jsx - IMPROVED VERSION WITH CUSTOM HOOK
import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Button, message, Modal, Form, Input } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
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
        timeRemaining,
        isTimerActive,
        setSections,
        handleSeatClick,
        getTotalAmount,
        getTicketCounts,
        validateBooking,
        markSeatsAsBooked,
        extendTimer,
        maxSeats
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
    const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [form] = Form.useForm();

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

    // Proceed to checkout
    const handleProceedToCheckout = () => {
        if (selectedSeats.length === 0) {
            message.warning('Please select at least one seat');
            return;
        }
        setIsCheckoutModalVisible(true);
    };

    // Handle booking submission
    const handleBooking = async (values) => {
        // Validate booking data
        const validation = validateBooking({
            eventId,
            layoutId,
            ...values
        });

        if (!validation.valid) {
            validation.errors.forEach(error => message.error(error));
            return;
        }

        setIsProcessing(true);

        try {
            const totalAmount = getTotalAmount();

            const bookingData = {
                eventId: eventId,
                layoutId: layoutId,
                customerName: values.customerName,
                customerEmail: values.customerEmail,
                customerPhone: values.customerPhone,
                seats: selectedSeats.map(seat => ({
                    seatId: seat.id,
                    sectionId: seat.sectionId,
                    rowId: seat.rowId,
                    ticketId: seat.ticket?.id,
                    price: parseFloat(seat.ticket?.price || 0)
                })),
                totalAmount: totalAmount,
                bookingDate: new Date().toISOString()
            };

            const response = await api.post('booking/create', bookingData);

            message.success('Booking confirmed successfully!');
            setIsCheckoutModalVisible(false);
            form.resetFields();

            // Mark seats as booked
            markSeatsAsBooked();

            // Optional: Navigate to confirmation page
            // navigate(`/booking-confirmation/${response.bookingId}`);

        } catch (error) {
            console.error('Booking error:', error);
            message.error('Failed to complete booking. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle extend time
    const handleExtendTime = () => {
        extendTimer(300); // Add 5 more minutes
    };

    if (isLoading) {
        return (
            <Loader />
        );
    }

    const totalAmount = getTotalAmount();
    const ticketCategoryCounts = getTicketCounts();

    return (
        <div className="booking-layout">
            <Card
                // title={layoutData?.name || 'Select Your Seats'}
                // extra={
                //         <div className="d-flex gap-3 align-items-center">
                //             {/* Timer Display */}
                //             {isTimerActive && selectedSeats.length > 0 && (
                //                 <div className="d-flex align-items-center gap-2 px-3 py-2 bg-light rounded">
                //                     <ClockCircleOutlined style={{ color: timeRemaining < 60 ? '#ff4d4f' : '#1890ff' }} />
                //                     <span style={{
                //                         fontWeight: 'bold',
                //                         color: timeRemaining < 60 ? '#ff4d4f' : '#1890ff'
                //                     }}>
                //                         {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                //                     </span>
                //                     {timeRemaining < 120 && (
                //                         <Button size="small" type="link" onClick={handleExtendTime}>
                //                             Extend
                //                         </Button>
                //                     )}
                //                 </div>
                //             )}

                //             {/* Checkout Button */}
                //             <Button
                //                 type="primary"
                //                 icon={<ShoppingCartOutlined />}
                //                 onClick={handleProceedToCheckout}
                //                 disabled={selectedSeats.length === 0}
                //             >
                //                 Checkout ({selectedSeats.length}/{maxSeats}) - ₹{totalAmount.toFixed(2)}
                //             </Button>
                //         </div>
                //     }
                bodyStyle={{ padding: 0 }}
            >

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

            {/* Checkout Modal */}
            <Modal
                title="Complete Your Booking"
                open={isCheckoutModalVisible}
                onCancel={() => setIsCheckoutModalVisible(false)}
                footer={null}
                width={600}
            >
                <div className="mb-4">
                    <h6>Booking Summary</h6>
                    <div className="p-3 bg-light rounded">
                        <div className="d-flex justify-content-between mb-2">
                            <span>Total Seats:</span>
                            <strong>{selectedSeats.length}</strong>
                        </div>
                        {Object.entries(ticketCategoryCounts).map(([name, data]) => (
                            <div key={name} className="d-flex justify-content-between mb-1">
                                <span>{name} × {data.count}:</span>
                                <span>₹{(data.price * data.count).toFixed(2)}</span>
                            </div>
                        ))}
                        <hr />
                        <div className="d-flex justify-content-between">
                            <strong>Total Amount:</strong>
                            <strong className="text-primary">₹{totalAmount.toFixed(2)}</strong>
                        </div>
                    </div>

                    {/* Time Warning */}
                    {isTimerActive && timeRemaining < 120 && (
                        <div className="alert alert-warning mt-3 mb-0">
                            <ClockCircleOutlined /> Hurry! Only {Math.floor(timeRemaining / 60)} minute(s) remaining to complete booking
                        </div>
                    )}
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleBooking}
                >
                    <Form.Item
                        label="Full Name"
                        name="customerName"
                        rules={[{ required: true, message: 'Please enter your name' }]}
                    >
                        <Input placeholder="Enter your full name" />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="customerEmail"
                        rules={[
                            { required: true, message: 'Please enter your email' },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input placeholder="Enter your email" />
                    </Form.Item>

                    <Form.Item
                        label="Phone Number"
                        name="customerPhone"
                        rules={[{ required: true, message: 'Please enter your phone number' }]}
                    >
                        <Input placeholder="Enter your phone number" />
                    </Form.Item>

                    <Form.Item className="mb-0">
                        <div className="d-flex gap-2 justify-content-end">
                            <Button onClick={() => setIsCheckoutModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isProcessing}
                            >
                                Confirm Booking (₹{totalAmount.toFixed(2)})
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default BookingLayout;