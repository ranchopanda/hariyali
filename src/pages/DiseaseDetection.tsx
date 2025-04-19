import { useState } from "react";
import { AnalysisData } from "@/utils/types/analysisTypes";
import { DetectionResult } from "@/types/DetectionResult";
import Header from "@/components/Header";
import CustomFooter from "@/components/CustomFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { analyzePlantDisease, imageToBase64, storeAnalysisData } from "@/utils/geminiAI";
import { Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { saveFarmSnapshot } from "@/utils/farmDataSnapshots";

const DiseaseDetection = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      try {
        const base64 = await imageToBase64(file);
        setBase64Image(base64);
      } catch (error) {
        console.error("Error converting image to base64:", error);
        toast({
          title: "Error",
          description: "Failed to convert image to base64.",
          variant: "destructive",
        });
      }
    }
  };

  const handleAnalysis = async () => {
    if (!base64Image) {
      toast({
        title: "No Image Selected",
        description: "Please select an image to analyze.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const analysisData: AnalysisData = await analyzePlantDisease(base64Image);
      
      // Map AnalysisData to DetectionResult with default values
      const mappedResult: DetectionResult = {
        disease_name: analysisData.disease_name || "Unknown",
        confidence: analysisData.confidence || 0,
        description: analysisData.description || "No description available",
        recommendations: analysisData.recommendations || [],
        treatment: analysisData.treatment || [],
        severity: analysisData.severity || "Unknown",
        crop_type: analysisData.crop_type || "Unknown",
        yield_impact: analysisData.yield_impact || "Unknown",
        spread_risk: analysisData.spread_risk || "Unknown",
        recovery_chance: analysisData.recovery_chance || "Unknown",
        bounding_boxes: analysisData.bounding_boxes
      };

      setDetectionResult(mappedResult);

      // Store analysis data
      const analysisId = await storeAnalysisData(analysisData, "plant_disease");

      // Also save the data in our Supabase database
      await saveFarmSnapshot({
        user_id: "anonymous", // In a real app, this would be the user's ID
        type: "plant_disease",
        timestamp: new Date().toISOString(),
        data: {
          ...analysisData,
          analysisId
        }
      });

      toast({
        title: "Analysis Complete",
        description: `Disease detected: ${mappedResult.disease_name}`,
      });
    } catch (error) {
      console.error("Disease detection error:", error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="flex-grow container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 pl-0 hover:bg-transparent hover:text-kisan-green dark:hover:text-kisan-gold" 
          onClick={() => navigate(-1)}
        >
          Back
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-kisan-green dark:text-kisan-gold mb-4">
              Plant Disease Detection
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Upload an image of the affected plant to diagnose potential diseases.
            </p>
          </div>

          <Card className="mb-8 border-none shadow-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upload Plant Image
                  </Label>
                  <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-gray-300 dark:border-gray-600">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L40 8m0 0v4"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600 dark:text-gray-300">
                        <Label
                          htmlFor="image-upload"
                          className="relative cursor-pointer rounded-md font-medium text-kisan-green hover:text-kisan-green-dark dark:text-kisan-gold dark:hover:text-kisan-gold-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-kisan-green"
                        >
                          <span>Upload a file</span>
                          <Input id="image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                        </Label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                  {selectedImage && (
                    <div className="mt-4">
                      <img src={selectedImage} alt="Uploaded Plant" className="w-full rounded-md" />
                    </div>
                  )}
                </div>

                <div>
                  {detectionResult ? (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-kisan-green dark:text-kisan-gold">
                        Detection Result
                      </h2>
                      <p>
                        <span className="font-bold">Disease:</span> {detectionResult.disease_name}
                      </p>
                      <p>
                        <span className="font-bold">Confidence:</span> {detectionResult.confidence}%
                      </p>
                      <p>
                        <span className="font-bold">Description:</span> {detectionResult.description}
                      </p>
                      <div>
                        <span className="font-bold">Recommendations:</span>
                        <ul>
                          {detectionResult.recommendations.map((recommendation, index) => (
                            <li key={index}>{recommendation}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-bold">Treatment:</span>
                        <ul>
                          {detectionResult.treatment.map((treatment, index) => (
                            <li key={index}>{treatment}</li>
                          ))}
                        </ul>
                      </div>
                      <p>
                        <span className="font-bold">Severity:</span> {detectionResult.severity}
                      </p>
                      <p>
                        <span className="font-bold">Crop Type:</span> {detectionResult.crop_type}
                      </p>
                      <p>
                        <span className="font-bold">Yield Impact:</span> {detectionResult.yield_impact}
                      </p>
                      <p>
                        <span className="font-bold">Spread Risk:</span> {detectionResult.spread_risk}
                      </p>
                      <p>
                        <span className="font-bold">Recovery Chance:</span> {detectionResult.recovery_chance}
                      </p>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-md border-gray-300 dark:border-gray-600">
                      <Camera className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No image analyzed yet. Upload an image to detect plant diseases.</p>
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="w-full mt-6 bg-kisan-green hover:bg-kisan-green-dark text-white"
                onClick={handleAnalysis}
                disabled={loading || !base64Image}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Analyze Image"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <CustomFooter />
    </div>
  );
};

export default DiseaseDetection;
