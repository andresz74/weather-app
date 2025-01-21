import { all } from 'redux-saga/effects';
import { weatherWatcherSaga } from './weatherSaga';

export default function* rootSaga() {
	yield all([
		weatherWatcherSaga() // Add all sagas here
	]);
}
