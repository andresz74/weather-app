/* eslint-disable no-console */
import React from 'react';
import WeatherContent from '@fuse/core/WeatherContent';
import { apiWeather, WeatherData, WeatherDayData, WeatherHourData } from '@/utils/apiWeather';
import FusePageSimple from '@fuse/core/FusePageSimple';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PinDrop from '@mui/icons-material/PinDrop';
import { styled } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import './Weather.css';
// import weatherMockData from './WeatherMock.json';

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

const Weather = () => {
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

	const [weather, setWeather] = React.useState<WeatherData | null>(null);
	const [location, setLocation] = React.useState<string>('Dolores Park, SF');
	const [selectedDay, setSelectedDay] = React.useState<string>('friday');
	const [selectedTime, setSelectedTime] = React.useState<string>('afternoon');
	const [nextDate, setNextDate] = React.useState<string | null>(null);
	const [nextWeekDate, setNextWeekDate] = React.useState<string | null>(null);
	const [nextDateWeather, setNextDateWeather] = React.useState<WeatherDayData | null>(null);
	const [nextWeekDateWeather, setNextWeekDateWeather] = React.useState<WeatherDayData | null>(null);
	// Define state for hourly data to be used for the graph
	const [nextDateHourlyData, setNextDateHourlyData] = React.useState<WeatherHourData[]>([]);
	const [nextWeekDateHourlyData, setNextWeekDateHourlyData] = React.useState<WeatherHourData[]>([]);

	const fetchWeatherData = async () => {
		if (!nextDate || !nextWeekDate) return;

		const weatherData = await apiWeather(location, nextDate, nextWeekDate);
		// const weatherData = weatherMockData;
		setWeather(weatherData);

		// Map selectedTime to hour range
		const timeRanges: Record<string, [number, number]> = {
			morning: [7, 13], // 8-12 + 1 hour before and after
			afternoon: [11, 18], // 12-5 + 1 hour before and after
			evening: [16, 22] // 5-9 + 1 hour before and after
		};

		const selectedRange = timeRanges[selectedTime] || [0, 23];

		// Helper function to extract weather data for specific dates
		const extractWeatherForDates = (data: WeatherData, dates: string[]) => {
			return dates.map((date) => {
				const dayData = data.days.find((day) => day.datetime === date);

				if (!dayData) {
					console.error('No data found for date:', date);
					return null;
				}

				// Extract hours for the selected range
				const rangeHours = dayData.hours.filter((hour) => {
					// Combine the date with the time to create a full datetime
					const fullDatetime = `${dayData.datetime}T${hour.datetime}`;
					const hourOfDay = new Date(fullDatetime).getHours();
					// Check if the hour is within the selected range
					return hourOfDay >= selectedRange[0] && hourOfDay <= selectedRange[1];
				});

				return { ...dayData, rangeHours }; // Include rangeHours for later use
			});
		};

		// Extract weather data for nextDate and nextWeekDate
		const weatherByDates = extractWeatherForDates(weatherData, [nextDate, nextWeekDate]);

		// Separate weather data for each date
		const [nextDateData, nextWeekDateData] = weatherByDates;

		setNextDateWeather(nextDateData || null);
		setNextWeekDateWeather(nextWeekDateData || null);

		// Update hourly data state for the graph
		setNextDateHourlyData(nextDateData?.rangeHours || []);
		setNextWeekDateHourlyData(nextWeekDateData?.rangeHours || []);
	};

	React.useEffect(() => {
		const getNextDateForDay = (day: string): { next: string; nextWeek: string } => {
			const today = new Date();
			const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

			// Mapping of days to their respective indices
			const daysMap = {
				sunday: 0,
				monday: 1,
				tuesday: 2,
				wednesday: 3,
				thursday: 4,
				friday: 5,
				saturday: 6
			};

			const targetDay = daysMap[day]; // Get the index of the selected day
			let daysUntilNext = targetDay - currentDay;

			// If the target day is behind or today, move to the next week's occurrence
			if (daysUntilNext < 0) {
				daysUntilNext += 7;
			}

			// Calculate the next occurrence
			const next = new Date(today);
			next.setDate(today.getDate() + daysUntilNext);

			// Calculate the same day next week
			const nextWeek = new Date(next);
			nextWeek.setDate(next.getDate() + 7);

			// Format dates to `YYYY-MM-DD`
			const formatDate = (date: Date) => date.toISOString().split('T')[0];
			return { next: formatDate(next), nextWeek: formatDate(nextWeek) };
		};

		// Update the dates when selectedDay changes
		const { next, nextWeek } = getNextDateForDay(selectedDay);
		console.log(next, nextWeek);
		setNextDate(next);
		setNextWeekDate(nextWeek);
	}, [selectedDay]);

	React.useEffect(() => {
		fetchWeatherData();
	}, [nextDate, nextWeekDate, selectedTime]);

	const [debounceTimeout, setDebounceTimeout] = React.useState<NodeJS.Timeout | null>(null);
	const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setLocation(e.target.value);

		// Clear existing timeout
		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}

		// Set a new timeout
		const timeout = setTimeout(() => {
			fetchWeatherData();
		}, 1000); // 1 second delay
		setDebounceTimeout(timeout);
	};

	// Calculate dates relative to the current nextDate
	const calculateDates = (offset: number) => {
		if (!nextDate) return;

		const currentNextDate = new Date(nextDate);
		const currentNextWeekDate = new Date(nextWeekDate || nextDate);

		// Move dates by the offset
		currentNextDate.setDate(currentNextDate.getDate() + offset);
		currentNextWeekDate.setDate(currentNextWeekDate.getDate() + offset);

		const formatDate = (date: Date) => date.toISOString().split('T')[0];
		setNextDate(formatDate(currentNextDate));
		setNextWeekDate(formatDate(currentNextWeekDate));
	};

	// Navigation handlers
	const handleNext = () => calculateDates(7);
	const handlePrevious = () => calculateDates(-7);

	return (
		<Root
			header={
				<div className="p-24 headerWrap">
					<div className="locationWrap">
						<TextField
							id="input-with-icon-textfield"
							placeholder="Location"
							value={location} // Bind TextField to location state
							onChange={handleLocationChange} // Update location state on change
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
					<div className="dayTimeWrap">
						<div>
							<TextField
								id="standard-select-currency"
								select
								variant="standard"
								defaultValue={selectedDay}
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
								id="standard-select-currency"
								select
								variant="standard"
								defaultValue={selectedTime}
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
							disabled={
								!nextDate || new Date(nextDate).getTime() <= new Date().getTime() // Disable if nextDate is today or earlier
							}
						>
							<ArrowBackIosIcon />
						</button>

						<div className="weather-content">
							{weather ? (
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
								<p>Loading...</p>
							)}
						</div>

						<button onClick={handleNext}>
							<ArrowForwardIosIcon />
						</button>
					</div>
				</div>
			}
		/>
	);
};

export default Weather;
