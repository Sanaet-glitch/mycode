import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/AuthForm";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 bg-[#1A1F2C] rounded-full flex items-center justify-center mb-6">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1F2C]">
            {isLogin ? "Campus Attendance" : "Join Campus Attendance"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isLogin
              ? "Welcome back to your academic journey"
              : "Create your account to get started"}
          </p>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <AuthForm 
              isLogin={isLogin} 
              onToggleMode={() => setIsLogin(!isLogin)} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;