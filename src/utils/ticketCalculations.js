function safe(n) { 
  return Number.isFinite(n) ? n : 0; 
}

export function getSubtotal(tickets = []) {
  return tickets.reduce((acc, t) => acc + safe(t.price) * safe(t.quantity), 0).toFixed(2);
}

// ✅ UPDATED: Distribute discount and recalculate ALL values
export function distributeDiscount(tickets = [], totalDiscountAmount = 0) {
  if (!totalDiscountAmount || totalDiscountAmount <= 0) {
    // Return original tickets without discount modifications
    return tickets.map(ticket => ({
      ...ticket,
      discount: 0,
      discountPerUnit: 0,
    }));
  }

  const subtotal = parseFloat(getSubtotal(tickets));
  let remainingDiscount = totalDiscountAmount;

  return tickets.map((ticket, index, array) => {
    const ticketSubtotal = safe(ticket.price) * safe(ticket.quantity);
    const ticketDiscountRatio = ticketSubtotal / subtotal;

    // For the last ticket, use remaining discount to fix rounding differences
    let ticketTotalDiscount;
    if (index === array.length - 1) {
      ticketTotalDiscount = remainingDiscount;
    } else {
      ticketTotalDiscount = totalDiscountAmount * ticketDiscountRatio;
      remainingDiscount -= ticketTotalDiscount;
    }

    const quantity = safe(ticket.quantity);
    const discountPerUnit = ticketTotalDiscount / quantity;

    // ✅ Only adjust base amounts
    const newBaseAmount = safe(ticket.baseAmount) - discountPerUnit;
    const newTotalBaseAmount = newBaseAmount * quantity;

    // Taxes and fees stay the same as before
    const centralGST = safe(ticket.centralGST);
    const stateGST = safe(ticket.stateGST);
    const convenienceFee = safe(ticket.convenienceFee);

    const finalAmount = newBaseAmount + centralGST + stateGST + convenienceFee;
    const totalFinalAmount = finalAmount * quantity;

    return {
      ...ticket,
      // ✅ Update only base amount values
      baseAmount: +newBaseAmount.toFixed(2),
      totalBaseAmount: +newTotalBaseAmount.toFixed(2),

      // Keep other fields unchanged
      centralGST: +centralGST.toFixed(2),
      stateGST: +stateGST.toFixed(2),
      convenienceFee: +convenienceFee.toFixed(2),

      totalCentralGST: +(centralGST * quantity).toFixed(2),
      totalStateGST: +(stateGST * quantity).toFixed(2),
      totalConvenienceFee: +(convenienceFee * quantity).toFixed(2),

      // Recalculate total tax and final
      totalTaxTotal: +((centralGST + stateGST) * quantity).toFixed(2),
      totalFinalAmount: +totalFinalAmount.toFixed(2),

      // Discount tracking
      discount: +ticketTotalDiscount.toFixed(2),
      discountPerUnit: +discountPerUnit.toFixed(2),
    };
  });
}


export function getTotalDiscount(tickets = []) {
  return tickets.reduce((acc, t) => acc + safe(t.discount), 0).toFixed(2);
}

export function getDiscountDetails(tickets = []) {
  const totalDiscount = parseFloat(getTotalDiscount(tickets));
  const subtotal = parseFloat(getSubtotal(tickets));
  
  if (totalDiscount === 0 || subtotal === 0) {
    return {
      value: 0,
      amount: 0,
      percentage: 0,
    };
  }
  
  const percentage = ((totalDiscount / subtotal) * 100).toFixed(2);
  
  return {
    value: totalDiscount,
    amount: totalDiscount,
    percentage: parseFloat(percentage),
  };
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
  const totalDiscount = parseFloat(getTotalDiscount(tickets));
  const finalDiscount = discount || totalDiscount;
  
  return {
    subtotal: getSubtotal(tickets),
    totalDiscount: getTotalDiscount(tickets),
    discountDetails: getDiscountDetails(tickets),
    discount: finalDiscount,
    baseAmount: getBaseAmount(tickets, finalDiscount),
    centralGST: getCentralGST(tickets),
    stateGST: getStateGST(tickets),
    totalTax: getTotalTax(tickets),
    convenienceFee: getConvenienceFee(tickets),
    grandTotal: getGrandTotal(tickets, finalDiscount),
  };
}