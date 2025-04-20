import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YieldPredictionDisplay } from '@/components/YieldPredictionDisplay';
import { predictCropYield } from '@/services/yieldPrediction';
import type { YieldPredictionOutput, YieldPredictionInput } from '@/services/yieldPrediction';
import { getWeatherByLocation, type WeatherData } from '@/services/weatherService';
import { Loader2, AlertCircle, Save, History, HelpCircle, MapPin } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const CROPS = [
  'Rice',
  'Wheat',
  'Maize',
  'Sugarcane',
  'Cotton',
  'Soybean',
  'Groundnut',
  'Potato',
  'Tomato',
  'Onion'
];

const SOIL_TYPES = [
  'Clay',
  'Loamy',
  'Sandy',
  'Black',
  'Red',
  'Alluvial',
  'Laterite'
];

const SEASONS = [
  'Kharif',
  'Rabi',
  'Zaid',
  'Summer',
  'Winter'
];

const DISEASES = [
  'None',
  'Rust',
  'Blight',
  'Powdery Mildew',
  'Mosaic Virus',
  'Black Spot',
  'Brown Spot',
  'Yellow Spot',
  'Leaf Spot'
];

// Define the structure for prediction history
interface PredictionHistoryItem {
  id: string;
  timestamp: string;
  crop: string;
  area: number;
  predictedYield: number;
  yieldUnit: string;
  confidence: number;
  potentialIncome: number;
}

interface FormData {
  crop: string;
  area: string;
  soilType: string;
  season: string;
  location: string;
  disease: string;
  plantingDate: string;
  irrigationType: string;
  cropVariety: string;
  fertilizers: string[];
  soilNutrients: {
    nitrogen: string;
    phosphorus: string;
    potassium: string;
    ph: string;
  };
  historicalYield: string;
}

const IRRIGATION_TYPES = [
  'Rainfed',
  'Canal',
  'Borewell',
  'Drip',
  'Other'
];

const FERTILIZER_OPTIONS = [
  'Urea',
  'DAP',
  'Compost',
  'NPK',
  'Organic Manure',
  'Other'
];

export default function YieldPrediction() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [prediction, setPrediction] = useState<YieldPredictionOutput | null>(null);
  const [formData, setFormData] = useState<FormData>({
    crop: '',
    area: '',
    soilType: '',
    season: '',
    location: '',
    disease: 'None',
    plantingDate: '',
    irrigationType: 'Rainfed',
    cropVariety: '',
    fertilizers: [],
    soilNutrients: {
      nitrogen: '',
      phosphorus: '',
      potassium: '',
      ph: ''
    },
    historicalYield: ''
  });
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const { toast } = useToast();

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('yieldPredictionHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error parsing prediction history:', error);
      }
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('yieldPredictionHistory', JSON.stringify(history));
    }
  }, [history]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Required fields with more lenient validation
    if (!formData.crop) {
      newErrors.crop = "Please select a crop";
    }

    if (!formData.area) {
      newErrors.area = "Please enter the area";
    } else if (isNaN(parseFloat(formData.area)) || parseFloat(formData.area) <= 0) {
      newErrors.area = "Area must be a positive number";
    }

    if (!formData.soilType) {
      newErrors.soilType = "Please select soil type";
    }

    if (!formData.season) {
      newErrors.season = "Please select season";
    }

    // Optional fields validation - only validate if values are provided
    if (formData.soilNutrients.nitrogen && 
        (isNaN(parseFloat(formData.soilNutrients.nitrogen)) || 
         parseFloat(formData.soilNutrients.nitrogen) < 0)) {
      newErrors['soilNutrients.nitrogen'] = "Nitrogen must be a positive number";
    }

    if (formData.soilNutrients.phosphorus && 
        (isNaN(parseFloat(formData.soilNutrients.phosphorus)) || 
         parseFloat(formData.soilNutrients.phosphorus) < 0)) {
      newErrors['soilNutrients.phosphorus'] = "Phosphorus must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      if (field === 'soilNutrients') {
        return {
          ...prev,
          soilNutrients: {
            ...prev.soilNutrients,
            ...value
          }
        };
      }
      if (field === 'fertilizers') {
        return {
          ...prev,
          fertilizers: value
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const fetchWeatherData = async () => {
    if (!formData.location) {
      toast({
        title: "Location Required",
        description: "Please enter a location to fetch weather data",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingWeather(true);
    try {
      const data = await getWeatherByLocation(formData.location);
      setWeatherData(data);
      toast({
        title: "Weather Data Updated",
        description: "Successfully fetched weather data for your location",
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
      toast({
        title: "Weather Data Error",
        description: "Failed to fetch weather data. You can still proceed with the prediction.",
        variant: "destructive",
      });
      // Set default weather data to allow form submission
      setWeatherData({
        temperature: 25,
        humidity: 70,
        windSpeed: 5,
        rainfall: 100
      });
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Ensure we have weather data
      if (!weatherData) {
        await fetchWeatherData();
      }

      const predictionInput: YieldPredictionInput = {
        crop: formData.crop,
        area: parseFloat(formData.area),
        soilType: formData.soilType,
        season: formData.season,
        location: formData.location,
        disease: formData.disease === 'None' ? undefined : formData.disease,
        plantingDate: formData.plantingDate,
        irrigationType: formData.irrigationType,
        cropVariety: formData.cropVariety,
        fertilizers: formData.fertilizers,
        soilNutrients: {
          nitrogen: formData.soilNutrients.nitrogen ? parseFloat(formData.soilNutrients.nitrogen) : undefined,
          phosphorus: formData.soilNutrients.phosphorus ? parseFloat(formData.soilNutrients.phosphorus) : undefined,
          potassium: formData.soilNutrients.potassium ? parseFloat(formData.soilNutrients.potassium) : undefined,
          ph: formData.soilNutrients.ph ? parseFloat(formData.soilNutrients.ph) : undefined
        },
        weather: weatherData || {
          temperature: 25,
          humidity: 70,
          windSpeed: 5,
          rainfall: 100
        },
        historicalYield: formData.historicalYield ? parseFloat(formData.historicalYield) : undefined
      };

      const result = await predictCropYield(predictionInput);
      setPrediction(result);
      
      // Add to history
      const historyItem: PredictionHistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        crop: formData.crop,
        area: parseFloat(formData.area),
        predictedYield: result.predictedYield,
        yieldUnit: result.yieldUnit,
        confidence: result.confidence,
        potentialIncome: result.potentialIncome
      };
      
      setHistory(prev => [historyItem, ...prev]);
      
      toast({
        title: "Prediction Complete",
        description: "Your yield prediction has been calculated successfully!",
      });
    } catch (error) {
      console.error('Error predicting yield:', error);
      toast({
        title: "Prediction Error",
        description: "Failed to calculate yield prediction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      crop: '',
      area: '',
      soilType: '',
      season: '',
      location: '',
      disease: 'None',
      plantingDate: '',
      irrigationType: 'Rainfed',
      cropVariety: '',
      fertilizers: [],
      soilNutrients: {
        nitrogen: '',
        phosphorus: '',
        potassium: '',
        ph: ''
      },
      historicalYield: ''
    });
    setWeatherData(null);
    setErrors({});
    setPrediction(null);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('yieldPredictionHistory');
    toast({
      title: "History Cleared",
      description: "Your prediction history has been cleared.",
    });
  };

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="predict" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="predict" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Predict Yield
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Prediction History
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            How to Use
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predict" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enter Crop Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="crop">Crop Type <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.crop}
                        onValueChange={(value) => handleInputChange('crop', value)}
                      >
                        <SelectTrigger className={errors.crop ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select crop" />
                        </SelectTrigger>
                        <SelectContent>
                          {CROPS.map((crop) => (
                            <SelectItem key={crop} value={crop}>
                              {crop}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.crop && (
                        <p className="text-sm text-red-500">{errors.crop}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plantingDate">Planting Date <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        id="plantingDate"
                        value={formData.plantingDate}
                        onChange={(e) => handleInputChange('plantingDate', e.target.value)}
                        className={errors.plantingDate ? "border-red-500" : ""}
                      />
                      {errors.plantingDate && (
                        <p className="text-sm text-red-500">{errors.plantingDate}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="irrigationType">Irrigation Type <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.irrigationType}
                        onValueChange={(value) => handleInputChange('irrigationType', value)}
                      >
                        <SelectTrigger className={errors.irrigationType ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select irrigation type" />
                        </SelectTrigger>
                        <SelectContent>
                          {IRRIGATION_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.irrigationType && (
                        <p className="text-sm text-red-500">{errors.irrigationType}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cropVariety">Crop Variety</Label>
                      <Input
                        id="cropVariety"
                        value={formData.cropVariety}
                        onChange={(e) => handleInputChange('cropVariety', e.target.value)}
                        placeholder="Enter crop variety (optional)"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold">Soil and Nutrient Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="soilType">Soil Type <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.soilType}
                        onValueChange={(value) => handleInputChange('soilType', value)}
                      >
                        <SelectTrigger className={errors.soilType ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select soil type" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOIL_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.soilType && (
                        <p className="text-sm text-red-500">{errors.soilType}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Soil Nutrients (Optional)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="N (kg/ha)"
                          value={formData.soilNutrients.nitrogen}
                          onChange={(e) => handleInputChange('soilNutrients', {
                            ...formData.soilNutrients,
                            nitrogen: e.target.value
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="P (kg/ha)"
                          value={formData.soilNutrients.phosphorus}
                          onChange={(e) => handleInputChange('soilNutrients', {
                            ...formData.soilNutrients,
                            phosphorus: e.target.value
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="K (kg/ha)"
                          value={formData.soilNutrients.potassium}
                          onChange={(e) => handleInputChange('soilNutrients', {
                            ...formData.soilNutrients,
                            potassium: e.target.value
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="pH"
                          value={formData.soilNutrients.ph}
                          onChange={(e) => handleInputChange('soilNutrients', {
                            ...formData.soilNutrients,
                            ph: e.target.value
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold">Fertilizer Information</h3>
                  <div className="space-y-2">
                    <Label>Fertilizers Used (Optional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {FERTILIZER_OPTIONS.map((fertilizer) => (
                        <div key={fertilizer} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={fertilizer}
                            checked={formData.fertilizers.includes(fertilizer)}
                            onChange={(e) => {
                              const newFertilizers = e.target.checked
                                ? [...formData.fertilizers, fertilizer]
                                : formData.fertilizers.filter(f => f !== fertilizer);
                              handleInputChange('fertilizers', newFertilizers);
                            }}
                          />
                          <Label htmlFor={fertilizer}>{fertilizer}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold">Historical Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="historicalYield">Last Year's Yield (kg/ha)</Label>
                    <Input
                      type="number"
                      id="historicalYield"
                      value={formData.historicalYield}
                      onChange={(e) => handleInputChange('historicalYield', e.target.value)}
                      placeholder="Enter last year's yield (optional)"
                    />
                  </div>
                </div>

                {weatherData && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Temperature</Label>
                          <p className="text-lg font-medium">{weatherData.temperature}°C</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Humidity</Label>
                          <p className="text-lg font-medium">{weatherData.humidity}%</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Wind Speed</Label>
                          <p className="text-lg font-medium">{weatherData.windSpeed} m/s</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Rainfall (3h avg)</Label>
                          <p className="text-lg font-medium">{weatherData.rainfall.toFixed(2)} mm</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1" disabled={isLoading || !weatherData}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Predicting...
                      </>
                    ) : (
                      'Predict Yield'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={clearForm}
                    disabled={isLoading}
                  >
                    Clear Form
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {prediction && (
            <Card className="mt-6">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Yield Prediction Results</h3>
                  <Badge variant={prediction.confidence > 70 ? "default" : "secondary"}>
                    {prediction.confidence}% Confidence
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Predicted Yield</p>
                    <p className="text-2xl font-bold">
                      {prediction.predictedYield} {prediction.yieldUnit}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Potential Income</p>
                    <p className="text-2xl font-bold">
                      ₹{prediction.potentialIncome.toLocaleString()}
                    </p>
                  </div>
                </div>

                {prediction.diseaseLossPercent !== null && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      Disease Impact: {prediction.diseaseLossPercent}% potential yield loss
                    </p>
                  </div>
                )}

                {prediction.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Recommendations:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {prediction.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Impact Factors:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(prediction.factors).map(([factor, value]) => (
                      <div key={factor} className="space-y-1">
                        <p className="text-sm capitalize">{factor}</p>
                        <p className={`text-sm font-medium ${value >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                          {(value * 100).toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Prediction History</CardTitle>
              {history.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearHistory}
                  className="text-red-500 hover:text-red-700"
                >
                  Clear History
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="p-4 border-b">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{item.crop}</h3>
                            <p className="text-sm text-muted-foreground">
                              {item.timestamp}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {item.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Area</p>
                          <p className="font-medium">{item.area} hectares</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Predicted Yield</p>
                          <p className="font-medium">{item.predictedYield} {item.yieldUnit}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Potential Income</p>
                          <p className="font-medium">₹{item.potentialIncome.toLocaleString()}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Predictions Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Your previous yield predictions will appear here once you make them.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help">
          <Card>
            <CardHeader>
              <CardTitle>How to Use Yield Prediction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. Enter Crop Details</h3>
                  <p className="text-muted-foreground">
                    Select your crop type, enter the area under cultivation, and specify the soil type.
                    The more accurate your inputs, the better the prediction will be.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2. Provide Weather Information</h3>
                  <p className="text-muted-foreground">
                    Enter current weather conditions including temperature, rainfall, humidity, and wind speed.
                    These factors significantly impact crop growth and yield.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">3. Add Disease Information (if any)</h3>
                  <p className="text-muted-foreground">
                    If your crop is affected by any disease, select it from the dropdown to factor into the yield prediction.
                    This helps provide a more realistic estimate of potential losses.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">4. Get Predictions</h3>
                  <p className="text-muted-foreground">
                    Click "Predict Yield" to get detailed yield predictions, potential income, and recommendations.
                    The system uses AI to analyze all factors and provide the most accurate prediction possible.
                  </p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Understanding the Results</AlertTitle>
                <AlertDescription>
                  The prediction includes a confidence level that indicates how reliable the estimate is.
                  Factors like weather, soil conditions, and disease presence all contribute to the final prediction.
                  Use these insights to make informed decisions about your farming practices.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold">Frequently Asked Questions</h3>
                
                <div className="space-y-2">
                  <h4 className="font-medium">How accurate are the predictions?</h4>
                  <p className="text-muted-foreground">
                    The accuracy depends on the quality of input data. The more accurate your inputs, the better the prediction.
                    The confidence level indicates the reliability of the prediction.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">What factors affect yield prediction?</h4>
                  <p className="text-muted-foreground">
                    Multiple factors influence crop yield, including weather conditions, soil quality, crop variety,
                    disease presence, and farming practices. Our AI model considers all these factors.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">How can I improve my yield?</h4>
                  <p className="text-muted-foreground">
                    Follow the recommendations provided with your prediction. These are tailored to your specific
                    situation and can help optimize your farming practices for better yields.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Is my data saved?</h4>
                  <p className="text-muted-foreground">
                    Yes, your prediction history is saved locally on your device. You can view past predictions
                    in the History tab and clear your history at any time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
