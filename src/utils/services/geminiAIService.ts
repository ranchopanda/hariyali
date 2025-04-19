import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { AnalysisData } from '../types/analysisTypes';

// Export the types we need
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

export interface YieldPredictionResult {
  predictedYield: number;
  yieldUnit: string;
  confidence: number;
  potentialIncome: number;
  recommendations: string[];
  diseaseLossPercent?: number;
}

export interface GitErrorAnalysisResult {
  error: string;
  analysis: string;
  suggestedCommands: string[];
  confidence: number;
}

// Mock key for testing (should be replaced with proper key management in production)
const API_KEYS = [
  "YOUR_API_KEY_1", // Replace with actual API keys
  "YOUR_API_KEY_2",
  "YOUR_API_KEY_3",
];

const createGeminiModel = (apiKey: string) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ],
  });
};

export const analyzePlantDisease = async (base64Image: string) => {
  console.log("Starting plant disease analysis with improved model...");
  
  if (!base64Image) {
    throw new Error("No image provided");
  }
  
  console.log("Image validated successfully");
  
  // Initialize with a fallback result
  const fallbackResult = {
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

  try {
    let lastError = null;
    
    for (const apiKey of API_KEYS) {
      try {
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
        
        const parsedResult = JSON.parse(jsonStr);
        
        if (!parsedResult.disease_name) {
          parsedResult.disease_name = "Unidentified Plant Issue";
        }
        
        if (!Array.isArray(parsedResult.recommendations)) {
          parsedResult.recommendations = fallbackResult.recommendations;
        }
        
        if (!Array.isArray(parsedResult.treatment)) {
          parsedResult.treatment = fallbackResult.treatment;
        }
        
        if (!parsedResult.severity) {
          parsedResult.severity = "Unknown";
        }
        
        if (!parsedResult.crop_type) {
          parsedResult.crop_type = "Unknown Plant";
        }
        
        if (!parsedResult.confidence || typeof parsedResult.confidence !== 'number') {
          parsedResult.confidence = 50;
        }
        
        if (!parsedResult.yield_impact) {
          parsedResult.yield_impact = "Unknown";
        }
        
        if (!parsedResult.spread_risk) {
          parsedResult.spread_risk = "Medium";
        }
        
        if (!parsedResult.recovery_chance) {
          parsedResult.recovery_chance = "Medium";
        }
        
        return parsedResult;
      } catch (apiError) {
        console.error(`API key attempt failed:`, apiError);
        lastError = apiError;
      }
    }
    
    console.error("All API keys failed:", lastError);
    return fallbackResult;
  } catch (error) {
    console.error("Error in plant disease analysis:", error);
    return fallbackResult;
  }
};

export const analyzeSoil = async (base64Image: string): Promise<SoilAnalysisResult> => {
  if (!base64Image) {
    throw new Error("No image provided");
  }

  // Similar implementation to analyzePlantDisease but for soil analysis
  // This is a placeholder that needs to be implemented
  throw new Error("Soil analysis not implemented yet");
};

export const analyzeGitError = async (errorMessage: string): Promise<GitErrorAnalysisResult> => {
  // For now, implement a mock response
  console.log("Analyzing git error:", errorMessage);
  
  try {
    // In a real implementation, you would use the Gemini AI to analyze the error
    // Mock implementation for testing
    if (errorMessage.includes("remote rejected") || errorMessage.includes("behind")) {
      return {
        error: errorMessage,
        analysis: "Your local branch is behind the remote branch. You need to pull the latest changes before pushing.",
        suggestedCommands: [
          "git pull origin main",
          "git pull --rebase origin main",
          "git fetch && git merge origin/main"
        ],
        confidence: 90
      };
    } else if (errorMessage.includes("conflict")) {
      return {
        error: errorMessage,
        analysis: "There are merge conflicts that need to be resolved.",
        suggestedCommands: [
          "git status",
          "git pull",
          "git mergetool"
        ],
        confidence: 85
      };
    } else {
      return {
        error: errorMessage,
        analysis: "This appears to be a generic Git error. Try checking your connection and repository status.",
        suggestedCommands: [
          "git status",
          "git remote -v",
          "git fetch"
        ],
        confidence: 60
      };
    }
  } catch (error) {
    console.error("Error analyzing git error:", error);
    return {
      error: errorMessage,
      analysis: "Unable to analyze the error. Please check your git status manually.",
      suggestedCommands: ["git status", "git remote -v"],
      confidence: 30
    };
  }
};

export const predictYield = async (
  crop: string,
  area: number,
  soilType: string,
  rainfall: number,
  temperature: number,
  disease: string | null
): Promise<YieldPredictionResult> => {
  // Implementation for yield prediction
  // This is a placeholder that needs to be implemented
  throw new Error("Yield prediction not implemented yet");
};
