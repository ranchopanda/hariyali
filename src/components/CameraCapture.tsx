
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, Image as ImageIcon, RefreshCw } from "lucide-react";
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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      // Clean up stream when component unmounts
      if (stream) {
        stopCameraStream(stream);
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsActive(true);
      
      const mediaStream = await requestCameraAccess();
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
    } catch (error: unknown) {
      console.error("Error starting camera:", error);
      let errorMessage = "Failed to access camera";
      
      if (error instanceof Error) {
        if (error.message.includes("denied")) {
          errorMessage = "Camera permission denied. Please enable camera access in your browser settings.";
        } else if (error.message.includes("NotFoundError")) {
          errorMessage = "No camera found. Please use a device with a camera or upload an image instead.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setIsActive(false);
      toast.error(errorMessage, {
        duration: 5000,
        action: {
          label: "Upload Instead",
          onClick: () => document.getElementById('file-upload')?.click()
        }
      });
    }
  };

  const takePicture = async () => {
    if (!videoRef.current || !stream) return;
    
    try {
      const blob = await capturePhoto(videoRef.current);
      
      // Convert blob to file
      const file = new File([blob], `capture_${Date.now()}.jpg`, { 
        type: 'image/jpeg' 
      });
      
      onCapture(file);
      
      // Stop camera after capturing
      stopCamera();
    } catch (error: unknown) {
      console.error("Error taking picture:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to capture image";
      toast.error(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stopCameraStream(stream);
      setStream(null);
    }
    setIsActive(false);
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
                onCanPlay={() => {
                  if (videoRef.current) {
                    videoRef.current.play();
                  }
                }}
              />
              
              <div className="absolute inset-x-0 bottom-0 p-4 flex justify-center space-x-4 bg-gradient-to-t from-black/50 to-transparent">
                <Button
                  variant="outline"
                  className="rounded-full bg-white text-black hover:bg-gray-200"
                  onClick={stopCamera}
                >
                  <X className="h-5 w-5" />
                </Button>
                
                <Button
                  className="rounded-full bg-white text-black hover:bg-gray-200"
                  onClick={takePicture}
                >
                  <Camera className="h-5 w-5" />
                </Button>
              </div>
            </>
          ) : (
            <div className="p-6 flex flex-col items-center space-y-4">
              {error && (
                <div className="text-red-500 text-sm mb-2 p-2 bg-red-50 rounded-md w-full">
                  {error}
                  <p className="mt-2 text-gray-600">
                    You can upload an image instead:
                  </p>
                  <div className="mt-2">
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          onCapture(e.target.files[0]);
                          onClose?.();
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-kisan-green hover:bg-kisan-green-dark cursor-pointer"
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Upload Image
                    </label>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-4">
                <Button
                  className="bg-kisan-green hover:bg-kisan-green-dark"
                  onClick={startCamera}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Open Camera
                </Button>
                
                {onClose && (
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraCapture;
