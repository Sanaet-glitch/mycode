import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

import { validatePasswordStrength } from '../../utils/passwordUtils';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthIndicator } from './password-strength-indicator';

// Password reset form schema
const resetPasswordSchema = z
  .object({
    password: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      const { valid } = validatePasswordStrength(data.password);
      return valid;
    },
    {
      message: 'Password does not meet complexity requirements',
      path: ['password'],
    }
  );

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  // Form definition
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Get the token from the URL
  const token = searchParams.get('token');

  // Handle form submission
  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) {
      setError('Reset token is missing. Please request a new password reset link.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Update the user's password using the reset token
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        values.password,
        { redirectTo: window.location.origin + '/login' }
      );

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
      form.reset();
      
      toast({
        title: "Password reset successful",
        description: "Your password has been reset. You can now log in with your new password.",
        variant: "success",
      });
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to reset password. Please try again or request a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Create a new password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert variant="success">
                  <AlertDescription>
                    Your password has been reset successfully. You will be redirected to the login page.
                  </AlertDescription>
                </Alert>
              )}

              {!token && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Invalid or expired reset link. Please request a new password reset.
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your new password"
                          autoComplete="new-password"
                          disabled={!token || success}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={!token || success}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                    </FormControl>
                    <PasswordStrengthIndicator password={field.value} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your new password"
                          autoComplete="new-password"
                          disabled={!token || success}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={!token || success}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !token || success}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </Button>

              <div className="text-center">
                <Button 
                  variant="link" 
                  className="text-sm" 
                  onClick={() => navigate('/login')}
                >
                  Back to Login
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground">
            <strong>Password requirements:</strong>
            <ul className="list-disc list-inside mt-1">
              <li>At least 8 characters long</li>
              <li>Include at least one uppercase letter</li>
              <li>Include at least one lowercase letter</li>
              <li>Include at least one number</li>
              <li>Include at least one special character</li>
            </ul>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 