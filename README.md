# Kisan Krishi Dost AI

A comprehensive AI-powered farming assistant application for Indian farmers.

## Features

- **Disease Detection**: Upload images of plant diseases for AI-powered diagnosis and treatment recommendations
- **Weather Forecast**: Get accurate weather forecasts for your location
- **Crop Information**: Access detailed information about various crops
- **Soil Analysis**: Analyze soil samples for nutrient content and recommendations
- **Yield Prediction**: Predict crop yields based on historical data and current conditions

## Technologies Used

- React with TypeScript
- Vite for fast development and building
- Shadcn UI for beautiful components
- Gemini AI for plant disease detection
- OpenWeather API for weather forecasts

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/kisan-krishi-dost-ai.git
   cd kisan-krishi-dost-ai
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:8080`

## Deployment

### Deploying to Netlify

1. Build the project:
   ```
   npm run build
   ```

2. Deploy to Netlify:
   ```
   netlify deploy
   ```

3. Follow the prompts to complete the deployment.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Gemini AI for providing the plant disease detection API
- OpenWeather for providing the weather forecast API
- All contributors who have helped with the development of this project
