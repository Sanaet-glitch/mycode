// QR code generator utility for attendance

/**
 * Generates an attendance token with session ID and expiry timestamp
 * @param sessionId The class session ID
 * @param expiryMinutes How many minutes the token should be valid for
 * @returns Encoded token string
 */
export const generateAttendanceToken = (sessionId: string, expiryMinutes = 5): string => {
  // Create expiry timestamp (current time + expiryMinutes)
  const expiryTimestamp = new Date(Date.now() + expiryMinutes * 60 * 1000).getTime();
  
  // Create the token object
  const tokenData = {
    sid: sessionId,
    exp: expiryTimestamp,
    nonce: Math.random().toString(36).substring(2, 15),
  };
  
  // Encode as JSON and then Base64
  return btoa(JSON.stringify(tokenData));
};

/**
 * Validates an attendance token
 * @param token The token to validate
 * @returns Object containing the sessionId and whether the token is valid
 */
export const validateAttendanceToken = (token: string): { 
  valid: boolean; 
  sessionId?: string;
  expired?: boolean;
} => {
  try {
    // Decode token
    const tokenData = JSON.parse(atob(token));
    
    // Check if token has expired
    if (tokenData.exp < Date.now()) {
      return { valid: false, expired: true };
    }
    
    // Token is valid
    return { valid: true, sessionId: tokenData.sid };
  } catch (error) {
    console.error('Error validating token:', error);
    return { valid: false };
  }
};

/**
 * Generates a full attendance URL that can be turned into a QR code
 * @param sessionId The class session ID
 * @param expiryMinutes How many minutes the URL should be valid for
 * @returns Complete attendance URL
 */
export const generateAttendanceUrl = (sessionId: string, expiryMinutes = 5): string => {
  const token = generateAttendanceToken(sessionId, expiryMinutes);
  const baseUrl = window.location.origin;
  return `${baseUrl}/attendance?token=${encodeURIComponent(token)}`;
}; 