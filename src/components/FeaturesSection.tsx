
import { useNavigate } from "react-router-dom";
import FeatureCard from "@/components/FeatureCard";
import { Camera, Cloud, BookOpen, LineChart, Sprout, MessageSquare } from "lucide-react";

const FeaturesSection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4 text-kisan-green dark:text-kisan-gold">
            Features to Empower Indian Farmers
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Our AI tools are designed specifically for Indian agriculture, providing solutions for common farming challenges.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            title="Disease Detection"
            description="Instant identification of plant diseases from photos, with treatment recommendations tailored for Indian crops."
            icon={<Camera className="h-7 w-7 text-kisan-green dark:text-kisan-gold" />}
            onClick={() => navigate('/disease-detection')}
          />
          
          <FeatureCard
            title="Weather Forecast"
            description="Accurate local weather predictions and alerts to help plan farming activities effectively."
            icon={<Cloud className="h-7 w-7 text-kisan-green dark:text-kisan-gold" />}
            onClick={() => navigate('/weather')}
          />
          
          <FeatureCard
            title="Crop Information"
            description="Comprehensive guide to crops suited for different Indian regions, with cultivation tips."
            icon={<BookOpen className="h-7 w-7 text-kisan-green dark:text-kisan-gold" />}
            onClick={() => navigate('/crop-info')}
          />
          
          <FeatureCard
            title="Yield Prediction"
            description="AI-powered prediction of crop yields based on soil, weather, and cultivation practices."
            icon={<LineChart className="h-7 w-7 text-kisan-green dark:text-kisan-gold" />}
            onClick={() => navigate('/yield-prediction')}
          />
          
          <FeatureCard
            title="Soil Analysis"
            description="Recommendations for soil health improvement and appropriate fertilizers by capturing soil images."
            icon={<Sprout className="h-7 w-7 text-kisan-green dark:text-kisan-gold" />}
            onClick={() => navigate('/soil-analysis')}
          />
          
          <FeatureCard
            title="Expert Advice"
            description="Connect with agricultural experts for personalized guidance on farming challenges."
            icon={<MessageSquare className="h-7 w-7 text-kisan-green dark:text-kisan-gold" />}
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
