import '@i18n/i18n';
import './styles/app-base.css';
import './styles/app-components.css';
import './styles/app-utilities.css';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import routes from 'src/configs/routesConfig';
import { worker } from '@mock-utils/mswMockAdapter';
import { assetPath } from '@/utils/assetPath';

async function mockSetup() {
	return worker.start({
		onUnhandledRequest: 'bypass',
		serviceWorker: {
			url: assetPath('/mockServiceWorker.js')
		}
	});
}

/**
 * The root element of the application.
 */
const container = document.getElementById('app');

if (!container) {
	throw new Error('Failed to find the root element');
}

mockSetup().then(() => {
	/**
	 * The root component of the application.
	 */
	const root = createRoot(container, {
		onUncaughtError: (error, errorInfo) => {
			console.error('UncaughtError error', error, errorInfo.componentStack);
		},
		onCaughtError: (error, errorInfo) => {
			console.error('Caught error', error, errorInfo.componentStack);
		}
	});

	const routerBase = import.meta.env.BASE_URL === '/' ? '/' : import.meta.env.BASE_URL.replace(/\/$/, '');
	const router = createBrowserRouter(routes, {
		basename: routerBase
	});

	root.render(<RouterProvider router={router} />);
});
