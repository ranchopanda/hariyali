import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DiseaseDetection from "./pages/DiseaseDetection";
import Weather from "./pages/Weather";
import CropInfo from "./pages/CropInfo";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import SuccessStories from "./pages/SuccessStories";
import YieldPrediction from "./pages/YieldPrediction";
import SoilAnalysis from "./pages/SoilAnalysis";
import CameraTest from "./pages/CameraTest";
import TreatmentOptimizer from "./pages/TreatmentOptimizer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/disease-detection" element={<DiseaseDetection />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/crop-info" element={<CropInfo />} />
          <Route path="/about" element={<About />} />
          <Route path="/success-stories" element={<SuccessStories />} />
          <Route path="/yield-prediction" element={<YieldPrediction />} />
          <Route path="/soil-analysis" element={<SoilAnalysis />} />
          <Route path="/camera-test" element={<CameraTest />} />
          <Route path="/treatment-optimizer" element={<TreatmentOptimizer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
