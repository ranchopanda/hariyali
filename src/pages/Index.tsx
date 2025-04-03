
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import StatisticsSection from "@/components/StatisticsSection";
import CallToAction from "@/components/CallToAction";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [darkMode, setDarkMode] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if user previously set a preference
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode) {
      setDarkMode(savedMode === "true");
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(prefersDark);
    }
  }, []);
  
  useEffect(() => {
    // Update document class when dark mode changes
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    // Save preference
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);
  
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };
  
  useEffect(() => {
    // Welcome toast on first visit
    const isFirstVisit = !localStorage.getItem("visited");
    if (isFirstVisit) {
      setTimeout(() => {
        toast({
          title: "Welcome to किसान कृषि दोस्त AI!",
          description: "Your AI-powered farming assistant for better crop management.",
        });
        localStorage.setItem("visited", "true");
      }, 1500);
    }
  }, [toast]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <StatisticsSection />
        <TestimonialsSection />
        <CallToAction />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
