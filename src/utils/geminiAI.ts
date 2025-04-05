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
    console.log("Analyzing plant disease with Gemini...");
    
    // Mock response for now since we don't have actual Gemini API access
    // In a real implementation, this would call the Gemini API
    const mockResponse = await mockGeminiAnalysis(imageBase64, "plant_disease");
    
    return {
      disease_name: mockResponse.result,
      confidence: mockResponse.confidence,
      description: mockResponse.description,
      recommendations: mockResponse.recommendations.slice(0, 3),
      treatment: mockResponse.recommendations.slice(3),
    };
  } catch (error) {
    console.error("Error in analyzePlantDisease:", error);
    throw new Error("Failed to analyze plant disease image");
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
    
    // Mock response for now
    const mockResponse = await mockGeminiAnalysis(imageBase64, "soil_analysis");
    
    return {
      soil_type: mockResponse.result,
      confidence: mockResponse.confidence,
      ph_level: mockResponse.description.includes("pH") ? 
        mockResponse.description.split("pH")[1].trim().split(" ")[0] : "6.5",
      nutrients: [
        { 
          name: "Nitrogen", 
          level: "Medium", 
          recommendation: "Add nitrogen-rich fertilizers like urea or compost" 
        },
        { 
          name: "Phosphorus", 
          level: "Low", 
          recommendation: "Add bone meal or rock phosphate" 
        },
        { 
          name: "Potassium", 
          level: "High", 
          recommendation: "No additional potassium needed" 
        }
      ],
      recommendations: mockResponse.recommendations,
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

// Mock function to simulate Gemini API response
const mockGeminiAnalysis = async (
  imageBase64: string,
  analysisType: "plant_disease" | "soil_analysis"
): Promise<AnalysisResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Use part of the image data as a seed for randomization
  // We'll use a combination of timestamp and image data to ensure variability between uploads
  const timestamp = Date.now();
  const hashBase = imageBase64.substring(0, 100);
  const hashSum = Array.from(hashBase).reduce((sum, char, index) => 
    sum + char.charCodeAt(0) * (index + 1), 0);
  
  // Combine timestamp and image data for a more unique seed
  const seed = (hashSum + timestamp) % 1000;
  
  if (analysisType === "plant_disease") {
    const diseases = [
      {
        name: "Rice Blast",
        description: "A fungal disease affecting rice plants, characterized by lesions on leaves and stems. It is one of the most destructive rice diseases globally.",
        recommendations: [
          "Apply fungicides containing tricyclazole or azoxystrobin",
          "Use resistant rice varieties",
          "Maintain proper field drainage to reduce humidity",
          "Apply silica to strengthen plant cell walls",
          "Treat seeds with fungicide before planting",
          "Maintain proper spacing between plants for better air circulation"
        ]
      },
      {
        name: "Bacterial Leaf Blight",
        description: "A bacterial disease affecting rice plants, causing water-soaked lesions that turn yellow to white as they mature. It can lead to significant yield loss.",
        recommendations: [
          "Use copper-based bactericides for management",
          "Plant resistant varieties",
          "Practice crop rotation with non-host crops",
          "Apply streptomycin sulfate in early stages",
          "Avoid over-fertilization with nitrogen",
          "Remove and destroy infected plant debris"
        ]
      },
      {
        name: "Powdery Mildew",
        description: "A fungal disease affecting various crops, appearing as white powdery spots on leaves and stems. It can reduce photosynthesis and plant vigor.",
        recommendations: [
          "Apply sulfur-based fungicides at early signs",
          "Use neem oil as an organic alternative",
          "Ensure adequate spacing between plants for airflow",
          "Potassium bicarbonate sprays can be effective",
          "Remove severely infected leaves",
          "Avoid overhead watering to reduce humidity"
        ]
      },
      {
        name: "Brown Spot",
        description: "A fungal disease that affects rice leaves and grains, characterized by brown lesions with yellow halos. It can reduce grain quality and yield.",
        recommendations: [
          "Apply fungicides containing propiconazole or tebuconazole",
          "Use balanced fertilization, especially potassium",
          "Avoid water stress conditions",
          "Remove infected plant debris from the field",
          "Use certified disease-free seeds",
          "Implement proper water management practices"
        ]
      },
      {
        name: "Leaf Rust",
        description: "A fungal disease that affects wheat and other cereal crops, appearing as orange-brown pustules on leaves. It can significantly reduce crop yield.",
        recommendations: [
          "Apply triazole or strobilurin fungicides",
          "Plant rust-resistant varieties when available",
          "Early planting to avoid peak rust season",
          "Implement crop rotation with non-host plants",
          "Monitor fields regularly for early detection",
          "Remove alternate hosts like barberry plants from field vicinity"
        ]
      }
    ];

    // Use the seed to select a disease - ensuring different images get different diseases
    const diseaseIndex = seed % diseases.length;
    const selectedDisease = diseases[diseaseIndex];
    
    // Generate a confidence score that varies
    const confidence = 65 + (seed % 30);
    
    return {
      result: selectedDisease.name,
      confidence: confidence,
      description: selectedDisease.description,
      recommendations: selectedDisease.recommendations
    };
  } else {
    const soilTypes = [
      {
        name: "Black Cotton Soil",
        description: "pH 6.5-8.5. Rich in clay minerals, has high water retention capacity but poor drainage. Common in central and western India.",
        recommendations: [
          "Add organic matter to improve drainage",
          "Gypsum application can improve soil structure",
          "Avoid deep cultivation when soil is dry",
          "Consider raised beds for better drainage in rainy season",
          "Good for growing cotton, wheat, and sugarcane"
        ]
      },
      {
        name: "Red Soil",
        description: "pH 5.5-6.8. Contains iron oxide, generally low in nitrogen and phosphorus. Common in eastern and southern regions of India.",
        recommendations: [
          "Add nitrogen-rich fertilizers",
          "Incorporate phosphorus supplements like rock phosphate",
          "Add organic compost to improve fertility",
          "Consider leguminous cover crops to fix nitrogen",
          "Suitable for growing groundnuts, millets, and pulses"
        ]
      },
      {
        name: "Alluvial Soil",
        description: "pH 6.5-7.5. Formed by river deposits, rich in potash but may lack nitrogen and phosphorus. Found in the Indo-Gangetic plains.",
        recommendations: [
          "Balance with NPK fertilizers as needed",
          "Ideal for most crops including rice, wheat, and sugarcane",
          "Monitor zinc levels as deficiency is common",
          "Maintain proper irrigation as water retention varies",
          "Excellent base soil requiring minimal amendments for most crops"
        ]
      }
    ];

    const soilIndex = seed % soilTypes.length;
    const selectedSoil = soilTypes[soilIndex];
    
    return {
      result: selectedSoil.name,
      confidence: 75 + (seed % 20),
      description: selectedSoil.description,
      recommendations: selectedSoil.recommendations
    };
  }
};

// Data storage functions
export const storeAnalysisData = async (data: any, type: string): Promise<string> => {
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
export const getAnalysisHistory = (type: string): any[] => {
  try {
    const history: any[] = [];
    
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
