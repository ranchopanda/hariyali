import { createGeminiModel, tryWithApiKeys } from '../helpers/geminiModelHelper';

export interface YieldPredictionResult {
  predictedYield: number;
  yieldUnit: string;
  confidence: number;
  potentialIncome: number;
  recommendations: string[];
  diseaseLossPercent?: number;
}

export const predictYield = async (
  crop: string,
  area: number,
  soilType: string,
  rainfall: number,
  temperature: number,
  disease: string | null
): Promise<YieldPredictionResult> => {
  const prompt = `As an agricultural AI expert, analyze the following farm conditions and provide a detailed yield prediction:
  
  Crop: ${crop}
  Land Area: ${area} hectares
  Soil Type: ${soilType}
  Annual Rainfall: ${rainfall} mm
  Average Temperature: ${temperature}°C
  Disease Present: ${disease || 'None'}
  
  Provide a JSON response with the following structure:
  {
    "predictedYield": number (in tons),
    "yieldUnit": "tons",
    "confidence": number (percentage between 0-100),
    "potentialIncome": number (in INR),
    "recommendations": array of strings with farming advice,
    "diseaseLossPercent": number (percentage of yield loss due to disease, if applicable)
  }
  
  Consider local Indian agricultural conditions, market prices, and farming practices.`;

  return tryWithApiKeys(async (apiKey) => {
    const model = createGeminiModel(apiKey);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }
      
      const prediction = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize the response
      return {
        predictedYield: Number(prediction.predictedYield) || 0,
        yieldUnit: prediction.yieldUnit || "tons",
        confidence: Number(prediction.confidence) || 0,
        potentialIncome: Number(prediction.potentialIncome) || 0,
        recommendations: Array.isArray(prediction.recommendations) 
          ? prediction.recommendations 
          : ["Consider consulting local agricultural experts for specific advice."],
        ...(disease && { diseaseLossPercent: Number(prediction.diseaseLossPercent) || 0 })
      };
    } catch (error) {
      console.error("Error parsing yield prediction response:", error);
      throw new Error("Failed to generate yield prediction");
    }
  }, {
    predictedYield: 0,
    yieldUnit: "tons",
    confidence: 0,
    potentialIncome: 0,
    recommendations: ["Unable to generate prediction. Please try again."],
    diseaseLossPercent: 0
  });
};
