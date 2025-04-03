
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SuccessStoryForm from "@/components/SuccessStoryForm";
import TestimonialsSection from "@/components/TestimonialsSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SuccessStories = () => {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-kisan-green dark:text-kisan-gold">
                Farmers' Success Stories
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Read how किसान कृषि दोस्त is helping farmers across India.
              </p>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0 bg-kisan-green hover:bg-kisan-green-dark text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Share Your Story
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <SuccessStoryForm />
              </DialogContent>
            </Dialog>
          </div>
          
          <Tabs defaultValue="featured">
            <TabsList className="mb-8">
              <TabsTrigger value="featured">Featured Stories</TabsTrigger>
              <TabsTrigger value="recent">Recent Submissions</TabsTrigger>
              <TabsTrigger value="video">Video Testimonials</TabsTrigger>
            </TabsList>
            
            <TabsContent value="featured">
              <TestimonialsSection />
              
              <div className="mt-12">
                <h2 className="text-2xl font-semibold mb-6 text-kisan-green dark:text-kisan-gold">
                  More Success Stories
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 rounded-full bg-kisan-green/10 flex items-center justify-center mr-4">
                            <MessageSquare className="h-6 w-6 text-kisan-green dark:text-kisan-gold" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">Vikas Patel</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Cotton Farmer, Gujarat</p>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 italic mb-4">
                          "The disease detection helped me identify cotton leaf curl virus early. I was able to prevent it from spreading to my entire farm. The app gave me targeted treatment recommendations that worked well."
                        </p>
                        
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-auto">
                          March 15, 2024
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 rounded-full bg-kisan-green/10 flex items-center justify-center mr-4">
                            <MessageSquare className="h-6 w-6 text-kisan-green dark:text-kisan-gold" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">Anita Devi</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Rice Farmer, West Bengal</p>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 italic mb-4">
                          "The weather forecasts are very accurate for my village. I used the app's advice to time my rice transplantation perfectly with the monsoon onset. This has improved my crop's early growth."
                        </p>
                        
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-auto">
                          April 2, 2024
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="recent">
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Recent Submissions</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  New farmer success stories will appear here after review. Share your own experience to be featured.
                </p>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-kisan-green hover:bg-kisan-green-dark text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Be the First to Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <SuccessStoryForm />
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
            
            <TabsContent value="video">
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Video Testimonials</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Video testimonials from farmers will be available soon. Check back later to see farmer success stories in video format.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SuccessStories;
