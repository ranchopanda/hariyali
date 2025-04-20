
import { DetectionResult } from "@/types/DetectionResult";

interface AnalysisResultsProps {
  result: DetectionResult;
}

export const AnalysisResults = ({ result }: AnalysisResultsProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-kisan-green dark:text-kisan-gold">
        Detection Result
      </h2>
      <p>
        <span className="font-bold">Disease:</span> {result.disease_name}
      </p>
      <p>
        <span className="font-bold">Confidence:</span> {result.confidence}%
      </p>
      <p>
        <span className="font-bold">Description:</span> {result.description}
      </p>
      <div>
        <span className="font-bold">Recommendations:</span>
        <ul>
          {result.recommendations.map((recommendation, index) => (
            <li key={index}>{recommendation}</li>
          ))}
        </ul>
      </div>
      <div>
        <span className="font-bold">Treatment:</span>
        <ul>
          {result.treatment.map((treatment, index) => (
            <li key={index}>{treatment}</li>
          ))}
        </ul>
      </div>
      <p>
        <span className="font-bold">Severity:</span> {result.severity}
      </p>
      <p>
        <span className="font-bold">Crop Type:</span> {result.crop_type}
      </p>
      <p>
        <span className="font-bold">Yield Impact:</span> {result.yield_impact}
      </p>
      <p>
        <span className="font-bold">Spread Risk:</span> {result.spread_risk}
      </p>
      <p>
        <span className="font-bold">Recovery Chance:</span> {result.recovery_chance}
      </p>
    </div>
  );
};
