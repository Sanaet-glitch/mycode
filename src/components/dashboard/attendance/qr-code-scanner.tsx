import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, X, Loader2, AlertTriangle, RefreshCw, CheckCircle2, Scan, CameraOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { validateAttendanceToken } from '@/utils/attendance';
import { 
  getCurrentLocation, 
  LocationError, 
  LocationErrorCode, 
  Location 
} from '@/utils/distance';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import jsQR from 'jsqr';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export function QRCodeScanner({ onScan, onClose, isOpen = true }: QRCodeScannerProps) {
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState<LocationError | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState<'idle' | 'scanning' | 'location' | 'verification' | 'success' | 'error'>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Effect to handle QR code scanning
  useEffect(() => {
    let animationId: number;
    
    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError('Camera access is not supported in your browser');
          return;
        }

        const constraints = {
          video: { facingMode: 'environment' }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setScannerActive(true);
          setVerificationStep('scanning');
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setCameraError('Could not access camera. Please check permissions.');
      }
    };

    const scanQRCode = () => {
      if (!canvasRef.current || !videoRef.current || !scannerActive) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = decodeQRCode(imageData);
        
        if (code) {
          setScannedData(code);
          stopCamera();
          setQrCode(code);
          getLocation();
        }
      }
      
      animationId = requestAnimationFrame(scanQRCode);
    };

    if (isOpen && scanning && !scannedData) {
      startCamera();
      
      // Start scanning after a short delay to ensure camera is initialized
      const timeoutId = setTimeout(() => {
        scanQRCode();
      }, 1000);
      
      return () => {
        clearTimeout(timeoutId);
        cancelAnimationFrame(animationId);
        stopCamera();
      };
    }
    
    return () => {
      cancelAnimationFrame(animationId);
      stopCamera();
    };
  }, [isOpen, scanning, scannedData]);

  const decodeQRCode = (imageData: ImageData): string | null => {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      return code?.data || null;
    } catch (error) {
      console.error('QR decoding error:', error);
      return null;
    }
  };

  const getLocation = async () => {
    setVerificationStep('location');
    setLocationLoading(true);
    
    try {
      const userLocation = await getCurrentLocation();
      setLocation(userLocation);
      setLocationLoading(false);
      
      if (qrCode) {
        verifyAttendance(qrCode, userLocation);
      }
    } catch (error) {
      setLocationLoading(false);
      setError(error as LocationError);
      setVerificationStep('error');
    }
  };

  const verifyAttendance = (token: string, userLocation: Location) => {
    setVerificationStep('verification');
    
    // Simulate verification process
    setTimeout(() => {
      try {
        // Here you would normally validate the token with your backend
        // For now, we'll just pass the token to the parent component
        setSuccess(true);
        setVerificationStep('success');
        onScan(token);
      } catch (error) {
        setError({
          code: LocationErrorCode.UNKNOWN_ERROR,
          message: 'Failed to verify attendance'
        });
        setVerificationStep('error');
      }
    }, 1500);
  };

  const startScanning = () => {
    setScanning(true);
    setScannedData(null);
    setQrCode(null);
    setError(null);
    setSuccess(false);
    setVerificationStep('idle');
    setCameraError(null);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScannerActive(false);
    setScanning(false);
  };

  const handleRetry = () => {
    if (retryCount >= maxRetries) {
      setError({
        code: LocationErrorCode.MAX_RETRIES_EXCEEDED,
        message: 'Maximum retry attempts exceeded'
      });
      return;
    }
    
    setRetryCount(prev => prev + 1);
    
    // Clear any existing retry timer
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
    }
    
    startScanning();
  };

  const renderStepContent = () => {
    switch (verificationStep) {
      case 'idle':
        return (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Camera className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">QR Code Scanner</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Position the QR code within the scanner area
            </p>
            <Button onClick={startScanning}>
              Start Scanning
            </Button>
          </div>
        );
        
      case 'scanning':
        return (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg bg-black aspect-square max-w-xs mx-auto">
              <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
              />
              <div className="absolute inset-0 border-2 border-dashed border-primary/50 m-8 rounded-lg" />
              <canvas ref={canvasRef} className="hidden" />
              
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
                  <div className="text-center space-y-2">
                    <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
                    <p className="text-sm text-white">{cameraError}</p>
                    <Button size="sm" variant="outline" onClick={handleRetry}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Scanning for QR code...
              </p>
              <Button variant="outline" size="sm" onClick={stopCamera}>
                Cancel
              </Button>
            </div>
          </div>
        );
        
      case 'location':
        return (
          <div className="space-y-4 p-2">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1">
                  QR Code Detected
                </Badge>
                <h3 className="text-lg font-medium mb-2">Getting Location</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please wait while we verify your location
                </p>
                <div className="space-y-2">
                  <Progress value={locationLoading ? 70 : 100} className="w-48 mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    {locationLoading ? 'Retrieving GPS coordinates...' : 'Location acquired'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'verification':
        return (
          <div className="space-y-4 p-2">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1">
                  Location Verified
                </Badge>
                <h3 className="text-lg font-medium mb-2">Verifying Attendance</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Almost there! Confirming your attendance...
                </p>
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'success':
        return (
          <div className="space-y-4 p-2">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">Attendance Verified!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your attendance has been successfully recorded
                </p>
                <Button onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        );
        
      case 'error':
        return (
          <div className="space-y-4 p-2">
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error?.message || 'An unknown error occurred'}
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center gap-2">
              {retryCount < maxRetries && (
                <Button onClick={handleRetry} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              )}
              <Button onClick={onClose} variant="default">
                Close
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const handleClose = () => {
    stopCamera();
    if (onClose) onClose();
  };
  
  const toggleCamera = async () => {
    if (scannerActive) {
      stopCamera();
    } else {
      startScanning();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Attendance QR Code</DialogTitle>
          <DialogDescription>
            Scan the QR code displayed by your lecturer to mark your attendance
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center">
          {renderStepContent()}
        </div>
        
        <div className="flex justify-between mt-4">
          <Button variant="outline" size="sm" onClick={toggleCamera}>
            {scannerActive ? (
              <>
                <CameraOff className="mr-2 h-4 w-4" />
                Stop Camera
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                {cameraError ? 'Try Again' : 'Start Camera'}
              </>
            )}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 