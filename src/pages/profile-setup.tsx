import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { BookOpen, School, ShieldCheck } from "lucide-react";

export default function ProfileSetup() {
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const { user, setUserRole, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role to continue.",
        variant: "destructive",
      });
      return;
    }
    
    const { error } = await setUserRole(selectedRole);
    
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Profile Updated",
      description: "Your profile has been set up successfully.",
    });
    
    // Redirect based on role
    switch (selectedRole) {
      case "student":
        navigate("/student/dashboard");
        break;
      case "lecturer":
        navigate("/lecturer/dashboard");
        break;
      case "admin":
        navigate("/admin/dashboard");
        break;
      default:
        navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 p-4 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            {user?.name ? `Welcome, ${user.name}! ` : ''}
            Please select your role to continue.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <RadioGroup
              value={selectedRole || ""}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
              className="space-y-4"
            >
              <div className={`flex items-center space-x-4 rounded-lg border p-4 transition-colors ${selectedRole === "student" ? "border-primary bg-primary/5" : "hover:bg-accent"}`}>
                <RadioGroupItem 
                  value="student" 
                  id="student" 
                  className="border-primary"
                />
                <Label htmlFor="student" className="flex flex-1 cursor-pointer items-center space-x-3">
                  <School className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Student</p>
                    <p className="text-xs text-muted-foreground">Enroll in courses and track your attendance</p>
                  </div>
                </Label>
              </div>
              
              <div className={`flex items-center space-x-4 rounded-lg border p-4 transition-colors ${selectedRole === "lecturer" ? "border-primary bg-primary/5" : "hover:bg-accent"}`}>
                <RadioGroupItem 
                  value="lecturer" 
                  id="lecturer" 
                  className="border-primary"
                />
                <Label htmlFor="lecturer" className="flex flex-1 cursor-pointer items-center space-x-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Lecturer</p>
                    <p className="text-xs text-muted-foreground">Manage courses and student attendance</p>
                  </div>
                </Label>
              </div>
              
              <div className={`flex items-center space-x-4 rounded-lg border p-4 transition-colors ${selectedRole === "admin" ? "border-primary bg-primary/5" : "hover:bg-accent"}`}>
                <RadioGroupItem 
                  value="admin" 
                  id="admin" 
                  className="border-primary"
                />
                <Label htmlFor="admin" className="flex flex-1 cursor-pointer items-center space-x-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Administrator</p>
                    <p className="text-xs text-muted-foreground">Manage users, courses, and system settings</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !selectedRole}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Setting Up Profile...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="border-t p-4 text-center">
          <p className="text-xs text-muted-foreground">
            You can contact support if you need to change your role later.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 