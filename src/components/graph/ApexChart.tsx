/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import ReactApexChart from 'react-apexcharts';
import './ApexChart.css';

type ApexChartProps = {
	options: any;
	series: any;
	type?: string;
	height?: string | number;
	graphTitle?: React.ReactNode;
	graphIcon?: React.ReactNode;
	graphDescription?: React.ReactNode;
	graphBottom?: React.ReactNode;
};

const ApexChart: React.FC<ApexChartProps> = ({
	options,
	series,
	type,
	height,
	graphTitle,
	graphIcon,
	graphDescription,
	graphBottom
}) => {
	return (
		<div className="graph-wrapper">
			<div className="graph-top">
				<h2>{graphTitle}</h2>
				<div className="graph-data">
					<div className="graph-icon">{graphIcon || ''}</div>
					<div className="graph-description">{graphDescription}</div>
				</div>
			</div>
			<ReactApexChart
				options={options}
				series={series}
				type={type || 'line'}
				height={height}
				width={'100%'}
			/>
			<div className="graph-bottom">{graphBottom}</div>
		</div>
	);
};

export default React.memo(ApexChart);
