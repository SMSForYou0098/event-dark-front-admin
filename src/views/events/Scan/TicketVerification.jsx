import React, { memo, useState, useEffect, useCallback } from 'react';
import { Row, Col, message, Modal, Button, Card, Space, Typography, Divider } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined, ReloadOutlined, ClockCircleOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';
import useSound from 'use-sound';
import { useMutation } from '@tanstack/react-query';

import beepSound from '../../../assets/event/stock/tik.mp3';
import errorSound from '../../../assets/event/stock/error.mp3';
import { useMyContext } from 'Context/MyContextProvider';
import { capitilize } from '../users/wallet/Transaction';
import ScanedUserData from './components/ScanedUserData';
import TransactionReceiptModal from './components/TransactionReceiptModal';
import TickeScanFeilds from './components/TickeScanFeilds';
import AdminActionModal from './components/AdminActionModal';
import ShopKeeperModal from './components/ShopKeeperModal';
import StickyBottom from 'utils/MobileStickyBottom.jsx/StickyBottom';
import PosEvents from '../Bookings/components/PosEvents';
import api from 'auth/FetchInterceptor';

const TicketVerification = memo(({ scanMode = 'manual' }) => {
    const {
        userRole,
        formatDateTime,
        UserData,
        fetchCategoryData,
        handleWhatsappAlert,
        formatDateRange,
        convertTo12HourFormat,
    } = useMyContext();

    // ─── State ───────────────────────────────
    const [QRdata, setQRData] = useState('');
    const [ticketData, setTicketData] = useState([]);
    const [event, setEvent] = useState();
    const [selectedEventIds, setSelectedEventIds] = useState([]); // For multiple event selection
    const [selectedEventsList, setSelectedEventsList] = useState([]); // For multiple event selection with full data
    const [selectedCheckpoints, setSelectedCheckpoints] = useState([]); // Array of { event_id, checkpoint_id }
    const [type, setType] = useState('');
    const [categoryData, setCategoryData] = useState(null);
    const [attendees, setAttendees] = useState([]);
    const [show, setShow] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [pendingQRData, setPendingQRData] = useState(null);
    const [resData, setResData] = useState(null);
    const [scanType, setScanType] = useState('verify');
    const [tokenLength, setTokenLength] = useState(8);
    const [loading, setLoading] = useState({
        fetching: false,
        verifying: false
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [autoCheck, setAutoCheck] = useState(false);
    const [selectedFields, setSelectedFields] = useState([])
    const [selectedAction, setSelectedAction] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    // ─── Sounds ──────────────────────────────
    const [playBeep] = useSound(beepSound);
    const [playError] = useSound(errorSound);

    // ─── Error Modal ─────────────────────────
    const showErrorModal = (errorMsg, checkInTime = null, checkpoints = null) => {
        playError();

        Modal.error({
            maskClosable: true,
            title: (
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    Verification Failed
                </div>
            ),
            icon: <ExclamationCircleOutlined style={{ fontSize: '3rem' }} />,
            content: (
                <div style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
                    <p style={{ marginBottom: (checkInTime || checkpoints) ? '1rem' : 0 }}>
                        {errorMsg || 'Invalid Ticket'}
                    </p>
                    {checkInTime && (
                        <div className="alert alert-warning p-3 mb-0">
                            <strong>Previous Check-In:</strong>
                            <br />
                            {formatDateTime(checkInTime)}
                        </div>
                    )}
                    {checkpoints && checkpoints.length > 0 && (
                        <div style={{ marginTop: checkInTime ? '1rem' : 0 }}>
                            {/* <Divider orientation="left" style={{ margin: '12px 0' }}>
                                <Space>
                                    <ClockCircleOutlined />
                                    <span style={{ fontSize: '14px' }}>Available Checkpoints</span>
                                </Space>
                            </Divider> */}
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {checkpoints.map((cp, index) => (
                                    <Card
                                        key={index}
                                        size="small"
                                        style={{ marginBottom: 8 }}
                                        bodyStyle={{ padding: '8px 12px' }}
                                    >
                                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                                            <Typography.Text strong style={{ fontSize: '14px' }}>
                                                {cp.label}
                                            </Typography.Text>
                                            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                                {convertTo12HourFormat(cp.start_time)} - {convertTo12HourFormat(cp.end_time)}
                                            </Typography.Text>
                                        </Space>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ),
            centered: true,
            width: 500,
            okText: 'Close',
            okButtonProps: {
                size: 'large',
                style: { fontSize: '1.1rem', height: '45px', background: 'transprent', border: 'none' }
            },
            onOk: () => {
                setQRData('');
            },
        });
    };

    // ─── Success Modal ───────────────────────
    const showSuccessModal = (msg) => {
        playBeep();

        Modal.success({
            maskClosable: true,
            title: (
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    Success
                </div>
            ),
            icon: <CheckCircleOutlined style={{ fontSize: '3rem' }} />,
            content: (
                <div style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
                    {msg || 'Operation Successful'}
                </div>
            ),
            centered: true,
            width: 450,
            okText: 'Continue',
            okButtonProps: {
                size: 'large',
                style: { fontSize: '1.1rem', height: '45px' }
            },
        });
    };

    const showSuccess = (msg) => {
        message.success(msg || 'Success');
        playBeep();
    };

    // ─── Fetch Token Length ──────────────────
    const getTokenLength = useCallback(async () => {
        try {
            const res = await api.get(`scanner-token-length/${UserData?.id}`);
            if (res.status) setTokenLength(res.tokenLength);
        } catch {
            // ignore silently
        }
    }, [UserData]);

    useEffect(() => {
        getTokenLength();
    }, [getTokenLength]);

    // ─── Load Category Data ──────────────────
    // Supports both single event (original) and multiple events selection
    const loadCategoryData = async (eventOrEvents, ticketsOrEventIds) => {
        // Check if this is multiple mode (second param is an array of IDs)
        if (Array.isArray(ticketsOrEventIds) && typeof ticketsOrEventIds[0] === 'number') {
            // Multiple mode: eventOrEvents = array of events, ticketsOrEventIds = array of event IDs
            setSelectedEventIds(ticketsOrEventIds);
            setSelectedEventsList(eventOrEvents);
            // Reset selected checkpoints when events change
            setSelectedCheckpoints([]);

            if (eventOrEvents.length > 0) {
                const firstEvent = eventOrEvents[0];
                setEvent(firstEvent);
                // Only fetch category data if category exists and changed
                const newCategory = firstEvent?.category;
                if (newCategory && newCategory !== event?.category) {
                    const data = await fetchCategoryData(newCategory);
                    setCategoryData(data);
                }
            } else {
                // Deselecting all events - just clear state, no API call needed
                setEvent(null);
                setSelectedEventIds([]);
                setSelectedEventsList([]);
                setSelectedCheckpoints([]);
                setCategoryData(null);
            }
        } else if (Array.isArray(ticketsOrEventIds) && ticketsOrEventIds.length === 0) {
            // Empty array passed - clear selection, no API call
            setEvent(null);
            setSelectedEventIds([]);
            setSelectedEventsList([]);
            setSelectedCheckpoints([]);
            setCategoryData(null);
        } else {
            // Single mode: eventOrEvents = single event, ticketsOrEventIds = tickets
            if (!eventOrEvents) return;
            const newCategory = eventOrEvents?.category;
            setEvent(eventOrEvents);
            setSelectedEventIds([eventOrEvents?.id]); // Store as single-item array for API consistency
            setSelectedEventsList([eventOrEvents]);
            // Reset selected checkpoints when events change
            setSelectedCheckpoints([]);

            // Only fetch category data if category exists and changed
            if (newCategory && newCategory !== event?.category) {
                const data = await fetchCategoryData(newCategory);
                setCategoryData(data);
            }
        }
    };

    // 

    // ─── Handle Attendees ────────────────────
    const handleAttendees = (data) => {
        const { bookings, is_master } = data;
        if (is_master) {
            const combined = bookings?.bookings?.flatMap((b) => b.attendee) || [];
            setAttendees(combined);
        } else if (bookings?.attendee) {
            setAttendees([bookings.attendee]);
        }
    };

    // ─── Get Ticket Detail (TanStack Query Mutation) ───────────────────
    const verifyTicketMutation = useMutation({
        mutationFn: (token) => api.post(`verify-ticket/${token}`, {
            user_id: UserData?.reporting_user,
            event_ids: selectedEventIds,
            checkpoints: selectedCheckpoints
        }),
        onMutate: () => {
            setLoading(prev => ({ ...prev, fetching: true }));
        },
        onSuccess: (res) => {
            if (res.status) {
                showSuccess('Ticket Found');
                console.log(res, 'suvv');
                const mainBookings = res.bookings || res.data;
                console.log(mainBookings, 'suvv');
                setTicketData(res);
                setSessionId(res.session_id || mainBookings?.session_id);
                setType(res.type || res.data?.type);
                handleAttendees(res);
                setShow(true);
            }
        },
        onError: (err) => {
            setShow(false);
            const { message: msg, time, checkpoints } = err.response?.data ?? {};
            showErrorModal(msg, time, checkpoints);
        },
        onSettled: () => {
            setLoading(prev => ({ ...prev, fetching: false }));
        }
    });

    // Wrapper function for backward compatibility
    const getTicketDetail = (token) => verifyTicketMutation.mutate(token);

    // ─── ShopKeeper Verification (TanStack Query Mutation) ─────────────
    const shopKeeperMutation = useMutation({
        mutationFn: (token) => api.post(`wallet-user/${token}`),
        onMutate: () => {
            setLoading(prev => ({ ...prev, verifying: true }));
        },
        onSuccess: (res) => {
            if (res.status) {
                showSuccess('Wallet Verified');
                setTicketData(res.data);
                setShow(true);
            }
        },
        onError: (err) => {
            showErrorModal(err?.response?.data?.message ?? 'Verification failed');
        },
        onSettled: () => {
            setLoading(prev => ({ ...prev, verifying: false }));
        }
    });

    // Wrapper function for backward compatibility
    const handleShopKeeperVerification = (token) => shopKeeperMutation.mutate(token);

    // ─── Admin Action ────────────────────────
    const handleAdminAction = async (actionType, data) => {
        const token = pendingQRData ?? data;
        setIsProcessing(true);
        setSelectedAction(actionType);
        try {
            if (actionType === 'verify') {
                await getTicketDetail(token);
            } else if (actionType === 'shopkeeper') {
                await handleShopKeeperVerification(token);
            }
        } catch (err) {
            showErrorModal(err?.response?.data?.message);
        } finally {
            setShowAdminModal(false);
            setPendingQRData(null);
            setIsProcessing(false);
        }
    };

    // ─── Checkpoint Validation ──────────────
    const validateCheckpointSelection = () => {
        // Helper to check if a checkpoint is active based on current time
        const isCheckpointActive = (checkpoint) => {
            if (!checkpoint?.start_time || !checkpoint?.end_time) return true;

            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const parseTime = (timeStr) => {
                const [h, m] = timeStr.split(':').map(Number);
                return h * 60 + m;
            };

            const startMinutes = parseTime(checkpoint.start_time);
            const endMinutes = parseTime(checkpoint.end_time);

            return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
        };

        // Get events that have checkpoints configured with at least one ACTIVE checkpoint
        const eventsWithActiveCheckpoints = selectedEventsList.filter(event => {
            const checkpoints = event?.scan_checkpoints;
            if (!Array.isArray(checkpoints) || checkpoints.length === 0) return false;
            // Only include event if it has at least one active checkpoint
            return checkpoints.some(cp => cp?.id && isCheckpointActive(cp));
        });

        if (eventsWithActiveCheckpoints.length === 0) {
            // No events require checkpoints (either no checkpoints or all inactive)
            return { valid: true };
        }

        // Check if each event with active checkpoints has a selected checkpoint
        const missingCheckpoints = eventsWithActiveCheckpoints.filter(
            event => !selectedCheckpoints.some(cp => cp.event_id === event.id)
        );

        if (missingCheckpoints.length > 0) {
            const eventNames = missingCheckpoints.map(e => e.name).join(', ');
            return {
                valid: false,
                message: `Please select a checkpoint for: ${eventNames}`
            };
        }

        return { valid: true };
    };

    // ─── Handle QR Data Length ───────────────
    useEffect(() => {
        if (QRdata?.length === tokenLength) {
            // Validate checkpoint selection first
            const validation = validateCheckpointSelection();
            if (!validation.valid) {
                showErrorModal(validation.message);
                setQRData('');
                return;
            }

            if (userRole === 'Admin') {
                if (scanType === 'verify' || scanType === 'shopkeeper') {
                    handleAdminAction(scanType, QRdata);
                } else {
                    setPendingQRData(QRdata);
                    setShowAdminModal(true);
                }
            } else if (userRole === 'Shop Keeper') {
                handleShopKeeperVerification(QRdata);
            } else {
                getTicketDetail(QRdata);
            }
        }
    }, [QRdata]);

    // ─── Auto-Check Mode ─────────────────────
    useEffect(() => {
        if (show && autoCheck) {
            const timer = setTimeout(() => handleVerify(), 900);
            return () => clearTimeout(timer);
        }
    }, [show, autoCheck]);

    // ─── Check-In Mutation (TanStack Query) ───────────────────
    const checkInMutation = useMutation({
        mutationFn: (sessionIdParam) => api.get(`chek-in/${sessionIdParam}`),
        onMutate: () => {
            setLoading(prev => ({ ...prev, verifying: true }));
            setIsProcessing(true);
        },
        onSuccess: (res) => {
            if (res.status) {
                showSuccessModal('Ticket Scanned Successfully!');
                setQRData('');
                setShow(false);
            }
        },
        onError: (err) => {
            showErrorModal(err?.response?.data?.message);
        },
        onSettled: () => {
            setLoading(prev => ({ ...prev, verifying: false }));
            setIsProcessing(false);
        }
    });

    // Wrapper function for verify ticket
    const handleVerify = () => {
        if (!QRdata || isProcessing) return;
        checkInMutation.mutate(sessionId);
    };

    // ─── Debit Wallet Mutation (TanStack Query) ──────────────────
    const debitWalletMutation = useMutation({
        mutationFn: ({ amount, remarks }) => api.post(`debit-wallet`, {
            amount,
            description: remarks,
            token: QRdata,
            shopKeeper_id: UserData?.id,
            session_id: ticketData.session_id,
            user_id: ticketData.booking.user?.id,
        }),
        onMutate: () => {
            setIsProcessing(true);
        },
        onSuccess: (res) => {
            if (res.status) {
                const tx = res.data;
                setResData(tx);
                setShowReceipt(true);
                setShow(false);
                setQRData('');
                showSuccessModal('Amount Debited Successfully!');
                HandleSendAlerts(tx);
            }
        },
        onError: (err) => {
            showErrorModal(err?.response?.data?.message);
        },
        onSettled: () => {
            setIsProcessing(false);
        }
    });

    // Wrapper function for debit
    const handleDebit = (amount, remarks) => debitWalletMutation.mutate({ amount, remarks });

    // ─── WhatsApp Notification ───────────────
    const HandleSendAlerts = async (tx) => {
        if (!tx) return message.error('Missing transaction data');

        const {
            total_credits,
            user_number,
            shop_name,
            user_name,
            credits,
            shop_user_name,
            shop_user_number,
        } = tx;

        if (!user_number) return message.error('User phone number missing');

        const values = {
            name: capitilize(user_name),
            credits,
            ctCredits: total_credits,
            shopName: shop_name,
            shopKeeperName: capitilize(shop_user_name),
            shopKeeperNumber: shop_user_number,
        };

        if (credits) await handleWhatsappAlert(user_number, values, 'Transaction Dedit');
    };

    // const handleEventChange = (data) => {
    //     loadCategoryData(data)
    // }
    return (
        <>
            <AdminActionModal
                show={showAdminModal}
                onHide={() => {
                    setShowAdminModal(false);
                    setQRData('');
                    setPendingQRData(null);
                }}
                onActionSelect={handleAdminAction}
            />

            <TransactionReceiptModal
                show={showReceipt}
                onHide={() => setShowReceipt(false)}
                transactionId={resData?.id}
            />

            {(userRole === 'Shop Keeper' || selectedAction === 'shopkeeper') && (
                <ShopKeeperModal
                    show={show}
                    onHide={() => {
                        setShow(false);
                        setQRData('');
                    }}
                    ticketData={ticketData}
                    handleDebit={handleDebit}
                />
            )}

            {(userRole === 'Scanner' || selectedAction === 'verify') && (
                <ScanedUserData
                    show={show}
                    ticketData={ticketData}
                    setShow={setShow}
                    attendees={attendees}
                    setAttendees={setAttendees}
                    loading={loading}
                    categoryData={categoryData}
                    handleVerify={handleVerify}
                />
            )}

            <>
                <Row gutter={[16, 16]}>
                    <div className='d-block d-sm-none'>
                        <StickyBottom>
                            <Button
                                type="primary"
                                block
                                icon={<ReloadOutlined />}
                                onClick={() => window.location.reload()}
                            >
                                Refresh
                            </Button>
                        </StickyBottom>
                    </div>
                    <Col span={24}>
                        <PosEvents
                            type='scan'
                            handleButtonClick={loadCategoryData}
                            isScanner={userRole === 'Scanner'}
                            multiple={true}
                        />
                    </Col>
                    {event &&
                        <>
                            <Col xs={24} sm={24} lg={18}>
                                <TickeScanFeilds
                                    scanMode={scanMode}
                                    categoryData={categoryData}
                                    QRdata={QRdata}
                                    setQRData={setQRData}
                                    autoCheck={autoCheck}
                                    setSelectedFields={setSelectedFields}
                                    setAutoCheck={setAutoCheck}
                                    scanType={scanType}
                                    eventId={event?.id}
                                    setScanType={setScanType}
                                    userRole={userRole}
                                    selectedEventsList={selectedEventsList}
                                    selectedCheckpoints={selectedCheckpoints}
                                    setSelectedCheckpoints={setSelectedCheckpoints}
                                />
                            </Col>
                            <Col xs={24} sm={24} lg={6}>
                                <Card>
                                    <Space direction="vertical" size={12} className='w-100'>
                                        {selectedEventsList.length > 0 ? (
                                            selectedEventsList.map((evt, index) => (
                                                <div key={evt.id}>
                                                    <div>
                                                        <Typography.Text strong>
                                                            {evt.name || 'Event Name'}
                                                        </Typography.Text>
                                                    </div>
                                                    <Space direction="vertical" size={0} className='mt-2'>
                                                        <Space>
                                                            <ClockCircleOutlined />
                                                            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>Date Range:</Typography.Text>
                                                        </Space>
                                                        <Typography.Text style={{ fontSize: '13px' }}>
                                                            {formatDateRange(evt.date_range)}
                                                        </Typography.Text>
                                                    </Space>
                                                    {index < selectedEventsList.length - 1 && <Divider className='my-2' />}
                                                </div>
                                            ))
                                        ) : (
                                            <div>
                                                <Typography.Text strong>
                                                    {event?.name || 'Event Name'}
                                                </Typography.Text>
                                                <Divider className='my-2' />
                                                <Space direction="vertical" size={8}>
                                                    <div>
                                                        <Space>
                                                            <ClockCircleOutlined />
                                                            <Typography.Text>Date Range:</Typography.Text>
                                                        </Space>
                                                        <Typography.Text strong>
                                                            {formatDateRange(event?.date_range)}
                                                        </Typography.Text>
                                                    </div>
                                                </Space>
                                            </div>
                                        )}
                                    </Space>
                                </Card>
                            </Col>
                        </>
                    }
                </Row>
            </>
        </>
    );
});

export default TicketVerification;