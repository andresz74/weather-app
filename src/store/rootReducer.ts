import { combineSlices } from '@reduxjs/toolkit';
import apiService from './apiService';
import { navigationSlice } from '@/components/theme-layouts/components/navigation/store/navigationSlice';
import weatherSlice from '@/store/weatherSlice';

export interface LazyLoadedSlices {}

export const rootReducer = combineSlices(
	navigationSlice,
	weatherSlice, // Correct way to include the slice
	{
		[apiService.reducerPath]: apiService.reducer
	}
).withLazyLoadedSlices<LazyLoadedSlices>();

export default rootReducer;
