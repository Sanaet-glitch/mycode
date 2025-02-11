
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
          setFullName(profile.full_name);
        }
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const navigateBasedOnRole = () => {
    switch (userRole) {
      case 'lecturer':
        navigate('/lecturer');
        break;
      case 'student':
        navigate('/student');
        break;
      case 'admin':
        // We'll implement admin dashboard later
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <Card className="border-none shadow-lg animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Campus Attendance System</CardTitle>
            <CardDescription className="text-lg">
              {fullName ? `Welcome back, ${fullName}!` : 'Welcome back!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {userRole && (
                <Button
                  onClick={navigateBasedOnRole}
                  className="w-full sm:w-48 h-32 text-lg"
                  variant="default"
                >
                  Continue as {userRole}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
