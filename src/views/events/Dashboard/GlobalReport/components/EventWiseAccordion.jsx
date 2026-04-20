import React from 'react';
import { Collapse, Empty } from 'antd';
import ReportSummaryCards from './ReportSummaryCards';
import ReportTables from './ReportTables';
import { getChannelCardVisibility } from '../utils/reportHelpers';

const EventWiseAccordion = ({ events = [], submittedChannels = [] }) => {
  const { showOnlineCard, showOfflineCard } = getChannelCardVisibility(submittedChannels);
  const eventList = Array.isArray(events) ? events : Object.values(events || {});

  if (!eventList.length) {
    return <Empty description="No event-wise data" />;
  }

  return (
    <Collapse accordion>
      {eventList.map((event, index) => (
        <Collapse.Panel
          key={String(event?.id || index)}
          header={
            <div className="d-flex align-items-center justify-content-between w-100 pr-2">
              <span>{event?.name || `Event ${event?.id || index + 1}`}</span>
            </div>
          }
        >
          <ReportSummaryCards reportData={event} />

          <ReportTables
            reportData={event}
            showOnlinePaymentGateways={showOnlineCard}
            showOfflineBookingType={showOfflineCard}
          />
        </Collapse.Panel>
      ))}
    </Collapse>
  );
};

export default EventWiseAccordion;
