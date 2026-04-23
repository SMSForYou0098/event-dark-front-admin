import React from 'react';
import { Collapse, Empty, Space } from 'antd';
import ReportSummaryCards from './ReportSummaryCards';
import ReportTables from './ReportTables';
import { getChannelCardVisibility } from '../utils/reportHelpers';
import EventHtmlExporter from './EventHtmlExporter';

const EventWiseAccordion = ({
  events = [],
  submittedChannels = [],
  canExport = false,
}) => {
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
              <Space size={8} style={{ justifyContent: 'space-between', width: '100%' }}>
                <span>{event?.name || `Event ${event?.id || index + 1}`}</span>
                {canExport && (
                  <EventHtmlExporter
                    eventData={event}
                    buttonSize="small"
                  />
                )}
              </Space>
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
