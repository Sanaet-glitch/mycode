import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Loader2, CheckCircle, Clock } from "lucide-react";
import { generateAttendanceToken, getTokenRemainingTime } from "@/utils/attendance";
import { QRCodeCanvas } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeDisplayProps {
  sessionId: string;
  className: string;
  courseName: string;
}

export const QRCodeDisplay = ({ sessionId, className, courseName }: QRCodeDisplayProps) => {
  const [token, setToken] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [expiryTime, setExpiryTime] = useState<string>("");
  const { toast } = useToast();
  
  // Generate a new token when the component mounts or when refreshed
  const generateNewToken = () => {
    setIsRefreshing(true);
    try {
      const newToken = generateAttendanceToken(sessionId);
      setToken(newToken);
      updateExpiryTime(newToken);
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2000);
    } catch (error) {
      console.error("Error generating token:", error);
      toast({
        title: "Error",
        description: "Failed to generate QR code token",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Update the displayed expiry time
  const updateExpiryTime = (tokenToCheck: string) => {
    const timeRemaining = getTokenRemainingTime(tokenToCheck);
    setExpiryTime(timeRemaining);
  };
  
  useEffect(() => {
    generateNewToken();
    
    // Refresh token every 5 minutes for security
    const tokenRefreshInterval = setInterval(() => {
      generateNewToken();
    }, 5 * 60 * 1000);
    
    // Update the expiry time countdown every second
    const expiryUpdateInterval = setInterval(() => {
      if (token) {
        updateExpiryTime(token);
      }
    }, 1000);
    
    return () => {
      clearInterval(tokenRefreshInterval);
      clearInterval(expiryUpdateInterval);
    };
  }, [sessionId]);
  
  // Download QR code as PNG
  const downloadQRCode = () => {
    setIsDownloading(true);
    try {
      const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
      if (canvas) {
        const pngUrl = canvas
          .toDataURL('image/png')
          .replace('image/png', 'image/octet-stream');
        
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        const filename = `attendance-qr-${className.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;
        downloadLink.download = filename + '.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        toast({
          title: "Success",
          description: "QR code downloaded successfully",
        });
      } else {
        throw new Error("Canvas element not found");
      }
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <Card className="border shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">QR Code for Attendance</CardTitle>
        <CardDescription>
          {courseName} - {className}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          {token ? (
            <QRCodeCanvas
              id="qr-code"
              value={token}
              size={200}
              level="H"
              includeMargin={true}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          ) : (
            <div className="flex items-center justify-center w-[200px] h-[200px]">
              <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        
        {token && (
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-muted-foreground">Expires in:</span>
            <span className={`font-medium ${expiryTime.includes('seconds') ? 'text-red-500' : ''}`}>
              {expiryTime}
            </span>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateNewToken}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : refreshSuccess ? (
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isRefreshing ? "Refreshing..." : refreshSuccess ? "Updated!" : "Refresh"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadQRCode}
            disabled={isDownloading || !token}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>QR code refreshes automatically every 5 minutes for security.</p>
          <p>Students can scan this code to mark attendance.</p>
          <p className="text-primary text-xs">Session ID: {sessionId.substring(0, 8)}...</p>
        </div>
      </CardContent>
    </Card>
  );
}; 