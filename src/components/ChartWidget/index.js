import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import ApexChart from "react-apexcharts";
import {
	apexLineChartDefaultOption,
	apexBarChartDefaultOption,
	apexAreaChartDefaultOption
} from 'constants/ChartConstant';
import { useResizeDetector } from 'react-resize-detector';
import { DIR_RTL } from 'constants/ThemeConstant';
import { Card } from 'antd';

const titleStyle = {
	position: 'absolute',
	zIndex: '1'
}

const extraStyle = {
	position: 'absolute',
	zIndex: '1',
	right: '0',
	top: '-2px'
}

const getChartTypeDefaultOption = type => {
	switch (type) {
		case 'line':
			return apexLineChartDefaultOption
		case 'bar':
			return apexBarChartDefaultOption
		case 'area':
			return apexAreaChartDefaultOption
		default:
			return apexLineChartDefaultOption;
	}
}

const ChartWidget = ({ title, series, width, height, xAxis, customOptions, card, type, extra, direction, bodyClass }) => {
	let options = JSON.parse(JSON.stringify(getChartTypeDefaultOption(type)))
	const isMobile = window.innerWidth < 768
	const setLegendOffset = () => {
		if (chartRef.current) {
			const lengend = chartRef.current.querySelectorAll('div.apexcharts-legend')[0]
			if (lengend) {
				lengend.style.marginRight = `${isMobile ? 0 : extraRef.current?.offsetWidth}px`
				if (direction === DIR_RTL) {
					lengend.style.right = 'auto'
					lengend.style.left = '0'
				}
				if (isMobile) {
					lengend.style.position = 'relative'
					lengend.style.top = 0
					lengend.style.justifyContent = 'start';
					lengend.style.padding = 0;
				}
			}
		}
	}

	useEffect(() => {
		setLegendOffset()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const extraRef = useRef(null);
	const chartRef = useRef();

	options.xaxis.categories = xAxis

	// Apply gradient effect for area charts
	if (type === 'area') {
		options = {
			...options,
			colors: ['#ff4d4f', '#faad14'],
			fill: {
				type: "gradient",
				gradient: {
					shadeIntensity: 0,       // This is KEY - prevents color washing
					opacityFrom: 0.4,          // Transparent at top
					opacityTo: 0,            // Full opacity at bottom
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
				...options.chart,
				zoom: {
					enabled: false
				},
				background: 'transparent'  // Ensure chart background is transparent
			},
			legend: {
				...options.legend,
				position: 'top',
				horizontalAlign: 'right',
				markers: {
					width: 10,
					height: 10,
					radius: 12
				}
			},
			tooltip: {
				...options.tooltip,
				theme: 'dark',  // Changed to 'dark' for dark theme
			},
			grid: {
				borderColor: '#333'  // Optional: darker grid lines for dark theme
			}
		}
	}

	if (customOptions) {
		options = { ...options, ...customOptions }
	}

	const onResize = () => {
		setTimeout(() => {
			setLegendOffset()
		}, 600);
	}

	const { ref: resizeRef } = useResizeDetector({
		onResize: () => {
			onResize()
		}
	});

	const renderChart = () => (
		<div ref={resizeRef}>
			<div style={direction === DIR_RTL ? { direction: 'ltr' } : {}} className="chartRef" ref={chartRef}>
				<ApexChart options={options} type={type} series={series} width={width} height={height} />
			</div>
		</div>
	)

	return (
		<>
			{card ?
				<Card bordered={false}>
					<div className={`position-relative ${bodyClass}`}>
						{title && <h4 className="font-weight-bold" style={!isMobile ? titleStyle : {}}>{title}</h4>}
						{extra && <div ref={extraRef} style={!isMobile ? extraStyle : {}}>{extra}</div>}
						{renderChart()}
					</div>
				</Card>
				:
				renderChart()
			}
		</>
	)
}

ChartWidget.propTypes = {
	title: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.element
	]),
	series: PropTypes.array.isRequired,
	xAxis: PropTypes.array,
	customOptions: PropTypes.object,
	width: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.number
	]),
	height: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.number
	]),
	card: PropTypes.bool,
	type: PropTypes.string,
	extra: PropTypes.element,
	bodyClass: PropTypes.string,
	direction: PropTypes.string
}

ChartWidget.defaultProps = {
	series: [],
	height: 300,
	width: '100%',
	card: true,
	type: 'line'
};

export default ChartWidget