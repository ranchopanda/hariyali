
export interface DetectionResult {
  disease_name: string;
  confidence: number;
  description: string;
  recommendations: string[];
  treatment: string[];
  severity: string;
  crop_type: string;
  yield_impact: string;
  spread_risk: string;
  recovery_chance: string;
  bounding_boxes?: {x: number, y: number, width: number, height: number}[];
}
