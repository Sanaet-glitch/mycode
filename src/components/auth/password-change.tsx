import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { validatePassword } from '../../utils/passwordUtils';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthIndicator } from './password-strength-indicator';

export function PasswordChange({ userId, onSuccess }: { userId: string; onSuccess?: () => void }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.valid) {
      setError(validation.message || 'Password does not meet requirements');
      return;
    }

    setLoading(true);

    try {
      // Update the user's password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: password,
      });

      if (passwordError) throw passwordError;

      // Mark the user as no longer needing to change their password
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          force_password_change: false,
          last_password_change: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Clear form
      setPassword('');
      setConfirmPassword('');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while changing your password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            <PasswordStrengthIndicator password={password} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </form>
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
  );
} 