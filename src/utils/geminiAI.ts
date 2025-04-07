import { GoogleGenerativeAI } from "@google/generative-ai";

// API Keys with fallback
const API_KEYS = [
  "AIzaSyAdD2GXQZaVJXQQJliPaupGfEFfuFzBdwc",
  "AIzaSyAmc78NU-vGwvjajje2YBD3LI2uYqub3tE"
];

// Initialize Gemini client with retry logic
let currentKeyIndex = 0;
let genAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
let model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

async function initializeModel(keyIndex = 0) {
  currentKeyIndex = keyIndex;
  genAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
}

// Validate base64 image
function validateBase64Image(base64: string) {
  if (!base64 || base64.length < 100) {
    throw new Error("Invalid image data: too short");
  }
  if (!base64.match(/^[A-Za-z0-9+/]+={0,2}$/)) {
    throw new Error("Invalid base64 image format");
  }
}

// Gemini API integration for image analysis
export interface AnalysisResult {
  result: string;
  confidence: number;
  description: string;
  recommendations: string[];
}

// Function to convert image to base64
export const imageToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert image to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Analyze plant disease using Gemini
export const analyzePlantDisease = async (imageBase64: string): Promise<{
  disease_name: string;
  confidence: number;
  description: string;
  recommendations: string[];
  treatment: string[];
}> => {
  try {
    console.log("Starting plant disease analysis...");
    
    // Validate input image
    validateBase64Image(imageBase64);
    console.log("Image validated successfully");

    // Prepare prompt
    console.log("Creating analysis prompt...");
    const prompt = `Analyze this plant image for diseases. Provide:
    - Disease name (or "Healthy" if no disease)
    - Confidence percentage (0-100)
    - Detailed description of symptoms
    - 3-5 recommendations for treatment
    - 3-5 prevention methods
    
    Format response as JSON with these keys:
    disease_name, confidence, description, treatment, prevention`;

    // Convert base64 to Gemini-compatible format
    const imageParts = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      }
    ];

    // Call Gemini API
    console.log("Calling Gemini API...");
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    console.log("API call successful. Response:", response);
    
    const text = response.text();
    console.log("Raw API response:", text);
    
    // Extract and validate JSON response
    let analysis;
    let parseAttempts = 0;
    const maxAttempts = 3; // Max retry attempts (key rotation + parsing)
    
    while (parseAttempts < maxAttempts) {
      try {
        // Try to extract JSON from response text
        const jsonMatch = text.match(/\{[^{}]*\}/gs) || [];
        if (jsonMatch.length === 0) throw new Error('No JSON found in response');
        
        // Find the longest valid JSON portion
        let jsonStr = '';
        for (const match of jsonMatch) {
          try {
            JSON.parse(match);
            if (match.length > jsonStr.length) jsonStr = match;
          } catch {
            // Ignore invalid JSON segments during extraction
          }
        }
        
        if (!jsonStr) throw new Error('No valid JSON segments found');
        
        analysis = JSON.parse(jsonStr);
        break;
      } catch (error) {
        parseAttempts++;
        console.warn(`Parse attempt ${parseAttempts} failed:`, error.message);
        
        if (parseAttempts >= maxAttempts) {
          // Try next API key if available
          if (currentKeyIndex < API_KEYS.length - 1) {
            console.log(`Switching to API key ${currentKeyIndex + 1}`);
            await initializeModel(currentKeyIndex + 1);
            parseAttempts = 0; // Reset attempts for new key
            continue;
          }
          
          // All attempts exhausted
          console.error("Final parse failure:", {
            error: error.message,
            response: text,
            attempts: parseAttempts,
            timestamp: new Date().toISOString()
          });
          throw new Error("Failed to parse valid JSON after all attempts");
        }
      }
    }
    
    return {
      disease_name: analysis.disease_name,
      confidence: analysis.confidence,
      description: analysis.description,
      recommendations: analysis.prevention,
      treatment: analysis.treatment
    };
  } catch (error) {
    console.error("Analysis failed:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw new Error(`Analysis failed: ${error.message}`);
  }
};

// Analyze soil using Gemini
export const analyzeSoil = async (imageBase64: string): Promise<{
  soil_type: string;
  confidence: number;
  ph_level: string;
  nutrients: { name: string; level: "Low" | "Medium" | "High"; recommendation: string }[];
  recommendations: string[];
}> => {
  try {
    console.log("Analyzing soil with Gemini...");
    
    // Prepare prompt
    const prompt = `Analyze this soil image. Provide:
    - Soil type
    - Confidence percentage (0-100)
    - Estimated pH level
    - Nutrient levels (Nitrogen, Phosphorus, Potassium)
    - 3-5 recommendations for soil improvement
    
    Format response as JSON with these keys:
    soil_type, confidence, ph_level, nutrients, recommendations`;

    // Convert base64 to Gemini-compatible format
    const imageParts = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      }
    ];

    // Call Gemini API
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // Parse response with better error handling
    let analysis;
    try {
      const jsonMatch = text.match(/\{[^{}]*\}/gs) || [];
      if (jsonMatch.length === 0) {
        throw new Error('No JSON found in response');
      }
      
      // Find the longest valid JSON portion
      let jsonStr = '';
      for (const match of jsonMatch) {
        try {
          JSON.parse(match);
          if (match.length > jsonStr.length) jsonStr = match;
        } catch {
          continue;
        }
      }
      
      if (!jsonStr) {
        throw new Error('No valid JSON segments found');
      }
      
      analysis = JSON.parse(jsonStr);
      
      // Validate required fields
      if (!analysis.soil_type || !analysis.ph_level) {
        throw new Error('Incomplete analysis data received');
      }
    } catch (error) {
      console.error('Failed to parse analysis:', error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Invalid response format'}`);
    }
    
    return {
      soil_type: analysis.soil_type,
      confidence: analysis.confidence,
      ph_level: analysis.ph_level,
      nutrients: analysis.nutrients,
      recommendations: analysis.recommendations
    };
  } catch (error) {
    console.error("Error in analyzeSoil:", error);
    throw new Error("Failed to analyze soil image");
  }
};

// Predict yield based on various factors
export const predictYield = async (
  crop: string,
  area: number,
  soilType: string,
  rainfall: number,
  temperature: number,
  disease: string | null = null
): Promise<{
  predictedYield: number;
  yieldUnit: string;
  confidence: number;
  potentialIncome: number;
  diseaseLossPercent: number | null;
  recommendations: string[];
}> => {
  try {
    console.log("Predicting yield...");
    
    // Mock implementation
    // Calculate base yield based on crop and area
    let baseYield = area * (crop === "Rice" ? 4.5 : 
                           crop === "Wheat" ? 3.8 : 
                           crop === "Cotton" ? 2.1 : 
                           crop === "Sugarcane" ? 70 : 3.0);
    
    // Apply soil factor
    const soilFactor = soilType === "Black Cotton Soil" ? 1.1 : 
                       soilType === "Red Soil" ? 0.9 : 
                       soilType === "Alluvial Soil" ? 1.2 : 1.0;
    
    baseYield *= soilFactor;
    
    // Apply weather factors
    const rainfallFactor = rainfall < 500 ? 0.8 : 
                          rainfall > 1200 ? 0.9 : 
                          1.0 + ((rainfall - 500) / 1400);
    
    const tempFactor = temperature < 20 ? 0.85 : 
                       temperature > 35 ? 0.8 : 
                       1.0 + ((30 - Math.abs(temperature - 27)) / 100);
    
    baseYield *= rainfallFactor * tempFactor;
    
    // Calculate disease impact if any
    let diseaseLossPercent = null;
    if (disease) {
      diseaseLossPercent = disease === "Leaf Blight" ? 15 : 
                          disease === "Blast" ? 25 : 
                          disease === "Rust" ? 20 : 10;
      
      baseYield *= (1 - (diseaseLossPercent / 100));
    }
    
    // Random factor for variability
    baseYield *= (0.95 + Math.random() * 0.1);
    
    // Round to 2 decimal places
    baseYield = Math.round(baseYield * 100) / 100;
    
    // Calculate potential income (simplified)
    const pricePerUnit = crop === "Rice" ? 20 : 
                         crop === "Wheat" ? 18 : 
                         crop === "Cotton" ? 60 : 
                         crop === "Sugarcane" ? 3 : 25;
    
    const potentialIncome = baseYield * pricePerUnit * area;
    
    // Generate recommendations
    const recommendations = [];
    if (rainfallFactor < 0.9) {
      recommendations.push("Consider irrigation systems to compensate for low rainfall");
    }
    if (tempFactor < 0.9) {
      recommendations.push("Use temperature-resistant crop varieties suited for your climate");
    }
    if (disease) {
      recommendations.push(`Implement preventive measures against ${disease} to reduce yield loss`);
    }
    if (recommendations.length < 3) {
      recommendations.push("Practice crop rotation to improve soil health and yield");
    }
    
    return {
      predictedYield: baseYield,
      yieldUnit: crop === "Sugarcane" ? "tonnes/hectare" : "tonnes/hectare",
      confidence: 85,
      potentialIncome: Math.round(potentialIncome),
      diseaseLossPercent,
      recommendations
    };
  } catch (error) {
    console.error("Error in predictYield:", error);
    throw new Error("Failed to predict yield");
  }
};


interface AnalysisData {
  disease_name?: string;
  soil_type?: string;
  confidence: number;
  description?: string;
  recommendations: string[];
  treatment?: string[];
  ph_level?: string;
  nutrients?: Array<{name: string; level: string; recommendation: string}>;
  timestamp: string;
  type: string;
}

// Data storage functions
export const storeAnalysisData = async (data: Omit<AnalysisData, 'timestamp' | 'type'>, type: string): Promise<string> => {
  try {
    // This function would normally save data to a database
    // For now we'll simulate storage by saving to localStorage with a unique ID
    const id = `${type}_${Date.now()}`;
    localStorage.setItem(id, JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
      type
    }));
    console.log(`Stored ${type} data with ID: ${id}`);
    return id;
  } catch (error) {
    console.error("Error storing data:", error);
    throw new Error("Failed to store analysis data");
  }
};

// Get stored analysis history
// Analyze Git errors using Gemini
export const analyzeGitError = async (error: string): Promise<{
  analysis: string;
  suggestedCommands: string[];
  confidence: number;
}> => {
  try {
    const prompt = `As a Git expert, analyze this error for an Indian agricultural tech project codebase. Consider:
    - Standard git workflows for feature branches
    - Team collaboration patterns
    - Safe resolution approaches
    
    Provide:
    1. Error explanation
    2. 95% confidence - safest solution
    3. 85% confidence - alternative
    4. Risk assessment
    
    Error Context:
    Codebase: React/TypeScript
    ${error}
    
    Format response as JSON with these keys:
    analysis, suggestedCommands, confidence`;

    const result = await model.generateContent([prompt]);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[^{}]*\}/gs) || [];
    const jsonStr = jsonMatch.length > 0 ? jsonMatch[0] : null;
    
    if (!jsonStr) {
      throw new Error('No valid JSON found in Gemini response');
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Git error analysis failed:", error);
    return {
      analysis: "Failed to analyze Git error",
      suggestedCommands: ["git status", "git pull", "git push --force"],
      confidence: 0
    };
  }
};

interface StoredAnalysisData extends AnalysisData {
  id: string;
}

export const getAnalysisHistory = (type: string): StoredAnalysisData[] => {
  try {
    const history: StoredAnalysisData[] = [];
    
    // Scan localStorage for items matching the type
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${type}_`)) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || "");
          if (item && item.type === type) {
            history.push({
              id: key,
              ...item
            });
          }
        } catch (e) {
          console.error("Error parsing item from localStorage:", e);
        }
      }
    }
    
    // Sort by timestamp descending (newest first)
    return history.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error("Error retrieving analysis history:", error);
    return [];
  }
};
