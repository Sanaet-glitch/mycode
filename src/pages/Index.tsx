import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-none shadow-lg animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Campus Attendance System</CardTitle>
            <CardDescription>
              Select your role to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate("/lecturer")}
                className="w-full sm:w-48 h-32 text-lg"
                variant="outline"
              >
                I am a Lecturer
              </Button>
              <Button
                onClick={() => navigate("/student")}
                className="w-full sm:w-48 h-32 text-lg"
                variant="default"
              >
                I am a Student
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;