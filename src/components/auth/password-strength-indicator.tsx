import { validatePasswordStrength } from '@/utils/passwordUtils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  // Calculate password strength (0-100)
  const calculateStrength = (password: string): number => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length contribution (up to 25%)
    const lengthContribution = Math.min(25, Math.floor(password.length * 2.5));
    strength += lengthContribution;
    
    // Character variety contribution
    if (/[A-Z]/.test(password)) strength += 15; // uppercase
    if (/[a-z]/.test(password)) strength += 15; // lowercase
    if (/[0-9]/.test(password)) strength += 15; // numbers
    if (/[^A-Za-z0-9]/.test(password)) strength += 15; // special chars
    
    // Cap at 100
    return Math.min(100, strength);
  };
  
  const strength = calculateStrength(password);
  
  // Determine strength text
  const strengthText = 
    strength <= 25 ? "Weak" :
    strength <= 50 ? "Fair" :
    strength <= 75 ? "Good" :
    "Strong";
    
  // Determine color class
  const colorClass = 
    strength <= 25 ? "bg-red-500" :
    strength <= 50 ? "bg-amber-500" :
    strength <= 75 ? "bg-yellow-500" :
    "bg-green-500";
    
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${strength}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-muted-foreground">
          {strengthText}
        </p>
        <p className="text-xs text-muted-foreground">
          {strength}%
        </p>
      </div>
    </div>
  );
} 