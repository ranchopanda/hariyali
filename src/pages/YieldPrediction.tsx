
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import CustomFooter from "@/components/CustomFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calculator, Cloud, ThermometerSun, Sprout, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { predictYield, storeAnalysisData, getAnalysisHistory } from "@/utils/geminiAI";

interface PredictionFormData {
  crop: string;
  area: number;
  soilType: string;
  rainfall: number;
  temperature: number;
  disease: string | null;
}

interface PredictionResult {
  predictedYield: number;
  yieldUnit: string;
  confidence: number;
  potentialIncome: number;
  diseaseLossPercent: number | null;
  recommendations: string[];
  timestamp?: string;
}

const YieldPrediction = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState<PredictionFormData>({
    crop: "Rice",
    area: 1,
    soilType: "Black Cotton Soil",
    rainfall: 800,
    temperature: 28,
    disease: null
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "area" || name === "rainfall" || name === "temperature" 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value === "None" && name === "disease" ? null : value
    }));
  };

  const handlePredictYield = async () => {
    if (formData.area <= 0) {
      toast({
        title: "Invalid Input",
        description: "Area must be greater than zero.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const prediction = await predictYield(
        formData.crop,
        formData.area,
        formData.soilType,
        formData.rainfall,
        formData.temperature,
        formData.disease
      );
      
      setResult(prediction);
      
      // Store the prediction results
      await storeAnalysisData({
        ...prediction,
        inputs: formData
      }, "yield_prediction");
      
    } catch (error: any) {
      console.error("Prediction error:", error);
      toast({
        title: "Prediction Failed",
        description: error.message || "Failed to predict yield. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getHistory = () => {
    return getAnalysisHistory("yield_prediction");
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
            AI Crop Yield Prediction
          </h1>
          
          <p className="mb-8 text-gray-600 dark:text-gray-300">
            Predict crop yields based on soil, weather, and cultivation practices to help plan your farming season.
          </p>
          
          <Tabs defaultValue="prediction">
            <TabsList className="mb-8">
              <TabsTrigger value="prediction">Yield Prediction</TabsTrigger>
              <TabsTrigger value="history">Prediction History</TabsTrigger>
              <TabsTrigger value="guide">How to Use</TabsTrigger>
            </TabsList>
            
            <TabsContent value="prediction">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Enter Crop Details</h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="crop">Crop Type</Label>
                          <Select 
                            defaultValue={formData.crop}
                            onValueChange={(value) => handleSelectChange("crop", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Crop" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Rice">Rice</SelectItem>
                              <SelectItem value="Wheat">Wheat</SelectItem>
                              <SelectItem value="Cotton">Cotton</SelectItem>
                              <SelectItem value="Sugarcane">Sugarcane</SelectItem>
                              <SelectItem value="Maize">Maize</SelectItem>
                              <SelectItem value="Pulses">Pulses</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="area">Area (hectares)</Label>
                          <Input
                            id="area"
                            name="area"
                            type="number"
                            value={formData.area}
                            onChange={handleInputChange}
                            min="0.1"
                            step="0.1"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="soilType">Soil Type</Label>
                          <Select 
                            defaultValue={formData.soilType}
                            onValueChange={(value) => handleSelectChange("soilType", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Soil Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Black Cotton Soil">Black Cotton Soil</SelectItem>
                              <SelectItem value="Red Soil">Red Soil</SelectItem>
                              <SelectItem value="Alluvial Soil">Alluvial Soil</SelectItem>
                              <SelectItem value="Laterite Soil">Laterite Soil</SelectItem>
                              <SelectItem value="Mountain Soil">Mountain Soil</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="rainfall">
                            <div className="flex items-center">
                              <Cloud className="h-4 w-4 mr-1" />
                              Average Rainfall (mm)
                            </div>
                          </Label>
                          <Input
                            id="rainfall"
                            name="rainfall"
                            type="number"
                            value={formData.rainfall}
                            onChange={handleInputChange}
                            min="0"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="temperature">
                            <div className="flex items-center">
                              <ThermometerSun className="h-4 w-4 mr-1" />
                              Average Temperature (°C)
                            </div>
                          </Label>
                          <Input
                            id="temperature"
                            name="temperature"
                            type="number"
                            value={formData.temperature}
                            onChange={handleInputChange}
                            min="0"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="disease">Known Plant Disease</Label>
                          <Select 
                            defaultValue={formData.disease || "None"}
                            onValueChange={(value) => handleSelectChange("disease", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Disease (if any)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="None">None</SelectItem>
                              <SelectItem value="Leaf Blight">Leaf Blight</SelectItem>
                              <SelectItem value="Blast">Blast</SelectItem>
                              <SelectItem value="Rust">Rust</SelectItem>
                              <SelectItem value="Powdery Mildew">Powdery Mildew</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button
                          className="w-full mt-2 bg-kisan-green hover:bg-kisan-green-dark"
                          onClick={handlePredictYield}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Calculating...
                            </>
                          ) : (
                            <>
                              <Calculator className="mr-2 h-4 w-4" />
                              Predict Yield
                            </>
                          )}
                        </Button>
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
                            <h3 className="text-lg font-semibold">Prediction Results</h3>
                            <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                              Confidence: {result.confidence}%
                            </div>
                          </div>
                          
                          <div className="mt-6 grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-kisan-green/10 dark:bg-kisan-green/20">
                              <p className="text-sm text-gray-500 dark:text-gray-400">Predicted Yield</p>
                              <p className="text-xl font-bold text-kisan-green dark:text-kisan-gold">
                                {result.predictedYield} {result.yieldUnit}
                              </p>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                              <p className="text-sm text-gray-500 dark:text-gray-400">Potential Income</p>
                              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                ₹{result.potentialIncome.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          {result.diseaseLossPercent && (
                            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-start space-x-2">
                              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                              <div>
                                <p className="font-medium text-amber-800 dark:text-amber-300">
                                  Disease Impact
                                </p>
                                <p className="text-sm text-amber-700 dark:text-amber-400">
                                  Estimated {result.diseaseLossPercent}% yield loss due to {formData.disease}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4">
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
                          
                          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-start mb-4">
                              <Sprout className="h-5 w-5 text-kisan-green mr-2 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                For optimal results, consider your specific field conditions and historical yield data in addition to this prediction.
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <Calculator className="h-12 w-12 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Yield Prediction Results</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Fill out the form and click "Predict Yield" to see AI-powered yield predictions for your crop.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardContent className="p-6">
                  {getHistory().length > 0 ? (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Previous Predictions</h3>
                      
                      <div className="space-y-4">
                        {getHistory().map((item: any) => (
                          <div 
                            key={item.id}
                            className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {item.inputs.crop} ({item.inputs.area} ha)
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(item.timestamp).toLocaleDateString()} - 
                                  Predicted: {item.predictedYield} {item.yieldUnit}
                                </p>
                              </div>
                              <p className="text-kisan-green dark:text-kisan-gold font-medium">
                                ₹{item.potentialIncome.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">No Predictions Yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Your previous yield predictions will appear here once you make them.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="guide">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">How to Use Yield Prediction</h3>
                  
                  <ol className="space-y-4 list-decimal pl-5">
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Select your crop</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Choose the crop type you're planning to grow or have already planted.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Enter field area</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Specify the size of your field in hectares.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Select soil type</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Choose the soil type that best matches your field. If unsure, use our Soil Analysis feature.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Enter weather data</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Input the average rainfall and temperature expected during the growing season.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Note any diseases</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        If your crop has any disease, select it to factor into the yield prediction.
                      </p>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Get prediction</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Click "Predict Yield" to receive an AI-powered yield prediction and recommendations.
                      </p>
                    </li>
                  </ol>
                  
                  <div className="mt-6 p-4 bg-kisan-green/10 dark:bg-kisan-green/20 rounded-lg">
                    <h4 className="font-semibold text-kisan-green dark:text-kisan-gold mb-2">Where is data stored?</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      All your prediction data is stored locally on your device for privacy. The history 
                      tab shows your previous predictions. In a future update, you'll be able to sync 
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

export default YieldPrediction;
