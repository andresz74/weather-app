const API_KEY = '8M9H5BNP9V3WXED22UDGLCP4H';

// Hourly weather data
export type WeatherHourData = {
	datetime: string;
	datetimeEpoch: number;
	temp: number;
	feelslike: number;
	humidity: number;
	dew: number;
	precip: number;
	precipprob: number;
	snow: number;
	snowdepth: number | null;
	preciptype: string[] | null;
	windgust: number;
	windspeed: number;
	winddir: number;
	pressure: number;
	visibility: number;
	cloudcover: number;
	solarradiation: number;
	solarenergy: number;
	uvindex: number;
	severerisk: number;
	conditions: string;
	icon: string;
	stations: string[] | null;
	source: string;
};

// Daily weather data
export type WeatherDayData = {
	datetime: string;
	datetimeEpoch: number;
	tempmax: number;
	tempmin: number;
	temp: number;
	feelslikemax: number;
	feelslikemin: number;
	feelslike: number;
	dew: number;
	humidity: number;
	precip: number;
	precipprob: number;
	precipcover: number;
	preciptype: string[] | null;
	snow: number;
	snowdepth: number | null;
	windgust: number;
	windspeed: number;
	winddir: number;
	pressure: number;
	cloudcover: number;
	visibility: number;
	solarradiation: number;
	solarenergy: number;
	uvindex: number;
	severerisk: number;
	sunrise: string;
	sunriseEpoch: number;
	sunset: string;
	sunsetEpoch: number;
	moonphase: number;
	conditions: string;
	description: string;
	icon: string;
	stations: string[] | null;
	source: string;
	hours: WeatherHourData[];
};

// Main weather data type
export type WeatherData = {
	queryCost: number;
	latitude: number;
	longitude: number;
	resolvedAddress: string;
	address: string;
	timezone: string;
	tzoffset: number;
	days: WeatherDayData[];
};

export class FetchApiError extends Error {
	status: number;

	data: unknown;

	constructor(status: number, data: unknown) {
		super(`FetchApiError: ${status}`);
		this.status = status;
		this.data = data;
	}
}

export const apiWeather = async (location: string, date1: string, date2?: string): Promise<WeatherData> => {
	try {
		const response = await fetch(
			`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}/${date1}/${date2}?key=${API_KEY}`
		);

		if (!response.ok) {
			const errorData = await response.json();

			if (response.status === 426) {
				throw new FetchApiError(426, { message: 'Quota exceeded. Please try again tomorrow.' });
			}

			throw new FetchApiError(response.status, errorData);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error in apiWeather:', error);
		throw error;
	}
};
