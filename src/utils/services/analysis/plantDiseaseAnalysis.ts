
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

Analyze this plant image carefully and provide a detailed disease assessment in JSON format.

First, identify the plant type and examine the visual symptoms.
Look for discoloration, spots, wilting, lesions, and other indicators of disease.
Consider common diseases that affect this specific plant species.

Provide your analysis in this exact JSON format:
{
  "disease_name": "Full scientific name of the disease",
  "confidence": number between 0-100,
  "description": "Detailed description of symptoms and disease characteristics",
  "treatment": [
    "3-5 specific treatment options in order of effectiveness"
  ],
  "recommendations": [
    "5-6 specific preventive measures and best practices"
  ],
  "severity": "Mild/Moderate/Severe",
  "crop_type": "Scientific name of the plant species",
  "yield_impact": "Estimated effect on crop yield",
  "spread_risk": "Low/Medium/High risk of disease spreading",
  "recovery_chance": "Low/Medium/High chance of plant recovery"
}

Be specific, accurate, and base your assessment on established plant pathology knowledge.
If you're uncertain, provide your best estimate but indicate a lower confidence score.`;

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
    } else {
      // Try simple JSON extraction if no code blocks found
      const simpleMatch = text.match(/\{[\s\S]*\}/);
      if (simpleMatch) {
        jsonStr = simpleMatch[0];
      }
    }
    
    try {
      const parsedData = JSON.parse(jsonStr);
      
      // Validate the data structure and provide defaults for missing fields
      const validatedResult: AnalysisData = {
        ...FALLBACK_RESULT,
        disease_name: parsedData.disease_name || FALLBACK_RESULT.disease_name,
        confidence: typeof parsedData.confidence === 'number' ? parsedData.confidence : FALLBACK_RESULT.confidence,
        description: parsedData.description || FALLBACK_RESULT.description,
        treatment: Array.isArray(parsedData.treatment) ? parsedData.treatment : FALLBACK_RESULT.treatment,
        recommendations: Array.isArray(parsedData.recommendations) ? parsedData.recommendations : FALLBACK_RESULT.recommendations,
        severity: ['Mild', 'Moderate', 'Severe'].includes(parsedData.severity) ? parsedData.severity : FALLBACK_RESULT.severity,
        crop_type: parsedData.crop_type || FALLBACK_RESULT.crop_type,
        yield_impact: parsedData.yield_impact || FALLBACK_RESULT.yield_impact,
        spread_risk: ['Low', 'Medium', 'High'].includes(parsedData.spread_risk) ? parsedData.spread_risk : FALLBACK_RESULT.spread_risk,
        recovery_chance: ['Low', 'Medium', 'High'].includes(parsedData.recovery_chance) ? parsedData.recovery_chance : FALLBACK_RESULT.recovery_chance
      };
      
      return validatedResult;
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      console.log("Raw response text:", text);
      return FALLBACK_RESULT;
    }
  }, FALLBACK_RESULT);
};
