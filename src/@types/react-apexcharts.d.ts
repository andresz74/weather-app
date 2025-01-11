declare module 'react-apexcharts' {
	import { Component } from 'react';
	import ApexCharts, { ApexOptions } from 'apexcharts';

	export interface Props {
		options: ApexOptions;
		series: ApexCharts.ApexOptions['series'];
		type?: ApexCharts.ApexChart['type'];
		width?: string | number;
		height?: string | number;
	}

	export default class ReactApexChart extends Component<Props> {}
}
