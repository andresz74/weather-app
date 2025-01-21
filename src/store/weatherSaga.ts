/* eslint-disable no-console */
import { takeLatest, call, put } from 'redux-saga/effects';
import { fetchWeatherRequest, fetchWeatherSuccess, fetchWeatherFailure } from './weatherSlice';
import { apiWeather, WeatherData } from '@/utils/apiWeather';

function* fetchWeatherSaga(action: ReturnType<typeof fetchWeatherRequest>) {
	try {
		const { location, date1, date2 } = action.payload;
		console.log('Fetching weather for:', location, date1, date2);

		const weatherData: WeatherData = yield call(apiWeather, location, date1, date2);

		const hasDate1 = weatherData.days.some((day) => day.datetime === date1);
		const hasDate2 = weatherData.days.some((day) => day.datetime === date2);

		if (!hasDate1 || !hasDate2) {
			throw new Error(`Weather data for ${!hasDate1 ? date1 : date2} not found`);
		}

		yield put(
			fetchWeatherSuccess({
				data: weatherData,
				date1: action.payload.date1,
				date2: action.payload.date2,
				selectedTime: action.payload.selectedTime
			})
		);
	} catch (error) {
		console.log('Error in fetchWeatherSaga:', error);

		if (error instanceof Error && error.message.includes('Quota exceeded')) {
			yield put(fetchWeatherFailure('Quota exceeded. Please try again tomorrow.'));
		} else {
			yield put(fetchWeatherFailure('An unexpected error occurred. Please try again later.'));
		}
	}
}

export function* weatherWatcherSaga() {
	yield takeLatest(fetchWeatherRequest.type, fetchWeatherSaga);
}
