import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Space } from "antd";
import axios from "axios";
import Chart from "react-apexcharts";
import { COLORS } from 'constants/ChartConstant';
import LiveUserListing from "./LiveUserListing";
import { useMyContext } from "Context/MyContextProvider";
import ChartWidget from "components/ChartWidget";
import EventNotification from "../Notification/EventNotification";
import PushNotificationButton from "../Notification/PushNotificationButton";

const LiveUsers = () => {
  const [users, setUsers] = useState([]);
  const { api, authToken } = useMyContext();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("");
  const [chartData, setChartData] = useState({
    devices: { series: [], labels: [] },
    platforms: { series: [], categories: [] },
    browsers: { series: [], categories: [] },
  });

  useEffect(() => {
    const fetchLiveUsers = async () => {
      setLoading(true);
      try {
        const queryParams = dateRange ? `?date=${dateRange}` : "";
        const url = `${api}live-user${queryParams}`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setUsers(response.data.data.reverse());

        const stats = {
          devices: {},
          platforms: {},
          browsers: {},
        };

        response.data.data.forEach((user) => {
          stats.devices[user.device] = (stats.devices[user.device] || 0) + 1;
          stats.platforms[user.platform] = (stats.platforms[user.platform] || 0) + 1;
          stats.browsers[user.browser] = (stats.browsers[user.browser] || 0) + 1;
        });

        setChartData({
          devices: {
            series: Object.values(stats.devices),
            labels: Object.keys(stats.devices),
          },
          platforms: {
            series: [{ name: 'Users', data: Object.values(stats.platforms) }],
            categories: Object.keys(stats.platforms),
          },
          browsers: {
            series: [{ name: 'Users', data: Object.values(stats.browsers) }],
            categories: Object.keys(stats.browsers),
          },
        });
      } catch (error) {
        console.error("Error fetching live users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveUsers();
  }, [api, authToken, dateRange]);

  // Donut Chart Options
  const donutOptions = {
    colors: COLORS,
    labels: chartData.devices.labels,
    legend: {
      position: 'bottom',
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { width: 200 },
        legend: { position: 'bottom' }
      }
    }],
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontSize: '16px',
              fontWeight: 600,
            }
          }
        }
      }
    }
  };

  // Bar Chart Custom Options for Platforms
  const platformOptions = {
    colors: ['#3f8600'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '50%',
      }
    },
    dataLabels: {
      enabled: false
    }
  };

  // Area Chart Custom Options for Browsers with gradient
  const browserOptions = {
    colors: ['#1890ff'],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0,
        opacityFrom: 0,
        opacityTo: 0.9,
        stops: [0, 100]
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    dataLabels: {
      enabled: false
    },
    chart: {
      zoom: {
        enabled: false
      }
    }
  };

  return (
    <div className="live-users-container">
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card bordered={false}>
            <h4 className="font-weight-bold mb-3">Device Distribution</h4>
            <div style={{ height: '300px' }}>
              <Chart
                options={donutOptions}
                series={chartData.devices.series}
                type="donut"
                height={300}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <ChartWidget
            title="Platform Stats"
            series={chartData.platforms.series}
            xAxis={chartData.platforms.categories}
            height={300}
            type="bar"
            customOptions={platformOptions}
          />
        </Col>

        <Col xs={24} lg={8}>
          <ChartWidget
            title="Browser Trends"
            series={chartData.browsers.series}
            xAxis={chartData.browsers.categories}
            height={300}
            type="area"
            customOptions={browserOptions}
          />
        </Col>
      </Row>

      <div style={{ marginTop: '24px' }}>
        <Card bordered={false} title={`Total Active Users: ${users?.length}`} extra={
           <Space size='small'>
              <EventNotification />
              <PushNotificationButton />
            </Space>
        }>
          <Row gutter={16}>
            {chartData.devices.labels.map((device, index) => (
              <Col key={index}>
                <Statistic
                  title={device}
                  value={chartData.devices.series[index]}
                  valueStyle={{ color: COLORS[index] }}
                />
              </Col>
            ))}
          </Row>
        </Card>
      </div>

      <LiveUserListing
        data={users}
        loading={loading}
        setDateRange={setDateRange}
        dateRange={dateRange}
      />
    </div>
  );
};

export default LiveUsers;