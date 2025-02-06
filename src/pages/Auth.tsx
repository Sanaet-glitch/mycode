import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  role: z.enum(["student", "lecturer", "admin"]).optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      role: "student",
    },
  });

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 25;
    setPasswordStrength(strength);
  };

  const handleAuth = async (values: AuthFormValues) => {
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.fullName,
              role: values.role,
            },
          },
        });
        if (error) throw error;
        toast({
          title: "Success",
          description: "Please check your email to verify your account",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAuth)} className="space-y-4">
                {!isLogin && (
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your.email@institution.edu"
                          {...field}
                        />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={isLogin ? "Enter your password" : "Create a password"}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            calculatePasswordStrength(e.target.value);
                          }}
                        />
                      </FormControl>
                      {!isLogin && (
                        <div className="mt-2">
                          <div className="h-2 w-full bg-gray-200 rounded-full">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                passwordStrength <= 25
                                  ? "bg-red-500"
                                  : passwordStrength <= 50
                                  ? "bg-orange-500"
                                  : passwordStrength <= 75
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${passwordStrength}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Password strength: {passwordStrength}%
                          </p>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isLogin && (
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="student" id="student" />
                              <label htmlFor="student">Student</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="lecturer" id="lecturer" />
                              <label htmlFor="lecturer">Lecturer</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="admin" id="admin" />
                              <label htmlFor="admin">Admin</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="submit"
                  className="w-full bg-[#1A1F2C] hover:bg-[#2A2F3C] text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait...
                    </>
                  ) : isLogin ? (
                    "Sign in"
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-[#6E59A5] hover:text-[#7E69AB]"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;