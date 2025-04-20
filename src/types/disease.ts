export interface DetectionResult {
  crop_name: string;
  disease_name: string;
  pathogen: string;
  severity_level: 'Low' | 'Moderate' | 'High';
  confidence: number;
  symptoms: string[];
  action_plan: string[];
  organic_treatment: string[];
  chemical_treatment: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  pro_tips: string[];
  rescan_reminder?: number;
}

export interface DetectionHistory {
  id: string;
  timestamp: string;
  result: DetectionResult;
  images: string[];
} 