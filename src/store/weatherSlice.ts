import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WeatherData, WeatherDayData, WeatherHourData } from '@/utils/apiWeather';

export interface WeatherState {
	weather: WeatherData | null;
	nextDateWeather: WeatherDayData | null;
	nextWeekDateWeather: WeatherDayData | null;
	nextDateHourlyData: WeatherHourData[];
	nextWeekDateHourlyData: WeatherHourData[];
	loading: boolean;
	error: string | null;
}
// Define the initial state
const initialState: WeatherState = {
	weather: null,
	nextDateWeather: null,
	nextWeekDateWeather: null,
	nextDateHourlyData: [],
	nextWeekDateHourlyData: [],
	loading: false,
	error: null
};

// Create the slice
const weatherSlice = createSlice({
	name: 'weather',
	initialState,
	reducers: {
		fetchWeatherRequest: (
			state,
			action: PayloadAction<{ location: string; date1: string; date2: string; selectedTime: string }>
		) => {
			state.loading = true;
			state.error = null;
		},
		fetchWeatherSuccess: (
			state,
			action: PayloadAction<{ data: WeatherData; date1: string; date2: string; selectedTime: string }>
		) => {
			state.weather = action.payload.data;

			// Extract the relevant weather data for nextDate and nextWeekDate
			const nextDateData = action.payload.data.days.find((day) => day.datetime === action.payload.date1) || null;
			const nextWeekDateData =
				action.payload.data.days.find((day) => day.datetime === action.payload.date2) || null;

			if (!nextDateData || !nextWeekDateData) {
				console.error('Error: Weather data for the requested dates not found.');
				return;
			}

			state.nextDateWeather = nextDateData;
			state.nextWeekDateWeather = nextWeekDateData;

			// Define time ranges for morning, afternoon, and evening
			const timeRanges: Record<string, [number, number]> = {
				morning: [7, 13], // 8 AM - 12 PM with an extra hour before and after
				afternoon: [11, 18], // 12 PM - 5 PM with an extra hour before and after
				evening: [16, 22] // 5 PM - 9 PM with an extra hour before and after
			};

			const selectedRange = timeRanges[action.payload.selectedTime] || [0, 23];

			// Extract hourly data within the selected time range
			const extractHourlyData = (dayData: WeatherDayData | null) => {
				if (!dayData) return [];

				return dayData.hours.filter((hour) => {
					const fullDatetime = `${dayData.datetime}T${hour.datetime}`;
					const hourOfDay = new Date(fullDatetime).getHours();
					return hourOfDay >= selectedRange[0] && hourOfDay <= selectedRange[1];
				});
			};

			state.nextDateHourlyData = extractHourlyData(nextDateData) || [];
			state.nextWeekDateHourlyData = extractHourlyData(nextWeekDateData) || [];

			state.loading = false;
		},

		fetchWeatherFailure: (state, action: PayloadAction<string>) => {
			state.error = action.payload;
			state.loading = false;
		}
	}
});

// Export actions
export const { fetchWeatherRequest, fetchWeatherSuccess, fetchWeatherFailure } = weatherSlice.actions;

// Export reducer as default
export default weatherSlice;
