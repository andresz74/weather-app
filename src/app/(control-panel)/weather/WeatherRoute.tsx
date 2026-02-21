import i18next from 'i18next';
import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import en from './i18n/en';
import es from './i18n/es';

i18next.addResourceBundle('en', 'weatherPage', en);
i18next.addResourceBundle('es', 'weatherPage', es);

const Weather = lazy(() => import('./Weather'));

/**
 * The Weather page route.
 */
const WeatherRoute: FuseRouteItemType = {
	path: 'weather',
	element: <Weather />,
	auth: null
};

export default WeatherRoute;
