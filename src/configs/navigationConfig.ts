import i18n from '@i18n';
import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
// import ar from './navigation-i18n/ar';
import en from './navigation-i18n/en';
import es from './navigation-i18n/es';
// import tr from './navigation-i18n/tr';

i18n.addResourceBundle('en', 'navigation', en);
i18n.addResourceBundle('es', 'navigation', es);
// i18n.addResourceBundle('tr', 'navigation', tr);
// i18n.addResourceBundle('ar', 'navigation', ar);

/**
 * The navigationConfig object is an array of navigation items for the Fuse application.
 */
const navigationConfig: FuseNavItemType[] = [
	{
		id: 'weather-component',
		title: 'Weather',
		translate: 'WEATHER',
		type: 'item',
		icon: 'heroicons-outline:star',
		url: 'weather'
	}
];

export default navigationConfig;
