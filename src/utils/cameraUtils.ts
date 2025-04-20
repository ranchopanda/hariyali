import { toast } from "sonner";

// Types
export interface CameraOptions {
  onCapture: (blob: Blob) => void;
  onError?: (error: string) => void;
}

// Interface for camera related state
export interface CameraState {
  stream: MediaStream | null;
  isActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  error: string | null;
}

// Function to request camera access
export const requestCameraAccess = async (): Promise<MediaStream> => {
  try {
    console.log("Requesting camera access...");
    
    // First check if the browser supports getUserMedia
    if (!navigator.mediaDevices) {
      console.error("navigator.mediaDevices is not available");
      throw new Error("Your browser doesn't support camera access. Please use a modern browser.");
    }
    
    if (!navigator.mediaDevices.getUserMedia) {
      console.error("navigator.mediaDevices.getUserMedia is not available");
      throw new Error("Your browser doesn't support camera access. Please use a modern browser.");
    }

    // Check if we're on HTTPS or localhost (required for camera access)
    const isSecureContext = window.isSecureContext;
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    
    if (!isSecureContext && !isLocalhost) {
      console.error("Not in a secure context (HTTPS required for camera access)");
      throw new Error("Camera access requires a secure connection (HTTPS). Please use HTTPS or localhost.");
    }

    console.log("Requesting camera with constraints...");
    // Request camera access with more flexible constraints
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: ['environment', 'user'], // Try back camera first, then front
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 }
      }
    });
    
    console.log("Camera access granted successfully", stream);
    return stream;
  } catch (error: unknown) {
    console.error("Camera access error:", error);
    
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error("Camera access was denied. Please allow camera access in your browser settings and try again.");
      } else if (error.name === 'NotFoundError') {
        throw new Error("No camera found on your device. Please make sure your device has a working camera.");
      } else if (error.name === 'NotReadableError') {
        throw new Error("Your camera is already in use by another application. Please close other apps using the camera.");
      } else if (error.name === 'OverconstrainedError') {
        throw new Error("Your camera doesn't meet the required specifications. Please try a different camera.");
      } else if (error.name === 'TypeError') {
        throw new Error("Camera API error. Please try a different browser or device.");
      }
    }
    
    throw new Error("Failed to access camera. Please check your camera permissions and try again.");
  }
};

// Function to stop camera stream
export const stopCameraStream = (stream: MediaStream | null) => {
  if (stream) {
    console.log("Stopping camera stream...");
    stream.getTracks().forEach(track => {
      track.stop();
      console.log("Track stopped:", track.kind);
    });
  }
};

// Function to capture photo from video stream
export const capturePhoto = (
  videoElement: HTMLVideoElement | null
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!videoElement) {
      console.error("Video element not found");
      reject(new Error("Video element not found"));
      return;
    }
    
    try {
      console.log("Capturing photo from video element...");
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      console.log(`Canvas dimensions: ${canvas.width}x${canvas.height}`);
      
      const context = canvas.getContext('2d');
      if (!context) {
        console.error("Could not get canvas context");
        reject(new Error("Could not get canvas context"));
        return;
      }
      
      // Draw the video frame to the canvas
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log("Photo captured successfully", blob);
            resolve(blob);
          } else {
            console.error("Failed to capture image - blob is null");
            reject(new Error("Failed to capture image"));
          }
        },
        'image/jpeg',
        0.95
      );
    } catch (error) {
      console.error("Error capturing photo:", error);
      reject(new Error("Failed to capture photo"));
    }
  });
};

// Function to initialize camera
export const initializeCamera = async (
  videoRef: React.RefObject<HTMLVideoElement>,
  setStream: (stream: MediaStream | null) => void,
  setError: (error: string | null) => void
): Promise<void> => {
  try {
    console.log("Initializing camera...");
    const stream = await requestCameraAccess();
    
    if (videoRef.current) {
      console.log("Setting video source...");
      videoRef.current.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded");
            resolve();
          };
        }
      });
      
      console.log("Playing video...");
      await videoRef.current.play();
    }
    
    setStream(stream);
    setError(null);
  } catch (error) {
    console.error("Error initializing camera:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to initialize camera";
    setError(errorMessage);
    setStream(null);
  }
};
