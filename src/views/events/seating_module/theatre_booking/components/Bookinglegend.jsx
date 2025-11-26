import React from 'react';
import { Card, Space, Tag, Divider } from 'antd';
import { PRIMARY } from 'utils/consts';

// Reusable box generator
const box = (bg, border, extra = {}) => ({
    width: 20,
    height: 20,
    backgroundColor: bg,
    borderRadius: 4,
    border,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...extra
});

const BookingLegend = ({ sections }) => {

    // Extract unique ticket categories
    const getUniqueTicketCategories = () => {
        const map = new Map();

        sections.forEach(s =>
            s.rows?.forEach(r =>
                r.seats?.forEach(seat => {
                    if (
                        seat.ticket &&
                        seat.status !== 'disabled' &&
                        seat.status !== 'booked' &&
                        !map.has(seat.ticket.id)
                    ) {
                        map.set(seat.ticket.id, {
                            id: seat.ticket.id,
                            name: seat.ticket.name,
                            price: parseFloat(seat.ticket.price || 0)
                        });
                    }
                })
            )
        );

        return Array.from(map.values());
    };

    const ticketCategories = getUniqueTicketCategories();

    return (
        <Card className="mt-3" size="small">
            <div className="d-flex flex-wrap gap-4 align-items-start">

                {/* ---- Seat Status ---- */}
                <div>
                    <strong className="d-block mb-2" style={{ fontSize: 13 }}>Seat Status:</strong>

                    <Space direction="vertical" size={8}>

                        {/* Available */}
                        <div className="d-flex align-items-center gap-2">
                            <Tag color="blue">1</Tag>
                            <span style={{ fontSize: 13 }}>Available</span>
                        </div>

                        {/* Selected */}
                        <div className="d-flex align-items-center gap-2">
                            <Tag color="red">1</Tag>
                            <span style={{ fontSize: 13 }}>Selected</span>
                        </div>

                        {/* Booked */}
                        <div className="d-flex align-items-center gap-2">
                            <Tag color="red">
                                ✕
                            </Tag>
                            <span style={{ fontSize: 13 }}>Booked</span>
                        </div>

                        {/* Not Available */}
                        <div className="d-flex align-items-center gap-2">
                            <Tag color="default"></Tag>
                            <span style={{ fontSize: 13 }}>Not Available</span>
                        </div>

                    </Space>
                </div>



                {/* ---- Ticket Categories ---- */}
                {ticketCategories.length > 0 && (
                    <>
                        <Divider type="vertical" style={{ height: 'auto' }} />

                        <div>
                            <strong className="d-block mb-2" style={{ fontSize: 13 }}>
                                Ticket Categories:
                            </strong>

                            <Space direction="vertical" size={8}>
                                {ticketCategories.map(cat => (
                                    <Space key={cat.id} size={12}>
                                        <div style={box(PRIMARY, `1px solid ${PRIMARY}`)} />
                                        <span style={{ fontSize: 13, minWidth: 100 }}>{cat.name}</span>
                                        <Tag color="green" style={{ fontSize: 11, margin: 0 }}>
                                            ₹{cat.price.toFixed(2)}
                                        </Tag>
                                    </Space>
                                ))}
                            </Space>
                        </div>
                    </>
                )}

                {/* ---- Instructions ---- */}
                <Divider type="vertical" style={{ height: 'auto' }} />

                <div style={{ maxWidth: 250 }}>
                    <strong className="d-block mb-2" style={{ fontSize: 13 }}>How to Book:</strong>

                    <ol style={{ fontSize: 12, paddingLeft: 20, margin: 0 }}>
                        <li className="mb-1">Click on available seats to select</li>
                        <li className="mb-1">Review your selection in the summary</li>
                        <li className="mb-1">Click "Proceed to Checkout"</li>
                        <li className="mb-1">Fill in your details and confirm</li>
                    </ol>

                    <div
                        className="mt-2 p-2"
                        style={{
                            fontSize: 11,
                            backgroundColor: '#fff3cd',
                            borderRadius: 4,
                            color: '#856404'
                        }}
                    >
                        <strong>Note:</strong> Seats without tickets assigned cannot be selected.
                    </div>
                </div>

            </div>
        </Card>
    );
};

export default BookingLegend;
