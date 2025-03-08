import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { EyeIcon, EyeOffIcon, GlobeIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect URL from location state or default to root path
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await login(email.trim(), password.trim());
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Redirect to the intended destination
      navigate(from, { replace: true });
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Combined loading state from both local submission and auth context
  const isLoading = isSubmitting || authLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#090E23] to-[#1A1E35] p-4 relative overflow-hidden">
      {/* Animated particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="fixed rounded-full z-0 opacity-50"
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: Math.random() * window.innerHeight,
            opacity: Math.random() * 0.3 + 0.1,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{ 
            y: [
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight
            ],
            x: [
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth
            ],
            opacity: [
              Math.random() * 0.3 + 0.1, 
              Math.random() * 0.2
            ]
          }}
          transition={{ 
            duration: 15 + Math.random() * 15, 
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            background: i % 2 === 0 ? 
              `rgba(155, 135, 245, ${Math.random() * 0.5 + 0.3})` : 
              `rgba(126, 105, 171, ${Math.random() * 0.5 + 0.3})`
          }}
        />
      ))}
      
      {/* Glowing orbs */}
      <div className="fixed top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full filter blur-[100px] z-0 animate-pulse-slow" />
      <div className="fixed bottom-1/4 -right-20 w-80 h-80 bg-accent/20 rounded-full filter blur-[100px] z-0 animate-pulse-slow" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="w-full glass-card shadow-glass">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="relative flex h-12 w-12 overflow-hidden rounded-full bg-primary/20 mr-2 neon-border">
                <div className="absolute w-full h-full rounded-full animate-pulse-ring" />
                <div className="flex h-full w-full items-center justify-center">
                  <GlobeIcon className="h-6 w-6 text-primary neon-text" />
                </div>
              </div>
            </div>
            <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent text-shadow-glow">
              Campus Connect
            </CardTitle>
            <CardDescription className="text-center text-white/70">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="glass-input w-full backdrop-blur-glass border-white/20"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs text-primary hover:underline neon-text"
                    tabIndex={isLoading ? -1 : undefined}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="glass-input w-full pr-10 backdrop-blur-glass border-white/20"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/70 hover:text-primary transition-colors"
                    tabIndex={isLoading ? -1 : undefined}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="glass-button w-full hover:translate-y-[-2px] transition-all shadow-glass"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 border-t border-white/10 p-4">
            <div className="text-center text-sm text-white/70">
              Don't have an account?{" "}
              <span className="font-medium text-white neon-text">
                Contact your administrator
              </span>
            </div>
            
            <div className="text-center text-xs text-white/60 glass-card-subtle p-3 rounded-lg">
              <p className="mb-1 text-white/80">Demo Credentials</p>
              <p>Student: student@example.com / password</p>
              <p>Lecturer: lecturer@example.com / password</p>
              <p>Admin: admin@example.com / password</p>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
} 