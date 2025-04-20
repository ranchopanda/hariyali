import { predictYield } from '../utils/geminiAI';

// Types
export interface WeatherData {
  temperature: number;
  rainfall: number;
  humidity: number;
  windSpeed: number;
}

export interface NDVIData {
  value: number;
  date: string;
}

export interface SeasonalFactor {
  crop: string;
  season: string;
  factor: number;
}

export interface HistoricalYield {
  crop: string;
  year: number;
  yield: number;
  area: number;
}

export interface YieldPredictionInput {
  crop: string;
  area: number;
  soilType: string;
  weather: WeatherData;
  disease?: string;
  ndvi?: NDVIData;
  season?: string;
  location?: string;
  plantingDate?: string;
  irrigationType?: string;
  cropVariety?: string;
  fertilizers?: string[];
  soilNutrients?: {
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
    ph?: number;
  };
  historicalYield?: number;
}

export interface YieldPredictionOutput {
  predictedYield: number;
  yieldUnit: string;
  confidence: number;
  potentialIncome: number;
  diseaseLossPercent: number | null;
  recommendations: string[];
  factors: {
    weather: number;
    soil: number;
    disease: number;
    ndvi: number;
    seasonal: number;
    historical: number;
  };
}

// Static data (in a real app, this would come from a database)
const SEASONAL_FACTORS: SeasonalFactor[] = [
  { crop: 'Rice', season: 'Kharif', factor: 1.2 },
  { crop: 'Rice', season: 'Rabi', factor: 0.8 },
  { crop: 'Wheat', season: 'Kharif', factor: 0.7 },
  { crop: 'Wheat', season: 'Rabi', factor: 1.3 },
  // Add more crops and seasons
];

const HISTORICAL_YIELDS: HistoricalYield[] = [
  { crop: 'Rice', year: 2023, yield: 4.5, area: 1 },
  { crop: 'Rice', year: 2022, yield: 4.2, area: 1 },
  { crop: 'Wheat', year: 2023, yield: 3.8, area: 1 },
  { crop: 'Wheat', year: 2022, yield: 3.6, area: 1 },
  // Add more historical data
];

// Helper functions
function getSeasonalFactor(crop: string, season: string): number {
  const factor = SEASONAL_FACTORS.find(
    f => f.crop.toLowerCase() === crop.toLowerCase() && 
    f.season.toLowerCase() === season.toLowerCase()
  );
  return factor?.factor || 1.0;
}

function getHistoricalYieldFactor(crop: string): number {
  const yields = HISTORICAL_YIELDS.filter(
    y => y.crop.toLowerCase() === crop.toLowerCase()
  );
  if (yields.length < 2) return 1.0;
  
  const latestYield = yields[yields.length - 1].yield;
  const previousYield = yields[yields.length - 2].yield;
  return latestYield / previousYield;
}

function calculateNDVIFactor(ndvi?: NDVIData): number {
  if (!ndvi) return 1.0;
  // NDVI values range from -1 to 1, with 0.6-0.9 being healthy vegetation
  if (ndvi.value >= 0.6 && ndvi.value <= 0.9) return 1.2;
  if (ndvi.value >= 0.4 && ndvi.value < 0.6) return 1.0;
  if (ndvi.value >= 0.2 && ndvi.value < 0.4) return 0.8;
  return 0.6;
}

function calculateWeatherFactor(weather: WeatherData): number {
  // Simple weather factor calculation based on ideal conditions
  const tempFactor = weather.temperature >= 20 && weather.temperature <= 30 ? 1.2 : 0.8;
  const rainFactor = weather.rainfall >= 500 && weather.rainfall <= 1500 ? 1.2 : 0.8;
  const humidityFactor = weather.humidity >= 60 && weather.humidity <= 80 ? 1.1 : 0.9;
  
  return (tempFactor + rainFactor + humidityFactor) / 3;
}

function calculateSoilFactor(soilType: string): number {
  // Simple soil factor based on soil type
  const soilFactors: { [key: string]: number } = {
    'clay': 0.9,
    'loamy': 1.2,
    'sandy': 0.8,
    'black': 1.1,
    'red': 1.0
  };
  return soilFactors[soilType.toLowerCase()] || 1.0;
}

function calculateDiseaseFactor(disease?: string): number {
  if (!disease) return 1.0;
  
  const diseaseImpact: { [key: string]: number } = {
    'rust': 0.7,
    'blight': 0.6,
    'powdery mildew': 0.8,
    'mosaic virus': 0.5,
    'black spot': 0.75,
    'brown spot': 0.8,
    'yellow spot': 0.85
  };
  
  return diseaseImpact[disease.toLowerCase()] || 0.9;
}

// Main prediction function
export async function predictCropYield(input: YieldPredictionInput): Promise<YieldPredictionOutput> {
  try {
    // 1. Get base prediction from Gemini AI
    const basePrediction = await predictYield(
      input.crop,
      input.area,
      input.soilType,
      input.weather.rainfall,
      input.weather.temperature,
      input.disease,
      input.plantingDate,
      input.irrigationType,
      input.cropVariety,
      input.fertilizers,
      input.soilNutrients,
      input.historicalYield
    );
    
    // 2. Calculate adjustment factors
    const weatherFactor = calculateWeatherFactor(input.weather);
    const soilFactor = calculateSoilFactor(input.soilType);
    const diseaseFactor = calculateDiseaseFactor(input.disease);
    const ndviFactor = calculateNDVIFactor(input.ndvi);
    const seasonalFactor = getSeasonalFactor(input.crop, input.season || '');
    const historicalFactor = getHistoricalYieldFactor(input.crop);
    
    // 3. Apply adjustment factors to base prediction
    const adjustedYield = basePrediction.predictedYield * 
      weatherFactor * 
      soilFactor * 
      diseaseFactor * 
      ndviFactor * 
      seasonalFactor * 
      historicalFactor;
    
    // 4. Calculate confidence based on factor reliability
    const confidenceFactors = [
      weatherFactor,
      soilFactor,
      diseaseFactor,
      ndviFactor,
      seasonalFactor,
      historicalFactor
    ];
    
    const averageConfidence = confidenceFactors.reduce((a, b) => a + b, 0) / confidenceFactors.length;
    const confidence = Math.min(100, Math.round(averageConfidence * 100));
    
    // 5. Calculate potential income (assuming base price per unit)
    const basePricePerUnit = 50; // This should come from a price API in production
    const potentialIncome = adjustedYield * basePricePerUnit;
    
    // 6. Generate recommendations
    const recommendations = [
      ...basePrediction.recommendations,
      `Weather conditions are ${weatherFactor >= 1.1 ? 'optimal' : 'suboptimal'} for ${input.crop}`,
      `Soil conditions are ${soilFactor >= 1.1 ? 'favorable' : 'not ideal'} for ${input.crop}`,
      input.disease ? `Disease impact is estimated at ${Math.round((1 - diseaseFactor) * 100)}%` : 'No disease impact detected',
      `Seasonal factors are ${seasonalFactor >= 1.1 ? 'favorable' : 'not optimal'} for ${input.crop}`,
      `Historical trends suggest ${historicalFactor >= 1.1 ? 'improving' : 'declining'} yields`
    ];
    
    return {
      predictedYield: Math.round(adjustedYield * 100) / 100,
      yieldUnit: basePrediction.yieldUnit,
      confidence,
      potentialIncome: Math.round(potentialIncome),
      diseaseLossPercent: input.disease ? Math.round((1 - diseaseFactor) * 100) : null,
      recommendations,
      factors: {
        weather: weatherFactor,
        soil: soilFactor,
        disease: diseaseFactor,
        ndvi: ndviFactor,
        seasonal: seasonalFactor,
        historical: historicalFactor
      }
    };
  } catch (error) {
    console.error('Error in yield prediction:', error);
    throw new Error('Failed to predict crop yield');
  }
} 