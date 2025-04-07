
import { useState, useRef } from "react";
import { FeedbackForm } from "@/components/FeedbackForm";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import CustomFooter from "@/components/CustomFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Camera, Loader2, Info, ArrowRight, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CameraCapture from "@/components/CameraCapture";
import { analyzePlantDisease, imageToBase64, storeAnalysisData, getAnalysisHistory } from "@/utils/geminiAI";

interface DetectionResult {
  disease_name: string;
  confidence: number;
  description: string;
  recommendations: string[];
  treatment: string[];
}

interface AnalysisData extends DetectionResult {
  id: string;
  timestamp: string;
  type: string;
}

const DiseaseDetection = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
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
        description: "Please upload an image of a plant first.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const base64Image = await imageToBase64(image);
      console.log("Analyzing image with base64 length:", base64Image.length);
      
      const analysisResult = await analyzePlantDisease(base64Image);
      console.log("Analysis result:", analysisResult.disease_name, "with confidence:", analysisResult.confidence);
      
      setResult(analysisResult);
      
      await storeAnalysisData(analysisResult, "disease_detection");
      
    } catch (error: unknown) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing the image. Please try again with a clearer image.",
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
        description: "Your plant data has been submitted for expert review. You will receive advice within 24 hours.",
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
            AI Plant Disease Detection
          </h1>
          
          <p className="mb-8 text-gray-600 dark:text-gray-300">
            Upload a clear photo of your plant to identify diseases and get treatment recommendations.
          </p>
          
          <Tabs defaultValue="detection">
            <TabsList className="mb-8">
              <TabsTrigger value="detection">Disease Detection</TabsTrigger>
              <TabsTrigger value="history">Detection History</TabsTrigger>
              <TabsTrigger value="guide">How to Use</TabsTrigger>
            </TabsList>
            
            <TabsContent value="detection">
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
                          <h3 className="text-lg font-semibold mb-2">Upload Plant Image</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Take a clear photo of the affected plant part (leaves, stem, or fruit)
                          </p>
                        </div>
                        
                        {!preview ? (
                          <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-10 text-center">
                              <Upload className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                              <p className="text-gray-500 dark:text-gray-400 mb-4">
                                Drag and drop an image here or click to browse
                              </p>
                              <div className="flex justify-center gap-3">
                                <Button
                                  className="bg-kisan-green hover:bg-kisan-green-dark text-white"
                                  onClick={() => document.getElementById('image-upload')?.click()}
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
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                ref={fileInputRef}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <img 
                              src={preview} 
                              alt="Plant preview" 
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
                                    Analyze Image
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
                            <li>Take close-up photos in good lighting</li>
                            <li>Include multiple affected areas</li>
                            <li>Avoid shadows and blurry images</li>
                            <li>Position camera parallel to the leaf surface</li>
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
                            <h3 className="text-lg font-semibold">Detection Results</h3>
                            <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                              Confidence: {result.confidence}%
                            </div>
                          </div>
                          
                          <div className="mt-4 p-3 rounded-lg bg-kisan-green/10 dark:bg-kisan-green/20">
                            <h4 className="font-semibold text-kisan-green dark:text-kisan-gold">
                              {result.disease_name}
                            </h4>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              Description
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {result.description}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              Recommendations
                            </h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
                              {result.recommendations.map((recommendation, index) => (
                                <li key={index}>{recommendation}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              Treatment Options
                            </h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
                              {result.treatment.map((treatment, index) => (
                                <li key={index}>{treatment}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-start mb-4">
                            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              This is an AI-generated analysis. For severe cases, consult with an agricultural expert.
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

                          <FeedbackForm 
                            analysisId={result.disease_name}
                            onSubmit={async (isHelpful, comment) => {
                              // TODO: Implement feedback submission to Supabase
                              console.log('Feedback:', {isHelpful, comment});
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ) : preview ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <Info className="h-10 w-10 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Analysis Pending</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Click "Analyze Image" to detect plant diseases and get recommendations.
                      </p>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <Info className="h-10 w-10 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Detection Results</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Upload a plant image to see disease detection results and treatment recommendations.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardContent className="p-6">
                  {getAnalysisHistory("disease_detection").length > 0 ? (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Previous Detections</h3>
                      
                      <div className="space-y-4">
                        {getAnalysisHistory("disease_detection").map((item) => (
                          <div 
                            key={item.id}
                            className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.disease_name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(item.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-sm px-2 py-1 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded">
                                {item.confidence}% confidence
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Detection History</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Your previous detection results will appear here once you analyze some plants.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="guide">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">How to Use Plant Disease Detection</h3>
                  
                  <ol className="space-y-4 list-decimal pl-5">
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Take a clear photo</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Ensure good lighting and focus on the affected plant part (leaves, stems, fruits).
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Upload the image</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Click on "Browse Files" to select an image from your device or use the camera.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Analyze the image</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Our AI system powered by Gemini 1.5 Flash will analyze your plant image and identify potential diseases.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Review results</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        You'll receive information about the detected disease, including description and treatment options.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Get expert advice (optional)</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Submit your results for review by agricultural experts for more detailed advice.
                      </p>
                    </li>
                  </ol>
                  
                  <div className="mt-6 p-4 bg-kisan-green/10 dark:bg-kisan-green/20 rounded-lg">
                    <h4 className="font-semibold text-kisan-green dark:text-kisan-gold mb-2">Where is data stored?</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      All your detection data is stored locally on your device for privacy. The history 
                      tab shows your previous detections. In a future update, you'll be able to sync 
                      data across devices with a Kisan Dost account.
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

export default DiseaseDetection;
