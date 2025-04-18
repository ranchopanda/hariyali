
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import StatisticsSection from "@/components/StatisticsSection";
import CallToAction from "@/components/CallToAction";
import CustomFooter from "@/components/CustomFooter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, Map, CloudRain, BarChart3, Thermometer, Camera, LayoutGrid, Wheat, Sprout } from "lucide-react";

const Index = () => {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const featuredCrops = [
    {
      name: "Rice",
      description: "India's staple food crop, grown mainly in the monsoon season.",
      icon: <Sprout className="h-10 w-10 text-kisan-green dark:text-kisan-gold" />,
      image: "https://source.unsplash.com/random/300x200/?rice,paddy",
      action: () => navigate("/crop-info")
    },
    {
      name: "Wheat",
      description: "A major rabi crop grown during winter months across northern India.",
      icon: <Wheat className="h-10 w-10 text-kisan-green dark:text-kisan-gold" />,
      image: "https://source.unsplash.com/random/300x200/?wheat",
      action: () => navigate("/crop-info")
    },
    {
      name: "Cotton",
      description: "India is one of the world's largest producers of cotton.",
      icon: <Sprout className="h-10 w-10 text-kisan-green dark:text-kisan-gold" />,
      image: "https://source.unsplash.com/random/300x200/?cotton,field",
      action: () => navigate("/crop-info")
    },
    {
      name: "Sugarcane",
      description: "Perennial crop that's vital for sugar production and byproducts.",
      icon: <Leaf className="h-10 w-10 text-kisan-green dark:text-kisan-gold" />,
      image: "https://source.unsplash.com/random/300x200/?sugarcane",
      action: () => navigate("/crop-info")
    }
  ];

  const aiTools = [
    {
      title: "Plant Disease Detection",
      description: "Upload images of your crops to identify diseases and get treatment recommendations.",
      icon: <Camera className="h-12 w-12 p-2 bg-green-100 text-green-600 rounded-lg" />,
      color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      action: () => navigate("/disease-detection")
    },
    {
      title: "Weather Forecasting",
      description: "Get accurate weather predictions for your specific location to plan farming activities.",
      icon: <CloudRain className="h-12 w-12 p-2 bg-blue-100 text-blue-600 rounded-lg" />,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      action: () => navigate("/weather")
    },
    {
      title: "Soil Analysis",
      description: "Analyze soil composition using AI to determine optimal crops and fertilizers.",
      icon: <Map className="h-12 w-12 p-2 bg-amber-100 text-amber-600 rounded-lg" />,
      color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      action: () => navigate("/soil-analysis")
    },
    {
      title: "Yield Prediction",
      description: "Predict crop yields based on weather, soil, and farming practices data.",
      icon: <BarChart3 className="h-12 w-12 p-2 bg-purple-100 text-purple-600 rounded-lg" />,
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      action: () => navigate("/yield-prediction")
    },
    {
      title: "Crop Information",
      description: "Access detailed information about various crops, growing methods, and market trends.",
      icon: <LayoutGrid className="h-12 w-12 p-2 bg-indigo-100 text-indigo-600 rounded-lg" />,
      color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
      action: () => navigate("/crop-info")
    },
    {
      title: "Temperature Monitoring",
      description: "Monitor temperature trends and get alerts for extreme conditions affecting crops.",
      icon: <Thermometer className="h-12 w-12 p-2 bg-red-100 text-red-600 rounded-lg" />,
      color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
      action: () => navigate("/weather")
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <HeroSection />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-kisan-green dark:text-kisan-gold mb-3">
              AI-Powered Agriculture Tools
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our cutting-edge AI technology helps farmers make data-driven decisions, 
              increase productivity, and achieve sustainable agriculture practices.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aiTools.map((tool, index) => (
              <Card 
                key={index} 
                className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <CardHeader className="p-6">
                  <div className={`rounded-lg inline-block mb-3 ${tool.color}`}>
                    {tool.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
                    {tool.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-0 pb-6 px-6">
                  <Button 
                    onClick={tool.action}
                    className="w-full bg-kisan-green hover:bg-kisan-green-dark text-white dark:bg-kisan-green-dark dark:hover:bg-kisan-green"
                  >
                    Try Now
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
        
        <div className="bg-kisan-green/5 dark:bg-kisan-green/10 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-kisan-green dark:text-kisan-gold mb-3">
                Featured Crops
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Browse information about India's major crops, including growing methods, 
                disease prevention, and market insights.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCrops.map((crop, index) => (
                <Card 
                  key={index} 
                  className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={crop.image} 
                      alt={crop.name} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
                    />
                  </div>
                  <CardHeader className="p-4">
                    <div className="flex items-center space-x-3">
                      {crop.icon}
                      <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
                        {crop.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {crop.description}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4">
                    <Button 
                      variant="outline" 
                      onClick={crop.action}
                      className="w-full border-kisan-green text-kisan-green hover:bg-kisan-green hover:text-white dark:border-kisan-gold dark:text-kisan-gold dark:hover:bg-kisan-gold/20"
                    >
                      Learn More
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <Button 
                onClick={() => navigate("/crop-info")}
                variant="outline"
                className="border-kisan-green text-kisan-green hover:bg-kisan-green hover:text-white dark:border-kisan-gold dark:text-kisan-gold dark:hover:bg-kisan-gold/20"
              >
                View All Crops
              </Button>
            </div>
          </div>
        </div>
        
        <FeaturesSection />
        <TestimonialsSection />
        <StatisticsSection />
        <CallToAction />
      </main>
      
      <CustomFooter />
    </div>
  );
};

export default Index;
