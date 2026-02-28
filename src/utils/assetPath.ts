const LOCAL_ASSET_PREFIX = /^\/+/;

export const assetPath = (path: string): string => {
	return `${import.meta.env.BASE_URL}${path.replace(LOCAL_ASSET_PREFIX, '')}`;
};
