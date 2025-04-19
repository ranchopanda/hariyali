
export interface AnalysisData {
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
  [key: string]: any;
}

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
