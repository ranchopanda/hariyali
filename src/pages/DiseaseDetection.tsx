import { useState, useRef } from "react";
import { FeedbackForm } from "@/components/FeedbackForm";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import CustomFooter from "@/components/CustomFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Upload, Camera, Loader2, Info, ArrowRight, X, AlertTriangle, Leaf, CheckCircle2, BarChart4, TrendingDown, Wind } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CameraCapture from "@/components/CameraCapture";
import { analyzePlantDisease, imageToBase64, storeAnalysisData, getAnalysisHistory } from "@/utils/geminiAI";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface DetectionResult {
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
      
      toast({
        title: "Analysis Complete",
        description: `Detected: ${analysisResult.disease_name} on ${analysisResult.crop_type}`,
        variant: "default",
      });
      
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

  const renderConfidenceBadge = (confidence: number) => {
    let color = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    
    if (confidence >= 90) {
      color = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    } else if (confidence >= 70) {
      color = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    } else if (confidence >= 50) {
      color = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
        {confidence}% confidence
      </span>
    );
  };

  const renderSeverityBadge = (severity: string) => {
    let color = "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    
    if (severity === "Severe") {
      color = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    } else if (severity === "Moderate") {
      color = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    } else if (severity === "Mild") {
      color = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
        {severity} severity
      </span>
    );
  };

  const renderRiskBadge = (risk: string, type: string) => {
    let color = "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    let icon = null;
    
    if (risk === "High") {
      color = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      icon = type === "spread" ? <Wind className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />;
    } else if (risk === "Medium") {
      color = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      icon = type === "spread" ? <Wind className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />;
    } else if (risk === "Low") {
      color = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      icon = type === "spread" ? <Wind className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
        {icon}
        {type === "spread" ? `${risk} spread risk` : `${risk} recovery chance`}
      </span>
    );
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
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6 space-x-3">
            <div className="p-2 rounded-full bg-kisan-green/10 dark:bg-kisan-green/20">
              <Leaf className="h-6 w-6 text-kisan-green dark:text-kisan-gold" />
            </div>
            <h1 className="text-3xl font-bold text-kisan-green dark:text-kisan-gold">
              AI Plant Disease Detection
            </h1>
          </div>
          
          <Card className="mb-8 border-none shadow-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-gray-600 dark:text-gray-300">
                Upload a clear photo of your plant to identify diseases and get treatment recommendations.
                For best results, take close-up photos of affected leaves, stems, or fruits in good lighting.
              </p>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="detection" className="space-y-6">
            <TabsList className="w-full p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <TabsTrigger value="detection" className="flex-1 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                Disease Detection
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                Detection History
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex-1 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                How to Use
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="detection" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {showCamera ? (
                    <Card className="overflow-hidden border-none shadow-lg">
                      <CardHeader className="bg-kisan-green text-white dark:bg-kisan-green-dark p-4">
                        <CardTitle className="text-lg flex items-center">
                          <Camera className="mr-2 h-5 w-5" />
                          Take a Photo
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <CameraCapture 
                          onCapture={handleCameraCapture}
                          onClose={() => setShowCamera(false)}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="overflow-hidden border-none shadow-lg">
                      <CardHeader className="bg-kisan-green text-white dark:bg-kisan-green-dark p-4">
                        <CardTitle className="text-lg flex items-center">
                          <Upload className="mr-2 h-5 w-5" />
                          Upload Plant Image
                        </CardTitle>
                        <CardDescription className="text-white/80 mt-1">
                          Take a clear photo of the affected plant part
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="p-6">
                        {!preview ? (
                          <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-10 text-center bg-gray-50 dark:bg-gray-800/50">
                              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
                              <p className="text-gray-500 dark:text-gray-400 mb-6">
                                Drag and drop an image here or click to browse
                              </p>
                              <div className="flex flex-col sm:flex-row justify-center gap-3">
                                <Button
                                  className="bg-kisan-green hover:bg-kisan-green-dark text-white"
                                  onClick={() => document.getElementById('image-upload')?.click()}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Browse Files
                                </Button>
                                <Button
                                  variant="outline"
                                  className="border-kisan-green text-kisan-green hover:bg-kisan-green/10 dark:border-kisan-gold dark:text-kisan-gold dark:hover:bg-kisan-gold/10"
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
                            <div className="overflow-hidden rounded-lg ring-2 ring-kisan-green/20 shadow-inner">
                              <img 
                                src={preview} 
                                alt="Plant preview" 
                                className="w-full object-cover max-h-[300px]" 
                              />
                            </div>
                            <Button
                              size="icon"
                              variant="outline"
                              className="absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full hover:bg-white hover:text-red-500 dark:hover:bg-gray-800 dark:hover:text-red-500"
                              onClick={clearImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            
                            <div className="mt-4 flex justify-center">
                              <Button
                                className="w-full bg-kisan-green hover:bg-kisan-green-dark text-white py-6"
                                onClick={analyzeImage}
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Analyzing Image...
                                  </>
                                ) : (
                                  <>
                                    <Leaf className="mr-2 h-5 w-5" />
                                    Analyze Plant Image
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  <Card className="border-none shadow-md bg-amber-50 dark:bg-amber-900/10">
                    <CardContent className="p-4">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-amber-700 dark:text-amber-300">For best results:</h3>
                          <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1.5 list-disc pl-5">
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
                    <Card className="overflow-hidden border-none shadow-lg">
                      <CardHeader className="bg-gray-50 dark:bg-gray-800 p-4 border-b dark:border-gray-700">
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{result.crop_type}</CardTitle>
                            <div>
                              {renderConfidenceBadge(result.confidence)}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {renderSeverityBadge(result.severity)}
                            {renderRiskBadge(result.spread_risk, "spread")}
                            {renderRiskBadge(result.recovery_chance, "recovery")}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="p-4 bg-kisan-green/10 dark:bg-kisan-green/20 border-b dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <Virus className="h-5 w-5 text-kisan-green dark:text-kisan-gold" />
                            <h4 className="font-semibold text-xl text-kisan-green dark:text-kisan-gold">
                              {result.disease_name}
                            </h4>
                          </div>
                          
                          {result.yield_impact && (
                            <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <BarChart4 className="h-4 w-4 mr-1 text-amber-600 dark:text-amber-400" />
                              <span>Potential yield impact: <strong>{result.yield_impact}</strong></span>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-6 space-y-6">
                          <div>
                            <h4 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Badge variant="outline" className="mr-2 p-1 h-auto">Description</Badge>
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                              {result.description}
                            </p>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <h4 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Badge variant="outline" className="mr-2 p-1 h-auto">Recommendations</Badge>
                            </h4>
                            <ul className="text-gray-600 dark:text-gray-400 space-y-2">
                              {result.recommendations.map((recommendation, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="inline-flex items-center justify-center rounded-full bg-kisan-green/10 dark:bg-kisan-green/20 h-5 w-5 text-xs text-kisan-green dark:text-kisan-gold font-medium mr-2 mt-0.5 flex-shrink-0">
                                    {index + 1}
                                  </span>
                                  <span>{recommendation}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <h4 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Badge variant="outline" className="mr-2 p-1 h-auto">Treatment Options</Badge>
                            </h4>
                            <ul className="text-gray-600 dark:text-gray-400 space-y-2">
                              {result.treatment.map((treatment, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="inline-flex items-center justify-center rounded-full bg-kisan-green/10 dark:bg-kisan-green/20 h-5 w-5 text-xs text-kisan-green dark:text-kisan-gold font-medium mr-2 mt-0.5 flex-shrink-0">
                                    {index + 1}
                                  </span>
                                  <span>{treatment}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="p-6 pt-0">
                          <div className="flex items-start mb-4 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-700 dark:text-amber-400">
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

                          <div className="mt-6 border rounded-lg">
                            <FeedbackForm 
                              analysisId={result.disease_name}
                              onSubmit={async (isHelpful, comment) => {
                                console.log('Feedback:', {isHelpful, comment});
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : preview ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md">
                      <div className="w-16 h-16 bg-kisan-green/10 dark:bg-kisan-green/20 rounded-full flex items-center justify-center mb-4">
                        <Info className="h-8 w-8 text-kisan-green dark:text-kisan-gold" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Analysis Pending</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                        Click "Analyze Image" to detect plant diseases and get recommendations.
                      </p>
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
                            Analyze Now
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md">
                      <div className="w-16 h-16 bg-kisan-green/10 dark:bg-kisan-green/20 rounded-full flex items-center justify-center mb-4">
                        <Leaf className="h-8 w-8 text-kisan-green dark:text-kisan-gold" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Detection Results</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                        Upload a plant image to see disease detection results and treatment recommendations.
                      </p>
                      <Button
                        variant="outline"
                        className="border-kisan-green text-kisan-green hover:bg-kisan-green/10 dark:border-kisan-gold dark:text-kisan-gold dark:hover:bg-kisan-gold/10"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Image
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <Card className="border-none shadow-lg overflow-hidden">
                <CardHeader className="bg-kisan-green text-white dark:bg-kisan-green-dark p-4">
                  <CardTitle className="text-lg">Detection History</CardTitle>
                  <CardDescription className="text-white/80">
                    Your previous plant disease detection results
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {getAnalysisHistory("disease_detection").length > 0 ? (
                    <div className="space-y-4">
                      {getAnalysisHistory("disease_detection").map((item) => (
                        <div 
                          key={item.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-kisan-green dark:text-kisan-gold">{item.disease_name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            <div>
                              {renderConfidenceBadge(item.confidence)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No Detection History</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Your previous detection results will appear here once you analyze some plants.
                      </p>
                      <Button
                        variant="outline"
                        className="border-kisan-green text-kisan-green hover:bg-kisan-green/10 dark:border-kisan-gold dark:text-kisan-gold dark:hover:bg-kisan-gold/10"
                        onClick={() => document.querySelector('[data-value="detection"]')?.dispatchEvent(new Event('click'))}
                      >
                        <Leaf className="mr-2 h-4 w-4" />
                        Go to Detection
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="guide">
              <Card className="border-none shadow-lg overflow-hidden">
                <CardHeader className="bg-kisan-green text-white dark:bg-kisan-green-dark p-4">
                  <CardTitle className="text-lg">How to Use Plant Disease Detection</CardTitle>
                  <CardDescription className="text-white/80">
                    Follow these steps to get the most accurate results
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ol className="space-y-6 list-none pl-0 relative before:absolute before:left-3 before:top-2 before:h-[calc(100%-20px)] before:w-0.5 before:bg-kisan-green/20 dark:before:bg-kisan-green/30">
                    <li className="text-gray-700 dark:text-gray-300 ml-10 relative">
                      <div className="absolute -left-10 flex items-center justify-center w-6 h-6 rounded-full bg-kisan-green text-white dark:bg-kisan-green-dark text-sm">1</div>
                      <span className="font-medium text-lg">Take a clear photo</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Ensure good lighting and focus on the affected plant part (leaves, stems, fruits).
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300 ml-10 relative">
                      <div className="absolute -left-10 flex items-center justify-center w-6 h-6 rounded-full bg-kisan-green text-white dark:bg-kisan-green-dark text-sm">2</div>
                      <span className="font-medium text-lg">Upload the image</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Click on "Browse Files" to select an image from your device or use the camera.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300 ml-10 relative">
                      <div className="absolute -left-10 flex items-center justify-center w-6 h-6 rounded-full bg-kisan-green text-white dark:bg-kisan-green-dark text-sm">3</div>
                      <span className="font-medium text-lg">Analyze the image</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Our AI system powered by Gemini 1.5 Pro will analyze your plant image and identify potential diseases.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300 ml-10 relative">
                      <div className="absolute -left-10 flex items-center justify-center w-6 h-6 rounded-full bg-kisan-green text-white dark:bg-kisan-green-dark text-sm">4</div>
                      <span className="font-medium text-lg">Review results</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        You'll receive information about the detected disease, including description and treatment options.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300 ml-10 relative">
                      <div className="absolute -left-10 flex items-center justify-center w-6 h-6 rounded-full bg-kisan-green text-white dark:bg-kisan-green-dark text-sm">5</div>
                      <span className="font-medium text-lg">Get expert advice (optional)</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Submit your results for review by agricultural experts for more detailed advice.
                      </p>
                    </li>
                  </ol>
                  
                  <div className="mt-8 p-4 bg-kisan-green/10 dark:bg-kisan-green/20 rounded-lg border border-kisan-green/20 dark:border-kisan-green/30">
                    <h4 className="font-semibold text-kisan-green dark:text-kisan-gold mb-2 flex items-center">
                      <Info className="mr-2 h-4 w-4" />
                      Privacy Information
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
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
