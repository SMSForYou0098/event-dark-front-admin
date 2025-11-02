import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Col, Carousel, Row } from 'antd'
import axios from 'axios'
import { useMyContext } from 'Context/MyContextProvider'
import DataCard from 'views/events/Dashboard/Admin/DataCard'

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
        // First check if the type contains 'online' (case insensitive)
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
            const url = `${api}getDashboardSummary/${typeParam}`;
            
            // Build params with comma-separated date range
            const params = {};
            if (date?.startDate && date?.endDate) {
                params.date = `${date.startDate},${date.endDate}`;
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
            { title: "Amount", amount: Number(counts.totalAmount) },
            { title: "Discount", amount: Number(counts.totalDiscount) },
            { title: "Bookings", amount: Number(counts.totalBookings), hideCurrency: true },
            { title: "Tickets", amount: Number(counts.totalTickets), hideCurrency: true },
        ]

        const gatewayData = showGatewayAmount ? [
            { title: "InstaMojo", amount: Number(counts.instamojoTotalAmount), hideCurrency: false },
            { title: "Easebuzz", amount: Number(counts.easebuzzTotalAmount), hideCurrency: false },
            { title: "Cashfree", amount: Number(counts.cashfreeTotalAmount), hideCurrency: false },
            { title: "Razorpay", amount: Number(counts.razorpayTotalAmount), hideCurrency: false },
            { title: "Phonepe", amount: Number(counts.phonepeTotalAmount), hideCurrency: false },
        ].filter(gateway => gateway.amount > 0) : []

        return [...gatewayData, ...baseData]
    }, [counts, showGatewayAmount])

    const offlineCardData = useMemo(() => {
        const baseData = [
            { title: "Amount", amount: Number(counts.totalAmount || 0) },
            { title: "Discount", amount: Number(counts.totalDiscount || 0) },
            { title: "Bookings", amount: Number(counts.totalBookings || 0), hideCurrency: true },
            { title: "Tickets", amount: Number(counts.totalTickets || 0), hideCurrency: true },
        ]
        console.log(counts)
        // Payment methods - filter out those with 0 amount
        const paymentMethods = [
            { title: "UPI", amount: Number(counts.upi || 0), hideCurrency: false },
            { title: "Cash", amount: Number(counts.cash || 0), hideCurrency: false },
            { title: "Net Banking", amount: Number(counts.nb || 0), hideCurrency: false },
        ].filter(method => method.amount > 0)
    
        return [...baseData, ...paymentMethods]
    }, [counts])

    const dataToShow = type === 'online' ? onlineCardData : offlineCardData

    const renderContent = () => {
        if (isMobile) {
            return (
                <Carousel
                    autoplay={false}
                    dots={true}
                    infinite={true}
                >
                    {dataToShow?.map((data, index) => (
                        <div key={index}>
                            <div key={index} className="col-6">
                                <DataCard
                                    data={data}
                                    value={data.amount}
                                />
                            </div>
                        </div>
                    ))}
                    
                </Carousel>
            )
        }

        return (
            <>
                {dataToShow.map((data, index) => (
                    <Col key={index} sm={4} className="col-sm-2">
                        <DataCard
                            data={data}
                            value={data.amount}
                        />
                    </Col>
                ))}
            </>
        )
    }

    return (
        <Row>
            {renderContent()}
        </Row>
    )
}

export default BookingCount