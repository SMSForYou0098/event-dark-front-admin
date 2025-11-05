import React, { Fragment, useMemo } from "react";
import { Row, Col, Alert } from "antd";
import { useMyContext } from "Context/MyContextProvider";
import GraphAndCardsLayout from "./GraphAndCardsLayout";
import PaymentStatsCard from "./PaymentStatsCard";
// import MobBookingButton from "../CustomUtils/BookingUtils/MobBookingButton";
import {
  getAgentPOSSalesStats,
  getBookingTicketStats,
  getAgentPaymentStats,
  getPOSPaymentStats,
} from "./dashboardConfig";
import { useAgentPOSDashboard } from "./useAgentPOSDashboard";
import DashSkeleton from "../Admin/DashSkeleton";

const AgentPOSDashboardLayout = ({type}) => {
  const { api, UserData, authToken, userRole, isMobile } = useMyContext();

  const { sale, weeklySales, isLoading, error } = useAgentPOSDashboard(
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

  const colors = useMemo(() => ["#1677ff", "#13c2c2"], []);
  
  const commonChartOptions = useMemo(() => ({
    chart: { stacked: true, toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: "28%", borderRadius: 4 } },
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
      { name: "Online Sale", data: weeklySales?.[0]?.data || [] },
      { name: "Offline Sale", data: weeklySales?.[1]?.data || [] },
    ],
  }), [commonChartOptions, colors, weeklySales]);

  const isAgent = ['Agent', 'Sponsor', 'Accreditation', 'Organizer'].includes(userRole);
  const isPOS = ['Corporate', 'POS'].includes(userRole);

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
    graphTitle: "Total Sales",
    graphValue: graphValue,
    chartOptions: saleChart.options,
    chartSeries: saleChart.series,
    cards1: getAgentPOSSalesStats(sale, userRole), // Already has icon and color
    cards2: getBookingTicketStats(sale), // Already has icon and color
  };

  const paymentStats = isAgent 
    ? getAgentPaymentStats(sale) 
    : getPOSPaymentStats(sale);

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

          {/* Payment Statistics Section - Uses PaymentStatsCard */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {paymentStats.map((card, i) => (
              <PaymentStatsCard key={i} {...card} />
            ))}
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