import React from 'react'
const OrderCalculation = (props) => {
    const { ticketCurrency, subtotal, discount, baseAmount, centralGST, totalTax } = props
    return (
        <>
            <div className="d-flex justify-content-between mb-4">
                <h6>Sub Total</h6>
                <h6 className="text-primary">{ticketCurrency}{subtotal}</h6>
            </div>
            <div className="d-flex justify-content-between mb-4">
                <h6>Discount</h6>
                <h6 className="text-success">{ticketCurrency}{discount}</h6>
            </div>
            <div className="d-flex justify-content-between mb-4">
                <h6>Base Amount</h6>
                <h6 className="text-success">{ticketCurrency}{baseAmount}</h6>
            </div>
            <div className="d-flex justify-content-between mb-4">
                <h6>Central GST (CGST) @ 9%</h6>
                <h6 className="text-success">{ticketCurrency}{centralGST}</h6>
            </div>
            <div className="d-flex justify-content-between mb-4">
                <h6>State GST (SGST) @ 9%</h6>
                <h6 className="text-success">{ticketCurrency}{centralGST}</h6>
            </div>
            <div className="d-flex justify-content-between mb-4">
                <h6>Convenience fees</h6>
                <h6 className="text-success">{ticketCurrency}{totalTax}</h6>
            </div>
        </>
    )
}

export default OrderCalculation
