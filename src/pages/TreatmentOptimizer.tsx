import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import CustomFooter from "@/components/CustomFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Loader2, 
  Info, 
  Leaf, 
  Droplets, 
  Thermometer, 
  Wind, 
  Sun, 
  Cloud, 
  Sprout, 
  Flower2, 
  Wheat, 
  Apple, 
  Carrot, 
  Coins, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Clock,
  Package,
  ShoppingCart,
  BarChart2,
  History,
  BookOpen
} from "lucide-react";

// Define interfaces for the treatment optimizer
interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  forecast: string;
}

interface CropData {
  name: string;
  stage: string;
  plantedDate: string;
  expectedHarvestDate: string;
  area: number;
}

interface ResourceData {
  organicPesticides: string[];
  chemicalPesticides: string[];
  fertilizers: string[];
  equipment: string[];
  budget: number;
}

interface TreatmentPlan {
  id: string;
  timestamp: string;
  crop: CropData;
  weather: WeatherData;
  resources: ResourceData;
  recommendedTreatments: {
    name: string;
    type: "organic" | "chemical" | "fertilizer";
    dosage: string;
    frequency: string;
    cost: number;
    effectiveness: number;
    environmentalImpact: number;
    notes: string;
  }[];
  totalCost: number;
  expectedEffectiveness: number;
  environmentalImpact: number;
  applicationSchedule: {
    date: string;
    treatments: string[];
    notes: string;
  }[];
}

const TreatmentOptimizer = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("optimizer");
  const [loading, setLoading] = useState(false);
  const [cropData, setCropData] = useState<CropData>({
    name: "",
    stage: "",
    plantedDate: "",
    expectedHarvestDate: "",
    area: 1
  });
  const [weatherData, setWeatherData] = useState<WeatherData>({
    temperature: 25,
    humidity: 60,
    rainfall: 0,
    windSpeed: 5,
    forecast: "sunny"
  });
  const [resourceData, setResourceData] = useState<ResourceData>({
    organicPesticides: [],
    chemicalPesticides: [],
    fertilizers: [],
    equipment: [],
    budget: 1000
  });
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [treatmentHistory, setTreatmentHistory] = useState<TreatmentPlan[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Available options for dropdowns
  const cropOptions = [
    { value: "rice", label: "Rice" },
    { value: "wheat", label: "Wheat" },
    { value: "maize", label: "Maize" },
    { value: "sugarcane", label: "Sugarcane" },
    { value: "cotton", label: "Cotton" },
    { value: "soybean", label: "Soybean" },
    { value: "potato", label: "Potato" },
    { value: "tomato", label: "Tomato" },
    { value: "onion", label: "Onion" },
    { value: "chilli", label: "Chilli" }
  ];

  const cropStageOptions = [
    { value: "seedling", label: "Seedling" },
    { value: "vegetative", label: "Vegetative" },
    { value: "flowering", label: "Flowering" },
    { value: "fruiting", label: "Fruiting" },
    { value: "ripening", label: "Ripening" },
    { value: "harvesting", label: "Harvesting" }
  ];

  const forecastOptions = [
    { value: "sunny", label: "Sunny" },
    { value: "partly_cloudy", label: "Partly Cloudy" },
    { value: "cloudy", label: "Cloudy" },
    { value: "rainy", label: "Rainy" },
    { value: "stormy", label: "Stormy" }
  ];

  const organicPesticideOptions = [
    { value: "neem_oil", label: "Neem Oil", cost: 150, effectiveness: 70, environmentalImpact: 10 },
    { value: "garlic_spray", label: "Garlic Spray", cost: 80, effectiveness: 60, environmentalImpact: 5 },
    { value: "chili_spray", label: "Chili Spray", cost: 70, effectiveness: 55, environmentalImpact: 5 },
    { value: "soap_spray", label: "Soap Spray", cost: 50, effectiveness: 50, environmentalImpact: 10 },
    { value: "diatomaceous_earth", label: "Diatomaceous Earth", cost: 200, effectiveness: 75, environmentalImpact: 15 },
    { value: "bacillus_thuringiensis", label: "Bacillus Thuringiensis", cost: 180, effectiveness: 80, environmentalImpact: 20 }
  ];

  const chemicalPesticideOptions = [
    { value: "chlorpyrifos", label: "Chlorpyrifos", cost: 300, effectiveness: 90, environmentalImpact: 80 },
    { value: "malathion", label: "Malathion", cost: 250, effectiveness: 85, environmentalImpact: 70 },
    { value: "cypermethrin", label: "Cypermethrin", cost: 280, effectiveness: 88, environmentalImpact: 75 },
    { value: "carbendazim", label: "Carbendazim", cost: 220, effectiveness: 82, environmentalImpact: 65 },
    { value: "mancozeb", label: "Mancozeb", cost: 200, effectiveness: 80, environmentalImpact: 60 }
  ];

  const fertilizerOptions = [
    { value: "npk_19_19_19", label: "NPK 19-19-19", cost: 400, effectiveness: 85, environmentalImpact: 40 },
    { value: "urea", label: "Urea", cost: 180, effectiveness: 75, environmentalImpact: 50 },
    { value: "dap", label: "DAP", cost: 350, effectiveness: 80, environmentalImpact: 45 },
    { value: "compost", label: "Compost", cost: 150, effectiveness: 60, environmentalImpact: 10 },
    { value: "vermicompost", label: "Vermicompost", cost: 200, effectiveness: 65, environmentalImpact: 5 },
    { value: "farm_yard_manure", label: "Farm Yard Manure", cost: 120, effectiveness: 55, environmentalImpact: 15 }
  ];

  const equipmentOptions = [
    { value: "sprayer", label: "Sprayer", cost: 500 },
    { value: "fertilizer_spreader", label: "Fertilizer Spreader", cost: 800 },
    { value: "soil_tester", label: "Soil Tester", cost: 300 },
    { value: "pruning_shears", label: "Pruning Shears", cost: 200 },
    { value: "watering_can", label: "Watering Can", cost: 100 }
  ];

  // Handle form changes
  const handleCropChange = (field: keyof CropData, value: string | number) => {
    setCropData(prev => ({ ...prev, [field]: value }));
  };

  const handleWeatherChange = (field: keyof WeatherData, value: number | string) => {
    setWeatherData(prev => ({ ...prev, [field]: value }));
  };

  const handleResourceChange = (field: keyof ResourceData, value: any) => {
    setResourceData(prev => ({ ...prev, [field]: value }));
  };

  // Generate treatment plan
  const generateTreatmentPlan = () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // This is a simplified example. In a real app, this would call an API
      const recommendedTreatments = [];
      
      // Add organic treatments based on crop and weather
      if (cropData.stage === "seedling" || cropData.stage === "vegetative") {
        recommendedTreatments.push({
          name: "Neem Oil",
          type: "organic",
          dosage: "2-3 ml per liter of water",
          frequency: "Every 7-10 days",
          cost: 150,
          effectiveness: 70,
          environmentalImpact: 10,
          notes: "Effective against early-stage pests"
        });
      }
      
      if (weatherData.temperature > 25 && weatherData.humidity > 70) {
        recommendedTreatments.push({
          name: "Bacillus Thuringiensis",
          type: "organic",
          dosage: "1-2 g per liter of water",
          frequency: "Every 5-7 days",
          cost: 180,
          effectiveness: 80,
          environmentalImpact: 20,
          notes: "Best for high humidity conditions"
        });
      }
      
      // Add chemical treatments if budget allows and organic treatments are insufficient
      if (resourceData.budget > 500 && cropData.stage === "flowering" || cropData.stage === "fruiting") {
        recommendedTreatments.push({
          name: "Cypermethrin",
          type: "chemical",
          dosage: "1-2 ml per liter of water",
          frequency: "Every 10-14 days",
          cost: 280,
          effectiveness: 88,
          environmentalImpact: 75,
          notes: "Use with caution during flowering"
        });
      }
      
      // Add fertilizers based on crop stage
      if (cropData.stage === "vegetative") {
        recommendedTreatments.push({
          name: "NPK 19-19-19",
          type: "fertilizer",
          dosage: "50-100 kg per hectare",
          frequency: "Every 15-20 days",
          cost: 400,
          effectiveness: 85,
          environmentalImpact: 40,
          notes: "Promotes vegetative growth"
        });
      } else if (cropData.stage === "flowering" || cropData.stage === "fruiting") {
        recommendedTreatments.push({
          name: "DAP",
          type: "fertilizer",
          dosage: "30-50 kg per hectare",
          frequency: "Every 20-25 days",
          cost: 350,
          effectiveness: 80,
          environmentalImpact: 45,
          notes: "Promotes flowering and fruiting"
        });
      }
      
      // Calculate total cost and effectiveness
      const totalCost = recommendedTreatments.reduce((sum, treatment) => sum + treatment.cost, 0);
      const expectedEffectiveness = recommendedTreatments.reduce((sum, treatment) => sum + treatment.effectiveness, 0) / recommendedTreatments.length;
      const environmentalImpact = recommendedTreatments.reduce((sum, treatment) => sum + treatment.environmentalImpact, 0) / recommendedTreatments.length;
      
      // Generate application schedule
      const applicationSchedule = [];
      const today = new Date();
      
      for (let i = 0; i < 4; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + (i * 7));
        
        applicationSchedule.push({
          date: date.toISOString().split('T')[0],
          treatments: recommendedTreatments.map(t => t.name),
          notes: `Apply all recommended treatments`
        });
      }
      
      // Create treatment plan
      const newTreatmentPlan: TreatmentPlan = {
        id: `plan_${Date.now()}`,
        timestamp: new Date().toISOString(),
        crop: cropData,
        weather: weatherData,
        resources: resourceData,
        recommendedTreatments,
        totalCost,
        expectedEffectiveness,
        environmentalImpact,
        applicationSchedule
      };
      
      setTreatmentPlan(newTreatmentPlan);
      setTreatmentHistory(prev => [newTreatmentPlan, ...prev]);
      setLoading(false);
      
      toast({
        title: "Treatment Plan Generated",
        description: "Your optimized treatment plan is ready!",
        variant: "default",
      });
    }, 2000);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-kisan-green dark:text-kisan-green-light">AI Treatment Optimizer</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Get personalized treatment recommendations based on your crop, weather, and available resources
          </p>
        </div>
        
        <Tabs defaultValue="optimizer" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="optimizer" className="flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Treatment Optimizer
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Treatment History
            </TabsTrigger>
            <TabsTrigger value="howto" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              How to Use
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="optimizer">
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Crop Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Sprout className="h-5 w-5 text-kisan-green" />
                      Crop Information
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="crop">Crop Type</Label>
                      <Select 
                        value={cropData.name} 
                        onValueChange={(value) => handleCropChange("name", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select crop" />
                        </SelectTrigger>
                        <SelectContent>
                          {cropOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="stage">Growth Stage</Label>
                      <Select 
                        value={cropData.stage} 
                        onValueChange={(value) => handleCropChange("stage", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select growth stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {cropStageOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="plantedDate">Planted Date</Label>
                      <Input 
                        type="date" 
                        id="plantedDate" 
                        value={cropData.plantedDate} 
                        onChange={(e) => handleCropChange("plantedDate", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="expectedHarvestDate">Expected Harvest Date</Label>
                      <Input 
                        type="date" 
                        id="expectedHarvestDate" 
                        value={cropData.expectedHarvestDate} 
                        onChange={(e) => handleCropChange("expectedHarvestDate", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="area">Crop Area (hectares)</Label>
                      <Input 
                        type="number" 
                        id="area" 
                        min="0.1" 
                        step="0.1" 
                        value={cropData.area} 
                        onChange={(e) => handleCropChange("area", parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  {/* Weather Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Cloud className="h-5 w-5 text-kisan-green" />
                      Weather Information
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature (°C)</Label>
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-gray-500" />
                        <Slider 
                          id="temperature" 
                          min={10} 
                          max={40} 
                          step={1} 
                          value={[weatherData.temperature]} 
                          onValueChange={(value) => handleWeatherChange("temperature", value[0])}
                        />
                        <span className="text-sm font-medium">{weatherData.temperature}°C</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="humidity">Humidity (%)</Label>
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-gray-500" />
                        <Slider 
                          id="humidity" 
                          min={20} 
                          max={100} 
                          step={5} 
                          value={[weatherData.humidity]} 
                          onValueChange={(value) => handleWeatherChange("humidity", value[0])}
                        />
                        <span className="text-sm font-medium">{weatherData.humidity}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rainfall">Rainfall (mm)</Label>
                      <Input 
                        type="number" 
                        id="rainfall" 
                        min="0" 
                        step="1" 
                        value={weatherData.rainfall} 
                        onChange={(e) => handleWeatherChange("rainfall", parseFloat(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="windSpeed">Wind Speed (km/h)</Label>
                      <Input 
                        type="number" 
                        id="windSpeed" 
                        min="0" 
                        step="1" 
                        value={weatherData.windSpeed} 
                        onChange={(e) => handleWeatherChange("windSpeed", parseFloat(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="forecast">Weather Forecast</Label>
                      <Select 
                        value={weatherData.forecast} 
                        onValueChange={(value) => handleWeatherChange("forecast", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select forecast" />
                        </SelectTrigger>
                        <SelectContent>
                          {forecastOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Available Resources */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Package className="h-5 w-5 text-kisan-green" />
                      Available Resources
                    </h3>
                    
                    <div className="space-y-2">
                      <Label>Organic Pesticides</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                        {organicPesticideOptions.map(option => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`organic_${option.value}`} 
                              checked={resourceData.organicPesticides.includes(option.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleResourceChange("organicPesticides", [...resourceData.organicPesticides, option.value]);
                                } else {
                                  handleResourceChange("organicPesticides", resourceData.organicPesticides.filter(item => item !== option.value));
                                }
                              }}
                            />
                            <Label htmlFor={`organic_${option.value}`} className="text-sm">
                              {option.label} (₹{option.cost})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Chemical Pesticides</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                        {chemicalPesticideOptions.map(option => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`chemical_${option.value}`} 
                              checked={resourceData.chemicalPesticides.includes(option.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleResourceChange("chemicalPesticides", [...resourceData.chemicalPesticides, option.value]);
                                } else {
                                  handleResourceChange("chemicalPesticides", resourceData.chemicalPesticides.filter(item => item !== option.value));
                                }
                              }}
                            />
                            <Label htmlFor={`chemical_${option.value}`} className="text-sm">
                              {option.label} (₹{option.cost})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Fertilizers</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                        {fertilizerOptions.map(option => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`fertilizer_${option.value}`} 
                              checked={resourceData.fertilizers.includes(option.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleResourceChange("fertilizers", [...resourceData.fertilizers, option.value]);
                                } else {
                                  handleResourceChange("fertilizers", resourceData.fertilizers.filter(item => item !== option.value));
                                }
                              }}
                            />
                            <Label htmlFor={`fertilizer_${option.value}`} className="text-sm">
                              {option.label} (₹{option.cost})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Equipment</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                        {equipmentOptions.map(option => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`equipment_${option.value}`} 
                              checked={resourceData.equipment.includes(option.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleResourceChange("equipment", [...resourceData.equipment, option.value]);
                                } else {
                                  handleResourceChange("equipment", resourceData.equipment.filter(item => item !== option.value));
                                }
                              }}
                            />
                            <Label htmlFor={`equipment_${option.value}`} className="text-sm">
                              {option.label} (₹{option.cost})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget (₹)</Label>
                      <Input 
                        type="number" 
                        id="budget" 
                        min="100" 
                        step="100" 
                        value={resourceData.budget} 
                        onChange={(e) => handleResourceChange("budget", parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={generateTreatmentPlan} 
                    className="bg-kisan-green hover:bg-kisan-green-dark text-white"
                    disabled={loading || !cropData.name || !cropData.stage}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Plan...
                      </>
                    ) : (
                      <>
                        <Leaf className="mr-2 h-4 w-4" />
                        Generate Treatment Plan
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Treatment Plan Results */}
            {treatmentPlan && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-kisan-green" />
                    Recommended Treatment Plan
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Total Cost</h4>
                      <p className="text-2xl font-bold text-kisan-green">₹{treatmentPlan.totalCost}</p>
                      <p className="text-sm text-gray-500">Within budget: {treatmentPlan.totalCost <= resourceData.budget ? 'Yes' : 'No'}</p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Expected Effectiveness</h4>
                      <p className="text-2xl font-bold text-kisan-green">{treatmentPlan.expectedEffectiveness.toFixed(0)}%</p>
                      <p className="text-sm text-gray-500">Based on treatment combinations</p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Environmental Impact</h4>
                      <p className="text-2xl font-bold text-kisan-green">{treatmentPlan.environmentalImpact.toFixed(0)}%</p>
                      <p className="text-sm text-gray-500">Lower is better</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Recommended Treatments</h4>
                      <div className="space-y-4">
                        {treatmentPlan.recommendedTreatments.map((treatment, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium">{treatment.name}</h5>
                                <Badge variant={treatment.type === "organic" ? "outline" : treatment.type === "chemical" ? "destructive" : "secondary"}>
                                  {treatment.type}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">₹{treatment.cost}</p>
                                <p className="text-sm text-gray-500">Effectiveness: {treatment.effectiveness}%</p>
                              </div>
                            </div>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <p><span className="font-medium">Dosage:</span> {treatment.dosage}</p>
                              <p><span className="font-medium">Frequency:</span> {treatment.frequency}</p>
                            </div>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{treatment.notes}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Application Schedule</h4>
                      <div className="space-y-4">
                        {treatmentPlan.applicationSchedule.map((schedule, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium">{new Date(schedule.date).toLocaleDateString()}</h5>
                                <p className="text-sm text-gray-500">{schedule.notes}</p>
                              </div>
                              <Badge variant="outline">
                                <Calendar className="h-3 w-3 mr-1" />
                                Week {index + 1}
                              </Badge>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm font-medium">Treatments to apply:</p>
                              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                                {schedule.treatments.map((treatment, i) => (
                                  <li key={i}>{treatment}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardContent className="p-6">
                {treatmentHistory.length > 0 ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Previous Treatment Plans</h3>
                    
                    <div className="space-y-4">
                      {treatmentHistory.map((plan) => (
                        <div 
                          key={plan.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{plan.crop.name.charAt(0).toUpperCase() + plan.crop.name.slice(1)} - {plan.crop.stage.charAt(0).toUpperCase() + plan.crop.stage.slice(1)} Stage</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(plan.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <Badge variant="outline">
                              ₹{plan.totalCost}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            <p><span className="font-medium">Treatments:</span> {plan.recommendedTreatments.length}</p>
                            <p><span className="font-medium">Effectiveness:</span> {plan.expectedEffectiveness.toFixed(0)}%</p>
                            <p><span className="font-medium">Environmental Impact:</span> {plan.environmentalImpact.toFixed(0)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No Treatment History</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Your treatment plans will appear here once you generate them.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="howto">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">How to Use the AI Treatment Optimizer</h3>
                
                <ol className="space-y-4 list-decimal pl-5">
                  <li className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Enter crop information</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Select your crop type, growth stage, planting date, expected harvest date, and crop area.
                    </p>
                  </li>
                  <li className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Provide weather data</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Enter current temperature, humidity, rainfall, wind speed, and weather forecast.
                    </p>
                  </li>
                  <li className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Select available resources</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Check the organic pesticides, chemical pesticides, fertilizers, and equipment you have available.
                    </p>
                  </li>
                  <li className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Set your budget</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Enter the maximum amount you're willing to spend on treatments.
                    </p>
                  </li>
                  <li className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Generate treatment plan</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Click the "Generate Treatment Plan" button to get personalized recommendations.
                    </p>
                  </li>
                  <li className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Review and follow the plan</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Follow the recommended treatments and application schedule for optimal results.
                    </p>
                  </li>
                </ol>
                
                <div className="mt-6 p-4 bg-kisan-green/10 dark:bg-kisan-green/20 rounded-lg">
                  <h4 className="font-semibold text-kisan-green dark:text-kisan-gold mb-2">Pro Tips</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>Organic treatments are preferred for environmental sustainability</li>
                    <li>Consider weather conditions before applying treatments</li>
                    <li>Follow the application schedule for best results</li>
                    <li>Monitor crop response and adjust treatments as needed</li>
                    <li>Keep records of treatments and their effectiveness</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <CustomFooter />
    </div>
  );
};

export default TreatmentOptimizer; 