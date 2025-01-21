import { Action, Middleware, ThunkAction, configureStore, createSelector } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { setupListeners } from '@reduxjs/toolkit/query';
import apiService from 'src/store/apiService';
import rootReducer from './rootReducer';
import { dynamicMiddleware } from './middleware';
import rootSaga from './rootSaga';

export type RootState = ReturnType<typeof rootReducer>;

const sagaMiddleware = createSagaMiddleware(); // Add saga middleware

const middlewares: Middleware[] = [apiService.middleware, dynamicMiddleware, sagaMiddleware];

export const makeStore = (preloadedState?: Partial<RootState>) => {
	const store = configureStore({
		reducer: rootReducer,
		middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(middlewares),
		preloadedState
	});

	// Run the root saga
	sagaMiddleware.run(rootSaga);

	setupListeners(store.dispatch);
	return store;
};

export const store = makeStore();

export type AppStore = typeof store;
export type AppDispatch = AppStore['dispatch'];
export type AppThunk<ThunkReturnType = void> = ThunkAction<ThunkReturnType, RootState, unknown, Action>;
export type AppAction<R = Promise<void>> = Action<string> | ThunkAction<R, RootState, unknown, Action<string>>;

export const createAppSelector = createSelector.withTypes<RootState>();

export default store;
