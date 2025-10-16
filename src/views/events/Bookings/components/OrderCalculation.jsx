import React from 'react'
const OrderCalculation = (props) => {
    // use toFixed(2) to the values
    const { ticketCurrency, selectedTickets } = props
    const subtotal = selectedTickets.reduce((acc, curr) => acc + curr.price, 0).toFixed(2);
    const discount = selectedTickets.reduce((acc, curr) => acc + curr.discount * curr.quantity, 0).toFixed(2);
    const baseAmount = selectedTickets.reduce((acc, curr) => acc + curr.price * curr.quantity, 0).toFixed(2);
    const centralGST = selectedTickets.reduce((acc, curr) => acc + (curr.price * curr.quantity) * 0.09, 0).toFixed(2);
    const totalTax = selectedTickets.reduce((acc, curr) => acc + (curr.price * curr.quantity) * 0.09, 0).toFixed(2);
    const convenienceFee = selectedTickets.reduce((acc, curr) => acc + (curr.price * curr.quantity) * 0.1, 0).toFixed(2);
    // add another for convinence of 10 % and add total amount below the total tax
    // const grandTotal = (subtotal + discount + baseAmount + centralGST + totalTax + convenienceFee).toFixed(2);
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
                <h5 className="text-success">{ticketCurrency}{convenienceFee}</h5>
            </div>
        </>
    )
}

export default OrderCalculation
