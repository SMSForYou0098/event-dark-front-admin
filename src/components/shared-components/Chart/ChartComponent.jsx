import React from 'react';
import Chart from 'react-apexcharts';
import { CHART_COLORS } from 'utils/consts';

/**
 * Reusable Chart Component for ApexCharts
 * Supports: pie, donut, bar, area, line, etc.
 */
const ChartComponent = ({
  type = 'donut',
  series,
  labels,
  colors,
  height = 200,
  legendPosition = 'bottom',
  dataLabelsEnabled = false,
  donutSize = '85%',
  showStroke = false,
  customOptions = {},
}) => {
  // Validate input data
  if (!series || series.length === 0 || !labels || labels.length === 0) {
    return null;
  }

  const chartColors = colors || CHART_COLORS;

  // Capitalize labels
  const capitalizedLabels = (labels || []).map(label =>
    typeof label === 'string' ? label.charAt(0).toUpperCase() + label.slice(1) : label
  );

  // Base options structure
  const baseOptions = {
    chart: {
      type,
      sparkline: { enabled: false },
      toolbar: {
        show: false,
      },
    },
    labels: capitalizedLabels || [],
    colors: chartColors,
    dataLabels: {
      enabled: dataLabelsEnabled,
    },
    stroke: {
      show: showStroke,
    },
    legend: {
      position: legendPosition,
      fontSize: '11px',
      fontFamily: 'inherit',
      labels: {
        colors: '#fff',
      },
    },
  };

  // Add donut/pie specific options
  if (type === 'donut' || type === 'pie') {
    baseOptions.plotOptions = {
      pie: {
        donut: {
          size: donutSize,
        },
      },
    };
  }

  // Add bar specific options
  if (type === 'bar') {
    baseOptions.plotOptions = {
      bar: {
        horizontal: false,
        columnWidth: '55%',
      },
    };
    baseOptions.xaxis = {
      categories: capitalizedLabels,
      labels: {
        style: {
          colors: '#fff',
        },
      },
    };
    baseOptions.yaxis = {
      labels: {
        style: {
          colors: '#fff',
        },
      },
    };
  }

  // Add area specific options
  if (type === 'area') {
    baseOptions.xaxis = {
      categories: capitalizedLabels,
      labels: {
        style: {
          colors: '#fff',
        },
      },
    };
    baseOptions.yaxis = {
      labels: {
        style: {
          colors: '#fff',
        },
      },
    };
  }

  // Merge custom options
  const finalOptions = {
    ...baseOptions,
    ...customOptions,
  };

  return (
    <Chart
      type={type}
      series={series}
      options={finalOptions}
      height={height}
    />
  );
};

export default ChartComponent;
