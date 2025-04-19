
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Define types for our analysis data
interface AnalysisData {
  id: string;
  timestamp: string;
  type: string;
  disease_name?: string;
  confidence?: number;
  description?: string;
  recommendations?: string[];
  treatment?: string[];
  severity?: string;
  crop_type?: string;
  yield_impact?: string;
  spread_risk?: string;
  recovery_chance?: string;
  bounding_boxes?: {x: number, y: number, width: number, height: number}[];
  [key: string]: any; // Allow other properties
}

// Mock key for testing (should be replaced with proper key management in production)
const API_KEYS = [
  "YOUR_API_KEY_1", // Replace with actual API keys
  "YOUR_API_KEY_2",
  "YOUR_API_KEY_3",
];

// Convert image file to base64
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Content = base64String.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = error => {
      reject(error);
    };
  });
};

// Function to analyze plant disease using Gemini AI
export const analyzePlantDisease = async (base64Image: string) => {
  console.log("Starting plant disease analysis with improved model...");
  
  // Validate the image
  if (!base64Image) {
    throw new Error("No image provided");
  }
  
  console.log("Image validated successfully");
  
  // Initialize with a fallback result in case API call fails
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

  // Try to use real Gemini API analysis
  try {
    console.log("Attempting real Gemini API analysis");
    
    // Try each API key until one works
    let result = null;
    let lastError = null;
    
    for (let i = 0; i < API_KEYS.length; i++) {
      const apiKey = API_KEYS[i];
      console.log(`Trying API key ${i + 1} of ${API_KEYS.length}`);
      
      try {
        // Initialize the Gemini API with the current key
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
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

        // Prompt engineering for comprehensive plant disease analysis
        const prompt = `
You are PlantDoctorAI, an expert agricultural system specializing in plant disease detection.

Analyze this plant image and provide a detailed disease assessment in JSON format with these fields:
- disease_name: The full scientific name of the disease and pathogen (e.g., "Late Blight caused by Phytophthora infestans")
- crop_type: The plant species affected
- confidence: A number from 0-100 representing your confidence level
- description: A detailed description of the visual symptoms visible in the image
- severity: "Mild", "Moderate", or "Severe"
- treatment: An array of 3-5 treatment options (both chemical and organic)
- recommendations: An array of 5-6 preventive measures and best practices
- yield_impact: Estimated impact on crop yield if untreated
- spread_risk: "Low", "Medium", or "High" risk of spreading to other plants
- recovery_chance: "Low", "Medium", or "High" chance of plant recovery with proper treatment

Format your response as a valid JSON object with these exact fields. Do not include any explanations or text outside the JSON structure.
        `;

        // Generate content with the image
        const result = await model.generateContent([
          prompt,
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
        ]);
        
        const response = await result.response;
        const text = response.text();
        
        // Find the JSON section if it exists - looking for content between ```json and ``` or just a JSON object
        let jsonStr = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonStr = jsonMatch[1].trim();
        }
        
        try {
          // Parse the JSON response
          const parsedResult = JSON.parse(jsonStr);
          console.log("Successfully parsed Gemini API response");
          
          // Validate the disease result
          if (!parsedResult.disease_name) {
            parsedResult.disease_name = "Unidentified Plant Issue";
          }
          
          // Validate and ensure all expected properties exist
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
          
          console.log("Successful Gemini API analysis:", parsedResult);
          return parsedResult;
        } catch (parseError) {
          console.error("Error parsing Gemini response:", parseError);
          lastError = parseError;
          // Continue to next API key
        }
      } catch (apiError) {
        console.error(`Error with API key ${i + 1}:`, apiError);
        lastError = apiError;
        // Continue to next API key
      }
    }
    
    // If we get here, all API keys failed
    console.error("All API keys failed:", lastError);
    return fallbackResult;
  } catch (error) {
    console.error("Error in plant disease analysis:", error);
    return fallbackResult;
  }
};

// Store analysis data locally (in localStorage)
export const storeAnalysisData = (data: any, type: string) => {
  try {
    // Create a unique ID for the analysis
    const id = `${type}_${Date.now()}`;
    
    // Get existing history or initialize an empty array
    const historyJSON = localStorage.getItem('analysis_history') || '[]';
    const history = JSON.parse(historyJSON) as AnalysisData[];
    
    // Add the new analysis with metadata
    const analysisData: AnalysisData = {
      id,
      timestamp: new Date().toISOString(),
      type,
      ...data
    };
    
    // Add to history (at the beginning)
    history.unshift(analysisData);
    
    // Limit history to 20 items to prevent localStorage from getting too large
    const limitedHistory = history.slice(0, 20);
    
    // Save back to localStorage
    localStorage.setItem('analysis_history', JSON.stringify(limitedHistory));
    
    console.log(`Stored ${type} data with ID: ${id}`);
    return id;
  } catch (error) {
    console.error("Error storing analysis data:", error);
    return null;
  }
};

// Get analysis history from localStorage
export const getAnalysisHistory = (type?: string) => {
  try {
    const historyJSON = localStorage.getItem('analysis_history') || '[]';
    const history = JSON.parse(historyJSON) as AnalysisData[];
    
    if (type) {
      return history.filter(item => item.type === type);
    }
    
    return history;
  } catch (error) {
    console.error("Error retrieving analysis history:", error);
    return [];
  }
};
