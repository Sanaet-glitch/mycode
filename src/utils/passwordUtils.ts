// Password policy configuration
const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: "!@#$%^&*()_-+=<>?"
};

/**
 * Generates a simple random password with required complexity
 * @param length The length of the password to generate (default: 10)
 * @returns A random password
 */
export function generatePassword(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=';
  let password = '';
  
  // Ensure password has at least 1 uppercase, 1 lowercase, 1 number and 1 special char
  password += getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  password += getRandomChar('abcdefghijklmnopqrstuvwxyz');
  password += getRandomChar('0123456789');
  password += getRandomChar('!@#$%^&*()_-+=');
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += getRandomChar(chars);
  }
  
  // Shuffle the characters to avoid predictable patterns
  return shuffleString(password);
}

/**
 * Gets a random character from the given string
 * @param chars The string of characters to choose from
 * @returns A single random character
 */
function getRandomChar(chars: string): string {
  return chars.charAt(Math.floor(Math.random() * chars.length));
}

/**
 * Shuffles the characters in a string
 * @param str The string to shuffle
 * @returns The shuffled string
 */
function shuffleString(str: string): string {
  const array = str.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join('');
}

/**
 * Validates if a password meets minimum security requirements
 * @param password The password to validate
 * @returns Whether the password is valid and any error message
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_\-+=]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
}

// Check password strength (returns a percentage from 0-100)
export function checkPasswordStrength(password: string): number {
  if (!password) return 0;
  
  let score = 0;
  const maxScore = 100;
  
  // Length check - up to 40 points
  const lengthScore = Math.min(40, (password.length / 12) * 40);
  score += lengthScore;
  
  // Complexity checks - up to 60 points
  if (/[A-Z]/.test(password)) score += 10; // Uppercase
  if (/[a-z]/.test(password)) score += 10; // Lowercase
  if (/[0-9]/.test(password)) score += 10; // Numbers
  if (new RegExp(`[${PASSWORD_POLICY.specialChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]`).test(password)) score += 15; // Special chars
  
  // Variety check
  const uniqueChars = new Set(password).size;
  const varietyScore = Math.min(15, (uniqueChars / 8) * 15);
  score += varietyScore;
  
  return Math.round(Math.min(100, score));
}

/**
 * Checks if a password meets our strength requirements
 * @param password The password to validate
 * @returns An object with a boolean valid flag and any validation messages
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_\-+=[\]{};:'",<.>/?\\|]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
}

// Check if a password meets the requirements
export function isPasswordValid(password: string): { valid: boolean; message: string } {
  if (!password) {
    return { valid: false, message: "Password is required" };
  }
  
  if (password.length < PASSWORD_POLICY.minLength) {
    return { 
      valid: false, 
      message: `Password must be at least ${PASSWORD_POLICY.minLength} characters long` 
    };
  }
  
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  
  if (PASSWORD_POLICY.requireNumbers && !/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  
  if (PASSWORD_POLICY.requireSpecialChars && 
      !new RegExp(`[${PASSWORD_POLICY.specialChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]`).test(password)) {
    return { 
      valid: false, 
      message: `Password must contain at least one special character (${PASSWORD_POLICY.specialChars})` 
    };
  }
  
  return { valid: true, message: "Password meets all requirements" };
}

// Get password requirements as an array of strings (for displaying to users)
export function getPasswordRequirements(): string[] {
  const requirements = [
    `At least ${PASSWORD_POLICY.minLength} characters long`
  ];
  
  if (PASSWORD_POLICY.requireUppercase) {
    requirements.push("At least one uppercase letter");
  }
  
  if (PASSWORD_POLICY.requireLowercase) {
    requirements.push("At least one lowercase letter");
  }
  
  if (PASSWORD_POLICY.requireNumbers) {
    requirements.push("At least one number");
  }
  
  if (PASSWORD_POLICY.requireSpecialChars) {
    requirements.push(`At least one special character (${PASSWORD_POLICY.specialChars})`);
  }
  
  return requirements;
} 