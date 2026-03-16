import React, { useMemo, useState } from 'react'
import { Row, Button } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { useMyContext } from 'Context/MyContextProvider'
import StatSection from 'views/events/Dashboard/components/StatSection'
import EventCards from './EventCards'
import SummaryPrintModal from './SummaryPrintModal'
import api from 'auth/FetchInterceptor'

const BookingCount = ({ type, date, showGatewayAmount }) => {
    const { isMobile } = useMyContext()
    const [showPrintModal, setShowPrintModal] = useState(false)

    // Helper function to determine the booking type parameter
    const getTypeParam = (bookingType) => {
        const currentPath = window.location.pathname
        const bookingTypeLower = bookingType.toLowerCase()

        if (currentPath.includes('amusement')) {
            if (bookingTypeLower.includes('online')) return 'amusement-online'
            if (bookingTypeLower.includes('agent')) return 'amusement-agent'
            if (bookingTypeLower.includes('pos')) return 'amusement-pos'
        }

        if (bookingTypeLower.includes('online')) {
            return 'online'
        }

        const typeMap = {
            'Agent': 'agent',
            'Exhibition': 'exhibition',
            'POS': 'pos'
        }

        return typeMap[bookingType] || bookingType.toLowerCase()
    }

    // Helper function to format date parameters
    const formatDateParams = (date) => {
        let startDate, endDate;

        if (Array.isArray(date) && date.length === 2) {
            // Handle array format (ISO strings or dayjs objects)
            const [start, end] = date;
            startDate = typeof start === 'string' ? start.split('T')[0] : start?.format?.('YYYY-MM-DD') || String(start).split('T')[0];
            endDate = typeof end === 'string' ? end.split('T')[0] : end?.format?.('YYYY-MM-DD') || String(end).split('T')[0];
        } else if (date?.startDate && date?.endDate) {
            // Handle object format { startDate, endDate }
            startDate = date.startDate;
            endDate = date.endDate;
        }

        return startDate && endDate ? `${startDate},${endDate}` : null;
    }

    // Fetch dashboard summary using TanStack Query
    const { data: counts = {
        totalDiscount: 0,
        totalAmount: 0,
        totalBookings: 0,
        totalTickets: 0,
        instamojoTotalAmount: 0,
        easebuzzTotalAmount: 0,
        cashfreeTotalAmount: 0,
        razorpayTotalAmount: 0,
        phonepeTotalAmount: 0,
        upi: 0,
        cash: 0,
        nb: 0,
        ticketSales: [],
    } } = useQuery({
        queryKey: ['dashboardSummary', type, date],
        queryFn: async () => {
            const typeParam = getTypeParam(type);
            const url = `bookings/summary/${typeParam}`;

            const params = {};
            const dateParam = formatDateParams(date);
            if (dateParam) {
                params.date = dateParam;
            }

            if (process.env.NODE_ENV === 'development') {
                console.log('[BookingCount] params', params);
            }

            const response = await api.get(url, {
                params,
            });

            const d = response.data || {};

            return {
                totalDiscount: d.total_discount || 0,
                totalAmount: d.total_amount || 0,
                totalBookings: d.total_bookings || 0,
                totalTickets: d.total_tickets || 0,
                // Gateway breakdown (nested object)
                instamojoTotalAmount: d.gateway_breakdown?.instamojo || 0,
                easebuzzTotalAmount: d.gateway_breakdown?.easebuzz || 0,
                cashfreeTotalAmount: d.gateway_breakdown?.cashfree || 0,
                razorpayTotalAmount: d.gateway_breakdown?.razorpay || 0,
                phonepeTotalAmount: d.gateway_breakdown?.phonepe || 0,
                // Payment methods (nested object)
                upi: d.payment_methods?.upi || 0,
                cash: d.payment_methods?.cash || 0,
                nb: d.payment_methods?.net_banking || 0,
            };
        },
        enabled: !!type,
        staleTime: 30000,
        retry: 1,
        onError: (error) => {
            console.error('[BookingCount] Error fetching data:', {
                message: error.message,
                response: error.response ? { status: error.response.status, data: error.response.data } : undefined,
                request: error.request ? true : undefined,
            });
        }
    })

    // Fetch event-wise sales data using TanStack Query
    const { data: ticketSales = [] } = useQuery({
        queryKey: ['eventWiseSales', type, date],
        queryFn: async () => {
            const typeParam = getTypeParam(type);
            const url = `bookings/event-wise-sales/${typeParam}`;

            const params = {};
            const dateParam = formatDateParams(date);
            if (dateParam) {
                params.date = dateParam;
            }

            if (process.env.NODE_ENV === 'development') {
                console.log('[BookingCount] event-wise-sales params', params);
            }

            const response = await api.get(url, {
                params,
            });

            return response.data || [];
        },
        enabled: !!type,
        staleTime: 30000,
        retry: 1,
        onError: (error) => {
            console.error('[BookingCount] Error fetching event-wise sales:', {
                message: error.message,
                response: error.response ? { status: error.response.status, data: error.response.data } : undefined,
                request: error.request ? true : undefined,
            });
        }
    })

    // Combine counts with ticketSales for backward compatibility
    const countsWithTicketSales = {
        ...counts,
        ticketSales
    }

    const onlineCardData = useMemo(() => {
        const baseData = [
            { title: "Amount", value: Number(countsWithTicketSales.totalAmount) },
            { title: "Discount", value: Number(countsWithTicketSales.totalDiscount) },
            { title: "Bookings", value: Number(countsWithTicketSales.totalBookings), hideCurrency: true },
            { title: "Tickets", value: Number(countsWithTicketSales.totalTickets), hideCurrency: true },
        ]

        const gatewayData = showGatewayAmount ? [
            { title: "InstaMojo", value: Number(countsWithTicketSales.instamojoTotalAmount), hideCurrency: false },
            { title: "Easebuzz", value: Number(countsWithTicketSales.easebuzzTotalAmount), hideCurrency: false },
            { title: "Cashfree", value: Number(countsWithTicketSales.cashfreeTotalAmount), hideCurrency: false },
            { title: "Razorpay", value: Number(countsWithTicketSales.razorpayTotalAmount), hideCurrency: false },
            { title: "Phonepe", value: Number(countsWithTicketSales.phonepeTotalAmount), hideCurrency: false },
        ].filter(gateway => gateway.value > 0) : []

        return [...gatewayData, ...baseData]
    }, [countsWithTicketSales, showGatewayAmount])

    const offlineCardData = useMemo(() => {
        const baseData = [
            { title: "Amount", value: Number(countsWithTicketSales.totalAmount || 0) },
            { title: "Discount", value: Number(countsWithTicketSales.totalDiscount || 0) },
            { title: "Bookings", value: Number(countsWithTicketSales.totalBookings || 0), hideCurrency: true },
            { title: "Tickets", value: Number(countsWithTicketSales.totalTickets || 0), hideCurrency: true },
        ]

        const paymentMethods = [
            { title: "UPI", value: Number(countsWithTicketSales.upi || 0), hideCurrency: false },
            { title: "Cash", value: Number(countsWithTicketSales.cash || 0), hideCurrency: false },
            { title: "Net Banking", value: Number(countsWithTicketSales.nb || 0), hideCurrency: false },
        ].filter(method => method.value > 0)

        return [...baseData, ...paymentMethods]
    }, [countsWithTicketSales])

    const dataToShow = type === 'online' ? onlineCardData : offlineCardData



    return (
        <>
            <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 16 }}>
                <StatSection
                    stats={dataToShow}
                    colConfig={{ xs: 24, sm: 12, md: 6, lg: 4 }}
                    isMobile={isMobile}
                />
                {
                    type === 'pos' &&
                    <Button
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={() => setShowPrintModal(true)}
                        style={{ marginLeft: 'auto' }}
                    >
                        Print Summary
                    </Button>
                }
            </Row>
            {Array.isArray(countsWithTicketSales.ticketSales) && countsWithTicketSales.ticketSales.length > 0 && (
                <EventCards data={countsWithTicketSales.ticketSales} summaryData={countsWithTicketSales} />
            )}

            <SummaryPrintModal
                show={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                counts={countsWithTicketSales}
                date={date}
                type={type}
            />
        </>
    )
}

export default BookingCount