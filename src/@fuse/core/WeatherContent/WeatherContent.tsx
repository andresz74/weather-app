/* eslint-disable no-console */
import React from 'react';
import { WeatherDayData, WeatherHourData } from '@/utils/apiWeather';
import ApexChart from '@/components/graph/ApexChart';
import './WeatherContent.css';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

/**
 * WeatherContent is a React component used to render weather-related content.
 * It accepts `nextDate` and `nextWeekDate` as props, displaying weather-related data.
 */
type WeatherContentProps = {
	nextDate: string | null;
	nextDateWeather: WeatherDayData;
	nextDateHourlyData: WeatherHourData[];
	nextWeekDate: string | null;
	nextWeekDateWeather: WeatherDayData;
	nextWeekDateHourlyData: WeatherHourData[];
	selectedTime: string;
};

const WeatherContent: React.FC<WeatherContentProps> = ({
	nextDate,
	nextDateWeather,
	nextDateHourlyData,
	nextWeekDate,
	nextWeekDateWeather,
	nextWeekDateHourlyData,
	selectedTime
}) => {
	console.log(nextDateHourlyData);
	// Prepare chart data for Next Date
	const getDateCategories = (date: string, hourlyData: WeatherHourData[]): string[] => {
		return hourlyData.map((hour) => {
			// Combine the date and time for a valid ISO datetime
			const fullDatetime = `${date}T${hour.datetime}`;
			return new Date(fullDatetime).toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit'
			});
		});
	};

	const extractTemperatureRange = (data) => {
		// Extract temperatures
		const temperatures = data.map((hour) => hour.temp);

		// Find max and min temperatures
		const maxTemp = Math.max(...temperatures);
		const minTemp = Math.min(...temperatures);

		// Add gaps
		const adjustedMax = maxTemp + 1;
		const adjustedMin = minTemp - 1;

		return { maxTemp: adjustedMax, minTemp: adjustedMin };
	};
	const weatherNextDateMaxMin = extractTemperatureRange(nextDateHourlyData);
	const nextDateCategories = nextDateHourlyData.length > 0 ? getDateCategories(nextDate, nextDateHourlyData) : [];
	const nextDateOptions = {
		chart: {
			type: 'line' as const,
			zoom: {
				enabled: false
			},
			toolbar: {
				show: false
			},
			animations: {
				enabled: true,
				speed: 800, // Animation speed for initial rendering
				animateGradually: {
					enabled: true, // Gradual animation
					delay: 150 // Delay between animated points
				},
				dynamicAnimation: {
					enabled: true, // Dynamic updates animation
					speed: 350 // Speed for dynamic updates
				}
			}
		},
		colors: ['#004E98'],
		stroke: {
			curve: 'smooth' as const
		},
		xaxis: {
			categories: nextDateCategories,
			labels: {
				style: {
					colors: nextDateCategories.map((hour) => {
						// Change color for the first and last hour
						if (
							hour === nextDateCategories[0] ||
							hour === nextDateCategories[nextDateCategories.length - 1]
						) {
							return '#AAA';
						}

						return '#000'; // Default color for other hours
					}),
					fontSize: '11px'
				}
			}
		},
		yaxis: {
			max: weatherNextDateMaxMin.maxTemp,
			min: weatherNextDateMaxMin.minTemp,
			title: {
				text: 'Temperature (°F)'
			}
		},
		annotations: {
			xaxis: [
				{
					x: nextDateCategories[1], // First hour (e.g., "11:00 AM")
					borderColor: '#3F88C5',
					label: {
						text: nextDateCategories[1],
						style: {
							color: '#FFF',
							background: '#3F88C5'
						}
					}
				},
				{
					x: nextDateCategories[nextDateCategories.length - 2], // Last hour (e.g., "06:00 PM")
					borderColor: '#3F88C5',
					label: {
						text: nextDateCategories[nextDateCategories.length - 2],
						style: {
							color: '#FFF',
							background: '#3F88C5'
						}
					}
				}
			]
		},
		responsive: [
			{
				breakpoint: 768, // Mobile breakpoint
				options: {
					chart: {
						height: 250 // Smaller height for mobile
					},
					xaxis: {
						labels: {
							style: {
								fontSize: '10px' // Smaller font size for mobile
							}
						}
					}
				}
			}
		]
	};
	const nextDateSeries = [
		{
			name: 'Temperature',
			data: nextDateHourlyData.map((hour) => hour.temp) // Extract temperature data
		}
	];
	const nextDateDescription = () => {
		return (
			<>
				<p>{nextDateWeather.description}</p>
				<p>winds {nextDateWeather.windspeed} mph</p>
				<p>{nextDateWeather.precipprob === 0 ? 'No rain' : `${nextDateWeather.precipprob}% chance rain`}</p>
			</>
		);
	};

	// Prepare chart data for Next Week Date
	const weatherNextWeekDateMaxMin = extractTemperatureRange(nextWeekDateHourlyData);
	const nextWeekDateCategories =
		nextWeekDateHourlyData.length > 0 ? getDateCategories(nextDate, nextWeekDateHourlyData) : [];
	const nextWeekDateOptions = {
		chart: {
			type: 'line' as const,
			zoom: {
				enabled: false
			},
			toolbar: {
				show: false
			},
			animations: {
				enabled: true,
				speed: 800, // Animation speed for initial rendering
				animateGradually: {
					enabled: true, // Gradual animation
					delay: 150 // Delay between animated points
				},
				dynamicAnimation: {
					enabled: true, // Dynamic updates animation
					speed: 350 // Speed for dynamic updates
				}
			}
		},
		colors: ['#004E98'],
		stroke: {
			curve: 'smooth' as const
		},
		xaxis: {
			categories: nextWeekDateCategories,
			tickPlacement: 'on',
			labels: {
				style: {
					colors: nextDateCategories.map((hour) => {
						// Change color for the first and last hour
						if (
							hour === nextDateCategories[0] ||
							hour === nextDateCategories[nextDateCategories.length - 1]
						) {
							return '#AAA';
						}

						return '#000'; // Default color for other hours
					}),
					fontSize: '11px'
				}
			}
		},
		yaxis: {
			max: weatherNextWeekDateMaxMin.maxTemp,
			min: weatherNextWeekDateMaxMin.minTemp,
			title: {
				text: 'Temperature (°F)'
			}
		},
		annotations: {
			xaxis: [
				{
					x: nextWeekDateCategories[1], // First hour (e.g., "11:00 AM")
					borderColor: '#3F88C5',
					label: {
						text: nextWeekDateCategories[1],
						style: {
							color: '#FFF',
							background: '#3F88C5'
						}
					}
				},
				{
					x: nextWeekDateCategories[nextWeekDateCategories.length - 2], // Last hour (e.g., "06:00 PM")
					borderColor: '#3F88C5',
					label: {
						text: nextWeekDateCategories[nextWeekDateCategories.length - 2],
						style: {
							color: '#FFF',
							background: '#3F88C5'
						}
					}
				}
			]
		},
		responsive: [
			{
				breakpoint: 768, // Mobile breakpoint
				options: {
					chart: {
						height: 250 // Smaller height for mobile
					},
					xaxis: {
						labels: {
							style: {
								fontSize: '10px' // Smaller font size for mobile
							}
						}
					}
				}
			}
		]
	};
	const nextWeekDateSeries = [
		{
			name: 'Temperature',
			data: nextWeekDateHourlyData.map((hour) => hour.temp) // Extract temperature data
		}
	];
	const nextWeekDateDescription = () => {
		return (
			<>
				<p>{nextWeekDateWeather.description}</p>
				<p>winds {nextWeekDateWeather.windspeed} mph</p>
				<p>
					{nextWeekDateWeather.precipprob === 0
						? 'No rain'
						: `${nextWeekDateWeather.precipprob}% chance rain`}
				</p>
			</>
		);
	};

	const formatDateToDescription = (dateString: string): string => {
		// Parse the dateString to a Date object
		const date = new Date(`${dateString}T00:00:00`);
		const today = new Date();

		// Reset time to midnight to compare only the date part
		today.setHours(0, 0, 0, 0);

		// Calculate the difference in days
		const oneDay = 24 * 60 * 60 * 1000; // Milliseconds in a day
		const diffDays = Math.round((date.getTime() - today.getTime()) / oneDay);

		// Determine "This" or "Next"
		let description: string;

		if (diffDays >= 0 && diffDays < 7) {
			description = `This ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
		} else if (diffDays >= 7 && diffDays < 14) {
			description = `Next ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
		} else {
			description = date.toLocaleDateString('en-US', { weekday: 'long' });
		}

		// Add ordinal suffix to the day of the month
		const dayOfMonth = date.getDate();
		const ordinalSuffix = (n: number): string => {
			const s = ['th', 'st', 'nd', 'rd'];
			const v = n % 100;
			return s[(v - 20) % 10] || s[v] || s[0];
		};
		const formattedDay = `${dayOfMonth}${ordinalSuffix(dayOfMonth)}`;

		return `${description} the ${formattedDay}`;
	};

	return (
		<div className="dates-wrapper">
			<ApexChart
				options={nextDateOptions}
				series={nextDateSeries}
				type="line"
				height={350}
				graphTitle={<span className="color-next-day">{formatDateToDescription(nextDate) || 'N/A'}</span>}
				graphIcon={
					<FuseSvgIcon
						className="text-48"
						size={120}
						color="action"
					>
						heroicons-solid:sun
					</FuseSvgIcon>
				}
				graphDescription={nextDateDescription()}
				graphBottom={<p>{selectedTime}</p>}
			/>

			<ApexChart
				options={nextWeekDateOptions}
				series={nextWeekDateSeries}
				type="line"
				height={350}
				graphTitle={
					<span className="color-nextweek-day">{formatDateToDescription(nextWeekDate) || 'N/A'}</span>
				}
				graphIcon={
					<FuseSvgIcon
						className="text-48"
						size={120}
						color="action"
					>
						heroicons-solid:sun
					</FuseSvgIcon>
				}
				graphDescription={nextWeekDateDescription()}
				graphBottom={<p>{selectedTime}</p>}
			/>
		</div>
	);
};

export default React.memo(WeatherContent);
