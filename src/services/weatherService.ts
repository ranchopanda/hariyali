import axios from 'axios';

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
}

export async function getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
  try {
    // Get current weather
    const currentWeatherResponse = await axios.get(
      `${OPENWEATHER_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    // Get 5-day forecast to calculate average rainfall
    const forecastResponse = await axios.get(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    // Calculate average rainfall from forecast
    const rainfallData = forecastResponse.data.list.map((item: any) => item.rain?.['3h'] || 0);
    const averageRainfall = rainfallData.reduce((sum: number, value: number) => sum + value, 0) / rainfallData.length;

    return {
      temperature: currentWeatherResponse.data.main.temp,
      humidity: currentWeatherResponse.data.main.humidity,
      windSpeed: currentWeatherResponse.data.wind.speed,
      rainfall: averageRainfall
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw new Error('Failed to fetch weather data');
  }
}

export async function getWeatherByLocation(location: string): Promise<WeatherData> {
  try {
    // First, get coordinates from location name
    const geocodingResponse = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${OPENWEATHER_API_KEY}`
    );

    if (geocodingResponse.data.length === 0) {
      throw new Error('Location not found');
    }

    const { lat, lon } = geocodingResponse.data[0];
    return getCurrentWeather(lat, lon);
  } catch (error) {
    console.error('Error fetching weather data for location:', error);
    throw new Error('Failed to fetch weather data for location');
  }
} 