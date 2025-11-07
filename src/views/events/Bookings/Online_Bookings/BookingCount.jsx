import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Row } from 'antd'
import axios from 'axios'
import { useMyContext } from 'Context/MyContextProvider'
import StatSection from 'views/events/Dashboard/components/StatSection'

const BookingCount = ({ type, date, showGatewayAmount }) => {
    const { api, authToken, isMobile } = useMyContext()
    const [counts, setCounts] = useState({
        totalDiscount: 0,
        totalAmount: 0,
        totalQuantity: 0,
    })

    useEffect(() => {
        if (type) {
            calculateTotals(type)
        }
    }, [type, date])

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

    const calculateTotals = useCallback(async () => {
        if (!type) return

        try {
            const typeParam = getTypeParam(type)
            const url = `${api}getDashboardSummary/${typeParam}`

            const params = {}
            if (date?.startDate && date?.endDate) {
                params.date = `${date.startDate},${date.endDate}`
            }

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                params: params
            })
            const data = response.data

            if (data) {
                setCounts({
                    totalDiscount: data.totalDiscount,
                    totalAmount: data.totalAmount,
                    totalBookings: data.totalBookings,
                    totalTickets: data.totalTickets,
                    instamojoTotalAmount: data.instamojoTotalAmount,
                    easebuzzTotalAmount: data.easebuzzTotalAmount,
                    cashfreeTotalAmount: data.cashfreeTotalAmount,
                    razorpayTotalAmount: data.razorpayTotalAmount,
                    phonepeTotalAmount: data.phonepeTotalAmount,
                    upi: data.upi,
                    cash: data.cash,
                    nb: data.nb,
                })
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        }
    }, [api, authToken, type, date])

    const onlineCardData = useMemo(() => {
        const baseData = [
            { title: "Amount", value: Number(counts.totalAmount) },
            { title: "Discount", value: Number(counts.totalDiscount) },
            { title: "Bookings", value: Number(counts.totalBookings), hideCurrency: true },
            { title: "Tickets", value: Number(counts.totalTickets), hideCurrency: true },
        ]

        const gatewayData = showGatewayAmount ? [
            { title: "InstaMojo", value: Number(counts.instamojoTotalAmount), hideCurrency: false },
            { title: "Easebuzz", value: Number(counts.easebuzzTotalAmount), hideCurrency: false },
            { title: "Cashfree", value: Number(counts.cashfreeTotalAmount), hideCurrency: false },
            { title: "Razorpay", value: Number(counts.razorpayTotalAmount), hideCurrency: false },
            { title: "Phonepe", value: Number(counts.phonepeTotalAmount), hideCurrency: false },
        ].filter(gateway => gateway.value > 0) : []

        return [...gatewayData, ...baseData]
    }, [counts, showGatewayAmount])

    const offlineCardData = useMemo(() => {
        const baseData = [
            { title: "Amount", value: Number(counts.totalAmount || 0) },
            { title: "Discount", value: Number(counts.totalDiscount || 0) },
            { title: "Bookings", value: Number(counts.totalBookings || 0), hideCurrency: true },
            { title: "Tickets", value: Number(counts.totalTickets || 0), hideCurrency: true },
        ]

        const paymentMethods = [
            { title: "UPI", value: Number(counts.upi || 0), hideCurrency: false },
            { title: "Cash", value: Number(counts.cash || 0), hideCurrency: false },
            { title: "Net Banking", value: Number(counts.nb || 0), hideCurrency: false },
        ].filter(method => method.value > 0)

        return [...baseData, ...paymentMethods]
    }, [counts])

    const dataToShow = type === 'online' ? onlineCardData : offlineCardData

    return (
        <Row gutter={[16, 16]}>
            <StatSection
                stats={dataToShow}
                colConfig={{ xs: 24, sm: 12, md: 6, lg: 4 }}
                isMobile={isMobile}
            />
        </Row>
    )
}

export default BookingCount