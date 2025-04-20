
import { useState } from "react";
import { AnalysisData } from "@/utils/types/analysisTypes";
import { DetectionResult } from "@/types/DetectionResult";
import Header from "@/components/Header";
import CustomFooter from "@/components/CustomFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { analyzePlantDisease, imageToBase64, storeAnalysisData } from "@/utils/geminiAI";
import { useNavigate } from "react-router-dom";
import { saveFarmSnapshot } from "@/utils/farmDataSnapshots";
import { ImageUploader } from "@/components/disease-detection/ImageUploader";
import { AnalysisResults } from "@/components/disease-detection/AnalysisResults";

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

      const analysisId = await storeAnalysisData(analysisData, "plant_disease");

      await saveFarmSnapshot({
        user_id: "anonymous",
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
                  <ImageUploader
                    onImageChange={handleImageChange}
                    selectedImage={selectedImage}
                  />
                </div>

                <div>
                  {detectionResult ? (
                    <AnalysisResults result={detectionResult} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-md border-gray-300 dark:border-gray-600">
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
