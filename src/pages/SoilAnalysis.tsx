import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import CustomFooter from "@/components/CustomFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, Upload, Loader2, Info, 
  Camera, X, ArrowRight, AlertTriangle,
  Sprout, Leaf
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CameraCapture from "@/components/CameraCapture";
import { 
  analyzeSoil, 
  imageToBase64, 
  storeAnalysisData, 
  getAnalysisHistory,
  SoilAnalysisResult,
  AnalysisHistoryItem
} from "@/utils/geminiAI";

const SoilAnalysis = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SoilAnalysisResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processNewImage(file);
    }
  };

  const handleCameraCapture = (file: File) => {
    processNewImage(file);
    setShowCamera(false);
  };

  const processNewImage = (file: File) => {
    setImage(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setResult(null);
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeImage = async () => {
    if (!image) {
      toast({
        title: "No Image Selected",
        description: "Please upload an image of the soil first.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Convert image to base64
      const base64Image = await imageToBase64(image);
      
      // Analyze with Gemini
      const analysisResult = await analyzeSoil(base64Image);
      
      setResult(analysisResult);
      
      // Store the result
      await storeAnalysisData(analysisResult, "soil_analysis");
      
    } catch (error: unknown) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "There was an error analyzing the soil image. Please try again with a clearer image.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadToServer = () => {
    if (!image) {
      toast({
        title: "No Image Selected",
        description: "Please upload an image first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!result) {
      toast({
        title: "Analysis Required",
        description: "Please analyze the image before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    setTimeout(() => {
      setIsUploading(false);
      toast({
        title: "Data Submitted",
        description: "Your soil data has been submitted for expert review. You will receive detailed advice within 24 hours.",
      });
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 pl-0" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-kisan-green dark:text-kisan-gold">
            AI Soil Analysis
          </h1>
          
          <p className="mb-8 text-gray-600 dark:text-gray-300">
            Upload a clear photo of your soil to identify soil type and get fertilizer recommendations.
          </p>
          
          <Tabs defaultValue="analysis">
            <TabsList className="mb-8">
              <TabsTrigger value="analysis">Soil Analysis</TabsTrigger>
              <TabsTrigger value="history">Analysis History</TabsTrigger>
              <TabsTrigger value="guide">How to Use</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {showCamera ? (
                    <CameraCapture 
                      onCapture={handleCameraCapture}
                      onClose={() => setShowCamera(false)}
                    />
                  ) : (
                    <Card>
                      <CardContent className="p-6">
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-2">Upload Soil Image</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Take a clear photo of your soil sample or field soil
                          </p>
                        </div>
                        
                        {!preview ? (
                          <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-10 text-center">
                              <Sprout className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                              <p className="text-gray-500 dark:text-gray-400 mb-4">
                                Drag and drop a soil image here or click to browse
                              </p>
                              <div className="flex justify-center gap-3">
                                <Button
                                  className="bg-kisan-green hover:bg-kisan-green-dark text-white"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Browse Files
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setShowCamera(true)}
                                >
                                  <Camera className="mr-2 h-4 w-4" />
                                  Take Photo
                                </Button>
                              </div>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <img 
                              src={preview} 
                              alt="Soil preview" 
                              className="w-full rounded-lg object-cover max-h-[300px]" 
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full"
                              onClick={clearImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            
                            <div className="mt-4 flex justify-center">
                              <Button
                                className="bg-kisan-green hover:bg-kisan-green-dark text-white"
                                onClick={analyzeImage}
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                  </>
                                ) : (
                                  <>
                                    Analyze Soil
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-kisan-green dark:text-kisan-gold mr-2 flex-shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">For best results:</h3>
                          <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 list-disc pl-5">
                            <li>Collect soil from 3-6 inches below the surface</li>
                            <li>Take photos in good natural lighting</li>
                            <li>Include a clear view of soil texture and color</li>
                            <li>If possible, include a ruler or coin for scale</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  {result ? (
                    <Card>
                      <CardContent className="p-6">
                        <div className="mb-6">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold">Soil Analysis Results</h3>
                            <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                              Confidence: {result.confidence}%
                            </div>
                          </div>
                          
                          <div className="mt-4 p-3 rounded-lg bg-kisan-green/10 dark:bg-kisan-green/20">
                            <h4 className="font-semibold text-kisan-green dark:text-kisan-gold">
                              {result.soil_type}
                            </h4>
                            <p className="text-sm mt-1">pH Level: {result.ph_level}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Nutrient Analysis
                            </h4>
                            <div className="space-y-2">
                              {result.nutrients.map((nutrient, index) => (
                                <div key={index} className="border rounded-md p-3">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium">{nutrient.name}</span>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                      nutrient.level === 'High' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                        : nutrient.level === 'Medium'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                      {nutrient.level}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {nutrient.recommendation}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Recommendations
                            </h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
                              {result.recommendations.map((recommendation, index) => (
                                <li key={index}>{recommendation}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-start mb-4">
                            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              This is an AI-generated analysis. For precise results, consider laboratory soil testing.
                            </p>
                          </div>
                          
                          <Button 
                            className="w-full bg-kisan-green hover:bg-kisan-green-dark text-white"
                            onClick={uploadToServer}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                Submit for Expert Advice
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : preview ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <Info className="h-10 w-10 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Analysis Pending</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Click "Analyze Soil" to detect soil type and get fertilizer recommendations.
                      </p>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <Leaf className="h-10 w-10 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Soil Analysis Results</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Upload a soil image to see analysis results and fertilizer recommendations.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardContent className="p-6">
                  {getAnalysisHistory("soil_analysis").length > 0 ? (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Previous Soil Analyses</h3>
                      
                      <div className="space-y-4">
                        {getAnalysisHistory("soil_analysis").map((item: AnalysisHistoryItem) => {
                          const soilData = item.data as SoilAnalysisResult;
                          return (
                            <div 
                              key={item.id}
                              className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{soilData.soil_type}</h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Confidence: {soilData.confidence}%
                                  </p>
                                </div>
                                <div className="text-sm px-2 py-1 bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                                  {soilData.confidence}% match
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Sprout className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">No Soil Analyses Yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Your previous soil analysis results will appear here once you perform an analysis.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="guide">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">How to Use Soil Analysis</h3>
                  
                  <ol className="space-y-4 list-decimal pl-5">
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Collect soil sample</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Dig 3-6 inches deep and collect a handful of soil from your field.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Take a clear photo</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Place the soil on a white background in good lighting and take a photo.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Upload the image</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Click on "Browse Files" to select an image from your device or use the camera.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Analyze the soil</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Our AI system will analyze your soil image and identify soil type and properties.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Review results</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        You'll receive information about soil type, pH level, nutrients, and fertilizer recommendations.
                      </p>
                    </li>
                  </ol>
                  
                  <div className="mt-6 p-4 bg-kisan-green/10 dark:bg-kisan-green/20 rounded-lg">
                    <h4 className="font-semibold text-kisan-green dark:text-kisan-gold mb-2">Where is data stored?</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      All your soil analysis data is stored locally on your device for privacy. The history 
                      tab shows your previous analyses. In future updates, data will be optionally synced 
                      across devices with a Kisan Dost account.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <CustomFooter />
    </div>
  );
};

export default SoilAnalysis;
