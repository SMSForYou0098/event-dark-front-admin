import React from 'react'
import DiscoutFIeldGroup from './DiscoutFIeldGroup'
import Flex from 'components/shared-components/Flex'
import { Typography } from 'antd';
import { calcTicketTotals } from 'utils/ticketCalculations';
const { Title } = Typography;

const OrderCalculation = (props) => {
  const { ticketCurrency, selectedTickets = [] } = props;
  const {
    subtotal,
    baseAmount,
    centralGST,
    stateGST,
    convenienceFee,
    grandTotal,
  } = calcTicketTotals(selectedTickets);
  const discount = (0).toFixed(2);

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

      <DiscoutFIeldGroup {...props} />

      <Flex justifyContent="space-between" align="center">
        <Title level={5} style={{ margin: 0 }}>Order Total</Title>
        <Title level={3} type="primary" style={{ margin: 0 }}>
          {ticketCurrency}{grandTotal}
        </Title>
      </Flex>
    </>
  )
}

export default OrderCalculation