import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, RefreshCw, AlertTriangle } from "lucide-react";
import { 
  requestCameraAccess, 
  stopCameraStream, 
  capturePhoto 
} from "@/utils/cameraUtils";
import { toast } from "sonner";

const CameraTest = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      setError(null);
      setIsLoading(true);
      setIsActive(true);
      setCapturedImage(null);
      
      console.log("Starting camera...");
      const mediaStream = await requestCameraAccess();
      
      if (videoRef.current) {
        console.log("Setting video source and playing...");
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log("Video metadata loaded");
              resolve();
            };
          }
        });
        
        await videoRef.current.play();
        console.log("Video playing successfully");
      } else {
        console.error("Video element reference is null");
        throw new Error("Video element not found");
      }
      
      setStream(mediaStream);
    } catch (error: unknown) {
      console.error("Error starting camera:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to start camera";
      setError(errorMessage);
      setIsActive(false);
      
      toast.error(errorMessage, {
        duration: 5000,
        action: {
          label: "Try Again",
          onClick: () => startCamera()
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const takePicture = async () => {
    if (!videoRef.current || !stream) {
      console.error("Cannot take picture: video element or stream is null");
      toast.error("Camera not ready. Please try again.");
      return;
    }
    
    try {
      console.log("Taking picture...");
      const blob = await capturePhoto(videoRef.current);
      
      // Convert blob to data URL for display
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(blob);
      
      console.log("Picture taken successfully");
    } catch (error: unknown) {
      console.error("Error taking picture:", error);
      toast.error("Failed to capture image. Please try again.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      console.log("Stopping camera...");
      stopCameraStream(stream);
      setStream(null);
    }
    setIsActive(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Camera Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Camera Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {error ? (
                <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <span>{error}</span>
                  </div>
                </div>
              ) : null}
              
              <div className="flex flex-wrap gap-4">
                {!isActive ? (
                  <Button
                    onClick={startCamera}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-4 w-4" />
                        Start Camera
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={takePicture}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Take Picture
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                    >
                      Stop Camera
                    </Button>
                  </>
                )}
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Debug Information</h3>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-sm font-mono overflow-auto">
                  <p><strong>Camera Active:</strong> {isActive ? 'Yes' : 'No'}</p>
                  <p><strong>Stream:</strong> {stream ? 'Connected' : 'Not connected'}</p>
                  <p><strong>Error:</strong> {error || 'None'}</p>
                  <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
                  <p><strong>Captured Image:</strong> {capturedImage ? 'Yes' : 'No'}</p>
                  <p><strong>Browser:</strong> {navigator.userAgent}</p>
                  <p><strong>Secure Context:</strong> {window.isSecureContext ? 'Yes' : 'No'}</p>
                  <p><strong>Hostname:</strong> {window.location.hostname}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Camera Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {isActive ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-[300px] object-cover bg-black rounded-md"
                />
              </div>
            ) : capturedImage ? (
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-[300px] object-cover rounded-md"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] bg-gray-100 dark:bg-gray-800 rounded-md">
                <p className="text-gray-500 dark:text-gray-400">
                  {error ? 'Camera error' : 'Camera not started'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CameraTest; 