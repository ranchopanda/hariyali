import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, Image as ImageIcon, RefreshCw, AlertTriangle } from "lucide-react";
import { 
  requestCameraAccess, 
  stopCameraStream, 
  capturePhoto 
} from "@/utils/cameraUtils";
import { toast } from "sonner";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose?: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ 
  onCapture,
  onClose 
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Clean up stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        console.log("Cleaning up camera stream on unmount");
        stopCameraStream(stream);
      }
    };
  }, [stream]);

  // Check if browser supports camera API
  useEffect(() => {
    const checkCameraSupport = () => {
      const hasMediaDevices = !!navigator.mediaDevices;
      const hasGetUserMedia = !!navigator.mediaDevices?.getUserMedia;
      const isSecureContext = window.isSecureContext;
      const isLocalhost = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
      
      console.log("Camera support check:", {
        hasMediaDevices,
        hasGetUserMedia,
        isSecureContext,
        isLocalhost
      });
      
      if (!hasMediaDevices || !hasGetUserMedia) {
        setError("Your browser doesn't support camera access. Please use a modern browser.");
      } else if (!isSecureContext && !isLocalhost) {
        setError("Camera access requires a secure connection (HTTPS). Please use HTTPS or localhost.");
      }
    };
    
    checkCameraSupport();
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      setIsLoading(true);
      setIsActive(true);
      
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
      setRetryCount(0); // Reset retry count on success
    } catch (error: unknown) {
      console.error("Error starting camera:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to start camera";
      setError(errorMessage);
      setIsActive(false);
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
      
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
      
      // Convert blob to file
      const file = new File([blob], `capture_${Date.now()}.jpg`, { 
        type: 'image/jpeg' 
      });
      
      console.log("Picture taken successfully", file);
      onCapture(file);
      
      // Stop camera after capturing
      stopCamera();
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

  // Fallback to file upload if camera fails multiple times
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onCapture(file);
      if (onClose) onClose();
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {isActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-[300px] object-cover bg-black"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <Button
                  onClick={takePicture}
                  className="bg-kisan-green hover:bg-kisan-green-dark text-white"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="bg-white/80 hover:bg-white/90"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="p-6 text-center">
              {error ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center text-red-500 mb-4">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <span>{error}</span>
                  </div>
                  
                  {retryCount < 3 ? (
                    <Button
                      onClick={startCamera}
                      className="bg-kisan-green hover:bg-kisan-green-dark text-white"
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
                          Try Again
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Having trouble with the camera? You can upload an image instead.
                      </p>
                      <div className="flex justify-center gap-4">
                        <Button
                          onClick={startCamera}
                          variant="outline"
                          className="bg-white/80 hover:bg-white/90"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Try Camera Again
                        </Button>
                        <label htmlFor="file-upload">
                          <Button
                            asChild
                            className="bg-kisan-green hover:bg-kisan-green-dark text-white"
                          >
                            <div>
                              <ImageIcon className="mr-2 h-4 w-4" />
                              Upload Image
                            </div>
                          </Button>
                        </label>
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-gray-500 dark:text-gray-400">
                    <Camera className="h-12 w-12 mx-auto mb-4" />
                    <p>Click below to start your camera</p>
                  </div>
                  <Button
                    onClick={startCamera}
                    className="bg-kisan-green hover:bg-kisan-green-dark text-white"
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
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraCapture;
