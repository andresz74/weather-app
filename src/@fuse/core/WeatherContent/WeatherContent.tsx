import React from 'react';
import { WeatherDayData, WeatherHourData } from '@/utils/apiWeather';
import ApexChart from '@/components/graph/ApexChart';
import WeatherIcon from '@/components/weather-icon/WeatherIcon';
import { useTranslation } from 'react-i18next';
import './WeatherContent.css';

type WeatherContentProps = {
	nextDate: string | null;
	nextDateWeather: WeatherDayData | null;
	nextDateHourlyData: WeatherHourData[];
	nextWeekDate: string | null;
	nextWeekDateWeather: WeatherDayData | null;
	nextWeekDateHourlyData: WeatherHourData[];
	selectedTime: string;
};

const getDateCategories = (date: string, hourlyData: WeatherHourData[]): string[] => {
	return hourlyData.map((hour) => {
		const fullDatetime = `${date}T${hour.datetime}`;
		return new Date(fullDatetime).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit'
		});
	});
};

const extractTemperatureRange = (data: WeatherHourData[]): { maxTemp: number; minTemp: number } => {
	if (data.length === 0) {
		return { maxTemp: 0, minTemp: 0 };
	}

	const temperatures = data.map((hour) => hour.temp);
	const maxTemp = Math.max(...temperatures);
	const minTemp = Math.min(...temperatures);

	return { maxTemp: maxTemp + 1, minTemp: minTemp - 1 };
};

const getLabelColors = (categories: string[]): string[] => {
	if (categories.length === 0) {
		return [];
	}

	const first = categories[0];
	const last = categories[categories.length - 1];

	return categories.map((hour) => (hour === first || hour === last ? '#AAA' : '#000'));
};

const getXAxisAnnotations = (categories: string[]) => {
	if (categories.length < 3) {
		return [];
	}

	return [
		{
			x: categories[1],
			borderColor: '#3F88C5',
			label: {
				text: categories[1],
				style: {
					color: '#FFF',
					background: '#3F88C5'
				}
			}
		},
		{
			x: categories[categories.length - 2],
			borderColor: '#3F88C5',
			label: {
				text: categories[categories.length - 2],
				style: {
					color: '#FFF',
					background: '#3F88C5'
				}
			}
		}
	];
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
	const { t, i18n } = useTranslation('weatherPage');

	const formatDateToDescription = (dateString: string): string => {
		const date = new Date(`${dateString}T00:00:00`);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const diffDays = Math.round((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
		const weekday = date.toLocaleDateString(i18n.language, { weekday: 'long' });

		const description =
			diffDays >= 0 && diffDays < 7 ? t('THIS_DAY', { day: weekday }) : t('NEXT_DAY', { day: weekday });

		const dayOfMonth = date.getDate();
		const ordinalSuffix = (n: number): string => {
			const suffixes = [t('ORDINAL_TH'), t('ORDINAL_ST'), t('ORDINAL_ND'), t('ORDINAL_RD')];
			const value = n % 100;
			return suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
		};

		return t('THE_DAY_SUFFIX', {
			description,
			dayWithOrdinal: `${dayOfMonth}${ordinalSuffix(dayOfMonth)}`
		});
	};

	const isWithinFirstWeek = (dateString: string): boolean => {
		const date = new Date(`${dateString}T00:00:00`);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const diffDays = Math.round((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
		return diffDays >= 0 && diffDays < 7;
	};

	if (!nextDate || !nextWeekDate || !nextDateWeather || !nextWeekDateWeather) {
		return (
			<div className="dates-wrapper">
				<p>{t('UNAVAILABLE_FOR_DATES')}</p>
			</div>
		);
	}

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
				speed: 800,
				animateGradually: {
					enabled: true,
					delay: 150
				},
				dynamicAnimation: {
					enabled: true,
					speed: 350
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
					colors: getLabelColors(nextDateCategories),
					fontSize: '11px'
				}
			}
		},
		yaxis: {
			max: weatherNextDateMaxMin.maxTemp,
			min: weatherNextDateMaxMin.minTemp,
			title: {
				text: t('TEMPERATURE_UNIT')
			}
		},
		annotations: {
			xaxis: getXAxisAnnotations(nextDateCategories)
		},
		responsive: [
			{
				breakpoint: 768,
				options: {
					chart: {
						height: 250
					},
					xaxis: {
						labels: {
							style: {
								fontSize: '10px'
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
			data: nextDateHourlyData.map((hour) => hour.temp)
		}
	];

	const weatherNextWeekDateMaxMin = extractTemperatureRange(nextWeekDateHourlyData);
	const nextWeekDateCategories =
		nextWeekDateHourlyData.length > 0 ? getDateCategories(nextWeekDate, nextWeekDateHourlyData) : [];
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
				speed: 800,
				animateGradually: {
					enabled: true,
					delay: 150
				},
				dynamicAnimation: {
					enabled: true,
					speed: 350
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
					colors: getLabelColors(nextWeekDateCategories),
					fontSize: '11px'
				}
			}
		},
		yaxis: {
			max: weatherNextWeekDateMaxMin.maxTemp,
			min: weatherNextWeekDateMaxMin.minTemp,
			title: {
				text: t('TEMPERATURE_UNIT')
			}
		},
		annotations: {
			xaxis: getXAxisAnnotations(nextWeekDateCategories)
		},
		responsive: [
			{
				breakpoint: 768,
				options: {
					chart: {
						height: 250
					},
					xaxis: {
						labels: {
							style: {
								fontSize: '10px'
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
			data: nextWeekDateHourlyData.map((hour) => hour.temp)
		}
	];

	return (
		<div className="dates-wrapper">
			<ApexChart
				options={nextDateOptions}
				series={nextDateSeries}
				type="line"
				height={350}
				graphTitle={
					<span className={isWithinFirstWeek(nextDate) ? 'color-next-day' : 'color-nextweek-day'}>
						{formatDateToDescription(nextDate) || 'N/A'}
					</span>
				}
				graphIcon={<WeatherIcon icon={nextDateWeather.icon} />}
				graphDescription={
					<>
						{nextDateWeather.isEstimated && (
							<p>
								<strong>{t('ESTIMATED')}</strong>{' '}
								<span>{t('CONFIDENCE', { value: nextDateWeather.confidence || 'medium' })}</span>
							</p>
						)}
						<p>{nextDateWeather.description}</p>
						<p>
							<WeatherIcon
								icon="wind"
								size={16}
								className="inline-block mr-8"
							/>
							{t('WINDS', { speed: nextDateWeather.windspeed })}
						</p>
						<p>
							<WeatherIcon
								icon="rain"
								size={16}
								className="inline-block mr-8"
							/>
							{nextDateWeather.precipprob === 0
								? t('NO_RAIN')
								: t('CHANCE_RAIN', { chance: nextDateWeather.precipprob })}
						</p>
					</>
				}
				graphBottom={<p>{t(selectedTime.toUpperCase())}</p>}
			/>

			<ApexChart
				options={nextWeekDateOptions}
				series={nextWeekDateSeries}
				type="line"
				height={350}
				graphTitle={
					<span className={isWithinFirstWeek(nextWeekDate) ? 'color-next-day' : 'color-nextweek-day'}>
						{formatDateToDescription(nextWeekDate) || 'N/A'}
					</span>
				}
				graphIcon={<WeatherIcon icon={nextWeekDateWeather.icon} />}
				graphDescription={
					<>
						{nextWeekDateWeather.isEstimated && (
							<p>
								<strong>{t('ESTIMATED')}</strong>{' '}
								<span>{t('CONFIDENCE', { value: nextWeekDateWeather.confidence || 'medium' })}</span>
							</p>
						)}
						<p>{nextWeekDateWeather.description}</p>
						<p>
							<WeatherIcon
								icon="wind"
								size={16}
								className="inline-block mr-8"
							/>
							{t('WINDS', { speed: nextWeekDateWeather.windspeed })}
						</p>
						<p>
							<WeatherIcon
								icon="rain"
								size={16}
								className="inline-block mr-8"
							/>
							{nextWeekDateWeather.precipprob === 0
								? t('NO_RAIN')
								: t('CHANCE_RAIN', { chance: nextWeekDateWeather.precipprob })}
						</p>
					</>
				}
				graphBottom={<p>{t(selectedTime.toUpperCase())}</p>}
			/>
		</div>
	);
};

export default React.memo(WeatherContent);
