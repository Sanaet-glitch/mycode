import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { setLecturerLocation } from "@/utils/distance";
import { Link } from "react-router-dom";

const LecturerDashboard = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const { toast } = useToast();

  const checkLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(userLocation);
        setLecturerLocation(userLocation);
        toast({
          title: "Location set",
          description: "Your location is now being used as the attendance beacon.",
        });
      },
      (error) => {
        setLocationError("Unable to retrieve your location");
        toast({
          variant: "destructive",
          title: "Location Error",
          description: "Please enable location services to mark attendance",
        });
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-none shadow-lg animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-primary">Lecturer Dashboard</CardTitle>
              <CardDescription>Set your location as an attendance beacon</CardDescription>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">Change Role</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-6">
            {locationError && (
              <Alert variant="destructive">
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col items-center gap-4 p-6 bg-gray-50/80 rounded-lg backdrop-blur-sm">
              <Button 
                onClick={checkLocation}
                className="bg-primary hover:bg-primary/90 text-white"
                size="lg"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Set Location Beacon
              </Button>
              
              {location && (
                <div className="text-sm text-gray-600">
                  Location verified at: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LecturerDashboard;