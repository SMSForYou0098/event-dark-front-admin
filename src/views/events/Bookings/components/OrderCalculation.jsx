import React from 'react'
const OrderCalculation = (props) => {
    const { ticketCurrency, subtotal, discount, baseAmount, centralGST, totalTax } = props
    return (
        <>
            <div className="d-flex justify-content-between mb-2">
                <h5>Sub Total</h5>
                <h5 className="text-primary">{ticketCurrency}{subtotal}</h5>
            </div>
            <div className="d-flex justify-content-between mb-2">
                <h5>Discount</h5>
                <h5 className="text-success">{ticketCurrency}{discount}</h5>
            </div>
            <div className="d-flex justify-content-between mb-2">
                <h5>Base Amount</h5>
                <h5 className="text-success">{ticketCurrency}{baseAmount}</h5>
            </div>
            <div className="d-flex justify-content-between mb-2">
                <h5>Central GST (CGST) @ 9%</h5>
                <h5 className="text-success">{ticketCurrency}{centralGST}</h5>
            </div>
            <div className="d-flex justify-content-between mb-2">
                <h5>State GST (SGST) @ 9%</h5>
                <h5 className="text-success">{ticketCurrency}{centralGST}</h5>
            </div>
            <div className="d-flex justify-content-between">
                <h5>Convenience fees</h5>
                <h5 className="text-success">{ticketCurrency}{totalTax}</h5>
            </div>
        </>
    )
}

export default OrderCalculation
