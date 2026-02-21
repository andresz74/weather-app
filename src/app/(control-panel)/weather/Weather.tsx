import React from 'react';
import WeatherContent from '@fuse/core/WeatherContent';
import {
	apiWeather,
	FetchApiError,
	getWeatherDayOrProjection,
	WeatherData,
	WeatherDayData,
	WeatherHourData
} from '@/utils/apiWeather';
import FusePageSimple from '@fuse/core/FusePageSimple';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PinDrop from '@mui/icons-material/PinDrop';
import { styled } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import './Weather.css';

const Root = styled(FusePageSimple)(({ theme }) => ({
	'& .FusePageSimple-header': {
		backgroundColor: theme.palette.background.paper,
		borderBottomWidth: 1,
		borderStyle: 'solid',
		borderColor: theme.palette.divider
	},
	'& .FusePageSimple-content': {},
	'& .FusePageSimple-sidebarHeader': {},
	'& .FusePageSimple-sidebarContent': {}
}));

const formatDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, '0');
	const day = `${date.getDate()}`.padStart(2, '0');
	return `${year}-${month}-${day}`;
};

const parseLocalDate = (value: string): Date => {
	const [year, month, day] = value.split('-').map(Number);
	return new Date(year, month - 1, day);
};

const FALLBACK_LOCATION = 'San Francisco, CA';
const DAY_VALUES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

const getCurrentDaySelection = (): string => {
	return DAY_VALUES[new Date().getDay()];
};

const getCurrentTimeSelection = (): string => {
	const hour = new Date().getHours();

	if (hour < 12) {
		return 'morning';
	}

	if (hour < 18) {
		return 'afternoon';
	}

	return 'evening';
};

const extractApiErrorMessage = (data: unknown): string | null => {
	if (!data || typeof data !== 'object') {
		return null;
	}

	const errorData = data as Record<string, unknown>;
	const possibleKeys = ['message', 'reason', 'detail', 'error'];

	for (const key of possibleKeys) {
		const value = errorData[key];

		if (typeof value === 'string' && value.trim()) {
			return value;
		}
	}

	return null;
};

const Weather = () => {
	const [error, setError] = React.useState<string | null>(null);
	const [isLoading, setIsLoading] = React.useState<boolean>(false);
	const [weather, setWeather] = React.useState<WeatherData | null>(null);
	const [location, setLocation] = React.useState<string>(FALLBACK_LOCATION);
	const [selectedDay, setSelectedDay] = React.useState<string>(getCurrentDaySelection);
	const [selectedTime, setSelectedTime] = React.useState<string>(getCurrentTimeSelection);
	const [nextDate, setNextDate] = React.useState<string | null>(null);
	const [nextWeekDate, setNextWeekDate] = React.useState<string | null>(null);
	const [weekAfterNextDate, setWeekAfterNextDate] = React.useState<string | null>(null);
	const [nextDateWeather, setNextDateWeather] = React.useState<WeatherDayData | null>(null);
	const [nextWeekDateWeather, setNextWeekDateWeather] = React.useState<WeatherDayData | null>(null);
	const [nextDateHourlyData, setNextDateHourlyData] = React.useState<WeatherHourData[]>([]);
	const [nextWeekDateHourlyData, setNextWeekDateHourlyData] = React.useState<WeatherHourData[]>([]);
	const [hasWeekAfterNextData, setHasWeekAfterNextData] = React.useState<boolean>(false);
	const [debounceTimeout, setDebounceTimeout] = React.useState<ReturnType<typeof setTimeout> | null>(null);
	const isLocationManuallyEditedRef = React.useRef(false);

	const days = [
		{ value: 'monday', label: 'Every Monday' },
		{ value: 'tuesday', label: 'Every Tuesday' },
		{ value: 'wednesday', label: 'Every Wednesday' },
		{ value: 'thursday', label: 'Every Thursday' },
		{ value: 'friday', label: 'Every Friday' },
		{ value: 'saturday', label: 'Every Saturday' },
		{ value: 'sunday', label: 'Every Sunday' }
	];

	const times = [
		{ value: 'morning', label: 'Morning' },
		{ value: 'afternoon', label: 'Afternoon' },
		{ value: 'evening', label: 'Evening' }
	];

	const fetchWeatherData = React.useCallback(
		async (locationOverride?: string) => {
			const activeLocation = (locationOverride ?? location).trim();

			if (!nextDate || !nextWeekDate || !weekAfterNextDate || !activeLocation) {
				return;
			}

			try {
				setIsLoading(true);
				setError(null);

				const weatherData = await apiWeather(activeLocation, nextDate, weekAfterNextDate);
				setWeather(weatherData);

				const timeRanges: Record<string, [number, number]> = {
					morning: [7, 13],
					afternoon: [11, 18],
					evening: [16, 22]
				};
				const selectedRange = timeRanges[selectedTime] || [0, 23];

				const extractRangeHours = (dayData: WeatherDayData | null): WeatherHourData[] => {
					if (!dayData) return [];

					return dayData.hours.filter((hour) => {
						const fullDatetime = `${dayData.datetime}T${hour.datetime}`;
						const hourOfDay = new Date(fullDatetime).getHours();
						return hourOfDay >= selectedRange[0] && hourOfDay <= selectedRange[1];
					});
				};

				const nextDateData = getWeatherDayOrProjection(weatherData, nextDate);
				const nextWeekDateData = getWeatherDayOrProjection(weatherData, nextWeekDate);
				const weekAfterNextData = getWeatherDayOrProjection(weatherData, weekAfterNextDate);

				setNextDateWeather(nextDateData || null);
				setNextWeekDateWeather(nextWeekDateData || null);
				setNextDateHourlyData(extractRangeHours(nextDateData));
				setNextWeekDateHourlyData(extractRangeHours(nextWeekDateData));
				setHasWeekAfterNextData(!!weekAfterNextData);

				if (!nextDateData || !nextWeekDateData) {
					setError('No weather data available for selected dates.');
				}
			} catch (err) {
				setWeather(null);
				setNextDateWeather(null);
				setNextWeekDateWeather(null);
				setNextDateHourlyData([]);
				setNextWeekDateHourlyData([]);
				setHasWeekAfterNextData(false);

				if (err instanceof FetchApiError) {
					const apiMessage = extractApiErrorMessage(err.data);

					if (err.status === 404) {
						setError(apiMessage || 'Location not found. Try a city name or lat,lon coordinates.');
					} else if (err.status === 429) {
						setError('Weather service rate limit reached. Please try again in a moment.');
					} else if (err.status >= 500) {
						setError('Weather service is temporarily unavailable. Please try again later.');
					} else {
						setError(apiMessage || `Weather request failed (${err.status}).`);
					}
				} else if (err instanceof Error && err.message) {
					setError(err.message);
				} else {
					setError('An unexpected error occurred. Please try again later.');
				}
			} finally {
				setIsLoading(false);
			}
		},
		[location, nextDate, nextWeekDate, selectedTime, weekAfterNextDate]
	);

	React.useEffect(() => {
		if (!navigator.geolocation) {
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				if (isLocationManuallyEditedRef.current) {
					return;
				}

				const { latitude, longitude } = position.coords;
				setLocation(`${latitude.toFixed(4)},${longitude.toFixed(4)}`);
			},
			() => {
				setLocation(FALLBACK_LOCATION);
			},
			{
				enableHighAccuracy: false,
				timeout: 10000,
				maximumAge: 5 * 60 * 1000
			}
		);
	}, []);

	React.useEffect(() => {
		const getNextDatesForDay = (day: string): { next: string; nextWeek: string; weekAfterNext: string } => {
			const today = new Date();
			const currentDay = today.getDay();
			const daysMap: Record<string, number> = {
				sunday: 0,
				monday: 1,
				tuesday: 2,
				wednesday: 3,
				thursday: 4,
				friday: 5,
				saturday: 6
			};

			const targetDay = daysMap[day];
			let daysUntilNext = targetDay - currentDay;

			if (daysUntilNext < 0) {
				daysUntilNext += 7;
			}

			const next = new Date(today);
			next.setDate(today.getDate() + daysUntilNext);

			const nextWeek = new Date(next);
			nextWeek.setDate(next.getDate() + 7);

			const weekAfterNext = new Date(nextWeek);
			weekAfterNext.setDate(nextWeek.getDate() + 7);

			return {
				next: formatDate(next),
				nextWeek: formatDate(nextWeek),
				weekAfterNext: formatDate(weekAfterNext)
			};
		};

		const { next, nextWeek, weekAfterNext } = getNextDatesForDay(selectedDay);
		setNextDate(next);
		setNextWeekDate(nextWeek);
		setWeekAfterNextDate(weekAfterNext);
	}, [selectedDay]);

	React.useEffect(() => {
		fetchWeatherData();
	}, [fetchWeatherData]);

	const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const nextLocation = e.target.value;
		isLocationManuallyEditedRef.current = true;
		setLocation(nextLocation);

		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}

		const timeout = setTimeout(() => {
			fetchWeatherData(nextLocation);
		}, 1000);
		setDebounceTimeout(timeout);
	};

	const calculateDates = (offset: number) => {
		if (!nextDate || !nextWeekDate || !weekAfterNextDate) return;

		const currentNextDate = parseLocalDate(nextDate);
		const currentNextWeekDate = parseLocalDate(nextWeekDate);
		const currentWeekAfterNextDate = parseLocalDate(weekAfterNextDate);

		currentNextDate.setDate(currentNextDate.getDate() + offset);
		currentNextWeekDate.setDate(currentNextWeekDate.getDate() + offset);
		currentWeekAfterNextDate.setDate(currentWeekAfterNextDate.getDate() + offset);

		setNextDate(formatDate(currentNextDate));
		setNextWeekDate(formatDate(currentNextWeekDate));
		setWeekAfterNextDate(formatDate(currentWeekAfterNextDate));
	};

	const handleNext = () => calculateDates(7);
	const handlePrevious = () => calculateDates(-7);

	const isReadyForWeatherContent = !!(nextDateWeather && nextWeekDateWeather && nextDate && nextWeekDate);
	const canGoBackward = !!nextDate && parseLocalDate(nextDate).getTime() > new Date().getTime();
	const disablePrevious = isLoading || !!error || !canGoBackward;
	const isAtEstimatedBoundary = !!nextWeekDateWeather?.isEstimated;
	const disableNext = isLoading || !!error || !hasWeekAfterNextData || isAtEstimatedBoundary;
	const statusMessage = isLoading
		? 'Loading...'
		: error || (!isReadyForWeatherContent ? 'No weather data available for selected dates.' : 'Loading...');

	return (
		<Root
			header={
				<div className="p-24 header-wrap">
					<div className="location-wrap">
						<TextField
							id="input-with-icon-textfield"
							placeholder="Location"
							value={location}
							onChange={handleLocationChange}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<PinDrop />
									</InputAdornment>
								)
							}}
							variant="standard"
						/>
					</div>
					<div className="day-time-wrap">
						<div>
							<TextField
								id="day-select"
								select
								variant="standard"
								value={selectedDay}
								onChange={(e) => setSelectedDay(e.target.value)}
							>
								{days.map((option) => (
									<MenuItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</MenuItem>
								))}
							</TextField>
						</div>
						<div>
							<TextField
								id="time-select"
								select
								variant="standard"
								value={selectedTime}
								onChange={(e) => setSelectedTime(e.target.value)}
							>
								{times.map((option) => (
									<MenuItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</MenuItem>
								))}
							</TextField>
						</div>
					</div>
				</div>
			}
			content={
				<div className="p-24">
					<div className="arrows">
						<button
							onClick={handlePrevious}
							disabled={disablePrevious}
						>
							<ArrowBackIosIcon />
						</button>

						<div className="weather-content">
							{weather && isReadyForWeatherContent ? (
								<WeatherContent
									nextDate={nextDate}
									nextDateWeather={nextDateWeather}
									nextDateHourlyData={nextDateHourlyData}
									nextWeekDate={nextWeekDate}
									nextWeekDateWeather={nextWeekDateWeather}
									nextWeekDateHourlyData={nextWeekDateHourlyData}
									selectedTime={selectedTime}
								/>
							) : (
								<p className={error ? 'error-message' : ''}>{statusMessage}</p>
							)}
						</div>

						<button
							onClick={handleNext}
							disabled={disableNext}
						>
							<ArrowForwardIosIcon />
						</button>
					</div>
				</div>
			}
		/>
	);
};

export default Weather;
