import React from 'react';

type WeatherIconProps = {
	icon: string; // Icon name from the API, e.g., "clear-day"
	className?: string; // Optional class name for styling
	size?: number; // Optional size for the icon
};

const WeatherIcon: React.FC<WeatherIconProps> = ({ icon, className = '', size = 128 }) => {
	// Define the path to the SVG icons
	const iconPath = `/assets/images/weather/${icon}.svg`;

	return (
		<img
			src={iconPath}
			alt={icon}
			className={className}
			style={{ width: size, height: size }}
		/>
	);
};

export default WeatherIcon;
