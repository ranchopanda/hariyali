
import { createGeminiModel, tryWithApiKeys } from '../helpers/geminiModelHelper';

export interface SoilAnalysisResult {
  soil_type: string;
  confidence: number;
  ph_level: string;
  nutrients: {
    name: string;
    level: "Low" | "Medium" | "High";
    recommendation: string;
  }[];
  recommendations: string[];
}

const FALLBACK_RESULT: SoilAnalysisResult = {
  soil_type: "Unknown",
  confidence: 0,
  ph_level: "Unknown",
  nutrients: [
    {
      name: "Nitrogen (N)",
      level: "Low",
      recommendation: "Consider soil testing for accurate nutrient levels"
    }
  ],
  recommendations: [
    "Please try again with a clearer image",
    "Ensure good lighting when taking the photo",
    "Include more soil surface area in the image"
  ]
};

export const analyzeSoil = async (base64Image: string): Promise<SoilAnalysisResult> => {
  if (!base64Image) {
    throw new Error("No image provided");
  }

  return tryWithApiKeys(async (apiKey) => {
    const model = createGeminiModel(apiKey);
    
    const prompt = `As an expert agricultural soil analyst, examine this soil image and provide a detailed analysis in JSON format.
    
    Consider:
    - Soil color and texture
    - Visual indicators of nutrient content
    - Signs of organic matter
    - Soil structure and composition
    
    Provide your analysis in this exact JSON format:
    {
      "soil_type": "specific soil type name",
      "confidence": number between 0-100,
      "ph_level": "estimated pH range (e.g., '6.0-6.5')",
      "nutrients": [
        {
          "name": "nutrient name",
          "level": "Low/Medium/High",
          "recommendation": "specific recommendation for this nutrient"
        }
      ],
      "recommendations": [
        "array of 3-5 specific recommendations for soil improvement"
      ]
    }

    Focus on agricultural relevance for Indian farming conditions.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
    ]);
    
    const response = result.response;
    const text = response.text();
    
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize the response
      return {
        soil_type: analysis.soil_type || FALLBACK_RESULT.soil_type,
        confidence: Number(analysis.confidence) || FALLBACK_RESULT.confidence,
        ph_level: analysis.ph_level || FALLBACK_RESULT.ph_level,
        nutrients: Array.isArray(analysis.nutrients) 
          ? analysis.nutrients.map(n => ({
              name: n.name || "Unknown Nutrient",
              level: (n.level === "Low" || n.level === "Medium" || n.level === "High") 
                ? n.level 
                : "Low",
              recommendation: n.recommendation || "Consult local agricultural expert"
            }))
          : FALLBACK_RESULT.nutrients,
        recommendations: Array.isArray(analysis.recommendations)
          ? analysis.recommendations
          : FALLBACK_RESULT.recommendations
      };
    } catch (error) {
      console.error("Error parsing soil analysis response:", error);
      throw new Error("Failed to analyze soil image");
    }
  }, FALLBACK_RESULT);
};

