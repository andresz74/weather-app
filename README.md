# Weather App

![weather app](http://zenteno.org/public_assets/weather-app-01.png)

A responsive web application for checking weather forecasts for a selected location and time. The app dynamically fetches weather data from an API and visualizes it with interactive charts.

## Features

-   Select location, day of the week, and time to view weather forecasts.
-   Hourly and daily temperature charts with dynamic annotations.
-   Responsive design for mobile and desktop screens.
-   Navigate between weekly forecasts with left/right arrow controls.
-   Dynamic icons for weather conditions fetched from the API.

## Table of Contents

-   [Installation](#installation)
-   [Usage](#usage)
-   [Features](#features)
-   [Technologies Used](#technologies-used)
-   [Customization](#customization)
-   [License](#license)

---

## Installation

1. **Clone the Repository**:

    ```bash
    git clone https://github.com/andresz74/weather-app.git
    cd weather-app
    ```

2. **Install Dependencies**:
   Make sure you have Node.js and npm or Yarn installed.

    ```bash
    npm install
    ```

3. **Set Up Environment Variables**:
   Create a `.env` file at the root and add the following variables:

    ```env
    REACT_APP_API_BASE_URL=<Your API Base URL>
    ```

4. **Run the App**:

    ```bash
    npm start
    ```

    The app will be available at `http://localhost:3000`.

---

## Usage

1. Select a **location** using the input field.
2. Choose a **day of the week** and **time of day**.
3. View the forecast for the selected date and the next week using interactive graphs.
4. Use the **arrow buttons** to navigate through weekly forecasts.
5. Enjoy detailed weather information, including:
    - Description
    - Wind speed
    - Rain probability
    - Temperature trends

---

## Technologies Used

-   **React**: Frontend framework.
-   **TypeScript**: For type safety and better code maintainability.
-   **ApexCharts**: For interactive and responsive chart visualizations.
-   **Material-UI**: For pre-styled components and icons.
-   **CSS**: For responsive styling.
-   **API Integration**: Weather data fetched dynamically from an external API.

---

## Customization

### Icons

Icons are dynamically rendered using the `WeatherIcon` component. Place your SVG files in the `public/path-to-icons/` directory. Ensure filenames match the `icon` values returned by the API.

### Graph Configuration

Customize graphs by editing the `options` and `series` props in `WeatherContent.tsx`. Refer to the [ApexCharts documentation](https://apexcharts.com/docs/) for advanced configurations.

---

## Deployment

1. **Build the App**:

    ```bash
    npm run build
    # or
    yarn build
    ```

2. **Deploy**:
   Use any static hosting service (e.g., Netlify, Vercel, Cloudflare Pages) to deploy the contents of the `build/` directory.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Feel free to modify this README as per your project’s updates and deployment details! If you need further refinements, let me know!
