
import { createGeminiModel, tryWithApiKeys } from "../helpers/geminiModelHelper";
import { AnalysisData } from '../../types/analysisTypes';

const FALLBACK_RESULT: AnalysisData = {
  id: "",
  timestamp: new Date().toISOString(),
  type: "plant_disease",
  disease_name: "Unknown Plant Disease",
  confidence: 50,
  description: "Unable to analyze the image. The system couldn't identify the disease with sufficient confidence.",
  recommendations: [
    "Take another photo with better lighting and focus.",
    "Ensure the affected area is clearly visible.",
    "Try capturing different angles of the plant."
  ],
  treatment: [
    "Consult with a local agricultural expert.",
    "Consider general preventive measures like removing affected leaves.",
    "Monitor the plant for any changes in symptoms."
  ],
  severity: "Unknown",
  crop_type: "Unknown Plant",
  yield_impact: "Unknown",
  spread_risk: "Medium",
  recovery_chance: "Medium"
};

export const analyzePlantDisease = async (base64Image: string): Promise<AnalysisData> => {
  if (!base64Image) {
    throw new Error("No image provided");
  }

  return tryWithApiKeys(async (apiKey) => {
    const model = createGeminiModel(apiKey);
    
    const prompt = `
You are PlantDoctorAI, an expert agricultural system specializing in plant disease detection.

Analyze this plant image and provide a detailed disease assessment in JSON format with these fields:
- disease_name: The full scientific name of the disease and pathogen
- confidence: A number from 0-100 representing your confidence level
- description: A detailed description of the visual symptoms
- treatment: An array of 3-5 treatment options
- recommendations: An array of 5-6 preventive measures
- severity: "Mild", "Moderate", or "Severe"
- crop_type: The plant species affected
- yield_impact: Estimated impact on crop yield
- spread_risk: "Low", "Medium", or "High" risk of spreading
- recovery_chance: "Low", "Medium", or "High" chance of recovery

Format your response as a valid JSON object with these exact fields.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const parsedResult = { ...FALLBACK_RESULT, ...JSON.parse(jsonStr) };
    return parsedResult;
  }, FALLBACK_RESULT);
};
