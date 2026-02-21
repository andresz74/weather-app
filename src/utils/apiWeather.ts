const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

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

export type ProjectionConfidence = 'low' | 'medium' | 'high';

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
	isEstimated?: boolean;
	confidence?: ProjectionConfidence;
	confidenceScore?: number;
	sourceModel?: 'projection-v1' | null;
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

type OpenMeteoGeoResult = {
	name: string;
	latitude: number;
	longitude: number;
	admin1?: string;
	country?: string;
};

type OpenMeteoGeocodeResponse = {
	results?: OpenMeteoGeoResult[];
};

type OpenMeteoHourly = {
	time: string[];
	temperature_2m: number[];
	apparent_temperature: number[];
	relative_humidity_2m: number[];
	precipitation: number[];
	precipitation_probability: number[];
	weather_code: number[];
	cloud_cover: number[];
	wind_speed_10m: number[];
	wind_direction_10m: number[];
	pressure_msl: number[];
	visibility: number[];
	is_day: number[];
};

type OpenMeteoDaily = {
	time: string[];
	weather_code: number[];
	temperature_2m_max: number[];
	temperature_2m_min: number[];
	apparent_temperature_max: number[];
	apparent_temperature_min: number[];
	sunrise: string[];
	sunset: string[];
	precipitation_probability_max: number[];
	wind_speed_10m_max: number[];
	wind_direction_10m_dominant: number[];
};

type OpenMeteoForecastResponse = {
	latitude: number;
	longitude: number;
	timezone: string;
	utc_offset_seconds: number;
	hourly?: OpenMeteoHourly;
	daily?: OpenMeteoDaily;
};

const toDate = (date: string): Date => new Date(`${date}T00:00:00`);

const formatDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, '0');
	const day = `${date.getDate()}`.padStart(2, '0');
	return `${year}-${month}-${day}`;
};

const parseLatLonInput = (location: string): { latitude: number; longitude: number } | null => {
	const match = location.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);

	if (!match) return null;

	return {
		latitude: Number(match[1]),
		longitude: Number(match[2])
	};
};

const fetchJson = async <T>(url: string): Promise<T> => {
	const response = await fetch(url, {
		headers: { Accept: 'application/json' }
	});

	if (!response.ok) {
		let data: unknown;
		try {
			data = await response.json();
		} catch {
			data = { message: response.statusText || 'Request failed' };
		}
		throw new FetchApiError(response.status, data);
	}

	return response.json() as Promise<T>;
};

const resolveLocation = async (
	location: string
): Promise<{ latitude: number; longitude: number; resolvedAddress: string }> => {
	const latLon = parseLatLonInput(location);

	if (latLon) {
		return {
			...latLon,
			resolvedAddress: location
		};
	}

	const normalizedLocation = location.trim();
	const locationParts = normalizedLocation
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean);
	const fallbackQueries = Array.from(
		new Set([normalizedLocation, locationParts[0], normalizedLocation.replace(/\s+/g, ' ')].filter(Boolean))
	);

	let result: OpenMeteoGeoResult | undefined;
	for (const query of fallbackQueries) {
		const url = new URL(OPEN_METEO_GEOCODING_URL);
		url.searchParams.set('name', query);
		url.searchParams.set('count', '1');
		url.searchParams.set('language', 'en');
		url.searchParams.set('format', 'json');

		const data = await fetchJson<OpenMeteoGeocodeResponse>(url.toString());
		result = data.results?.[0];

		if (result) {
			break;
		}
	}

	if (!result) {
		throw new FetchApiError(404, {
			message: 'Location not found'
		});
	}

	const resolvedAddress = [result.name, result.admin1, result.country].filter(Boolean).join(', ');

	return {
		latitude: result.latitude,
		longitude: result.longitude,
		resolvedAddress
	};
};

const weatherCodeToCondition = (code: number): string => {
	if (code === 0) return 'Clear sky';

	if ([1, 2].includes(code)) return 'Partly cloudy';

	if (code === 3) return 'Overcast';

	if ([45, 48].includes(code)) return 'Fog';

	if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'Rain';

	if ([56, 57, 66, 67].includes(code)) return 'Freezing rain';

	if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';

	if ([95, 96, 99].includes(code)) return 'Thunderstorm';

	return 'Cloudy';
};

const weatherCodeToIcon = (code: number, isDay: boolean): string => {
	if (code === 0) return isDay ? 'clear-day' : 'clear-night';

	if ([1, 2].includes(code)) return isDay ? 'partly-cloudy-day' : 'partly-cloudy-night';

	if (code === 3) return 'cloudy';

	if ([45, 48].includes(code)) return 'fog';

	if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';

	if ([95, 96, 99].includes(code)) return 'thunder-rain';

	if ([56, 57, 66, 67].includes(code)) return 'sleet';

	if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rain';

	return 'cloudy';
};

const timePartWithSeconds = (isoDateTime: string): string => {
	const raw = isoDateTime.split('T')[1] || '00:00';

	if (raw.length === 5) return `${raw}:00`;

	return raw;
};

const average = (values: number[]): number => {
	if (values.length === 0) return 0;

	return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const mapOpenMeteoForecastToWeatherData = (
	location: string,
	resolvedAddress: string,
	forecast: OpenMeteoForecastResponse
): WeatherData => {
	const hourly = forecast.hourly;
	const daily = forecast.daily;

	if (!hourly || !daily) {
		throw new FetchApiError(502, { message: 'Invalid response from Open-Meteo' });
	}

	const dayHourIndexes = new Map<string, number[]>();
	hourly.time.forEach((timeValue, index) => {
		const day = timeValue.slice(0, 10);
		const list = dayHourIndexes.get(day) || [];
		list.push(index);
		dayHourIndexes.set(day, list);
	});

	const dayMetaByDate = new Map(
		daily.time.map((day, index) => [
			day,
			{
				weatherCode: daily.weather_code[index],
				tempMax: daily.temperature_2m_max[index],
				tempMin: daily.temperature_2m_min[index],
				feelslikeMax: daily.apparent_temperature_max[index],
				feelslikeMin: daily.apparent_temperature_min[index],
				sunrise: daily.sunrise[index],
				sunset: daily.sunset[index],
				precipProbMax: daily.precipitation_probability_max[index],
				windSpeedMax: daily.wind_speed_10m_max[index],
				windDirDominant: daily.wind_direction_10m_dominant[index]
			}
		])
	);

	const days: WeatherDayData[] = [...dayHourIndexes.keys()]
		.sort((a, b) => a.localeCompare(b))
		.map((day) => {
			const hourIndexes = dayHourIndexes.get(day) || [];
			const dayMeta = dayMetaByDate.get(day);

			const hours: WeatherHourData[] = hourIndexes.map((hourIndex) => {
				const code = hourly.weather_code[hourIndex] ?? 3;
				const isDay = (hourly.is_day[hourIndex] ?? 1) === 1;

				return {
					datetime: timePartWithSeconds(hourly.time[hourIndex]),
					datetimeEpoch: Math.floor(new Date(hourly.time[hourIndex]).getTime() / 1000),
					temp: hourly.temperature_2m[hourIndex] ?? 0,
					feelslike: hourly.apparent_temperature[hourIndex] ?? hourly.temperature_2m[hourIndex] ?? 0,
					humidity: hourly.relative_humidity_2m[hourIndex] ?? 0,
					dew: 0,
					precip: hourly.precipitation[hourIndex] ?? 0,
					precipprob: hourly.precipitation_probability[hourIndex] ?? 0,
					snow: 0,
					snowdepth: null,
					preciptype: null,
					windgust: 0,
					windspeed: hourly.wind_speed_10m[hourIndex] ?? 0,
					winddir: hourly.wind_direction_10m[hourIndex] ?? 0,
					pressure: hourly.pressure_msl[hourIndex] ?? 0,
					visibility: hourly.visibility[hourIndex] ?? 0,
					cloudcover: hourly.cloud_cover[hourIndex] ?? 0,
					solarradiation: 0,
					solarenergy: 0,
					uvindex: 0,
					severerisk: 0,
					conditions: weatherCodeToCondition(code),
					icon: weatherCodeToIcon(code, isDay),
					stations: null,
					source: 'open-meteo'
				};
			});

			const temps = hours.map((hour) => hour.temp);
			const feels = hours.map((hour) => hour.feelslike);
			const precipProbs = hours.map((hour) => hour.precipprob);
			const humidities = hours.map((hour) => hour.humidity);
			const windSpeeds = hours.map((hour) => hour.windspeed);
			const cloudCovers = hours.map((hour) => hour.cloudcover);
			const visibilities = hours.map((hour) => hour.visibility);
			const pressures = hours.map((hour) => hour.pressure);
			const dayCode = dayMeta?.weatherCode ?? hours[12]?.conditions ?? 3;
			const dayIcon = weatherCodeToIcon(Number(dayCode), true);

			return {
				datetime: day,
				datetimeEpoch: Math.floor(toDate(day).getTime() / 1000),
				tempmax: dayMeta?.tempMax ?? Math.max(...temps),
				tempmin: dayMeta?.tempMin ?? Math.min(...temps),
				temp: average(temps),
				feelslikemax: dayMeta?.feelslikeMax ?? Math.max(...feels),
				feelslikemin: dayMeta?.feelslikeMin ?? Math.min(...feels),
				feelslike: average(feels),
				dew: 0,
				humidity: average(humidities),
				precip: hours.reduce((sum, hour) => sum + hour.precip, 0),
				precipprob: dayMeta?.precipProbMax ?? Math.round(Math.max(...precipProbs)),
				precipcover: 0,
				preciptype: null,
				snow: 0,
				snowdepth: null,
				windgust: 0,
				windspeed: dayMeta?.windSpeedMax ?? Math.max(...windSpeeds),
				winddir: dayMeta?.windDirDominant ?? 0,
				pressure: average(pressures),
				cloudcover: average(cloudCovers),
				visibility: average(visibilities),
				solarradiation: 0,
				solarenergy: 0,
				uvindex: 0,
				severerisk: 0,
				sunrise: dayMeta?.sunrise || '',
				sunriseEpoch: dayMeta?.sunrise ? Math.floor(new Date(dayMeta.sunrise).getTime() / 1000) : 0,
				sunset: dayMeta?.sunset || '',
				sunsetEpoch: dayMeta?.sunset ? Math.floor(new Date(dayMeta.sunset).getTime() / 1000) : 0,
				moonphase: 0,
				conditions: weatherCodeToCondition(Number(dayCode)),
				description: weatherCodeToCondition(Number(dayCode)),
				icon: dayIcon,
				stations: null,
				source: 'open-meteo',
				hours,
				isEstimated: false,
				confidence: 'high',
				confidenceScore: 1,
				sourceModel: null
			};
		});

	return {
		queryCost: 1,
		latitude: forecast.latitude,
		longitude: forecast.longitude,
		resolvedAddress,
		address: location,
		timezone: forecast.timezone,
		tzoffset: forecast.utc_offset_seconds / 3600,
		days
	};
};

const dateDiffDays = (fromDate: string, toDateValue: string): number => {
	const from = toDate(fromDate).getTime();
	const to = toDate(toDateValue).getTime();
	return Math.round((to - from) / (24 * 60 * 60 * 1000));
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const round1 = (value: number): number => Math.round(value * 10) / 10;

const weightedBaseline = (values: number[]): number => {
	if (values.length === 0) return 0;

	const weights = [0.35, 0.25, 0.2, 0.12, 0.08];
	const recent = values.slice(-5).reverse();
	const totalWeight = recent.reduce((sum, _value, index) => sum + (weights[index] || 0), 0);

	if (totalWeight === 0) {
		return recent[0] || 0;
	}

	return recent.reduce((sum, value, index) => sum + value * (weights[index] || 0), 0) / totalWeight;
};

const linearSlope = (values: number[]): number => {
	if (values.length < 2) return 0;

	const points = values.slice(-7);
	const n = points.length;
	const xMean = (n - 1) / 2;
	const yMean = points.reduce((sum, value) => sum + value, 0) / n;

	let numerator = 0;
	let denominator = 0;

	points.forEach((value, index) => {
		numerator += (index - xMean) * (value - yMean);
		denominator += (index - xMean) ** 2;
	});

	return denominator === 0 ? 0 : numerator / denominator;
};

const standardDeviation = (values: number[]): number => {
	if (values.length < 2) return 0;

	const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
	const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
	return Math.sqrt(variance);
};

const mapProjectedIcon = (
	precipProbability: number,
	windSpeed: number,
	cloudCover: number,
	baseIcon: string
): string => {
	if (precipProbability >= 60) return 'rain';

	if (windSpeed >= 20) return 'wind';

	if (cloudCover >= 70) return 'cloudy';

	if (cloudCover >= 40) return 'partly-cloudy-day';

	if (baseIcon) return baseIcon;

	return 'clear-day';
};

const createProjectedDay = (weatherData: WeatherData, targetDate: string): WeatherDayData | null => {
	const sortedDays = [...weatherData.days].sort((a, b) => a.datetime.localeCompare(b.datetime));
	const existingDay = sortedDays.find((day) => day.datetime === targetDate);

	if (existingDay) {
		return {
			...existingDay,
			isEstimated: false,
			confidence: 'high',
			confidenceScore: 1,
			sourceModel: null
		};
	}

	const priorDays = sortedDays.filter((day) => day.datetime < targetDate);

	if (priorDays.length < 3) {
		return null;
	}

	const recentDays = priorDays.slice(-7);
	const latestDay = recentDays[recentDays.length - 1];
	const horizonOffset = Math.max(1, dateDiffDays(latestDay.datetime, targetDate));

	const temps = recentDays.map((day) => day.temp);
	const tempMaxes = recentDays.map((day) => day.tempmax);
	const tempMins = recentDays.map((day) => day.tempmin);
	const precipProbs = recentDays.map((day) => day.precipprob || 0);
	const windSpeeds = recentDays.map((day) => day.windspeed || 0);
	const cloudCovers = recentDays.map((day) => day.cloudcover || 0);

	const dayBeforeTarget = new Date(toDate(targetDate));
	dayBeforeTarget.setDate(dayBeforeTarget.getDate() - 7);
	const sameWeekdayPrior = sortedDays.find((day) => day.datetime === formatDate(dayBeforeTarget));
	const recentMeanTemp = temps.reduce((sum, value) => sum + value, 0) / temps.length;
	const recentMeanWind = windSpeeds.reduce((sum, value) => sum + value, 0) / windSpeeds.length;
	const recentMeanPrecip = precipProbs.reduce((sum, value) => sum + value, 0) / precipProbs.length;

	const seasonalTempTerm = sameWeekdayPrior ? sameWeekdayPrior.temp - recentMeanTemp : 0;
	const seasonalWindTerm = sameWeekdayPrior ? sameWeekdayPrior.windspeed - recentMeanWind : 0;
	const seasonalPrecipTerm =
		sameWeekdayPrior && typeof sameWeekdayPrior.precipprob === 'number'
			? sameWeekdayPrior.precipprob - recentMeanPrecip
			: 0;

	const projectedTemp = weightedBaseline(temps) + 0.6 * linearSlope(temps) * horizonOffset + 0.4 * seasonalTempTerm;
	const projectedTempMax =
		weightedBaseline(tempMaxes) + 0.6 * linearSlope(tempMaxes) * horizonOffset + 0.4 * seasonalTempTerm;
	const projectedTempMin =
		weightedBaseline(tempMins) + 0.6 * linearSlope(tempMins) * horizonOffset + 0.4 * seasonalTempTerm;
	const projectedPrecip =
		weightedBaseline(precipProbs) + 0.6 * linearSlope(precipProbs) * horizonOffset + 0.4 * seasonalPrecipTerm;
	const projectedWind =
		weightedBaseline(windSpeeds) + 0.6 * linearSlope(windSpeeds) * horizonOffset + 0.4 * seasonalWindTerm;
	const projectedCloudCover = weightedBaseline(cloudCovers);

	const safeTemp = round1(clamp(projectedTemp, -40, 140));
	const safeTempMax = round1(clamp(Math.max(projectedTempMax, safeTemp), -30, 150));
	const safeTempMin = round1(clamp(Math.min(projectedTempMin, safeTemp), -60, safeTempMax));
	const safePrecip = clamp(Math.round(projectedPrecip), 0, 100);
	const safeWind = clamp(Math.round(projectedWind), 0, 120);

	const volatility = standardDeviation(temps);
	let confidenceScore = 0.8;

	if (recentDays.length < 5) confidenceScore -= 0.15;

	if (volatility > 8) confidenceScore -= 0.1;

	if (!sameWeekdayPrior) confidenceScore -= 0.1;

	if (horizonOffset >= 5) confidenceScore -= 0.1;

	if (horizonOffset >= 7) confidenceScore -= 0.05;

	confidenceScore = clamp(Number(confidenceScore.toFixed(2)), 0.1, 0.95);

	const confidence: ProjectionConfidence =
		confidenceScore >= 0.7 ? 'high' : confidenceScore >= 0.45 ? 'medium' : 'low';

	const tempDelta = safeTemp - latestDay.temp;
	const projectedHours = latestDay.hours.map((hour) => {
		const projectedHourTemp = round1(clamp(hour.temp + tempDelta, safeTempMin - 5, safeTempMax + 5));
		const projectedHourPrecip = clamp(
			Math.round(hour.precipprob + (safePrecip - latestDay.precipprob) * 0.5),
			0,
			100
		);

		return {
			...hour,
			datetimeEpoch: hour.datetimeEpoch + horizonOffset * 24 * 60 * 60,
			temp: projectedHourTemp,
			feelslike: projectedHourTemp,
			precipprob: projectedHourPrecip,
			windspeed: safeWind,
			cloudcover: projectedCloudCover,
			conditions: `Estimated: ${latestDay.conditions}`,
			source: 'projection-v1'
		};
	});

	const icon = mapProjectedIcon(safePrecip, safeWind, projectedCloudCover, latestDay.icon);

	return {
		...latestDay,
		datetime: targetDate,
		datetimeEpoch: Math.floor(toDate(targetDate).getTime() / 1000),
		temp: safeTemp,
		tempmax: safeTempMax,
		tempmin: safeTempMin,
		feelslike: safeTemp,
		feelslikemax: safeTempMax,
		feelslikemin: safeTempMin,
		precipprob: safePrecip,
		windspeed: safeWind,
		cloudcover: projectedCloudCover,
		conditions: 'Estimated from recent trend',
		description: 'Estimated forecast based on recent weather trend',
		icon,
		hours: projectedHours,
		source: 'projection-v1',
		isEstimated: true,
		confidence,
		confidenceScore,
		sourceModel: 'projection-v1'
	};
};

export const getWeatherDayOrProjection = (weatherData: WeatherData, targetDate: string): WeatherDayData | null => {
	return createProjectedDay(weatherData, targetDate);
};

export const apiWeather = async (location: string, date1: string, date2?: string): Promise<WeatherData> => {
	const resolved = await resolveLocation(location);
	const endDate = date2 || date1;
	const end = toDate(endDate);

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const maxForecastDate = new Date(today);
	maxForecastDate.setDate(maxForecastDate.getDate() + 15);

	const boundedStart = today;
	const boundedEnd = end > maxForecastDate ? maxForecastDate : end;

	if (boundedStart > boundedEnd) {
		return {
			queryCost: 1,
			latitude: resolved.latitude,
			longitude: resolved.longitude,
			resolvedAddress: resolved.resolvedAddress,
			address: location,
			timezone: 'UTC',
			tzoffset: 0,
			days: []
		};
	}

	const forecastUrl = new URL(OPEN_METEO_FORECAST_URL);
	forecastUrl.searchParams.set('latitude', String(resolved.latitude));
	forecastUrl.searchParams.set('longitude', String(resolved.longitude));
	forecastUrl.searchParams.set('start_date', formatDate(boundedStart));
	forecastUrl.searchParams.set('end_date', formatDate(boundedEnd));
	forecastUrl.searchParams.set('timezone', 'auto');
	forecastUrl.searchParams.set('temperature_unit', 'fahrenheit');
	forecastUrl.searchParams.set('wind_speed_unit', 'mph');
	forecastUrl.searchParams.set('precipitation_unit', 'inch');
	forecastUrl.searchParams.set(
		'hourly',
		[
			'temperature_2m',
			'apparent_temperature',
			'relative_humidity_2m',
			'precipitation',
			'precipitation_probability',
			'weather_code',
			'cloud_cover',
			'wind_speed_10m',
			'wind_direction_10m',
			'pressure_msl',
			'visibility',
			'is_day'
		].join(',')
	);
	forecastUrl.searchParams.set(
		'daily',
		[
			'weather_code',
			'temperature_2m_max',
			'temperature_2m_min',
			'apparent_temperature_max',
			'apparent_temperature_min',
			'sunrise',
			'sunset',
			'precipitation_probability_max',
			'wind_speed_10m_max',
			'wind_direction_10m_dominant'
		].join(',')
	);

	const forecastData = await fetchJson<OpenMeteoForecastResponse>(forecastUrl.toString());
	return mapOpenMeteoForecastToWeatherData(location, resolved.resolvedAddress, forecastData);
};
