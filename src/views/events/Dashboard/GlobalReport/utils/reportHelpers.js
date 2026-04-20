export const formatCurrency = (value) => `₹${Number(value || 0).toFixed(2)}`;

export const buildGlobalReportPayload = (values) => {
  const isCustomDate = values?.duration === 'custom_date';
  const customDateRange = Array.isArray(values?.customDateRange) ? values.customDateRange : [];

  const formattedCustomDateRange =
    isCustomDate && customDateRange.length === 2
      ? [
          customDateRange[0]?.format?.('YYYY-MM-DD'),
          customDateRange[1]?.format?.('YYYY-MM-DD'),
        ]
      : [];

  return {
    ...values,
    duration: values?.duration || 'overall',
    channel: values?.channel || [],
    bookingType: values?.channel?.includes('offline') ? (values?.bookingType || []) : [],
    customDateRange: formattedCustomDateRange,
    start_date: formattedCustomDateRange[0] || null,
    end_date: formattedCustomDateRange[1] || null,
  };
};

export const getBookingTypeRows = (reportData) => {
  const byBookingType = reportData?.offline;

  if (Array.isArray(byBookingType)) {
    return byBookingType.map((item, index) => ({
      key: item?.booking_type || item?.type || String(index),
      booking_type: item?.booking_type || item?.type || '-',
      booking_count: item?.booking_count ?? 0,
      total_amount: item?.total_amount ?? 0,
      total_quantity: item?.total_quantity ?? 0,
      total_discount: item?.total_discount ?? 0,
    }));
  }

  return Object.entries(byBookingType || {}).map(([type, stats]) => ({
    key: type,
    booking_type: type,
    booking_count: stats?.booking_count ?? 0,
    total_amount: stats?.total_amount ?? 0,
    total_quantity: stats?.total_quantity ?? 0,
    total_discount: stats?.total_discount ?? 0,
  }));
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

const resolveSalesArray = (reportData, key) => {
  if (Array.isArray(reportData?.[key])) return reportData[key];
  if (Array.isArray(reportData?.offline?.[key])) return reportData.offline[key];
  return [];
};

export const getUserWiseSales = (reportData) => {
  const offline = reportData?.offline || {};
  const hasPayload =
    hasOwn(reportData, 'agent_wise_sales') ||
    hasOwn(reportData, 'pos_wise_sales') ||
    hasOwn(reportData, 'sponsor_wise_sales') ||
    hasOwn(offline, 'agent_wise_sales') ||
    hasOwn(offline, 'pos_wise_sales') ||
    hasOwn(offline, 'sponsor_wise_sales');

  return {
    hasPayload,
    agentWiseSales: resolveSalesArray(reportData, 'agent_wise_sales'),
    posWiseSales: resolveSalesArray(reportData, 'pos_wise_sales'),
    sponsorWiseSales: resolveSalesArray(reportData, 'sponsor_wise_sales'),
  };
};

export const getChannelCardVisibility = (submittedChannels = []) => {
  const hasSingleChannelSelection = submittedChannels.length === 1;
  const showOnlineCard = !hasSingleChannelSelection || submittedChannels.includes('online');
  const showOfflineCard = !hasSingleChannelSelection || submittedChannels.includes('offline');

  return {
    showOnlineCard,
    showOfflineCard,
    channelCardMdSpan: showOnlineCard && showOfflineCard ? 12 : 24,
  };
};
