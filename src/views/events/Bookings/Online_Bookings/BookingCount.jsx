import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Row, Button } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import axios from 'axios'
import { useMyContext } from 'Context/MyContextProvider'
import StatSection from 'views/events/Dashboard/components/StatSection'
import EventCards from './EventCards'
import SummaryPrintModal from './SummaryPrintModal'

const BookingCount = ({ type, date, showGatewayAmount }) => {
    const { api, authToken, isMobile } = useMyContext()
    const [showPrintModal, setShowPrintModal] = useState(false)
    const [counts, setCounts] = useState({
        totalDiscount: 0,
        totalAmount: 0,
        totalQuantity: 0,
        ticketSales: [],
    })

    const getTypeParam = useCallback((bookingType) => {
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
    }, [])

    const calculateTotals = useCallback(async () => {
  if (!type) return;

  // stop early if we don't have a token (avoids useless requests)
  if (!authToken) {
    console.warn('[BookingCount] no authToken, skipping dashboard fetch');
    return;
  }

  try {
    const typeParam = getTypeParam(type);

    // ensure api base ends with a single slash
    const baseApi = api ? api.replace(/\/+$/, '') + '/' : '/';
    const url = `${baseApi}getDashboardSummary/${typeParam}`;

    const params = {};
    
    // Support multiple date formats:
    // 1) Array of ISO strings: ["2025-09-01T...", "2025-12-01T..."]
    // 2) Array of dayjs objects: [dayjs(), dayjs()]
    // 3) Object format: { startDate: "2025-09-01", endDate: "2025-12-01" }
    let startDate, endDate;
    
    if (Array.isArray(date) && date.length === 2) {
      // Handle array format (ISO strings or dayjs objects)
      const [start, end] = date;
      // Check if it's a dayjs object or string
      startDate = typeof start === 'string' ? start.split('T')[0] : start?.format?.('YYYY-MM-DD') || String(start).split('T')[0];
      endDate = typeof end === 'string' ? end.split('T')[0] : end?.format?.('YYYY-MM-DD') || String(end).split('T')[0];
    } else if (date?.startDate && date?.endDate) {
      // Handle object format { startDate, endDate }
      startDate = date.startDate;
      endDate = date.endDate;
    }
    
    if (startDate && endDate) {
      params.date = `${startDate},${endDate}`;
    }

        if (process.env.NODE_ENV === 'development') {
            console.log('[BookingCount] params', params);
        }

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      params,
    });

    const d = response.data || {};
    setCounts({
      totalDiscount: d.totalDiscount || 0,
      totalAmount: d.totalAmount || 0,
      totalBookings: d.totalBookings || 0,
      totalTickets: d.totalTickets || 0,
      instamojoTotalAmount: d.instamojoTotalAmount || 0,
      easebuzzTotalAmount: d.easebuzzTotalAmount || 0,
      cashfreeTotalAmount: d.cashfreeTotalAmount || 0,
      razorpayTotalAmount: d.razorpayTotalAmount || 0,
      phonepeTotalAmount: d.phonepeTotalAmount || 0,
      upi: d.upi || 0,
      cash: d.cash || 0,
      nb: d.nb || 0,
    //   ticketSales: d?.ticketSales ||[],
      ticketSales: [
    {
        "name": "VADODARA MARATHON – SAAREE RUN",
        "tickets": [
            {
                "name": "RUN TICKET",
                "count": 54,
                "total_amount": 0
            }
        ]
    },
    {
        "name": "Neon Midnight Party",
        "tickets": [
            {
                "name": "SILVER",
                "count": 2,
                "total_amount": 798
            }
        ]
    },
    {
        "name": "Dr Kumar Vishwas Live",
        "tickets": [
            {
                "name": "SILVER",
                "count": 13,
                "total_amount": 13000
            },
            {
                "name": "GOLD",
                "count": 2,
                "total_amount": 3000
            },
            {
                "name": "PLATINUM",
                "count": 8,
                "total_amount": 16000
            }
        ]
    },
    {
        "name": "Rupali jagga Live in Concert",
        "tickets": [
            {
                "name": "FANPIT",
                "count": 2,
                "total_amount": 998
            }
        ]
    },
    {
        "name": "Kailash Kher Live In Concert",
        "tickets": [
            {
                "name": "FANPIT",
                "count": 4,
                "total_amount": 2796
            }
        ]
    },
    {
        "name": "Shameless Mani",
        "tickets": [
            {
                "name": "FANPIT",
                "count": 2,
                "total_amount": 998
            }
        ]
    },
    {
        "name": "Garba With Atul Purohit",
        "tickets": [
            {
                "name": "GOLD",
                "count": 1,
                "total_amount": 499
            }
        ]
    },
    {
        "name": "Aditya Rikhari Live in Concert",
        "tickets": [
            {
                "name": "GOLD",
                "count": 3,
                "total_amount": 1497
            },
            {
                "name": "FANPIT",
                "count": 2,
                "total_amount": 1398
            }
        ]
    }
]
    });
  } catch (error) {
    // log richer error info for easier debugging
    console.error('[BookingCount] Error fetching data:', {
      message: error.message,
      response: error.response ? { status: error.response.status, data: error.response.data } : undefined,
      request: error.request ? true : undefined,
    });
  }
}, [api, authToken, type, date, getTypeParam]);

    // Call calculateTotals when type or date changes
    useEffect(() => {
        if (type) {
            calculateTotals()
        }
    }, [type, date, calculateTotals])

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

        if (process.env.NODE_ENV === 'development') {
            console.log('[BookingCount] counts.ticketSales:', counts.ticketSales);
        }

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
            {Array.isArray(counts.ticketSales) && counts.ticketSales.length > 0 && (
                <EventCards data={counts.ticketSales} summaryData={counts}/>
            )}
            
            <SummaryPrintModal 
                show={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                counts={counts}
                date={date}
                type={type}
            />
        </>
    )
}

export default BookingCount