import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { checkForcePasswordChange } from "@/services/userService";
import { checkPasswordStrength, isPasswordValid, getPasswordRequirements } from "@/utils/passwordUtils";
import { PasswordStrengthIndicator } from "./password-strength-indicator";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid institutional email").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

// Add a new schema for password change
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type AuthFormValues = z.infer<typeof loginSchema>;
type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

export const AuthForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetDialog, setResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  // New state for password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Password change form
  const passwordChangeForm = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update password strength when new password changes
  useEffect(() => {
    const subscription = passwordChangeForm.watch((value, { name }) => {
      if (name === "newPassword") {
        const strength = checkPasswordStrength(value.newPassword || "");
        setPasswordStrength(strength);
      }
    });
    return () => subscription.unsubscribe();
  }, [passwordChangeForm]);

  const handleAuth = async (values: AuthFormValues) => {
    setLoading(true);
    setError(null);

    try {
      // Check if it's an institutional email
      if (!values.email.endsWith('.edu') && 
          !values.email.endsWith('.ac') && 
          !values.email.endsWith('.org')) {
        throw new Error("Please use your institutional email address.");
      }

      // Sign in with provided credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      // Check if the user needs to change their password
      if (data.user) {
        setUserId(data.user.id);
        setUserEmail(values.email);
        
        // Check if password change is required
        const needsPasswordChange = await checkForcePasswordChange(data.user.id);
        
        if (needsPasswordChange) {
          // Show password change form instead of redirecting
          setShowPasswordChange(true);
          // Pre-fill the current password
          passwordChangeForm.setValue("currentPassword", values.password);
          setLoading(false);
          return;
        }
        
        // Determine redirect based on user role
        if (data.user.user_metadata && data.user.user_metadata.role) {
          const userRole = data.user.user_metadata.role.toLowerCase();
          
          if (userRole === 'admin') {
            navigate('/admin');
          } else if (userRole === 'lecturer') {
            navigate('/lecturer');
          } else {
            navigate('/student');
          }
        } else {
          // Default to student dashboard if role not specified
          navigate('/student');
        }
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      
      if (err.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (err.message.includes("institutional email")) {
        setError(err.message);
      } else {
        setError("An error occurred during sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: PasswordChangeValues) => {
    setLoading(true);
    setError(null);

    try {
      if (!userId || !userEmail) {
        throw new Error("User session information is missing.");
      }

      // Validate password complexity
      const validation = isPasswordValid(values.newPassword);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      // First verify the current password by trying to sign in again
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: values.currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect.");
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword
      });

      if (updateError) throw updateError;

      // Also update the metadata to remove the force_password_change flag
      await supabase.auth.updateUser({
        data: { force_password_change: false }
      });

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
        variant: "default",
      });

      // Determine redirect based on user role
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user && userData.user.user_metadata && userData.user.user_metadata.role) {
        const userRole = userData.user.user_metadata.role.toLowerCase();
        
        if (userRole === 'admin') {
          navigate('/admin');
        } else if (userRole === 'lecturer') {
          navigate('/lecturer');
        } else {
          navigate('/student');
        }
      } else {
        // Default to student dashboard if role not specified
        navigate('/student');
      }
    } catch (err: any) {
      console.error("Password change error:", err);
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async () => {
    if (!resetEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your institutional email address.",
        variant: "destructive",
      });
      return;
    }
    
    if (!resetEmail.endsWith('.edu') && 
        !resetEmail.endsWith('.ac') && 
        !resetEmail.endsWith('.org')) {
      toast({
        title: "Invalid Email",
        description: "Please use your institutional email address.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      // This won't actually send a reset email - will notify admin instead
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      setResetSent(true);
      toast({
        title: "Request Submitted",
        description: "Your administrator has been notified about your password reset request.",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Request Failed",
        description: "Failed to submit reset request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showPasswordChange) {
    return (
      <>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Change Your Password
          </h2>
          <p className="text-white/60 mt-2">
            Your administrator requires you to change your password before continuing.
          </p>
        </div>
        
        <Form {...passwordChangeForm}>
          <form onSubmit={passwordChangeForm.handleSubmit(handlePasswordChange)} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <FormField
              control={passwordChangeForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 h-5 w-5" />
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={passwordChangeForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 h-5 w-5" />
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <PasswordStrengthIndicator strength={passwordStrength} />
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-white/60 font-medium">Password Requirements:</p>
                    <ul className="text-xs text-white/60 list-disc pl-4 space-y-1">
                      {getPasswordRequirements().map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={passwordChangeForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 h-5 w-5" />
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              variant="gradient" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
                  Updating Password...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Lock className="mr-2 h-5 w-5" />
                  Change Password & Continue
                </div>
              )}
            </Button>
          </form>
        </Form>
      </>
    );
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAuth)} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 h-5 w-5" />
                    <Input 
                      placeholder="your.email@institution.edu" 
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30" 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-white/70">Password</FormLabel>
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-xs text-primary hover:text-primary/80 p-0 h-auto"
                    onClick={() => setResetDialog(true)}
                  >
                    Forgot password?
                  </Button>
                </div>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 h-5 w-5" />
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30" 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            variant="gradient" 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
                Signing in...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Lock className="mr-2 h-5 w-5" />
                Sign In
              </div>
            )}
          </Button>
        </form>
      </Form>
      
      {/* Password Reset Request Dialog */}
      <Dialog open={resetDialog} onOpenChange={setResetDialog}>
        <DialogContent className="bg-black/90 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Password Reset Request
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Enter your institutional email to request a password reset from your administrator.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {resetSent ? (
              <Alert className="bg-success/10 border-success/30 text-success">
                <AlertDescription>
                  Request submitted. Your administrator will contact you shortly to reset your password.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 h-5 w-5" />
                  <Input
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your.email@institution.edu"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <Button 
                  onClick={handleResetRequest} 
                  className="w-full" 
                  variant="gradient"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
                      Submitting...
                    </div>
                  ) : "Submit Request"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 