import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import CustomFooter from "@/components/CustomFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Camera, Loader2, Info, ArrowRight, X, AlertTriangle, Microscope, History, BookOpen, Image, Flower2, Bug, BarChart2, Search, Wrench, Sprout, CheckCircle, HelpCircle, Lightbulb, Zap, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CameraCapture from "@/components/CameraCapture";
import { 
  analyzePlantDisease, 
  imageToBase64, 
  imagesToBase64,
  storeAnalysisData, 
  getAnalysisHistory,
  DiseaseDetectionResult,
  AnalysisHistoryItem
} from "@/utils/geminiAI";

interface DetectionResult {
  disease_name: string;
  confidence: number;
  crop_name: string;
  pathogen: string;
  severity_level: 'High' | 'Moderate' | 'Low';
  symptoms: string[];
  action_plan: string[];
  organic_treatment: string[];
  chemical_treatment: string[];
  faqs: { question: string; answer: string }[];
  pro_tips: string[];
  rescan_reminder?: number;
}

const DiseaseDetection = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rescanTimer, setRescanTimer] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<DetectionResult[]>([]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      processNewImages(newFiles);
    }
  };

  const handleCameraCapture = (file: File) => {
    try {
      console.log("Camera capture successful:", file);
      processNewImages([file]);
      setShowCamera(false);
      setCameraError(null);
    } catch (error) {
      console.error("Error processing camera capture:", error);
      toast({
        title: "Camera Error",
        description: "Failed to process the captured image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCameraError = (error: string) => {
    console.error("Camera error:", error);
    setCameraError(error);
    toast({
      title: "Camera Error",
      description: error,
      variant: "destructive",
    });
  };

  const processNewImages = (newFiles: File[]) => {
    // Limit to 5 images maximum
    const filesToAdd = newFiles.slice(0, 5 - images.length);
    
    if (filesToAdd.length === 0) {
      toast({
        title: "Maximum Images Reached",
        description: "You can upload up to 5 images for analysis",
        variant: "destructive",
      });
      return;
    }
    
    setImages(prev => [...prev, ...filesToAdd]);
    
    // Create previews for the new images
    const newPreviews: string[] = [];
    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    setResult(null);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearImages = () => {
    setImages([]);
    setPreviews([]);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeImage = async () => {
    if (images.length === 0) {
      toast({
        title: "No Images Selected",
        description: "Please select at least one image first",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    setIsLoading(true);
    try {
      // Convert all images to base64 using the batch function
      const base64Images = await imagesToBase64(images);
      
      // Analyze all images
      const apiResult = await analyzePlantDisease(base64Images);
      
      // Use the API result directly
      setResult(apiResult);
      
      // Set rescan timer if available in the API result
      if (apiResult.rescan_reminder) {
        setRescanTimer(apiResult.rescan_reminder);
      }
      
      // Store the analysis data using the utility function
      await storeAnalysisData(apiResult, "disease_detection");
      
      toast({
        title: "Analysis Complete",
        description: `Your plant has been analyzed successfully using ${images.length} image(s)!`,
        variant: "default",
      });

      setAnalysisResults([apiResult]);
    } catch (error) {
      console.error('Error analyzing images:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const uploadToServer = () => {
    if (images.length === 0) {
      toast({
        title: "No Images Selected",
        description: "Please upload at least one image first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!result) {
      toast({
        title: "Analysis Required",
        description: "Please analyze the images before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    // Create a FormData object to send multiple images
    const formData = new FormData();
    images.forEach((img, index) => {
      formData.append(`image${index}`, img);
    });
    
    // Add the analysis result
    formData.append('analysis', JSON.stringify(result));
    
    // Simulate server upload (replace with actual API call)
    setTimeout(() => {
      setIsUploading(false);
      toast({
        title: "Upload Successful",
        description: "Your images and analysis have been submitted for expert review.",
        variant: "default",
      });
    }, 1500);
  };

  const getConfidenceLevel = (confidence: number): string => {
    if (confidence < 60) return "Low";
    if (confidence < 80) return "Moderate";
    return "High";
  };

  const getPlantName = (diseaseName: string): string => {
    const plantMap: Record<string, string> = {
      "Black Spot": "Rose",
      "Powdery Mildew": "Cucumber",
      "Rust": "Wheat",
      "Blight": "Tomato",
      "Mosaic Virus": "Tobacco",
      "Brown Spot": "Bean",
      "Yellow Spot": "Corn",
      "Brown Leaf Spot": "Rice",
      "Leaf Spot": "Rice"
    };
    return plantMap[diseaseName] || "Plant";
  };

  const getBotanicalName = (diseaseName: string): string => {
    const botanicalMap: Record<string, string> = {
      "Black Spot": "Rosa spp.",
      "Powdery Mildew": "Cucumis sativus",
      "Rust": "Triticum aestivum",
      "Blight": "Solanum lycopersicum",
      "Mosaic Virus": "Nicotiana tabacum",
      "Brown Spot": "Phaseolus vulgaris",
      "Yellow Spot": "Zea mays",
      "Brown Leaf Spot": "Oryza sativa",
      "Leaf Spot": "Oryza sativa"
    };
    return botanicalMap[diseaseName] || "Unknown";
  };

  const getLatinName = (diseaseName: string): string => {
    const latinMap: Record<string, string> = {
      "Black Spot": "Diplocarpon rosae",
      "Powdery Mildew": "Erysiphe cichoracearum",
      "Rust": "Puccinia graminis",
      "Blight": "Phytophthora infestans",
      "Mosaic Virus": "Tobacco mosaic virus",
      "Brown Spot": "Alternaria alternata",
      "Yellow Spot": "Cochliobolus heterostrophus",
      "Brown Leaf Spot": "Cochliobolus miyabeanus",
      "Leaf Spot": "Magnaporthe oryzae"
    };
    return latinMap[diseaseName] || "Unknown pathogen";
  };

  const getSymptoms = (diseaseName: string): string[] => {
    const symptomsMap: Record<string, string[]> = {
      "Black Spot": [
        "Circular black spots with fringed margins on leaves",
        "Yellow halos around the spots",
        "Leaves turn yellow and fall off",
        "Stems may develop black lesions"
      ],
      "Powdery Mildew": [
        "White or gray powdery spots on leaves, stems, and fruits",
        "Leaves may turn yellow and eventually die",
        "Stunted growth and reduced yield",
        "Fruits may be deformed or have poor quality"
      ],
      "Rust": [
        "Orange, yellow, or brown pustules on leaves, stems, or fruits",
        "Pustules contain spores that can spread the disease",
        "Leaves may turn yellow and fall off",
        "Stems may be weakened and break easily"
      ],
      "Blight": [
        "Brown or black spots on leaves, stems, or fruits",
        "Wilting and death of plant tissue",
        "Rapid spread throughout the plant",
        "Fruits may develop dark, sunken lesions"
      ],
      "Mosaic Virus": [
        "Mottled or mosaic pattern of light and dark green or yellow on leaves",
        "Stunted plant growth",
        "Reduced yield",
        "Leaves may be distorted or curled"
      ],
      "Brown Spot": [
        "Brown or tan spots on leaves with yellow halos",
        "Spots may coalesce to form larger patches",
        "Leaves may turn yellow and fall off",
        "Stems may develop brown lesions"
      ],
      "Yellow Spot": [
        "Yellow or chlorotic spots on leaves",
        "Spots may be caused by nutrient deficiencies or viral infections",
        "Leaves may turn completely yellow",
        "Stunted growth and reduced yield"
      ],
      "Brown Leaf Spot": [
        "Brown or tan spots on leaves with yellow halos",
        "Spots may coalesce to form larger patches",
        "Leaves may turn yellow and fall off",
        "Stems may develop brown lesions"
      ],
      "Leaf Spot": [
        "Diamond-shaped lesions with gray centers and brown margins on leaves",
        "Lesions may coalesce to form larger patches",
        "Infected panicles may have dark brown to black spots",
        "Grains may be discolored or empty"
      ]
    };
    return symptomsMap[diseaseName] || ["Unknown symptoms"];
  };

  const getCropRotation = (diseaseName: string): string => {
    const rotationMap: Record<string, string> = {
      "Black Spot": "Don't plant roses in the same location for at least 3 years.",
      "Powdery Mildew": "Rotate with non-host crops like legumes or grains.",
      "Rust": "Use a 3-year rotation with non-cereal crops.",
      "Blight": "Don't plant tomatoes or potatoes in the same location for at least 3 years.",
      "Mosaic Virus": "Remove infected plants and don't replant in the same location.",
      "Brown Spot": "Rotate with non-host crops like grains or root vegetables.",
      "Yellow Spot": "Rotate with non-host crops like legumes or vegetables.",
      "Brown Leaf Spot": "Don't plant rice continuously—use non-host crops like legumes, vegetables, or other cereals.",
      "Leaf Spot": "Don't plant rice continuously—use non-host crops like legumes, vegetables, or other cereals."
    };
    return rotationMap[diseaseName] || "Practice crop rotation with non-host plants.";
  };

  const getOrganicTreatments = (diseaseName: string): string[] => {
    const organicMap: Record<string, string[]> = {
      "Black Spot": [
        "Neem Oil Spray: 5 ml neem oil + 1 L water; spray every 7–10 days",
        "Baking soda solution: Mix 1 tablespoon baking soda, 1 teaspoon liquid soap, and 1 gallon water",
        "Milk solution: Mix 1 part milk with 9 parts water and spray every 7-10 days"
      ],
      "Powdery Mildew": [
        "Milk solution: Mix 1 part milk with 9 parts water and spray every 7-10 days",
        "Baking soda solution: Mix 1 tablespoon baking soda, 1 teaspoon liquid soap, and 1 gallon water",
        "Sulfur-based fungicides: Apply according to label instructions"
      ],
      "Rust": [
        "Neem Oil Spray: 5 ml neem oil + 1 L water; spray every 7–10 days",
        "Baking soda solution: Mix 1 tablespoon baking soda, 1 teaspoon liquid soap, and 1 gallon water",
        "Garlic extract: Blend garlic cloves with water, strain, and spray"
      ],
      "Blight": [
        "Copper-based fungicides: Apply according to label instructions",
        "Biological control: Bacillus subtilis products",
        "Compost tea: Brew compost in water and spray on plants"
      ],
      "Mosaic Virus": [
        "There is no cure for viral diseases. Remove infected plants to prevent spread.",
        "Control insect vectors with insecticidal soap or neem oil",
        "Use reflective mulches to deter aphids"
      ],
      "Brown Spot": [
        "Neem Oil Spray: 5 ml neem oil + 1 L water; spray every 7–10 days",
        "Baking soda solution: Mix 1 tablespoon baking soda, 1 teaspoon liquid soap, and 1 gallon water",
        "Garlic extract: Blend garlic cloves with water, strain, and spray"
      ],
      "Yellow Spot": [
        "Fertilize with balanced NPK fertilizer",
        "Apply micronutrients if deficient",
        "Neem oil: Mix 2 tablespoons in 1 gallon of water and spray every 7-10 days"
      ],
      "Brown Leaf Spot": [
        "Neem Oil Spray: 5 ml neem oil + 1 L water; spray every 7–10 days",
        "Baking soda solution: Mix 1 tablespoon baking soda, 1 teaspoon liquid soap, and 1 gallon water",
        "Garlic extract: Blend garlic cloves with water, strain, and spray"
      ],
      "Leaf Spot": [
        "Neem Oil Spray: 5 ml neem oil + 1 L water; spray every 7–10 days",
        "Bacillus thuringiensis (Bt): Apply at sunset; avoid rain",
        "Spinosad: Effective against larvae"
      ]
    };
    return organicMap[diseaseName] || ["Use organic treatments appropriate for the disease."];
  };

  const getChemicalTreatments = (diseaseName: string): string[] => {
    const chemicalMap: Record<string, string[]> = {
      "Black Spot": [
        "Fungicides containing chlorothalonil or mancozeb",
        "Systemic fungicides like tebuconazole or myclobutanil",
        "Apply according to label instructions"
      ],
      "Powdery Mildew": [
        "Fungicides containing sulfur or potassium bicarbonate",
        "Systemic fungicides like myclobutanil or trifloxystrobin",
        "Apply according to label instructions"
      ],
      "Rust": [
        "Fungicides containing chlorothalonil or mancozeb",
        "Systemic fungicides like tebuconazole or propiconazole",
        "Apply according to label instructions"
      ],
      "Blight": [
        "Copper-based fungicides: Apply according to label instructions",
        "Systemic fungicides like metalaxyl or fosetyl-aluminum",
        "Apply according to label instructions"
      ],
      "Mosaic Virus": [
        "There is no chemical cure for viral diseases",
        "Control insect vectors with insecticides",
        "Remove and destroy infected plants"
      ],
      "Brown Spot": [
        "Fungicides containing chlorothalonil or mancozeb",
        "Systemic fungicides like tebuconazole or myclobutanil",
        "Apply according to label instructions"
      ],
      "Yellow Spot": [
        "Fertilize with balanced NPK fertilizer",
        "Apply micronutrients if deficient",
        "Fungicides if fungal infection is suspected"
      ],
      "Brown Leaf Spot": [
        "Fungicides containing chlorothalonil or mancozeb",
        "Systemic fungicides like tebuconazole or myclobutanil",
        "Apply according to label instructions"
      ],
      "Leaf Spot": [
        "Indoxacarb: Rotate with other insecticides to prevent resistance; follow label instructions",
        "Tricyclazole: Apply at early stages of disease development",
        "Apply according to label instructions"
      ]
    };
    return chemicalMap[diseaseName] || ["Use chemical treatments appropriate for the disease."];
  };

  const getFAQs = (diseaseName: string): { question: string; answer: string }[] => {
    const faqMap: Record<string, { question: string; answer: string }[]> = {
      "Black Spot": [
        {
          question: "Can I still harvest?",
          answer: "If damage is low and treated early—yes, though yield may dip."
        },
        {
          question: "Will disease return next season?",
          answer: "Yes, unless you remove infected leaves and practice good sanitation."
        },
        {
          question: "Harmful to humans?",
          answer: "No, only plant-specific."
        },
        {
          question: "Best time to spray?",
          answer: "Early morning or evening when conditions are dry."
        }
      ],
      "Powdery Mildew": [
        {
          question: "Can I still harvest?",
          answer: "If damage is low and treated early—yes, though quality may be affected."
        },
        {
          question: "Will disease return next season?",
          answer: "Yes, unless you improve air circulation and practice good sanitation."
        },
        {
          question: "Harmful to humans?",
          answer: "No, only plant-specific."
        },
        {
          question: "Best time to spray?",
          answer: "Early morning or evening when conditions are dry."
        }
      ],
      "Rust": [
        {
          question: "Can I still harvest?",
          answer: "If damage is low and treated early—yes, though yield may dip."
        },
        {
          question: "Will disease return next season?",
          answer: "Yes, unless you remove infected plants and practice crop rotation."
        },
        {
          question: "Harmful to humans?",
          answer: "No, only plant-specific."
        },
        {
          question: "Best time to spray?",
          answer: "Early morning or evening when conditions are dry."
        }
      ],
      "Blight": [
        {
          question: "Can I still harvest?",
          answer: "If damage is low and treated early—yes, though yield may dip significantly."
        },
        {
          question: "Will disease return next season?",
          answer: "Yes, unless you remove infected plants and practice crop rotation."
        },
        {
          question: "Harmful to humans?",
          answer: "No, only plant-specific."
        },
        {
          question: "Best time to spray?",
          answer: "Early morning or evening when conditions are dry."
        }
      ],
      "Mosaic Virus": [
        {
          question: "Can I still harvest?",
          answer: "If damage is low—yes, though yield and quality will be affected."
        },
        {
          question: "Will disease return next season?",
          answer: "Yes, unless you remove infected plants and control insect vectors."
        },
        {
          question: "Harmful to humans?",
          answer: "No, only plant-specific."
        },
        {
          question: "Can it be cured?",
          answer: "No, viral diseases cannot be cured. Remove infected plants."
        }
      ],
      "Brown Spot": [
        {
          question: "Can I still harvest?",
          answer: "If damage is low and treated early—yes, though yield may dip."
        },
        {
          question: "Will disease return next season?",
          answer: "Yes, unless you remove infected leaves and practice good sanitation."
        },
        {
          question: "Harmful to humans?",
          answer: "No, only plant-specific."
        },
        {
          question: "Best time to spray?",
          answer: "Early morning or evening when conditions are dry."
        }
      ],
      "Yellow Spot": [
        {
          question: "Can I still harvest?",
          answer: "If damage is low and treated early—yes, though yield may dip."
        },
        {
          question: "Will disease return next season?",
          answer: "Yes, unless you address nutrient deficiencies and practice good sanitation."
        },
        {
          question: "Harmful to humans?",
          answer: "No, only plant-specific."
        },
        {
          question: "Best time to spray?",
          answer: "Early morning or evening when conditions are dry."
        }
      ],
      "Brown Leaf Spot": [
        {
          question: "Can I still harvest?",
          answer: "If damage is low and treated early—yes, though yield may dip."
        },
        {
          question: "Will disease return next season?",
          answer: "Yes, unless you remove infected leaves and practice good sanitation."
        },
        {
          question: "Harmful to humans?",
          answer: "No, only plant-specific."
        },
        {
          question: "Best time to spray?",
          answer: "Early morning or evening when conditions are dry."
        }
      ],
      "Leaf Spot": [
        {
          question: "Can I still harvest?",
          answer: "If damage is low and treated early—yes, though yield may dip."
        },
        {
          question: "Will pests return next season?",
          answer: "Yes, unless you rotate crops and keep fields clean."
        },
        {
          question: "Harmful to humans?",
          answer: "No, only plant-specific."
        },
        {
          question: "Best time to spray?",
          answer: "Early morning or evening when larvae are most active."
        }
      ]
    };
    return faqMap[diseaseName] || [
      {
        question: "Can I still harvest?",
        answer: "If damage is low and treated early—yes, though yield may dip."
      },
      {
        question: "Will disease return next season?",
        answer: "Yes, unless you practice good sanitation and crop rotation."
      },
      {
        question: "Harmful to humans?",
        answer: "No, only plant-specific."
      },
      {
        question: "Best time to spray?",
        answer: "Early morning or evening when conditions are dry."
      }
    ];
  };

  const getProTips = (diseaseName: string): string[] => {
    const tipsMap: Record<string, string[]> = {
      "Black Spot": [
        "Remove and destroy infected leaves early in the season",
        "Improve air circulation around plants",
        "Water at the base of plants to avoid wetting foliage",
        "Keep a treatment log to learn season by season"
      ],
      "Powdery Mildew": [
        "Remove and destroy infected plant parts early",
        "Improve air circulation around plants",
        "Avoid overhead watering",
        "Keep a treatment log to learn season by season"
      ],
      "Rust": [
        "Remove and destroy infected plant parts early",
        "Improve air circulation around plants",
        "Avoid overhead watering",
        "Keep a treatment log to learn season by season"
      ],
      "Blight": [
        "Remove and destroy infected plant parts early",
        "Improve air circulation around plants",
        "Avoid overhead watering",
        "Keep a treatment log to learn season by season"
      ],
      "Mosaic Virus": [
        "Remove and destroy infected plants immediately",
        "Control aphids and other insect vectors",
        "Use reflective mulches to deter aphids",
        "Keep a treatment log to learn season by season"
      ],
      "Brown Spot": [
        "Remove and destroy infected leaves early",
        "Improve air circulation around plants",
        "Avoid overhead watering",
        "Keep a treatment log to learn season by season"
      ],
      "Yellow Spot": [
        "Check for nutrient deficiencies and correct if necessary",
        "Remove and destroy infected leaves",
        "Improve air circulation around plants",
        "Keep a treatment log to learn season by season"
      ],
      "Brown Leaf Spot": [
        "Remove and destroy infected leaves early",
        "Improve air circulation around plants",
        "Avoid overhead watering",
        "Keep a treatment log to learn season by season"
      ],
      "Leaf Spot": [
        "Combine traps + neem for best organic control",
        "Avoid spraying during flowering unless essential",
        "Never mix chemicals without expert advice",
        "Keep a treatment log to learn season by season"
      ]
    };
    return tipsMap[diseaseName] || [
      "Remove and destroy infected plant parts early",
      "Improve air circulation around plants",
      "Avoid overhead watering",
      "Keep a treatment log to learn season by season"
    ];
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-kisan-green dark:text-kisan-green-light">Plant Disease Detection</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Upload images of your plants to detect diseases and get treatment recommendations
          </p>
        </div>
        
        <Tabs defaultValue="detection" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="detection" className="flex items-center gap-2">
              <Microscope className="h-4 w-4" />
              Disease Detection
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Detection History
            </TabsTrigger>
            <TabsTrigger value="howto" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              How to Use
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="detection">
            {showCamera ? (
              <div className="mb-6">
                <CameraCapture 
                  onCapture={handleCameraCapture} 
                  onClose={() => setShowCamera(false)} 
                />
              </div>
            ) : (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                    <Image className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Upload Plant Images</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Upload up to 5 images of your plant for disease detection
                    </p>
                    
                    <div className="flex flex-wrap gap-4 justify-center mb-4">
                      <Button
                        onClick={() => setShowCamera(true)}
                        className="bg-kisan-green hover:bg-kisan-green-dark text-white"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Take Photo
                      </Button>
                      
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Images
                      </Button>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    
                    {cameraError && (
                      <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
                        <p className="flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          {cameraError}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {previews.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Selected Images</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {previews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-md"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <Button
                          onClick={clearImages}
                          variant="outline"
                          className="mr-2"
                        >
                          Clear All
                        </Button>
                        <Button
                          onClick={analyzeImage}
                          className="bg-kisan-green hover:bg-kisan-green-dark text-white"
                          disabled={loading || images.length === 0}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Search className="mr-2 h-4 w-4" />
                              Analyze Images
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Results Display Section */}
                  {result && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-500 mr-2">Confidence:</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            result.confidence >= 90 ? 'bg-green-100 text-green-800' :
                            result.confidence >= 70 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {result.confidence}%
                          </span>
                        </div>
                        <button
                          onClick={clearImages}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Clear Images
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Crop Information</h3>
                          <p className="text-gray-600">{result.crop_name}</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Disease Information</h3>
                          <p className="text-gray-600">Disease: {result.disease_name}</p>
                          <p className="text-gray-600">Pathogen: {result.pathogen}</p>
                          <p className="text-gray-600">Severity: <span className={`font-medium ${
                            result.severity_level === 'High' ? 'text-red-600' :
                            result.severity_level === 'Moderate' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>{result.severity_level}</span></p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Symptoms</h3>
                          <ul className="list-disc list-inside text-gray-600">
                            {result.symptoms.map((symptom, index) => (
                              <li key={index}>{symptom}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Action Plan</h3>
                          <ul className="list-disc list-inside text-gray-600">
                            {result.action_plan.map((action, index) => (
                              <li key={index}>{action}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Treatment Options</h3>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-gray-800">Organic Treatment</h4>
                              <ul className="list-disc list-inside text-gray-600">
                                {result.organic_treatment.map((treatment, index) => (
                                  <li key={index}>{treatment}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">Chemical Treatment</h4>
                              <ul className="list-disc list-inside text-gray-600">
                                {result.chemical_treatment.map((treatment, index) => (
                                  <li key={index}>{treatment}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h3>
                          <div className="space-y-2">
                            {result.faqs.map((faq, index) => (
                              <div key={index} className="bg-gray-50 p-3 rounded">
                                <p className="font-medium text-gray-800">{faq.question}</p>
                                <p className="text-gray-600">{faq.answer}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Pro Tips</h3>
                          <ul className="list-disc list-inside text-gray-600">
                            {result.pro_tips.map((tip, index) => (
                              <li key={index}>{tip}</li>
                            ))}
                          </ul>
                        </div>

                        {result.rescan_reminder && (
                          <div className="bg-blue-50 p-4 rounded">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">Note:</span> Due to low confidence in the diagnosis, 
                              we recommend rescanning in {result.rescan_reminder} days for a more accurate assessment.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardContent className="p-6">
                {getAnalysisHistory("disease_detection").length > 0 ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Previous Detections</h3>
                    
                    <div className="space-y-4">
                      {getAnalysisHistory("disease_detection").map((item: AnalysisHistoryItem) => {
                        const diseaseData = item.data as DetectionResult;
                        if (!diseaseData || !diseaseData.disease_name) {
                          return null; // Skip invalid items
                        }
                        return (
                        <div 
                          key={item.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-medium">{diseaseData.disease_name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Confidence: {diseaseData.confidence}%
                              </p>
                            </div>
                            </div>
                          </div>
                        );
                      })}
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
          
          <TabsContent value="howto">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">How to Use Plant Disease Detection</h3>
                
                <ol className="space-y-4 list-decimal pl-5">
                  <li className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Take clear photos</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Ensure good lighting and focus on the affected plant parts (leaves, stems, fruits).
                    </p>
                  </li>
                  <li className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Upload the images</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Click on "Browse Files" to select images from your device or use the camera.
                    </p>
                  </li>
                  <li className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Analyze the images</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Our AI system powered by Gemini 1.5 Flash will analyze your plant images and identify potential diseases.
                    </p>
                  </li>
                  <li className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Review results</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      You'll receive information about the detected diseases, including description and treatment options.
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
      </main>
      
      <CustomFooter />
    </div>
  );
};

export default DiseaseDetection;
