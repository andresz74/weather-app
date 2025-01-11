import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const Weather = lazy(() => import('./Weather'));

/**
 * The Weather page route.
 */
const WeatherRoute: FuseRouteItemType = {
	path: 'weather',
	element: <Weather />
};

export default WeatherRoute;
