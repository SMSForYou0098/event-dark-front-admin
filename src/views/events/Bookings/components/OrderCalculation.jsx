import React from 'react'
const OrderCalculation = (props) => {
  const { ticketCurrency, selectedTickets = [] } = props

  const safe = (n) => Number.isFinite(n) ? n : 0

  // Sub Total = sum of (ticket price * quantity)
  const subtotal = selectedTickets
    .reduce((acc, t) => acc + safe(t.price) * safe(t.quantity), 0)
    .toFixed(2)

  // Totals using new fields with fallbacks to compute if missing
  const baseAmount = selectedTickets
    .reduce((acc, t) => acc + (
      t.totalBaseAmount ??
      (safe(t.baseAmount) * safe(t.quantity)) ??
      (safe(t.price) * safe(t.quantity))
    ), 0)
    .toFixed(2)

  const centralGST = selectedTickets
    .reduce((acc, t) => acc + (
      t.totalCentralGST ??
      (safe(t.centralGST) * safe(t.quantity)) ??
      0
    ), 0)
    .toFixed(2)

  const stateGST = selectedTickets
    .reduce((acc, t) => acc + (
      t.totalStateGST ??
      (safe(t.stateGST) * safe(t.quantity)) ??
      0
    ), 0)
    .toFixed(2)

  const totalTax = (
    (parseFloat(centralGST) || 0) + (parseFloat(stateGST) || 0)
  ).toFixed(2)

  const convenienceFee = selectedTickets
    .reduce((acc, t) => acc + (
      t.totalConvenienceFee ??
      (safe(t.convenienceFee) * safe(t.quantity)) ??
      0
    ), 0)
    .toFixed(2)

  // Optional: discount if you add it per ticket later; currently 0
  const discount = (0).toFixed(2)

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
        <h5 className="text-success">{ticketCurrency}{stateGST}</h5>
      </div>
      <div className="d-flex justify-content-between">
        <h5>Convenience fees</h5>
        <h5 className="text-success">{ticketCurrency}{convenienceFee}</h5>
      </div>
    </>
  )
}

export default OrderCalculation