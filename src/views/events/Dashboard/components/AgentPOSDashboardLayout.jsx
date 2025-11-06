import React, { Fragment, useMemo } from "react";
import { Row, Alert } from "antd";
import { useMyContext } from "Context/MyContextProvider";
import GraphAndCardsLayout from "./GraphAndCardsLayout";
// import MobBookingButton from "../CustomUtils/BookingUtils/MobBookingButton";
import {
  getAgentPOSSalesStats,
  getBookingTicketStats,
} from "./dashboardConfig";
import { useAgentPOSDashboard } from "./useAgentPOSDashboard";
import DashSkeleton from "../Admin/DashSkeleton";

const AgentPOSDashboardLayout = ({type}) => {
  const { api, UserData, authToken, userRole } = useMyContext();

  const { sale, isLoading, error } = useAgentPOSDashboard(
    api,
    UserData?.id,
    authToken,
    type
  );

  const getLast7DaysWeekdays = () => {
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    const result = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      result.push(days[d.getDay()]);
    }
    return result;
  };

  const colors = useMemo(() => ["var(--primary-color)", "var(--secondary-color)"], []);
  
  const commonChartOptions = useMemo(() => ({
    chart: { stacked: true, toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: "10%", borderRadius: 4 } },
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 3, colors: ["transparent"] },
    grid: { show: true, strokeDashArray: 7 },
    xaxis: { categories: getLast7DaysWeekdays() },
    tooltip: { y: { formatter: (val) => `₹${val}` } },
  }), []);

  const saleChart = useMemo(() => ({
    options: { ...commonChartOptions, colors },
    series: [
      { name: "Total Sale", data: sale?.salesDataNew?.data || [] },
    ],
  }), [commonChartOptions, colors, sale?.salesDataNew]);

  const convChart = useMemo(() => ({
    options: { ...commonChartOptions, colors },
    series: [
      { name: "Total Conversion", data: sale?.convenience_fee?.last_7_days?.data || [] },
    ],
  }), [commonChartOptions, colors, sale?.convenience_fee]);

  const isAgent = ['Agent', 'Sponsor', 'Accreditation', 'Organizer'].includes(userRole);
  const isPOS = ['Corporate', 'POS', 'Organizer'].includes(userRole);

  if (!UserData?.id) {
    return (
      <div className="p-4">
        <Alert
          message="Missing User Data"
          description="User information is required to load the dashboard."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert
          message="Error"
          description="Failed to load dashboard data. Please try again later."
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (isLoading) {
    return <DashSkeleton />;
  }

  const graphValue = isAgent ? sale?.agents : sale?.pos;

  // Dashboard layout - DataCard will be used automatically via GraphAndCardsLayout
  const dashboardLayout = {
    graphTitle: "Last 7 Days Sales",
    convGraphTitle: "Last 7 Days Convincence Fees",
    graphValue: graphValue,
    chartOptions: saleChart.options,
    chartSeries: saleChart.series,
    convChartOptions: convChart.options,
    convChartSeries: convChart.series,
    cards1: getAgentPOSSalesStats(sale, userRole), // Already has icon and color
    cards2: getBookingTicketStats(sale), // Already has icon and color
    isAgent,
    sale,
  };



//   const bookingRoute = userRole === "Agent" 
//     ? "/dashboard/agent-bookings/new" 
//     : "/dashboard/pos";

  return (
    <Fragment>
      {/* {isMobile && (isAgent || isPOS) && (
        <MobBookingButton to={bookingRoute} />
      )} */}

      {(isAgent || isPOS) && (
        <>
          {/* Graph and DataCards Section - Uses DataCard internally */}
          <Row gutter={[16, 16]}>
            <GraphAndCardsLayout {...dashboardLayout} />
          </Row>
        </>
      )}

      {!isAgent && !isPOS && (
        <div className="p-4">
          <Alert
            message="Access Denied"
            description="You don't have permission to view this dashboard."
            type="warning"
            showIcon
          />
        </div>
      )}
    </Fragment>
  );
};

export default AgentPOSDashboardLayout;