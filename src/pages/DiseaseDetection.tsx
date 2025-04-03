
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Camera, ArrowLeft, AlertCircle, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DiseaseDetection = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setImage(event.target.result);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg');
          setImage(dataUrl);

          // Convert dataURL to Blob and then to File
          const byteString = atob(dataUrl.split(',')[1]);
          const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          const capturedFile = new File([blob], "captured-image.jpg", { type: "image/jpeg" });
          setFile(capturedFile);
        }

        // Stop all video tracks
        stream.getTracks().forEach(track => track.stop());
      }, 300);
    } catch (err) {
      toast({
        title: "Camera Access Error",
        description: "Could not access camera. Please check permissions or try uploading an image instead.",
        variant: "destructive"
      });
    }
  };

  const handleAnalyze = () => {
    if (!image) {
      toast({
        title: "No Image Selected",
        description: "Please upload or capture an image first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    // Mock API call - replace with actual API call to your backend
    setTimeout(() => {
      // Mock response data
      const mockResult = {
        disease_name: "Tomato Early Blight",
        confidence: 97.5,
        description: "Early blight is caused by the fungus Alternaria solani. It appears as dark brown spots with concentric rings forming a 'bull's eye' pattern on lower leaves first. Infected leaves turn yellow and drop. The disease thrives in warm, humid conditions.",
        economic_impact: {
          yield_loss_percentage: "15-25%",
          estimated_economic_loss_range_INR_per_hectare: "40,000 - 60,000",
          mitigation_cost_estimate_INR: "4,000 - 6,000"
        },
        recommended_actions: {
          organic_methods: [
            "Apply neem oil spray (15-20ml per liter of water) every 7-10 days",
            "Use copper-based organic fungicides like Bordeaux mixture (1%)",
            "Implement crop rotation with non-solanaceous crops for 2-3 years",
            "Mulch around plants to prevent soil splash onto leaves"
          ],
          chemical_methods: [
            "Apply mancozeb (2g/liter) or chlorothalonil (2ml/liter) at 10-day intervals",
            "Alternate with propineb (0.25%) for resistance management",
            "For severe cases, systemic fungicides like azoxystrobin"
          ],
          government_schemes: [
            "PM-KISAN Scheme: ₹6,000 annual financial support",
            "Pradhan Mantri Fasal Bima Yojana: Comprehensive crop insurance",
            "Mission for Integrated Development of Horticulture: Subsidies for quality planting material"
          ],
          general_advice: [
            "Remove and destroy infected leaves to prevent spread",
            "Ensure adequate spacing between plants for good air circulation",
            "Avoid overhead irrigation; use drip irrigation instead",
            "Plant resistant varieties in future seasons"
          ]
        }
      };

      setResult(mockResult);
      setLoading(false);
    }, 2000);
  };

  const handleReset = () => {
    setImage(null);
    setFile(null);
    setResult(null);
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
          <h1 className="text-3xl font-bold mb-6 text-kisan-green dark:text-kisan-gold">Plant Disease Detection</h1>
          
          <p className="mb-8 text-gray-600 dark:text-gray-300">
            Upload or capture a photo of your crop to instantly identify diseases and get treatment recommendations.
          </p>
          
          {!result ? (
            <Card>
              <CardContent className="p-6">
                {!image ? (
                  <div className="flex flex-col items-center">
                    <div className="mb-8 w-full max-w-md">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-kisan-green dark:hover:border-kisan-gold transition-colors">
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                          <Upload className="h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-lg font-medium mb-2">Upload Image</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Click to browse or drag and drop
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Supports JPG, PNG (Max 10MB)
                          </p>
                        </label>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="mb-3 text-gray-500">- or -</p>
                      <Button 
                        variant="outline" 
                        onClick={handleCapture}
                        className="border-kisan-green text-kisan-green dark:border-kisan-gold dark:text-kisan-gold"
                      >
                        <Camera className="mr-2 h-5 w-5" />
                        Capture Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="mb-4 relative">
                      <img 
                        src={image} 
                        alt="Selected crop" 
                        className="max-w-full max-h-[400px] rounded-lg object-contain"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Button onClick={handleReset} variant="outline">
                        Change Image
                      </Button>
                      <Button 
                        onClick={handleAnalyze} 
                        className="bg-kisan-green hover:bg-kisan-green-dark text-white"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          'Analyze Image'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <div className="mb-4">
                      <img 
                        src={image!} 
                        alt="Analyzed crop" 
                        className="w-full rounded-lg object-cover aspect-square"
                      />
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Analysis complete with {result.confidence.toFixed(1)}% confidence
                      </p>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <h2 className="text-2xl font-semibold mb-2 text-kisan-green dark:text-kisan-gold">
                      {result.disease_name}
                    </h2>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {result.description}
                    </p>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2 text-kisan-brown dark:text-kisan-gold-light">
                        Economic Impact
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Yield Loss</p>
                          <p className="text-lg font-medium text-orange-600 dark:text-orange-400">
                            {result.economic_impact.yield_loss_percentage}
                          </p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Est. Economic Loss</p>
                          <p className="text-lg font-medium text-red-600 dark:text-red-400">
                            ₹{result.economic_impact.estimated_economic_loss_range_INR_per_hectare}
                          </p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Treatment Cost</p>
                          <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                            ₹{result.economic_impact.mitigation_cost_estimate_INR}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2 text-kisan-brown dark:text-kisan-gold-light">
                        Recommended Actions
                      </h3>
                      
                      <div className="mb-4">
                        <h4 className="font-medium mb-1 text-kisan-green dark:text-kisan-green-light">
                          Organic Methods
                        </h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {result.recommended_actions.organic_methods.map((method: string, index: number) => (
                            <li key={index} className="text-gray-600 dark:text-gray-300 text-sm">
                              {method}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium mb-1 text-kisan-green dark:text-kisan-green-light">
                          Chemical Methods
                        </h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {result.recommended_actions.chemical_methods.map((method: string, index: number) => (
                            <li key={index} className="text-gray-600 dark:text-gray-300 text-sm">
                              {method}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1 text-kisan-green dark:text-kisan-green-light">
                          Government Schemes
                        </h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {result.recommended_actions.government_schemes.map((scheme: string, index: number) => (
                            <li key={index} className="text-gray-600 dark:text-gray-300 text-sm">
                              {scheme}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mb-6">
                      <div className="flex">
                        <AlertCircle className="text-amber-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                            Important Notice
                          </h4>
                          <p className="text-sm text-amber-700 dark:text-amber-200">
                            This analysis is provided as a guide only. For severe cases, please consult your local agricultural extension officer.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={handleReset} variant="outline">
                        Analyze Another Image
                      </Button>
                      <Button 
                        className="bg-kisan-green hover:bg-kisan-green-dark text-white"
                        onClick={() => {
                          toast({
                            title: "Report Saved",
                            description: "Disease detection report has been saved to your account."
                          });
                        }}
                      >
                        Save Report
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DiseaseDetection;
