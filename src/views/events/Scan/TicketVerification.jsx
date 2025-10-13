import React, { memo, useState, useEffect, useCallback } from 'react';
import { Row, Col, message, Modal } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import useSound from 'use-sound';

import beepSound from '../../../assets/event/stock/tik.mp3';
import errorSound from '../../../assets/event/stock/error.mp3';
import { useMyContext } from 'Context/MyContextProvider';
import { capitilize } from '../users/wallet/Transaction';
import MobileScan from './components/MobileScan';
import ScanedUserData from './components/ScanedUserData';
import TransactionReceiptModal from './components/TransactionReceiptModal';
import TickeScanFeilds from './components/TickeScanFeilds';
import AdminActionModal from './components/AdminActionModal';
import ShopKeeperModal from './components/ShopKeeperModal';

const TicketVerification = memo(({ scanMode = 'manual' }) => {
    const {
        api,
        userRole,
        formatDateTime,
        authToken,
        UserData,
        fetchCategoryData,
        handleWhatsappAlert,
    } = useMyContext();

    // ─── State ───────────────────────────────
    const [QRdata, setQRData] = useState('');
    const [ticketData, setTicketData] = useState([]);
    const [event, setEvent] = useState();
    const [type, setType] = useState('');
    const [categoryData, setCategoryData] = useState(null);
    const [attendees, setAttendees] = useState([]);
    const [show, setShow] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [pendingQRData, setPendingQRData] = useState(null);
    const [resData, setResData] = useState(null);
    const [scanType, setScanType] = useState('');
    const [tokenLength, setTokenLength] = useState(8);
    const [isProcessing, setIsProcessing] = useState(false);
    const [autoCheck, setAutoCheck] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);

    // ─── Sounds ──────────────────────────────
    const [playBeep] = useSound(beepSound);
    const [playError] = useSound(errorSound);

    // ─── Helper: axios instance with token ───
    const axiosAuth = useCallback(() => {
        return axios.create({
            headers: { Authorization: `Bearer ${authToken}` },
        });
    }, [authToken]);

    // ─── Error Modal ─────────────────────────
    const showErrorModal = (errorMsg, checkInTime = null) => {
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
                    <p style={{ marginBottom: checkInTime ? '1rem' : 0 }}>
                        {errorMsg || 'Invalid Ticket'}
                    </p>
                    {checkInTime && (
                        <div className="alert alert-warning p-3 mb-0">
                            <strong>Previous Check-In:</strong>
                            <br />
                            {formatDateTime(checkInTime)}
                        </div>
                    )}
                </div>
            ),
            centered: true,
            width: 500,
            okText: 'Close',
            okButtonProps: {
                size: 'large',
                style: { fontSize: '1.1rem', height: '45px' , background : 'transprent' , border : 'none' }
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
            const res = await axiosAuth().get(`${api}scanner-token-length/${UserData?.id}`);
            if (res.data.status) setTokenLength(res.data.tokenLength);
        } catch {
            // ignore silently
        }
    }, [api, UserData, axiosAuth]);

    useEffect(() => {
        getTokenLength();
    }, [getTokenLength]);

    // ─── Load Category Data ──────────────────
    const loadCategoryData = async (event) => {
        if (!event) return;
        const data = await fetchCategoryData(event?.category?.id);
        setCategoryData(data);
    };

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

    // ─── Get Ticket Detail ───────────────────
    const getTicketDetail = async (data) => {
        try {
            const res = await axiosAuth().post(`${api}verify-ticket/${data}`, {
                user_id: UserData?.reporting_user,
            });

            if (res.data.status) {
                showSuccess('Ticket Found');
                const mainBookings = res.data.bookings;
                setTicketData(mainBookings);
                setEvent(res.data.event);
                setType(res.data.type);
                await loadCategoryData(res.data.event);
                handleAttendees(res.data);
                setShow(true);
            }
        } catch (err) {
            const { message: msg, time } = err.response?.data ?? {};
            showErrorModal(msg, time);
        }
    };

    // ─── ShopKeeper Verification ─────────────
    const handleShopKeeperVerification = async (data) => {
        try {
            const res = await axiosAuth().post(`${api}wallet-user/${data}`);
            if (res.data.status) {
                showSuccess('Wallet Verified');
                setTicketData(res.data);
                setShow(true);
            }
        } catch (err) {
            showErrorModal(err?.response?.data?.message ?? 'Verification failed');
        }
    };

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

    // ─── Handle QR Data Length ───────────────
    useEffect(() => {
        if (QRdata?.length === tokenLength) {
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

    // ─── Verify Ticket ───────────────────────
    const handleVerify = async () => {
        if (!QRdata || isProcessing) return;
        setIsProcessing(true);
        try {
            const res = await axiosAuth().get(`${api}chek-in/${QRdata}`);
            if (res.data.status) {
                showSuccessModal('Ticket Scanned Successfully!');
                setQRData('');
                setShow(false);
            }
        } catch (err) {
            showErrorModal(err?.response?.data?.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // ─── Debit Function ──────────────────────
    const handleDebit = async (amount, remarks) => {
        try {
            setIsProcessing(true);
            const res = await axiosAuth().post(`${api}debit-wallet`, {
                amount,
                description: remarks,
                token: QRdata,
                shopKeeper_id: UserData?.id,
                session_id: ticketData.session_id,
                user_id: ticketData.user?.id,
            });

            if (res.data.status) {
                const tx = res.data.data;
                setResData(tx);
                setShowReceipt(true);
                setShow(false);
                setQRData('');
                showSuccessModal('Amount Debited Successfully!');
                await HandleSendAlerts(tx);
            }
        } catch (err) {
            showErrorModal(err?.response?.data?.message);
        } finally {
            setIsProcessing(false);
        }
    };

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

    // ─── JSX ─────────────────────────────────
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
                    event={event}
                    ticketData={ticketData}
                    type={type}
                    setShow={setShow}
                    attendees={attendees}
                    categoryData={categoryData}
                    handleVerify={handleVerify}
                />
            )}

            <>
                <Row gutter={[16, 16]}>
                    <div className='d-block d-sm-none'>
                        <MobileScan />
                    </div>
                    <Col span={24}>
                        <TickeScanFeilds
                            scanMode={scanMode}
                            QRdata={QRdata}
                            setQRData={setQRData}
                            autoCheck={autoCheck}
                            setAutoCheck={setAutoCheck}
                            scanType={scanType}
                            setScanType={setScanType}
                            userRole={userRole}
                        />
                    </Col>
                </Row>
            </>
        </>
    );
});

export default TicketVerification;