function safe(n) { return Number.isFinite(n) ? n : 0; }

export function getSubtotal(tickets = []) {
  return tickets.reduce((acc, t) => acc + safe(t.price) * safe(t.quantity), 0).toFixed(2);
}

export function getBaseAmount(tickets = [], discount = 0) {
  const subtotal = parseFloat(getSubtotal(tickets));
  const discountAmount = safe(discount);
  return (subtotal - discountAmount).toFixed(2);
}

export function getCentralGST(tickets = []) {
  return tickets.reduce((acc, t) =>
    acc + (t.totalCentralGST ?? (safe(t.centralGST) * safe(t.quantity)) ?? 0),
    0).toFixed(2);
}

export function getStateGST(tickets = []) {
  return tickets.reduce((acc, t) =>
    acc + (t.totalStateGST ?? (safe(t.stateGST) * safe(t.quantity)) ?? 0),
    0).toFixed(2);
}

export function getTotalTax(tickets = []) {
  return (
    parseFloat(getCentralGST(tickets)) + parseFloat(getStateGST(tickets))
  ).toFixed(2);
}

export function getConvenienceFee(tickets = []) {
  return tickets.reduce((acc, t) =>
    acc + (t.totalConvenienceFee ?? (safe(t.convenienceFee) * safe(t.quantity)) ?? 0),
    0).toFixed(2);
}

export function getGrandTotal(tickets = [], discount = 0) {
  const baseAmount = parseFloat(getBaseAmount(tickets, discount));
  const centralGST = parseFloat(getCentralGST(tickets));
  const stateGST = parseFloat(getStateGST(tickets));
  const convenienceFee = parseFloat(getConvenienceFee(tickets));
  
  return (baseAmount + centralGST + stateGST + convenienceFee).toFixed(2);
}

export function calcTicketTotals(tickets = [], discount = 0) {
  return {
    subtotal: getSubtotal(tickets),
    baseAmount: getBaseAmount(tickets, discount),
    centralGST: getCentralGST(tickets),
    stateGST: getStateGST(tickets),
    totalTax: getTotalTax(tickets),
    convenienceFee: getConvenienceFee(tickets),
    grandTotal: getGrandTotal(tickets, discount)
  };
}

